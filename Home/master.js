/* ============================
   master.js - সংশোধিত সংস্করণ (async/await)
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
   JSON লোড ফাংশন (async)
   --------------------------- */
async function loadMasterConfig() {
    try {
        const response = await fetch('master.json');
        if (!response.ok) {
            throw new Error(`Failed to load master.json: ${response.status}`);
        }
        const json = await response.json();
        data = json;
        console.log("master.json data loaded:", data);
        return data;
    } catch (error) {
        console.error("Error fetching config:", error);
        return null;
    }
}

/* ---------------------------
   Login: সাবমিট হ্যান্ডলার (async)
   --------------------------- */
async function handleLoginSubmit() {
    // নিশ্চিত করি যে DOM উপাদানগুলো আছে
    if (!loginId || !loginPass || !loginMsg) return;

    const idVal = loginId.value.trim();
    const passVal = loginPass.value.trim();

    // ইনপুট খালি কিনা চেক
    if (!idVal || !passVal) {
        loginMsg.textContent = "Please enter ID and Password.";
        loginMsg.style.color = "red";
        return;
    }

    // ডেটা লোড না হলে লোড করার চেষ্টা করি
    if (!data) {
        data = await loadMasterConfig();
    }

    if (!data || !data.teacher) {
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
        return;
    }

    // লগইন ভেরিফাই
    if (idVal === data.teacher.id && passVal === data.teacher.pass) {
        loginMsg.textContent = "Login Successful!";
        loginMsg.style.color = "green";
        localStorage.setItem("isLoggedIn", "true");
        setTimeout(() => {
            if (loginOverlay) loginOverlay.style.display = 'none';
            // লগইন সফল হলে ডাইনামিক অংশ রেন্ডার করি
            renderDynamicContent();
            initMenuBehaviour();
            initSectionObserver();
        }, 600);
    } else {
        loginMsg.textContent = "Invalid ID or Password!";
        loginMsg.style.color = "red";
    }
}

/* ---------------------------
   ইনিশিয়ালাইজেশন ফাংশন
   --------------------------- */
async function initializeApp() {
    // প্রথমেই config লোড করি
    const config = await loadMasterConfig();

    if (!config) {
        if (loginMsg) {
            loginMsg.textContent = "Failed to load configuration.";
            loginMsg.style.color = "red";
        }
        return; // config লোড না হলে থামিয়ে দেই
    }

    // DOM-এ ডেটা সেট করি
    if (config.schoolName) {
        if (schoolTitle) schoolTitle.textContent = config.schoolName;
        if (schoolNameTop) schoolNameTop.textContent = config.schoolName;
    }
    if (config.logo && config.logo.trim() !== '') {
        if (logoImg) {
            logoImg.src = config.logo;
            logoImg.style.display = 'block';
        }
    } else {
        if (logoImg) logoImg.style.display = 'none';
    }
    if (footerText) footerText.textContent = config.footer || '';

    // লগইন স্টেট চেক করি
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (loginOverlay) loginOverlay.style.display = 'none';
        renderDynamicContent();
        initMenuBehaviour();
        initSectionObserver();
    } else {
        if (loginOverlay) loginOverlay.style.display = 'flex';
    }
}

// এই ফাংশনটি লগইন সফল হলে বা পেজ লোড হওয়ার সময় কল হবে
function renderDynamicContent() {
    if ($('lastDatesContainer')) renderLastDates();
    if ($('classVButtons')) renderClassButtons();
    if ($('studentRoutineLink')) renderOtherLinks();
}

/* ============================
   ইভেন্ট হ্যান্ডলার্স
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
    // অ্যাপ ইনিশিয়ালাইজ করি
    initializeApp();

    if (loginSubmit) {
        loginSubmit.addEventListener('click', handleLoginSubmit);
    }
    if (loginCancel) {
        loginCancel.addEventListener('click', () => {
            window.history.back();
        });
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

// ... বাকি ফাংশনগুলি (renderLastDates, formatDate, ইত্যাদি) অপরিবর্তিত থাকবে
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
