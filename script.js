// script.js (আপনার পাবলিক ওয়েবপেজের জন্য)

// !!! গুরুত্বপূর্ণ: এখানে আপনার Google Apps Script ওয়েব অ্যাপ URL টি পেস্ট করুন !!!
// এটি আপনার অ্যাডমিন প্যানেলের জন্য ব্যবহৃত একই URL হবে।
const PUBLIC_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6mD_rAUBTqOd9wvtnlTT26VozSDpr9oa8iFd8781OUCowvuYX57CM4gm1_8PCN6AbOQ/exec'; 

let credentials = {}; // Google Sheet থেকে আনা এক্সাম লিংক ডাটা এখানে সংরক্ষণ করা হবে
let masterCredential = {}; // masterConfig.json থেকে আনা মাস্টার লগইন ডাটা এখানে সংরক্ষণ করা হবে



// DOM লোড হওয়ার পর প্রাথমিকভাবে কল হবে
document.addEventListener('DOMContentLoaded', async () => {
    // সেশন চেক করুন যদি মাস্টার লগইন ইতিমধ্যেই হয়ে থাকে
    const userType = sessionStorage.getItem("userType");
    if (userType === "teacher" || userType === "student" || userType === "school") {
        // যদি লগইন করা থাকে, তাহলে লগইন ওভারলে লুকান এবং ডাটা লোড করুন
        const masterLoginOverlay = document.getElementById('masterLoginOverlay');
        if (masterLoginOverlay) {
            masterLoginOverlay.style.display = "none";
        }
        await loadExamLinks(); // Google Sheet থেকে এক্সাম লিংক লোড করুন
    } else {
        // যদি লগইন করা না থাকে, তাহলে লগইন ওভারলে দেখান
        const masterLoginOverlay = document.getElementById('masterLoginOverlay');
        if (masterLoginOverlay) {
            masterLoginOverlay.style.display = "flex"; // ডিফল্টভাবে ডিসপ্লে ফ্লেক্স বা ব্লক থাকতে পারে
        }
    }
});


// DOM লোড হওয়ার পর প্রাথমিকভাবে কল হবে
document.addEventListener('DOMContentLoaded', async () => {
    const userType = sessionStorage.getItem("userType");
    const masterLoginOverlay = document.getElementById('masterLoginOverlay');

    if (userType === "teacher" || userType === "student" || userType === "school") {
        // যদি লগইন করা থাকে, তবে লগইন ওভারলে লুকান
        if (masterLoginOverlay) {
            masterLoginOverlay.style.display = "none";
        }
        await loadExamLinks(); // Google Sheet থেকে এক্সাম লিংক লোড করুন
    } else {
        // যদি সেশন না থাকে বা অবৈধ হয়, তাহলে লগআউট করুন এবং লগইন ওভারলে দেখান
        logout(); // এখানে logout ফাংশন কল করুন
    }

    // ব্রাউজারে 'back' বাটন প্রেস করলে বা পেজ ফরওয়ার্ড হলে লগআউট নিশ্চিত করা
    // এটি 'popstate' ইভেন্ট ব্যবহার করে
    window.addEventListener('popstate', (event) => {
        // যদি আপনি নির্দিষ্ট URL এ না থাকেন এবং সেশন না থাকে, তাহলে লগআউট করুন
        // অথবা শুধুমাত্র প্রতিটি back/forward ইভেন্টে লগআউট করতে পারেন
        // সরলতার জন্য, এখানে popstate এলেই লগআউট করা হচ্ছে।
        const currentUserType = sessionStorage.getItem("userType");
        if (!currentUserType) { // যদি userType না থাকে, মানে লগইন নেই
            logout();
        }
    });
});


// নতুন লগআউট ফাংশন যোগ করুন
function logout() {
    sessionStorage.removeItem("userType"); // userType সেশন থেকে সরিয়ে দিন
    sessionStorage.removeItem("studentLoggedIn"); // যদি studentLoggedIn ব্যবহার করেন, সেটিও সরান

    const masterLoginOverlay = document.getElementById('masterLoginOverlay');
    if (masterLoginOverlay) {
        masterLoginOverlay.style.display = "flex"; // লগইন ওভারলে আবার দেখান
    }

    // প্রয়োজনে exam-buttons কন্টেইনারটি খালি করে দিন বা একটি মেসেজ দেখান
    const examButtonsDiv = document.getElementById('exam-buttons');
    if (examButtonsDiv) {
        examButtonsDiv.innerHTML = '<p>লগইন করার জন্য অনুগ্রহ করে আইডি ও পাসওয়ার্ড দিন।</p>';
    }
}




// মাস্টার লগইন যাচাই করে
async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";

    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    masterCredential = await getMasterConfig(); // মাস্টার ক্রেডেনশিয়াল লোড

    if (!masterCredential) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = masterCredential[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        // Session set করুন
        sessionStorage.setItem("userType", type.toLowerCase());
        if (type.toLowerCase() === "student") {
            sessionStorage.setItem("studentLoggedIn", "true"); // যদি student এর জন্য আলাদা লগইন স্টেট রাখতে চান
        }

        // সফল লগইন
        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(async () => { // async ব্যবহার করুন কারণ loadExamLinks async ফাংশন
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else { // Teacher login
                const masterLoginOverlay = document.getElementById('masterLoginOverlay');
                if (masterLoginOverlay) {
                    masterLoginOverlay.style.display = "none"; // লগইন ওভারলে লুকান
                }
                await loadExamLinks(); // টিচার লগইন সফল হলে এক্সাম লিংক লোড করুন
            }
        }, 1000); // 1 সেকেন্ড পর অ্যাকশন
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}

