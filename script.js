let credentials = {};
let masterCredential = {};

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
        // Session set করুন
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
                loadExamLinks(); // মূল ডেটা লোড
            }
        }, 1000); // 1.5 সেকেন্ড পর রিডাইরেক্ট
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}


//  লগইন সফল হলে এক্সাম লিংক লোড হবে
// এই ভেরিয়েবলটি config.json থেকে লোড করা ক্রেডেনশিয়ালস ধারণ করবে
let credentials = {};
// বর্তমানে খোলা পরীক্ষার কী (যেমন: "V_1ST")
let currentKey = '';

// এক্সাম লিংক লোড করার ফাংশন (মাস্টার লগইন সফল হলে)
function loadExamLinks() {
    fetch('config.json') // config.json ফাইল থেকে ডেটা ফেচ করুন
        .then(response => response.json()) // রেসপন্সকে JSON এ পার্স করুন
        .then(data => {
            credentials = data; // প্রাপ্ত ডেটা credentials ভেরিয়েবলে সংরক্ষণ করুন
            renderButtonsByClass(); // প্রতিটি ক্লাসের জন্য আলাদাভাবে বোতাম রেন্ডার করুন
        })
        .catch(error => console.error('Error loading config.json:', error)); // ত্রুটি হলে কনসোলে দেখান
}

// ডকুমেন্ট লোড হওয়ার সাথে সাথে এক্সাম লিংক লোড করুন
document.addEventListener('DOMContentLoaded', loadExamLinks);

