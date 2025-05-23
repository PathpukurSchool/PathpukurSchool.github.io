let credentials = {};
let masterCredential = {};

// মাস্টার লগইনের তথ্য লোড
fetch('masterConfig.json')
    .then(response => response.json())
    .then(data => {
        masterCredential = data;
    });

// মাস্টার লগইন যাচাই
function submitMasterLogin() {
    const id = document.getElementById('masterId').value;
    const pass = document.getElementById('masterPass').value;

    if (id === masterCredential.id && pass === masterCredential.pass) {
        document.getElementById('masterLoginOverlay').style.display = 'none';
        loadExamLinks(); // মূল ডেটা লোড
    } else {
        document.getElementById('masterLoginError').innerText = 'Incorrect ID or Password!';
    }
}

// এক্সাম লিংক লোড (মাস্টার লগইন সফল হলে)
function loadExamLinks() {
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            credentials = data;
            renderButtons();
        });
}

let currentKey = '';

// এক্সাম লিংক তৈরি ও দেখানো
function renderButtons() {
    const container = document.getElementById('exam-buttons');
    container.innerHTML = '';

    // ইউনিক ক্লাস তালিকা তৈরি
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    classes.forEach(cls => {
        const title = document.createElement('div');
        title.className = 'class-title';
        title.textContent = 'CLASS ' + cls.replace('X_TEST', 'X');
        container.appendChild(title);

        const exams = ['1ST', '2ND', '3RD', 'TEST'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (credentials[key]) {
                const a = document.createElement('a');
                a.className = 'exam-link';
                a.textContent = exam === 'TEST' ? 'TEST EXAM' : exam;
                a.href = '#';
                a.onclick = () => openLogin(key);
                container.appendChild(a);
            }
        });
    });
}

// প্রতিটি এক্সাম লিংকের জন্য সাব-লগইন
function openLogin(key) {
    currentKey = key;
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').innerText = '';
    document.getElementById('loginDialog').showModal();
}

// সাব-লগইন বন্ধ
function closeLogin() {
    document.getElementById('loginDialog').close();
}

// সাব-লগইন যাচাই করে লিংক খোলা
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
// NOTICE & HELP লোড করা
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    });

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    items.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = `${item.name} (${item.date})`;
        a.target = '_blank';
        li.appendChild(a);
        ul.appendChild(li);
    });
}
