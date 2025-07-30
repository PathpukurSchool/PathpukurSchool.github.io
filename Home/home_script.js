
let credentials = {};
let masterCredential = {};
let studentData = {}; // শিক্ষার্থীর ডেটা সংরক্ষণ করার জন্য
let appConfig = {}; // config.json থেকে লোড করা ডেটা (আগের কোড থেকে)

// ✅ শিক্ষকের জন্য নম্বর আপলোডের শেষ তারিখ এবং চলমান নোটিশের ডেটা
// এই ডেটা আপনি চাইলে একটি JSON ফাইলে (যেমন teacher_notice.json) রাখতে পারেন এবং fetch করে লোড করতে পারেন।
// আপাতত, আমি এটিকে সরাসরি কোডে সংজ্ঞায়িত করছি।
const examDates = [
    { text: "নম্বর আপলোডের শেষ তারিখ (প্রথম সাময়িক):", date: "১৫ এপ্রিল ২০২৪", color: "red", backgroundColor: "#ffe0b2" },
    { text: "নম্বর আপলোডের শেষ তারিখ (দ্বিতীয় সাময়িক):", date: "১৫ আগস্ট ২০২৪", color: "#e65100", backgroundColor: "#fff3e0" },
    { text: "নম্বর আপলোডের শেষ তারিখ (তৃতীয় সাময়িক):", date: "১৫ নভেম্বর ২০২৪", color: "#00796b", backgroundColor: "#e0f2f1" },
    { text: "বিশেষ নোটিশ: সকল শিক্ষককে সময় মতো নম্বর আপলোড করার জন্য অনুরোধ করা হচ্ছে।", date: "", color: "#1a237e", backgroundColor: "#e8eaf6" },
    { text: "ছুটির ঘোষণা: ঈদ উপলক্ষে স্কুল বন্ধ থাকবে ২৫-২৮ এপ্রিল।", date: "২৬ এপ্রিল ২০২৪", color: "#8e24aa", backgroundColor: "#f3e5f5" }
];


// মাস্টার লগইনের তথ্য লোড (masterConfig.json)
async function getCredentials() {
    try {
        const response = await fetch('masterConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching masterConfig:', error); // কনসোল লগ পরিবর্তন
        return null;
    }
}

// config.json ফাইল লোড করার ফাংশন (আগের script.js থেকে)
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        appConfig = await response.json();
        console.log("Application configuration loaded successfully:", appConfig);
    } catch (error) {
        console.error("Failed to load application configuration:", error);
        alert("Error loading application configuration. Please try again later.");
    }
}


// মাস্টার লগইন সাবমিট ফাংশন
async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";

    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    const allCredentials = await getCredentials(); // masterConfig.json থেকে ডেটা লোড

    if (!allCredentials) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = allCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        sessionStorage.setItem("userType", type.toLowerCase());
        sessionStorage.setItem("isLoggedIn", "true"); // একটি সাধারণ লগইন স্ট্যাটাস ফ্ল্যাগ

        if (type.toLowerCase() === "student") {
            sessionStorage.setItem("studentLoggedIn", "true");
        }

        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else if (type.toLowerCase() === 'teacher') {
                document.getElementById('masterLoginOverlay').style.display = "none";
                loadTeacherExamLinks(); // শিক্ষকের লগইন সফল হলে শিক্ষক পরীক্ষার লিঙ্ক লোড করুন
            }
        }, 1000); // 1 সেকেন্ড পর রিডাইরেক্ট
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}


let currentKey = ''; // সাব-লগইনের জন্য বর্তমানে নির্বাচিত পরীক্ষার কী

// ✅ শিক্ষকের জন্য এক্সাম লিংক লোড (মাস্টার লগইন সফল হলে)
function loadTeacherExamLinks() {
    fetch('config.json') // শিক্ষকের ডেটার জন্য config.json ব্যবহার করা হচ্ছে
        .then(response => response.json())
        .then(data => {
            credentials = data.classExamUrls || {}; // শুধুমাত্র classExamUrls অংশটি নেওয়া হচ্ছে
            renderTeacherButtonsByClass();
        })
        .catch(error => console.error('Error loading config.json for teacher:', error));
}


