
let config = {}; // config.json থেকে লোড হওয়া ডেটা
let masterCredentials = {}; // masterConfig.json থেকে লোড হওয়া ডেটা
let studentData = {};
let currentKey = '';
let currentPage = 1;
const noticesPerPage = 10;
let ScrollingNotices = []; // স্ক্রলিং নোটিশের ডেটা এখানে থাকবে
let TableNotices = []; // টেবিল নোটিশের ডেটা এখানে থাকবে

// সমস্ত প্রয়োজনীয় JSON ফাইল লোড করার জন্য প্রধান ফাংশন
async function loadAllData() {
    try {
        // masterConfig.json থেকে মাস্টার লগইন ডেটা লোড
        const masterResponse = await fetch('masterConfig.json');
        if (!masterResponse.ok) {
            throw new Error('Failed to load masterConfig.json');
        }
        masterCredentials = await masterResponse.json();

        // config.json থেকে অন্যান্য সব ডেটা (URL, scrolling notice) লোড
        const configResponse = await fetch('config.json');
        if (!configResponse.ok) {
            throw new Error('Failed to load config.json');
        }
        config = await configResponse.json();

        // studentData লোড করা (যদি প্রয়োজন হয়)
        const studentResponse = await fetch('config_student.json');
        if (studentResponse.ok) {
            studentData = await studentResponse.json();
        }
        
        // teacher_dates.js এবং teacher_notice.js লোড করার জন্য Fetch ব্যবহার
        // যদি এই ফাইলগুলো জাভাস্ক্রিপ্ট কোড লোড না করে, তাহলে সরাসরি লোড হবে
        
        // TableNotices লোড করা
        const noticeResponse = await fetch('notice.js');
        const noticeText = await noticeResponse.text();
        eval(noticeText); // এটি `TableNotices` ভেরিয়েবল তৈরি করবে

        // ScrollingNotices লোড করা
        const scrollNoticeResponse = await fetch('teacher_notice.js');
        const scrollNoticeText = await scrollNoticeResponse.text();
        eval(scrollNoticeText); // এটি `ScrollingNotices` ভেরিয়েবল তৈরি করবে

        const examDatesResponse = await fetch('teacher_dates.js');
        const examDatesText = await examDatesResponse.text();
        eval(examDatesText); // এটি `examDates` ভেরিয়েবল তৈরি করবে

        // সমস্ত ডেটা লোড হওয়ার পর রেন্ডারিং শুরু
        renderAllSections();
        renderNoticeTable();
        handleWelcomePopup();
        renderExamDatesMarquee();
        renderNoticeBoardMarquee();

    } catch (error) {
        console.error('JSON ফাইল লোড করতে সমস্যা হয়েছে:', error);
    }
}

// মাস্টার লগইন ফাংশন
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
        errorDiv.innerText = "লগইন টাইপ, আইডি এবং পাসওয়ার্ড পূরণ করুন।";
        return;
    }

    const user = masterCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        sessionStorage.setItem("userType", type.toLowerCase());
        sessionStorage.setItem("studentLoggedIn", type.toLowerCase() === "student" ? "true" : "false");

        successDiv.innerText = "✔️ লগইন সফল হয়েছে।";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (user.redirect) {
                window.location.href = user.redirect;
            } else {
                document.getElementById('masterLoginOverlay').style.display = "none";
                // মাস্টার লগইন সফল হলে এক্সাম লিংক লোড হবে
                renderAllSections();
            }
        }, 1000);
    } else {
        errorDiv.innerText = "আইডি বা পাসওয়ার্ড ভুল!";
        errorDiv.style.color = "red";
    }
}

// সমস্ত সেকশন রেন্ডার করার ফাংশন
function renderAllSections() {
    renderMarksUploadingSection();
    renderExamButtons();
    renderAdmissionTestSection();
    renderRoutineAndInfo();
    renderUploadNoticeSection();
}

// মার্কস আপলোডিং সেকশন তৈরি
function renderMarksUploadingSection() {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    const section = document.createElement('div');
    section.className = 'shaded-info-box';

    const heading = document.createElement('h3');
    heading.className = 'box-heading shine';
    heading.textContent = 'MARKS UPLOADING STATUS';
    section.appendChild(heading);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'exam-buttons-group';

    const button = document.createElement('button');
    button.className = 'box-button';
    button.textContent = 'Marks Upload Status';
    
    button.onclick = () => {
        if (config.urls.marks_upload_status && config.urls.marks_upload_status.trim() !== '') {
            window.open(config.urls.marks_upload_status, '_blank');
        } else {
            showInfoMessage(button, '🔔 উপলব্ধ নয় 🔔');
        }
    };
    buttonsContainer.appendChild(button);
    section.appendChild(buttonsContainer);

    mainContainer.insertBefore(section, mainContainer.firstChild); 
}

