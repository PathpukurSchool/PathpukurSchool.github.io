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
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');
    const loginBtn = document.querySelector('#masterLoginBox button');

    if (!idInput || !passInput) return;

    const id = idInput.value.trim();
    const pass = passInput.value.trim();

    if (errorDiv) errorDiv.innerText = "";
    if (successDiv) {
        successDiv.innerText = "";
        successDiv.style.display = "none";
    }

    if (!id || !pass) {
        if (errorDiv) {
            errorDiv.innerText = "Please fill ID & Password.";
            errorDiv.style.color = "red";
        }
        return;
    }

    if (loginBtn) {
        loginBtn.innerText = "Loading...";
        loginBtn.disabled = true;
    }

    try {
        const config = await fetch("masterConfig.json").then(r => {
            if (!r.ok) throw new Error('Teacher Login load failed');
            return r.json();
        });

        const idHashed = await sha256(id + config.Logid);
        const passHashed = await sha256(pass + config.Logpassword);

        if (idHashed === config.idHash && passHashed === config.passHash) {
            // সিকিউরিটি বৃদ্ধি: সেশন ডাটা প্লাস টাইমস্ট্যাম্প সংরক্ষণ
            sessionStorage.setItem("userType", "teacher");
            sessionStorage.setItem("teacherLoggedIn", "true");
            sessionStorage.setItem("loginTimestamp", Date.now().toString());

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
                startAutoLogoutTimer(); // অটো লগআউট টাইমার চালু
            }, 800);

        } else {
            if (errorDiv) {
                errorDiv.innerText = "Incorrect ID or Password!";
                errorDiv.style.color = "red";
            }
            if (loginBtn) {
                loginBtn.innerText = "LOGIN";
                loginBtn.disabled = false;
            }
        }

    } catch (error) {
        console.error("Error loading teacher login", error);
        if (errorDiv) {
            errorDiv.innerText = "Error loading configuration.";
            errorDiv.style.color = "red";
        }
        if (loginBtn) {
            loginBtn.innerText = "LOGIN";
            loginBtn.disabled = false;
        }
    }
}

// 🔒 স্ট্রং লগআউট সিস্টেম
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    
    // পেজ রিফ্রেশ করে লগইন ওভারলে সক্রিয় করা
    window.location.reload();
}

// ⏳ অটোমেটিক ইনঅ্যাক্টিভিটি লগআউট (১৫ মিনিট নিষ্ক্রিয় থাকলে লগআউট হবে)
let inactivityTimer;
function startAutoLogoutTimer() {
    const timeoutDuration = 15 * 60 * 1000; // ১৫ মিনিট

    function resetTimer() {
        clearTimeout(inactivityTimer);
        if (sessionStorage.getItem("teacherLoggedIn") === "true") {
            inactivityTimer = setTimeout(() => {
                alert("Session expired due to inactivity. Please login again.");
                logout();
            }, timeoutDuration);
        }
    }

    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.onclick = resetTimer;
    document.onscroll = resetTimer;
}

// =================================
// 🎓 স্টুডেন্ট/ক্লাস এক্সাম লিংক লোডিং
// =================================

function loadStudentExamLinks() {
    fetch("home_url.json")
        .then(response => {
            if (!response.ok) throw new Error("home_url.json fetch failed");
            return response.json();
        })
        .then(data => {
            document.querySelectorAll(".exam-link[id]").forEach(button => {
                const id = button.id;
                if (data[id] && data[id].trim() !== '') {
                    button.onclick = (e) => {
                        e.preventDefault();
                        window.open(data[id], '_blank');
                    };
                } else if (!button.getAttribute('href') || button.getAttribute('href') === '#') {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        showAvailableSoonMessage(button);
                    });
                }
            });
        })
        .catch(error => console.error("Error loading student URLs:", error));
}

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
    }

    // ফাংশনসমূহ নিরাপদভাবে কল করা
    initializeSidebar();
    loadStudentExamLinks();
    setupLiveSearch();
});
