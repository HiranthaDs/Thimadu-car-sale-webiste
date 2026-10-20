import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components';
import { getStoryThumbnail, getVideoPreviewUrl, imageCandidates } from '../pages/ReviewsPage';
import './video-coverflow.css';

const PREVIEW_MS = 20_000;
const TRANSITION_MS = 560;

function previewSource(story) {
  const direct = /\.(?:mp4|webm|ogg|m4v)$/i.test(new URL(story.videoUrl).pathname);
  if (direct) return { kind: 'video', src: story.videoUrl };
  const src = getVideoPreviewUrl(story.videoUrl);
  if (!src) return { kind: 'unsupported', src: '' };
  const url = new URL(src);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('mute', '1');
  url.searchParams.set('muted', '1');
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('controls', '0');
  return { kind: 'embed', src: url.href };
}

export default function VideoCoverflow({ stories }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [previewState, setPreviewState] = useState('idle');
  const [stageWidth, setStageWidth] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const moveTimer = useRef(0);
  const stopTimer = useRef(0);
  const pointer = useRef(null);
  const dragged = useRef(false);

  const slides = useMemo(() => stories.map(story => ({
    story,
    preview: previewSource(story),
    poster: imageCandidates(getStoryThumbnail(story), 1100)[0] || getStoryThumbnail(story) || '',
  })), [stories]);
  const active = slides[activeIndex];

  const clearPlayback = useCallback(() => {
    window.clearTimeout(stopTimer.current);
    stopTimer.current = 0;
    const video = videoRef.current;
    if (video) {
      video.pause();
      try { video.currentTime = 0; } catch { /* The media may not have loaded yet. */ }
    }
    setPreviewState('idle');
  }, []);

  const moveTo = useCallback(next => {
    if (next < 0 || next >= slides.length || next === activeIndex) return;
    window.clearTimeout(moveTimer.current);
    clearPlayback();
    setMoving(true);
    setActiveIndex(next);
    moveTimer.current = window.setTimeout(() => setMoving(false), TRANSITION_MS);
  }, [activeIndex, clearPlayback, slides.length]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    setStageWidth(node.clientWidth);
    const resize = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width));
    resize.observe(node);
    const visibility = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .18), { threshold: [0, .18] });
    visibility.observe(node);
    return () => { resize.disconnect(); visibility.disconnect(); };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener?.('change', update);
    return () => preference.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!active || moving || !inView || !pageVisible || reducedMotion) {
      clearPlayback();
      return;
    }
    const startTimer = window.setTimeout(() => {
      setPreviewState(active.preview.kind === 'unsupported' ? 'unavailable' : 'playing');
      if (active.preview.kind !== 'unsupported') {
        stopTimer.current = window.setTimeout(() => {
          const currentVideo = videoRef.current;
          if (currentVideo) currentVideo.pause();
          setPreviewState('complete');
        }, PREVIEW_MS);
      }
    }, 0);
    return () => { window.clearTimeout(startTimer); window.clearTimeout(stopTimer.current); };
  }, [activeIndex, active, moving, inView, pageVisible, reducedMotion, clearPlayback]);

  useEffect(() => () => {
    window.clearTimeout(moveTimer.current);
    window.clearTimeout(stopTimer.current);
    videoRef.current?.pause();
  }, []);

  const openFull = story => {
    const url = story?.videoUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.video-coverflow-arrow')) return;
    pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragged.current = false;
    event.target.setPointerCapture?.(event.pointerId);
  };
  const onPointerUp = event => {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dragged.current = true;
      moveTo(activeIndex + (dx < 0 ? 1 : -1));
      window.setTimeout(() => { dragged.current = false; }, 120);
    }
  };
  const onKeyDown = event => {
    // Let focused controls handle their own keys (Enter/Space) without the
    // stage also interpreting arrow keys and advancing a second time.
    if (event.target !== event.currentTarget && event.target.closest?.('button')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); moveTo(activeIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveTo(activeIndex - 1); }
  };

  const stopStagePointer = event => event.stopPropagation();

  if (!slides.length) return <p className="delivery-empty">Customer video stories will appear here when published.</p>;
  const gap = Math.min(stageWidth * .31, 390);
  const activeStory = active?.story;
  const fullVideoUrl = activeStory?.videoUrl;

  return <div className="video-coverflow">
    <div className="video-coverflow-stage" ref={stageRef} role="region" aria-label="Customer video stories. Use arrow keys or swipe to browse." tabIndex={0} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointer.current = null; }}>
      {slides.map(({ story, preview, poster }, index) => {
        const offset = index - activeIndex;
        if (Math.abs(offset) > 2) return null;
        const distance = Math.abs(offset);
        const scale = distance === 0 ? 1 : distance === 1 ? .86 : .72;
        const translateX = offset * gap;
        const translateZ = distance === 0 ? 90 : distance === 1 ? -75 : -220;
        const rotateY = offset === 0 ? 0 : -Math.sign(offset) * (distance === 1 ? 13 : 20);
        const isActive = offset === 0;
        const isPlaying = isActive && previewState === 'playing' && inView && pageVisible && !moving;
        const cardStyle = {
          transform: `translate3d(calc(-50% + ${translateX}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
          zIndex: distance === 0 ? 10 : distance === 1 ? 4 : 5,
          opacity: distance === 2 ? .58 : 1,
        };
        return <article className={`video-coverflow-card${isActive ? ' is-active' : ''}`} style={cardStyle} key={story.key || story.id || story.videoUrl} aria-current={isActive ? 'true' : undefined}>
          <div className="video-coverflow-media">
            {poster && <img className="video-coverflow-poster" src={poster} alt="" loading={distance > 0 ? 'lazy' : 'eager'} />}
            {isPlaying && preview.kind === 'video' && <video ref={videoRef} src={preview.src} poster={poster || undefined} autoPlay muted playsInline preload="auto" aria-label={`${story.title} video preview`} onLoadedData={event => { const video = event.currentTarget; if (video.dataset.previewStarted) return; video.dataset.previewStarted = 'true'; video.currentTime = 0; video.play().catch(() => setPreviewState('blocked')); }} onTimeUpdate={event => { if (event.currentTarget.currentTime >= 20) { event.currentTarget.pause(); setPreviewState('complete'); } }} onEnded={() => setPreviewState('complete')} onError={() => setPreviewState('unavailable')} />}
            {isPlaying && preview.kind === 'embed' && <iframe src={preview.src} title={`${story.title} video preview`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="no-referrer" onError={() => setPreviewState('unavailable')} />}
            {isActive && <>
              <span className="video-coverflow-label">{previewState === 'playing' ? '20 SEC PREVIEW' : 'CUSTOMER STORY'}</span>
              {previewState === 'playing' && <span className="video-coverflow-progress" aria-hidden="true"><i /></span>}
              {previewState === 'complete' && <div className="video-coverflow-ended"><span className="video-coverflow-play"><Icon name="play" /></span><span>Watch full video</span></div>}
              {(previewState === 'unavailable' || previewState === 'blocked') && <div className="video-coverflow-ended"><span>Preview unavailable</span><span>Watch full video</span></div>}
              <button className="video-coverflow-hit" type="button" aria-label={previewState === 'playing' ? `Open full video: ${story.title}` : `Watch full video: ${story.title}`} onClick={() => { if (!dragged.current) openFull(story); }} />
            </>}
            {!isActive && <button className="video-coverflow-hit" type="button" aria-label={`Show ${story.title}`} onClick={() => moveTo(index)} />}
          </div>
          <div className="video-coverflow-copy"><span>{story.platform || 'VIDEO STORY'}</span><h4>{story.title}</h4>{story.description && <p>{story.description}</p>}</div>
        </article>;
      })}
      <button type="button" className="video-coverflow-arrow is-prev" aria-label="Previous customer video" disabled={activeIndex === 0} onPointerDown={stopStagePointer} onClick={() => moveTo(activeIndex - 1)}><Icon name="arrow" /></button>
      <button type="button" className="video-coverflow-arrow is-next" aria-label="Next customer video" disabled={activeIndex === slides.length - 1} onPointerDown={stopStagePointer} onClick={() => moveTo(activeIndex + 1)}><Icon name="arrow" /></button>
      <div className="video-coverflow-count" aria-live="polite"><span>{String(activeIndex + 1).padStart(2, '0')}</span><i />{String(slides.length).padStart(2, '0')}</div>
      <p className="video-coverflow-hint">DRAG OR SWIPE TO EXPLORE</p>
    </div>
    {fullVideoUrl && <p className="video-coverflow-caption">Preview plays muted for up to 20 seconds. Select the centered story to open the full video.</p>}
  </div>;
}
