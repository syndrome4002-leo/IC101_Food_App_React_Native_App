import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Built-in fallback URLs, keyed the same way as the server `links` collection.
 * These are used before the API responds, and for any key the API doesn't return.
 * Keep these keys in sync with DEFAULT_LINKS in server/api/index.js.
 */
export const DEFAULT_LINKS: Record<string, string> = {
  ai_diet_guide: 'https://www.icnetwork.org/interstitial-cystitis-diet/',
  icn_home: 'https://www.icnetwork.org',
  book_diet_guide: 'https://www.icnsales.com/ic101-diet-guide.html',
  book_flare_guide: 'https://www.icnsales.com/ic101-the-flare-guide-print',
  book_chef_cookbook: 'https://www.icnsales.com/ic-chef-cookbook-print-version.html',
  resource_prelief: 'https://www.icnsales.com/prelief-acid-reducer/',
  resource_masterclass: 'https://www.icnetwork.org/masterclass/',
  more_ic_diet_project: 'http://www.icdietproject.com',
  more_bella_rosa: 'https://www.icnsales.com/coffee-low-acid/',
  more_herbal_teas: 'https://www.icnsales.com/herbal-teas_peppermint-tummy-mint-after-dinner-teas',
};

interface ServerLink {
  key: string;
  label?: string;
  url: string;
}

type LinksContextValue = {
  /** Resolve a link by key, falling back to the built-in default or `fallback`. */
  getLink: (key: string, fallback?: string) => string;
};

const LinksContext = createContext<LinksContextValue>({
  getLink: (key, fallback) => DEFAULT_LINKS[key] ?? fallback ?? '',
});

export function LinksProvider({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<Record<string, string>>(DEFAULT_LINKS);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/links`)
      .then((res) => res.json())
      .then((data: ServerLink[]) => {
        if (cancelled || !Array.isArray(data)) return;
        const map: Record<string, string> = { ...DEFAULT_LINKS };
        for (const item of data) {
          if (item?.key && item?.url) map[item.key] = item.url;
        }
        setLinks(map);
      })
      .catch(() => {
        // Keep the built-in defaults if the request fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getLink = (key: string, fallback?: string) =>
    links[key] ?? DEFAULT_LINKS[key] ?? fallback ?? '';

  return <LinksContext.Provider value={{ getLink }}>{children}</LinksContext.Provider>;
}

export function useLinks() {
  return useContext(LinksContext);
}
