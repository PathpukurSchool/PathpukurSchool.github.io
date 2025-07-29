
// ✅ DOM এলিমেন্টগুলো সিলেক্ট করা
const menuToggle = document.getElementById("menu-toggle"); // মেনু টগল বাটন
const sidebar = document.getElementById("sidebar");       // সাইডবার
const mainContent = document.getElementById("main-content"); // মূল কনটেন্ট এরিয়া

// ✅ মেনু টগল বাটন ক্লিক করলে সাইডবার খোলা/বন্ধ করা
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open"); // 'open' ক্লাস যোগ/অপসারণ করে সাইডবার খোলে/বন্ধ করে
});

// ✅ সাইডবারের বাইরে ক্লিক করলে মেনু বন্ধ হবে
document.addEventListener("click", (event) => {
    // যদি ক্লিক সাইডবারের ভিতরে না হয় এবং টগল বাটনেও না হয়
    if (!sidebar.contains(event.target) && event.target !== menuToggle) {
        sidebar.classList.remove("open"); // সাইডবার বন্ধ করো
    }
});

// ✅ মেনু আইটেম ক্লিক করলে সাবমেনু টগল করা এবং অন্য সাবমেনু বন্ধ করা
function toggleMenu(element) {
    const allMenuItems = document.querySelectorAll(".menu-item"); // সমস্ত মেনু আইটেম সিলেক্ট করো

    allMenuItems.forEach(item => {
        // যদি বর্তমান ক্লিক করা আইটেমটি না হয় এবং তাতে 'active' ক্লাস থাকে
        if (item !== element && item.classList.contains("active")) {
            item.classList.remove("active"); // 'active' ক্লাস সরাও
            const submenu = item.querySelector(".submenu");
            if (submenu) {
                submenu.style.display = "none"; // সাবমেনু লুকানো
            }
        }
    });

    // বর্তমান ক্লিক করা মেনু আইটেমের সাবমেনু খুঁজে বের করো
    const submenu = element.querySelector(".submenu");
    if (submenu) {
        const isVisible = submenu.style.display === "block"; // সাবমেনু কি দৃশ্যমান?
        submenu.style.display = isVisible ? "none" : "block"; // যদি দৃশ্যমান হয়, লুকানো; না হলে দেখানো
        element.classList.toggle("active", !isVisible); // 'active' ক্লাস যোগ/অপসারণ
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
    } else {
        // অন্য ক্লাস বা রিপোর্ট সম্পর্কিত কনটেন্ট
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
}

// ✅ ড্যাশবোর্ড শিরোনামে ক্লিক করলে ড্যাশবোর্ডকে পূর্বাবস্থায় ফেরানো
function resetDashboard() {
    mainContent.innerHTML = `
        <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
        <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;
    sidebar.classList.remove("open"); // সাইডবার বন্ধ করো
    // সমস্ত সাবমেনু বন্ধ করে দেওয়া
    document.querySelectorAll(".submenu").forEach(submenu => {
        submenu.style.display = "none";
    });
    // সমস্ত মেনু আইটেম থেকে 'active' ক্লাস সরানো
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });
}
