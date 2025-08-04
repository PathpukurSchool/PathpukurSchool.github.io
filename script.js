
let config = {}; // config.json থেকে লোড হওয়া ডেটা
let masterCredentials = {}; // masterConfig.json থেকে লোড হওয়া ডেটা
let currentKey = '';
let currentPage = 1;
const noticesPerPage = 10;
let ScrollingNotices = []; // teacher_notice.js থেকে লোড হবে
let TableNotices = []; // notice.js থেকে লোড হবে
let examDates = []; // teacher_dates.js থেকে লোড হবে

// সমস্ত প্রয়োজনীয় JSON এবং JS ফাইল লোড করার জন্য প্রধান ফাংশন
async function loadAllData() {
    try {
        // masterConfig.json থেকে মাস্টার লগইন ডেটা লোড
        const masterResponse = await fetch('masterConfig.json');
        if (!masterResponse.ok) {
            throw new Error('Failed to load masterConfig.json');
        }
        masterCredentials = await masterResponse.json();

        // config.json থেকে শুধুমাত্র URL এবং স্ক্রলিং নোটিশের ডেটা লোড
        const configResponse = await fetch('config.json');
        if (!configResponse.ok) {
            throw new Error('Failed to load config.json');
        }
        config = await configResponse.json();
        
        // teacher_dates.js থেকে examDates লোড করা হচ্ছে
        const examDatesResponse = await fetch('teacher_dates.js');
        const examDatesText = await examDatesResponse.text();
        eval(examDatesText); // এটি `examDates` ভেরিয়েবল তৈরি করবে

        // teacher_notice.js থেকে ScrollingNotices লোড করা হচ্ছে
        const scrollNoticeResponse = await fetch('teacher_notice.js');
        const scrollNoticeText = await scrollNoticeResponse.text();
        eval(scrollNoticeText); // এটি `ScrollingNotices` ভেরিয়েবল তৈরি করবে

        // notice.js থেকে TableNotices লোড করা হচ্ছে
        const noticeResponse = await fetch('notice.js');
        const noticeText = await noticeResponse.text();
        eval(noticeText); // এটি `TableNotices` ভেরিয়েবল তৈরি করবে

        // সমস্ত ডেটা লোড হওয়ার পর রেন্ডারিং শুরু
        renderExamDatesMarquee();
        renderNoticeBoardMarquee();
        renderNoticeTable();
        renderAllSections();

    } catch (error) {
        console.error('ফাইল লোড করতে সমস্যা হয়েছে:', error);
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
            }
        }, 1000);
    } else {
        errorDiv.innerText = "আইডি বা পাসওয়ার্ড ভুল!";
        errorDiv.style.color = "red";
    }
}

// পরীক্ষার তারিখের জন্য স্ক্রলিং মারকিউ রেন্ডার করা
function renderExamDatesMarquee() {
    const examDatesMarquee = document.getElementById("exam-dates-marquee-content");
    if (!examDatesMarquee || !examDates) return;
    examDatesMarquee.innerHTML = '';
    
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

// নোটিশ বোর্ডের জন্য স্ক্রলিং মারকিউ রেন্ডার করা
function renderNoticeBoardMarquee() {
    const noticeBoardMarquee = document.getElementById("notice-board-marquee-content");
    if (!noticeBoardMarquee || !ScrollingNotices) return;
    noticeBoardMarquee.innerHTML = '';

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

// নোটিশ টেবিল রেন্ডার করার ফাংশন
function renderNoticeTable() {
    const container = document.getElementById('notice-board');
    if (!container || !TableNotices || !Array.isArray(TableNotices)) return;

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

// পপ-আপ মেসেজ দেখানোর ফাংশন (এই অংশ অপরিবর্তিত)
function showPopup(titleText, date, link, subjText) {
    // পপ-আপ কনটেইনার তৈরি
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#f0f8ff'; // হালকা নীল
    popup.style.padding = '20px';
    popup.style.margin = '0 auto';
    popup.style.border = '2px solid #333';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    popup.style.zIndex = '9999';
    popup.style.textAlign = 'center';
    popup.style.maxWidth = '90%';
    popup.style.minWidth = '240px';
    popup.style.width = '300px';
    popup.style.fontFamily = 'Arial, sans-serif';

    // হেডিং (Text)
    const titleElem = document.createElement('div');
    titleElem.innerText = titleText;
    titleElem.style.backgroundColor = 'green';
    titleElem.style.color = 'white';
    titleElem.style.fontWeight = 'bold';
    titleElem.style.fontSize = '15px';
    titleElem.style.padding = '10px';
    titleElem.style.borderRadius = '5px';
    titleElem.style.marginBottom = '15px';
    popup.appendChild(titleElem);

    // তারিখ (Date)
    const dateElem = document.createElement('div');
    dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
    dateElem.style.marginBottom = '10px';
    popup.appendChild(dateElem);

    // subj থাকলে তা দেখাও
    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.style.color = 'darkgreen';
        subjElem.style.backgroundColor = '#e6ffe6';
        subjElem.style.fontWeight = 'bold';
        subjElem.style.fontSize = '14px';
        subjElem.style.padding = '6px';
        subjElem.style.borderRadius = '4px';
        subjElem.style.marginBottom = '12px';
        popup.appendChild(subjElem);
    }
    
    // বোতাম কন্টেইনার
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexWrap = 'wrap';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';

    // ফাইল খুলুন বোতাম
    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.style.backgroundColor = '#007bff';
        linkBtn.style.color = 'white';
        linkBtn.style.padding = '10px 16px';
        linkBtn.style.border = 'none';
        linkBtn.style.borderRadius = '5px';
        linkBtn.style.textDecoration = 'none';
        linkBtn.style.fontWeight = 'bold';
        linkBtn.style.fontSize = '12px';
        linkBtn.style.transition = 'background-color 0.3s';
        linkBtn.onmouseover = () => linkBtn.style.backgroundColor = '#0056b3';
        linkBtn.onmouseout = () => linkBtn.style.backgroundColor = '#007bff';
        buttonContainer.appendChild(linkBtn);
    }

    // PNG ডাউনলোড বোতাম
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download';
    downloadBtn.style.backgroundColor = '#28a745';
    downloadBtn.style.color = 'white';
    downloadBtn.style.padding = '6px 10px';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '5px';
    downloadBtn.style.fontWeight = 'bold';
    downloadBtn.style.fontSize = '12px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.onclick = () => {
        setTimeout(() => {
            html2canvas(popup).then(canvas => {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = 'notice.png';
                link.click();
            });
        }, 100);
    };
    buttonContainer.appendChild(downloadBtn);

    // বন্ধ করুন বোতাম
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Back';
    closeBtn.style.backgroundColor = '#dc3545';
    closeBtn.style.color = 'white';
    closeBtn.style.padding = '6px 10px';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontSize = '12px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.transition = 'background-color 0.3s';
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#a71d2a';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#dc3545';
    closeBtn.onclick = () => document.body.removeChild(popup);
    buttonContainer.appendChild(closeBtn);

    popup.appendChild(buttonContainer);
    document.body.appendChild(popup);
}

