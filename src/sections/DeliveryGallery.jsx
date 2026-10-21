import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components';
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

function GalleryAbstractBackground() {
  return <div className="gallery-abstract-background" aria-hidden="true">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <radialGradient id="gallery-glow-top-right"><stop offset="0" stopColor="#438aff" stopOpacity=".52"/><stop offset=".5" stopColor="#83b8ff" stopOpacity=".25"/><stop offset="1" stopColor="#dceaff" stopOpacity="0"/></radialGradient>
        <radialGradient id="gallery-glow-bottom-left"><stop offset="0" stopColor="#83b8ff" stopOpacity=".42"/><stop offset=".56" stopColor="#b7d7ff" stopOpacity=".22"/><stop offset="1" stopColor="#eaf3ff" stopOpacity="0"/></radialGradient>
        <radialGradient id="gallery-glow-center"><stop offset="0" stopColor="#fff" stopOpacity=".98"/><stop offset=".72" stopColor="#f8fbff" stopOpacity=".78"/><stop offset="1" stopColor="#f8fbff" stopOpacity="0"/></radialGradient>
        <linearGradient id="gallery-orbit-fill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b7d7ff" stopOpacity=".17"/><stop offset="1" stopColor="#438aff" stopOpacity=".06"/></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#gallery-glow-center)"/>
      <ellipse cx="1530" cy="-30" rx="560" ry="480" fill="url(#gallery-glow-top-right)"/>
      <ellipse cx="-30" cy="950" rx="520" ry="420" fill="url(#gallery-glow-bottom-left)"/>
      <circle cx="1160" cy="365" r="465" fill="url(#gallery-orbit-fill)"/>
      <circle cx="1160" cy="365" r="465" fill="none" stroke="#fff" strokeOpacity=".36" strokeWidth="1.5"/>
      <circle cx="1160" cy="365" r="565" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1.25"/>
      <circle cx="1160" cy="365" r="665" fill="none" stroke="#fff" strokeOpacity=".19" strokeWidth="1"/>
      <circle cx="1530" cy="-30" r="310" fill="#83b8ff" fillOpacity=".09"/>
      <circle cx="1530" cy="-30" r="310" fill="none" stroke="#fff" strokeOpacity=".33" strokeWidth="1.5"/>
      <circle cx="1530" cy="-30" r="390" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.2"/>
      <circle cx="-30" cy="950" r="285" fill="#b7d7ff" fillOpacity=".12"/>
      <circle cx="-30" cy="950" r="285" fill="none" stroke="#fff" strokeOpacity=".38" strokeWidth="1.5"/>
      <circle cx="-30" cy="950" r="385" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1.2"/>
      <circle cx="1530" cy="940" r="390" fill="#83b8ff" fillOpacity=".07"/>
      <circle cx="1530" cy="940" r="390" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="1.25"/>
    </svg>
  </div>;
}

function MediaRow({ kind, records, loading, unavailable, onOpen }) {
  if (kind === 'video') return <div className="delivery-row delivery-row-video">
    <header className="delivery-reels-header">
      <div><p className="delivery-reels-eyebrow">02 / VIDEO COLLECTION</p><h3>Stories in motion.</h3><p className="delivery-reels-description">Real customers. Real journeys. Watch the moments that make every drive unforgettable.</p></div>
      <Link className="delivery-reels-view-all" to="/reviews.html?tab=videos">View all videos <Icon name="arrow-up" size={16} /></Link>
    </header>
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
    <div className="container delivery-sphere-backdrop">
      <GalleryAbstractBackground />
      <div className="delivery-sphere-content">
        <header className="delivery-gallery-heading"><h2 id="delivery-gallery-title"><span>Customer</span> <span>stories</span></h2></header>
        {(statuses.photo === 'error' || statuses.video === 'error') && <p className="delivery-notice" role="status">Some delivery moments could not be loaded. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
        <MediaRow kind="photo" records={stories.photo.filter(story => story.imageUrl)} loading={statuses.photo === 'loading'} unavailable={statuses.photo === 'error'} onOpen={setSelected} />
      </div>
    </div>
    <div className="container delivery-video-content">
      <MediaRow kind="video" records={stories.video} loading={statuses.video === 'loading'} unavailable={statuses.video === 'error'} onOpen={setSelected} />
    </div>
    <StoryDialog story={selected} onClose={() => setSelected(null)} />
  </section>;
}
