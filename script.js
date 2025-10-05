 // SatelliteForge unified script.js

let currentUser = null;
let isSignup = true;
let lastFocusedElement = null;

// --------- Smooth scroll for in-page anchors ---------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

// ----------------- AUTH -----------------
function openAuthModal(signupMode) {
  isSignup = !!signupMode;
  const authModal = document.getElementById('authModal');
  updateAuthModal();
  if (authModal) {
    authModal.style.display = 'block';
    authModal.setAttribute('aria-hidden', 'false');
  }
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
    users.push({ username, email, password }); // demo only
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
      userDiv.innerHTML = `<span>Welcome, ${currentUser}!</span>
        <button id="logoutBtn" style="background:none;border:none;color:var(--text-color);cursor:pointer;padding:10px 15px;">Logout</button>`;
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

function addTestProject() {
  const testProject = {
    name: 'Test Satellite Project',
    components: [
      { name: 'Core', quantity: 1 },
      { name: 'Solar Panel', quantity: 2 },
      { name: 'Antenna', quantity: 1 }
    ],
    createdAt: new Date().toISOString()
  };
  let projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
  projects.push(testProject);
  localStorage.setItem('satelliteProjects', JSON.stringify(projects));
  alert('Test project added to My Workshop. Open My Workshop to see it.');
}

// ----------------- WORKSHOP DROPDOWN -----------------
function openWorkshopDropdown() {
  lastFocusedElement = document.activeElement;
  const workshopDropdown = document.getElementById('workshopDropdown');
  if (workshopDropdown) {
    workshopDropdown.style.display = 'block';
    document.body.style.overflow = 'hidden';
    workshopDropdown.setAttribute('aria-hidden', 'false');
    // Enable scrolling inside modal
    workshopDropdown.style.overflowY = 'auto';
  }
}

function closeWorkshopDropdown() {
  const workshopDropdown = document.getElementById('workshopDropdown');
  if (workshopDropdown) {
    workshopDropdown.style.display = 'none';
    document.body.style.overflow = 'auto'; // Ensure scroll is restored
    workshopDropdown.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement) lastFocusedElement.focus();
  }
}

