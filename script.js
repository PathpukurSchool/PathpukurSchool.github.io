let credentials = {};
let masterCredential = {};
let studentData = {}; // শিক্ষার্থীর ডেটা সংরক্ষণ করার জন্য

// মাস্টার লগইনের তথ্য লোড
async function getCredentials() {
    try {
        const response = await fetch('masterConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching config:', error);
        return null;
    }
}

async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess'); // success ডিভ

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";

    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    const allCredentials = await getCredentials();

    if (!allCredentials) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = allCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        // Session সেট করুন
        sessionStorage.setItem("userType", type.toLowerCase());
        if (type.toLowerCase() === "student") {
            sessionStorage.setItem("studentLoggedIn", "true");
        }

        // সফল লগইন
        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else {
                // Teacher login successful – hide the login overlay
                document.getElementById('masterLoginOverlay').style.display = "none";
                // শিক্ষক লগইন সফল হলে, শিক্ষকের পরীক্ষার লিংক লোড করুন
                loadTeacherExamLinks(); // পরিবর্তিত ফাংশন কল
            }
        }, 1000); // 1.5 সেকেন্ড পর রিডাইরেক্ট
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}

// ✅ শিক্ষকের জন্য এক্সাম লিংক লোড (মাস্টার লগইন সফল হলে)
function loadTeacherExamLinks() { // ফাংশনের নাম পরিবর্তন করা হয়েছে
    fetch('config.json') // শিক্ষকের ডেটার জন্য config.json
        .then(response => response.json())
        .then(data => {
            credentials = data;
            renderTeacherButtonsByClass(); // পরিবর্তিত ফাংশন কল
        })
        .catch(error => console.error('Error loading config.json for teacher:', error));
}

let currentKey = ''; // সাব-লগইনের জন্য বর্তমানে নির্বাচিত পরীক্ষার কী

// ✅ শিক্ষকের জন্য এক্সাম লিংক তৈরি ও দেখানো (প্রতিটি ক্লাসের জন্য আলাদা)
function renderTeacherButtonsByClass() { // ফাংশনের নাম পরিবর্তন করা হয়েছে
    const classesOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];

    classesOrder.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য নির্দিষ্ট HTML কন্টেইনার খুঁজুন
        const classContainer = document.getElementById(`class-${cls}-exams`);
        if (!classContainer) {
            console.warn(`Teacher: Container for Class ${cls} not found.`);
            return;
        }

        const buttonsContainer = classContainer.querySelector('.exam-buttons-group');
        if (!buttonsContainer) {
            console.warn(`Teacher: Buttons container inside Class ${cls} not found.`);
            return;
        }
        buttonsContainer.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করুন

        let hasButtons = false; // এই ক্লাসের জন্য কোনো বোতাম আছে কিনা তা ট্র্যাক করতে

        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (credentials[key]) { // যদি এই নির্দিষ্ট পরীক্ষার জন্য ডেটা config.json-এ থাকে
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
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => openLogin(key); // URL থাকলে আইডি/পাসওয়ার্ড চাইবে
                } else {
                    button.onclick = () => showAvailableSoonMessage(key); // URL না থাকলে সরাসরি মেসেজ দেখাবে
                    button.classList.add('disabled-exam-link');
                }
                buttonsContainer.appendChild(button);
            }
        });

        // যদি এই ক্লাসের জন্য কোনো বোতাম না থাকে, তাহলে ক্লাস কন্টেইনারটি লুকান
        if (!hasButtons) {
            classContainer.style.display = 'none';
        } else {
            classContainer.style.display = 'block'; // বোতাম থাকলে দেখান
        }
    });
}


