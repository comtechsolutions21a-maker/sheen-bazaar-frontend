import { useEffect } from 'react';

const SITE_NAME = 'Sheen Bazaar';
const DEFAULT_TITLE = `${SITE_NAME} — Fashion, Electronics & Everyday Essentials`;
const DEFAULT_DESCRIPTION = "Shop fashion, electronics, home essentials and more on Sheen Bazaar — India's marketplace with fast delivery and daily deals.";

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

// Sets this page's <title> and meta description while it's mounted, and
// restores the site defaults on unmount so navigating away (e.g. to a page
// that doesn't call this hook) never leaves a stale title behind.
// Usage: useSEO('Products', 'Browse thousands of products...')
export function useSEO(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    setMetaDescription(description || DEFAULT_DESCRIPTION);
    return () => {
      document.title = DEFAULT_TITLE;
      setMetaDescription(DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
}
