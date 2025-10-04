let currentUser = null;
let isSignup = true; // toggled by auth UI

function openAuthModal(signupMode) {
  isSignup = !!signupMode;
  const authModal = document.getElementById('authModal');
  if (!authModal) return;
  updateAuthModal();
  authModal.style.display = 'block';
}

function updateAuthModal() {
  const emailField = document.getElementById('emailField');
  const modalTitle = document.getElementById('modalTitle');
  const toggleText = document.getElementById('toggleText');
  const toggleAuth = document.getElementById('toggleAuth');
  const emailInput = document.getElementById('email');

  if (isSignup) {
    if (modalTitle) modalTitle.textContent = 'Sign Up';
    if (emailField) emailField.style.display = 'block';
    if (toggleText) toggleText.textContent = 'Already have an account?';
    if (toggleAuth) toggleAuth.textContent = 'Log In';
    if (emailInput) emailInput.required = true;
  } else {
    if (modalTitle) modalTitle.textContent = 'Log In';
    if (emailField) emailField.style.display = 'none';
    if (toggleText) toggleText.textContent = "Don't have an account?";
    if (toggleAuth) toggleAuth.textContent = 'Sign Up';
    if (emailInput) emailInput.required = false;
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const emailEl = document.getElementById('email');
  const email = emailEl ? emailEl.value.trim() : '';
  const authModal = document.getElementById('authModal');

  if (isSignup) {
    if (!username || !password || !email) { alert('Please fill all fields'); return; }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.username === username)) { alert('Username already exists'); return; }
    users.push({ username, email, password });            // demo only (plaintext)
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = username;
    localStorage.setItem('currentUser', username);
    if (authModal) authModal.style.display = 'none';
    updateUIForLoggedIn();
    alert('Signup successful!');
  } else {
    if (!username || !password) { alert('Please enter username and password'); return; }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) { alert('Invalid credentials'); return; }
    currentUser = username;
    localStorage.setItem('currentUser', username);
    if (authModal) authModal.style.display = 'none';
    updateUIForLoggedIn();
    alert('Login successful!');
  }
}

function loadSession() {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) currentUser = storedUser;
}

function updateUIForLoggedIn() {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (!navLinks.querySelector('.user-info')) {
      const userDiv = document.createElement('div');
      userDiv.className = 'user-info';
      userDiv.innerHTML = `
        <span>Welcome, ${currentUser}!</span>
        <button id="logoutBtn" style="background:none;border:none;color:var(--text-color);cursor:pointer;padding:10px 15px;">Logout</button>
      `;
      navLinks.appendChild(userDiv);
      userDiv.querySelector('#logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        userDiv.remove();
        if (loginBtn) loginBtn.style.display = '';
        if (signupBtn) signupBtn.style.display = '';
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSession();
  updateUIForLoggedIn();

  const loginBtn  = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const authForm  = document.getElementById('authForm');
  const toggleAuth = document.getElementById('toggleAuth');

  if (loginBtn)  loginBtn.addEventListener('click', () => openAuthModal(false));
  if (signupBtn) signupBtn.addEventListener('click', () => openAuthModal(true));

  if (toggleAuth) toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isSignup = !isSignup;
    updateAuthModal();
    if (authForm) authForm.reset();
  });

  if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

  // Close (x) buttons
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
  });
});
