import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components';
import { loadCustomerStories, loadVideoStories, StoryDialog } from '../pages/ReviewsPage';
import InfiniteMenu from '../components/infinite-menu/InfiniteMenu';
import VideoCoverflow from './VideoCoverflow';
import PhotoStoryRail from './PhotoStoryRail';
import './delivery-gallery.css';

const CUSTOMER_LOCATIONS = [
  { image: '/images/customer-flags/jordan-card.webp', title: 'Jordan', description: 'Our customers in Jordan' },
  { image: '/images/customer-flags/israel-card.webp', title: 'Israel', description: 'Our customers in Israel' },
  { image: '/images/customer-flags/dubai-card.webp', title: 'Dubai', description: 'United Arab Emirates' },
  { image: '/images/customer-flags/qatar-card.webp', title: 'Qatar', description: 'Our customers in Qatar' },
  { image: '/images/customer-flags/ajman-card.webp', title: 'Ajman', description: 'United Arab Emirates' },
  { image: '/images/customer-flags/italy-card.webp', title: 'Italy', description: 'Our customers in Italy' },
  { image: '/images/customer-flags/syria-card.webp', title: 'Syria', description: 'Our customers in Syria' },
  { image: '/images/customer-flags/oman-card.webp', title: 'Oman', description: 'Our customers in Oman' },
  { image: '/images/customer-flags/saudi-arabia-card.webp', title: 'Saudi Arabia', description: 'Our customers in Saudi Arabia' },
  { image: '/images/customer-flags/kuwait-card.webp', title: 'Kuwait', description: 'Our customers in Kuwait' },
];

function CustomerSphere() {
  const [holding, setHolding] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const query = matchMedia('(max-width: 700px)');
    const update = () => setCompact(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <div className="delivery-sphere-wrap">
    <div className="delivery-sphere-stage" aria-label="Customer locations flag sphere">
      <InfiniteMenu key={compact ? 'compact' : 'full'} items={CUSTOMER_LOCATIONS} count={compact ? 48 : 96} tileSize={0.72} roundness={0.18} zoom={holding ? 0.34 : 0.39} pullBack={0.2} stretch={0.5} inertia={0.6} autoplay={compact ? 0 : 4} grayscale={false} dim={0} intro={!compact} showInfo={false} theme="light" accentColor="#2563ff" backgroundColor="transparent" className="delivery-infinite-menu" onActiveChange={(_, index) => setActiveIndex(index)} onInteractionChange={setHolding} />
    </div>
    <div className="delivery-sphere-caption"><strong>{CUSTOMER_LOCATIONS[activeIndex]?.title}</strong><span>Drag to explore our customers</span></div>
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
    <div className="delivery-showcase-media"><CustomerSphere /></div>
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
        <header className="delivery-gallery-heading"><h2 id="delivery-gallery-title"><span>Our</span> <span>customers</span></h2></header>
        {(statuses.photo === 'error' || statuses.video === 'error') && <p className="delivery-notice" role="status">Some delivery moments could not be loaded. <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
        <MediaRow kind="photo" records={stories.photo.filter(story => story.imageUrl)} loading={statuses.photo === 'loading'} unavailable={statuses.photo === 'error'} onOpen={setSelected} />
      </div>
    </div>
    <div className="container delivery-video-content">
      <MediaRow kind="video" records={stories.video} loading={statuses.video === 'loading'} unavailable={statuses.video === 'error'} onOpen={setSelected} />
    </div>
    <div className="container delivery-photo-content">
      <div className="delivery-row delivery-row-photo-rail">
        <header className="delivery-reels-header">
          <div><p className="delivery-reels-eyebrow">03 / PHOTO COLLECTION</p><h3>Moments worth keeping.</h3><p className="delivery-reels-description">Customer handovers and journeys, captured one photo at a time.</p></div>
          <Link className="delivery-reels-view-all" to="/reviews.html?tab=photos">View all photos <Icon name="arrow-up" size={16} /></Link>
        </header>
        <div className="delivery-showcase-media">{statuses.photo === 'loading' ? <div className="delivery-sphere-loading" role="status" aria-label="Loading customer photos" /> : <PhotoStoryRail stories={stories.photo.filter(story => story.imageUrl)} onOpen={setSelected} />}</div>
      </div>
    </div>
    <StoryDialog story={selected} onClose={() => setSelected(null)} />
  </section>;
}