// Google Sheet থেকে এক্সাম লিংক ডাটা ফেজ করা (মূল loadExamLinks ফাংশন)
async function loadExamLinks() {
    try {
        const response = await fetch(`${PUBLIC_WEB_APP_URL}?action=getData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'getData'
            })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            credentials = transformSheetDataToCredentials(result.data);
            renderButtons();
        } else {
            console.error('Error fetching data for public page:', result.message);
            const examButtonsDiv = document.getElementById('exam-buttons');
            if (examButtonsDiv) {
                examButtonsDiv.innerHTML = '<p style="color: red;">দুঃখিত, এক্সাম লিংক লোড করা যায়নি।</p>';
            }
        }
    } catch (error) {
        console.error('Network or parsing error for public page:', error);
        const examButtonsDiv = document.getElementById('exam-buttons');
        if (examButtonsDiv) {
            examButtonsDiv.innerHTML = '<p style="color: red;">সার্ভারের সাথে সংযোগ করা যায়নি। অনুগ্রহ করে পরে চেষ্টা করুন।</p>';
        }
    }
}

// Google Sheet থেকে আনা ডাটাকে আপনার 'credentials' অবজেক্ট ফরম্যাটে রূপান্তর করার ফাংশন
function transformSheetDataToCredentials(sheetData) {
    const transformedData = {};
    sheetData.forEach(row => {
        let className = row.CLASS;
        let examType = '';

        if (className === 'X_TEST EXAM') {
            className = 'X';
            examType = 'TEST';
        } else {
            const parts = className.split('_');
            if (parts.length > 1) {
                className = parts[0];
                examType = parts[1];
            } else {
                // If only class, default to '1ST' or handle as needed
                examType = '1ST'; // Adjust this default if necessary
            }
        }

        const key = `${className}_${examType}`;
        transformedData[key] = {
            id: row.ID,
            pass: row.PASSWORD,
            url: row.LINK
        };
    });
    return transformedData;
}

let currentKey = '';

// এক্সাম লিংক তৈরি ও দেখানো
function renderButtons() {
    const container = document.getElementById('exam-buttons');
    if (!container) {
        console.error("Element with ID 'exam-buttons' not found.");
        return;
    }
    container.innerHTML = '';

    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];
    const orderedClasses = ['V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    classes.sort((a, b) => orderedClasses.indexOf(a) - orderedClasses.indexOf(b));

    classes.forEach(cls => {
        const title = document.createElement('div');
        title.className = 'class-title';
        title.textContent = 'CLASS ' + cls.replace('X_TEST', 'X');
        container.appendChild(title);

        const exams = ['1ST', '2ND', '3RD', 'TEST'];

        exams.forEach(exam => {
            let key = `${cls}_${exam}`;
            if (credentials[key]) {
                const a = document.createElement('a');
                a.className = 'exam-link';
                a.textContent = exam === 'TEST' ? 'TEST EXAM' : exam;
                a.href = '#';
                a.onclick = (e) => {
                    e.preventDefault(); // Default লিঙ্ক আচরণ বন্ধ করুন
                    openLogin(key);
                };
                container.appendChild(a);
            }
        });
    });
}

// প্রতিটি এক্সাম লিংকের জন্য সাব-লগইন
function openLogin(key) {
    currentKey = key;
    const loginId = document.getElementById('loginId');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const loginDialog = document.getElementById('loginDialog');

    if (loginId) loginId.value = '';
    if (loginPassword) loginPassword.value = '';
    if (loginError) loginError.innerText = '';

    if (loginDialog) {
        loginDialog.showModal();
    } else {
        console.error("Login dialog element not found!");
        alert("Login functionality not available. Missing dialog element.");
    }
}

// সাব-লগইন বন্ধ
function closeLogin() {
    const loginDialog = document.getElementById('loginDialog');
    if (loginDialog) {
        loginDialog.close();
    }
}

// সাব-লগইন যাচাই করে লিংক খোলা
function submitLogin() {
    const idInput = document.getElementById('loginId');
    const passInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    const id = idInput ? idInput.value : '';
    const pass = passInput ? passInput.value : '';
    const credential = credentials[currentKey];

    if (credential && credential.id === id && credential.pass === pass) {
        if (credential.url && credential.url.trim() !== '') {
            window.open(credential.url, '_blank');
            closeLogin();
        } else {
            closeLogin();
            showAvailableSoonMessage(currentKey);
        }
    } else {
        if (loginError) {
            loginError.innerText = 'Incorrect ID or Password!';
        }
    }
}

function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    if (!container) return;

    const examText = getExamText(key);
    const links = container.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === examText) {
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) {
                next.remove();
            }

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 Available Soon 🔔';
            msg.style.cssText = `
                background-color: #ffc107; /* Warning yellow */
                color: #343a40;
                padding: 5px 10px;
                border-radius: 5px;
                margin-top: 5px;
                font-size: 0.9em;
                text-align: center;
                animation: fadeOut 3s forwards;
            `;

            link.parentNode.insertBefore(msg, link.nextSibling);

            setTimeout(() => {
                if (msg.parentNode) {
                    msg.remove();
                }
            }, 3000);
            break;
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', '1ST', ...)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[parts.length - 1];
    if (exam === 'TEST') return 'TEST EXAM';
    return exam;
}


// NOTICE & HELP লোড করা
fetch('files.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load files.json');
        }
        return response.json();
    })
    .then(data => {
        if (data.notices) {
            populateList('notice-list', data.notices);
        }
        if (data.help) {
            populateList('help-list', data.help);
        }
    })
    .catch(error => console.error('Error fetching files.json:', error));

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    if (!ul) {
        console.warn(`Element with ID '${elementId}' not found.`);
        return;
    }
    ul.innerHTML = ''; // তালিকা লোড করার আগে পরিষ্কার করুন
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
