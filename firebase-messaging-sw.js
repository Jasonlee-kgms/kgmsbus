/* 서비스워커 — 앱이 닫혀 있어도 푸시를 받아 알림을 띄우는 주체.
 *
 * 의도적으로 외부 의존성이 전혀 없습니다(importScripts 없음).
 * Firebase SDK를 서비스워커에서 불러오면, 설정값이 비어 있거나 CDN이 느릴 때
 * 최상위에서 예외가 터져 등록 자체가 실패합니다("ServiceWorker script evaluation failed").
 * 그래서 서버는 data-only 메시지로 보내고(Push.gs), 표시는 여기서 직접 합니다.
 * 토큰 발급(getToken)에만 페이지 쪽 Firebase SDK를 사용합니다.
 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var payload = {};
  try { payload = e.data ? e.data.json() : {}; }
  catch (err) { payload = { title: '통학버스', body: e.data ? e.data.text() : '' }; }

  // data-only 메시지면 payload.data, notification 페이로드면 payload.notification 에 들어온다.
  var n = payload.data || payload.notification || payload;

  e.waitUntil(self.registration.showNotification(n.title || '통학버스', {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: n.tag || 'bus-arrival',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: n.url || './' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = new URL((e.notification.data && e.notification.data.url) || './', self.location).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(new URL('./', self.location).href) === 0 && 'focus' in list[i]) return list[i].focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
