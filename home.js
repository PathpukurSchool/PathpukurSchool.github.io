// =================================
// ⚡ SUPABASE INITIALIZATION
// =================================
const SUPABASE_URL = 'https://bjjwzgzjjcpnndbuelkh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqand6Z3pqamNwbm5kYnVlbGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTk1NDMsImV4cCI6MjEwMjM5NTU0M30.ICT0pRA2GtlJhxKxo8ghp0x2pVLem1csBkq_hvNVGUs';

// Supabase Client তৈরি
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
// 🔢 ক্যাপচা ফাংশনালিটি (Cryptographically Secure & Timeout)
// =================================
let currentCaptchaCode = "";
let captchaTimer = null;
const CAPTCHA_EXPIRE_TIME = 2 * 60 * 1000; // ২ মিনিট

function generateCaptcha(clearError = true) {
    const canvas = document.getElementById('captchaCanvas');
    const userInput = document.getElementById('userCaptcha');
    const errorDiv = document.getElementById('masterLoginError');
    
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (captchaTimer) clearTimeout(captchaTimer);

    if (clearError && errorDiv) {
        errorDiv.innerText = "";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const length = 5;
    let captcha = "";
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

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

    ctx.font = "bold 22px Arial";
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
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("EXPIRED", 28, 26);

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
    const loginBtn = document.getElementById('masterLoginBtn');

    if (!idInput || !passInput || !captchaInput) return;

    let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    let lockUntil = parseInt(localStorage.getItem('lockUntil') || '0', 10);

    if (Date.now() < lockUntil) {
        let remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000);
        let remainingMins = Math.floor(remainingSeconds / 60);
        let secs = remainingSeconds % 60;
        
        if (errorDiv) {
            errorDiv.innerText = `⛔ Account locked due to multiple failed attempts. Try again in ${remainingMins}m ${secs}s.`;
            errorDiv.style.color = "red";
        }
        return;
    } 
    else if (lockUntil > 0) {
        localStorage.removeItem('lockUntil');
        localStorage.setItem('loginAttempts', '0');
        loginAttempts = 0;
    }

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
        showAttemptStatus(loginAttempts, errorDiv, "❌ Invalid CAPTCHA code!");
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
            }, 800);

        } else {
            loginAttempts++;
            showAttemptStatus(loginAttempts, errorDiv, "❌ Incorrect ID or Password!");
            
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

function showAttemptStatus(attempts, errorDiv, mainMsg) {
    if (attempts >= 5) {
        let lockUntil = Date.now() + (10 * 60 * 1000);
        localStorage.setItem('lockUntil', lockUntil.toString());
        localStorage.setItem('loginAttempts', '0');

        if (errorDiv) {
            errorDiv.innerText = `⛔ Account locked for 10 minutes due to 5 failed attempts!`;
            errorDiv.style.color = "red";
        }
    } else {
        localStorage.setItem('loginAttempts', attempts.toString());
        let remainingAttempts = 5 - attempts;
        if (errorDiv) {
            errorDiv.innerText = `${mainMsg} (Attempt ${attempts} of 5). ${remainingAttempts} attempt(s) remaining.`;
            errorDiv.style.color = "red";
        }
    }
}

// 🔒 ম্যানুয়াল লগআউট সিস্টেম
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

// 🎯 ইউনিভার্সাল লিংক হ্যান্ডলার (একই ট্যাবে ওপেন নিশ্চিতকরণ)
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
    showLoader();

    if (sessionStorage.getItem("teacherLoggedIn") === "true") {
        const overlay = document.getElementById('masterLoginOverlay');
        const mainContent = document.getElementById('main-website-content');
        const searchContainer = document.querySelector('.search-container');
        
        if (overlay) overlay.style.display = "none";
        if (mainContent) mainContent.style.display = "block";
        if (searchContainer) searchContainer.style.display = "block";
    } else {
        const overlay = document.getElementById('masterLoginOverlay');
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
