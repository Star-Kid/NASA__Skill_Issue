const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = 'index.html';
}

const componentLibrary = [
    { id: 'solar-s', name: 'Solar Panel S', category: 'panels', icon: '☀️', mass: 2.5, power: -50, color: 0x1a5490 },
    { id: 'solar-m', name: 'Solar Panel M', category: 'panels', icon: '☀️', mass: 5.0, power: -100, color: 0x1a5490 },
    { id: 'solar-l', name: 'Solar Panel L', category: 'panels', icon: '☀️', mass: 10.0, power: -200, color: 0x1a5490 },
    { id: 'dish', name: 'High-Gain Dish', category: 'antennas', icon: '📡', mass: 3.2, power: 15, color: 0xcccccc },
    { id: 'patch', name: 'Patch Antenna', category: 'antennas', icon: '📶', mass: 0.5, power: 5, color: 0xdddddd },
    { id: 'helical', name: 'Helical Antenna', category: 'antennas', icon: '🌀', mass: 1.2, power: 8, color: 0xaaaaaa },
    { id: 'star-tracker', name: 'Star Tracker', category: 'sensors', icon: '⭐', mass: 1.2, power: 8, color: 0xffaa00 },
    { id: 'sun-sensor', name: 'Sun Sensor', category: 'sensors', icon: '🔆', mass: 0.3, power: 2, color: 0xffcc00 },
    { id: 'camera', name: 'Camera', category: 'sensors', icon: '📷', mass: 2.0, power: 12, color: 0x333333 },
    { id: 'imu', name: 'IMU', category: 'sensors', icon: '🧭', mass: 0.4, power: 3, color: 0x00aa00 },
    { id: 'cold-gas', name: 'Cold Gas Thruster', category: 'thrusters', icon: '🚀', mass: 2.0, power: 20, color: 0xff6600 },
    { id: 'hall-effect', name: 'Hall Effect', category: 'thrusters', icon: '⚡', mass: 3.5, power: 150, color: 0xff0066 },
    { id: 'battery-s', name: 'Battery Pack S', category: 'power', icon: '🔋', mass: 4.0, power: 0, color: 0x00ff00 },
    { id: 'battery-m', name: 'Battery Pack M', category: 'power', icon: '🔋', mass: 8.0, power: 0, color: 0x00dd00 },
    { id: 'pdu', name: 'Power Distribution', category: 'power', icon: '⚙️', mass: 1.5, power: 5, color: 0x666666 },
    { id: 'xband', name: 'X-Band Transceiver', category: 'comms', icon: '📻', mass: 2.5, power: 25, color: 0x0080ff },
    { id: 'sband', name: 'S-Band Transceiver', category: 'comms', icon: '📡', mass: 1.8, power: 18, color: 0x00aaff },
    { id: 'bus-1u', name: '1U Bus Frame', category: 'structure', icon: '📦', mass: 1.0, power: 0, color: 0x888888 },
    { id: 'bus-3u', name: '3U Bus Frame', category: 'structure', icon: '📦', mass: 2.5, power: 0, color: 0x999999 },
    { id: 'bus-6u', name: '6U Bus Frame', category: 'structure', icon: '📦', mass: 5.0, power: 0, color: 0xaaaaaa },
    { id: 'bracket', name: 'Mount Bracket', category: 'structure', icon: '🔗', mass: 0.3, power: 0, color: 0x777777 },
];

let satellite = {
    components: [],
    uploadedModel: null,
    baseModel: null
};

let selectedComponent = null;
let scene, camera, renderer, controls, raycaster, mouse;
let componentMeshes = [];
let uploadedModelMesh = null;
let snapToGrid = true;
let gridSize = 5;
let history = [];
let historyIndex = -1;

function init() {
    setupThreeJS();
    renderComponentLibrary();
    loadSavedProject();
    updateStats();
    setupEventListeners();
    saveToHistory();
    animate();
}

function snapPosition(pos) {
    if (!snapToGrid) return pos;
    return Math.round(pos / gridSize) * gridSize;
}

function saveToHistory() {
    const state = {
        components: JSON.parse(JSON.stringify(satellite.components)),
        uploadedModel: satellite.uploadedModel
    };
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    historyIndex++;
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreFromHistory();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreFromHistory();
    }
}

