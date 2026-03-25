import { X, ChevronLeft } from 'lucide-react';

// DTH-style branded "channel" that plays embedded content
// Styled like Airtel DTH / Tata Play — no YouTube branding shown
interface DTHChannel {
  id: string;
  name: string;
  logo: string;
  channelNumber: string;
  embedId: string; // YouTube video/stream ID
  category: string;
  description: string;
}

export const DTH_CHANNELS: DTHChannel[] = [
  { id: 'dth-1', name: 'Lok Sabha Live', logo: '🏛️', channelNumber: '501', embedId: 'dQw4w9WgXcQ', category: 'Government', description: 'Live proceedings from Parliament' },
  { id: 'dth-2', name: 'NASA TV Live', logo: '🚀', channelNumber: '502', embedId: 'nA9UZF-SZoQ', category: 'Science', description: 'Live space missions & exploration' },
  { id: 'dth-3', name: 'World News 24', logo: '🌍', channelNumber: '503', embedId: 'w_Ma8oQLmSM', category: 'News', description: '24/7 international news coverage' },
  { id: 'dth-4', name: 'Cricket Live HD', logo: '🏏', channelNumber: '504', embedId: 'oc6RV5c1yd0', category: 'Sports', description: 'Live cricket matches & highlights' },
  { id: 'dth-5', name: 'Meditation & Yoga', logo: '🧘', channelNumber: '505', embedId: 'inpok4MKVLM', category: 'Lifestyle', description: 'Daily yoga and wellness content' },
  { id: 'dth-6', name: 'Nature & Wildlife', logo: '🦁', channelNumber: '506', embedId: '3bHFCB4IZSA', category: 'Entertainment', description: 'Wildlife documentaries and nature' },
  { id: 'dth-7', name: 'Finance & Markets', logo: '📈', channelNumber: '507', embedId: 'coYw-eVU0Ks', category: 'Business', description: 'Stock market & financial news live' },
  { id: 'dth-8', name: 'Kids World HD', logo: '🎨', channelNumber: '508', embedId: '0Bf9GWk0Z5A', category: 'Kids', description: 'Educational & fun content for kids' },
];

interface DTHPlayerProps {
  channel: DTHChannel;
  onClose: () => void;
}

export function DTHPlayer({ channel, onClose }: DTHPlayerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-2xl">{channel.logo}</span>
          <div>
            <h2 className="text-white font-bold text-lg">{channel.name}</h2>
            <p className="text-white/50 text-xs">Ch. {channel.channelNumber} · {channel.category}</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Embedded player */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${channel.embedId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={channel.name}
        />
      </div>

      {/* Description */}
      <p className="text-white/50 text-sm">{channel.description}</p>
    </div>
  );
}

interface DTHChannelCardProps {
  channel: DTHChannel;
  onClick: () => void;
}

export function DTHChannelCard({ channel, onClick }: DTHChannelCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-white/70 hover:text-white border border-transparent transition-all duration-200 w-full text-left"
    >
      <div className="h-9 w-9 rounded-md flex-shrink-0 flex items-center justify-center bg-white/10 text-xl">
        {channel.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{channel.name}</p>
        <p className="text-xs text-white/40">Ch. {channel.channelNumber} · {channel.category}</p>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded flex-shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
        LIVE
      </span>
    </button>
  );
}
