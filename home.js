// =================================
// 🔐 SHA-256 HASH FUNCTION
// =================================
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ত্রুটি বা লোডিং বার্তা তৈরির জন্য HTML
function errorBox(title, message) {
    let typeClass = '';
    if (title === "Loading...") {
        typeClass = 'loading-message';
    } else if (title === "Error!" || title === "Available Soon!") {
        typeClass = 'error-message';
    }

    return `
        <div class="info-box ${typeClass}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
}

// পেজিনেশন ও সাধারণ বোতাম তৈরির ইউটিলিটি
function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    btn.classList.add('pagination-btn');
    btn.classList.add(`btn-${text.toLowerCase()}`);
    return btn;
}

// =================================
// 🔍 ড্রপডাউন সার্চ ফিল্টারিং ফাংশনালিটি
// =================================
let ALL_ITEMS_DETAILS = [];

function setupLiveSearch() {
    const searchInput = document.getElementById('site-search-input');
    const searchResultsDropdown = document.getElementById('search-dropdown-list');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (searchInput && searchResultsDropdown) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            searchResultsDropdown.innerHTML = '';

            if (clearSearchBtn) {
                clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
            }

            if (query.length < 2) {
                searchResultsDropdown.classList.remove('active');
                return;
            }

            if (ALL_ITEMS_DETAILS.length === 0) {
                const buttons = document.querySelectorAll('.exam-link, .class-link-btn');
                buttons.forEach(btn => {
                    if (btn.textContent.trim() && (btn.href || btn.onclick)) {
                        ALL_ITEMS_DETAILS.push({
                            title: btn.textContent.trim(),
                            url: btn.href || '#'
                        });
                    }
                });
            }

            let matchedItems = ALL_ITEMS_DETAILS.filter(item => 
                item.title && item.title.toLowerCase().includes(query)
            );

            if (matchedItems.length > 0) {
                matchedItems.forEach(item => {
                    const resDiv = document.createElement('div');
                    resDiv.className = 'search-dropdown-item';
                    resDiv.innerHTML = `
                        <span class="item-title">${item.title}</span>
                        <a href="${item.url}" class="item-btn" target="_blank">🚀 Go ➔</a>
                    `;
                    searchResultsDropdown.appendChild(resDiv);
                });
                searchResultsDropdown.classList.add('active');
            } else {
                searchResultsDropdown.innerHTML = `<div style="padding:15px; text-align:center; color:#777;">🕵️‍♂️ No Data Found!</div>`;
                searchResultsDropdown.classList.add('active');
            }
        });

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                searchResultsDropdown.innerHTML = '';
                searchResultsDropdown.classList.remove('active');
                this.style.display = 'none';
                searchInput.focus();
            });
        }

        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
                searchResultsDropdown.classList.remove('active');
            }
        });
    }
}

// =================================
// 🔢 গাণিতিক ক্যাপচা ফাংশনালিটি (MATH CAPTCHA)
// =================================
let captchaResult = null; // গাণিতিক ফলাফলের সঠিক মান সংরক্ষণের জন্য

function generateCaptcha() {
    const captchaElement = document.getElementById('captchaCode');
    const userInput = document.getElementById('userCaptcha');
    
    if (!captchaElement) return;

    // ১. এক অঙ্কের দুটি সংখ্যা জেনারেট করা (০ থেকে ৯)
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);

    // ২. গাণিতিক অপারেটর নির্বাচন (+ , - , ×)
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let expressionText = "";

    // ৩. ফলাফল ও এক্সপ্রেশন নির্ধারণ
    if (operator === '+') {
        captchaResult = num1 + num2;
        expressionText = `${num1} + ${num2} = ?`;
    } else if (operator === '-') {
        // ফলাফল যাতে ঋণাত্মক (Negative) না আসে, তাই বড় সংখ্যাটি আগে রাখা হলো
        const max = Math.max(num1, num2);
        const min = Math.min(num1, num2);
        captchaResult = max - min;
        expressionText = `${max} - ${min} = ?`;
    } else if (operator === '×') {
        captchaResult = num1 * num2;
        expressionText = `${num1} × ${num2} = ?`;
    }

    // ৪. স্ক্রিনে প্রদর্শন ও ইনপুট রিসেট
    captchaElement.innerText = expressionText;
    
    if (userInput) userInput.value = ""; 
}

// =================================
// 🔐 মাস্টার লগইন ও সিকিউরিটি ফাংশন
// =================================

function toggleMasterPasswordVisibility() {
    const passInput = document.getElementById('masterPass');
    const toggleIcon = document.getElementById('masterPassToggle');
    if (!passInput || !toggleIcon) return;

    if (passInput.type === "password") {
        passInput.type = "text";
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = "password";
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

async function submitMasterLogin() {
    const idInput = document.getElementById('masterId');
    const passInput = document.getElementById('masterPass');
    const captchaInput = document.getElementById('userCaptcha');
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');
    
    // 🎯 সুনির্দিষ্ট আইডি (masterLoginBtn) দিয়ে লগইন বাটন ধরা হচ্ছে
    const loginBtn = document.getElementById('masterLoginBtn');

    if (!idInput || !passInput || !captchaInput) return;

    const id = idInput.value.trim();
    const pass = passInput.value.trim();
    const userCaptcha = captchaInput.value.trim();

    if (errorDiv) errorDiv.innerText = "";
    if (successDiv) {
        successDiv.innerText = "";
        successDiv.style.display = "none";
    }

    // 🔹 ১. ID বা Password ফাঁকা থাকলে মেসেজ
    if (!id || !pass) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please fill both ID & Password.";
            errorDiv.style.color = "red";
        }
        return;
    }

    // 🔹 ২. ক্যাপচা ফাঁকা থাকলে মেসেজ
    if (!userCaptcha) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please enter the CAPTCHA answer.";
            errorDiv.style.color = "red";
        }
        return;
    }

    // 🔹 ৩. গাণিতিক ফলাফল যাচাই (Math Captcha Validation)
    if (parseInt(userCaptcha, 10) !== captchaResult) {
        if (errorDiv) {
            errorDiv.innerText = "❌ Incorrect CAPTCHA answer! Please try again.";
            errorDiv.style.color = "red";
        }
        generateCaptcha(); // ক্যাপচা ভুল হলে নতুন অঙ্ক তৈরি হবে
        return;
    }

    // মূল লগইন বাটনের অবস্থা পরিবর্তন
    if (loginBtn) {
        loginBtn.innerText = "Validating...";
        loginBtn.disabled = true;
    }

    try {
        const response = await fetch("masterConfig.json");
        if (!response.ok) throw new Error('Teacher Login load failed');
        
        const config = await response.json();

        // হ্যাশ চেক
        const idHashed = await sha256(id + config.Logid);
        const passHashed = await sha256(pass + config.Logpassword);

        if (idHashed === config.idHash && passHashed === config.passHash) {
            sessionStorage.setItem("userType", "teacher");
            sessionStorage.setItem("teacherLoggedIn", "true");

            if (successDiv) {
                successDiv.innerText = "✔️ Login Successful.";
                successDiv.style.display = "block";
            }

            setTimeout(() => {
                const overlay = document.getElementById('masterLoginOverlay');
                if (overlay) overlay.style.display = "none";

                const mainContent = document.getElementById('main-website-content');
                const searchContainer = document.querySelector('.search-container');
                if (mainContent) mainContent.style.display = "block";
                if (searchContainer) searchContainer.style.display = "block";

                document.body.classList.remove('no-scroll');
                startAutoLogoutTimer();
            }, 800);

        } else {
            // ❌ ৪. ভুল ID বা Password-এর জন্য স্পষ্ট সতর্কবার্তা
            if (errorDiv) {
                errorDiv.innerText = "❌ Incorrect Teacher ID or Password!";
                errorDiv.style.color = "red";
            }
            generateCaptcha(); // সিকিউরিটির জন্য ক্যাপচা রিসেট
            if (loginBtn) {
                loginBtn.innerText = "🔓 Login";
                loginBtn.disabled = false;
            }
        }

    } catch (error) {
        console.error("Error loading teacher login", error);
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Configuration file error. Contact Administrator.";
            errorDiv.style.color = "red";
        }
        generateCaptcha();
        if (loginBtn) {
            loginBtn.innerText = "🔓 Login";
            loginBtn.disabled = false;
        }
    }
}

// 🔒 স্ট্রং লগআউট সিস্টেম
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
}

// =================================================================
// ⏳ উন্নত অটোমেটিক ইনঅ্যাক্টিভিটি লগআউট (মোবাইল, ট্যাব ও পিসির জন্য)
// =================================================================
let inactivityTimer;
const TIMEOUT_DURATION = 15 * 60 * 1000; // ১৫ মিনিট (মিলি সেকেন্ডে)

function startAutoLogoutTimer() {
    if (sessionStorage.getItem("teacherLoggedIn") !== "true") return;

    // ১. ব্যবহারকারী অ্যাক্টিভ থাকলে টাইমস্ট্যাম্প আপডেট ও টাইমার রিসেট করার ফাংশন
    function resetTimer() {
        localStorage.setItem('lastActivityTime', Date.now().toString());

        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            checkAndPerformAutoLogout();
        }, TIMEOUT_DURATION);
    }

    // ২. অ্যাক্টিভিটি টাইমস্ট্যাম্প ও অটো-লগআউট চেক করার ফাংশন
    function checkAndPerformAutoLogout() {
        if (sessionStorage.getItem("teacherLoggedIn") !== "true") return;

        const lastActivity = localStorage.getItem('lastActivityTime');
        const currentTime = Date.now();

        if (lastActivity && (currentTime - parseInt(lastActivity, 10)) >= TIMEOUT_DURATION) {
            logout();
        }
    }

    // ৩. পিসি ও মোবাইলে ইউজার ইন্টারেকশন ইভেন্ট ট্র্যাকিং
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => {
        document.addEventListener(evt, resetTimer, { passive: true });
    });

    // 📱 ৪. মোবাইলের জন্য স্ক্রীন লক/আনলক ও ট্যাব ভিজিবিলিটি চেক
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAndPerformAutoLogout(); // স্ক্রীন আনলক করার সাথে সাথে হিসাব চেক হবে
        }
    });

    window.addEventListener('focus', checkAndPerformAutoLogout);

    // প্রথমবার কল করা
    resetTimer();
}

// =================================
// 🔔 AVAILABLE SOON MESSAGE & CLICK HANDLER
// =================================

// নির্দিষ্ট বোতামের নিচে 'Available Soon' নোটিশ দেখানোর ফাংশন (পূর্বের ন্যায় অক্ষুণ্ণ)
function showAvailableSoonMessage(button) {
    if (button.nextElementSibling && button.nextElementSibling.classList.contains('avail-msg')) return;

    const msg = document.createElement('div');
    msg.className = 'avail-msg';
    msg.textContent = '🔔 Available Soon 🔔';

    button.parentNode.insertBefore(msg, button.nextSibling);

    setTimeout(() => {
        if (msg.parentNode) msg.remove();
    }, 3000);
}

// সার্বজনীন ক্লিক হ্যান্ডলার: যেসব বোতামে লিংক (href) খালি বা '#' আছে সেগুলোতে অটোমেটিক মেসেজ দেখাবে
function setupUniversalLinkHandler() {
    document.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.exam-link, .nav-link, .class-link-btn');

        if (targetBtn) {
            const href = targetBtn.getAttribute('href');

            // যদি লিংক ফাঁকা থাকে, '#' থাকে অথবা লিংক না থাকে
            if (!href || href.trim() === '' || href.trim() === '#' || href.startsWith('javascript:')) {
                event.preventDefault();
                showAvailableSoonMessage(targetBtn);
            }
        }
    });
}

// =================================
// 🧭 সাইড বার মেনু ও ড্রপডাউন ফাংশন
// =================================

function initializeSidebar() {
    const menuButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');

    if (!menuButton || !sidebar || !overlay) {
        console.warn("Sidebar elements not found in DOM.");
        return;
    }

    // ১. সাইডবার টগল
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // ২. ড্রপডাউন সাবমেনু (অ্যারো আইকন)
    const arrowIcons = sidebar.querySelectorAll('.arrow-icon');
    arrowIcons.forEach(arrow => {
        arrow.addEventListener('click', function(e) {
            e.stopPropagation();
            const menuItem = this.closest('.menu-item');
            
            sidebar.querySelectorAll('.menu-item').forEach(item => {
                if(item !== menuItem) item.classList.remove('active');
            });
            
            if (menuItem) {
                menuItem.classList.toggle('active');
            }
        });
    });

    // ৩. স্মুথ স্ক্রল
    const navLinks = sidebar.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener("click", function(event) {
            const targetId = this.getAttribute("href");
            
            if (!targetId || targetId === '#') return;

            event.preventDefault();

            sidebar.querySelectorAll('.nav-link').forEach(item => item.classList.remove("active-link"));
            this.classList.add("active-link");

            sidebar.classList.remove('active');
            overlay.classList.remove('active');

            const targetSection = document.getElementById(targetId.substring(1));
            if (targetSection) {
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                targetSection.classList.add("highlight-section");
                setTimeout(() => {
                    targetSection.classList.remove("highlight-section");
                }, 3000);
            }
        });
    });
}

// =================================
// 🚀 ইনিশিয়ালাইজেশন (Page Load)
// =================================

document.addEventListener("DOMContentLoaded", () => {
    // সেশন যাচাই
    if (sessionStorage.getItem("teacherLoggedIn") === "true") {
        const overlay = document.getElementById('masterLoginOverlay');
        const mainContent = document.getElementById('main-website-content');
        const searchContainer = document.querySelector('.search-container');
        
        if (overlay) overlay.style.display = "none";
        if (mainContent) mainContent.style.display = "block";
        if (searchContainer) searchContainer.style.display = "block";

        startAutoLogoutTimer();
    } else {
        const overlay = document.getElementById('masterLoginOverlay');
        if (overlay) overlay.style.display = "flex";
        
        // লগইন বক্স দৃশ্যমান হলে নতুন গাণিতিক ক্যাপচা তৈরি করা
        generateCaptcha();
    }

    // ফাংশনসমূহ নিরাপদভাবে কল করা
    initializeSidebar();
    setupLiveSearch();
    setupUniversalLinkHandler();
});
