let config = {};
const loginDialog = document.getElementById('loginDialog');
const adminDialog = document.getElementById('adminDialog');
const classLinksDiv = document.getElementById('classLinks');
const adminForm = document.getElementById('adminForm');
const adminErrorDiv = document.getElementById('adminError');
const adminSuccessDiv = document.getElementById('adminSuccess');

// Function to load configuration from config.json
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        renderClassLinks();
    } catch (error) {
        console.error('Error loading config:', error);
        classLinksDiv.innerHTML = '<p class="error">Failed to load exam links.</p>';
    }
}

// Function to render the class links based on the loaded config
function renderClassLinks() {
    classLinksDiv.innerHTML = '';
    for (const classKey in config) {
        if (config.hasOwnProperty(classKey)) {
            const classTitleText = classKey.replace(/_/g, ' ').toUpperCase();
            const classDiv = document.createElement('div');
            classDiv.classList.add('class-title');
            classDiv.textContent = classTitleText;
            classLinksDiv.appendChild(classDiv);

            config[classKey].forEach(exam => {
                const link = document.createElement('a');
                link.href = '#';
                link.classList.add('exam-link');
                link.textContent = exam.name ? exam.name.toUpperCase() : 'EXAM';
                link.onclick = () => openLogin(classKey, exam.id);
                classDiv.appendChild(link);
            });
        }
    }

    // Add a hidden admin link (can be made more secure with a key combination)
    const adminLink = document.createElement('a');
    adminLink.href = '#';
    adminLink.textContent = 'Admin';
    adminLink.style.display = 'none'; // Initially hidden
    adminLink.onclick = openAdmin;
    document.body.appendChild(adminLink);

    // You can trigger the admin panel with a specific key combination, e.g., holding Ctrl+Shift and pressing 'a'
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'a') {
            openAdmin();
        }
    });
}

let currentExamId = null;
let currentClassKey = null;

function openLogin(classKey, examId) {
    currentExamId = examId;
    currentClassKey = classKey;
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').innerText = '';
    loginDialog.showModal();
}

function closeLogin() {
    loginDialog.close();
    currentExamId = null;
    currentClassKey = null;
}

function submitLogin() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPassword').value;

    if (currentClassKey && currentExamId && config[currentClassKey]) {
        const exam = config[currentClassKey].find(exam => exam.id === currentExamId);
        if (exam && exam.id === id && exam.password === pass) {
            window.open(exam.link, '_blank');
            closeLogin();
        } else {
            document.getElementById('loginError').innerText = 'Incorrect ID or Password!';
        }
    } else {
        document.getElementById('loginError').innerText = 'An error occurred. Please try again.';
    }
}

function openAdmin() {
    adminErrorDiv.innerText = '';
    adminSuccessDiv.innerText = '';
    adminForm.innerHTML = ''; // Clear previous form elements

    for (const classKey in config) {
        if (config.hasOwnProperty(classKey)) {
            const classTitle = document.createElement('h3');
            classTitle.textContent = classKey.replace(/_/g, ' ').toUpperCase();
            adminForm.appendChild(classTitle);

            config[classKey].forEach((exam, index) => {
                const examDiv = document.createElement('div');
                examDiv.style.marginBottom = '15px';

                const nameLabel = document.createElement('label');
                nameLabel.textContent = `${classKey} - Exam ${index + 1} Name:`;
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = exam.name || '';
                nameInput.dataset.classKey = classKey;
                nameInput.dataset.examIndex = index;
                nameInput.dataset.field = 'name';
                nameInput.addEventListener('change', updateConfig);
                examDiv.appendChild(nameLabel);
                examDiv.appendChild(nameInput);

                const idLabel = document.createElement('label');
                idLabel.textContent = `${classKey} - Exam ${index + 1} ID:`;
                const idInput = document.createElement('input');
                idInput.type = 'text';
                idInput.value = exam.id;
                idInput.dataset.classKey = classKey;
                idInput.dataset.examIndex = index;
                idInput.dataset.field = 'id';
                idInput.addEventListener('change', updateConfig);
                examDiv.appendChild(idLabel);
                examDiv.appendChild(idInput);

                const passwordLabel = document.createElement('label');
                passwordLabel.textContent = `${classKey} - Exam ${index + 1} Password:`;
                const passwordInput = document.createElement('input');
                passwordInput.type = 'password';
                passwordInput.value = exam.password;
                passwordInput.dataset.classKey = classKey;
                passwordInput.dataset.examIndex = index;
                passwordInput.dataset.field = 'password';
                passwordInput.addEventListener('change', updateConfig);
                examDiv.appendChild(passwordLabel);
                examDiv.appendChild(passwordInput);

                const linkLabel = document.createElement('label');
                linkLabel.textContent = `${classKey} - Exam ${index + 1} Link:`;
                const linkInput = document.createElement('input');
                linkInput.type = 'text';
                linkInput.value = exam.link;
                linkInput.dataset.classKey = classKey;
                linkInput.dataset.examIndex = index;
                linkInput.dataset.field = 'link';
                linkInput.addEventListener('change', updateConfig);
                examDiv.appendChild(linkLabel);
                examDiv.appendChild(linkInput);

                adminForm.appendChild(examDiv);
            });
        }
    }

    adminDialog.showModal();
}

function closeAdmin() {
    adminDialog.close();
}

function updateConfig(event) {
    const classKey = event.target.dataset.classKey;
    const examIndex = parseInt(event.target.dataset.examIndex);
    const field = event.target.dataset.field;
    const value = event.target.value;

    if (config[classKey] && config[classKey][examIndex]) {
        config[classKey][examIndex][field] = value;
    }
}

function saveConfig() {
    // This will save the config to localStorage. It will NOT update the config.json file on the server (GitHub Pages).
    try {
        localStorage.setItem('adminConfig', JSON.stringify(config));
        adminSuccessDiv.innerText = 'Configuration saved locally. Remember to update config.json manually for persistent changes.';
        // You would need to manually copy the content of localStorage and update your config.json file.
        console.log('Current config in localStorage:', JSON.parse(localStorage.getItem('adminConfig')));
    } catch (error) {
        adminErrorDiv.innerText = 'Error saving configuration locally.';
        console.error('Error saving config to localStorage:', error);
    }
}

// Load any locally stored config on page load
function loadLocalConfig() {
    const localConfig = localStorage.getItem('adminConfig');
    if (localConfig) {
        config = JSON.parse(localConfig);
        renderClassLinks();
        console.log('Loaded config from localStorage.');
    } else {
        loadConfig(); // Load from config.json if nothing is in localStorage
    }
}

loadLocalConfig();
