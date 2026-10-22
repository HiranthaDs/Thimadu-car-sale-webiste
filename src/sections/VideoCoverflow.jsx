import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components';
import { getStoryThumbnail, getVideoPreviewUrl, imageCandidates } from '../pages/ReviewsPage';
import './video-coverflow.css';

const PREVIEW_SECONDS = 20;
const SETTLE_MS = 160;

function previewSource(story) {
  const source = story.previewUrl || story.videoUrl;
  if (/\.(?:mp4|webm|ogg|m4v)$/i.test(new URL(source).pathname)) return { kind: 'video', src: source };
  const embed = getVideoPreviewUrl(source);
  if (!embed) return { kind: 'unsupported', src: '' };
  const url = new URL(embed);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('mute', '1');
  url.searchParams.set('muted', '1');
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('controls', '0');
  if (url.hostname.includes('youtube')) url.searchParams.set('end', String(PREVIEW_SECONDS));
  if (url.hostname.includes('vimeo')) url.searchParams.set('background', '1');
  return { kind: 'embed', src: url.href };
}

export default function VideoCoverflow({ stories }) {
  const railRef = useRef(null);
  const dialogRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRef = useRef(null);
  const settleTimer = useRef(0);
  const previewTimer = useRef(0);
  const pointer = useRef(null);
  const suppressClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [settled, setSettled] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [previewState, setPreviewState] = useState('idle');
  const [previewStarted, setPreviewStarted] = useState(false);
  const [openStory, setOpenStory] = useState(null);
  const [warmedIndexes, setWarmedIndexes] = useState(() => new Set());
  const [scrollBounds, setScrollBounds] = useState({ previous: false, next: stories.length > 1 });

  const slides = useMemo(() => stories.map(story => {
    const thumbnail = getStoryThumbnail(story);
    return {
      story,
      preview: previewSource(story),
      poster: imageCandidates(thumbnail, 720)[0] || thumbnail || '',
    };
  }), [stories]);

  const findCenteredIndex = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 0;
    if (rail.scrollLeft <= 2) return 0;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let distance = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const current = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (current < distance) { distance = current; closest = index; }
    });
    return closest;
  }, []);

  const settle = useCallback(() => {
    const rail = railRef.current;
    if (rail) setScrollBounds({ previous: rail.scrollLeft > 2, next: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2 });
    window.clearTimeout(settleTimer.current);
    setSettled(false);
    settleTimer.current = window.setTimeout(() => {
      setActiveIndex(findCenteredIndex());
      setSettled(true);
    }, SETTLE_MS);
  }, [findCenteredIndex]);

  const scrollToIndex = useCallback(index => {
    const rail = railRef.current;
    const card = cardRefs.current[index];
    if (!rail || !card) return;
    const left = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
    rail.scrollTo({ left, behavior: reducedMotion ? 'instant' : 'smooth' });
    settle();
  }, [reducedMotion, settle]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .15), { threshold: [0, .15] });
    observer.observe(rail);
    const resize = new ResizeObserver(() => settle());
    resize.observe(rail);
    settle();
    return () => { observer.disconnect(); resize.disconnect(); window.clearTimeout(settleTimer.current); };
  }, [settle]);

  useEffect(() => {
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    preference.addEventListener?.('change', motion);
    return () => { document.removeEventListener('visibilitychange', visibility); preference.removeEventListener?.('change', motion); };
  }, []);

  useEffect(() => {
    if (!inView) return;
    setWarmedIndexes(current => {
      const next = new Set(current);
      for (let index = 0; index < Math.min(3, slides.length); index += 1) next.add(index);
      for (let index = activeIndex; index < Math.min(activeIndex + 3, slides.length); index += 1) next.add(index);
      return next.size === current.size ? current : next;
    });
  }, [activeIndex, inView, slides.length]);

  useEffect(() => {
    window.clearTimeout(previewTimer.current);
    videoRef.current?.pause();
    setPreviewStarted(false);
    if (!settled || !inView || !pageVisible || reducedMotion) {
      setPreviewState('idle');
      return;
    }
    setPreviewState(slides[activeIndex]?.preview.kind === 'unsupported' ? 'unavailable' : 'loading');
    return () => {
      window.clearTimeout(previewTimer.current);
      videoRef.current?.pause();
    };
  }, [activeIndex, settled, inView, pageVisible, reducedMotion, slides]);

  const beginPreview = useCallback(() => {
    setPreviewStarted(true);
    setPreviewState('playing');
    window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      videoRef.current?.pause();
      setPreviewState('complete');
    }, PREVIEW_SECONDS * 1000);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(settleTimer.current);
    window.clearTimeout(previewTimer.current);
    videoRef.current?.pause();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !openStory) return;
    dialog.showModal();
    videoRef.current?.pause();
    window.clearTimeout(previewTimer.current);
    return () => { if (dialog.open) dialog.close(); };
  }, [openStory]);

  const openFull = story => {
    if (suppressClick.current) return;
    setOpenStory(story);
  };

  const onPointerDown = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    pointer.current = { x: event.clientX, scrollLeft: railRef.current.scrollLeft };
    suppressClick.current = false;
    railRef.current.classList.add('is-dragging');
  };
  const onPointerMove = event => {
    if (!pointer.current) return;
    const distance = event.clientX - pointer.current.x;
    if (Math.abs(distance) > 5) suppressClick.current = true;
    if (suppressClick.current) {
      railRef.current.scrollLeft = pointer.current.scrollLeft - distance;
      event.preventDefault();
    }
  };
  const onPointerUp = () => {
    pointer.current = null;
    railRef.current?.classList.remove('is-dragging');
    if (suppressClick.current) window.setTimeout(() => { suppressClick.current = false; }, 100);
  };
  const onKeyDown = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollToIndex(Math.max(0, Math.min(slides.length - 1, activeIndex + (event.key === 'ArrowRight' ? 1 : -1))));
  };

  if (!slides.length) return <p className="delivery-empty">Customer video stories will appear here when published.</p>;
  const preloads = [...warmedIndexes].filter(index => index > activeIndex && index < activeIndex + 3 && slides[index]?.preview.kind === 'video');

  return <div className="reels-gallery">
    <div className="reels-preloads" aria-hidden="true">
      {preloads.map(index => <video key={slides[index].story.key || index} src={slides[index].preview.src} preload="metadata" muted playsInline />)}
    </div>
    <div className="reels-viewport">
      <div className="reels-rail" ref={railRef} role="region" aria-label="Customer video stories. Swipe, drag, or use the arrow keys to browse." tabIndex={0} onScroll={settle} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}>
        {slides.map(({ story, preview, poster }, index) => {
          const active = index === activeIndex;
          const showPlayer = !openStory && active && settled && inView && pageVisible && (previewState === 'loading' || previewState === 'playing');
          return <article className={`reels-card${active ? ' is-active' : ''}`} key={story.key || story.id || story.videoUrl} ref={node => { cardRefs.current[index] = node; }} aria-current={active ? 'true' : undefined}>
            <div className="reels-media">
              {poster && <img className="reels-poster" src={poster} alt="" loading={index < 3 ? 'eager' : 'lazy'} />}
              {showPlayer && preview.kind === 'video' && <video key={index} className="reels-player" ref={videoRef} src={preview.src} poster={poster || undefined} muted playsInline autoPlay preload="auto" onLoadedData={event => { event.currentTarget.currentTime = 0; event.currentTarget.play().catch(() => setPreviewState('blocked')); }} onPlay={beginPreview} onTimeUpdate={event => { if (event.currentTarget.currentTime >= PREVIEW_SECONDS) { event.currentTarget.pause(); setPreviewState('complete'); } }} onEnded={() => setPreviewState('complete')} onError={() => setPreviewState('unavailable')} />}
              {showPlayer && preview.kind === 'embed' && <iframe className={`reels-player${previewStarted ? '' : ' is-loading'}`} src={preview.src} title={`${story.title} preview`} allow="autoplay; encrypted-media; picture-in-picture" loading="lazy" referrerPolicy="no-referrer" onLoad={beginPreview} onError={() => setPreviewState('unavailable')} />}
              <div className="reels-shade" aria-hidden="true" />
              <span className="reels-play-icon" aria-hidden="true"><Icon name="play" /></span>
              <div className="reels-details"><span className="reels-category">{story.platform || 'CUSTOMER STORY'}</span><h3>{story.title}</h3>{story.description && <p>{story.description}</p>}</div>
              {active && (previewState === 'complete' || previewState === 'unavailable' || previewState === 'blocked') && <span className="reels-watch-prompt">Watch full video <Icon name="arrow-up" size={15} /></span>}
              {active && previewState === 'playing' && <span className="reels-progress" aria-label="20 second preview progress"><i /></span>}
              <button type="button" className="reels-open" aria-label={`Watch full video: ${story.title}`} onClick={() => openFull(story)} />
            </div>
          </article>;
        })}
      </div>
      <button type="button" className="reels-arrow reels-arrow-prev" aria-label="Previous customer video" disabled={!scrollBounds.previous} onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}><Icon name="arrow" /></button>
      <button type="button" className="reels-arrow reels-arrow-next" aria-label="Next customer video" disabled={!scrollBounds.next} onClick={() => scrollToIndex(Math.min(slides.length - 1, activeIndex + 1))}><Icon name="arrow" /></button>
    </div>
    {openStory && <dialog ref={dialogRef} className="reels-dialog" aria-label={`Watch full video: ${openStory.title}`} onClose={() => setOpenStory(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="reels-dialog-inner">
        <button type="button" className="reels-dialog-close" aria-label="Close video" onClick={() => dialogRef.current?.close()}><Icon name="close" /></button>
        {/\.(?:mp4|webm|ogg|m4v)$/i.test(new URL(openStory.videoUrl).pathname)
          ? <video src={openStory.videoUrl} poster={getStoryThumbnail(openStory) || undefined} controls autoPlay playsInline preload="metadata" />
          : getVideoPreviewUrl(openStory.videoUrl)
            ? <iframe src={getVideoPreviewUrl(openStory.videoUrl)} title={openStory.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            : <p>This video is available at <a href={openStory.videoUrl} target="_blank" rel="noopener noreferrer">its original source</a>.</p>}
        <h3>{openStory.title}</h3>
      </div>
    </dialog>}
  </div>;
}