// প্রতিটি ক্লাসের জন্য আলাদাভাবে এক্সাম লিংক তৈরি ও দেখানো
function renderButtonsByClass() {
    // এখানে প্রতিটি 'cls' হবে 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
    const classes = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];

    classes.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য নির্দিষ্ট কন্টেইনার খুঁজুন
        const classContainer = document.getElementById(`class-${cls}-exams`);
        if (!classContainer) {
            console.warn(`Container for Class ${cls} not found.`); // কন্টেইনার না পেলে সতর্ক করুন
            return;
        }

        const buttonsContainer = classContainer.querySelector('.exam-buttons-group');
        buttonsContainer.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করুন

        let hasButtons = false; // এই ক্লাসের জন্য কোনো বোতাম আছে কিনা তা ট্র্যাক করতে

        exams.forEach(exam => {
            const key = `${cls}_${exam}`; // যেমন: "V_1ST", "IX_TEST", "XII_SEM1"
            if (credentials[key]) { // যদি এই নির্দিষ্ট পরীক্ষার জন্য ডেটা config.json-এ থাকে
                hasButtons = true; // বোতাম আছে চিহ্নিত করুন
                const button = document.createElement('button');
                button.className = 'box-button exam-link'; // CSS ক্লাস যা বোতামের স্টাইল দেবে

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
                    case '1ST':
                        label = '1ST EXAM';
                        break;
                    case '2ND':
                        label = '2ND EXAM';
                        break;
                    case '3RD':
                        label = '3RD EXAM';
                        break;
                }

                button.textContent = label;
                // যদি URL না থাকে অথবা URL খালি হয়, তাহলে সরাসরি 'showAvailableSoonMessage' কল করব
                // অন্যথায়, আইডি/পাসওয়ার্ড লগইন ডায়ালগ খুলব
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => openLogin(key); // URL থাকলে আইডি/পাসওয়ার্ড চাইবে
                } else {
                    button.onclick = () => showAvailableSoonMessage(key); // URL না থাকলে সরাসরি মেসেজ দেখাবে
                    button.classList.add('disabled-exam-link'); // ঐচ্ছিক: বোতামটি নিষ্প্রভ করতে একটি ক্লাস যোগ করুন
                }
                buttonsContainer.appendChild(button); // বোতাম কন্টেইনারে যোগ করুন
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


// প্রতিটি এক্সাম লিংকের জন্য সাব-লগইন খোলার ফাংশন
function openLogin(key) {
    currentKey = key; // বর্তমান পরীক্ষার কী সেট করুন
    document.getElementById('loginId').value = ''; // আইডি ইনপুট ফিল্ড পরিষ্কার করুন
    document.getElementById('loginPassword').value = ''; // পাসওয়ার্ড ইনপুট ফিল্ড পরিষ্কার করুন
    document.getElementById('loginError').innerText = ''; // ত্রুটির মেসেজ পরিষ্কার করুন
    document.getElementById('loginDialog').showModal(); // লগইন ডায়ালগ দেখান
}

// সাব-লগইন বন্ধ করার ফাংশন
function closeLogin() {
    document.getElementById('loginDialog').close(); // লগইন ডায়ালগ বন্ধ করুন
}

// সাব-লগইন যাচাই করে লিংক খোলার ফাংশন
function submitLogin() {
    const id = document.getElementById('loginId').value; // ইনপুট করা আইডি নিন
    const pass = document.getElementById('loginPassword').value; // ইনপুট করা পাসওয়ার্ড নিন
    const credential = credentials[currentKey]; // বর্তমান পরীক্ষার জন্য ক্রেডেনশিয়াল নিন

    // যদি ক্রেডেনশিয়াল থাকে এবং আইডি ও পাসওয়ার্ড মিলে যায়
    if (credential && credential.id === id && credential.pass === pass) {
        // যদি URL থাকে এবং URL খালি না হয়
        if (credential.url && credential.url.trim() !== '') {
            window.open(credential.url, '_blank'); // নতুন ট্যাবে URL খুলুন
            closeLogin(); // লগইন ডায়ালগ বন্ধ করুন
        } else {
            // URL না থাকলে "শীঘ্রই উপলব্ধ হবে" মেসেজ দেখান
            closeLogin(); // ডায়ালগ বন্ধ করুন
            showAvailableSoonMessage(currentKey); // বার্তা দেখান
        }
    } else {
        document.getElementById('loginError').innerText = 'Incorrect ID or Password!'; // ভুল আইডি বা পাসওয়ার্ড মেসেজ দেখান
    }
}

// "শীঘ্রই উপলব্ধ হবে" মেসেজ দেখানোর ফাংশন
function showAvailableSoonMessage(key) {
    // সংশ্লিষ্ট ক্লাসের কন্টেইনার খুঁজুন
    const cls = key.split('_')[0];
    const classContainer = document.getElementById(`class-${cls}-exams`);
    if (!classContainer) return; // কন্টেইনার না পেলে ফিরে যান

    const links = classContainer.getElementsByClassName('exam-link'); // ঐ ক্লাসের সব এক্সাম লিংক নিন

    for (let link of links) {
        // যে লিংকের টেক্সট বর্তমান পরীক্ষার টেক্সটের সাথে মিলে যায়
        if (link.textContent === getExamText(key)) {
            // আগে থেকে কোনো বার্তা থাকলে সরাও
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove();

            const msg = document.createElement('div'); // নতুন div তৈরি করুন
            msg.className = 'avail-msg'; // CSS ক্লাস যোগ করুন
            msg.textContent = '🔔 Available Soon 🔔'; // মেসেজ সেট করুন

            link.parentNode.insertBefore(msg, link.nextSibling); // লিংকের পরে মেসেজ যোগ করুন

            // 3 সেকেন্ড পরে মেসেজ মুছে ফেলুন
            setTimeout(() => {
                msg.remove();
            }, 3000);

            break; // মিলে গেলে লুপ থেকে বেরিয়ে আসুন
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেওয়ার ফাংশন ('TEST EXAM', 'SEMESTER I', ...)
function getExamText(key) {
    const parts = key.split('_'); // কী-কে '_' দ্বারা বিভক্ত করুন
    const exam = parts[1]; // পরীক্ষার অংশ নিন

    switch (exam) {
        case 'TEST':
            return 'TEST EXAM';
        case 'SEM1':
            return 'SEMESTER I';
        case 'SEM2':
            return 'SEMESTER II';
        case '1ST':
            return '1ST EXAM';
        case '2ND':
            return '2ND EXAM';
        case '3RD':
            return '3RD EXAM';
        default:
            return exam; // কোনো ম্যাচ না হলে ডিফল্ট হিসেবে পরীক্ষার নাম ফেরত দিন
    }
}


// NOTICE & HELP লোড করা
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    });

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
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
    // JSON ফাইল থেকে ডেটা লোড করুন
    fetch('home_popup.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('নেটওয়ার্ক রেসপন্স ঠিক ছিল না ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // পপ-আপের শিরোনাম এবং বার্তা সেট করুন
            const popupTitleElement = document.getElementById('popupTitle');
            const popupMessageElement = document.getElementById('popupMessage');
            // বোতামগুলোর নতুন আইডি ব্যবহার করা হয়েছে
            const downloadButton = document.getElementById('downloadPopupButton'); // নতুন আইডি
            const closeButton = document.getElementById('closePopupButton');     // নতুন আইডি
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

            // পপ-আপ দেখান
            if (welcomePopup) {
                welcomePopup.style.display = 'flex';
            }

            // ক্লোজ বাটনের কার্যকারিতা
            if (closeButton) {
                closeButton.addEventListener('click', closeWebsiteWelcomePopup);
            }

            // ডাউনলোড বাটনের কার্যকারিতা
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



// ✅স্টুডেন্ট এক্সাম লিঙ্ক (পরীক্ষার ফলাফল)
    let studentData = {};
    // লিঙ্ক লোড
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
                renderStudentButtons();
            })
            .catch(error => {
                console.error('কনফিগারেশন লোডে সমস্যা:', error);
                document.getElementById('exam-buttons').innerHTML = '<p style="color: red; text-align: center;">ডাটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।</p>';
            });
    }

    // বাটন তৈরি ও দেখানো
    function renderStudentButtons() {
        const container = document.getElementById('exam-buttons');
        container.innerHTML = ''; // কন্টেইনার খালি করা হলো

        // ইউনিক ক্লাস লিস্ট তৈরি
        // Object.keys(studentData) থেকে শুধু ক্লাসের অংশ (যেমন "V", "VI") বের করা
        const classes = [...new Set(Object.keys(studentData).map(k => k.split('_')[0]))].sort(); // ক্লাসের নাম অনুসারে সাজানো হলো

        if (classes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #555;">কোনো পরীক্ষার ফলাফল উপলব্ধ নেই।</p>';
            return;
        }

        classes.forEach(cls => {
            // ✅ প্রতিটি ক্লাসের জন্য একটি বক্স তৈরি করা হচ্ছে
            const classBox = document.createElement('div');
            classBox.className = 'shaded-info-box'; // CSS এ এই ক্লাসটি আগে থেকেই আছে

            // বক্সের হেডিং তৈরি করা হচ্ছে (ক্লাসের নাম)
            const boxHeading = document.createElement('h3');
            boxHeading.className = 'box-heading shine'; // CSS ক্লাস যা হেডিং এর স্টাইল দেবে
            boxHeading.textContent = `CLASS ${cls}`; // সরাসরি 'CLASS V', 'CLASS VI' ইত্যাদি হবে
            classBox.appendChild(boxHeading);

            // বোতামগুলির জন্য একটি কন্টেইনার তৈরি করা যাতে সেগুলো flexbox দিয়ে সাজানো যায়
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'exam-buttons-group'; // নতুন ক্লাস, এর জন্য CSS লাগবে

            const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
            exams.forEach(exam => {
                const key = `${cls}_${exam}`;
                if (studentData[key]) {
                    const link = studentData[key].url;
                    const a = document.createElement('a');
                    a.className = 'box-button exam-link'; // CSS ক্লাস যা বোতামের স্টাইল দেবে
                    a.target = '_blank'; // নতুন ট্যাবে খুলবে

                    let label = exam;
                    if (exam === 'TEST') label = 'TEST EXAM';
                    else if (exam === 'SEM1') label = 'SEMESTER I';
                    else if (exam === 'SEM2') label = 'SEMESTER II';
                    a.textContent = label;

                    if (link && link.trim() !== '') {
                        a.href = link; // সরাসরি লিঙ্ক সেট করা হলো
                    } else {
                        a.href = '#'; // যদি লিঙ্ক না থাকে, তাহলে হ্যাশ ট্যাগ
                        a.onclick = (e) => { // যদি লিঙ্ক না থাকে তাহলে ক্লিক ইভেন্ট
                            e.preventDefault(); // ডিফল্ট লিঙ্ক আচরণ বন্ধ করা
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
                    }
                    buttonsContainer.appendChild(a); // ✅ বাটনগুলো নতুন buttonsContainer এ যোগ করা হলো
                }
            });

            if (buttonsContainer.children.length > 0) { // যদি ক্লাসের কোনো বাটন থাকে
                classBox.appendChild(buttonsContainer); // ✅ buttonsContainer কে classBox এ যোগ করা হলো
            } else {
                 // যদি এই ক্লাসের কোনো পরীক্ষার লিঙ্ক না থাকে, তবে একটি বার্তা দিন
                const noExamsMsg = document.createElement('p');
                noExamsMsg.textContent = 'এই ক্লাসের জন্য কোনো পরীক্ষার ফলাফল উপলব্ধ নেই।';
                noExamsMsg.style.cssText = 'font-size: 0.9em; color: #777; margin-top: 15px;';
                classBox.appendChild(noExamsMsg);
            }
            
            container.appendChild(classBox); // ✅ মূল কন্টেইনারে ক্লাস বক্স যোগ করা হলো
        });
    }

    // পেজ লোড হওয়ার সাথে সাথে ফাংশনটি কল করুন
    document.addEventListener('DOMContentLoaded', loadStudentExamLinks);

// ✅ নম্বর আপলোডের শেষ তারিখ, টিচারদের জন্য....
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
    
