// =================================
// ⚡ SUPABASE INITIALIZATION
// =================================
const SUPABASE_URL = 'https://bjjwzgzjjcpnndbuelkh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqand6Z3pqamNwbm5kYnVlbGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTk1NDMsImV4cCI6MjEwMjM5NTU0M30.ICT0pRA2GtlJhxKxo8ghp0x2pVLem1csBkq_hvNVGUs';

// Supabase Client তৈরি
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================================
// 🛡️ BROWSER & DEVICE FINGERPRINTING
// =================================
function getDeviceFingerprint() {
    let deviceId = localStorage.getItem('uniqueDeviceId');
    if (!deviceId) {
        // ব্রাউজার ও ডিভাইসের বিভিন্ন ইউনিক প্রপার্টি মিলিয়ে একটি শক্তিশালী ফিঙ্গারপ্রিন্ট তৈরি
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        let glVendor = '';
        let glRenderer = '';
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                glRenderer = gl.getParameter(debugInfo.RENDERER_WEBGL);
            }
        }

        const rawString = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            glVendor,
            glRenderer
        ].join('||');

        // সহজ ও ইউনিক হ্যাশ জেনারেটর
        let hash = 0;
        for (let i = 0; i < rawString.length; i++) {
            const char = rawString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; 
        }
        deviceId = 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        localStorage.setItem('uniqueDeviceId', deviceId);
    }
    return deviceId;
}

// =================================
// 🔄 LOADER SHOW/HIDE UTILITY
// =================================
function showLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = 'none';
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
// 🔢 ক্যাপচা ফাংশনালিটি
// =================================
let currentCaptchaCode = "";
let captchaTimer = null;
const CAPTCHA_EXPIRE_TIME = 2 * 60 * 1000; // ২ মিনিট

function getRandomValuesFallback(array) {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        try {
            window.crypto.getRandomValues(array);
            return;
        } catch (e) {
            console.warn("Crypto API failed, falling back to Math.random");
        }
    }
    for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 4294967296);
    }
}

function generateCaptcha(clearError = true) {
    const canvas = document.getElementById('captchaCanvas');
    const userInput = document.getElementById('userCaptcha');
    const errorDiv = document.getElementById('masterLoginError');
    
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (captchaTimer) clearTimeout(captchaTimer);
    if (clearError && errorDiv) {
        errorDiv.innerText = "";
    }

    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f2f2f2";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const length = 5;
        let captcha = "";
        const randomValues = new Uint32Array(length);
        
        getRandomValuesFallback(randomValues);

        for (let i = 0; i < length; i++) {
            captcha += chars.charAt(randomValues[i] % chars.length);
        }
        currentCaptchaCode = captcha;

        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineWidth = 1 + Math.random();
            ctx.stroke();
        }

        ctx.font = "bold 22px sans-serif";
        ctx.textBaseline = "middle";
        
        for (let i = 0; i < length; i++) {
            ctx.fillStyle = `rgb(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150})`;
            ctx.save();
            ctx.translate(20 + i * 22, 28);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(captcha[i], 0, 0);
            ctx.restore();
        }

        ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
        ctx.beginPath();
        ctx.moveTo(10, Math.random() * canvas.height);
        ctx.lineTo(canvas.width - 10, Math.random() * canvas.height);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (userInput) userInput.value = "";

        captchaTimer = setTimeout(() => {
            currentCaptchaCode = "";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffe6e6";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = "bold 18px sans-serif";
            ctx.fillStyle = "red";
            ctx.fillText("EXPIRED", 28, 26);

            if (errorDiv) {
                errorDiv.innerText = "⏳ CAPTCHA expired! Please refresh CAPTCHA.";
                errorDiv.style.color = "red";
            }
        }, CAPTCHA_EXPIRE_TIME);

    } catch (err) {
        console.error("CAPTCHA Generation Error:", err);
    }
}

