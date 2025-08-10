// এই কোডটি জাভাস্ক্রিপ্ট ফাইল master.js
// বর্তমানে এটি শুধুমাত্র মেনু এবং সাবমেনু ব্যবস্থাপনার জন্য ব্যবহৃত হচ্ছে।

document.addEventListener('DOMContentLoaded', function() {
    // মেনু আইটেমগুলিতে ক্লিক করলে ড্রপডাউন সাবমেনু দেখানোর জন্য এই কোড ব্যবহার করা যেতে পারে
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(event) {
            // ড্রপডাউন সাবমেনু আছে কিনা পরীক্ষা করা হচ্ছে
            const submenu = this.querySelector('.submenu');
            if (submenu) {
                // ডিফল্ট লিংকের আচরণ বন্ধ করা হচ্ছে যাতে শুধুমাত্র সাবমেনু দেখায়
                event.preventDefault();
                // সাবমেনুর অবস্থা টগল করা হচ্ছে
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });

    // ওয়েব পেজের যেকোনো ফাঁকা অংশে ক্লিক করলে সাবমেনু লুকিয়ে ফেলার জন্য
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-item')) {
            document.querySelectorAll('.submenu').forEach(submenu => {
                submenu.style.display = 'none';
            });
        }
    });

    // এই অংশে আরও জাভাস্ক্রিপ্ট কোড যুক্ত করা যাবে যদি প্রয়োজন হয়
    // যেমন: ডেটা লোড করা, লগইন ফর্ম পরিচালনা করা ইত্যাদি
});

document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function(event) {
            const submenu = this.querySelector('.submenu');
            if (submenu) {
                event.preventDefault();
                // অন্য সকল সাবমেনু লুকিয়ে ফেলা হচ্ছে
                document.querySelectorAll('.submenu').forEach(sub => {
                    if (sub !== submenu) {
                        sub.style.display = 'none';
                    }
                });
                // বর্তমান সাবমেনুর অবস্থা টগল করা হচ্ছে
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-item')) {
            document.querySelectorAll('.submenu').forEach(submenu => {
                submenu.style.display = 'none';
            });
        }
    });
});
