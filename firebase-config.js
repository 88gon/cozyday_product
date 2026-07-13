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

// Firebase 초기화 (중복 초기화 방지)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else if (typeof firebase !== 'undefined') {
  // 이미 초기화된 경우 기존 앱 재사용
}

// Firestore 인스턴스를 전역으로 노출
if (typeof firebase !== 'undefined') {
  window.db = firebase.firestore();
}
