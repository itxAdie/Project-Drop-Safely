// Drop Safely — Service Worker for Web Push Notifications
// Vanilla JS, no build step required.

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Drop Safely",
      body: event.data.text(),
    };
  }

  var title = payload.title || "Drop Safely";
  var options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      url: payload.url || "/",
    },
    vibrate: [100, 50, 100],
    tag: payload.tag || "drop-safely-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var urlToOpen = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // If a window with the target URL is already open, focus it
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener("pushsubscriptionchange", function (event) {
  // Re-subscribe automatically if the subscription changes
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : {})
      .then(function (newSubscription) {
        // Send the new subscription to the server
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode.apply(
                  null,
                  new Uint8Array(newSubscription.getKey("p256dh"))
                )
              ),
              auth: btoa(
                String.fromCharCode.apply(
                  null,
                  new Uint8Array(newSubscription.getKey("auth"))
                )
              ),
            },
          }),
        });
      })
      .catch(function (err) {
        console.error("[sw] Push subscription change failed:", err);
      })
  );
});
