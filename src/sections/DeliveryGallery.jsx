import { useEffect, useMemo, useState } from 'react';
import { imageCandidates, loadCustomerStories, loadVideoStories, StoryDialog } from '../pages/ReviewsPage';
import InfiniteMenu from '../components/infinite-menu/InfiniteMenu';
import VideoCoverflow from './VideoCoverflow';
import './delivery-gallery.css';

const SAMPLE_CUSTOMER_MOMENTS = [
  { key: 'sample-family-drive', kind: 'photo', imageUrl: '/images/conversation-couple.webp', title: 'A new chapter begins', description: 'A first drive together in a car that feels like home.', isSample: true },
  { key: 'sample-driver-ready', kind: 'photo', imageUrl: '/images/conversation-driver.webp', title: 'Ready for the road ahead', description: 'The confidence of finding the right vehicle.', isSample: true },
  { key: 'sample-coastal-journey', kind: 'photo', imageUrl: '/images/coastal-journey.webp', title: 'The journey is yours', description: 'New places and good memories, one drive at a time.', isSample: true },
  { key: 'sample-sri-lanka-drive', kind: 'photo', imageUrl: '/images/hero.webp', title: 'Made for your next journey', description: 'A little inspiration for your next chapter.', isSample: true },
];

function CustomerSphere({ records, onOpen }) {
  const [holding, setHolding] = useState(false);
  const items = useMemo(() => records.map(story => ({
    image: imageCandidates(story.imageUrl, 900)[0] || story.imageUrl,
    title: story.title,
    description: [[story.customerName, story.location].filter(Boolean).join(' · '), story.description].filter(Boolean).join('\n'),
  })), [records]);
  return <div className="delivery-sphere-stage" aria-label="Customer delivery photo sphere">
    <InfiniteMenu items={items} count={96} tileSize={0.72} roundness={0.18} zoom={holding ? 0.95 : 1.55} pullBack={1} stretch={0.5} inertia={0.6} autoplay={4} grayscale={false} dim={0} intro showInfo theme="light" accentColor="#2563ff" backgroundColor="transparent" className="delivery-infinite-menu" onItemClick={(_, index) => onOpen(records[index % records.length])} onInteractionChange={setHolding} />
  </div>;
}

function MediaRow({ kind, records, loading, unavailable, onOpen }) {
  if (kind === 'video') return <div className="delivery-row delivery-row-video">
    <div className="delivery-showcase-media">{loading ? <div className="delivery-video-loading" role="status" aria-label="Loading customer videos" /> : records.length ? <VideoCoverflow stories={records} /> : <div className="delivery-empty" role="status" aria-label={unavailable ? 'Customer videos are temporarily unavailable' : 'No customer videos have been published'} />}</div>
  </div>;

  return <div className="delivery-row delivery-row-photo">
    <div className="delivery-showcase-media">{loading ? <div className="delivery-sphere-loading" role="status" aria-label="Loading customer photos" /> : <CustomerSphere records={records.length ? records : SAMPLE_CUSTOMER_MOMENTS} onOpen={onOpen} />}</div>
  </div>;
}

export default function DeliveryGallery() {
  const [stories, setStories] = useState({ photo: [], video: [] });
  const [statuses, setStatuses] = useState({ photo: 'loading', video: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setStatuses({ photo: 'loading', video: 'loading' });
    loadCustomerStories(controller.signal).then(records => {
      if (!controller.signal.aborted) { setStories(current => ({ ...current, photo: records })); setStatuses(current => ({ ...current, photo: 'ready' })); }
    }).catch(() => { if (!controller.signal.aborted) setStatuses(current => ({ ...current, photo: 'error' })); });
    loadVideoStories(controller.signal).then(records => {
      if (!controller.signal.aborted) { setStories(current => ({ ...current, video: records })); setStatuses(current => ({ ...current, video: 'ready' })); }
    }).catch(() => { if (!controller.signal.aborted) setStatuses(current => ({ ...current, video: 'error' })); });
    return () => controller.abort();
  }, [attempt]);

  return <section className="delivery-gallery" id="delivery-gallery-content" aria-labelledby="delivery-gallery-title">
    <div className="container">
      <header className="delivery-gallery-heading"><h2 id="delivery-gallery-title"><span>Customer</span> <span>stories</span></h2></header>
      {(statuses.photo === 'error' || statuses.video === 'error') && <p className="delivery-notice" role="status">Some delivery moments could not be loaded. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
      {['photo', 'video'].map(kind => <MediaRow key={kind} kind={kind} records={stories[kind].filter(story => kind === 'video' || story.imageUrl)} loading={statuses[kind] === 'loading'} unavailable={statuses[kind] === 'error'} onOpen={setSelected} />)}
    </div>
    <StoryDialog story={selected} onClose={() => setSelected(null)} />
  </section>;
}
