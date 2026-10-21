import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components';
import { imageCandidates } from '../pages/ReviewsPage';
import './video-coverflow.css';

function PhotoCardImage({ src, title, eager }) {
  const candidates = useMemo(() => imageCandidates(src, 900), [src]);
  const [candidate, setCandidate] = useState(0);
  useEffect(() => setCandidate(0), [src]);
  if (candidate >= Math.max(1, candidates.length)) return <span className="reels-photo-unavailable">Photo unavailable</span>;
  return <img className="reels-poster" src={candidates[candidate] || src} alt={title} loading={eager ? 'eager' : 'lazy'} onError={() => setCandidate(index => index + 1)} />;
}

export default function PhotoStoryRail({ stories, onOpen }) {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const settleTimer = useRef(0);
  const pointer = useRef(null);
  const suppressClick = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bounds, setBounds] = useState({ previous: false, next: stories.length > 1 });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setBounds({ previous: rail.scrollLeft > 2, next: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2 });
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    setActiveIndex(nearest);
  }, []);

  const onScroll = useCallback(() => {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(measure, 120);
  }, [measure]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const resize = new ResizeObserver(measure);
    resize.observe(rail);
    measure();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(preference.matches);
    preference.addEventListener?.('change', motion);
    return () => { resize.disconnect(); preference.removeEventListener?.('change', motion); window.clearTimeout(settleTimer.current); };
  }, [measure]);

  const scrollToIndex = index => {
    const rail = railRef.current;
    const card = cardRefs.current[index];
    if (!rail || !card) return;
    rail.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
  };
  const onKeyDown = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollToIndex(Math.max(0, Math.min(stories.length - 1, activeIndex + (event.key === 'ArrowRight' ? 1 : -1))));
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

  if (!stories.length) return <div className="delivery-empty" role="status">Customer photos will appear here when published.</div>;
  return <div className="reels-gallery reels-photo-gallery">
    <div className="reels-viewport">
      <div className="reels-rail" ref={railRef} role="region" aria-label="Customer photos. Swipe, drag, or use the arrow keys to browse." tabIndex={0} onScroll={onScroll} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}>
        {stories.map((story, index) => <article className="reels-card" key={story.key || story.id || story.imageUrl} ref={node => { cardRefs.current[index] = node; }}>
          <div className="reels-media">
            <PhotoCardImage src={story.imageUrl} title={story.title} eager={index < 3} />
            <div className="reels-shade" aria-hidden="true" />
            <div className="reels-details"><span className="reels-category">{[story.customerName, story.location].filter(Boolean).join(' · ') || 'CUSTOMER MOMENT'}</span><h3>{story.title}</h3>{story.description && <p>{story.description}</p>}</div>
            <button type="button" className="reels-open" aria-label={`View photo story: ${story.title}`} onClick={() => { if (!suppressClick.current) onOpen(story); }} />
          </div>
        </article>)}
      </div>
      <button type="button" className="reels-arrow reels-arrow-prev" aria-label="Previous customer photo" disabled={!bounds.previous} onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}><Icon name="arrow" /></button>
      <button type="button" className="reels-arrow reels-arrow-next" aria-label="Next customer photo" disabled={!bounds.next} onClick={() => scrollToIndex(Math.min(stories.length - 1, activeIndex + 1))}><Icon name="arrow" /></button>
    </div>
  </div>;
}
