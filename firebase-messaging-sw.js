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

// 진단용: 이 기기가 마지막으로 푸시를 "받았는지 / 화면에 띄웠는지"를 기록해 둔다.
// 화면(push-client)이 이 기록을 읽어 보여주므로, 폰에 알림이 안 뜰 때
// "아예 도착을 안 한 것"과 "도착했는데 표시가 막힌 것"을 구분할 수 있다.
function recordPush(info) {
  return caches.open('bus-diag').then(function (c) {
    return c.put('last-push', new Response(JSON.stringify(info), { headers: { 'Content-Type': 'application/json' } }));
  }).catch(function () {});
}

self.addEventListener('push', function (e) {
  var payload = {};
  try { payload = e.data ? e.data.json() : {}; }
  catch (err) { payload = { title: '통학버스', body: e.data ? e.data.text() : '' }; }

  // 서버는 data 와 notification 을 함께 보낸다. data 를 우선 쓰고, 없으면 notification.
  var n = payload.data || payload.notification || payload;
  var at = Date.now();

  e.waitUntil(
    self.registration.showNotification(n.title || '통학버스', {
      body: n.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      // 알림마다 다른 꼬리표. 같은 꼬리표를 쓰면 아이폰이 알림 센터에 남은 이전 알림(예: 아침 등교 알림)과
      // 새 알림을 소리·배너 없이 바꿔치기해서, 새 알림이 온 줄 모르게 된다. 중복 방지는 서버가 이미 한다.
      tag: n.tag || ('bus-' + at),
      vibrate: [200, 100, 200],
      data: { url: n.url || './' }
    }).then(function () {
      return recordPush({ at: at, shown: true, title: n.title || '' });
    }).catch(function (err) {
      return recordPush({ at: at, shown: false, error: String((err && err.message) || err) });
    })
  );
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
