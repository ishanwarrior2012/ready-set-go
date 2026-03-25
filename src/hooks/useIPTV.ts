import { useState, useEffect, useCallback } from 'react';
import { Channel, parseM3U } from '@/lib/m3uParser';

const PLAYLIST_URLS = [
  'https://iptv-org.github.io/iptv/countries/in.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u',
];

const PROXY = 'https://corsproxy.io/?';

export function useIPTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylist() {
      setLoading(true);
      setError(null);

      for (const url of PLAYLIST_URLS) {
        try {
          const res = await fetch(`${PROXY}${encodeURIComponent(url)}`, {
            headers: { 'Accept': 'text/plain' },
          });
          if (!res.ok) continue;
          const text = await res.text();
          const parsed = parseM3U(text);
          if (parsed.length > 0) {
            setChannels(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // try next
        }
      }

      // Fallback: use hardcoded popular India channels
      setChannels(getFallbackChannels());
      setLoading(false);
    }

    fetchPlaylist();
  }, []);

  const checkChannelStatus = useCallback(async (channelId: string, url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeout);
      setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, isOnline: true } : ch));
    } catch {
      setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, isOnline: false } : ch));
    }
  }, []);

  return { channels, loading, error, checkChannelStatus };
}

function getFallbackChannels(): Channel[] {
  return [
    { id: 'dd-national', name: 'DD National', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/DD_National_logo.svg/200px-DD_National_logo.svg.png', group: 'National', url: 'https://ddnationalstreamcf.akamaized.net/hls/live/2038425/DDNATIONAL/index.m3u8', isOnline: null },
    { id: 'dd-news', name: 'DD News', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/DD_News_logo.svg/200px-DD_News_logo.svg.png', group: 'News', url: 'https://ddnewsstreamcf.akamaized.net/hls/live/2038431/DDNEWS/index.m3u8', isOnline: null },
    { id: 'dd-india', name: 'DD India', logo: '', group: 'National', url: 'https://ddindianetstreamcf.akamaized.net/hls/live/2040261/DDINDIA/index.m3u8', isOnline: null },
    { id: 'dd-sports', name: 'DD Sports', logo: '', group: 'Sports', url: 'https://ddsportsstreamcf.akamaized.net/hls/live/2038429/DDSPORTS/index.m3u8', isOnline: null },
    { id: 'lok-sabha', name: 'Lok Sabha TV', logo: '', group: 'Government', url: 'https://lshd-lsvod.akamaized.net/hls/live/2031906/lst2/index.m3u8', isOnline: null },
    { id: 'rajya-sabha', name: 'Rajya Sabha TV', logo: '', group: 'Government', url: 'https://feeds.indiavideo.tv/rstvhls/index.m3u8', isOnline: null },
  ];
}
