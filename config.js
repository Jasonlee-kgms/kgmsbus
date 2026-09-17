/* ⚠ TODO: 아래 값을 실제 값으로 채워야 알림이 동작합니다. (자세한 절차: 웹푸시설치안내.md)
 * 이 파일의 값은 원래 공개되는 정보입니다(Firebase 웹 설정·VAPID 공개키). 비밀키가 아닙니다.
 */
(function (g) {
  g.BUS_CONFIG = {
    gasUrl: 'https://script.google.com/macros/s/여기에_배포ID/exec',
    firebase: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    },
    vapidKey: '',
    googleClientId: '',
    allowedDomain: ''
  };
})(typeof self !== 'undefined' ? self : this);