// ✅ শিক্ষকের জন্য এক্সাম লিংক তৈরি ও দেখানো (প্রতিটি ক্লাসের জন্য আলাদা)
function renderTeacherButtonsByClass() {
    const classesOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];

    classesOrder.forEach(cls => {
        const classContainer = document.getElementById(`class-${cls}-exams`);
        if (!classContainer) {
            // console.warn(`Teacher: Container for Class ${cls} not found.`); // ড্যাশবোর্ডে না থাকলে ওয়ার্নিং এড়ানো
            return;
        }

        const buttonsContainer = classContainer.querySelector('.exam-buttons-group');
        if (!buttonsContainer) {
            // console.warn(`Teacher: Buttons container inside Class ${cls} not found.`);
            return;
        }
        buttonsContainer.innerHTML = '';

        let hasButtons = false;

        exams.forEach(exam => {
            const key = `class${cls.toLowerCase()}${exam}`; // config.json এ কী ফরম্যাট 'class5firstterm' হলে
            // অথবা যদি config.json এ আপনার কী ফরম্যাট `V_1ST` এরকম হয়: const key = `${cls}_${exam}`;
            // আপনি আপনার config.json এর 'classExamUrls' এর কী অনুযায়ী এটি সেট করবেন।
            // যেমন: config.json এ class5FirstTerm আছে, তাই এখানে সেইমতো চেক করতে হবে।

            // যেহেতু config.json এ class5FirstTerm, class5SecondTerm এই ফরম্যাটে আছে, তাই সেই অনুযায়ী key তৈরি করছি।
            let configKey;
            switch(exam) {
                case '1ST': configKey = `class${cls.toLowerCase()}FirstTerm`; break;
                case '2ND': configKey = `class${cls.toLowerCase()}SecondTerm`; break;
                case '3RD': configKey = `class${cls.toLowerCase()}ThirdTerm`; break;
                case 'TEST': configKey = `class${cls.toLowerCase()}Test`; break; // যদি config.json এ থাকে
                case 'SEM1': configKey = `class${cls.toLowerCase()}Sem1`; break; // যদি config.json এ থাকে
                case 'SEM2': configKey = `class${cls.toLowerCase()}Sem2`; break; // যদি config.json এ থাকে
                default: configKey = null;
            }

            if (configKey && credentials[configKey]) { // যদি এই নির্দিষ্ট পরীক্ষার জন্য ডেটা config.json-এ থাকে
                hasButtons = true;
                const button = document.createElement('button');
                button.className = 'box-button exam-link';

                let label = exam;
                switch (exam) {
                    case 'TEST': label = 'TEST EXAM'; break;
                    case 'SEM1': label = 'SEMESTER I'; break;
                    case 'SEM2': label = 'SEMESTER II'; break;
                    case '1ST': label = '1ST EXAM'; break;
                    case '2ND': label = '2ND EXAM'; break;
                    case '3RD': label = '3RD EXAM'; break;
                }

                button.textContent = label;
                // credentials[configKey].url কে সরাসরি ব্যবহার করা হবে
                if (credentials[configKey].url && credentials[configKey].url.trim() !== '') {
                    button.onclick = () => openLoginForTeacherExam(configKey); // URL থাকলে আইডি/পাসওয়ার্ড চাইবে
                } else {
                    button.onclick = () => showAvailableSoonMessage(configKey); // URL না থাকলে সরাসরি মেসেজ দেখাবে
                    button.classList.add('disabled-exam-link');
                }
                buttonsContainer.appendChild(button);
            }
        });

        if (!hasButtons) {
            classContainer.style.display = 'none';
        } else {
            classContainer.style.display = 'block';
        }
    });
}


