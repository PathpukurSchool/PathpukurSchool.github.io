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
    const mainContainer = document.getElementById('exam-buttons');
    mainContainer.innerHTML = ''; // Clear previous content

    // Unique class list তৈরি
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    classes.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য একটি নতুন shaded-info-box তৈরি করা হচ্ছে
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box'; // CSS ক্লাস যা বক্সের স্টাইল দেবে

        // বক্সের হেডিং তৈরি করা হচ্ছে (ক্লাসের নাম)
        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading'; // CSS ক্লাস যা হেডিং এর স্টাইল দেবে
        // 'CLASS X_TEST' কে 'CLASS X' এ রূপান্তর
        let classDisplayName = 'CLASS ' + cls.replace('X_TEST', 'X').replace('XI', 'XI').replace('XII', 'XII');
        // 'CLASS IX' কে 'CLASS IX' এ রাখবে, 'CLASS X' কে 'CLASS X' এ রাখবে
        if (cls === 'IX') {
            classDisplayName = 'CLASS IX';
        } else if (cls === 'X') { // Assuming 'X' is for Class X, not X_TEST
             classDisplayName = 'CLASS X';
        } else if (cls === 'XI') {
             classDisplayName = 'CLASS XI';
        } else if (cls === 'XII') {
             classDisplayName = 'CLASS XII';
        }
        boxHeading.textContent = classDisplayName;
        classBox.appendChild(boxHeading);

        // বোতামগুলির জন্য একটি কন্টেইনার তৈরি করা যাতে সেগুলো flexbox দিয়ে সাজানো যায়
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exam-buttons-group'; // নতুন ক্লাস, এর জন্য CSS লাগবে

        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (credentials[key]) {
                const button = document.createElement('button'); // 'a' ট্যাগ থেকে 'button' ট্যাগে পরিবর্তন
                button.className = 'box-button exam-link'; // CSS ক্লাস যা বোতামের স্টাইল দেবে
                
                let label = exam;
                if (exam === 'TEST') label = 'TEST EXAM';
                else if (exam === 'SEM1') label = 'SEMESTER I';
                else if (exam === 'SEM2') label = 'SEMESTER II';
                
                button.textContent = label;
                button.onclick = () => openLogin(key); // `onclick` লজিক একই থাকবে
                buttonsContainer.appendChild(button);
            }
        });
        
        classBox.appendChild(buttonsContainer); // বোতাম কন্টেইনারকে বক্সের মধ্যে যোগ করা
        mainContainer.appendChild(classBox); // ক্লাস বক্সকে মূল কন্টেইনারে যোগ করা
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
            msg.textContent = '🔔 Available Soon 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            // 3 সেকেন্ড পরে মুছে ফেল
            setTimeout(() => {
                msg.remove();
            }, 3000);

            break;
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', 'SEMESTER I', ...)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];

    switch (exam) {
        case 'TEST':
            return 'TEST EXAM';
        case 'SEM1':
            return 'SEMESTER I';
        case 'SEM2':
            return 'SEMESTER II';
        case '1ST':
            return '1ST EXAM';
        case '2ND':
            return '2ND EXAM';
        case '3RD':
            return '3RD EXAM';
        default:
            return exam; // fallback
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
