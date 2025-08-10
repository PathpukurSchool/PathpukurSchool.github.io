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
    if (!loginId || !loginPass || !loginMsg) return;

    const idVal = loginId.value.trim();
    const passVal = loginPass.value.trim();

    if (!idVal || !passVal) {
        loginMsg.textContent = "Please enter ID and Password.";
        loginMsg.style.color = "red";
        return;
    }

    if (!data) {
        data = await loadMasterConfig();
    }

    if (!data || !data.teacher) {
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
        return;
    }

    if (idVal === data.teacher.id && passVal === data.teacher.pass) {
        loginMsg.textContent = "Login Successful!";
        loginMsg.style.color = "green";
        localStorage.setItem("isLoggedIn", "true");
        setTimeout(() => {
            if (loginOverlay) loginOverlay.style.display = 'none';
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
    const config = await loadMasterConfig();

    if (!config) {
        if (loginMsg) {
            loginMsg.textContent = "Failed to load configuration.";
            loginMsg.style.color = "red";
        }
        return;
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

    // লগইন স্টেট চেক
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (loginOverlay) loginOverlay.style.display = 'none';
        renderDynamicContent();
        initMenuBehaviour();
        initSectionObserver();
    } else {
        if (loginOverlay) loginOverlay.style.display = 'flex';
    }
}

/* ---------------------------
   Dynamic Content Loader
   --------------------------- */
function renderDynamicContent() {
    if ($('lastDatesContainer')) renderLastDates();
    if ($('classVButtons')) renderClassButtons();
    if ($('studentRoutineLink')) renderOtherLinks();
}

/* ---------------------------
   Render: Last Dates
   --------------------------- */
function renderLastDates() {
    const container = $('lastDatesContainer');
    if (!data || !data.lastDates || !container) {
        if (container) container.innerHTML = '<div class="item">No date information</div>';
        return;
    }
    // আপনার পূর্বের কোড এখানে দিন
}

/* ছোট হেল্পার: YYYY-MM-DD -> readable */
function formatDate(iso) {
    // আপনার পূর্বের কোড এখানে দিন
}

/* ---------------------------
   Render: Class Buttons
   --------------------------- */
function renderClassButtons() {
    if (!data || !data.links) return;
    // আপনার পূর্বের কোড এখানে দিন
}

/* ---------------------------
   Render: Other Links
   --------------------------- */
function renderOtherLinks() {
    if (!data || !data.otherLinks) return;
    // আপনার পূর্বের কোড এখানে দিন
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
    // আপনার পূর্বের কোড এখানে দিন
}

function closeAllMenus() {
    // আপনার পূর্বের কোড এখানে দিন
}

function initSectionObserver() {
    // আপনার পূর্বের কোড এখানে দিন
}

/* ============================
   একটাই DOMContentLoaded ব্লক
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
    // অ্যাপ ইনিশিয়ালাইজ
    initializeApp();

    // লগইন বাটন
    if (loginSubmit) {
        loginSubmit.addEventListener('click', handleLoginSubmit);
    }

    // ক্যানসেল বাটন
    if (loginCancel) {
        loginCancel.addEventListener('click', () => {
            window.history.back();
        });
    }

    // Enter কী সাপোর্ট
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