// প্রতিটি এক্সাম লিংকের জন্য সাব-লগইন (শিক্ষক)
function openLoginForTeacherExam(key) { // ফাংশনের নাম পরিবর্তন করা হয়েছে যাতে শিক্ষক সাব-লগইন বোঝা যায়
    currentKey = key;
    document.getElementById('loginId').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').innerText = '';
    document.getElementById('loginDialog').showModal();
}

// সাব-লগইন বন্ধ
function closeLogin() {
    document.getElementById('loginDialog').close();
}

// সাব-লগইন যাচাই করে লিংক খোলা
function submitLogin() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPassword').value;

    // credentials অবজেক্টের মধ্যে সঠিক কী দিয়ে অ্যাক্সেস করুন
    const credential = credentials[currentKey]; // এটি teacher এর classExamUrls থেকে আসবে

    if (credential && credential.id === id && credential.pass === pass) {
        if (credential.url && credential.url.trim() !== '') {
            window.open(credential.url, '_blank');
            closeLogin();
        } else {
            closeLogin();
            showAvailableSoonMessage(currentKey);
        }
    } else {
        document.getElementById('loginError').innerText = 'Incorrect ID or Password!';
    }
}


// "শীঘ্রই উপলব্ধ হবে" মেসেজ দেখানোর ফাংশন (শিক্ষক ও শিক্ষার্থীর জন্য)
function showAvailableSoonMessage(key) {
    const clsMatch = key.match(/class(v|vi|vii|viii|ix|x|xi|xii)/i); // ক্লাস নাম বের করার জন্য regex
    let cls = '';
    if (clsMatch) {
        cls = clsMatch[1].toUpperCase(); // যেমন 'V'
        if (cls === 'V') cls = 'V'; // Ensure V is uppercase
        else if (cls === 'VI') cls = 'VI';
        else if (cls === 'VII') cls = 'VII';
        else if (cls === 'VIII') cls = 'VIII';
        else if (cls === 'IX') cls = 'IX';
        else if (cls === 'X') cls = 'X';
        else if (cls === 'XI') cls = 'XI';
        else if (cls === 'XII') cls = 'XII';
    }

    const specificClassContainer = document.getElementById(`class-${cls}-exams`);

    if (!specificClassContainer) {
        console.warn(`Container for class ${cls} not found for showing message.`);
        return;
    }

    // সঠিক লেবেল পেতে getExamText ফাংশন ব্যবহার করুন।
    // এখানে currentKey ফরম্যাট 'class5FirstTerm' এর বদলে 'V_1ST' ফরম্যাটে প্রয়োজন।
    // তাই key থেকে পরীক্ষার অংশটা বের করে নিতে হবে।
    let examPart = '';
    if (key.includes('FirstTerm')) examPart = '1ST';
    else if (key.includes('SecondTerm')) examPart = '2ND';
    else if (key.includes('ThirdTerm')) examPart = '3RD';
    else if (key.includes('Test')) examPart = 'TEST';
    else if (key.includes('Sem1')) examPart = 'SEM1';
    else if (key.includes('Sem2')) examPart = 'SEM2';

    const targetText = getExamText(`${cls}_${examPart}`);

    const links = specificClassContainer.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === targetText) {
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove();

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 Available Soon 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            setTimeout(() => {
                msg.remove();
            }, 3000);

            break;
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', 'SEMESTER I', ...)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];

    switch (exam) {
        case 'TEST': return 'TEST EXAM';
        case 'SEM1': return 'SEMESTER I';
        case 'SEM2': return 'SEMESTER II';
        case '1ST': return '1ST EXAM';
        case '2ND': return '2ND EXAM';
        case '3RD': return '3RD EXAM';
        default: return exam; // fallback
    }
}


