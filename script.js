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

// এক্সাম লিংক লোড (মাস্টার লগইন সফল হলে)
function loadExamLinks() {
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            credentials = data;
            renderButtons();
        });
}

let currentKey = '';

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

        // বক্সের হেডিং তৈরি করা হচ্ছে (ক্লাসের নাম)
        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading shine'; // CSS ক্লাস যা হেডিং এর স্টাইল দেবে
        boxHeading.textContent = 'CLASS ' + cls; // সরাসরি 'CLASS V', 'CLASS VI' ইত্যাদি হবে
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
                // যদি URL না থাকে অথবা URL খালি হয়, তাহলে সরাসরি 'showAvailableSoonMessage' কল করব
                // অন্যথায়, সরাসরি লিংক খুলব
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
    const links = container.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === getExamText(key)) {
            // আগে থেকে কোন বার্তা থাকলে সরাও
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove();

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 Available Soon 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            // 3 সেকেন্ড পরে মুছে ফেল
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