function restoreFromHistory() {
    const state = history[historyIndex];
    satellite.components = state.components;
    satellite.uploadedModel = state.uploadedModel;

    // Clear current meshes
    componentMeshes.forEach(mesh => {
        if (mesh.userData.isComponent) {
            scene.remove(mesh);
            if (mesh.userData.outline) scene.remove(mesh.userData.outline);
        }
    });
    componentMeshes = componentMeshes.filter(m => !m.userData.isComponent);

    // Recreate meshes
    satellite.components.forEach(comp => {
        const mesh = createComponentGeometry(comp);
        mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
        mesh.rotation.set(comp.rotation.x, comp.rotation.y, comp.rotation.z);
        mesh.scale.setScalar(comp.scale);
        mesh.userData = { isComponent: true, component: comp, selected: false };

        const outlineGeom = mesh.geometry ? mesh.geometry.clone() : new THREE.BoxGeometry(1, 1, 1);
        const outlineMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const outline = new THREE.Mesh(outlineGeom, outlineMat);
        outline.scale.multiplyScalar(1.1);
        outline.visible = false;
        mesh.userData.outline = outline;
        mesh.add(outline);

        scene.add(mesh);
        componentMeshes.push(mesh);
    });

    updateStats();
    renderComponentLibrary();
    deselectAll();
}

function setupThreeJS() {
    const container = document.getElementById('scene-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    
    camera = new THREE.PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(15, 15, 15);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x00f5ff, 0.5);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);
    
    const gridHelper = new THREE.GridHelper(50, 50, 0x00f5ff, 0x004466);
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onCanvasClick);
}

function onWindowResize() {
    const container = document.getElementById('scene-container');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    componentMeshes.forEach(mesh => {
        if (mesh.userData.isComponent) {
            mesh.rotation.y += 0.005;
        }
    });
    
    renderer.render(scene, camera);
}

function onCanvasClick(event) {
    const container = document.getElementById('scene-container');
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(componentMeshes, true);

    if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !object.userData.isComponent && !object.userData.isUploaded) {
            object = object.parent;
        }

        if (object.userData.isComponent) {
            selectComponentMesh(object);
        } else if (object.userData.isUploaded) {
            selectUploadedModel(object);
        }
    } else {
        deselectAll();
    }
}

function selectComponentMesh(mesh) {
    deselectAll();
    selectedComponent = mesh.userData.component;
    mesh.userData.selected = true;

    if (mesh.userData.outline) {
        mesh.userData.outline.visible = true;
    }

    renderInspector();
}

function selectUploadedModel(mesh) {
    deselectAll();
    selectedComponent = { isUploaded: true, mesh: mesh };
    mesh.userData.selected = true;

    renderInspector();
}

function deselectAll() {
    selectedComponent = null;
    componentMeshes.forEach(mesh => {
        mesh.userData.selected = false;
        if (mesh.userData.outline) {
            mesh.userData.outline.visible = false;
        }
    });
    renderInspector();
}