// এক্সাম বাটন তৈরি করা (ID-Password ছাড়া)
function renderExamButtons() {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    const section = document.createElement('div');
    section.id = 'exam-buttons';
    mainContainer.appendChild(section);

    const credentials = config.exam_credentials || {};
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];
    const sortedClasses = classes.sort((a, b) => {
        const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return order.indexOf(a) - order.indexOf(b);
    });

    sortedClasses.forEach(cls => {
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box';

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
                
                let label = exam;
                switch (exam) {
                    case 'TEST': label = 'TEST EXAM'; break;
                    case 'SEM1': label = 'SEMESTER I'; break;
                    case 'SEM2': label = 'SEMESTER II'; break;
                }
                
                button.textContent = label;
                
                // এখানে সরাসরি URL ব্যবহার করা হচ্ছে, কোনো আইডি/পাসওয়ার্ড যাচাই নেই
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
            section.appendChild(classBox);
        }
    });
}

// অ্যাডমিশন টেস্ট সেকশন তৈরি
function renderAdmissionTestSection() {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    const section = document.createElement('div');
    section.className = 'shaded-info-box';

    const heading = document.createElement('h3');
    heading.className = 'box-heading shine';
    heading.textContent = 'ADMISSION TEST';
    section.appendChild(heading);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'exam-buttons-group';

    const button = document.createElement('button');
    button.className = 'box-button';
    button.textContent = 'Admission Test';

    button.onclick = () => {
        if (config.urls.admission_test && config.urls.admission_test.trim() !== '') {
            window.open(config.urls.admission_test, '_blank');
        } else {
            showInfoMessage(button, '🔔 উপলব্ধ নয় 🔔');
        }
    };
    buttonsContainer.appendChild(button);
    section.appendChild(buttonsContainer);

    mainContainer.appendChild(section); 
}

// রুটিন এবং ইনফরমেশন সেকশন তৈরি
function renderRoutineAndInfo() {
    const container = document.getElementById('routine-and-info-buttons-container');
    if (!container) return;
    container.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করা
    
    const urls = config.urls || {};

    createButtonBox(container, 'Staff Routine', 'To view staff (teacher) routine, please click the button below:', urls.teacher_routine, 'VIEW STAFF ROUTINE');
    createButtonBox(container, 'Class Routine', 'To view class (student) routine, please click the button below:', urls.class_routine, 'VIEW CLASS ROUTINE');
    createButtonBox(container, 'Subject Routine', 'To view subject routine, please click the button below:', urls.subject_routine, 'VIEW SUBJECT ROUTINE');
    createButtonBox(container, 'School Exam Routine', 'To view Inter-school Examination Routine, please click the button below:', urls.school_exam_routine, 'VIEW EXAM ROUTINE');
    createButtonBox(container, 'Student Information', 'To view student information or search the student database, please click the button below:', urls.student_database, 'VIEW STUDENT DATABASE');
}

// নোটিশ আপলোড সেকশন তৈরি
function renderUploadNoticeSection() {
    const container = document.getElementById('upload-notice-container');
    if (!container) return;
    container.innerHTML = '';
    
    const url = config.urls.upload_student_notice;
    
    if (url && url.trim() !== '') {
        const button = document.createElement('a');
        button.href = url;
        button.textContent = 'UPLOAD STUDENT NOTICE';
        button.className = 'exam-link';
        button.target = '_blank';
        container.appendChild(button);
    } else {
        const availableSoonMsg = document.createElement('div');
        availableSoonMsg.innerHTML = '<strong> Available Soon! </strong><br> Please check back later for updates.';
        availableSoonMsg.style.cssText = `
            border: 2px solid #ff9999;
            background-color: #ffe6e6;
            color: #cc0000;
            font-size: 20px;
            font-weight: bold;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            max-width: 300px;
            margin: 0 auto;
        `;
        container.appendChild(availableSoonMsg);
    }
}

// সহায়ক ফাংশন: একটি বোতাম বক্স তৈরি করা
function createButtonBox(container, headingText, instructionText, url, buttonText) {
    const box = document.createElement('div');
    box.className = 'shaded-info-box';
    
    const heading = document.createElement('h2');
    heading.className = 'shine';
    heading.textContent = headingText;
    box.appendChild(heading);
    
    const instruction = document.createElement('h3');
    instruction.className = 'login-instruction-heading';
    instruction.innerHTML = `${instructionText}<span class="emoji">👇</span>`;
    box.appendChild(instruction);
    
    const link = document.createElement('a');
    link.href = url;
    link.textContent = buttonText;
    link.target = '_blank';
    link.className = 'exam-link';
    box.appendChild(link);
    
    container.appendChild(box);
}

