let credentials = {};

// config.json ফাইল লোড করে credentials ভরাট
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        credentials = data;
        renderButtons();
    });

let currentKey = '';

// বোতাম তৈরির ফাংশন
function renderButtons() {
    const container = document.getElementById('exam-buttons');
    container.innerHTML = '';

    // ইউনিক ক্লাস লিস্ট তৈরি করা
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    // প্রতিটি ক্লাসের জন্য হেডার ও বোতাম তৈরি করা
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

// লগইন ডায়ালগ খুলে দেওয়া
function openLogin(key) {
    currentKey = key;
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').innerText = '';
    document.getElementById('loginDialog').showModal();
}

// লগইন ডায়ালগ বন্ধ করা
function closeLogin() {
    document.getElementById('loginDialog').close();
}

// লগইন যাচাই ও রিডাইরেকশন
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
