import React from 'react';
import ChatWidget from '../components/ChatWidget.jsx';

// Full-page host for ChatWidget.jsx, mounted at /widget — designed to be
// embedded via <iframe src=".../widget"> on a tenant's own website. Since
// the iframe's document is served from Plotra's own origin, the widget's
// API calls stay same-origin (no CORS configuration needed per tenant
// domain), which is the whole reason this is an iframe-able page rather
// than a separately-bundled cross-origin script widget.
export default function ChatWidgetPage() {
  return (
    <div style={{ height: '100vh', width: '100vw', margin: 0, overflow: 'hidden' }}>
      <ChatWidget />
    </div>
  );
}
