import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components';
import { imageCandidates, loadStories, StoryCard, StoryDialog } from '../pages/ReviewsPage';
import InfiniteMenu from '../components/infinite-menu/InfiniteMenu';
import VideoCoverflow from './VideoCoverflow';
import './delivery-gallery.css';

// Local illustrative imagery keeps the sphere populated until real stories are published.
const SAMPLE_CUSTOMER_MOMENTS = [
  { key: 'sample-family-drive', kind: 'photo', imageUrl: '/images/conversation-couple.webp', title: 'A new chapter begins', description: 'A first drive together in a car that feels like home.', isSample: true },
  { key: 'sample-driver-ready', kind: 'photo', imageUrl: '/images/conversation-driver.webp', title: 'Ready for the road ahead', description: 'The confidence of finding the right vehicle.', isSample: true },
  { key: 'sample-coastal-journey', kind: 'photo', imageUrl: '/images/coastal-journey.webp', title: 'The journey is yours', description: 'New places and good memories, one drive at a time.', isSample: true },
  { key: 'sample-sri-lanka-drive', kind: 'photo', imageUrl: '/images/hero.webp', title: 'Made for your next journey', description: 'A little inspiration for your next chapter.', isSample: true },
];

function CustomerSphere({ records, onOpen }) {
  const [focused, setFocused] = useState(0);
  const [holding, setHolding] = useState(false);
  const items = useMemo(() => records.map(story => ({
    image: imageCandidates(story.imageUrl, 900)[0] || story.imageUrl,
    title: story.title,
    description: [story.customerName, story.location].filter(Boolean).join(' · ') || story.description,
  })), [records]);
  return <div className="delivery-sphere-wrap">
    <div className="delivery-sphere-stage">
      <InfiniteMenu items={items} count={96} tileSize={0.72} roundness={0.18} zoom={holding ? 0.95 : 1.55} pullBack={1} stretch={0.5} inertia={0.6} autoplay={4} grayscale={false} dim={0} intro showInfo theme="light" accentColor="#175cff" backgroundColor="transparent" className="delivery-infinite-menu" onActiveChange={(_, index) => setFocused(index)} onItemClick={(_, index) => onOpen(records[index])} onInteractionChange={setHolding} />
    </div>
    <div className="delivery-sphere-caption" aria-live="polite">
      <span>{records[focused % records.length]?.isSample ? 'SAMPLE CUSTOMER MOMENT' : `HAPPY MOMENT ${String(focused + 1).padStart(2, '0')}`}</span><p>{records[focused % records.length]?.title || 'Explore the moments that start a new chapter.'}</p>
    </div>
  </div>;
}
function MediaRow({ kind, records, loading, unavailable, onOpen }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const label = kind === 'photo' ? 'Photos' : 'Videos';
  const id = `delivery-${kind}-rail`;
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      setEdges({
        start: element.scrollLeft <= 2,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
      if (kind === 'video') {
        const center = element.getBoundingClientRect().left + element.clientWidth / 2;
        element.querySelectorAll('.story-card').forEach(card => {
          const bounds = card.getBoundingClientRect();
          const offset = (bounds.left + bounds.width / 2 - center) / Math.max(bounds.width, 1);
          const curve = Math.min(Math.abs(offset), 1.35);
          card.style.setProperty('--curve-y', `${Math.round(curve * curve * 42)}px`);
          card.style.setProperty('--curve-rotate', `${Math.max(-11, Math.min(11, -offset * 8))}deg`);
          card.style.setProperty('--curve-scale', `${1 - curve * 0.055}`);
        });
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener('scroll', update); };
  }, [records.length, loading]);
  const scroll = direction => rail.current.scrollBy({
    left: direction * rail.current.clientWidth * .85,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
  if (kind === 'video') return <div className={`delivery-row delivery-row-${kind}`}>
    <div className="delivery-row-heading">
      <h3 id={`${id}-title`}><span>02 / THE VIDEO COLLECTION</span>Stories in motion.</h3>
      <span className="delivery-video-hint">DRAG OR SCROLL</span>
    </div>
    {loading ? <div className="delivery-video-loading" role="status">Gathering customer videos…</div> : records.length ? <VideoCoverflow stories={records} /> : <p className="delivery-empty">{unavailable ? `${label} are temporarily unavailable. Please try again.` : `New delivery ${label.toLowerCase()} will appear here when published.`}</p>}
    <Link className="delivery-view-all" to="/reviews.html?tab=videos">View all videos <Icon name="arrow-up" size={16} /></Link>
  </div>;
  return <div className={`delivery-row delivery-row-${kind}`}>
    <div className="delivery-row-heading">
      <h3 id={`${id}-title`}><span>{kind === 'photo' ? '01 / THE PHOTO ALBUM' : '02 / THE VIDEO COLLECTION'}</span>{kind === 'photo' ? 'A moment worth keeping.' : 'Stories in motion.'}</h3>
      {kind === 'video' ? <div className="delivery-arrows"><span className="delivery-video-hint">DRAG OR SCROLL</span>
        <button type="button" aria-label={`Previous ${label.toLowerCase()}`} aria-controls={id} disabled={edges.start} onClick={() => scroll(-1)}><Icon name="arrow" className="delivery-prev" /></button>
        <button type="button" aria-label={`Next ${label.toLowerCase()}`} aria-controls={id} disabled={edges.end} onClick={() => scroll(1)}><Icon name="arrow" /></button>
      </div> : <span className="delivery-photo-hint">DRAG TO EXPLORE</span>}
    </div>
    {kind === 'photo' ? <>{!records.length && <p className="delivery-sample-note">Illustrative sample photos · owner-published customer stories will appear here</p>}<CustomerSphere records={records.length ? records : SAMPLE_CUSTOMER_MOMENTS} onOpen={story => { if (!story.isSample) onOpen(story); }} /></> : <div className="delivery-rail" id={id} ref={rail} tabIndex={0} role="region" aria-labelledby={`${id}-title`} aria-busy={loading}>
      {loading ? Array.from({ length: 3 }, (_, index) => <div className="story-skeleton" key={index} aria-hidden="true"><div /><span /><span /></div>)
        : records.map(story => <StoryCard key={story.key} story={story} onOpen={onOpen} autoPreview />)}
      {!loading && !records.length && <p className="delivery-empty">{unavailable ? `${label} are temporarily unavailable. Please try again.` : `New delivery ${label.toLowerCase()} will appear here when published.`}</p>}
    </div>}
    <Link className="delivery-view-all" to={`/reviews.html?tab=${kind === 'photo' ? 'photos' : 'videos'}`}>View all {label.toLowerCase()} <Icon name="arrow-up" size={16} /></Link>
  </div>;
}

export default function DeliveryGallery() {
  const [result, setResult] = useState({ records: [], unavailable: [] });
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    loadStories(controller.signal, { withStatus: true }).then(data => {
      if (!controller.signal.aborted) { setResult(data); setStatus('ready'); }
    }).catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt]);
  return <section className="delivery-gallery" id="delivery-gallery-content" aria-labelledby="delivery-gallery-title">
    <div className="container">
      <div className="delivery-heading">
        <div><p className="eyebrow">THE THIMADU COMMUNITY</p><h2 id="delivery-gallery-title">New keys.<br /><span>Unforgettable moments.</span></h2></div>
        <p>The first smile. The handover. The road ahead.<br />Explore the moments that start a new chapter.</p>
      </div>
      {(status === 'error' || result.unavailable.length > 0) && <p className="delivery-notice" role="status">Some delivery moments couldn’t be loaded. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
      {['photo', 'video'].map(kind => <MediaRow key={kind} kind={kind} records={result.records.filter(story => story.kind === kind && (kind === 'video' || story.imageUrl)).slice(0, kind === 'photo' ? 36 : 12)} loading={status === 'loading'} unavailable={status === 'error' || result.unavailable.includes(kind === 'photo' ? 'Customer photos' : 'Video stories')} onOpen={setSelected} />)}
    </div>
    <StoryDialog story={selected} onClose={() => setSelected(null)} />
  </section>;
}
