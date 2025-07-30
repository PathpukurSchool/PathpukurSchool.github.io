
// ✅ DOM এলিমেন্টগুলো সিলেক্ট করা
const menuToggle = document.getElementById("menu-toggle"); // মেনু টগল বাটন
const sidebar = document.getElementById("sidebar");       // সাইডবার
const mainContent = document.getElementById("main-content"); // মূল কনটেন্ট এরিয়া

// ✅ URL গুলি config.json থেকে লোড করার জন্য একটি ভ্যারিয়েবল।
// এটি গ্লোবাল স্কোপে রাখা হয়েছে যাতে অন্য ফাংশন থেকেও অ্যাক্সেস করা যায়।
let appConfig = {};

// ✅ config.json ফাইল লোড করার ফাংশন
async function loadConfig() {
    try {
        // 'config.json' ফাইলটি ফেচ (fetch) করুন।
        const response = await fetch('config.json');
        // যদি রেসপন্স ঠিক না থাকে (যেমন 404), তাহলে এরর থ্রো করুন।
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // রেসপন্সটিকে JSON ফরম্যাটে পার্স করুন এবং appConfig ভ্যারিয়েবলে সংরক্ষণ করুন।
        appConfig = await response.json();
        console.log("Configuration loaded successfully:", appConfig);
    } catch (error) {
        // কোনো এরর হলে কনসোলে লগ করুন এবং ইউজারকে জানান।
        console.error("Failed to load configuration:", error);
        alert("Error loading application configuration. Please try again later.");
    }
}

// ✅ পেজ লোড হওয়ার সাথে সাথে কনফিগারেশন লোড করুন।
// এটি নিশ্চিত করবে যে URL গুলি ব্যবহার করার আগে লোড হয়ে গেছে।
document.addEventListener('DOMContentLoaded', loadConfig);


// ✅ মেনু টগল বাটন ক্লিক করলে সাইডবার খোলা/বন্ধ করা
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

// ✅ সাইডবারের বাইরে ক্লিক করলে মেনু বন্ধ হবে
document.addEventListener("click", (event) => {
    if (!sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
        sidebar.classList.remove("open");
        menuToggle.classList.remove("open-menu");
        mainContent.style.marginLeft = "25px";
    }
});

// ✅ মেনু আইটেম ক্লিক করলে সাবমেনু টগল করা এবং অন্য সাবমেনু বন্ধ করা
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

// ✅ loadContent(page) ফাংশন: এটি ড্যাশবোর্ডের মূল অংশে (main-content) নির্বাচিত বিষয়বস্তু লোড করে।
// 'page' প্যারামিটারটি লোড করার জন্য নির্দিষ্ট বিষয়বস্তুর আইডি বা নাম।
// ✅ যেহেতু এই ফাংশনে URL ব্যবহার করা হবে যা অ্যাসিঙ্ক্রোনাসভাবে লোড হয়, তাই এখানে একটি চেক যোগ করা হয়েছে।
function loadContent(page) {
    let content = ""; // 'content' ভ্যারিয়েবলটি লোড করার জন্য HTML স্ট্রিং সংরক্ষণ করবে।

    // ✅ appConfig লোড হয়েছে কিনা তা নিশ্চিত করুন। যদি লোড না হয়ে থাকে, তাহলে ইউজারকে অপেক্ষা করতে বলুন।
    if (Object.keys(appConfig).length === 0) {
        mainContent.innerHTML = `<div style="text-align: center; padding: 50px;">
                                    <h3>কনফিগারেশন লোড হচ্ছে... অনুগ্রহ করে একটু অপেক্ষা করুন।</h3>
                                    <p>যদি লোড হতে বেশি সময় লাগে, তাহলে পৃষ্ঠাটি রিফ্রেশ করুন।</p>
                                </div>`;
        // কনফিগারেশন লোড হওয়ার পরে আবার ফাংশনটি চালানোর জন্য একটি ছোট ডিলে যোগ করা যেতে পারে।
        // তবে, ব্যবহারকারীর ক্লিক করার আগে loadConfig() লোড হয়ে যাওয়া উচিত।
        return; // কনফিগারেশন লোড না হলে ফাংশন এক্সিকিউশন বন্ধ করুন।
    }

    // বিভিন্ন 'page' আইডি অনুযায়ী শর্তসাপেক্ষে বিষয়বস্তু তৈরি করা হয়।
    if (page === "notice") {
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
    // ✅ রুটিন সিস্টেমের কন্টেন্ট: URL গুলি appConfig অবজেক্ট থেকে নেওয়া হয়েছে।
    else if (page === "staff-routine") {
        const staffRoutineUrl = appConfig.routineUrls.teacher || '#'; // যদি URL না পাওয়া যায়, তাহলে '#' ব্যবহার করুন।
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
    // অন্যান্য মেনু আইটেমের জন্য কন্টেন্ট তৈরি - এখানে কোন URL ব্যবহার করা হচ্ছে না, তাই পরিবর্তন নেই।
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

// ✅ ড্যাশবোর্ড শিরোনামে ক্লিক করলে ড্যাশবোর্ডকে পূর্বাবস্থায় ফেরানো
function resetDashboard() {
    mainContent.innerHTML = `
        <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
        <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;
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
