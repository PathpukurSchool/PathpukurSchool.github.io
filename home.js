// =================================
// 🛡️ SECURITY & CLIENT HARDENING
// =================================
// ১. রাইট-ক্লিক এবং Developer Tools (F12, Inspect Element) ব্লক করা
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', function(event) {
    if (
        event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'C')) || 
        (event.ctrlKey && event.key === 'U')
    ) {
        event.preventDefault();
        alert("🔒 Security Alert: Inspecting source code is disabled for data privacy!");
        return false;
    }
});

// =================================
// ⚡ SUPABASE INITIALIZATION
// =================================
// ⚠️ আপনার Supabase Project URL এবং anon key নিচে বসান
const SUPABASE_URL = 'https://bjjwzgzjjcpnndbuelkh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqand6Z3pqamNwbm5kYnVlbGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTk1NDMsImV4cCI6MjEwMjM5NTU0M30.ICT0pRA2GtlJhxKxo8ghp0x2pVLem1csBkq_hvNVGUs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI Utility Function
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
// 🔍 Live Search Functionality
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
// 🔢 MATH CAPTCHA
// =================================
let captchaResult = null;

function generateCaptcha() {
    const captchaElement = document.getElementById('captchaCode');
    const userInput = document.getElementById('userCaptcha');
    
    if (!captchaElement) return;

    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let expressionText = "";

    if (operator === '+') {
        captchaResult = num1 + num2;
        expressionText = `${num1} + ${num2} = ?`;
    } else if (operator === '-') {
        const max = Math.max(num1, num2);
        const min = Math.min(num1, num2);
        captchaResult = max - min;
        expressionText = `${max} - ${min} = ?`;
    } else if (operator === '×') {
        captchaResult = num1 * num2;
        expressionText = `${num1} × ${num2} = ?`;
    }

    captchaElement.innerText = expressionText;
    if (userInput) userInput.value = ""; 
}

// =================================
// 🔐 SECURE SUPABASE LOGIN & RATE LIMITING
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

    const email = idInput.value.trim(); // Supabase Auth ইমেইল ফরম্যাট গ্রহণ করে
    const pass = passInput.value.trim();
    const userCaptcha = captchaInput.value.trim();

    if (errorDiv) errorDiv.innerText = "";
    if (successDiv) {
        successDiv.innerText = "";
        successDiv.style.display = "none";
    }

    // 🔴 1. BRUTE-FORCE RATE LIMITING CHECK
    let lockUntil = parseInt(localStorage.getItem('lockUntil') || '0', 10);
    if (Date.now() < lockUntil) {
        let remainingMins = Math.ceil((lockUntil - Date.now()) / 60000);
        if (errorDiv) {
            errorDiv.innerText = `⛔ Maximum failed attempts reached! System locked for ${remainingMins} minutes.`;
            errorDiv.style.color = "red";
        }
        return;
    }

    // Validation Check
    if (!email || !pass) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please enter Email ID & Password.";
            errorDiv.style.color = "red";
        }
        return;
    }

    if (!userCaptcha) {
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Please enter the CAPTCHA answer.";
            errorDiv.style.color = "red";
        }
        return;
    }

    if (parseInt(userCaptcha, 10) !== captchaResult) {
        if (errorDiv) {
            errorDiv.innerText = "❌ Incorrect CAPTCHA answer! Please try again.";
            errorDiv.style.color = "red";
        }
        generateCaptcha();
        return;
    }

    if (loginBtn) {
        loginBtn.innerText = "Authenticating with Server...";
        loginBtn.disabled = true;
    }

    try {
        // 🔒 2. SUPABASE SERVER-SIDE AUTHENTICATION
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass,
        });

        if (error) {
            // ভুল লগইনের জন্য Rate Limit ট্র্যাকিং
            let attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10) + 1;
            
            if (attempts >= 4) {
                // ৪ বার ভুল করলে ১০ মিনিটের জন্য সম্পূর্ণ ব্লক
                const lockTime = Date.now() + (10 * 60 * 1000); 
                localStorage.setItem('lockUntil', lockTime.toString());
                localStorage.setItem('loginAttempts', '0');
                if (errorDiv) {
                    errorDiv.innerText = "⛔ System Locked due to 4 consecutive failed login attempts! Try after 10 minutes.";
                    errorDiv.style.color = "red";
                }
            } else {
                localStorage.setItem('loginAttempts', attempts.toString());
                if (errorDiv) {
                    errorDiv.innerText = `❌ Invalid ID or Password! Attempt ${attempts} of 4.`;
                    errorDiv.style.color = "red";
                }
            }
            
            generateCaptcha();
            if (loginBtn) {
                loginBtn.innerText = "🔓 Login";
                loginBtn.disabled = false;
            }
            return;
        }

        // 🟢 3. SUCCESSFUL LOGIN
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockUntil');
        
        sessionStorage.setItem("userType", "teacher");
        sessionStorage.setItem("teacherLoggedIn", "true");
        sessionStorage.setItem("accessToken", data.session.access_token);

        if (successDiv) {
            successDiv.innerText = "✔️ Server Authentication Successful!";
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

    } catch (err) {
        console.error("Supabase Login Error:", err);
        if (errorDiv) {
            errorDiv.innerText = "⚠️ Server connectivity issue. Check network connection.";
            errorDiv.style.color = "red";
        }
        generateCaptcha();
        if (loginBtn) {
            loginBtn.innerText = "🔓 Login";
            loginBtn.disabled = false;
        }
    }
}

// 🔒 LOGOUT SYSTEM
async function logout() {
    try {
        await supabase.auth.signOut();
    } catch(e) { console.log(e); }
    
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
}

// =================================
// ⏳ AUTOMATIC INACTIVITY LOGOUT (15 Mins)
// =================================
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

// Available Soon & Sidebar Handlers
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
// 🚀 INITIALIZATION
// =================================
document.addEventListener("DOMContentLoaded", async () => {
    // 🔍 Supabase Session Verification
    const { data: { session } } = await supabase.auth.getSession();

    if (session && sessionStorage.getItem("teacherLoggedIn") === "true") {
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
