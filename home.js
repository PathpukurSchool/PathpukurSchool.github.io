// =================================
// ⚙️ ইউটিলিটি ফাংশন
// =================================

// SHA-256 hash function (js1 থেকে)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ত্রুটি বা লোডিং বার্তা তৈরির জন্য HTML (js1 থেকে ইনলাইন CSS সরানো হয়েছে)
function errorBox(title, message) {
    let typeClass = '';
    // টাইটেল অনুযায়ী ক্লাস নির্ধারণ করা
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

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', 'SEMESTER I', ...) (js1 থেকে)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];

    switch (exam) {
        case 'TEST':
            return 'TEST EXAM';
        case 'SEM1':
            return 'SEMESTER I';
        case 'SEM2':
            return 'SEMESTER II';
        case '1ST':
            return '1ST';
        case '2ND':
            return '2ND';
        case '3RD':
            return '3RD';
        default:
            return exam; // fallback
    }
}

// পেজিনেশন বোতাম তৈরি করে (js1 থেকে ইনলাইন CSS সরানো হয়েছে)
function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    btn.classList.add('pagination-btn');
    btn.classList.add(`btn-${text.toLowerCase()}`); // ব্যাকগ্রাউন্ড কালারের জন্য ক্লাস
    
    // hover effect এর জন্য জাভাস্ক্রিপ্ট ইভেন্ট
    btn.onmouseover = () => { btn.style.backgroundColor = '#e65100'; };
    btn.onmouseout = () => {
        // Class এর উপর ভিত্তি করে কালার সেট করা
        if (text === 'BACK' || text === 'NEXT') {
            btn.style.backgroundColor = '#ff9800';
        } else if (text === 'Download') {
            btn.style.backgroundColor = '#28a745';
        } else if (text === 'Back') {
            btn.style.backgroundColor = '#dc3545';
        }
    };
    
    return btn;
}

// =================================
// 🔐 মাস্টার লগইন ফাংশন
// =================================

// পাসওয়ার্ড দেখানোর টগল (js1 থেকে)
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

// মাস্টার লগইন সাবমিট (js1 থেকে)
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

// এক্সাম লিংক লোড (js1 থেকে)
function loadExamLinks() {
    fetch('config.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('config.json not found');
            }
            return response.json();
        })
        .then(data => {
            credentials = data;
            renderButtons();
        })
        .catch(err => {
            console.error('Error loading config.json:', err);
            // js1 থেকে ইনলাইন CSS সরানো হয়েছে
            document.getElementById('exam-buttons').innerHTML = "<p class='exam-link-error'>Exam links not available.</p>";
        });
}

// এক্সাম লিংক তৈরি ও দেখানো (js1 থেকে)
function renderButtons() {
    const mainContainer = document.getElementById('exam-buttons');
    mainContainer.innerHTML = '';

    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    const sortedClasses = classes.sort((a, b) => {
        const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return order.indexOf(a) - order.indexOf(b);
    });

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

                let label = exam;
                switch (exam) {
                    case 'TEST':
                        label = 'TEST EXAM';
                        break;
                    case 'SEM1':
                        label = 'SEMESTER I';
                        break;
                    case 'SEM2':
                        label = 'SEMESTER II';
                        break;
                }
                
                button.textContent = label;
                
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

// 'Available Soon' বার্তা দেখান (js1 থেকে)
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

        setTimeout(() => {
            if (msg.parentNode) {
                msg.remove();
            }
        }, 3000);
    }
}


// =================================
// 📣 ডিজিটাল নোটিশ বোর্ড ফাংশন
// =================================

// js1 থেকে ভেরিয়েবলগুলি এখানে সংজ্ঞায়িত করা হলো
const APPS_SCRIPT_NOTICE_URL = "https://script.google.com/macros/s/AKfycbzxx7IEJEvQ3TRut_z0f51aI83r7JJ_H125d2eIK5G95IdzX-qs3H3PGVNFYBgc1OaV/exec?action=read";
const NOTICES_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;
let Helping = [];

// নোটিশ লোড (js1 থেকে)
async function fetchNotices() {
    const container = document.getElementById('help-list');
    
    if (container) {
        container.innerHTML = errorBox("Loading...", "Please wait...");
    }
    
    try {
        const response = await fetch(APPS_SCRIPT_NOTICE_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        Helping = Array.isArray(data.notices) ? data.notices : [];
        renderHelpList();
    } catch (error) {
        console.error("Failed to fetch notices:", error);
        if (container) {
            container.innerHTML = errorBox("Error!", "Failed to load notices.");
        }
    }
}

// নোটিশ তালিকা রেন্ডার (js1 থেকে ইনলাইন CSS সরানো হয়েছে)
function renderHelpList() {
    const container = document.getElementById('help-list');
    if (!container) return console.error("Error: 'help-list' container not found.");
    container.innerHTML = "";

    if (!Array.isArray(Helping) || Helping.length === 0) {
        container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
        return;
    }

    totalPages = Math.ceil(Helping.length / NOTICES_PER_PAGE);
    const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
    const endIndex = startIndex + NOTICES_PER_PAGE;
    const noticesToRender = Helping.slice(startIndex, endIndex);

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
        
        // CSS এর জন্য ক্লাস যুক্ত করা
        itemDiv.classList.add('notice-item'); 

        itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
        itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
        itemDiv.onclick = () => showPopup(item.text, item.date, item.link, item.subj);
        container.appendChild(itemDiv);
    });

    renderPaginationControls();
}