// পপআপ মেসেজ দেখানোর ফাংশন
function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    const links = container.getElementsByClassName('exam-link');
    
    // কোডের বাকি অংশ অপরিবর্তিত
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

// পরীক্ষার নাম ফরম্যাট করার ফাংশন
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
        default: return exam;
    }
}

// নোটিশ টেবিল রেন্ডার করার ফাংশন
function renderNoticeTable() {
    const container = document.getElementById('notice-board');
    if (!container || !TableNotices || !Array.isArray(TableNotices)) return;
    
    // কোডের বাকি অংশ অপরিবর্তিত
    container.innerHTML = "";
    const start = (currentPage - 1) * noticesPerPage;
    const end = start + noticesPerPage;
    const paginatedNotices = TableNotices.slice(start, end);

    const table = document.createElement('table');
    table.id = 'notice-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th>তারিখ</th><th>বিষয়বস্তু</th><th>বিজ্ঞপ্তি</th></tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    paginatedNotices.forEach(notice => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${notice.date}</td>
          <td style="color: ${notice.color || '#000'};">${notice.text}</td>
          <td><button onclick="showPopup('${notice.text}', '${notice.date}', '${notice.link || ''}', '${notice.subj || ''}')">View</button></td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    const totalPages = Math.ceil(TableNotices.length / noticesPerPage);
    document.getElementById('pageNumber').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// পরের পাতা
function nextPage() {
    if (currentPage < Math.ceil(TableNotices.length / noticesPerPage)) {
        currentPage++;
        renderNoticeTable();
    }
}

// আগের পাতা
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderNoticeTable();
    }
}

// ওয়েলকাম পপআপ পরিচালনা করা
function handleWelcomePopup() {
    if (!config.home_popup) return;
    const data = config.home_popup;
    const popupTitleElement = document.getElementById('popupTitle');
    const popupMessageElement = document.getElementById('popupMessage');
    const downloadButton = document.getElementById('downloadPopupButton');
    const closeButton = document.getElementById('closePopupButton');
    const welcomePopup = document.getElementById('websiteWelcomePopup');
    
    // কোডের বাকি অংশ অপরিবর্তিত
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
}

function closeWebsiteWelcomePopup() {
    const welcomePopup = document.getElementById('websiteWelcomePopup');
    if (welcomePopup) {
        welcomePopup.style.display = 'none';
    }
}

// পপআপ JPG হিসেবে ডাউনলোড
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

// এক্সাম ডেট স্ক্রলিং রেন্ডার করা
function renderExamDatesMarquee() {
    const examDatesMarquee = document.getElementById("exam-dates-marquee-content");
    if (!examDatesMarquee || !examDates) return;
    
    // কোডের বাকি অংশ অপরিবর্তিত
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

    examDatesMarquee.addEventListener("mouseover", () => examDatesMarquee.classList.add("paused"));
    examDatesMarquee.addEventListener("mouseout", () => examDatesMarquee.classList.remove("paused"));
    examDatesMarquee.addEventListener("touchstart", () => examDatesMarquee.classList.add("paused"));
    examDatesMarquee.addEventListener("touchend", () => examDatesMarquee.classList.remove("paused"));
}

// নোটিশ বোর্ড স্ক্রলিং রেন্ডার করা
function renderNoticeBoardMarquee() {
    const noticeBoardMarquee = document.getElementById("notice-board-marquee-content");
    if (!noticeBoardMarquee || !ScrollingNotices) return;

    // কোডের বাকি অংশ অপরিবর্তিত
    if (Array.isArray(ScrollingNotices)) {
        ScrollingNotices.forEach(notice => {
            const date = notice.date || "";
            const text = notice.text || "";
            if (text.trim() !== "") {
                const span = document.createElement("span");
                span.textContent = `${date} - ${text}`;
                span.style.color = notice.color || "black";
                span.style.fontWeight = "bold";
                span.style.marginRight = "30px";
                noticeBoardMarquee.appendChild(span);
            }
        });
    } else {
        noticeBoardMarquee.textContent = "কোনো নোটিশ পাওয়া যায়নি।";
    }

    noticeBoardMarquee.addEventListener("mouseover", () => noticeBoardMarquee.classList.add("paused"));
    noticeBoardMarquee.addEventListener("mouseout", () => noticeBoardMarquee.classList.remove("paused"));
    noticeBoardMarquee.addEventListener("touchstart", () => noticeBoardMarquee.classList.add("paused"));
    noticeBoardMarquee.addEventListener("touchend", () => noticeBoardMarquee.classList.remove("paused"));
}

// Document Load হলে সমস্ত ডেটা লোড করার জন্য প্রধান ফাংশনটি কল করা হয়
document.addEventListener('DOMContentLoaded', loadAllData);
