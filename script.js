let currentUser = null;
let userPackage = null;
let buildsRemaining = 0;

const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authModal = document.getElementById('authModal');
const purchaseModal = document.getElementById('purchaseModal');
const buildBtn = document.getElementById('buildBtn');
const buildStatus = document.getElementById('buildStatus');
const authForm = document.getElementById('authForm');
const paymentForm = document.getElementById('paymentForm');
const toggleAuth = document.getElementById('toggleAuth');
const modalTitle = document.getElementById('modalTitle');
const toggleText = document.getElementById('toggleText');
const roboticArms = document.getElementById('roboticArms');
const closeBtns = document.querySelectorAll('.close');
const purchaseBtns = document.querySelectorAll('.purchase-btn');

const workspaceModal = document.getElementById('workspaceModal');
const yourWorkspaceLink = document.getElementById('yourWorkspaceLink');
const closeWorkspaceModal = document.getElementById('closeWorkspaceModal');
const projectList = document.getElementById('projectList');

let isSignup = true;
let lastFocusedElement = null;

function updateAuthModal() {
    const emailField = document.getElementById('emailField');
    if (isSignup) {
        modalTitle.textContent = 'Sign Up';
        if (emailField) emailField.style.display = 'block';
        toggleText.textContent = 'Already have an account?';
        toggleAuth.textContent = 'Log In';
    } else {
        modalTitle.textContent = 'Log In';
        if (emailField) emailField.style.display = 'none';
        toggleText.textContent = "Don't have an account?";
        toggleAuth.textContent = 'Sign Up';
    }
}

// Close modal functionality
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        modal.style.display = 'none';
    });
});

// Canvas satellite animation setup
const canvas = document.getElementById('satelliteCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let satellites = [];
let animationId;
let isTabVisible = true;

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

console.log('script.js loaded');

const satelliteImage = new Image();
satelliteImage.src = 'https://www.freeiconspng.com/uploads/space-satellite-png-10.png';

satelliteImage.onerror = () => {
    console.error('Failed to load satellite image');
};

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
        // Galaxy colors: purples, blues, cyans
        this.colors = [
            'rgba(138, 43, 226, 0.6)', // Blue Violet
            'rgba(75, 0, 130, 0.6)',   // Indigo
            'rgba(0, 191, 255, 0.6)',  // Deep Sky Blue
            'rgba(0, 255, 255, 0.6)',  // Cyan
            'rgba(255, 0, 255, 0.6)',  // Magenta
            'rgba(148, 0, 211, 0.6)'   // Dark Violet
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw satellite image with tint
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

// Modal accessibility and close logic for workspaceModal
function openWorkspaceModal() {
    lastFocusedElement = document.activeElement;
    workspaceModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    workspaceModal.setAttribute('aria-hidden', 'false');
    trapFocus(workspaceModal);
}

function closeWorkspaceModalFunc() {
    workspaceModal.style.display = 'none';
    document.body.style.overflow = '';
    workspaceModal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement) lastFocusedElement.focus();
}

yourWorkspaceLink.addEventListener('click', (e) => {
    e.preventDefault();
    loadProjects();
    openWorkspaceModal();
});

closeWorkspaceModal.addEventListener('click', () => {
    closeWorkspaceModalFunc();
});

window.addEventListener('click', (e) => {
    if (e.target === workspaceModal) {
        closeWorkspaceModalFunc();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && workspaceModal.style.display === 'block') {
        closeWorkspaceModalFunc();
    }
});

// Focus trap implementation
function trapFocus(element) {
    const focusableElements = element.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });

    firstFocusable.focus();
}

function loadProjects() {
    projectList.innerHTML = '';
    const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
    if (projects.length === 0) {
        projectList.innerHTML = '<li>No saved projects yet.</li>';
        return;
    }
    projects.forEach((project, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${project.name || 'Unnamed Project'}</span>
            <button onclick="loadSavedProject(${index})">Load</button>
            <button onclick="deleteProject(${index})">Delete</button>
        `;
        projectList.appendChild(li);
    });
}

function loadSavedProject(index) {
    const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
    if (projects[index]) {
        localStorage.setItem('currentProject', JSON.stringify(projects[index]));
        window.location.href = 'builder.html';
    }
}

function deleteProject(index) {
    const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
    projects.splice(index, 1);
    localStorage.setItem('satelliteProjects', JSON.stringify(projects));
    loadProjects();
}

// Existing code for authModal, purchaseModal, build button, etc. remains unchanged...

function startAnimation() {
    console.log('Starting animation');
    resizeCanvas();
    initSatellites();
    animate();
}

satelliteImage.onload = () => {
    console.log('Satellite image loaded');
    startAnimation();
};

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('resize', () => {
    resizeCanvas();
    initSatellites();
});

// Removed direct call to startAnimation();
// startAnimation();

// Fix build button navigation
if (typeof window !== 'undefined') {
    const buildBtn = document.getElementById('buildBtn');
    if (buildBtn) {
        buildBtn.addEventListener('click', () => {
            window.location.href = 'builder.html';
        });
    }
}

// Theme selector functionality
const themeSelector = document.getElementById('themeSelector');
if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.body.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('selectedTheme', selectedTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('selectedTheme') || 'space';
    document.body.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;
}

// Fix login and signup buttons functionality
if (typeof window !== 'undefined') {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const authModal = document.getElementById('authModal');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            authModal.style.display = 'block';
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            authModal.style.display = 'block';
        });
    }
}
