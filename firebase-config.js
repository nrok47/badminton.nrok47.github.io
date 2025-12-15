// Firebase RTDB-only configuration (no auth)
const firebaseConfig = {
  apiKey: "AIzaSyAjmAT8JJYsyOyRrzEA_eyE5xMOahGJEgo",
  authDomain: "snowite-14f53.firebaseapp.com",
  databaseURL: "https://snowite-14f53-default-rtdb.firebaseio.com",
  projectId: "snowite-14f53",
  storageBucket: "snowite-14f53.appspot.com",
  messagingSenderId: "528443231444",
  appId: "1:528443231444:web:2dba99e0e10efdbb103f41",
  measurementId: "G-ZSMM4Y3ET2"
};

console.log('🔥 Firebase RTDB config loaded');

try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
} catch (err) {
  console.error('❌ Firebase init error:', err);
}

// Use explicit databaseURL to avoid host/region mismatches
const db = firebase.database(firebaseConfig.databaseURL);
console.log('🗄️ Using Realtime Database URL:', firebaseConfig.databaseURL);

// Public path for app data (requires RTDB rules to allow read/write)
const DATA_PATH = 'public/bcm-data';

function saveDataToFirebase() {
  const data = {
    members,
    matches,
    expenses,
    activeTournament,
    tournamentHistory,
    lastSaved: new Date().toISOString()
  };

  db.ref(DATA_PATH).set(data)
    .then(() => console.log('✅ Data saved to Firebase RTDB'))
    .catch((error) => {
      console.error('❌ Error saving to Firebase:', error.message);
      alert('⚠️ ไม่สามารถบันทึกข้อมูลได้: ' + error.message);
    });
}

function loadAllDataFromFirebase() {
  db.ref(DATA_PATH).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        members = data.members || [];
        matches = data.matches || [];
        expenses = data.expenses || [];
        activeTournament = data.activeTournament || null;
        tournamentHistory = data.tournamentHistory || [];
        console.log('✅ Data loaded from Firebase RTDB');
      } else {
        console.log('📭 No data found in Firebase, starting fresh');
        members = [];
        matches = [];
        expenses = [];
        activeTournament = null;
        tournamentHistory = [];
      }

      updateDashboard();
      renderMembers();
      renderExpenses();
      renderTournamentPlayerSelection();
      renderActiveTournament();
      renderTournamentHistory();
    })
    .catch((error) => {
      console.error('❌ Error loading from Firebase:', error.message);
      alert('⚠️ ไม่สามารถโหลดข้อมูลได้: ' + error.message);
    });
}

// Quick connectivity verification to surface misconfiguration early
(function verifyDatabaseConnection(){
  const ts = Date.now();
  db.ref('public/.ping').set({ ts })
    .then(() => console.log('📶 RTDB write test OK:', ts))
    .catch((error) => {
      console.error('🚫 RTDB write failed:', error);
      console.warn('Hint: Check Realtime Database is enabled, rules allow writes, and databaseURL matches the instance URL from Firebase console.');
    });
})();

// Debounced auto-sync helper
(function enableAutoSync(){
  let syncTimeout;
  window.autoSyncData = function() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      saveDataToFirebase();
    }, 800);
  };
  console.log('🔄 Auto-sync enabled');
})();
