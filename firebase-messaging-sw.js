importScripts('/config.js');

// عند الضغط على الإشعار: فتح الرابط (حقل url في Custom data) أو الموقع الأصلي
self.addEventListener('notificationclick', function (event) {
  var d = event.notification.data || {};
  var m = d.FCM_MSG || {};
  var url = (m.data && m.data.url) || (m.fcmOptions && m.fcmOptions.link) || PN_CONFIG.siteUrl;
  // المرور عبر go.html لتسجيل المشترك القديم في لوحة الأدمن ثم فتح الرابط
  url = self.location.origin + '/go.html?u=' + encodeURIComponent(url);
  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      return clients.openWindow(url);
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(PN_CONFIG.firebase);
firebase.messaging();

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
