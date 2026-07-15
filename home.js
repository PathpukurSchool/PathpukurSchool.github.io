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

// পরীক্ষার টেক্সট ফেরত দেয়
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];

    switch (exam) {
        case 'TEST': return 'TEST EXAM';
        case 'SEM1': return 'SEMESTER I';
        case 'SEM2': return 'SEMESTER II';
        case '1ST':  return '1ST';
        case '2ND':  return '2ND';
        case '3RD':  return '3RD';
        default:     return exam;
    }
}

// পেজিনেশন বোতাম তৈরি করে (ইনলাইন স্টাইল বাদ দিয়ে সম্পূর্ণ ক্লাস ভিত্তিক)
function createButton(text, onClick, disabled = false) {
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
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passInput.type = "password";
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
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
                document.getElementById('masterLoginOverlay').style.display = "none";
                document.body.classList.remove('no-scroll');
                loadExamLinks();
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
// 📚 এক্সাম লিংক লোডিং (শিক্ষক/অ্যাডমিন)
// =================================
let credentials = {};

function loadExamLinks() {
    fetch('config.json')
        .then(response => {
            if (!response.ok) throw new Error('config.json not found');
            return response.json();
        })
        .then(data => {
            credentials = data;
            renderButtons();
        })
        .catch(err => {
            console.error('Error loading config.json:', err);
            document.getElementById('exam-buttons').innerHTML = "<p class='exam-link-error'>Exam links not available.</p>";
        });
}

function renderButtons() {
    const mainContainer = document.getElementById('exam-buttons');
    if (!mainContainer) return;
    mainContainer.innerHTML = '';

    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];
    const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const sortedClasses = classes.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    sortedClasses.forEach(cls => {
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box';
        classBox.id = `class-${cls}`;

        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading shine';
        boxHeading.textContent = 'CLASS ' + cls;
        classBox.appendChild(boxHeading);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exam-buttons-group';

        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (credentials[key]) {
                const button = document.createElement('button');
                button.className = 'box-button exam-link';
                button.dataset.key = key;

                button.textContent = getExamText(key);
                
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => window.open(credentials[key].url, '_blank');
                } else {
                    button.onclick = () => showAvailableSoonMessage(key);
                    button.classList.add('disabled-exam-link');
                }
                buttonsContainer.appendChild(button);
            }
        });
        
        if (buttonsContainer.children.length > 0) {
            classBox.appendChild(buttonsContainer);
            mainContainer.appendChild(classBox);
        }
    });
}

function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    const link = container.querySelector(`[data-key="${key}"]`);
    
    if (link) {
        const next = link.nextElementSibling;
        if (next && next.classList.contains('avail-msg')) next.remove();

        const msg = document.createElement('div');
        msg.className = 'avail-msg';
        msg.textContent = '🔔 Available Soon 🔔';

        link.parentNode.insertBefore(msg, link.nextSibling);

        setTimeout(() => { if (msg.parentNode) msg.remove(); }, 3000);
    }
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
        itemDiv.classList.add('notice-item');

        const titleText = item.text || "No Title";
        const dateText = item.date ? ` [Date: ${item.date}]` : '';
        const isItemNew = ['Yes', 'NEW', true].includes(item.isNew);
        
        let itemContent = titleText + dateText;
        if (isItemNew) {
            itemContent += ` <span class="new-badge">✨ NEW</span>`;
            itemDiv.classList.add('new-notice-highlight');
        }
        
        itemDiv.innerHTML = itemContent;
        itemDiv.onclick = () => showPopup(item.text, item.date, item.link, item.subj);
        container.appendChild(itemDiv);
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer || totalPages <= 1) return;
    paginationContainer.innerHTML = '';

    const backBtn = createButton('BACK', () => {
        if (currentPage > 1) { currentPage--; renderHelpList(); }
    }, currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Page ${currentPage}/${totalPages}`;
    pageInfo.classList.add('page-info');

    const nextBtn = createButton('NEXT', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);

    paginationContainer.append(backBtn, pageInfo, nextBtn);
}

function showPopup(titleText, date, link, subjText) {
    const existing = document.getElementById('notice-popup');
    if (existing) existing.remove();
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    overlay.classList.add('popup-overlay'); 
    overlay.onclick = () => { popup.remove(); overlay.remove(); };

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
        const linkBtn = document.createElement('button');
        linkBtn.innerText = 'Open Link';
        linkBtn.classList.add('popup-link-btn'); 
        linkBtn.onclick = () => window.open(link, '_blank');
        buttonContainer.appendChild(linkBtn);
    }

    const downloadBtn = createButton('Download', () => {
        buttonContainer.style.visibility = 'hidden';
        const originalMaxHeight = popup.style.maxHeight;
        const originalOverflowY = popup.style.overflowY;

        popup.style.maxHeight = 'none';
        popup.style.overflowY = 'visible';

        setTimeout(() => {
            if (typeof html2canvas !== 'undefined') {
                 html2canvas(popup).then(canvas => {
                    let safeTitle = (titleText || "notice").replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "_");
                    const dlLink = document.createElement('a');
                    dlLink.download = safeTitle + ".png";
                    dlLink.href = canvas.toDataURL();
                    dlLink.click();

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

    const closeBtn = createButton('Back', () => { popup.remove(); overlay.remove(); });
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

    navLinks.forEach(link => {
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

                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                setTimeout(() => { targetSection.classList.remove("highlight-section"); }, 3000);
            }
        });
    });
}

// =================================
// 🎓 স্টুডেন্ট এক্সাম লিংক লোডিং (বোতামের প্রোপার্টি ফিক্সড)
// =================================
function loadStudentExamLinks() {
    fetch("home_url.json")
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".exam-link").forEach(button => {
                const id = button.id;
                if (data[id]) {
                    // button-এর ক্ষেত্রে href না দিয়ে click ইভেন্ট হ্যান্ডেল করা ভালো
                    button.onclick = () => window.open(data[id], '_blank');
                    button.classList.remove('disabled-exam-link');
                } else {
                    button.onclick = (event) => {
                        event.preventDefault();
                        button.style.display = 'none';

                        const message = document.createElement('div');
                        message.className = 'avail-msg';
                        message.textContent = '🔔 Available Soon 🔔';
                        button.parentNode.appendChild(message);

                        setTimeout(() => {
                            message.remove();
                            button.style.display = '';
                        }, 3000);
                    };
                }
            });
        })
        .catch(error => console.error("Error loading student URLs:", error));
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

// =================================
// 🚀 ইনিশিয়ালাইজেশন এবং ইভেন্ট লিসেনার
// =================================
function logout() {
    sessionStorage.clear();
    window.location.replace("index.html");
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add('no-scroll');
    fetchNotices();
    initializeSidebar();
    loadStudentExamLinks();
    loadExamDates();

    if (examDatesMarquee) {
        const pause = () => { examDatesMarquee.style.animationPlayState = 'paused'; };
        const run = () => { examDatesMarquee.style.animationPlayState = 'running'; };

        examDatesMarquee.addEventListener("mouseover", pause);
        examDatesMarquee.addEventListener("mouseout", run);
        examDatesMarquee.addEventListener("touchstart", pause);
        examDatesMarquee.addEventListener("touchend", run);
    }
});
