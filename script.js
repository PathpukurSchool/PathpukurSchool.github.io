// =======================
// SALT + HASH UTILITIES
// =======================

// SHA-256 hash function
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2,'0'))
        .join('');
}

// =======================
// MASTER LOGIN (Salt + Hash)
// =======================

// পেজ লোডে স্ক্রল বন্ধ
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add('no-scroll');
});

// পাসওয়ার্ড দেখানোর টগল
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

// ===========================================
// 🔐 MASTER LOGIN WITH SALT + HASH
// ===========================================
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
        // masterConfig.json লোড
        const config = await fetch("masterConfig.json").then(r => {
            if (!r.ok) throw new Error('Teacher Login load failed');
            return r.json();
        });

        // ID + salt → hash
        const idHashed = await sha256(id + config.idSalt); // <--- আপনার কোডটি এখানে config.idSalt ব্যবহার করছে

        // Password + salt → hash
        const passHashed = await sha256(pass + config.passSalt); // <--- আপনার কোডটি এখানে config.passSalt ব্যবহার করছে

        // Match test
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

// ===============================
// EXAM LINKS LOADING (unchanged)
// ===============================
let credentials = {};

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
            document.getElementById('exam-buttons').innerHTML = "<p style='color:red;'>Exam links not available.</p>";
        });
}

