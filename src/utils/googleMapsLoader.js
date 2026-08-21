// Shared singleton loader for the Google Maps JavaScript SDK. Kept separate
// from PlotBoundaryTracer.jsx's own loader (which requests the extra
// `drawing` library for the admin plot-boundary tool) so PropertyView.jsx's
// public buyer-facing satellite/street-view widgets don't pull in a library
// they never use — but both ultimately hit the same script URL shape, so
// if either one already loaded the SDK on the page, this resolves instantly
// against the existing window.google.maps instead of injecting a second
// <script> tag (which Google's loader doesn't support cleanly).

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsLoadPromise = null;

export function loadGoogleMaps() {
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }

    if (!GOOGLE_API_KEY) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }

    window.__googleMapsPropertyViewInit__ = () => {
      delete window.__googleMapsPropertyViewInit__;
      resolve(window.google.maps);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=__googleMapsPropertyViewInit__`;
    script.async = true;
    script.onerror = () => {
      delete window.__googleMapsPropertyViewInit__;
      mapsLoadPromise = null;
      if (window.google?.maps) { resolve(window.google.maps); } else { reject(new Error('Google Maps failed to load')); }
    };
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}