function loadProjects() {
  const projectList = document.getElementById('projectList');
  if (!projectList) {
    console.error('projectList element not found');
    return;
  }
  projectList.innerHTML = '';
  // Load all projects with keys starting with 'satellite_project_'
  const keys = Object.keys(localStorage).filter(k => k.startsWith('satellite_project_'));
  if (keys.length === 0) {
    projectList.innerHTML = '<li>No saved projects yet.</li>';
    return;
  }
  const projects = keys.map(k => JSON.parse(localStorage.getItem(k)));
  console.log('Loaded projects from localStorage:', projects);
  projects.forEach((project, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${project.name || 'Unnamed Project'}</span>
      <button data-action="load" data-key="${keys[index]}">Load</button>
      <button data-action="delete" data-key="${keys[index]}">Delete</button>`;
    projectList.appendChild(li);
  });
  projectList.querySelectorAll('button[data-action="load"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.currentTarget.getAttribute('data-key');
      loadSavedProject(key);
      closeWorkshopDropdown(); // Close modal immediately on load
    });
  });
  projectList.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.currentTarget.getAttribute('data-key');
      deleteProject(key);
    });
  });
}

function loadSavedProject(key) {
  const projectStr = localStorage.getItem(key);
  if (projectStr) {
    const project = JSON.parse(projectStr);
    localStorage.setItem('currentProject', projectStr);
    window.location.href = 'builder.html';
  }
}

function deleteProject(key) {
  localStorage.removeItem(key);
  loadProjects();
}

function loadSavedProject(index) {
  // This function is now replaced by loadSavedProject(key)
  // Remove this old function to avoid confusion
}

function deleteProject(index) {
  const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
  projects.splice(index, 1);
  localStorage.setItem('satelliteProjects', JSON.stringify(projects));
  loadProjects();
}

// ----------------- THEME -----------------
function initThemeSelector() {
  const themeSelector = document.getElementById('themeSelector');
  if (!themeSelector) return;
  const savedTheme = localStorage.getItem('selectedTheme') || 'space';
  document.body.setAttribute('data-theme', savedTheme);
  themeSelector.value = savedTheme;
  themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    document.body.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('selectedTheme', selectedTheme);
  });
}

// ----------------- CANVAS ANIMATION -----------------
const canvas = document.getElementById('satelliteCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width, height, animationId;
let satellites = [];
let satelliteImage = new Image();

function resizeCanvas() {
  if (!canvas) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

const COMPONENTS = [
  { name: 'Core', cost: 5000, mass: 50 },
  { name: 'Solar Panel', cost: 2000, mass: 20 },
  { name: 'Antenna', cost: 1500, mass: 10 },
  { name: 'Battery', cost: 3000, mass: 30 },
  { name: 'Thruster', cost: 4000, mass: 40 }
];

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
    this.colors = [
      'rgba(138, 43, 226, 0.6)',
      'rgba(75, 0, 130, 0.6)',
      'rgba(0, 191, 255, 0.6)',
      'rgba(0, 255, 255, 0.6)',
      'rgba(255, 0, 255, 0.6)',
      'rgba(148, 0, 211, 0.6)'
    ];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    // Assign random components to this satellite
    this.components = [];
    const compCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 components
    for (let i = 0; i < compCount; i++) {
      const comp = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];
      this.components.push(comp);
    }
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
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.filter = `drop-shadow(0 0 5px ${this.color})`;
    ctx.drawImage(satelliteImage, -this.size/2, -this.size/2, this.size, this.size);
    ctx.restore();
  }
  getTotalCost() {
    return this.components.reduce((sum, c) => sum + c.cost, 0);
  }
  getTotalMass() {
    return this.components.reduce((sum, c) => sum + c.mass, 0);
  }
}
function initSatellites() {
  satellites = [];
  for (let i = 0; i < 25; i++) satellites.push(new Satellite());
}
function animate() {
  ctx.clearRect(0, 0, width, height);
  satellites.forEach(s => { 
    s.update(); 
    s.draw(); 
  });
  updateSatelliteStats();
  animationId = requestAnimationFrame(animate);
}

function updateSatelliteStats() {
  const statsDiv = document.getElementById('satelliteStats');
  if (!statsDiv) return;
  let totalCost = 0;
  let totalMass = 0;
  satellites.forEach(sat => {
    totalCost += sat.getTotalCost();
    totalMass += sat.getTotalMass();
  });
  statsDiv.textContent = `Total Cost: $${totalCost.toLocaleString()} | Total Mass: ${totalMass.toFixed(1)} kg`;
}
function handleVisibilityChange() {
  if (document.hidden) cancelAnimationFrame(animationId);
  else animationId = requestAnimationFrame(animate);
}

// ----------------- PURCHASE FLOW -----------------
function initPurchaseFlow() {
  const purchaseModal = document.getElementById('purchaseModal');
  const purchaseDetails = document.getElementById('purchaseDetails');
  const paymentForm = document.getElementById('paymentForm');
  const purchaseBtns = document.querySelectorAll('.purchase-btn');

  purchaseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pkg = btn.getAttribute('data-package');
      purchaseDetails.innerHTML = `<p>You selected the <strong>${pkg}</strong> package.</p>`;
      purchaseModal.style.display = 'block';
      purchaseModal.setAttribute('aria-hidden', 'false');
    });
  });

  if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Payment submitted! (demo only)');
      purchaseModal.style.display = 'none';
      purchaseModal.setAttribute('aria-hidden', 'true');
    });
  }
}

// ----------------- BUILD BUTTON -----------------
function initBuildButton() {
  const buildBtn = document.getElementById('buildBtn');
  if (buildBtn) {
    buildBtn.addEventListener('click', () => {
      window.location.href = 'builder.html';
    });
  }
}

// ----------------- MODAL CLOSE HANDLERS -----------------
function initModalCloseHandlers() {
  document.querySelectorAll('.modal .close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });
  window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach(modal => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    }
  });
}

// ----------------- PAGE LOAD -----------------
document.addEventListener('DOMContentLoaded', () => {
  // Auth
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

  // Workshop dropdown
  const yourWorkspaceLink = document.getElementById('yourWorkspaceLink');
  const workshopDropdown = document.getElementById('workshopDropdown');
  if (yourWorkspaceLink) {
    yourWorkspaceLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (!currentUser) { openAuthModal(false); return; }
      loadProjects();
      openWorkshopDropdown();
    });
  }

  // Global modal handlers
  initModalCloseHandlers();

  // Theme
  initThemeSelector();

  // Canvas animation
  satelliteImage.src = 'final.png';
  satelliteImage.onload = () => {
    resizeCanvas();
    initSatellites();
    animate();
  };
  satelliteImage.onerror = () => console.error('Failed to load satellite image');
  window.addEventListener('resize', () => { resizeCanvas(); initSatellites(); });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Purchase flow + build button
  initPurchaseFlow();
  initBuildButton();

  // Manufacturing entrance animations
  const boxes = document.querySelectorAll('.module-box');
  boxes.forEach((box, index) => {
    setTimeout(() => {
      box.style.opacity = '1';
      box.style.transform = 'translateY(0)';
    }, index * 200);
  });
  setTimeout(() => {
    const arms = document.querySelector('.robotic-arms');
    if (arms) {
      arms.style.opacity = '1';
      arms.style.transform = 'translateY(0)';
    }
  }, 600);
  setTimeout(() => {
    const buildBtn = document.querySelector('.build-button-rect');
    if (buildBtn) {
      buildBtn.style.opacity = '1';
      buildBtn.style.transform = 'scale(1)';
    }
  }, 800);
});