// ✅ স্টুডেন্ট এক্সাম লিঙ্ক (পরীক্ষার ফলাফল) - ক্লাস অনুযায়ী রেন্ডার করা
function loadStudentExamLinks() {
    fetch('config_student.json') // config_student.json ফাইল লোড করুন
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            studentData = data;
            renderStudentButtonsByClass();
        })
        .catch(error => {
            console.error('কনফিগারেশন লোডে সমস্যা (শিক্ষার্থী):', error);
        });
}


// ✅ শিক্ষার্থীর জন্য বাটন তৈরি ও দেখানো (প্রতিটি ক্লাসের জন্য আলাদা)
function renderStudentButtonsByClass() {
    const classesOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    classesOrder.forEach(cls => {
        const classContainer = document.getElementById(`class-${cls}-exams`);
        if (!classContainer) {
            // console.warn(`Student: Container for Class ${cls} not found.`); // ড্যাশবোর্ডে না থাকলে ওয়ার্নিং এড়ানো
            return;
        }

        const buttonsContainer = classContainer.querySelector('.exam-buttons-group');
        if (!buttonsContainer) {
            // console.warn(`Student: Buttons container inside Class ${cls} not found.`);
            return;
        }
        buttonsContainer.innerHTML = '';

        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        let hasButtons = false;

        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (studentData[key]) {
                hasButtons = true;
                const link = studentData[key].url;
                const a = document.createElement('a');
                a.className = 'box-button exam-link';
                a.target = '_blank';

                let label = exam;
                if (exam === 'TEST') label = 'TEST EXAM';
                else if (exam === 'SEM1') label = 'SEMESTER I';
                else if (exam === 'SEM2') label = 'SEMESTER II';
                else if (exam === '1ST') label = '1ST EXAM';
                else if (exam === '2ND') label = '2ND EXAM';
                else if (exam === '3RD') label = '3RD EXAM';
                a.textContent = label;

                if (link && link.trim() !== '') {
                    a.href = link;
                } else {
                    a.href = '#';
                    a.onclick = (e) => {
                        e.preventDefault();
                        const oldMsg = a.nextElementSibling;
                        if (oldMsg && oldMsg.classList.contains('avail-msg')) {
                            oldMsg.remove();
                        }
                        const msg = document.createElement('div');
                        msg.className = 'avail-msg';
                        msg.textContent = '🔔 শীঘ্রই উপলব্ধ হবে 🔔';
                        a.parentNode.insertBefore(msg, a.nextSibling);
                        setTimeout(() => {
                            msg.remove();
                        }, 3000);
                    };
                    a.classList.add('disabled-exam-link');
                }
                buttonsContainer.appendChild(a);
            }
        });

        if (!hasButtons) {
            classContainer.style.display = 'none';
        } else {
            classContainer.style.display = 'block';
            if (!classContainer.querySelector('.box-heading')) {
                const boxHeading = document.createElement('h2');
                boxHeading.className = 'box-heading shine';
                boxHeading.textContent = `CLASS ${cls} EXAMS`;
                classContainer.prepend(boxHeading);
            }
            if (!classContainer.querySelector('.exam-buttons-group')) {
                classContainer.appendChild(buttonsContainer);
            }
        }
    });
}


// NOTICE & HELP লোড করা
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    })
    .catch(error => console.error('Error fetching files.json:', error));

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    if (!ul) {
        // console.warn(`Element with ID ${elementId} not found.`); // ড্যাশবোর্ডে না থাকলে ওয়ার্নিং এড়ানো
        return;
    }
    ul.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = `${item.name} (${item.date})`;
        a.target = '_blank';
        li.appendChild(a);
        ul.appendChild(li);
    });
}

