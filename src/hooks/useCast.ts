import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    cast: any;
    chrome: any;
    __onGCastApiAvailable?: (available: boolean) => void;
  }
}

export function useCast(streamUrl: string, title: string) {
  const sessionRef = useRef<any>(null);

  const initCast = useCallback(() => {
    if (!window.cast || !window.cast.framework) return;

    const context = window.cast.framework.CastContext.getInstance();
    context.setOptions({
      receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });
  }, []);

  useEffect(() => {
    window.__onGCastApiAvailable = (available: boolean) => {
      if (available) initCast();
    };

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // cleanup
    };
  }, [initCast]);

  const castStream = useCallback(async () => {
    // Try Remote Playback API first (works on Chrome without Cast SDK)
    const video = document.querySelector('video') as HTMLVideoElement & {
      remote?: { watchAvailability?: (cb: (available: boolean) => void) => Promise<void>; prompt?: () => Promise<void> };
    };

    if (video?.remote?.prompt) {
      try {
        await video.remote.prompt();
        return;
      } catch {
        // fall through to Cast SDK
      }
    }

    // Try Google Cast SDK
    if (window.cast?.framework) {
      const context = window.cast.framework.CastContext.getInstance();
      try {
        await context.requestSession();
        const session = context.getCurrentSession();
        if (session) {
          const mediaInfo = new window.chrome.cast.media.MediaInfo(streamUrl, 'application/x-mpegURL');
          mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
          mediaInfo.metadata.title = title;
          const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
          await session.loadMedia(request);
        }
      } catch (e) {
        console.warn('Cast failed:', e);
        // Fallback: show instructions
        alert('To cast:\n1. Click the Cast icon in your Chrome browser menu\n2. Select your Chromecast / Smart TV\n3. The stream will start on your TV');
      }
    } else {
      // No cast API — show helpful fallback
      alert('Casting requires Google Chrome browser.\n\nAlternatively:\n• Mirror your screen using your OS screen cast feature\n• Use Chromecast built-in Chrome browser (⋮ menu → Cast)');
    }
  }, [streamUrl, title]);

  return { castStream };
}
