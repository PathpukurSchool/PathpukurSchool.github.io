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
// script.js (আপনার পাবলিক ওয়েবপেজের জন্য)

// !!! গুরুত্বপূর্ণ: এখানে আপনার Google Apps Script ওয়েব অ্যাপ URL টি পেস্ট করুন !!!
// এটি আপনার অ্যাডমিন প্যানেলের জন্য ব্যবহৃত একই URL হবে।
const PUBLIC_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6mD_rAUBTqOd9wvtnlTT26VozSDpr9oa8iFd8781OUCowvuYX57CM4gm1_8PCN6AbOQ/exec'; 

let credentials = {}; // Google Sheet থেকে আনা ডাটা এখানে সংরক্ষণ করা হবে

// Google Sheet থেকে এক্সাম লিংক ডাটা ফেজ করা
async function loadExamLinks() {
    try {
        const response = await fetch(`${PUBLIC_WEB_APP_URL}?action=getData`, {
            method: 'POST', // Apps Script doPost ফাংশন POST রিকোয়েস্ট আশা করে
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'getData' // Apps Script-কে getData অ্যাকশন কল করতে বলছি
            })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            // Google Sheet থেকে আনা ডাটা প্রক্রিয়াজাত করা
            // আপনার বর্তমান renderButtons ফাংশনটি 'credentials' অবজেক্টের ফরম্যাটে ডাটা আশা করে।
            // তাই Google Sheet এর অ্যারে ফরম্যাটকে সেই অবজেক্ট ফরম্যাটে রূপান্তর করতে হবে।
            credentials = transformSheetDataToCredentials(result.data);
            renderButtons();
        } else {
            console.error('Error fetching data for public page:', result.message);
            // ব্যবহারকারীকে ত্রুটির মেসেজ দেখানোর জন্য কিছু একটা করা যেতে পারে
            document.getElementById('exam-buttons').innerHTML = '<p style="color: red;">দুঃখিত, এক্সাম লিংক লোড করা যায়নি।</p>';
        }
    } catch (error) {
        console.error('Network or parsing error for public page:', error);
        document.getElementById('exam-buttons').innerHTML = '<p style="color: red;">সার্ভারের সাথে সংযোগ করা যায়নি। অনুগ্রহ করে পরে চেষ্টা করুন।</p>';
    }
}

// Google Sheet থেকে আনা ডাটাকে আপনার 'credentials' অবজেক্ট ফরম্যাটে রূপান্তর করার ফাংশন
function transformSheetDataToCredentials(sheetData) {
    const transformedData = {};
    sheetData.forEach(row => {
        // ধরে নিচ্ছি Google Sheet-এর কলামগুলো 'CLASS', 'ID', 'PASSWORD', 'LINK'
        // আপনার বর্তমান 'credentials' অবজেক্টের কী (key) যেমন 'V_1ST', 'VI_TEST' ইত্যাদি
        // সে অনুযায়ী এখানে একটি কী তৈরি করতে হবে।

        // 'CLASS' কলাম থেকে ক্লাস এবং পরীক্ষার ধরণ বের করা
        let className = row.CLASS;
        let examType = ''; // যেমন 1ST, 2ND, 3RD, TEST

        // 'X_TEST EXAM' কে 'X_TEST' এ রূপান্তর
        if (className === 'X_TEST EXAM') {
            className = 'X'; // শুধু ক্লাস নামটি রাখা
            examType = 'TEST';
        } else {
            // অন্যান্য ক্লাস যেমন 'V_1ST', 'V_2ND', 'VI_1ST' ইত্যাদি থেকে
            // ক্লাস এবং পরীক্ষার ধরণ আলাদা করা
            const parts = className.split('_');
            if (parts.length > 1) {
                className = parts[0];
                examType = parts[1];
            } else {
                // যদি শুধু ক্লাস থাকে, তাহলে examType ফাঁকা থাকবে বা ডিফল্ট কিছু
                examType = '1ST'; // অথবা আপনার প্রয়োজন অনুযায়ী
            }
        }
        
        // সঠিক কী (key) তৈরি করা
        // উদাহরণস্বরূপ, 'V_1ST' বা 'VI_TEST'
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
    container.innerHTML = '';

    // ইউনিক ক্লাস তালিকা তৈরি (এখানে credentials অবজেক্টের কীগুলো ব্যবহার হবে)
    // নিশ্চিত করুন যে credentials অবজেক্টটি আপনার প্রত্যাশিত ফরম্যাটে আছে
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];
    
    // ক্লাসগুলো একটি নির্দিষ্ট ক্রমে সাজানো
    const orderedClasses = ['V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    classes.sort((a, b) => orderedClasses.indexOf(a) - orderedClasses.indexOf(b));


    classes.forEach(cls => {
        const title = document.createElement('div');
        title.className = 'class-title';
        // 'X_TEST EXAM' কে শুধু 'X' দেখাতে চাইলে
        title.textContent = 'CLASS ' + cls.replace('X_TEST', 'X'); 
        container.appendChild(title);

        // এখানে পরীক্ষার ধরণগুলো একটি নির্দিষ্ট ক্রমে সাজানো
        const exams = ['1ST', '2ND', '3RD', 'TEST']; // এখানে TEST পরে আছে, ঠিক আছে
        
        exams.forEach(exam => {
            let key = `${cls}_${exam}`;
            // যদি আপনার Google Sheet এ 'X_TEST EXAM' থাকে এবং আপনি এটিকে 'X_TEST' হিসেবে map করতে চান,
            // তাহলে নিশ্চিত করুন transformSheetDataToCredentials ফাংশনটি সেই অনুযায়ী কাজ করছে।
            // এখানে keyটি credentials অবজেক্টের সাথে মেলে কিনা তা পরীক্ষা করুন।

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
    const loginDialog = document.getElementById('loginDialog');
    if (loginDialog) { // নিশ্চিত করুন loginDialog আছে
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
    if (!container) return; // কন্টেইনার না থাকলে রিটার্ন করুন

    // সরাসরি নির্দিষ্ট লিংকের পাশে বার্তা যোগ করা
    // এখানে আপনার renderButtons ফাংশনটি যেমনভাবে key তৈরি করে, সেভাবে এখানেও key থেকে text বের করতে হবে।
    const examText = getExamText(key); 
    const links = container.getElementsByClassName('exam-link');
    
    for (let link of links) {
        if (link.textContent === examText) {
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) {
                next.remove(); // যদি আগে থেকে কোনো বার্তা থাকে তবে তা সরিয়ে দিন
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
            `; // ইনলাইন স্টাইল যোগ করা

            link.parentNode.insertBefore(msg, link.nextSibling);

            // 3 সেকেন্ড পরে মুছে ফেলুন
            setTimeout(() => {
                if (msg.parentNode) { // নিশ্চিত করুন যে উপাদানটি এখনও DOM এ আছে
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
    const exam = parts[parts.length - 1]; // শেষ অংশটি exam type
    if (exam === 'TEST') return 'TEST EXAM';
    return exam;
}


// পেজ লোড হওয়ার পর এক্সাম লিংক লোড করুন
document.addEventListener('DOMContentLoaded', loadExamLinks);










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
