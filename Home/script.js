
// ✅ DOM এলিমেন্টগুলো সিলেক্ট করা
const menuToggle = document.getElementById("menu-toggle"); // মেনু টগল বাটন
const sidebar = document.getElementById("sidebar");       // সাইডবার
const mainContent = document.getElementById("main-content"); // মূল কনটেন্ট এরিয়া

// ✅ মেনু টগল বাটন ক্লিক করলে সাইডবার খোলা/বন্ধ করা
menuToggle.addEventListener("click", (event) => {
    event.preventDefault(); // ✅ পৃষ্ঠার রিলোড হওয়া বন্ধ করে
    event.stopPropagation(); // ✅ এই লাইনটি ইভেন্ট প্রোপাগেশন থামাবে

    // সাইডবার যদি খোলা থাকে তাহলে বন্ধ করবে, না হলে খুলবে
    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        menuToggle.classList.remove("open-menu");
        mainContent.style.marginLeft = "25px"; // সাইডবার বন্ধ হলে মূল কনটেন্টের মার্জিন রিসেট
    } else {
        sidebar.classList.add("open");
        menuToggle.classList.add("open-menu");
        mainContent.style.marginLeft = "280px"; // সাইডবার খুললে মূল কনটেন্টের মার্জিন সেট
    }
});

// ✅ সাইডবারের বাইরে ক্লিক করলে মেনু বন্ধ হবে
document.addEventListener("click", (event) => {
    // যদি ক্লিক সাইডবারের ভিতরে না হয় এবং টগল বাটনেও না হয় (এবং টগল বাটন নিজে না হয়)
    if (!sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
        sidebar.classList.remove("open"); // সাইডবার বন্ধ করো
        menuToggle.classList.remove("open-menu"); // আইকনের ঘোরানো বন্ধ করো
        mainContent.style.marginLeft = "25px"; // সাইডবার বন্ধ হলে মূল কনটেন্টের মার্জিন রিসেট
    }
});

// ✅ মেনু আইটেম ক্লিক করলে সাবমেনু টগল করা এবং অন্য সাবমেনু বন্ধ করা
function toggleMenu(element) {
    const allMenuItems = document.querySelectorAll(".menu-item"); // সমস্ত মেনু আইটেম সিলেক্ট করো

    allMenuItems.forEach(item => {
        // যদি বর্তমান ক্লিক করা আইটেমটি না হয়
        if (item !== element) {
            item.classList.remove("active"); // 'active' ক্লাস সরাও
            const submenu = item.querySelector(".submenu");
            if (submenu) {
                submenu.classList.remove("open"); // সাবমেনুর 'open' ক্লাস সরাও (এনিমেশনের জন্য)
            }
        }
    });

    // বর্তমান ক্লিক করা মেনু আইটেমের সাবমেনু খুঁজে বের করো
    const submenu = element.querySelector(".submenu");
    if (submenu) {
        // 'open' ক্লাস টoggle করে সাবমেনু খোলা/বন্ধ করো (CSS ট্রানজিশন ব্যবহার করে)
        submenu.classList.toggle("open");
        element.classList.toggle("active"); // 'active' ক্লাস টoggle করো
    }
}

// ✅ মূল কনটেন্ট এরিয়ায় নতুন অংশ লোড করা
function loadContent(page) {
    let content = ""; // কনটেন্ট সংরক্ষণের জন্য ভ্যারিয়েবল

    // নির্বাচিত পেজের উপর ভিত্তি করে কনটেন্ট তৈরি করা
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
    // ✅ রুটিন সিস্টেমের নতুন কন্টেন্ট
    else if (page === "staff-routine") {
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Staff Routine</h2>
            <h3 class="login-instruction-heading">To view staff (teacher) routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="https://script.google.com/macros/s/AKfycbxAPcHNUgxmXlgnLjxqiO_QYr5VfVbXEfUjHEIHqih8q2lA7IkgZUtPwrAxGkTf-IxVtQ/exec?page=teacher" target="_blank" class="exam-link">VIEW STAFF ROUTINE</a>
            </div>
        `;
    }
    else if (page === "class-routine") {
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Class Routine</h2>
            <h3 class="login-instruction-heading">To view class (student) routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="https://script.google.com/macros/s/AKfycbxAPcHNUgxmXlgnLjxqiO_QYr5VfVbXEfUjHEIHqih8q2lA7IkgZUtPwrAxGkTf-IxVtQ/exec?page=student" target="_blank" class="exam-link">VIEW CLASS ROUTINE</a>
            </div>
        `;
    }
    else if (page === "subject-routine") {
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">Subject Routine</h2>
            <h3 class="login-instruction-heading">To view subject routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="https://script.google.com/macros/s/AKfycbxAPcHNUgxmXlgnLjxqiO_QYr5VfVbXEfUjHEIHqih8q2lA7IkgZUtPwrAxGkTf-IxVtQ/exec?page=subject" target="_blank" class="exam-link">VIEW SUBJECT ROUTINE</a>
            </div>
        `;
    }
    else if (page === "school-exam-routine") {
        content = `
            <div class="shaded-info-box">
            <h2 class="shine">School Exam Routine</h2>
            <h3 class="login-instruction-heading">To view Inter-school Examination Routine, please click the button below:<span class="emoji">👇</span></h3>
            <a href="https://script.google.com/macros/s/AKfycbykz5KNLXrqC4F_osm1EHD_Db1OUAjOiD-yeONI6WI6_CqYOBCimhWHUl0Wc1AmXXQ/exec" target="_blank" class="exam-link">VIEW EXAM ROUTINE</a>
            </div>
        `;
    }
    // রুটিন সিস্টেমের আগের কন্টেন্ট (যদি থাকে) আর প্রয়োজন নেই, কারণ এখন নতুন ভাবে লোড হবে।
    // এই ব্লকগুলো script.js থেকে সরিয়ে দিতে হবে: teacher-routine, student-routine, subject-routine, exam-routine

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
        // অন্য যেকোনো মেনু আইডির জন্য জেনেরিক কনটেন্ট
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

    mainContent.innerHTML = content; // মূল কনটেন্ট এরিয়াতে কনটেন্ট যোগ করো
    sidebar.classList.remove("open"); // কনটেন্ট লোড হওয়ার পর সাইডবার বন্ধ করো
    menuToggle.classList.remove("open-menu"); // আইকনের ঘোরানো বন্ধ করো
    mainContent.style.marginLeft = "25px"; // সাইডবার বন্ধ হলে মূল কনটেন্টের মার্জিন রিসেট
}

// ✅ ড্যাশবোর্ড শিরোনামে ক্লিক করলে ড্যাশবোর্ডকে পূর্বাবস্থায় ফেরানো
function resetDashboard() {
    mainContent.innerHTML = `
        <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
        <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;
    sidebar.classList.remove("open"); // সাইডবার বন্ধ করো
    menuToggle.classList.remove("open-menu"); // আইকনের ঘোরানো বন্ধ করো
    mainContent.style.marginLeft = "25px"; // সাইডবার বন্ধ হলে মূল কনটেন্টের মার্জিন রিসেট

    // সমস্ত সাবমেনু বন্ধ করে দেওয়া
    document.querySelectorAll(".submenu").forEach(submenu => {
        submenu.classList.remove("open");
    });
    // সমস্ত মেনু আইটেম থেকে 'active' ক্লাস সরানো
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });
}
