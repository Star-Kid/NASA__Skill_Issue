// Workshop dropdown
  const workshopDropdown = document.getElementById('workshopDropdown');
  const yourWorkspaceLink = document.getElementById('yourWorkspaceLink');
  const projectList = document.getElementById('projectList');
  let lastFocusedElement = null;

  function openWorkshopDropdown() {
    lastFocusedElement = document.activeElement;
    if (workshopDropdown) {
      workshopDropdown.style.display = 'block';
      document.body.style.overflow = 'hidden';
      workshopDropdown.setAttribute('aria-hidden', 'false');
    }
  }

  function closeWorkshopDropdown() {
    if (workshopDropdown) {
      workshopDropdown.style.display = 'none';
      document.body.style.overflow = '';
      workshopDropdown.setAttribute('aria-hidden', 'true');
      if (lastFocusedElement) lastFocusedElement.focus();
    }
  }

  if (yourWorkspaceLink) {
    yourWorkspaceLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (!currentUser) {
        openAuthModal(false);
        return;
      }
      loadProjects();
      openWorkshopDropdown();
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === workshopDropdown) {
      closeWorkshopDropdown();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && workshopDropdown && workshopDropdown.style.display === 'block') {
      closeWorkshopDropdown();
    }
  });

  // Satellite animation setup
  const satelliteImage = new Image();
  satelliteImage.src = 'final.png';

  satelliteImage.onload = () => {
    resizeCanvas();
    initSatellites();
    animate();
  };

  satelliteImage.onerror = () => {
    console.error('Failed to load satellite image');
  };

  // Build button navigation
  const buildBtn = document.getElementById('buildBtn');
  if (buildBtn) {
    buildBtn.addEventListener('click', () => {
      window.location.href = 'builder.html';
    });
  }

  // Theme selector
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

function loadProjects() {
  const projectList = document.getElementById('projectList');
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

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('resize', () => {
  resizeCanvas();
  initSatellites();
});
create_file>

<ask_followup_question>
<question>
I have provided chunk 2 of the corrected script.js file including workshop dropdown, satellite animation, theme selector, and project loading functions.

Please replace this chunk in your script.js after chunk 1 and confirm when done.
</question>
</ask_followup_question>