// =================================
// 🔐 মাস্টার লগইন ও সুপাবেস নিরাপত্তা ফাংশন
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
    const loginBtn = document.getElementById('masterLoginBtn');

    if (!idInput || !passInput || !captchaInput) return;

    const deviceId = getDeviceFingerprint();

    // 1. সাবমিট করার আগেই সুপাবেস থেকে ডিভাইস লক চেক করা যাক
    try {
        const { data: lockCheck } = await supabaseClient.rpc('check_and_update_device_lock', {
            p_device_id: deviceId,
            p_failed_action: false
        });

        if (lockCheck && lockCheck.length > 0 && lockCheck[0].is_locked) {
            lockDeviceUI(errorDiv, idInput, passInput, captchaInput, loginBtn);
            return;
        }
    } catch (e) {
        console.error("Lock check error:", e);
    }

    let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);

    const id = idInput.value.trim();
    const pass = passInput.value.trim();
    const userCaptcha = captchaInput.value.trim();

    if (errorDiv) errorDiv.innerText = "";
    if (successDiv) {
        successDiv.innerText = "";
        successDiv.style.display = "none";
    }

    if (!id || !pass) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please fill in both ID & Password.";
            errorDiv.style.color = "red";
        }
        return;
    }

    if (!userCaptcha) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please enter the CAPTCHA code.";
            errorDiv.style.color = "red";
        }
        return;
    }

    if (currentCaptchaCode === "") {
        if (errorDiv) {
            errorDiv.innerText = "⏳ CAPTCHA expired! Click refresh to get a new code.";
            errorDiv.style.color = "red";
        }
        generateCaptcha(false);
        return;
    }

    if (userCaptcha.toLowerCase() !== currentCaptchaCode.toLowerCase()) {
        loginAttempts++;
        await handleFailedAttempt(loginAttempts, errorDiv, "❌ Invalid CAPTCHA code!", deviceId, idInput, passInput, captchaInput, loginBtn);
        generateCaptcha(false);
        return;
    }

    if (loginBtn) {
        loginBtn.innerText = "Validating...";
        loginBtn.disabled = true;
    }

    try {
        const { data: isValidUser, error } = await supabaseClient.rpc('check_teacher_login', {
            p_id: id,
            p_pass: pass
        });

        if (error) throw error;

        if (isValidUser) {
            if (captchaTimer) clearTimeout(captchaTimer);
            localStorage.removeItem('loginAttempts');

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
            loginAttempts++;
            await handleFailedAttempt(loginAttempts, errorDiv, "❌ Incorrect ID or Password!", deviceId, idInput, passInput, captchaInput, loginBtn);
            generateCaptcha(false);
            if (loginBtn) {
                loginBtn.innerText = "🔓 Login";
                loginBtn.disabled = false;
            }
        }

    } catch (error) {
        console.error("Error connecting to Supabase:", error);
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Authentication error! Please contact Administrator.";
            errorDiv.style.color = "red";
        }
        generateCaptcha(false);
        if (loginBtn) {
            loginBtn.innerText = "🔓 Login";
            loginBtn.disabled = false;
        }
    }
}

// 📌 ৪ বার ভুল হলে সুপাবেসে ডিভাইস লক করা এবং UI লক করা
async function handleFailedAttempt(attempts, errorDiv, mainMsg, deviceId, idInput, passInput, captchaInput, loginBtn) {
    if (attempts >= 4) {
        // সুপাবেসে ২৪ ঘণ্টার জন্য ডিভাইস লক এন্ট্রি করা
        try {
            await supabaseClient.rpc('check_and_update_device_lock', {
                p_device_id: deviceId,
                p_failed_action: true,
                p_lock_duration_hours: 24
            });
        } catch (e) {
            console.error("Failed to update device lock in DB:", e);
        }

        localStorage.setItem('loginAttempts', '0');
        lockDeviceUI(errorDiv, idInput, passInput, captchaInput, loginBtn);
    } else {
        localStorage.setItem('loginAttempts', attempts.toString());
        let remainingAttempts = 4 - attempts;
        if (errorDiv) {
            errorDiv.innerText = `${mainMsg} (Attempt ${attempts} of 4). ${remainingAttempts} attempt(s) remaining.`;
            errorDiv.style.color = "red";
        }
    }
}

// 🔒 লক অবস্থায় ইনপুট ফিল্ড ও বাটন হাইড বা ডিজেবল করার ফাংশন
function lockDeviceUI(errorDiv, idInput, passInput, captchaInput, loginBtn) {
    if (errorDiv) {
        errorDiv.innerText = `⛔ Account locked due to multiple failed login attempts!`;
        errorDiv.style.color = "red";
    }
    if (idInput) idInput.style.display = 'none';
    if (passInput) passInput.style.display = 'none';
    if (captchaInput) captchaInput.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    
    // পাসওয়ার্ড টগল বা লেবেল থাকলে তাও হাইড করতে পারেন
    const passToggle = document.getElementById('masterPassToggle');
    if (passToggle) passToggle.style.display = 'none';
}

// 🔒 স্ট্রং লগআউট সিস্টেম
function logout() {
    sessionStorage.clear();
    localStorage.removeItem('loginAttempts');
    window.location.reload();
}