// এক্সাম লিংক তৈরি ও দেখানো
function renderButtons() {
    const mainContainer = document.getElementById('exam-buttons');
    mainContainer.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করা

    // ইউনিক ক্লাস তালিকা তৈরি
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    // ক্লাসগুলিকে একটি নির্দিষ্ট ক্রমে সাজানো যাতে V, VI, VII... XII পর্যন্ত আসে
    const sortedClasses = classes.sort((a, b) => {
        const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return order.indexOf(a) - order.indexOf(b);
    });

    sortedClasses.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য একটি নতুন shaded-info-box তৈরি করা হচ্ছে
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box'; // CSS ক্লাস যা বক্সের স্টাইল দেবে
        classBox.id = `class-${cls}`; // ইউনিক আইডি যুক্ত করা

        // বক্সের হেডিং তৈরি করা হচ্ছে (ক্লাসের নাম)
        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading shine'; // CSS ক্লাস যা হেডিং এর স্টাইল দেবে
        boxHeading.textContent = 'CLASS ' + cls;
        classBox.appendChild(boxHeading);

        // বোতামগুলির জন্য একটি কন্টেইনার তৈরি করা যাতে সেগুলো flexbox দিয়ে সাজানো যায়
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exam-buttons-group'; // নতুন ক্লাস, এর জন্য CSS লাগবে

        // প্রতিটি সম্ভাব্য পরীক্ষার প্রকারের জন্য বোতাম তৈরি
        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`; // যেমন: "V_1ST", "IX_TEST", "XII_SEM1"
            if (credentials[key]) { // যদি এই নির্দিষ্ট পরীক্ষার জন্য ডেটা config.json-এ থাকে
                const button = document.createElement('button');
                button.className = 'box-button exam-link'; // CSS ক্লাস যা বোতামের স্টাইল দেবে
                button.dataset.key = key;

                // বোতামের লেবেল নির্ধারণ
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
                // যদি URL না থাকে অথবা URL খালি হয়, তাহলে 'Available Soon' মেসেজ দেখাবে
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => window.open(credentials[key].url, '_blank');
                } else {
                    button.onclick = () => showAvailableSoonMessage(key); // URL না থাকলে সরাসরি মেসেজ দেখাবে
                    button.classList.add('disabled-exam-link'); // ঐচ্ছিক: বোতামটি নিষ্প্রভ করতে একটি ক্লাস যোগ করুন
                }
                buttonsContainer.appendChild(button);
            }
        });
        
        // যদি কোন ক্লাসের জন্য কোন পরীক্ষার বোতাম না থাকে, তাহলে বক্সটি দেখাবে না
        if (buttonsContainer.children.length > 0) {
            classBox.appendChild(buttonsContainer); // বোতাম কন্টেইনারকে বক্সের মধ্যে যোগ করা
            mainContainer.appendChild(classBox); // ক্লাস বক্সকে মূল কন্টেইনারে যোগ করা
        }
    });
}

function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    // data-key অ্যাট্রিবিউটের মাধ্যমে সরাসরি সঠিক বোতামটি খুঁজুন
    const link = container.querySelector(`[data-key="${key}"]`); 
    
    if (link) {
        // আগে থেকে কোন বার্তা থাকলে সরাও
        const next = link.nextElementSibling;
        if (next && next.classList.contains('avail-msg')) next.remove();

        const msg = document.createElement('div');
        msg.className = 'avail-msg';
        msg.textContent = '🔔 Available Soon 🔔';

        link.parentNode.insertBefore(msg, link.nextSibling);

        // 3 সেকেন্ড পরে মুছে ফেল
        setTimeout(() => {
            if (msg.parentNode) {
                 msg.remove();
            }
        }, 3000);
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', 'SEMESTER I', ...)
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

// NOTICE বোর্ড লোড করা
document.addEventListener('DOMContentLoaded', function () {

    /* =================================
     * Digital Notice Board Functions
     * ================================= */
    const APPS_SCRIPT_NOTICE_URL = "https://script.google.com/macros/s/AKfycbzxx7IEJEvQ3TRut_z0f51aI83r7JJ_H125d2eIK5G95IdzX-qs3H3PGVNFYBgc1OaV/exec?action=read";
    const NOTICES_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 0;
    let Helping = [];

    async function fetchNotices() {
        const container = document.getElementById('help-list'); // কন্টেইনার ভেরিয়েবল আগে থেকে তৈরি
        
        // ✅ সংশোধন ১: লোডিং মেসেজ সেট করা হলো
        if (container) {
            container.innerHTML = errorBox("Loading...", "Please wait...");
        }
        
        try {
            const response = await fetch(APPS_SCRIPT_NOTICE_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            Helping = Array.isArray(data.notices) ? data.notices : [];
            // ডেটা পেলে renderHelpList() স্বয়ংক্রিয়ভাবে লোডিং মেসেজ মুছে দেবে।
            renderHelpList();
        } catch (error) {
            console.error("Failed to fetch notices:", error);
            // ✅ ত্রুটি হলে আগের Error মেসেজ দেখাবে (আগে থেকেই ছিল)
            if (container) {
                container.innerHTML = errorBox("Error!", "Failed to load notices.");
            }
        }
    }

    function errorBox(title, message) {
        let borderColor = '#ff9999'; // Error/Available Soon
        let bgColor = '#ffe6e6';
        let textColor = '#cc0000';
        
        // ✅ Loading মেসেজের জন্য হালকা নীল স্টাইল
        if (title === "Loading...") {
            borderColor = '#6495ED'; // CornflowerBlue
            bgColor = '#E6F0FF';
            textColor = '#4169E1'; // RoyalBlue
        }
        
        return `
            <div style="
                border: 2px solid ${borderColor}; background-color: ${bgColor};
                color: ${textColor}; font-size: 18px; font-weight: bold;
                padding: 10px; border-radius: 8px; text-align: center;
                max-width: 320px; margin: 0 auto;
            ">
                <strong>${title}</strong><br>${message}
            </div>
        `;
    }

    function renderHelpList() {
        const container = document.getElementById('help-list');
        if (!container) return console.error("Error: 'help-list' container not found.");
        container.innerHTML = ""; // নোটিশ লোড হলে লোডিং মেসেজ মুছে দেবে
        
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
            const dateText = item.date ? ` [Date: ${item.date}]` : '';
            itemDiv.innerHTML = (item.text || "No Title") + dateText; 
            
            itemDiv.style.cssText = `
                cursor: pointer; margin: 10px 0; padding: 8px 10px;
                background-color: #f9f9f9; border-left: 6px solid #386641;
                border-radius: 4px; transition: background-color 0.3s;
            `;
            itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
            itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
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
pageInfo.style.cssText = `margin: 0 10px; font-weight: bold;`;

const nextBtn = createButton('NEXT', '#ff9800', () => {
    if (currentPage < totalPages) { currentPage++; renderHelpList(); }
}, currentPage === totalPages);

paginationContainer.append(backBtn, pageInfo, nextBtn);
}

function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    btn.style.cssText = `
        background-color: ${bgColor};
        color: #ffffff;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.3s ease;
    `;
    
    // :hover স্টাইল যোগ করা
    btn.onmouseover = () => { btn.style.backgroundColor = '#e65100'; };
    btn.onmouseout = () => { btn.style.backgroundColor = bgColor; };
    
    return btn;
}

    function showPopup(titleText, date, link, subjText) {
        const existing = document.getElementById('notice-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'notice-popup';
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #f0f8ff; padding: 20px; border: 2px solid #333;
            border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 9999; text-align: center; max-width: 90%; min-width: 240px;
            width: 300px; font-family: Arial, sans-serif;
        `;

        const titleElem = document.createElement('div');
        titleElem.innerText = titleText || "No Title";
        titleElem.style.cssText = `
            background-color: green; color: white; font-weight: bold;
            font-size: 15px; padding: 10px; border-radius: 5px; margin-bottom: 15px;
        `;
        popup.appendChild(titleElem);

        if (date) {
            const dateElem = document.createElement('div');
            dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
            dateElem.style.marginBottom = '10px';
            popup.appendChild(dateElem);
        }

        if (subjText && subjText.trim() !== '') {
            const subjElem = document.createElement('div');
            subjElem.innerText = subjText;
            subjElem.style.cssText = `
                color: darkgreen; background-color: #e6ffe6;
                font-weight: bold; font-size: 14px; padding: 6px;
                border-radius: 4px; margin-bottom: 12px;
            `;
            popup.appendChild(subjElem);
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            margin-top: 20px; display: flex; flex-wrap: wrap;
            justify-content: center; gap: 10px;
        `;

        if (link && link.trim() !== '') {
            const linkBtn = document.createElement('a');
            linkBtn.href = link;
            linkBtn.innerText = 'Open Link';
            linkBtn.target = '_blank';
            linkBtn.style.cssText = `
                background-color: #007bff; color: white; padding: 6px 10px;
                border-radius: 5px; font-weight: bold; font-size: 12px;
                text-decoration: none;
            `;
            buttonContainer.appendChild(linkBtn);
        }

        const downloadBtn = createButton('Download', '#28a745', () => {
            setTimeout(() => {
                html2canvas(popup).then(canvas => {
                    const image = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = image;
                    a.download = 'notice.png';
                    a.click();
                });
            }, 100);
        });

        const closeBtn = createButton('Back', '#dc3545', () => popup.remove());

        buttonContainer.append(downloadBtn, closeBtn);
        popup.appendChild(buttonContainer);
        document.body.appendChild(popup);
    }

    // প্রথম লোডে ডাটা আনুন
    fetchNotices();

});

// ✅ সাইড বার মেনুঃ জাভা স্ক্রিপ্ট 
document.addEventListener("DOMContentLoaded", function() {
    const menuButton = document.getElementById('menu-toggle-button');
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    const navLinks = sidebar.querySelectorAll("a");

    // সব id টার্গেট লিস্ট তৈরি
    const targetIds = Array.from(navLinks)
        .map(link => link.getAttribute("href"))
        .filter(href => href && href.startsWith("#"))
        .map(href => href.substring(1));

    // মেনু বোতাম ক্লিক করলে সাইডবার টগল হবে
    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // ওভারলে ক্লিক করলে সাইডবার বন্ধ হবে
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // ন্যাভ লিঙ্ক ক্লিক ইভেন্ট
    navLinks.forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();

            // সব লিংক থেকে active-link সরানো
            navLinks.forEach(item => item.classList.remove("active-link"));
            this.classList.add("active-link");

            // সাইডবার বন্ধ
            sidebar.classList.remove('active');
            overlay.classList.remove('active');

            // টার্গেট সেকশন খুঁজে বের করা
            const targetSectionId = this.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetSectionId);

            if (targetSection) {
                targetSection.classList.add("highlight-section");

                // হেডার উচ্চতা গণনা করুন
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;

                // স্ক্রল করার জন্য লক্ষ্যস্থান নির্ধারণ করুন
                const targetPosition = targetSection.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // ৩ সেকেন্ড পরে হাইলাইট সরানো হবে
                setTimeout(() => {
                    targetSection.classList.remove("highlight-section");
                }, 3000);
            }
        });
    });
});


    // পেজ লোড হওয়ার সাথে সাথে ফাংশনটি কল করুন
    document.addEventListener('DOMContentLoaded', loadStudentExamLinks);


// ✅ Logout function
function logout() {
    sessionStorage.removeItem("studentLoggedIn");
    window.location.replace("index.html");
}
