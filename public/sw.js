/* Web Push service worker (#push, 2026-07-20). Kept dependency-free and at the
   site root (/sw.js) so its scope covers the whole origin. Shows a system
   notification for each push and focuses/opens the target URL on click. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "iGovazd", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "iGovazd";
  const options = {
    body: payload.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: payload.url || "/account/notifications" },
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Reuse an open tab if we have one.
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