// 🚫 রাইট-ক্লিক, F12 নিষ্ক্রিয় করা
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', function(event) {
    if (
        event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'C')) || 
        (event.ctrlKey && event.key === 'U')
    ) {
        event.preventDefault();
        alert("🔒 Security Alert: This action is restricted!");
        return false;
    }
});

// =================================================================
// ⏳ অটোমেটিক ইনঅ্যাক্টিভিটি লগআউট (১৫ মিনিট)
// =================================================================
let inactivityTimer;
const TIMEOUT_DURATION = 15 * 60 * 1000;

function startAutoLogoutTimer() {
    if (sessionStorage.getItem("teacherLoggedIn") !== "true") return;

    function resetTimer() {
        localStorage.setItem('lastActivityTime', Date.now().toString());

        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            checkAndPerformAutoLogout();
        }, TIMEOUT_DURATION);
    }

    function checkAndPerformAutoLogout() {
        if (sessionStorage.getItem("teacherLoggedIn") !== "true") return;

        const lastActivity = localStorage.getItem('lastActivityTime');
        const currentTime = Date.now();

        if (lastActivity && (currentTime - parseInt(lastActivity, 10)) >= TIMEOUT_DURATION) {
            logout();
        }
    }

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => {
        document.addEventListener(evt, resetTimer, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkAndPerformAutoLogout();
        }
    });

    window.addEventListener('focus', checkAndPerformAutoLogout);

    resetTimer();
}

// =================================
// 🔔 AVAILABLE SOON MESSAGE
// =================================
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

function setupUniversalLinkHandler() {
    document.querySelectorAll('a').forEach(a => {
        a.setAttribute('target', '_self');
    });

    document.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('a, .exam-link, .nav-link, .class-link-btn, .item-btn');

        if (targetBtn) {
            const href = targetBtn.getAttribute('href');

            if (!href || href.trim() === '' || href.trim() === '#' || href.startsWith('javascript:')) {
                event.preventDefault();
                showAvailableSoonMessage(targetBtn);
                return;
            }
            if (!href.startsWith('#')) {
                event.preventDefault();
                showLoader();
                window.location.href = href;
            }
        }
    }, true);
}

// =================================
// 🧭 সাইড বার মেনু ও ড্রপডাউন ফাংশন
// =================================
function initializeSidebar() {
    const menuButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');

    if (!menuButton || !sidebar || !overlay) return;

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

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
// 🚀 ইনিশিয়ালাইজেশন (Page Load) ও ইনস্ট্যান্ট ডিভাইস লক চেক
// =================================
document.addEventListener("DOMContentLoaded", async () => {
    showLoader();

    const deviceId = getDeviceFingerprint();
    const overlay = document.getElementById('masterLoginOverlay');
    const mainContent = document.getElementById('main-website-content');
    const searchContainer = document.querySelector('.search-container');
    const errorDiv = document.getElementById('masterLoginError');
    const idInput = document.getElementById('masterId');
    const passInput = document.getElementById('masterPass');
    const captchaInput = document.getElementById('userCaptcha');
    const loginBtn = document.getElementById('masterLoginBtn');

    try {
        // পেজ ওপেন হওয়ার সাথেই সুপাবেস ডাটাবেস থেকে চেক করা যে এই ডিভাইসটি লক আছে কি না
        const { data: lockCheck } = await supabaseClient.rpc('check_and_update_device_lock', {
            p_device_id: deviceId,
            p_failed_action: false
        });

        if (lockCheck && lockCheck.length > 0 && lockCheck[0].is_locked) {
            // যদি লক করা থাকে, তবে সাথে সাথে ইনপুট ফিল্ড হাইড হয়ে যাবে এবং কোনো সময় দেখাবে না
            if (overlay) overlay.style.display = "flex";
            lockDeviceUI(errorDiv, idInput, passInput, captchaInput, loginBtn);
        } else {
            if (sessionStorage.getItem("teacherLoggedIn") === "true") {
                if (overlay) overlay.style.display = "none";
                if (mainContent) mainContent.style.display = "block";
                if (searchContainer) searchContainer.style.display = "block";

                startAutoLogoutTimer();
            } else {
                if (overlay) overlay.style.display = "flex";
                generateCaptcha(true);
            }
        }
    } catch (err) {
        console.error("Initial load check error:", err);
        if (overlay) overlay.style.display = "flex";
        generateCaptcha(true);
    }

    initializeSidebar();
    setupLiveSearch();
    setupUniversalLinkHandler();
    hideLoader();
});

window.addEventListener('pageshow', (event) => {
    hideLoader();
});