// ওয়েলকাম পপ আপের জাভাস্ক্রিপ্ট কোড
document.addEventListener('DOMContentLoaded', function() {
    fetch('home_popup.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('নেটওয়ার্ক রেসপন্স ঠিক ছিল না ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const popupTitleElement = document.getElementById('popupTitle');
            const popupMessageElement = document.getElementById('popupMessage');
            const downloadButton = document.getElementById('downloadPopupButton');
            const closeButton = document.getElementById('closePopupButton');
            const welcomePopup = document.getElementById('websiteWelcomePopup');

            if (popupTitleElement && data.popup_title) {
                popupTitleElement.textContent = data.popup_title;
            }

            if (popupMessageElement && Array.isArray(data.popup_message)) {
                popupMessageElement.innerHTML = '';
                data.popup_message.forEach(paragraphText => {
                    const p = document.createElement('p');
                    p.textContent = paragraphText;
                    popupMessageElement.appendChild(p);
                });
            } else if (popupMessageElement && typeof data.popup_message === 'string') {
                popupMessageElement.innerHTML = data.popup_message;
            }

            if (welcomePopup) {
                welcomePopup.style.display = 'flex';
            }

            if (closeButton) {
                closeButton.addEventListener('click', closeWebsiteWelcomePopup);
            }

            if (downloadButton) {
                downloadButton.addEventListener('click', () => {
                    if (welcomePopup) {
                        downloadPopupAsJpg(welcomePopup);
                    }
                });
            }
        })
        .catch(error => {
            console.error('পপ-আপ ডেটা লোড করতে সমস্যা হয়েছে:', error);
        });
});

function closeWebsiteWelcomePopup() {
    const welcomePopup = document.getElementById('websiteWelcomePopup');
    if (welcomePopup) {
        welcomePopup.style.display = 'none';
    }
}

// downloadPopupAsJpg ফাংশনটি অপরিবর্তিত থাকবে
async function downloadPopupAsJpg(popupElement) {
    try {
        const canvas = await html2canvas(popupElement);
        const dataURL = canvas.toDataURL('image/jpeg');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'popup_message.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        closeWebsiteWelcomePopup();

    } catch (error) {
        console.error('পপ-আপ ডাউনলোড করতে সমস্যা:', error);
    }
}


// DOMContentLoaded এর পরে সবকিছু লোড করুন
document.addEventListener('DOMContentLoaded', () => {
    // config.json লোড করা হচ্ছে
    loadConfig();

    const userType = sessionStorage.getItem("userType");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn"); // নতুন ফ্ল্যাগ

    // মারকিউ কন্টেন্ট লোড করা হচ্ছে
    const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

    if (examDatesMarquee) { // যদি marqee div টি HTML এ থাকে
        examDates.forEach(exam => {
            if (exam.date) {
                const span = document.createElement("span");
                span.textContent = `${exam.text} ${exam.date}, `;
                span.style.color = exam.color;
                span.style.fontWeight = "bold";

                if (exam.backgroundColor) {
                    span.style.backgroundColor = exam.backgroundColor;
                }
                examDatesMarquee.appendChild(span);
            }
        });

        examDatesMarquee.addEventListener("mouseover", () => {
            examDatesMarquee.classList.add("paused");
        });
        examDatesMarquee.addEventListener("mouseout", () => {
            examDatesMarquee.classList.remove("paused");
        });
        examDatesMarquee.addEventListener("touchstart", () => {
            examDatesMarquee.classList.add("paused");
        });
        examDatesMarquee.addEventListener("touchend", () => {
            examDatesMarquee.classList.remove("paused");
        });
    }

    // লগইন স্ট্যাটাস চেক এবং কন্টেন্ট লোড করা
    // যদি userType 'teacher' বা 'student' হয় এবং isLoggedIn সত্য হয়
    if (isLoggedIn === "true") {
        document.getElementById('masterLoginOverlay').style.display = "none"; // লগইন ওভারলে লুকান
        if (userType === 'teacher') {
            loadTeacherExamLinks();
        } else if (userType === 'student') {
            loadStudentExamLinks();
        }
    } else {
        // যদি লগইন না থাকে, তাহলে মাস্টার লগইন ওভারলে দেখান
        const masterLoginOverlay = document.getElementById('masterLoginOverlay');
        if (masterLoginOverlay) {
            masterLoginOverlay.style.display = "flex";
        }
    }
});