function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', () => {
        console.log('Back button clicked');
        showNotification('Back button clicked');
        if (confirm('Leave builder? Unsaved changes will be lost.')) {
            window.location.href = 'index.html';
        }
    });
    
    document.getElementById('saveBtn').addEventListener('click', () => {
console.log('Save button clicked');
showNotification('Save button clicked');
// saveProject(); // Removed to fix error, replaced by event listener below
    });
    document.getElementById('exportBtn').addEventListener('click', () => {
        console.log('Export button clicked');
        showNotification('Export button clicked');
        document.getElementById('exportModal').style.display = 'block';
    });
    
    document.getElementById('uploadBtn').addEventListener('click', () => {
        console.log('Upload button clicked');
        showNotification('Upload button clicked');
        document.getElementById('uploadModal').style.display = 'block';
    });
    
    document.getElementById('closeUpload').addEventListener('click', () => {
        console.log('Close upload modal clicked');
        showNotification('Close upload modal clicked');
        document.getElementById('uploadModal').style.display = 'none';
    });
    
    document.getElementById('closeExport').addEventListener('click', () => {
        console.log('Close export modal clicked');
        showNotification('Close export modal clicked');
        document.getElementById('exportModal').style.display = 'none';
    });
    
    document.getElementById('exportGLB').addEventListener('click', () => {
        console.log('Export GLB clicked');
        showNotification('Export GLB clicked');
        exportGLB();
    });
    document.getElementById('exportPDF').addEventListener('click', () => {
        console.log('Export PDF clicked');
        showNotification('Export PDF clicked');
        exportPDF();
    });
    document.getElementById('exportJSON').addEventListener('click', () => {
        console.log('Export JSON clicked');
        showNotification('Export JSON clicked');
        exportJSON();
    });
    
    document.getElementById('snapBtn').addEventListener('click', () => {
        console.log('Snap button clicked');
        snapToGrid = !snapToGrid;
        const btn = document.getElementById('snapBtn');
        btn.textContent = snapToGrid ? '📐 Snap' : '📐 Free';
        btn.style.background = snapToGrid ? 'rgba(0, 245, 255, 0.1)' : 'rgba(255, 165, 0, 0.1)';
        showNotification(snapToGrid ? 'Snap to grid enabled' : 'Free placement enabled');
    });

    document.getElementById('undoBtn').addEventListener('click', () => {
        console.log('Undo button clicked');
        undo();
        showNotification('Undid last action');
    });

    document.getElementById('redoBtn').addEventListener('click', () => {
        console.log('Redo button clicked');
        redo();
        showNotification('Redid last action');
    });
    
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        console.log('File input changed');
        showNotification('File input changed');
        handleFileUpload(e);
    });
    
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            console.log('File dropped');
            showNotification('File dropped');
            handleFile(file);
        }
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Tab button clicked');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.dataset.category;
            renderComponentLibrary(category);
        });
    });
}

function renderComponentLibrary(category = 'all') {
    const grid = document.getElementById('componentsGrid');
    grid.innerHTML = '';
    
    const filtered = category === 'all' 
        ? componentLibrary 
        : componentLibrary.filter(c => c.category === category);
    
    filtered.forEach(comp => {
        const card = document.createElement('div');
        card.className = 'component-card';
        
        const isAdded = satellite.components.some(sc => sc.id === comp.id);
        if (isAdded) card.classList.add('added');
        
        card.innerHTML = `
            <div class="component-icon">${comp.icon}</div>
            <div class="component-name">${comp.name}</div>
            <div class="component-specs">
                ${comp.mass}kg • ${comp.power > 0 ? '+' : ''}${comp.power}W
            </div>
        `;
        
        card.addEventListener('click', () => addComponent(comp));
        grid.appendChild(card);
    });
}

function createComponentGeometry(comp) {
    let geometry;
    
    switch(comp.category) {
        case 'panels':
            geometry = new THREE.BoxGeometry(3, 0.1, 1.5);
            break;
        case 'antennas':
            const dish = new THREE.Group();
            const dishGeom = new THREE.ConeGeometry(0.5, 0.8, 16);
            const dishMesh = new THREE.Mesh(dishGeom, new THREE.MeshStandardMaterial({ color: comp.color }));
            dishMesh.rotation.x = Math.PI;
            dish.add(dishMesh);
            const poleGeom = new THREE.CylinderGeometry(0.05, 0.05, 1);
            const poleMesh = new THREE.Mesh(poleGeom, new THREE.MeshStandardMaterial({ color: 0x666666 }));
            poleMesh.position.y = -1;
            dish.add(poleMesh);
            return dish;
        case 'sensors':
            geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            break;
        case 'thrusters':
            geometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
            break;
        case 'power':
            geometry = new THREE.BoxGeometry(1, 0.8, 0.6);
            break;
        case 'comms':
            geometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
            break;
        case 'structure':
            geometry = new THREE.BoxGeometry(2, 2, 2);
            break;
        default:
            geometry = new THREE.SphereGeometry(0.5, 16, 16);
    }
    
    const material = new THREE.MeshStandardMaterial({ 
        color: comp.color,
        metalness: 0.5,
        roughness: 0.3
    });
    
    return new THREE.Mesh(geometry, material);
}

