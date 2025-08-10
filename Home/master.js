/* ====================================================
   Pathpukur High School (HS) ওয়েবসাইটের মূল JS ফাইল
   ==================================================== */

/* --------------------------
   ১) দরকারি DOM এলিমেন্ট
   -------------------------- */
const loginOverlay = document.getElementById('loginOverlay');
const mainContent = document.getElementById('mainContent');
const loginId = document.getElementById('userId');
const loginPass = document.getElementById('password');
const loginSubmit = document.getElementById('loginBtn');
const loginCancel = document.getElementById('cancelBtn');
const loginMsg = document.getElementById('message');
const schoolNameEl = document.getElementById('schoolName');
const topMenu = document.getElementById('topMenu');
const logoutBtn = document.getElementById('logoutBtn');

/* --------------------------
   ২) master.json থেকে ডেটা লোড
   -------------------------- */
let credentials = null; // Teacher ID/Password সংরক্ষণ
let urls = {};          // বিভিন্ন URL সংরক্ষণ
let dates = {};         // Marks submission date সংরক্ষণ

fetch('master.json')
    .then(res => res.json())
    .then(data => {
        credentials = data.teacher;
        urls = data.urls || {};
        dates = data.dates || {};
        schoolNameEl.textContent = data.schoolName || "School Name";
        renderDates();  // ডেট সেকশন তৈরি
        renderURLs();   // URL সেকশন তৈরি
    })
    .catch(err => {
        console.error("JSON Load Error:", err);
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
    });

/* --------------------------
   ৩) লগইন ফাংশন
   -------------------------- */
loginSubmit.addEventListener('click', () => {
    const idVal = loginId.value.trim();
    const passVal = loginPass.value.trim();

    // JSON এখনো লোড হয়নি
    if (!credentials) {
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
        return;
    }

    // ফাঁকা ইনপুট
    if (!idVal || !passVal) {
        loginMsg.textContent = "Please enter ID and Password before submitting.";
        loginMsg.style.color = "red";
        return;
    }

    // সঠিক হলে
    if (idVal === credentials.id && passVal === credentials.pass) {
        loginMsg.textContent = "Login Successful!";
        loginMsg.style.color = "green";
        localStorage.setItem("isLoggedIn", "true");
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            mainContent.setAttribute('aria-hidden', 'false');
            initMenuBehaviour();
            initSectionObserver();
        }, 600);
    } else {
        loginMsg.textContent = "Invalid ID or Password!";
        loginMsg.style.color = "red";
    }
});

// ক্যান্সেল বোতাম
loginCancel.addEventListener('click', () => {
    window.history.back();
});

/* --------------------------
   ৪) লগআউট ফাংশন
   -------------------------- */
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem("isLoggedIn");
    location.reload(); // আবার লগইন স্ক্রিনে পাঠাবে
});

/* --------------------------
   ৫) মেনু আচরণ
   -------------------------- */
function initMenuBehaviour() {
    const menuItems = document.querySelectorAll('.menu-item');
    const subMenus = document.querySelectorAll('.submenu');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSubMenus();
            item.classList.add('active');
            const subMenu = item.querySelector('.submenu');
            if (subMenu) subMenu.style.display = 'block';
        });
    });

    document.addEventListener('click', () => {
        closeAllSubMenus();
    });

    function closeAllSubMenus() {
        menuItems.forEach(i => i.classList.remove('active'));
        subMenus.forEach(sm => sm.style.display = 'none');
    }
}

/* --------------------------
   ৬) সেকশন হাইলাইট ফিচার
   -------------------------- */
function initSectionObserver() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.submenu a').forEach(a => a.classList.remove('highlight'));
                const link = document.querySelector(`.submenu a[href="#${entry.target.id}"]`);
                if (link) link.classList.add('highlight');
                sections.forEach(sec => sec.classList.remove('highlight'));
                entry.target.classList.add('highlight');
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(sec => observer.observe(sec));
}

/* --------------------------
   ৭) Marks submission date রেন্ডার
   -------------------------- */
function renderDates() {
    const dateContainer = document.getElementById('marksDates');
    dateContainer.innerHTML = "";
    for (let key in dates) {
        if (dates[key]) {
            const p = document.createElement('p');
            p.textContent = `Last date of ${key} exam: ${dates[key]}`;
            p.classList.add('date-highlight');
            dateContainer.appendChild(p);
        }
    }
}

/* --------------------------
   ৮) URL সেকশন রেন্ডার
   -------------------------- */
function renderURLs() {
    document.querySelectorAll('[data-url-key]').forEach(btn => {
        const key = btn.getAttribute('data-url-key');
        btn.addEventListener('click', () => {
            if (urls[key]) {
                window.open(urls[key], '_blank');
            } else {
                alert("Available Soon");
            }
        });
    });
}

/* --------------------------
   ৯) পেজ লোডের সময় লগইন স্টেট চেক
   -------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("isLoggedIn") === "true") {
        loginOverlay.style.display = 'none';
        mainContent.setAttribute('aria-hidden', 'false');
        initMenuBehaviour();
        initSectionObserver();
    }
});
