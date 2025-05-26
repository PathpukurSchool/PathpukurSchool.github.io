let credentials = {};
let masterCredential = {};

// মাস্টার লগইনের তথ্য লোড
async function getCredentials() {
    try {
        const response = await fetch('masterConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching config:', error);
        return null;
    }
}

async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess'); // success ডিভ

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";
    
    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    const allCredentials = await getCredentials();

    if (!allCredentials) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = allCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        // Session set করুন
    sessionStorage.setItem("userType", type.toLowerCase());
            if (type.toLowerCase() === "student") {
        sessionStorage.setItem("studentLoggedIn", "true");
    }

        // সফল লগইন
        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else {
                // Teacher login successful – hide the login overlay
                document.getElementById('masterLoginOverlay').style.display = "none";
                loadExamLinks(); // মূল ডেটা লোড
            }
        }, 1000); // 1.5 সেকেন্ড পর রিডাইরেক্ট
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
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
        if (credential.url && credential.url.trim() !== '') {
            window.open(credential.url, '_blank');
            closeLogin();
        } else {
            // শীঘ্রই উপলব্ধ হবে মেসেজ দেখানো
            closeLogin(); // ডায়ালগ বন্ধ করব
            showAvailableSoonMessage(currentKey); // বার্তা দেখাব
        }
    } else {
        document.getElementById('loginError').innerText = 'Incorrect ID or Password!';
    }
}

function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    const links = container.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === getExamText(key)) {
            // আগে থেকে কোন বার্তা থাকলে সরাও
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove();

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 শীঘ্রই উপলব্ধ হবে 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            // 3 সেকেন্ড পরে মুছে ফেল
            setTimeout(() => {
                msg.remove();
            }, 3000);

            break;
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', '1ST', ...)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];
    if (exam === 'TEST') return 'TEST EXAM';
    return exam;
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
