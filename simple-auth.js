// Simple Authentication System (No Firebase)
console.log('🔐 Simple Auth loaded');

// Hardcoded users (for demo)
const DEMO_USERS = {
  'admin@badminton.local': { password: 'test', name: 'Admin' },
  'demo@badminton.com': { password: 'demo123456', name: 'Demo User' }
};

// Current user
let currentUser = null;

// Check if user is logged in on load
function checkAuthState() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    console.log('✅ User found in storage:', currentUser.email);
    showApp();
  } else {
    console.log('❌ No user logged in');
    showAuth();
  }
}

// Show auth form
function showAuth() {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  if (authContainer) authContainer.style.display = 'flex';
  if (appContainer) appContainer.style.display = 'none';
}

// Show app
function showApp() {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  if (authContainer) authContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'block';
  
  // Load data from localStorage
  loadDataFromLocalStorage();
}

// Sign In Function
function signInUser(email, password) {
  console.log('🔑 Attempting sign in:', email);
  
  return new Promise((resolve, reject) => {
    // Check if user exists
    const user = DEMO_USERS[email];
    
    if (!user) {
      console.error('❌ User not found');
      reject(new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
      return;
    }
    
    if (user.password !== password) {
      console.error('❌ Wrong password');
      reject(new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
      return;
    }
    
    // Login successful
    currentUser = {
      email: email,
      name: user.name,
      uid: btoa(email) // Simple UID
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('✅ Sign in successful');
    
    setTimeout(() => {
      showApp();
      resolve(currentUser);
    }, 100);
  });
}

// Sign Up Function
function signUpUser(email, password) {
  console.log('🔑 Attempting sign up:', email);
  
  return new Promise((resolve, reject) => {
    // Check if user already exists
    if (DEMO_USERS[email]) {
      console.error('❌ User already exists');
      reject(new Error('อีเมลนี้ถูกใช้แล้ว'));
      return;
    }
    
    // Create new user
    DEMO_USERS[email] = {
      password: password,
      name: email.split('@')[0]
    };
    
    currentUser = {
      email: email,
      name: DEMO_USERS[email].name,
      uid: btoa(email)
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('✅ Sign up successful');
    
    setTimeout(() => {
      showApp();
      resolve(currentUser);
    }, 100);
  });
}

// Sign Out Function
function signOutUser() {
  console.log('🚪 Signing out');
  return new Promise((resolve) => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    console.log('✅ Sign out successful');
    showAuth();
    resolve();
  });
}

// Save Data (now using localStorage)
function saveDataToFirebase() {
  if (!currentUser) {
    console.warn('⚠️ No user logged in');
    return;
  }
  
  const userId = currentUser.uid;
  const data = {
    members,
    matches,
    expenses,
    activeTournament,
    tournamentHistory,
    lastSaved: new Date().toISOString()
  };
  
  localStorage.setItem(`bcm_data_${userId}`, JSON.stringify(data));
  console.log('💾 Data saved to localStorage');
}

// Load Data (from localStorage)
function loadAllDataFromFirebase() {
  if (!currentUser) {
    console.warn('⚠️ No user logged in');
    loadDataFromLocalStorage();
    return;
  }
  
  const userId = currentUser.uid;
  const savedData = localStorage.getItem(`bcm_data_${userId}`);
  
  if (savedData) {
    const data = JSON.parse(savedData);
    members = data.members || [];
    matches = data.matches || [];
    expenses = data.expenses || [];
    activeTournament = data.activeTournament || null;
    tournamentHistory = data.tournamentHistory || [];
    
    console.log('✅ User data loaded');
  } else {
    console.log('📭 No saved data for this user');
    loadDataFromLocalStorage();
  }
  
  // Update UI
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof renderMembers === 'function') renderMembers();
  if (typeof renderExpenses === 'function') renderExpenses();
  if (typeof renderTournamentPlayerSelection === 'function') renderTournamentPlayerSelection();
  if (typeof renderActiveTournament === 'function') renderActiveTournament();
  if (typeof renderTournamentHistory === 'function') renderTournamentHistory();
}

// Fallback: Load from localStorage
function loadDataFromLocalStorage() {
  const savedMembers = localStorage.getItem('bcm_members');
  const savedMatches = localStorage.getItem('bcm_matches');
  const savedExpenses = localStorage.getItem('bcm_expenses');
  const savedTournament = localStorage.getItem('bcm_tournament');
  const savedTournamentHistory = localStorage.getItem('bcm_tournament_history');

  if (savedMembers) members = JSON.parse(savedMembers);
  if (savedMatches) matches = JSON.parse(savedMatches);
  if (savedExpenses) expenses = JSON.parse(savedExpenses);
  if (savedTournament) activeTournament = JSON.parse(savedTournament);
  if (savedTournamentHistory) tournamentHistory = JSON.parse(savedTournamentHistory);
  
  console.log('📂 Fallback data loaded');
}

// Check auth state on load
checkAuthState();

console.log('✅ Simple Auth ready');