// পেজিনেশন কন্ট্রোল রেন্ডার (js1 থেকে ইনলাইন CSS সরানো হয়েছে)
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
    pageInfo.classList.add('page-info'); // CSS এর জন্য ক্লাস

    const nextBtn = createButton('NEXT', '#ff9800', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);

    paginationContainer.append(backBtn, pageInfo, nextBtn);
}

// নোটিশ পপআপ দেখানো (js1 থেকে ইনলাইন CSS সরানো হয়েছে)
function showPopup(titleText, date, link, subjText) {
    const existing = document.getElementById('notice-popup');
    if (existing) existing.remove();

    // Overlay তৈরি করা
    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    // CSS এর জন্য ক্লাস যুক্ত করা
    overlay.classList.add('popup-overlay'); 
    overlay.onclick = () => {
        popup.remove();
        overlay.remove();
    };

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    // CSS এর জন্য ক্লাস যুক্ত করা
    popup.classList.add('popup-content'); 
    popup.onclick = (e) => e.stopPropagation();

    // স্কুলের নাম এবং নোটিস হেডিং
    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = '<strong>Pathpukur High School (HS)</strong><br>Notice Board';
    // CSS এর জন্য ক্লাস যুক্ত করা
    schoolHeader.classList.add('school-header'); 
    popup.appendChild(schoolHeader);

    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    // CSS এর জন্য ক্লাস যুক্ত করা
    titleElem.classList.add('notice-title'); 
    popup.appendChild(titleElem);

    if (date) {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        // CSS এর জন্য ক্লাস যুক্ত করা
        dateElem.classList.add('notice-date'); 
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        // CSS এর জন্য ক্লাস যুক্ত করা
        subjElem.classList.add('notice-subject'); 
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'popup-button-container';
    // CSS এর জন্য ক্লাস যুক্ত করা
    buttonContainer.classList.add('popup-button-container'); 

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        // CSS এর জন্য ক্লাস যুক্ত করা
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
            // Note: html2canvas() function must be loaded via a <script> tag in the HTML.
            if (typeof html2canvas !== 'undefined') {
                 html2canvas(popup).then(canvas => {
                    let safeTitle = (titleText || "notice")
                        .replace(/[\\/:*?"<>|]+/g, "")
                        .trim()
                        .replace(/\s+/g, "_");
                    
                    let fileName = safeTitle + ".png";

                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL();
                    link.click();

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

// সাইড বার কার্যকারিতা (js1 থেকে)
function initializeSidebar() {
    const menuButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    const navLinks = sidebar.querySelectorAll("a");

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
// 🎓 স্টুডেন্ট এক্সাম লিংক লোডিং (js2 থেকে URL লোডিং ফাংশন)
// =================================

// এই ফাংশনটি js1-এর loadExamLinks/renderButtons থেকে আলাদা
function loadStudentExamLinks() {
    // JSON ফাইল লোড করা
    fetch("home_url.json")
        .then(response => response.json())
        .then(data => {
            // সব exam-link বোতাম খুঁজে বের করা
            document.querySelectorAll(".exam-link").forEach(button => {
                const id = button.id;
                if (data[id]) {
                    button.setAttribute("href", data[id]);
                    button.setAttribute("target", "_blank");
                    // button.setAttribute("target", "_self");
                } else {
                    button.addEventListener('click', (event) => {
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
                    });
                }
            });
        })
        .catch(error => console.error("Error loading student URLs:", error));
}


// =================================
// 📅 পরীক্ষার তারিখ মারকিউ (js2 থেকে)
// =================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcYA8sdD__TgIe-mHKE9n1fabVv_pDFam1K59O9FdD13r5rVcg5_Mf005mcAWsa6xjA/exec';
const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

// Google Apps Script থেকে ডেটা লোড করা
async function loadExamDates() {
    if (!examDatesMarquee) return;
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=get_github_data`);
        const data = await response.json();
        
        if (data && data.data) {
            examDatesMarquee.innerHTML = '';
            
            // js2 থেকে ইনলাইন CSS সরানো হয়েছে
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
// 🚀 ইনিশিয়ালাইজেশন এবং ইভেন্ট লিসেনার
// =================================

// Logout function (js1 থেকে)
function logout() {
    sessionStorage.removeItem("studentLoggedIn");
    window.location.replace("index.html");
}

document.addEventListener("DOMContentLoaded", () => {
    // পেজ লোডে স্ক্রল বন্ধ (js1 থেকে)
    document.body.classList.add('no-scroll');

    // নোটিশ বোর্ড লোড (js1 থেকে)
    fetchNotices();

    // সাইড বার ইনিশিয়ালাইজ (js1 থেকে)
    initializeSidebar();
    
    // স্টুডেন্ট এক্সাম লিংক লোড (js1 থেকে call)
    loadStudentExamLinks();
    
    // পরীক্ষার তারিখ মারকিউ লোড (js2 থেকে)
    loadExamDates();

    // মারকিউ ইন্টারেক্টিভিটি (js2 থেকে)
    if (examDatesMarquee) {
        examDatesMarquee.addEventListener("mouseover", () => {
            examDatesMarquee.style.animationPlayState = 'paused';
        });
        examDatesMarquee.addEventListener("mouseout", () => {
            examDatesMarquee.style.animationPlayState = 'running';
        });
        examDatesMarquee.addEventListener("touchstart", () => {
            examDatesMarquee.style.animationPlayState = 'paused';
        });
        examDatesMarquee.addEventListener("touchend", () => {
            examDatesMarquee.style.animationPlayState = 'running';
        });
    }
});
