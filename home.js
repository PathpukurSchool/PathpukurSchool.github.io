// =================================
// ⚙️ ইউটিলিটি ফাংশন
// =================================

// SHA-256 hash function
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
// 🔐 মাস্টার লগইন ফাংশন
// =================================

function toggleMasterPasswordVisibility() {
    const passInput = document.getElementById('masterPass');
    const toggleIcon = document.getElementById('masterPassToggle');
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
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();

    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');
    const loginBtn = document.querySelector('#masterLoginBox button');

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";

    if (!id || !pass) {
        errorDiv.innerText = "Please fill ID & Password.";
        errorDiv.style.color = "red";
        return;
    }

    loginBtn.innerText = "Loading...";
    loginBtn.disabled = true;

    try {
        const config = await fetch("masterConfig.json").then(r => {
            if (!r.ok) throw new Error('Teacher Login load failed');
            return r.json();
        });

        const idHashed = await sha256(id + config.Logid);
        const passHashed = await sha256(pass + config.Logpassword);

        if (idHashed === config.idHash && passHashed === config.passHash) {
            sessionStorage.setItem("userType", "teacher");
            sessionStorage.setItem("teacherLoggedIn", "true");

            successDiv.innerText = "✔️ Login Successful.";
            successDiv.style.display = "block";

            setTimeout(() => {
                const overlay = document.getElementById('masterLoginOverlay');
                if (overlay) overlay.style.display = "none";
                document.body.classList.remove('no-scroll');
            }, 1000);
        } else {
            errorDiv.innerText = "Incorrect ID or Password!";
            errorDiv.style.color = "red";
            loginBtn.innerText = "LOGIN";
            loginBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error loading teacher login", error);
        errorDiv.innerText = "Error loading configuration.";
        errorDiv.style.color = "red";
        loginBtn.innerText = "LOGIN";
        loginBtn.disabled = false;
    }
}

// =================================
// 🎓 স্টুডেন্ট/ক্লাস এক্সাম লিংক লোডিং (সংশোধিত)
// =================================

function loadStudentExamLinks() {
    fetch("home_url.json")
        .then(response => {
            if (!response.ok) throw new Error("home_url.json fetch failed");
            return response.json();
        })
        .then(data => {
            // শুধুমাত্র যেসব এলিমেন্টে ID দেওয়া আছে সেগুলোর জন্য জেসন চেক হবে
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
// 📣 ডিজিটাল নোটিশ বোর্ড ফাংশন
// =================================

const APPS_SCRIPT_NOTICE_URL = "https://script.google.com/macros/s/AKfycbzxx7IEJEvQ3TRut_z0f51aI83r7JJ_H125d2eIK5G95IdzX-qs3H3PGVNFYBgc1OaV/exec?action=read";
const NOTICES_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;
let Helping = [];

async function fetchNotices() {
    const container = document.getElementById('help-list');
    if (container) container.innerHTML = errorBox("Loading...", "Please wait...");
    
    try {
        const response = await fetch(APPS_SCRIPT_NOTICE_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        Helping = Array.isArray(data.notices) ? data.notices : [];
        renderHelpList();
    } catch (error) {
        console.error("Failed to fetch notices:", error);
        if (container) container.innerHTML = errorBox("Error!", "Failed to load notices.");
    }
}

function renderHelpList() {
    const container = document.getElementById('help-list');
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(Helping) || Helping.length === 0) {
        container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
        return;
    }

    totalPages = Math.ceil(Helping.length / NOTICES_PER_PAGE);
    const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
    const noticesToRender = Helping.slice(startIndex, startIndex + NOTICES_PER_PAGE);

    noticesToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        const titleText = item.text || "No Title";
        const dateText = item.date ? ` [Date: ${item.date}]` : '';
        const isItemNew = item.isNew === true || item.isNew === 'Yes' || item.isNew === 'NEW';
        
        let itemContent = titleText + dateText;
        if (isItemNew) {
            itemContent += ` <span class="new-badge">✨ NEW</span>`;
            itemDiv.classList.add('new-notice-highlight');
        }
        
        itemDiv.innerHTML = itemContent;
        itemDiv.classList.add('notice-item'); 
        itemDiv.onclick = () => showPopup(item.text, item.date, item.link, item.subj);
        container.appendChild(itemDiv);
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const backBtn = createButton('BACK', '#ff9800', () => {
        if (currentPage > 1) { currentPage--; renderHelpList(); }
    }, currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Page ${currentPage}/${totalPages}`;
    pageInfo.classList.add('page-info');

    const nextBtn = createButton('NEXT', '#ff9800', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);

    paginationContainer.append(backBtn, pageInfo, nextBtn);
}

function showPopup(titleText, date, link, subjText) {
    const existing = document.getElementById('notice-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    overlay.classList.add('popup-overlay'); 
    overlay.onclick = () => {
        popup.remove();
        overlay.remove();
    };

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    popup.classList.add('popup-content'); 
    popup.onclick = (e) => e.stopPropagation();

    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = '<strong>Pathpukur High School (HS)</strong><br>Notice Board';
    schoolHeader.classList.add('school-header'); 
    popup.appendChild(schoolHeader);

    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.classList.add('notice-title'); 
    popup.appendChild(titleElem);

    if (date) {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        dateElem.classList.add('notice-date'); 
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.classList.add('notice-subject'); 
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'popup-button-container';
    buttonContainer.classList.add('popup-button-container'); 

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.classList.add('popup-link-btn'); 
        buttonContainer.appendChild(linkBtn);
    }

    const downloadBtn = createButton('Download', '#28a745', () => {
        buttonContainer.style.visibility = 'hidden';
        const originalMaxHeight = popup.style.maxHeight;
        const originalOverflowY = popup.style.overflowY;

        popup.style.maxHeight = 'none';
        popup.style.overflowY = 'visible';

        setTimeout(() => {
            if (typeof html2canvas !== 'undefined') {
                 html2canvas(popup).then(canvas => {
                    let safeTitle = (titleText || "notice")
                        .replace(/[\\/:*?"<>|]+/g, "")
                        .trim()
                        .replace(/\s+/g, "_");
                    
                    let fileName = safeTitle + ".png";
                    const a = document.createElement('a');
                    a.download = fileName;
                    a.href = canvas.toDataURL();
                    a.click();

                    popup.style.maxHeight = originalMaxHeight;
                    popup.style.overflowY = originalOverflowY;
                    buttonContainer.style.visibility = 'visible';
                });
            } else {
                alert("Error: html2canvas library is not loaded.");
                popup.style.maxHeight = originalMaxHeight;
                popup.style.overflowY = originalOverflowY;
                buttonContainer.style.visibility = 'visible';
            }
        }, 50);
    });

    const closeBtn = createButton('Back', '#dc3545', () => {
        popup.remove();
        overlay.remove();
    });

    buttonContainer.append(downloadBtn, closeBtn);
    popup.appendChild(buttonContainer);
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

// =================================
// 🧭 সাইড বার মেনু ও স্ক্রল ফাংশন
// =================================

function initializeSidebar() {
    const menuButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    const navLinks = sidebar?.querySelectorAll("a");

    if (!menuButton || !sidebar || !overlay) return;

    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    navLinks?.forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();

            navLinks.forEach(item => item.classList.remove("active-link"));
            this.classList.add("active-link");

            sidebar.classList.remove('active');
            overlay.classList.remove('active');

            const targetSectionId = this.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetSectionId);

            if (targetSection) {
                targetSection.classList.add("highlight-section");
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                setTimeout(() => {
                    targetSection.classList.remove("highlight-section");
                }, 3000);
            }
        });
    });
}

// =================================
// 📅 পরীক্ষার তারিখ মারকিউ
// =================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcYA8sdD__TgIe-mHKE9n1fabVv_pDFam1K59O9FdD13r5rVcg5_Mf005mcAWsa6xjA/exec';
const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

async function loadExamDates() {
    if (!examDatesMarquee) return;
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=get_github_data`);
        const data = await response.json();
        
        if (data && data.data) {
            examDatesMarquee.innerHTML = '';
            const formattedData = data.data.map(item => {
                return `<span class="marquee-item" style="color: ${item.color};">${item.text}</span>`;
            }).join(', ');
            
            const fullSpan = document.createElement("span");
            fullSpan.innerHTML = formattedData;
            examDatesMarquee.appendChild(fullSpan);
        }
    } catch (error) {
        console.error('Error loading exam dates:', error);
        examDatesMarquee.textContent = 'No exam dates available.';
    }
}

// Log out Function
function logout() {
    sessionStorage.removeItem("studentLoggedIn");
    sessionStorage.removeItem("teacherLoggedIn");
    window.location.replace("index.html");
}

// =================================
// 🚀 ইনিশিয়ালাইজেশন
// =================================

document.addEventListener("DOMContentLoaded", () => {
    fetchNotices();
    initializeSidebar();
    loadStudentExamLinks();
    loadExamDates();

    if (examDatesMarquee) {
        examDatesMarquee.addEventListener("mouseover", () => examDatesMarquee.style.animationPlayState = 'paused');
        examDatesMarquee.addEventListener("mouseout", () => examDatesMarquee.style.animationPlayState = 'running');
        examDatesMarquee.addEventListener("touchstart", () => examDatesMarquee.style.animationPlayState = 'paused');
        examDatesMarquee.addEventListener("touchend", () => examDatesMarquee.style.animationPlayState = 'running');
    }
});
