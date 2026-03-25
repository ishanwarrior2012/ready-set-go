import { cn } from '@/lib/utils';
import { Channel } from '@/lib/m3uParser';
import { Tv2, Wifi, WifiOff } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

export function ChannelCard({ channel, isActive, onClick }: ChannelCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group',
        isActive
          ? 'bg-primary/20 border border-primary/40 text-white'
          : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
      )}
    >
      {/* Logo */}
      <div className="h-9 w-9 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center bg-white/10">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="h-full w-full object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Tv2 className="h-5 w-5 text-white/40" />
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{channel.name}</p>
        {channel.group && (
          <p className="text-xs text-white/40 truncate">{channel.group}</p>
        )}
      </div>

      {/* Live badge */}
      <div className="flex-shrink-0">
        {channel.isOnline === true && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </span>
        )}
        {channel.isOnline === false && (
          <WifiOff className="h-3 w-3 text-red-400/60" />
        )}
        {channel.isOnline === null && isActive && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>
    </button>
  );
}
