import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useIPTV } from '@/hooks/useIPTV';
import { useCast } from '@/hooks/useCast';
import { HLSPlayer } from '@/components/iptv/HLSPlayer';
import { ChannelCard } from '@/components/iptv/ChannelCard';
import { DTHPlayer, DTHChannelCard, DTH_CHANNELS } from '@/components/iptv/DTHPlayer';
import { Channel } from '@/lib/m3uParser';
import {
  Search, Menu, X, Tv2, Satellite, ChevronRight, Loader2,
  Cast, RefreshCw, Grid3X3, List, Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_ICONS: Record<string, string> = {
  'News': '📰', 'Sports': '⚽', 'Entertainment': '🎬', 'Kids': '🎠',
  'Music': '🎵', 'Movies': '🎥', 'Documentary': '📽️', 'Religious': '🕌',
  'Education': '📚', 'Business': '💼', 'Government': '🏛️', 'Regional': '🗺️',
  'General': '📺',
};

type Tab = 'live' | 'dth';

export default function IPTVPage() {
  const { channels, loading } = useIPTV();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDTH, setSelectedDTH] = useState<typeof DTH_CHANNELS[0] | null>(null);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('live');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dthCategory, setDthCategory] = useState('All');

  const { castStream } = useCast(selectedChannel?.url ?? '', selectedChannel?.name ?? '');

  // Build groups
  const groups = useMemo(() => {
    const g = new Set<string>();
    channels.forEach(c => g.add(c.group || 'General'));
    return ['All', ...Array.from(g).sort()];
  }, [channels]);

  // Filter channels
  const filtered = useMemo(() => {
    let list = channels;
    if (activeGroup !== 'All') list = list.filter(c => c.group === activeGroup);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [channels, activeGroup, search]);

  // DTH categories
  const dthCategories = useMemo(() => {
    const cats = new Set<string>();
    DTH_CHANNELS.forEach(c => cats.add(c.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredDTH = useMemo(() => {
    if (dthCategory === 'All') return DTH_CHANNELS;
    return DTH_CHANNELS.filter(c => c.category === dthCategory);
  }, [dthCategory]);

  // Auto-select first channel
  useEffect(() => {
    if (!loading && channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [loading, channels, selectedChannel]);

  const handleSelectChannel = useCallback((ch: Channel) => {
    setSelectedChannel(ch);
    setSelectedDTH(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleSelectDTH = useCallback((ch: typeof DTH_CHANNELS[0]) => {
    setSelectedDTH(ch);
    setSelectedChannel(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const currentStream = selectedChannel?.url ?? '';
  const currentTitle = selectedChannel?.name ?? '';

  return (
    <Layout showFab={false}>
      <div className="min-h-screen bg-[hsl(220,20%,6%)] text-white">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[hsl(220,20%,6%)]/90 backdrop-blur-md border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <Tv2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight hidden sm:block">SafeTrack <span className="text-primary">TV</span></span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-white/5 p-0.5 gap-0.5 ml-2">
            <button
              onClick={() => setTab('live')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-all', tab === 'live' ? 'bg-primary text-white' : 'text-white/60 hover:text-white')}
            >
              📡 Live TV
            </button>
            <button
              onClick={() => setTab('dth')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-all', tab === 'dth' ? 'bg-primary text-white' : 'text-white/60 hover:text-white')}
            >
              🛰️ Airtel DTH
            </button>
          </div>

          <div className="flex-1" />

          {/* View mode */}
          <div className="hidden md:flex rounded-lg bg-white/5 p-0.5 gap-0.5">
            <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'list' ? 'bg-white/10' : 'text-white/40 hover:text-white')}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-white/10' : 'text-white/40 hover:text-white')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100vh-8rem)]">
          {/* Sidebar */}
          <aside className={cn(
            'flex-shrink-0 flex flex-col bg-[hsl(220,20%,8%)] border-r border-white/5 transition-all duration-300 overflow-hidden',
            sidebarOpen ? 'w-72' : 'w-0'
          )}>
            <div className="flex flex-col h-full w-72">
              {/* Search */}
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={tab === 'live' ? 'Search channels…' : 'Search DTH…'}
                    className="w-full bg-white/5 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              {tab === 'live' && (
                <>
                  {/* Groups */}
                  <div className="p-2 border-b border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {groups.slice(0, 8).map(g => (
                        <button
                          key={g}
                          onClick={() => setActiveGroup(g)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                            activeGroup === g ? 'bg-primary text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          {GROUP_ICONS[g] ?? '📺'} {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel list */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Loading India channels…</p>
                      </div>
                    ) : filtered.length === 0 ? (
                      <p className="text-white/30 text-sm text-center py-8">No channels found</p>
                    ) : (
                      filtered.map(ch => (
                        <ChannelCard
                          key={ch.id}
                          channel={ch}
                          isActive={selectedChannel?.id === ch.id}
                          onClick={() => handleSelectChannel(ch)}
                        />
                      ))
                    )}
                  </div>

                  {/* Count */}
                  {!loading && (
                    <div className="p-3 border-t border-white/5">
                      <p className="text-white/30 text-xs text-center">
                        {filtered.length} channels · India 🇮🇳
                      </p>
                    </div>
                  )}
                </>
              )}

              {tab === 'dth' && (
                <>
                  {/* DTH Categories */}
                  <div className="p-2 border-b border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {dthCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setDthCategory(cat)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                            dthCategory === cat ? 'bg-primary text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {filteredDTH.map(ch => (
                      <DTHChannelCard key={ch.id} channel={ch} onClick={() => handleSelectDTH(ch)} />
                    ))}
                  </div>

                  <div className="p-3 border-t border-white/5">
                    <p className="text-white/30 text-xs text-center">
                      🛰️ Powered by SafeTrack Airtel DTH
                    </p>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* DTH Player */}
            {selectedDTH && tab === 'dth' ? (
              <div className="max-w-4xl mx-auto">
                <DTHPlayer channel={selectedDTH} onClose={() => setSelectedDTH(null)} />
              </div>
            ) : tab === 'dth' ? (
              /* DTH Grid */
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <Satellite className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Airtel DTH</h1>
                    <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-semibold">LIVE</span>
                  </div>
                  <p className="text-white/40 text-sm">Premium live channels — click to watch instantly</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredDTH.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectDTH(ch)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 group"
                    >
                      <span className="text-4xl group-hover:scale-110 transition-transform">{ch.logo}</span>
                      <p className="text-sm font-semibold text-center leading-tight">{ch.name}</p>
                      <span className="text-[10px] text-white/40">Ch. {ch.channelNumber}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                        LIVE
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : selectedChannel ? (
              /* Live TV Player */
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Info bar */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold">{selectedChannel.name}</h1>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                        LIVE
                      </span>
                    </div>
                    <p className="text-white/40 text-sm">{selectedChannel.group} {selectedChannel.language ? `· ${selectedChannel.language}` : ''}</p>
                  </div>
                  <button
                    onClick={castStream}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-primary/40 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Cast className="h-4 w-4 text-primary" />
                    Cast to TV
                  </button>
                </div>

                {/* Player */}
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5">
                  <HLSPlayer
                    key={selectedChannel.id}
                    src={selectedChannel.url}
                    title={selectedChannel.name}
                    onCast={castStream}
                  />
                </div>

                {/* Related channels */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">More in {selectedChannel.group}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {channels
                      .filter(c => c.group === selectedChannel.group && c.id !== selectedChannel.id)
                      .slice(0, 6)
                      .map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => handleSelectChannel(ch)}
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 text-sm text-white/70 hover:text-white transition-all text-left"
                        >
                          <span className="text-lg">{GROUP_ICONS[ch.group] ?? '📺'}</span>
                          <span className="truncate">{ch.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Loading India Live TV channels…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                <Tv2 className="h-16 w-16" />
                <p>Select a channel to start watching</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
