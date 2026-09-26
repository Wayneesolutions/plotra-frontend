import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router does not reset scroll position on navigation by default.
// Without this, clicking a card partway down a long page (e.g. a listing
// card) mounts the new page's content at the *current* scroll offset, so
// it can look like nothing happened even though the URL changed. This
// scrolls to the top on every route change, except when the new URL
// carries a hash (e.g. "/#listings") — those should scroll to that
// section instead, which the browser/anchor already handles.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    // { behavior: 'auto' } forces an instant jump, overriding the site's
    // global `scroll-behavior: smooth` (in styles.css) which would
    // otherwise animate this and make the new page take a moment to
    // "arrive" at the top.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