// প্রতিটি এক্সাম লিংকের জন্য সাব-লগইন
function openLogin(key) {
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
    const credential = credentials[currentKey]; // এটি teacher বা student data এর উপর নির্ভর করবে

    // Determine which data source to use based on currentKey's format or a global state
    // For simplicity, let's assume if currentKey is set by renderTeacherButtonsByClass, use credentials.
    // If it's for student (which this login is not for directly now), it would be studentData.
    // The previous design had one login dialog for both teacher sub-links and student results, which is a bit ambiguous.
    // For teacher_dates.js's purpose, this is fine.
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
    // কোন ক্লাসের জন্য মেসেজ দেখাতে হবে তা নির্ধারণ করুন
    const cls = key.split('_')[0];
    // শিক্ষক বা শিক্ষার্থীর লিংকের জন্য সঠিক কন্টেইনার খুঁজুন
    // এই ফাংশনটি এখন ক্লাসের নির্দিষ্ট কন্টেইনারের মধ্যে কাজ করবে
    const specificClassContainer = document.getElementById(`class-${cls}-exams`);
    if (!specificClassContainer) {
        console.warn(`Container for class ${cls} not found for showing message.`);
        return;
    }

    const links = specificClassContainer.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === getExamText(key)) {
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
    fetch('config_student.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            studentData = data;
            renderStudentButtonsByClass(); // পরিবর্তিত ফাংশন কল
        })
        .catch(error => {
            console.error('কনফিগারেশন লোডে সমস্যা (শিক্ষার্থী):', error);
            // এখানে একটি গ্লোবাল মেসেজ দেখানো যেতে পারে যদি কোনো ক্লাস-ভিত্তিক কন্টেইনারে মেসেজ না দেখানো হয়
        });
}

// ✅ শিক্ষার্থীর জন্য বাটন তৈরি ও দেখানো (প্রতিটি ক্লাসের জন্য আলাদা)
function renderStudentButtonsByClass() { // ফাংশনের নাম পরিবর্তন করা হয়েছে
    const classesOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']; // ক্লাসের ক্রম

    classesOrder.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য নির্দিষ্ট HTML কন্টেইনার খুঁজুন
        const classContainer = document.getElementById(`class-${cls}-exams`);
        if (!classContainer) {
            console.warn(`Student: Container for Class ${cls} not found.`);
            return;
        }

        const buttonsContainer = classContainer.querySelector('.exam-buttons-group');
        if (!buttonsContainer) {
            console.warn(`Student: Buttons container inside Class ${cls} not found.`);
            return;
        }
        buttonsContainer.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করা হলো

        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        let hasButtons = false; // এই ক্লাসের জন্য কোনো বোতাম আছে কিনা তা ট্র্যাক করতে

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
                    a.classList.add('disabled-exam-link'); // লিঙ্ক না থাকলে নিষ্ক্রিয় ক্লাস যোগ করুন
                }
                buttonsContainer.appendChild(a);
            }
        });

        // যদি এই ক্লাসের কোনো বাটন না থাকে, তবে একটি বার্তা দিন বা কন্টেইনার লুকান
        if (!hasButtons) {
            // যদি আপনি ক্লাসের কন্টেইনার লুকাতে চান:
            classContainer.style.display = 'none';
            // অথবা যদি আপনি "কোনো পরীক্ষার ফলাফল উপলব্ধ নেই" মেসেজ দেখাতে চান:
            // const noExamsMsg = document.createElement('p');
            // noExamsMsg.textContent = 'এই ক্লাসের জন্য কোনো পরীক্ষার ফলাফল উপলব্ধ নেই।';
            // noExamsMsg.style.cssText = 'font-size: 0.9em; color: #777; margin-top: 15px; text-align: center;';
            // classContainer.appendChild(noExamsMsg);
        } else {
            classContainer.style.display = 'block'; // বোতাম থাকলে দেখান
            // যদি `boxHeading` এবং `buttonsContainer` না থাকে, তবে যুক্ত করুন (যদি আপনার HTML এ পূর্বে না থাকে)
            // এটি নিশ্চিত করার জন্য যে `classBox` এর ভিতরে হেডিং এবং বোতাম গ্রুপ আছে
            if (!classContainer.querySelector('.box-heading')) {
                 const boxHeading = document.createElement('h2'); // h2 ব্যবহার করা হলো
                 boxHeading.className = 'box-heading shine';
                 boxHeading.textContent = `CLASS ${cls} EXAMS`; // HTML এ h2 রয়েছে
                 classContainer.prepend(boxHeading); // প্রথমে যোগ করুন
            }
            if (!classContainer.querySelector('.exam-buttons-group')) {
                classContainer.appendChild(buttonsContainer);
            }
        }
    });
}


