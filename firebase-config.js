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

let app;
let db = null;

// Initialize Firebase with retry logic
function initFirebase() {
  try {
    // Try to get existing app first
    try {
      app = firebase.app();
      console.log('ℹ️ Firebase app already exists, reusing');
    } catch (_err) {
      // App doesn't exist, create new one
      app = firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    }
    
    // Get database reference
    if (app && !db) {
      db = firebase.database();
      console.log('🗄️ Using Realtime Database URL:', firebaseConfig.databaseURL);
    }
  } catch (err) {
    console.error('❌ Firebase init error:', err);
    // Retry after a short delay
    setTimeout(initFirebase, 500);
  }
}

// Start initialization
initFirebase();

// Public path for app data (requires RTDB rules to allow read/write)
const DATA_PATH = 'public/bcm-data';

function saveDataToFirebase() {
  if (!db) return console.error('🚫 Cannot save: RTDB not initialized');
  const data = {
    members,
    matches,
    expenses,
    activeTournament,
    tournamentHistory,
    lastSaved: new Date().toISOString()
  };

  // Use update() instead of set() to merge data instead of overwriting
  db.ref(DATA_PATH).update(data)
    .then(() => console.log('✅ Data saved to Firebase RTDB'))
    .catch((error) => {
      console.error('❌ Error saving to Firebase:', error.message);
      alert('⚠️ ไม่สามารถบันทึกข้อมูลได้: ' + error.message);
    });
}

function loadAllDataFromFirebase() {
  if (!db) {
    console.error('🚫 Cannot load: RTDB not initialized');
    return;
  }
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
      // Initialize empty data
      members = [];
      matches = [];
      expenses = [];
      courts = [];
      activeTournament = null;
      tournamentHistory = [];
      // Try to render with empty data
      try {
        updateDashboard();
        renderMembers();
        renderExpenses();
        renderTournamentPlayerSelection();
        renderActiveTournament();
        renderTournamentHistory();
      } catch (renderError) {
        console.error('❌ Error rendering with empty data:', renderError.message);
      }
      alert('⚠️ ไม่สามารถโหลดข้อมูลได้: ' + error.message);
    });
}

// Quick connectivity verification to surface misconfiguration early
(function verifyDatabaseConnection(){
  if (!db) return;
  const ts = Date.now();
  db.ref('public/_ping').set({ ts })
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

// Monitor database connection status
function updateConnectionStatus() {
  const statusElement = document.getElementById('db-status');
  if (!statusElement) return;
  
  if (!db) {
    statusElement.className = 'db-status offline';
    statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">❌ ขาดการเชื่อมต่อ</span>';
    return;
  }

  // Check connection using .info/connected
  db.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      statusElement.className = 'db-status online';
      statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">🟢 เชื่อมต่อสำเร็จ</span>';
      console.log('✅ Firebase connected');
    } else {
      statusElement.className = 'db-status offline';
      statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">🔴 ขาดการเชื่อมต่อ</span>';
      console.log('❌ Firebase disconnected');
    }
  });
}

// Start monitoring after init
setTimeout(updateConnectionStatus, 1000);
