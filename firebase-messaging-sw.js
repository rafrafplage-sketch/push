importScripts('/config.js');

// ---------- إحصائيات الإشعارات (وصل / ضغط) ----------
// كل إشعار يُرسل من اللوحة يحمل رقمًا (nid). نسجّل في Firestore:
//   campaigns/{nid}/delivered  عند وصول الإشعار للجهاز
//   campaigns/{nid}/clicks     عند الضغط عليه
function pnPlatform() {
  var ua = (self.navigator && self.navigator.userAgent) || '';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))) return 'ios';
  return /Android/i.test(ua) ? 'android' : 'desktop';
}
function pnTrack(nid, kind) {
  if (!nid || !/^[A-Za-z0-9]{1,40}$/.test(nid)) return Promise.resolve();
  var url = 'https://firestore.googleapis.com/v1/projects/' + PN_CONFIG.firebase.projectId +
    '/databases/(default)/documents/campaigns/' + nid + '/' + kind + '?key=' + PN_CONFIG.firebase.apiKey;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { p: { stringValue: pnPlatform() } } }),
    keepalive: true
  }).catch(function () {});
}

// وصول الإشعار (لا يمنع Firebase من عرضه)
self.addEventListener('push', function (event) {
  var nid = '';
  try { var j = event.data && event.data.json(); nid = (j && j.data && j.data.nid) || ''; } catch (e) {}
  if (nid) event.waitUntil(pnTrack(nid, 'delivered'));
});

// عند الضغط على الإشعار: فتح الرابط (حقل url في Custom data) أو الموقع الأصلي
self.addEventListener('notificationclick', function (event) {
  var d = event.notification.data || {};
  var m = d.FCM_MSG || {};
  var url = (m.data && m.data.url) || (m.fcmOptions && m.fcmOptions.link) || PN_CONFIG.siteUrl;
  var nid = (m.data && m.data.nid) || '';
  // go.html موجود فقط على push.rafrafplage.tn (لتسجيل المشترك القديم ثم فتح الرابط).
  // المشتركون من www.rafrafplage.tn مباشرة: نفتح الرابط نفسه (go.html غير موجود هناك → 404)
  if (/^push\./.test(self.location.hostname)) {
    url = self.location.origin + '/go.html?u=' + encodeURIComponent(url);
  }
  event.notification.close();
  event.stopImmediatePropagation();
  event.waitUntil(Promise.all([
    clients.openWindow(url),
    pnTrack(nid, 'clicks')
  ]));
});

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(PN_CONFIG.firebase);
firebase.messaging();

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
