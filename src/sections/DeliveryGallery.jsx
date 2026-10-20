import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components';
import { imageCandidates, loadStories, StoryCard, StoryDialog } from '../pages/ReviewsPage';
import InfiniteMenu from '../components/infinite-menu/InfiniteMenu';
import './delivery-gallery.css';

function CustomerSphere({ records, onOpen }) {
  const [focused, setFocused] = useState(0);
  const items = records.map(story => ({
    image: imageCandidates(story.imageUrl, 900)[0] || story.imageUrl,
    title: story.title,
    description: [story.customerName, story.location].filter(Boolean).join(' · ') || story.description,
  }));
  return <div className="delivery-sphere-wrap">
    <div className="delivery-sphere-stage">
      <InfiniteMenu items={items} count={96} tileSize={0.72} roundness={0.18} zoom={1.55} pullBack={1} stretch={0.5} inertia={0.6} autoplay={4} grayscale dim={0.28} intro showInfo theme="light" accentColor="#175cff" backgroundColor="transparent" className="delivery-infinite-menu" onActiveChange={(_, index) => setFocused(index)} onItemClick={(_, index) => onOpen(records[index])} />
    </div>
    <div className="delivery-sphere-caption" aria-live="polite">
      <span>HAPPY MOMENT {String(focused + 1).padStart(2, '0')}</span><p>{records[focused % records.length]?.title || 'Explore the moments that start a new chapter.'}</p>
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
    const update = () => setEdges({
      start: element.scrollLeft <= 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    });
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
  return <div className={`delivery-row delivery-row-${kind}`}>
    <div className="delivery-row-heading">
      <h3 id={`${id}-title`}><span>{kind === 'photo' ? '01 / THE PHOTO ALBUM' : '02 / THE VIDEO COLLECTION'}</span>{kind === 'photo' ? 'A moment worth keeping.' : 'Stories in motion.'}</h3>
      {kind === 'video' ? <div className="delivery-arrows">
        <button type="button" aria-label={`Previous ${label.toLowerCase()}`} aria-controls={id} disabled={edges.start} onClick={() => scroll(-1)}><Icon name="arrow" className="delivery-prev" /></button>
        <button type="button" aria-label={`Next ${label.toLowerCase()}`} aria-controls={id} disabled={edges.end} onClick={() => scroll(1)}><Icon name="arrow" /></button>
      </div> : <span className="delivery-photo-hint">DRAG TO EXPLORE</span>}
    </div>
    {kind === 'photo' ? loading ? <div className="delivery-sphere-loading" role="status">Gathering customer moments…</div> : records.length ? <CustomerSphere records={records} onOpen={onOpen} /> : <p className="delivery-empty">{unavailable ? `${label} are temporarily unavailable. Please try again.` : `New delivery ${label.toLowerCase()} will appear here when published.`}</p> : <div className="delivery-rail" id={id} ref={rail} tabIndex={0} role="region" aria-labelledby={`${id}-title`} aria-busy={loading}>
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
      {['photo', 'video'].map(kind => <MediaRow key={kind} kind={kind} records={result.records.filter(story => story.kind === kind && (kind === 'video' || story.imageUrl)).slice(0, 12)} loading={status === 'loading'} unavailable={status === 'error' || result.unavailable.includes(kind === 'photo' ? 'Customer photos' : 'Video stories')} onOpen={setSelected} />)}
    </div>
    <StoryDialog story={selected} onClose={() => setSelected(null)} />
  </section>;
}