// ✅ DOM এলিমেন্টগুলো সিলেক্ট করা (আগের script.js থেকে)
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("main-content");

// ✅ মেনু টগল বাটন ক্লিক করলে সাইডবার খোলা/বন্ধ করা (আগের script.js থেকে)
menuToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        menuToggle.classList.remove("open-menu");
        mainContent.style.marginLeft = "25px";
    } else {
        sidebar.classList.add("open");
        menuToggle.classList.add("open-menu");
        mainContent.style.marginLeft = "280px";
    }
});

// ✅ সাইডবারের বাইরে ক্লিক করলে মেনু বন্ধ হবে (আগের script.js থেকে)
document.addEventListener("click", (event) => {
    if (!sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
        sidebar.classList.remove("open");
        menuToggle.classList.remove("open-menu");
        mainContent.style.marginLeft = "25px";
    }
});

// ✅ মেনু আইটেম ক্লিক করলে সাবমেনু টগল করা এবং অন্য সাবমেনু বন্ধ করা (আগের script.js থেকে)
function toggleMenu(element) {
    const allMenuItems = document.querySelectorAll(".menu-item");

    allMenuItems.forEach(item => {
        if (item !== element) {
            item.classList.remove("active");
            const submenu = item.querySelector(".submenu");
            if (submenu) {
                submenu.classList.remove("open");
            }
        }
    });

    const submenu = element.querySelector(".submenu");
    if (submenu) {
        submenu.classList.toggle("open");
        element.classList.toggle("active");
    }
}

