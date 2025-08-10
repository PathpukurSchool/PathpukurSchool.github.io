/* ============================
   master.js - সংশোধিত সংস্করণ
   ============================ */

/* ---------------------------
   Helper: DOM Shortcuts
   --------------------------- */
const $ = id => document.getElementById(id);

/* ---------------------------
   ভ্যারিয়েবল ডিক্লেয়ার
   --------------------------- */
let data = null; // master.json ডেটা হবে এখানে
const loginOverlay = $('loginOverlay');
const loginSubmit = $('loginSubmit');
const loginCancel = $('loginCancel');
const loginMsg = $('loginMsg');
const loginId = $('loginId');
const loginPass = $('loginPass');
const mainContent = $('mainContent');
const footerText = $('footerText');
const logoImg = $('logoImg');
const schoolTitle = $('schoolTitle');
const schoolNameTop = $('schoolNameTop');

/* ---------------------------
   JSON লোড ও ইনিশিয়ালাইজেশন
   --------------------------- */
fetch('master.json')
    .then(r => r.json())
    .then(json => {
        data = json;
        console.log("master.json data loaded:", data);

        // স্কুল নাম সেট করা
        if (data.schoolName) {
            if (schoolTitle) schoolTitle.textContent = data.schoolName;
            if (schoolNameTop) schoolNameTop.textContent = data.schoolName;
        }

        // লোগো থাকলে সেট করুন
        if (data.logo && data.logo.trim() !== '') {
            if (logoImg) {
                logoImg.src = data.logo;
                logoImg.style.display = 'block';
            }
        } else {
            if (logoImg) logoImg.style.display = 'none';
        }

        // ফুটার টেক্সট
        if (footerText) footerText.textContent = data.footer || '';

        // ডাইনামিক অংশ রেন্ডার করুন
        // এই ফাংশনগুলি নিশ্চিত করতে হবে যে তারা DOM এ বিদ্যমান
        if ($('lastDatesContainer')) renderLastDates();
        // নিশ্চিত করুন যে অন্যান্য render ফাংশনগুলিও কল করা হয়েছে
        if ($('classVButtons')) renderClassButtons();
        if ($('studentRoutineLink')) renderOtherLinks();

    })
    .catch(err => {
        console.error("Failed to load master.json:", err);
        if (loginMsg) {
            loginMsg.textContent = "Failed to load configuration.";
            loginMsg.style.color = "red";
        }
    });

/* ---------------------------
   Login: সাবমিট হ্যান্ডলার (সংশোধিত)
   --------------------------- */


/* ---------------------------
   Login: সাবমিট হ্যান্ডলার
   --------------------------- */
loginSubmit.addEventListener('click', () => {
    const idVal = loginId.value.trim();
    const passVal = loginPass.value.trim();

    if (!data || !data.teacher) {
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
        return;
    }

    if (!idVal || !passVal) {
        loginMsg.textContent = "Please enter ID and Password.";
        loginMsg.style.color = "red";
        return;
    }

    if (idVal === data.teacher.id && passVal === data.teacher.pass) {
        loginMsg.textContent = "Login Successful!";
        loginMsg.style.color = "green";
        localStorage.setItem("isLoggedIn", "true");
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            initMenuBehaviour();
            initSectionObserver();
        }, 600);
    } else {
        loginMsg.textContent = "Invalid ID or Password!";
        loginMsg.style.color = "red";
    }
});

loginCancel.addEventListener('click', () => {
    window.history.back();
});




// বাকি ফাংশনগুলি অপরিবর্তিত
/* ---------------------------
   Render: Last Dates
   --------------------------- */
function renderLastDates() {
    const container = $('lastDatesContainer');
    if (!data || !data.lastDates || !container) {
        if (container) container.innerHTML = '<div class="item">No date information</div>';
        return;
    }
    // ... (পূর্বের কোড)
}

/* ছোট হেল্পার: YYYY-MM-DD -> readable */
function formatDate(iso) {
    // ... (পূর্বের কোড)
}

/* ---------------------------
   Render: Class Buttons
   --------------------------- */
function renderClassButtons() {
    if (!data || !data.links) return;
    // ... (পূর্বের কোড)
}

/* ---------------------------
   Render: Other Links
   --------------------------- */
function renderOtherLinks() {
    if (!data || !data.otherLinks) return;
    // ... (পূর্বের কোড)
}

/* ---------------------------
   Last action setter
   --------------------------- */
function setLastAction(text) {
    const lastActionEl = $('lastAction');
    if (lastActionEl) {
        lastActionEl.textContent = text;
    }
}

/* ---------------------------
   Menu behaviour & Section highlight
   --------------------------- */
function initMenuBehaviour() {
    // ... (পূর্বের কোড)
}

function closeAllMenus() {
    // ... (পূর্বের কোড)
}

function initSectionObserver() {
    // ... (পূর্বের কোড)
}

/* ============================
   শেষ: পেজ লোড হয়ে গেলে ইনিশিয়ালাইজেশন
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
    // লগইন সাবমিট এবং বাতিল বাটন থাকলে ইভেন্ট হ্যান্ডলার সেট করা
    // লগইন সফল হলে, overlay লুকানো হবে এবং মেনু কাজ করবে
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (loginOverlay) loginOverlay.style.display = 'none';
        initMenuBehaviour();
        initSectionObserver();
    } else {
        // লগইন সফল না হলে, overlay দেখানো হবে
        if (loginOverlay) loginOverlay.style.display = 'flex';
    }

    // Enter চাপলে সাবমিট
    if (loginId) {
        loginId.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loginSubmit.click();
        });
    }
    if (loginPass) {
        loginPass.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loginSubmit.click();
        });
    }
});
