export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  language?: string;
  country?: string;
  tvgId?: string;
  isOnline?: boolean | null; // null = unchecked
}

export function parseM3U(text: string): Channel[] {
  const channels: Channel[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue;

    const infoLine = lines[i];
    const urlLine = lines[i + 1] ?? '';

    if (!urlLine || urlLine.startsWith('#')) continue;

    const nameMatch = infoLine.match(/,(.+)$/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';

    const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
    const logo = logoMatch ? logoMatch[1] : '';

    const groupMatch = infoLine.match(/group-title="([^"]*)"/);
    const group = groupMatch ? groupMatch[1] : 'General';

    const tvgIdMatch = infoLine.match(/tvg-id="([^"]*)"/);
    const tvgId = tvgIdMatch ? tvgIdMatch[1] : '';

    const langMatch = infoLine.match(/tvg-language="([^"]*)"/);
    const language = langMatch ? langMatch[1] : '';

    const countryMatch = infoLine.match(/tvg-country="([^"]*)"/);
    const country = countryMatch ? countryMatch[1] : '';

    channels.push({
      id: `ch-${i}-${name.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      logo,
      group,
      url: urlLine,
      language,
      country,
      tvgId,
      isOnline: null,
    });
  }

  return channels;
}
