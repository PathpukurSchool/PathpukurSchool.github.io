// DOMContentLoaded ইভেন্ট নিশ্চিত করে যে HTML ডকুমেন্ট পুরোপুরি লোড হওয়ার পর জাভাস্ক্রিপ্ট কোড রান করবে।
document.addEventListener('DOMContentLoaded', () => {
    // প্রয়োজনীয় HTML উপাদানগুলো JavaScript ভেরিয়েবলে ধরে রাখা হয়েছে আইডি ব্যবহার করে।
    const menuToggle = document.getElementById('menuToggle'); // মেনু টগল বাটন
    const sidebar = document.getElementById('sidebar'); // বাম পাশের সাইডবার
    const dashboardContent = document.getElementById('dashboardContent'); // ড্যাশবোর্ডের প্রধান কন্টেন্ট এলাকা
    const dashboardTitle = document.getElementById('dashboardTitle'); // ড্যাশবোর্ডের শিরোনাম
    const contentArea = document.getElementById('contentArea'); // কন্টেন্ট প্রদর্শনের জন্য ফাঁকা স্থান

    // 1. সাইডবার টগল কার্যকারিতা (মেনু বাটন ক্লিক করলে সাইডবার খোলা বা বন্ধ হবে)
    menuToggle.addEventListener('click', () => {
        // 'sidebar' এ 'active' ক্লাস টগল করা হয়।
        // CSS এ, 'active' ক্লাস সাইডবারকে দৃশ্যমান করে (left: 0)।
        sidebar.classList.toggle('active');
        // 'dashboardContent' এ 'shifted' ক্লাস টগল করা হয়।
        // CSS এ, 'shifted' ক্লাস ড্যাশবোর্ড কন্টেন্টকে ডানদিকে সরায় যখন সাইডবার খোলা থাকে (বড় স্ক্রিনে)।
        dashboardContent.classList.toggle('shifted');
    });

    // 2. মেনু এবং সাবমেনু ক্লিক হ্যান্ডলিং
    // '.menu-item.has-submenu > a' সিলেক্ট করে, অর্থাৎ যে মেনু আইটেমগুলির সাবমেনু আছে তাদের মূল লিঙ্ক।
    const menuItems = document.querySelectorAll('.menu-item.has-submenu > a');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // মূল লিঙ্কের ডিফল্ট আচরণ বন্ধ করা হয়েছে যাতে পেজ রিলোড না হয়।
            const parentLi = item.parentElement; // ক্লিক করা লিঙ্কের প্যারেন্ট <li> এলিমেন্ট
            const submenu = parentLi.querySelector('.submenu'); // সংশ্লিষ্ট সাবমেনু (<ul>)

            // একই স্তরের অন্যান্য খোলা সাবমেনু বন্ধ করা
            menuItems.forEach(otherItem => {
                const otherParentLi = otherItem.parentElement;
                // যদি অন্য কোনো মেনু আইটেম সক্রিয় থাকে এবং সেটি বর্তমান আইটেম না হয়
                if (otherParentLi !== parentLi && otherParentLi.classList.contains('active')) {
                    otherParentLi.classList.remove('active'); // 'active' ক্লাস সরানো হয়েছে
                    otherParentLi.querySelector('.submenu').classList.remove('open'); // 'open' ক্লাস সরানো হয়েছে (সাবমেনু বন্ধ)
                }
            });

            // বর্তমান সাবমেনু টগল করা (খোলা বা বন্ধ করা)
            parentLi.classList.toggle('active'); // <li> তে 'active' ক্লাস যোগ/সরানো
            submenu.classList.toggle('open'); // সাবমেনুতে 'open' ক্লাস যোগ/সরানো (CSS দ্বারা max-height পরিবর্তন করে)
        });
    });

    // 3. উপ-সাবমেনু ক্লিক হ্যান্ডলিং (সাবমেনুর ভেতরের সাবমেনু)
    // '.submenu-item.has-submenu > a' সিলেক্ট করা হয়েছে।
    const submenuItems = document.querySelectorAll('.submenu-item.has-submenu > a');
    submenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // ডিফল্ট আচরণ বন্ধ করা হয়েছে
            const parentLi = item.parentElement; // ক্লিক করা লিঙ্কের প্যারেন্ট <li> এলিমেন্ট
            const subSubmenu = parentLi.querySelector('.sub-submenu'); // সংশ্লিষ্ট উপ-সাবমেনু

            // একই স্তরের অন্যান্য খোলা উপ-সাবমেনু বন্ধ করা
            submenuItems.forEach(otherItem => {
                const otherParentLi = otherItem.parentElement;
                if (otherParentLi !== parentLi && otherParentLi.classList.contains('active')) {
                    otherParentLi.classList.remove('active');
                    otherParentLi.querySelector('.sub-submenu').classList.remove('open');
                }
            });

            // বর্তমান উপ-সাবমেনু টগল করা
            parentLi.classList.toggle('active');
            subSubmenu.classList.toggle('open');
        });
    });

    // 4. কন্টেন্ট লোড করা যখন চূড়ান্ত মেনু/সাবমেনু আইটেমে ক্লিক করা হয়
    // যে লিঙ্কগুলিতে 'data-content-id' অ্যাট্রিবিউট আছে, সেগুলিকে নির্বাচন করা হয়েছে।
    document.querySelectorAll('.menu a[data-content-id]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // ডিফল্ট আচরণ বন্ধ করা হয়েছে।
            const contentId = e.currentTarget.dataset.contentId; // 'data-content-id' অ্যাট্রিবিউটের মান নেওয়া হয়েছে।
            loadContent(contentId); // এই ফাংশনটি কন্টেন্ট লোড করবে।

            // ছোট স্ক্রিনে কন্টেন্ট লোড হওয়ার পর সাইডবার বন্ধ করা
            if (window.innerWidth <= 768) { // যদি স্ক্রিনের প্রস্থ 768px বা তার কম হয়
                sidebar.classList.remove('active'); // সাইডবার বন্ধ করা হয়েছে
                dashboardContent.classList.remove('shifted'); // ড্যাশবোর্ড কন্টেন্ট তার আসল অবস্থানে ফিরে আসবে
            }

            // সকল খোলা সাবমেনু/উপ-সাবমেনু বন্ধ করা হয়েছে
            document.querySelectorAll('.submenu.open, .sub-submenu.open').forEach(openMenu => {
                openMenu.classList.remove('open');
            });
            // সকল 'active' ক্লাস সরানো হয়েছে যা মেনু আইটেমগুলির খোলা অবস্থা নির্দেশ করে
            document.querySelectorAll('.menu-item.active, .submenu-item.active').forEach(activeItem => {
                activeItem.classList.remove('active');
            });
        });
    });

    // 5. ড্যাশবোর্ড শিরোনামে ক্লিক করলে প্রাথমিক অবস্থায় ফিরে যাবে
    dashboardTitle.addEventListener('click', () => {
        // 'contentArea' এর ভেতরের HTML প্রাথমিক কন্টেন্টে পরিবর্তন করা হয়েছে।
        contentArea.innerHTML = `
            <p>স্বাগতম! ড্যাশবোর্ডে আপনি বিভিন্ন অপশন দেখতে পাবেন। বাম পাশের মেনু থেকে আপনার প্রয়োজনীয় কাজটি নির্বাচন করুন।</p>
        `;
        dashboardTitle.textContent = 'ড্যাশবোর্ড'; // শিরোনাম 'ড্যাশবোর্ড' এ ফিরে যাবে।

        // সকল খোলা সাবমেনু বন্ধ করা হয়েছে
        document.querySelectorAll('.submenu.open, .sub-submenu.open').forEach(openMenu => {
            openMenu.classList.remove('open');
        });
        document.querySelectorAll('.menu-item.active, .submenu-item.active').forEach(activeItem => {
            activeItem.classList.remove('active');
        });
    });

    // 6. কন্টেন্ট লোড করার ফাংশন
    // 'contentId' এর উপর ভিত্তি করে 'contentArea' এ নির্দিষ্ট কন্টেন্ট লোড করে।
    function loadContent(contentId) {
        let content = ''; // কন্টেন্ট রাখার জন্য ভেরিয়েবল
        let title = ''; // শিরোনাম রাখার জন্য ভেরিয়েবল

        // 'contentId' এর মান অনুযায়ী কন্টেন্ট এবং শিরোনাম নির্ধারণ করা হয়েছে।
        switch (contentId) {
            case 'dashboard-home':
                title = 'ড্যাশবোর্ড';
                content = '<p>স্বাগতম! ড্যাশবোর্ডে আপনি বিভিন্ন অপশন দেখতে পাবেন। বাম পাশের মেনু থেকে আপনার প্রয়োজনীয় কাজটি নির্বাচন করুন।</p>';
                break;
            case 'marks-class5-exam1':
                title = 'ক্লাস V - ১ম পরীক্ষা মার্কস';
                content = `
                    <h3>ক্লাস V - ১ম পরীক্ষা মার্কস আপলোড</h3>
                    <p>এখানে ক্লাস V-এর ১ম পরীক্ষার মার্কস আপলোড করার ফর্ম বা টেবিল থাকবে।</p>
                    <form>
                        <label for="studentName">ছাত্রের নাম:</label><br>
                        <input type="text" id="studentName" name="studentName" placeholder="ছাত্রের নাম লিখুন"><br><br>
                        <label for="marks">প্রাপ্ত নম্বর:</label><br>
                        <input type="number" id="marks" name="marks" placeholder="নম্বর লিখুন" min="0" max="100"><br><br>
                        <button type="submit" class="btn-submit">আপলোড করুন</button>
                    </form>
                `;
                break;
            case 'marks-class5-exam2':
                title = 'ক্লাস V - ২য় পরীক্ষা মার্কস';
                content = `
                    <h3>ক্লাস V - ২য় পরীক্ষা মার্কস আপলোড</h3>
                    <p>এখানে ক্লাস V-এর ২য় পরীক্ষার মার্কস আপলোড করার ফর্ম বা টেবিল থাকবে।</p>
                    `;
                break;
            case 'marks-class5-exam3':
                title = 'ক্লাস V - ৩য় পরীক্ষা মার্কস';
                content = `
                    <h3>ক্লাস V - ৩য় পরীক্ষা মার্কস আপলোড</h3>
                    <p>এখানে ক্লাস V-এর ৩য় পরীক্ষার মার্কস আপলোড করার ফর্ম বা টেবিল থাকবে।</p>
                    `;
                break;
            case 'marks-class6-exam1':
                title = 'ক্লাস VI - ১ম পরীক্ষা মার্কস';
                content = `
                    <h3>ক্লাস VI - ১ম পরীক্ষা মার্কস আপলোড</h3>
                    <p>এখানে ক্লাস VI-এর ১ম পরীক্ষার মার্কস আপলোড করার ফর্ম বা টেবিল থাকবে।</p>
                    `;
                break;
            //
            // অন্যান্য ক্লাস (ক্লাস VII থেকে ক্লাস XII) এবং তাদের পরীক্ষার জন্য অনুরূপ 'case' ব্লক যোগ করুন।
            // প্রতিটি 'data-content-id' এর জন্য একটি নতুন 'case' যোগ করতে হবে এবং এর মধ্যে HTML কন্টেন্ট দিতে হবে।
            //
            case 'marks-class12-exam3':
                title = 'ক্লাস XII - ৩য় পরীক্ষা মার্কস';
                content = `
                    <h3>ক্লাস XII - ৩য় পরীক্ষা মার্কস আপলোড</h3>
                    <p>এখানে ক্লাস XII-এর ৩য় পরীক্ষার মার্কস আপলোড করার ফর্ম বা টেবিল থাকবে।</p>
                    `;
                break;
            case 'upload-student-notice':
                title = 'ছাত্র বিজ্ঞপ্তি আপলোড';
                content = `
                    <h3>নতুন ছাত্র বিজ্ঞপ্তি আপলোড করুন</h3>
                    <p>এখানে নতুন বিজ্ঞপ্তি লেখার এবং আপলোড করার জন্য একটি টেক্সট এডিটর বা ফর্ম থাকবে।</p>
                    <textarea placeholder="আপনার বিজ্ঞপ্তি লিখুন..." rows="10" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"></textarea><br><br>
                    <button type="submit" class="btn-submit">বিজ্ঞপ্তি আপলোড করুন</button>
                `;
                break;
            case 'teachers-info':
                title = 'শিক্ষকদের তথ্য';
                content = `
                    <h3>শিক্ষকদের বিস্তারিত তথ্য</h3>
                    <p>এখানে স্কুলের সকল শিক্ষকের তালিকা এবং তাদের বিস্তারিত তথ্য প্রদর্শিত হবে।</p>
                    <ul>
                        <li>শিক্ষক ১: বিষয় - বাংলা</li>
                        <li>শিক্ষক ২: বিষয় - ইংরেজি</li>
                        <li>শিক্ষক ৩: বিষয় - গণিত</li>
                        </ul>
                `;
                break;
            default: // যদি কোনো নির্দিষ্ট 'contentId' না পাওয়া যায়
                title = 'পৃষ্ঠা খুঁজে পাওয়া যায়নি';
                content = '<p>দুঃখিত, এই কন্টেন্টটি এখনো তৈরি হয়নি।</p>';
        }

        dashboardTitle.textContent = title; // ড্যাশবোর্ড শিরোনাম আপডেট করা হয়েছে।
        contentArea.innerHTML = content; // 'contentArea' এর ভেতরের HTML নতুন কন্টেন্ট দ্বারা প্রতিস্থাপন করা হয়েছে।
    }

    // 7. পেজ লোড হওয়ার সময় প্রাথমিক কন্টেন্ট লোড করা
    loadContent('dashboard-home'); // যখন পেজ লোড হবে, তখন 'ড্যাশবোর্ড হোম' কন্টেন্ট দেখানো হবে।
});