function addComponent(comp) {
    const componentCount = satellite.components.length;
    const newComp = {
        ...comp,
        instanceId: Date.now() + Math.random(),
        position: {
            x: snapPosition(componentCount * 5),
            y: snapPosition(0),
            z: snapPosition(0)
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1
    };

    satellite.components.push(newComp);

    const mesh = createComponentGeometry(newComp);
    if (mesh.isGroup) {
        mesh.position.set(newComp.position.x, newComp.position.y, newComp.position.z);
    } else {
        mesh.position.set(newComp.position.x, newComp.position.y, newComp.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    mesh.userData = {
        isComponent: true,
        component: newComp,
        selected: false
    };

    const outlineGeom = mesh.geometry ? mesh.geometry.clone() : new THREE.BoxGeometry(1, 1, 1);
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const outline = new THREE.Mesh(outlineGeom, outlineMat);
    outline.scale.multiplyScalar(1.1);
    outline.visible = false;
    mesh.userData.outline = outline;
    mesh.add(outline);

    scene.add(mesh);
    componentMeshes.push(mesh);

    saveToHistory();
    updateStats();
    renderComponentLibrary(document.querySelector('.tab-btn.active')?.dataset.category || 'all');
    showNotification(`${comp.name} added!`);
}

function renderInspector() {
    const content = document.getElementById('inspectorContent');

    if (!selectedComponent) {
        content.innerHTML = '<div class="no-selection"><p>Select a component or uploaded model to edit</p></div>';
        return;
    }

    if (selectedComponent.isUploaded) {
        // Inspector for uploaded models
        const mesh = selectedComponent.mesh;
        content.innerHTML = `
            <div class="property-group">
                <label class="property-label">Uploaded Model</label>
                <input type="text" class="property-input" value="${satellite.uploadedModel?.name || 'Unknown'}" readonly>
            </div>

            <div class="property-group">
                <label class="property-label">Position X <span class="slider-value" id="posXVal">${mesh.position.x.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="posX" min="-50" max="50" value="${mesh.position.x}" step="1">
            </div>

            <div class="property-group">
                <label class="property-label">Position Y <span class="slider-value" id="posYVal">${mesh.position.y.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="posY" min="-50" max="50" value="${mesh.position.y}" step="1">
            </div>

            <button class="delete-btn" id="deleteModel">🗑️ Remove Model</button>
        `;

        document.getElementById('posX').addEventListener('input', (e) => {
            mesh.position.x = parseFloat(e.target.value);
            document.getElementById('posXVal').textContent = mesh.position.x.toFixed(1);
        });

        document.getElementById('posY').addEventListener('input', (e) => {
            mesh.position.y = parseFloat(e.target.value);
            document.getElementById('posYVal').textContent = mesh.position.y.toFixed(1);
        });

        document.getElementById('deleteModel').addEventListener('click', () => {
            scene.remove(mesh);
            componentMeshes = componentMeshes.filter(m => m !== mesh);
            satellite.uploadedModel = null;
            uploadedModelMesh = null;
            selectedComponent = null;
            updateStats();
            renderInspector();
            showNotification('Model removed');
        });
    } else {
        // Inspector for components
        content.innerHTML = `
            <div class="property-group">
                <label class="property-label">Component</label>
                <input type="text" class="property-input" value="${selectedComponent.name}" readonly>
            </div>

            <div class="property-group">
                <label class="property-label">Position X <span class="slider-value" id="posXVal">${selectedComponent.position.x.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="posX" min="-20" max="20" value="${selectedComponent.position.x}" step="0.5">
            </div>

            <div class="property-group">
                <label class="property-label">Position Y <span class="slider-value" id="posYVal">${selectedComponent.position.y.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="posY" min="-20" max="20" value="${selectedComponent.position.y}" step="0.5">
            </div>

            <div class="property-group">
                <label class="property-label">Position Z <span class="slider-value" id="posZVal">${selectedComponent.position.z.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="posZ" min="-20" max="20" value="${selectedComponent.position.z}" step="0.5">
            </div>

            <div class="property-group">
                <label class="property-label">Rotation Y <span class="slider-value" id="rotYVal">${(selectedComponent.rotation.y * 180 / Math.PI).toFixed(0)}°</span></label>
                <input type="range" class="property-slider" id="rotY" min="0" max="360" value="${selectedComponent.rotation.y * 180 / Math.PI}" step="15">
            </div>

            <div class="property-group">
                <label class="property-label">Scale <span class="slider-value" id="scaleVal">${selectedComponent.scale.toFixed(1)}</span></label>
                <input type="range" class="property-slider" id="scale" min="0.5" max="3" value="${selectedComponent.scale}" step="0.1">
            </div>

            <button class="delete-btn" id="deleteComp">🗑️ Remove Component</button>
        `;

        const mesh = componentMeshes.find(m => m.userData.component?.instanceId === selectedComponent.instanceId);

        document.getElementById('posX').addEventListener('input', (e) => {
            selectedComponent.position.x = snapPosition(parseFloat(e.target.value));
            document.getElementById('posXVal').textContent = selectedComponent.position.x.toFixed(1);
            if (mesh) mesh.position.x = selectedComponent.position.x;
            saveToHistory();
        });

        document.getElementById('posY').addEventListener('input', (e) => {
            selectedComponent.position.y = snapPosition(parseFloat(e.target.value));
            document.getElementById('posYVal').textContent = selectedComponent.position.y.toFixed(1);
            if (mesh) mesh.position.y = selectedComponent.position.y;
            saveToHistory();
        });

        document.getElementById('posZ').addEventListener('input', (e) => {
            selectedComponent.position.z = snapPosition(parseFloat(e.target.value));
            document.getElementById('posZVal').textContent = selectedComponent.position.z.toFixed(1);
            if (mesh) mesh.position.z = selectedComponent.position.z;
            saveToHistory();
        });

        document.getElementById('rotY').addEventListener('input', (e) => {
            const degrees = parseFloat(e.target.value);
            selectedComponent.rotation.y = degrees * Math.PI / 180;
            document.getElementById('rotYVal').textContent = degrees.toFixed(0) + '°';
            if (mesh) mesh.rotation.y = selectedComponent.rotation.y;
        });

        document.getElementById('scale').addEventListener('input', (e) => {
            selectedComponent.scale = parseFloat(e.target.value);
            document.getElementById('scaleVal').textContent = selectedComponent.scale.toFixed(1);
            if (mesh) mesh.scale.setScalar(selectedComponent.scale);
        });

        document.getElementById('deleteComp').addEventListener('click', () => {
            satellite.components = satellite.components.filter(c => c.instanceId !== selectedComponent.instanceId);
            if (mesh) {
                scene.remove(mesh);
                if (mesh.userData.outline) scene.remove(mesh.userData.outline);
                componentMeshes = componentMeshes.filter(m => m !== mesh);
            }
            selectedComponent = null;
            saveToHistory();
            updateStats();
            renderInspector();
            renderComponentLibrary(document.querySelector('.tab-btn.active')?.dataset.category || 'all');
            showNotification('Component removed');
        });
    }
}

function updateStats() {
    const totalMass = satellite.components.reduce((sum, c) => sum + c.mass, 0);
    const totalPowerDraw = satellite.components.reduce((sum, c) => sum + (c.power > 0 ? c.power : 0), 0);
    const totalPowerGen = Math.abs(satellite.components.reduce((sum, c) => sum + (c.power < 0 ? c.power : 0), 0));
    const powerBudget = totalPowerGen - totalPowerDraw;
    
    document.getElementById('totalMass').textContent = `${totalMass.toFixed(1)} kg`;
    document.getElementById('totalPower').textContent = `${totalPowerDraw.toFixed(0)} W`;
    document.getElementById('partCount').textContent = satellite.components.length;
    
    const budgetEl = document.getElementById('powerBudget');
    budgetEl.textContent = `${powerBudget.toFixed(0)} W`;
    budgetEl.className = powerBudget > 0 ? 'budget-positive' : powerBudget < 0 ? 'budget-negative' : 'budget-neutral';
    
    validateSatellite(totalMass, powerBudget);
}

function validateSatellite(mass, powerBudget) {
    const validationList = document.getElementById('validationList');
    const validations = [];
    
    if (powerBudget >= 0) {
        validations.push({ type: 'success', msg: '✓ Power budget is positive' });
    } else {
        validations.push({ type: 'error', msg: '✗ Negative power budget!' });
    }
    
    if (mass <= 50) {
        validations.push({ type: 'success', msg: '✓ Mass within limits' });
    } else {
        validations.push({ type: 'warning', msg: '⚠ Mass exceeds 50kg' });
    }
    
    const hasComms = satellite.components.some(c => c.category === 'comms');
    if (hasComms) {
        validations.push({ type: 'success', msg: '✓ Communications present' });
    } else {
        validations.push({ type: 'warning', msg: '⚠ No comms module' });
    }
    
    const hasSensors = satellite.components.some(c => c.category === 'sensors');
    if (hasSensors) {
        validations.push({ type: 'success', msg: '✓ Sensors present' });
    } else {
        validations.push({ type: 'warning', msg: '⚠ No attitude sensors' });
    }
    
    const hasPower = satellite.components.some(c => c.category === 'power' || c.category === 'panels');
    if (hasPower) {
        validations.push({ type: 'success', msg: '✓ Power system present' });
    } else {
        validations.push({ type: 'error', msg: '✗ No power system!' });
    }
    
    validationList.innerHTML = validations.map(v => 
        `<div class="validation-item ${v.type}">${v.msg}</div>`
    ).join('');
}

function saveSceneToJSON() {
    return new Promise((resolve, reject) => {
        if (!scene) {
            reject('No scene to export');
            return;
        }
        const exporter = new THREE.GLTFExporter();
        exporter.parse(scene, (gltf) => {
            resolve(gltf);
        }, { binary: false });
    });
}

document.getElementById('saveBtn').addEventListener('click', async () => {
    const projectName = prompt('Enter project name:', 'My Satellite');
    if (!projectName) {
        alert('Project name is required to save.');
        return;
    }
    try {
        const sceneData = await saveSceneToJSON();
        const projectData = {
            name: projectName,
            timestamp: new Date().toISOString(),
            sceneData: sceneData
        };
        const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
        projects.push(projectData);
        localStorage.setItem('satelliteProjects', JSON.stringify(projects));
        showNotification(`Satellite design "${projectName}" saved to My Workshop!`);
    } catch (error) {
        alert('Failed to export scene data.');
        console.error('Error exporting scene:', error);
    }
});

// Optional: Load project by index from satelliteProjects
function loadProjectByIndex(index) {
    const projects = JSON.parse(localStorage.getItem('satelliteProjects') || '[]');
    if (index < 0 || index >= projects.length) {
        alert('Invalid project index');
        return;
    }
    const project = projects[index];
    if (!project || !project.sceneData) {
        alert('Project data is invalid');
        return;
    }
    // TODO: Implement scene loading from project.sceneData
    alert(`Loaded project: ${project.name} (loading scene not implemented)`);
}

function loadSavedProject() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('satellite_project_'));
    if (keys.length > 0) {
        const lastProject = localStorage.getItem(keys[keys.length - 1]);
        if (lastProject) {
            const project = JSON.parse(lastProject);
            if (confirm(`Load project "${project.name}"?`)) {
                satellite = project.satellite;
                
                satellite.components.forEach(comp => {
                    // Ensure component has required properties
                    if (!comp.position) comp.position = { x: 0, y: 0, z: 0 };
                    if (!comp.rotation) comp.rotation = { x: 0, y: 0, z: 0 };
                    if (!comp.scale) comp.scale = 1;

                    const mesh = createComponentGeometry(comp);
                    mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
                    mesh.rotation.set(comp.rotation.x, comp.rotation.y, comp.rotation.z);
                    mesh.scale.setScalar(comp.scale);
                    mesh.userData = { isComponent: true, component: comp, selected: false };

                    const outlineGeom = mesh.geometry ? mesh.geometry.clone() : new THREE.BoxGeometry(1, 1, 1);
                    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
                    const outline = new THREE.Mesh(outlineGeom, outlineMat);
                    outline.scale.multiplyScalar(1.1);
                    outline.visible = false;
                    mesh.userData.outline = outline;
                    mesh.add(outline);

                    scene.add(mesh);
                    componentMeshes.push(mesh);
                });
                
                updateStats();
                renderComponentLibrary();
            }
        }
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    const validExtensions = ['.glb', '.gltf', '.obj'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
        showNotification('❌ Unsupported format. Use .glb, .gltf, or .obj');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        showNotification('❌ File too large (max 50MB)');
        return;
    }
    
    showNotification('⏳ Loading model...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = e.target.result;
        
        if (ext === '.glb' || ext === '.gltf') {
            const loader = new THREE.GLTFLoader();
            loader.parse(data, '', (gltf) => {
                loadUploadedModel(gltf.scene, file.name);
            }, (error) => {
                console.error('Error loading GLTF:', error);
                showNotification('❌ Failed to load model');
            });
        } else if (ext === '.obj') {
            const loader = new THREE.OBJLoader();
            const objData = new TextDecoder().decode(data);
            const object = loader.parse(objData);
            loadUploadedModel(object, file.name);
        }
    };
    
    if (ext === '.glb') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function loadUploadedModel(model, filename) {
    if (uploadedModelMesh) {
        scene.remove(uploadedModelMesh);
    }
    
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 10 / maxDim;
    
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.userData = { isUploaded: true };
    
    scene.add(model);
    uploadedModelMesh = model;
    componentMeshes.push(model);
    
    satellite.uploadedModel = {
        name: filename,
        loaded: true
    };
    
    document.getElementById('uploadModal').style.display = 'none';
    showNotification(`✅ ${filename} loaded!`);
}

function exportGLB() {
    const exporter = new THREE.GLTFExporter();
    
    const exportScene = new THREE.Scene();
    
    if (uploadedModelMesh) {
        exportScene.add(uploadedModelMesh.clone());
    }
    
    componentMeshes.forEach(mesh => {
        if (mesh.userData.isComponent) {
            exportScene.add(mesh.clone());
        }
    });
    
    exporter.parse(exportScene, (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'satellite-export.gltf';
        a.click();
        URL.revokeObjectURL(url);
        showNotification('✅ GLB exported!');
        document.getElementById('exportModal').style.display = 'none';
    }, { binary: false });
}

function exportPDF() {
    const totalMass = satellite.components.reduce((sum, c) => sum + c.mass, 0);
    const totalPowerDraw = satellite.components.reduce((sum, c) => sum + (c.power > 0 ? c.power : 0), 0);
    const totalPowerGen = Math.abs(satellite.components.reduce((sum, c) => sum + (c.power < 0 ? c.power : 0), 0));
    const powerBudget = totalPowerGen - totalPowerDraw;
    
    let report = `SATELLITE BUILD REPORT\n`;
    report += `==========================================\n\n`;
    report += `User: ${currentUser.username}\n`;
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `Project: ${satellite.uploadedModel?.name || 'Custom Satellite'}\n\n`;
    report += `SPECIFICATIONS:\n`;
    report += `  Total Mass: ${totalMass.toFixed(2)} kg\n`;
    report += `  Power Draw: ${totalPowerDraw.toFixed(0)} W\n`;
    report += `  Power Generation: ${totalPowerGen.toFixed(0)} W\n`;
    report += `  Power Budget: ${powerBudget.toFixed(0)} W ${powerBudget >= 0 ? '✓' : '✗'}\n`;
    report += `  Component Count: ${satellite.components.length}\n\n`;
    report += `COMPONENT LIST:\n`;
    report += `==========================================\n`;
    satellite.components.forEach((c, i) => {
        report += `${i + 1}. ${c.name}\n`;
        report += `   Category: ${c.category}\n`;
        report += `   Mass: ${c.mass} kg\n`;
        report += `   Power: ${c.power} W\n`;
        report += `   Position: (${c.position.x.toFixed(1)}, ${c.position.y.toFixed(1)}, ${c.position.z.toFixed(1)})\n\n`;
    });
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'satellite-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('✅ Report exported!');
    document.getElementById('exportModal').style.display = 'none';
}

function exportJSON() { 
    const data = JSON.stringify(satellite, null, 2);
     const blob = new Blob([data], { type: 'application/json' }); 
     const url = URL.createObjectURL(blob); 
     const a = document.createElement('a'); 
     a.href = url; a.download = 'satellite-config.json'; 
     a.click(); URL.revokeObjectURL(url); 
     fetch('http://localhost:3000/api/save-satellite', 
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data })
         .then(response => response.json()) 
         .then(result => { console.log('Saved to DB:', result);
             showNotification('✅ Configuration exported and saved to database!'); }) 
             .catch(error => { console.error('Error saving to DB:', error); 
                showNotification('❌ Configuration exported but failed to save to database'); });
            }

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, rgba(0, 245, 255, 0.9), rgba(0, 128, 255, 0.9));
        color: #000;
        padding: 20px 30px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 3000;
        box-shadow: 0 5px 30px rgba(0, 245, 255, 0.5);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', message, 'at', source + ':' + lineno + ':' + colno);
    showNotification('❌ Error: ' + message + ' (See console)');
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});