// ✅ loadContent(page) ফাংশন (আগের script.js থেকে)
function loadContent(page) {
    let content = "";

    if (Object.keys(appConfig).length === 0) {
        mainContent.innerHTML = `<div style="text-align: center; padding: 50px;">
                                    <h3>কনফিগারেশন লোড হচ্ছে... অনুগ্রহ করে একটু অপেক্ষা করুন।</h3>
                                    <p>যদি লোড হতে বেশি সময় লাগে, তাহলে পৃষ্ঠাটি রিফ্রেশ করুন।</p>
                                </div>`;
        return;
    }

    if (page === "class5") {
        const class5FirstTermUrl = appConfig.classExamUrls.class5FirstTerm || '#';
        const class5SecondTermUrl = appConfig.classExamUrls.class5SecondTerm || '#';
        const class5ThirdTermUrl = appConfig.classExamUrls.class5ThirdTerm || '#';

        content = `
            <div id="class-V-exams" class="class-container">
                <h2>CLASS V EXAMS</h2>
                <div class="exam-buttons-group">
                    <a href="${class5FirstTermUrl}" target="_blank" class="exam-button">First Term Exam</a>
                    <a href="${class5SecondTermUrl}" target="_blank" class="exam-button">Second Term Exam</a>
                    <a href="${class5ThirdTermUrl}" target="_blank" class="exam-button">Third Term Exam</a>
                </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #4CAF50; border-radius: 8px; background-color: #e8f5e9;">
                <p>এখানে ক্লাস V এর মার্কস আপলোড করার জন্য ফর্ম অথবা নির্দেশাবলী থাকবে।</p>
                <form style="margin-top: 15px;">
                    <label for="class5MarksFile">মার্কস ফাইল আপলোড করুন (ক্লাস V):</label><br>
                    <input type="file" id="class5MarksFile" name="class5MarksFile" accept=".csv, .xlsx" style="margin-top: 5px;"><br>
                    <button type="submit" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">আপলোড করুন</button>
                </form>
            </div>
        `;
    }
    else if (['class6', 'class7', 'class8', 'class9', 'class10', 'class11', 'class12'].includes(page)) {
        const className = page.replace('class', 'Class ');
        content = `
            <div class="class-container">
                <h2>${className} Marks Upload</h2>
                <p>এখানে ${className} এর জন্য মার্কস আপলোড করার ফর্ম বা নির্দেশাবলী থাকবে।</p>
                <div style="margin-top: 20px; padding: 15px; border: 1px dashed #4CAF50; border-radius: 8px; background-color: #e8f5e9;">
                    <form style="margin-top: 15px;">
                        <label for="${page}MarksFile">মার্কস ফাইল আপলোড করুন (${className}):</label><br>
                        <input type="file" id="${page}MarksFile" name="${page}MarksFile" accept=".csv, .xlsx" style="margin-top: 5px;"><br>
                        <button type="submit" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">আপলোড করুন</button>
                    </form>
                </div>
            </div>
        `;
    }
    else if (page === "notice") {
        content = `
            <h2>শিক্ষার্থী নোটিশ আপলোড</h2>
            <p>এখানে নতুন নোটিশ আপলোড করার ফর্ম এবং অপশন থাকবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #eaf2f8;">
                <label for="noticeTitle">নোটিশের শিরোনাম:</label><br>
                <input type="text" id="noticeTitle" name="noticeTitle" style="width: 80%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;"><br>
                <label for="noticeContent">নোটিশের বিবরণ:</label><br>
                <textarea id="noticeContent" name="noticeContent" rows="6" style="width: 80%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea><br>
                <button style="padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">নোটিশ আপলোড করুন</button>
            </div>
        `;
    }
    else if (page === "staff-routine") {
        const staffRoutineUrl = appConfig.routineUrls.teacher || '#';
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Staff Routine</h2>
            <h3 class="login-instruction-heading">To view staff (teacher) routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="${staffRoutineUrl}" target="_blank" class="exam-link">VIEW STAFF ROUTINE</a>
            </div>
        `;
    }
    else if (page === "class-routine") {
        const classRoutineUrl = appConfig.routineUrls.student || '#';
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Class Routine</h2>
            <h3 class="login-instruction-heading">To view class (student) routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="${classRoutineUrl}" target="_blank" class="exam-link">VIEW CLASS ROUTINE</a>
            </div>
        `;
    }
    else if (page === "subject-routine") {
        const subjectRoutineUrl = appConfig.routineUrls.subject || '#';
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Subject Routine</h2>
            <h3 class="login-instruction-heading">To view subject routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="${subjectRoutineUrl}" target="_blank" class="exam-link">VIEW SUBJECT ROUTINE</a>
            </div>
        `;
    }
    else if (page === "school-exam-routine") {
        const schoolExamRoutineUrl = appConfig.routineUrls.schoolExam || '#';
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">School Exam Routine</h2>
            <h3 class="login-instruction-heading">To view Inter-school Examination Routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="${schoolExamRoutineUrl}" target="_blank" class="exam-link">VIEW EXAM ROUTINE</a>
            </div>
        `;
    }
    else if (page === "student-report") {
        content = `
            <h2>Student Report</h2>
            <p>Detailed student reports will be available here.</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #673AB7; border-radius: 8px; background-color: #ede7f6;">
                <p>This section will display individual student performance and attendance data.</p>
            </div>
        `;
    }
    else if (page === "attendance-report") {
        content = `
            <h2>Attendance Report</h2>
            <p>View attendance reports for students and staff.</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #009688; border-radius: 8px; background-color: #e0f2f1;">
                <p>Access daily, weekly, and monthly attendance summaries.</p>
            </div>
        `;
    }
    else if (page === "admission-info") {
        content = `
            <h2>ভর্তি তথ্য</h2>
            <p>নতুন শিক্ষার্থী ভর্তির সকল তথ্য এবং ফর্ম এখানে পাওয়া যাবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #FF5722; border-radius: 8px; background-color: #ffe0b2;">
                <p>ভর্তি প্রক্রিয়া, প্রয়োজনীয় কাগজপত্র এবং সময়সূচী।</p>
            </div>
        `;
    }
    else if (page === "book-list") {
        content = `
            <h2>বইয়ের তালিকা</h2>
            <p>লাইব্রেরিতে উপলব্ধ সকল বইয়ের তালিকা এখানে প্রদর্শিত হবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #795548; border-radius: 8px; background-color: #d7ccc8;">
                <p>শ্রেণীভিত্তিক বা বিষয়ভিত্তিক বইয়ের সার্চ অপশন থাকবে।</p>
            </div>
        `;
    }
    else if (page === "borrow-return") {
        content = `
            <h2>ইস্যু/ফেরত</h2>
            <p>বই ইস্যু এবং ফেরত দেওয়ার প্রক্রিয়া এখানে পরিচালিত হবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #607D8B; border-radius: 8px; background-color: #cfd8dc;">
                <p>শিক্ষার্থী বা শিক্ষকের বই নেওয়া বা ফেরত দেওয়ার রেকর্ড রাখা হবে।</p>
            </div>
        `;
    }
    else if (page === "contact-us") {
        content = `
            <h2>যোগাযোগ</h2>
            <p>আমাদের সাথে যোগাযোগের বিস্তারিত তথ্য এখানে পাওয়া যাবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #7B1FA2; border-radius: 8px; background-color: #e1bee7;">
                <p>ফোন নম্বর, ইমেইল, ঠিকানা এবং যোগাযোগের ফর্ম।</p>
            </div>
        `;
    }
    else {
        const formattedPage = page.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        content = `
            <h2>${formattedPage}</h2>
            <p>${formattedPage} সম্পর্কিত বিস্তারিত তথ্য এখানে লোড হবে।</p>
            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #999; border-radius: 8px; background-color: #f0f0f0;">
                <p>উদাহরণস্বরূপ, এখানে ${formattedPage} এর ডেটা দেখাবে।</p>
                <ul>
                    <li>আইটেম ১</li>
                    <li>আইটেম ২</li>
                    <li>আইটেম ৩</li>
                </ul>
            </div>
        `;
    }

    mainContent.innerHTML = content;
    sidebar.classList.remove("open");
    menuToggle.classList.remove("open-menu");
    mainContent.style.marginLeft = "25px";
}

