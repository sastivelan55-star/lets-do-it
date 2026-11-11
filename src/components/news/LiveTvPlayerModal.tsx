import { useState } from 'react';
import { Tv, Play, X, ExternalLink, Radio } from 'lucide-react';

export interface LiveChannel {
  id: string;
  name: string;
  category: string;
  country: string;
  channelId: string;
  flag: string;
  color: string;
  description: string;
  thumbnail: string;
}

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'ndtv',
    name: 'NDTV 24x7',
    category: 'National / India',
    country: 'India',
    channelId: 'UCMrhCLg8T5uO2zD0rK8WnDA',
    flag: '🇮🇳',
    color: '#ef4444',
    description: 'Premier 24/7 English news broadcast from New Delhi.',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'wion',
    name: 'WION',
    category: 'World Is One News',
    country: 'India / Global',
    channelId: 'UC_gUM8rL-Lrg6O3adPW9K1g',
    flag: '🇮🇳',
    color: '#f59e0b',
    description: 'Global news from an Indian perspective and international affairs.',
    thumbnail: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    category: 'World / Middle East',
    country: 'Qatar / Global',
    channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg',
    flag: '🇶🇦',
    color: '#38bdf8',
    description: 'Global news network with deep investigative coverage.',
    thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'skynews',
    name: 'Sky News',
    category: 'World / UK',
    country: 'United Kingdom',
    channelId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    flag: '🇬🇧',
    color: '#a855f7',
    description: 'Breaking news and analysis from London and worldwide bureaux.',
    thumbnail: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'dw',
    name: 'DW News',
    category: 'World / Europe',
    country: 'Germany',
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg',
    flag: '🇩🇪',
    color: '#10b981',
    description: 'Germany’s international broadcaster with in-depth European reports.',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'france24',
    name: 'France 24 English',
    category: 'World / Europe',
    country: 'France',
    channelId: 'UC-2KSeUU5SMCX6XLRD-AEvw',
    flag: '🇫🇷',
    color: '#06b6d4',
    description: 'International news round-the-clock from Paris.',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
  },
];

interface LiveTvSectionProps {
  onClose?: () => void;
}

export default function LiveTvSection({ onClose }: LiveTvSectionProps) {
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleSelectChannel = (ch: LiveChannel) => {
    setSelectedChannel(ch);
    // Auto start playing new channel when switched
    setIsPlaying(true);
  };

  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${selectedChannel.channelId}&autoplay=1`;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 16, 26, 0.9) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        padding: '1.25rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <Tv size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Live TV Intelligence Hub
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Radio size={10} className="animate-pulse" /> LIVE 24/7
              </span>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
              Official uninterrupted satellite broadcasts from India, UK, Middle East & Europe
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Channel Switcher Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          scrollbarWidth: 'none',
        }}
      >
        {LIVE_CHANNELS.map((ch) => {
          const isSelected = selectedChannel.id === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSelectChannel(ch)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#ffffff' : '#cbd5e1',
                boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            >
              <span>{ch.flag}</span>
              <span>{ch.name}</span>
            </button>
          );
        })}
      </div>

      {/* Video Player / Lazy-loaded Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', // 16:9 Aspect Ratio
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#070b14',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={`${selectedChannel.name} Live Stream`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `linear-gradient(180deg, rgba(11, 15, 25, 0.4) 0%, rgba(11, 15, 25, 0.95) 100%), url(${selectedChannel.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Play Button Pulsing Glow */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)',
                color: '#ffffff',
                marginBottom: '1rem',
                transition: 'transform 0.2s ease',
              }}
              className="hover:scale-110 active:scale-95"
            >
              <Play size={28} style={{ marginLeft: '4px' }} />
            </div>

            <div style={{ textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{selectedChannel.flag}</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedChannel.name}
                </span>
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                {selectedChannel.description}
              </p>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Click to Stream Live (Lazy-Loaded)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link to watch on YouTube directly */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
        <span>Official Verified Broadcast via YouTube Live</span>
        <a
          href={`https://www.youtube.com/channel/${selectedChannel.channelId}/live`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', textDecoration: 'none' }}
        >
          <span>Open on YouTube</span>
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
