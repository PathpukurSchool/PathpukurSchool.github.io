// =================================
// ⚡ SUPABASE INITIALIZATION
// =================================
const SUPABASE_URL = 'https://bjjwzgzjjcpnndbuelkh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqand6Z3pqamNwbm5kYnVlbGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTk1NDMsImV4cCI6MjEwMjM5NTU0M30.ICT0pRA2GtlJhxKxo8ghp0x2pVLem1csBkq_hvNVGUs';

// Supabase Client তৈরি
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
// 🔢 ক্যাপচা ফাংশনালিটি (Cryptographically Secure & Timeout)
// =================================
let currentCaptchaCode = "";
let captchaTimer = null; // 👈 ১. নতুন টাইমার ভ্যারিয়েবল
const CAPTCHA_EXPIRE_TIME = 2 * 60 * 1000; // 👈 ২. ২ মিনিট (মেগাসেকেন্ডে)

function generateCaptcha() {
    const captchaElement = document.getElementById('captchaCode');
    const userInput = document.getElementById('userCaptcha');
    const errorDiv = document.getElementById('masterLoginError');
    
    if (!captchaElement) return;

    // ১. আগের টাইমার বন্ধ করা
    if (captchaTimer) clearTimeout(captchaTimer);

    // ২. ক্যাপচা রিফ্রেশ হলে পুরানো এরর মেসেজ মুছে ফেলা ও কালার রিসেট
    if (errorDiv) {
        errorDiv.innerText = "";
    }
    captchaElement.style.color = ""; // ক্যাপচার সাধারণ রঙে ফিরিয়ে নেওয়া

    // অস্পষ্ট অক্ষর (যেমন: 0, O, I, 1, l) বাদ দেওয়া হয়েছে
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const length = 5;
    let captcha = "";
    
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
        captcha += chars.charAt(randomValues[i] % chars.length);
    }

    currentCaptchaCode = captcha;
    captchaElement.innerText = captcha;
    
    if (userInput) userInput.value = ""; // ইনপুট ফিল্ড রিসেট

    // ৩. নির্দিষ্ট সময় পর ক্যাপচা Expired করার টাইমার চালু
    captchaTimer = setTimeout(() => {
        currentCaptchaCode = ""; // ক্যাপচা কোড ইনভ্যালিড করা
        
        // EXPIRED লেখাটি লাল রঙে দেখানো
        captchaElement.innerText = "EXPIRED";
        captchaElement.style.color = "red"; 

        // এরর মেসেজটি লাল রঙে দেখানো
        if (errorDiv) {
            errorDiv.innerText = "⏳ CAPTCHA expired! Please refresh CAPTCHA.";
            errorDiv.style.color = "red";
        }
    }, CAPTCHA_EXPIRE_TIME);
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

    // লোকাল স্টোরেজে ভুল চেষ্টার হিসাব রাখা (Brute-Force Protection)
    let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    let lockUntil = parseInt(localStorage.getItem('lockUntil') || '0', 10);

    // ১. যদি একাউন্ট সাময়িকভাবে লক থাকে
    if (Date.now() < lockUntil) {
        let remainingMins = Math.ceil((lockUntil - Date.now()) / 60000);
        if (errorDiv) {
            errorDiv.innerText = `⛔ Too many failed attempts. Locked for ${remainingMins} minutes.`;
            errorDiv.style.color = "red";
        }
        return;
    }
    
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

    // 🔹 ID বা Password ফাঁকা থাকলে সতর্কবার্তা
    if (!id || !pass) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please fill both ID & Password.";
            errorDiv.style.color = "red";
        }
        return;
    }

    // 🔹 ক্যাপচা ফাঁকা থাকলে সতর্কবার্তা
    if (!userCaptcha) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please enter the CAPTCHA code.";
            errorDiv.style.color = "red";
        }
        return;
    }

    // 👈 ৫. ক্যাপচার মেয়াদ শেষ (Expired) হয়েছে কিনা তা পরীক্ষা
    if (currentCaptchaCode === "") {
        if (errorDiv) {
            errorDiv.innerText = "⏳ CAPTCHA expired! Click refresh to get a new code.";
            errorDiv.style.color = "red";
        }
        generateCaptcha(); // স্বয়ংক্রিয়ভাবে নতুন ক্যাপচা তৈরি করবে
        return;
    }

    // 🔹 ক্যাপচা ভুল হলে মেসেজ
    if (userCaptcha.toLowerCase() !== currentCaptchaCode.toLowerCase()) {
        if (errorDiv) {
            errorDiv.innerText = "❌ Invalid CAPTCHA code! Please try again.";
            errorDiv.style.color = "red";
        }
        generateCaptcha();
        return;
    }

    // বাটনের অবস্থা পরিবর্তন
    if (loginBtn) {
        loginBtn.innerText = "Validating...";
        loginBtn.disabled = true;
    }

    try {
        // 🔹 SUPABASE RPC কল (check_teacher_login ফাংশন দিয়ে আইডি ও পাসওয়ার্ড যাচাই)
        const { data: isValidUser, error } = await supabaseClient.rpc('check_teacher_login', {
            p_id: id,
            p_pass: pass
        });

        if (error) throw error;

        if (isValidUser) {
            if (captchaTimer) clearTimeout(captchaTimer);
            // সঠিক লগইন: আগের সমস্ত লিমিট ক্লিয়ার করা
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lockUntil');

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
            // ❌ ভুল ID বা Password হলে ভুল চেষ্টার লিমিট বাড়ানো
            loginAttempts++;
            if (loginAttempts >= 3) {
                // ৩ বার ভুল হলে ৫ মিনিটের জন্য ব্লক
                lockUntil = Date.now() + (5 * 60 * 1000); 
                localStorage.setItem('lockUntil', lockUntil.toString());
                loginAttempts = 0;
                localStorage.setItem('loginAttempts', '0');
                
                if (errorDiv) {
                    errorDiv.innerText = "⛔ Locked due to 3 failed attempts! Try after 5 minutes.";
                    errorDiv.style.color = "red";
                }
            } else {
                localStorage.setItem('loginAttempts', loginAttempts.toString());
                if (errorDiv) {
                    errorDiv.innerText = `❌ Incorrect ID/Password! Attempt ${loginAttempts} of 3.`;
                    errorDiv.style.color = "red";
                }
            }
           
            generateCaptcha();
            if (loginBtn) {
                loginBtn.innerText = "🔓 Login";
                loginBtn.disabled = false;
            }
        }

    } catch (error) {
        console.error("Error connecting to Supabase:", error);
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Authentication error. Contact Administrator.";
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

// 🚫 রাইট-ক্লিক, F12 এবং সোর্স কোড দেখা নিষ্ক্রিয় করা
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
// 🔔 AVAILABLE SOON MESSAGE & CLICK HANDLER
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
    document.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.exam-link, .nav-link, .class-link-btn');

        if (targetBtn) {
            const href = targetBtn.getAttribute('href');

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
        
        generateCaptcha();
    }

    initializeSidebar();
    setupLiveSearch();
    setupUniversalLinkHandler();
});
