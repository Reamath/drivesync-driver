// DriveSync Service Worker v3
// Background notifications via Web Push + SW

const SW_VERSION = 'v3';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });

// ── Web Push (from Supabase webhook → Netlify function → browser) ─────────
self.addEventListener('push', event => {
  let p = { title: 'DriveSync', body: 'New update — open the app', tag: 'drivesync' };
  try { if (event.data) p = { ...p, ...event.data.json() }; } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(p.title, {
      body:               p.body,
      icon:               '/icon-192.png',
      badge:              '/icon-192.png',
      tag:                p.tag,
      renotify:           true,
      requireInteraction: true,
      vibrate:            p.vibrate || [300, 100, 300],
      data:               { url: '/driver.html' },
    })
  );
});

// ── App-triggered notifications (foreground → SW for consistent delivery) ──
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'NOTIFY') {
    const { title, body, options = {} } = event.data;
    self.registration.showNotification(title, {
      body,
      icon:               '/icon-192.png',
      badge:              '/icon-192.png',
      renotify:           true,
      requireInteraction: true,
      vibrate:            [300, 100, 300],
      data:               { url: '/driver.html' },
      ...options,
    });
  }
});

// ── Notification tap — open / focus the driver app ───────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wcs => {
      for (const c of wcs) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('/driver.html');
    })
  );
});

// Passthrough fetch
self.addEventListener('fetch', () => {});
