
document.addEventListener('DOMContentLoaded', () => {
    // DOM উপাদানগুলি ক্যাশ করুন যাতে বারবার খুঁজতে না হয়
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content'); // কন্টেন্ট এরিয়া উপাদানটি ক্যাশ করা হলো

    // সাইডবার লুকানোর জন্য একটি ফাংশন
    const hideSidebar = () => {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    };

    // মেনু আইকন এবং সাইডবার আছে কিনা তা নিশ্চিত করা
    if (menuIcon && sidebar) {
        // মেনু আইকনে ক্লিক করলে সাইডবার টগল হবে
        menuIcon.addEventListener('click', (event) => {
            sidebar.classList.toggle('active');
            event.stopPropagation(); // ক্লিক ইভেন্টকে ডকুমেন্ট.বডিতে ছড়ানো থেকে বন্ধ করা
        });

        // সাইডবারের বাইরে ক্লিক করলে সাইডবার লুকানো হবে
        document.body.addEventListener('click', (event) => {
            // ক্লিকটি সাইডবারের বাইরে এবং মেনু আইকনে নয়, তা নিশ্চিত করা
            if (!sidebar.contains(event.target) && !menuIcon.contains(event.target)) {
                hideSidebar();
            }
        });

        // স্ক্রল করার সময় সাইডবার লুকানো হবে (পারফরম্যান্সের জন্য থ্রটল করা হয়েছে)
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout); // আগের টাইমআউটটি বাতিল করা
            // 100ms এর মধ্যে স্ক্রল বন্ধ না হলে সাইডবার লুকানো হবে
            scrollTimeout = setTimeout(hideSidebar, 100); // প্রয়োজন অনুযায়ী সময় পরিবর্তন করা যেতে পারে
        });

        // সাইডবারের ভিতরে ক্লিক করলে সাইডবার বন্ধ হবে না
        sidebar.addEventListener('click', (event) => {
            event.stopPropagation(); // সাইডবারের ভিতরের ক্লিক ইভেন্টকে ছড়ানো থেকে বন্ধ করা
        });
    }

    // --- সাবমেনু এবং সাব-সাবমেনু টগলিং ---
    // নেস্টেড মেনু টগল করার জন্য সাধারণ ফাংশন
    const toggleNestedMenu = (menuElement, allMenuSelector, arrowElement) => {
        // বর্তমানে খোলা অন্য যেকোনো মেনু বন্ধ করা
        document.querySelectorAll(allMenuSelector).forEach(menu => {
            if (menu !== menuElement) {
                menu.style.display = 'none';
                // অন্য মেনুর সাথে যুক্ত অ্যারো থেকে 'rotate-down' ক্লাস সরিয়ে দেওয়া
                const associatedArrow = menu.previousElementSibling?.querySelector('.arrow');
                if (associatedArrow) {
                    associatedArrow.classList.remove('rotate-down');
                }
            }
        });

        // বর্তমান মেনুটি টগল করা (যদি খোলা থাকে তো বন্ধ, বন্ধ থাকলে খোলা)
        menuElement.style.display = (menuElement.style.display === 'block') ? 'none' : 'block';

        // অ্যারো ঘোরানোর লজিক
        if (arrowElement) {
            // বর্তমান অ্যারো ছাড়া অন্য সকল অ্যারো থেকে 'rotate-down' ক্লাস সরিয়ে দেওয়া
            document.querySelectorAll('.arrow').forEach(arrow => {
                if (arrow !== arrowElement) {
                    arrow.classList.remove('rotate-down');
                }
            });
            // বর্তমান অ্যারো টগল করা
            arrowElement.classList.toggle('rotate-down');
        }
    };

    // সাবমেনু টগল করার জন্য গ্লোবাল ফাংশন
    window.toggleSubmenu = function(id, element) {
        const submenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (submenu && arrow) {
            toggleNestedMenu(submenu, '.submenu', arrow);
        }
    };

    // উপমেনু (সাব-সাবমেনু) টগল করার জন্য গ্লোবাল ফাংশন
    window.toggleSubsubmenu = function(id, element) {
        const subsubmenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (subsubmenu && arrow) {
            toggleNestedMenu(subsubmenu, '.subsubmenu', arrow);
        }
    };

    // --- কন্টেন্ট লোডিং ফাংশন ---
    // কন্টেন্ট লোড এবং সাইডবার লুকানোর জন্য পুনরায় ব্যবহারযোগ্য ফাংশন
    const loadContentAndHideSidebar = (htmlContent) => {
        if (contentArea) {
            // কন্টেন্ট এরিয়ার বর্তমান ক্লাস থেকে 'animated' সরানো
            contentArea.classList.remove('animated');
            // DOM রিফ্লোর্সের জন্য ছোট ডিলে যোগ করা (অ্যানিমেশন পুনরায় চালানোর জন্য)
            void contentArea.offsetWidth; // এই লাইনটি রিফ্লোর্স ট্রিগার করে
            contentArea.innerHTML = htmlContent; // কন্টেন্ট এরিয়াতে HTML ইনজেক্ট করা
            // অ্যানিমেশন পুনরায় যোগ করা
            contentArea.classList.add('animated');
        }
        hideSidebar(); // কন্টেন্ট লোড হওয়ার পর সাইডবার লুকিয়ে দেওয়া
    };

    // ড্যাশবোর্ড কন্টেন্ট লোড করার জন্য গ্লোবাল ফাংশন
    window.loadDashboard = function() {
        const dashboardHtml = `<h2 class="animated">ড্যাশবোর্ডে স্বাগতম</h2><p>এখানে আপনার কন্টেন্ট লোড হবে।</p>`;
        loadContentAndHideSidebar(dashboardHtml);
    };

    // সাধারণ কন্টেন্ট লোড করার জন্য গ্লোবাল ফাংশন
    window.loadContent = function(text) {
        const contentHtml = `<h2 class="animated" style="color:#0066cc">${text}</h2><p>${text} এর কন্টেন্ট এখানে লোড হবে।</p>`;
        loadContentAndHideSidebar(contentHtml);
    };
});