// ✅ ড্যাশবোর্ড শিরোনামে ক্লিক করলে ড্যাশবোর্ডকে পূর্বাবস্থায় ফেরানো (আগের script.js থেকে)
function resetDashboard() {
    mainContent.innerHTML = `
        <div class="marquee-container">
            <div id="exam-dates-marquee-content" class="marquee-content">
                </div>
        </div>
        <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
        <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;

    // মারকিউ কন্টেন্ট পুনরায় লোড করা (যদি `resetDashboard` এর মাধ্যমে মারকিউ পরিষ্কার হয়ে যায়)
    const examDatesMarquee = document.getElementById("exam-dates-marquee-content");
    if (examDatesMarquee) {
        examDatesMarquee.innerHTML = ''; // কন্টেন্ট পরিষ্কার করুন
        examDates.forEach(exam => {
            if (exam.date) {
                const span = document.createElement("span");
                span.textContent = `${exam.text} ${exam.date}, `;
                span.style.color = exam.color;
                span.style.fontWeight = "bold";
                if (exam.backgroundColor) {
                    span.style.backgroundColor = exam.backgroundColor;
                }
                examDatesMarquee.appendChild(span);
            }
        });
        // নিশ্চিত করুন অ্যানিমেশন পুনরায় শুরু হয়
        examDatesMarquee.classList.remove("paused");
    }

    sidebar.classList.remove("open");
    menuToggle.classList.remove("open-menu");
    mainContent.style.marginLeft = "25px";

    document.querySelectorAll(".submenu").forEach(submenu => {
        submenu.classList.remove("open");
    });
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });
}
