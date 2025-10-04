let currentUser = null;
let isSignup = true; // toggled by auth UI

// Satellite animation functions

const canvas = document.getElementById('satelliteCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width, height;
let satellites = [];
let animationId;
let isTabVisible = true;

function resizeCanvas() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Satellite {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = 60 + Math.random() * 40;
        this.angle = Math.random() * 2 * Math.PI;
        this.speed = 0.001 + Math.random() * 0.003;
        this.floatSpeed = 0.2 + Math.random() * 0.5;
        this.floatDirection = Math.random() < 0.5 ? -1 : 1;
        this.xSpeed = (Math.random() - 0.5) * 0.5;
        this.parallax = 0.5 + Math.random() * 0.5;
        this.colors = [
            'rgba(138, 43, 226, 0.6)',
            'rgba(75, 0, 130, 0.6)',
            'rgba(0, 191, 255, 0.6)',
            'rgba(0, 255, 255, 0.6)',
            'rgba(255, 0, 255, 0.6)',
            'rgba(148, 0, 211, 0.6)'
        ];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    update() {
        this.angle += this.speed;
        this.y += this.floatSpeed * this.floatDirection;
        this.x += this.xSpeed;
        if (this.y > height + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = width + this.size;
    }

    draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.filter = `drop-shadow(0 0 5px ${this.color})`;
        ctx.drawImage(satelliteImage, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function initSatellites() {
    satellites = [];
    for (let i = 0; i < 25; i++) {
        satellites.push(new Satellite());
    }
}

function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    satellites.forEach(sat => {
        sat.update();
        sat.draw();
    });
    animationId = requestAnimationFrame(animate);
}

function handleVisibilityChange() {
    if (document.hidden) {
        isTabVisible = false;
        cancelAnimationFrame(animationId);
    } else {
        isTabVisible = true;
        animationId = requestAnimationFrame(animate);
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('resize', () => {
    resizeCanvas();
    initSatellites();
    animate();
});

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
