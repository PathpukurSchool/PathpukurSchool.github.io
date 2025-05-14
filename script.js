let credentials = {};

fetch('config.json')
    .then(response => response.json())
    .then(data => {
        credentials = data;
        renderButtons();
    });

let currentKey = '';

function renderButtons() {
    const container = document.getElementById('exam-buttons');
    container.innerHTML = '';

    // Extract unique class names from the keys (before the first underscore)
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    classes.forEach(cls => {
        const title = document.createElement('div');
        title.className = 'class-title';
        title.textContent = 'CLASS ' + (cls === 'X' ? 'X' : cls); // Display CLASS X instead of X_TEST
        container.appendChild(title);

        Object.entries(credentials).forEach(([key, value]) => {
            // ✅ Corrected condition to prevent partial matches (e.g., V matching VI)
            if (key.split('_')[0] === cls) {
                const a = document.createElement('a');
                a.className = 'exam-link';
                a.textContent = key.split('_')[1].replace('TEST', 'TEST EXAM');
                a.href = '#';
                a.onclick = () => openLogin(key);
                container.appendChild(a);
            }
        });
    });
}

function openLogin(key) {
    currentKey = key;
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').innerText = '';
    document.getElementById('loginDialog').showModal();
}

function closeLogin() {
    document.getElementById('loginDialog').close();
}

function submitLogin() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPassword').value;
    const credential = credentials[currentKey];

    if (credential && credential.id === id && credential.pass === pass) {
        window.open(credential.url, '_blank');
        closeLogin();
    } else {
        document.getElementById('loginError').innerText = 'Incorrect ID or Password!';
    }
}