// welcome pop-up এবং master login এর জন্য অন্য প্রয়োজনীয় ফাংশন
function closeWebsiteWelcomePopup() {
    const welcomePopup = document.getElementById('websiteWelcomePopup');
    if (welcomePopup) {
        welcomePopup.style.display = 'none';
    }
}
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
function submitLogin() {
    // এই ফাংশনটি যেহেতু exam-buttons এর জন্য, তাই এর কোনো পরিবর্তন হবে না
}
function closeLogin() {
    // এই ফাংশনটি যেহেতু exam-buttons এর জন্য, তাই এর কোনো পরিবর্তন হবে না
}

// এই ফাংশনটি শুধুমাত্র রুটিন ও ইনফো সেকশন তৈরি করবে
function renderAllSections() {
    const container = document.getElementById('routine-and-info-buttons-container');
    if (!container) return;
    container.innerHTML = '';
    
    // teacher_routine
    const teacherRoutineBox = document.createElement('div');
    teacherRoutineBox.className = 'shaded-info-box';
    teacherRoutineBox.innerHTML = `<h2 class="shine">Staff Routine</h2><h3 class="login-instruction-heading">To view staff (teacher) routine, please click the button below:<span class="emoji">👇</span></h3><a href="${config.urls.teacher_routine}" target="_blank" class="exam-link">VIEW STAFF ROUTINE</a>`;
    container.appendChild(teacherRoutineBox);
    
    // class_routine
    const classRoutineBox = document.createElement('div');
    classRoutineBox.className = 'shaded-info-box';
    classRoutineBox.innerHTML = `<h2 class="shine">Class Routine</h2><h3 class="login-instruction-heading">To view class (student) routine, please click the button below:<span class="emoji">👇</span></h3><a href="${config.urls.class_routine}" target="_blank" class="exam-link">VIEW CLASS ROUTINE</a>`;
    container.appendChild(classRoutineBox);

    // subject_routine
    const subjectRoutineBox = document.createElement('div');
    subjectRoutineBox.className = 'shaded-info-box';
    subjectRoutineBox.innerHTML = `<h2 class="shine">Subject Routine</h2><h3 class="login-instruction-heading">To view subject routine, please click the button below:<span class="emoji">👇</span></h3><a href="${config.urls.subject_routine}" target="_blank" class="exam-link">VIEW SUBJECT ROUTINE</a>`;
    container.appendChild(subjectRoutineBox);

    // school_exam_routine
    const schoolExamRoutineBox = document.createElement('div');
    schoolExamRoutineBox.className = 'shaded-info-box';
    schoolExamRoutineBox.innerHTML = `<h2 class="shine">School Exam Routine</h2><h3 class="login-instruction-heading">To view Inter-school Examination Routine, please click the button below:<span class="emoji">👇</span></h3><a href="${config.urls.school_exam_routine}" target="_blank" class="exam-link">VIEW EXAM ROUTINE</a>`;
    container.appendChild(schoolExamRoutineBox);
    
    // student_database
    const studentDatabaseBox = document.createElement('div');
    studentDatabaseBox.className = 'shaded-info-box';
    studentDatabaseBox.innerHTML = `<h2 class="shine">Student Information</h2><h3 class="login-instruction-heading">To view student information or search the student database, please click the button below:<span class="emoji">👇</span></h3><a href="${config.urls.student_database}" target="_blank" class="exam-link">VIEW STUDENT DATABASE</a>`;
    container.appendChild(studentDatabaseBox);

    // upload_student_notice
    const uploadNoticeContainer = document.getElementById('upload-notice-container');
    if (uploadNoticeContainer) {
        uploadNoticeContainer.innerHTML = `<a href="${config.urls.upload_student_notice}" target="_blank" class="exam-link">UPLOAD STUDENT NOTICE</a>`;
    }
}

// Document Load হলে সমস্ত ডেটা লোড করার জন্য প্রধান ফাংশনটি কল করা হয়
document.addEventListener('DOMContentLoaded', loadAllData);
