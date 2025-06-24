// auth.js

// --- Registration Logic ---
if (document.getElementById('register-form')) {
  document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = e.target.querySelector('input[placeholder="Username"]').value;
    const email = e.target.querySelector('input[placeholder="Email"]').value;
    const password = e.target.querySelector('input[placeholder="Password"]').value;
    try {
      // Create user with Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      // Create user document in Firestore
      await firebase.firestore().collection('users').doc(user.uid).set({
        username: username,
        email: email,
        possessions: { balance: 0, history: [] },
        incomeSources: [],
        savings: [],
        debts: []
      });
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

// --- Login Logic ---
if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = e.target.querySelector('input[placeholder="Email"]').value;
    const password = e.target.querySelector('input[placeholder="Password"]').value;
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } catch (error) {
      alert(error.message);
    }
  });
}

// --- Auth State Check (for protected pages) ---
function protectPage(pageLogic) {
  // Hide body until auth is checked
  document.body.classList.add('auth-loading');

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is logged in, run the page-specific logic
      pageLogic(user);
      // Show the page
      document.body.classList.remove('auth-loading');
    } else {
      // Not logged in, redirect to login page
      window.location.href = 'index.html';
    }
  });
} 