// NOTICE & HELP লোড করা (অপরিবর্তিত)
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    })
    .catch(error => console.error('Error fetching files.json:', error)); // ত্রুটি হ্যান্ডলিং যোগ করা হয়েছে

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    if (!ul) { // ul এলিমেন্ট না থাকলে ফেরত যান
        console.warn(`Element with ID ${elementId} not found.`);
        return;
    }
    ul.innerHTML = ''; // তালিকা পরিষ্কার করুন
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

// ওয়েলকাম পপ আপের জাভাস্ক্রিপ্ট কোড (অপরিবর্তিত)
document.addEventListener('DOMContentLoaded', function() {
    // JSON ফাইল থেকে ডেটা লোড করুন
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
        // html2canvas লাইব্রেরি লোড করা আছে ধরে নেওয়া হচ্ছে
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

// পেজ লোড হওয়ার সাথে সাথে ফাংশনটি কল করুন
// এই অংশটি নিশ্চিত করবে যে সঠিক ফাংশনটি কল হচ্ছে লগইন স্ট্যাটাসের উপর ভিত্তি করে
document.addEventListener('DOMContentLoaded', () => {
    const userType = sessionStorage.getItem("userType");

    // এখানে একটি শর্ত যোগ করা হয়েছে যাতে শুধুমাত্র টিচার লগইন করলে টিচার লিংকগুলো লোড হয়,
    // এবং স্টুডেন্ট লগইন করলে স্টুডেন্ট লিংকগুলো লোড হয়।
    // যদি কেউ লগইন না করে, তবে মাস্টার লগইন ওভারলে দেখানো উচিত।
    if (userType === 'teacher') {
        document.getElementById('masterLoginOverlay').style.display = "none"; // লগইন ওভারলে লুকান
        loadTeacherExamLinks(); // শিক্ষকের লিংক লোড করুন
    } else if (userType === 'student') {
        document.getElementById('masterLoginOverlay').style.display = "none"; // লগইন ওভারলে লুকান
        loadStudentExamLinks(); // শিক্ষার্থীর লিংক লোড করুন
    } else {
        // কোনো লগইন না থাকলে, মাস্টার লগইন ওভারলে দেখান
        document.getElementById('masterLoginOverlay').style.display = "flex";
    }
});

// ✅ নম্বর আপলোডের শেষ তারিখ, চলমান নোটীশ টিচারদের জন্য....
        // সংশোধিত ID ব্যবহার করা হয়েছে
        const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

        // Exam dates যুক্ত করা
        examDates.forEach(exam => {
            if (exam.date) {
                const span = document.createElement("span");
                span.textContent = `${exam.text} ${exam.date}, `;

                // রং প্রয়োগ পুরো লাইনের জন্য
                span.style.color = exam.color;
                span.style.fontWeight = "bold";

                if (exam.backgroundColor) {
                    span.style.backgroundColor = exam.backgroundColor;
                }

                examDatesMarquee.appendChild(span);
            }
        });

        // Mouse hover করলে স্ক্রল থামানো
        examDatesMarquee.addEventListener("mouseover", () => {
            examDatesMarquee.classList.add("paused");
        });
        examDatesMarquee.addEventListener("mouseout", () => {
            examDatesMarquee.classList.remove("paused");
        });

        // মোবাইলে touch করলে স্ক্রল থামানো
        examDatesMarquee.addEventListener("touchstart", () => {
            examDatesMarquee.classList.add("paused");
        });
        examDatesMarquee.addEventListener("touchend", () => {
            examDatesMarquee.classList.remove("paused");
        });
    
