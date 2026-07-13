// firebase-config.js
// ⚠️  중요: 아래의 플레이스홀더 값을 Firebase 콘솔에서 확인한 실제 값으로 교체해주세요.
// Firebase 콘솔 → 프로젝트 설정 → 일반 탭 → '내 앱' 섹션에서 확인 가능합니다.
// Firebase project: cozyday-product

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                        // ← 실제 API 키로 교체
  authDomain: "cozyday-product.firebaseapp.com",
  projectId: "cozyday-product",
  storageBucket: "cozyday-product.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← 실제 값으로 교체
  appId: "YOUR_APP_ID"                           // ← 실제 값으로 교체
};

// 플레이스홀더 값이면 초기화하지 않음 (씨앗 댓글 모드로 동작)
const _isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

if (_isConfigured && typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.db = firebase.firestore();
} else {
  window.db = null; // 씨앗 댓글 모드
}
