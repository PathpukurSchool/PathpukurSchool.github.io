// ===================================
    // ✅ URL লোডিং ফাংশন
// ===================================

// ১. JSON ফাইল থেকে সব URL লোড করা হবে।
// ২. HTML-এ প্রতিটি বোতাম (যাদের class="exam-link") খুঁজে বের করা হবে।
// ৩. প্রতিটি বোতামের id অনুযায়ী JSON থেকে URL পাওয়া যাবে।
// ৪. সেই URL বোতামের href এ বসানো হবে।
// ৫. ক্লিক করলে একই ট্যাবে (target="_self") খুলবে।

document.addEventListener("DOMContentLoaded", () => {
    // JSON ফাইল লোড করা
    fetch("home_url.json")
        .then(response => response.json())
        .then(data => {
            // সব exam-link বোতাম খুঁজে বের করা
            document.querySelectorAll(".exam-link").forEach(button => {
                const id = button.id;   // প্রতিটি বোতামের id
                if (data[id]) {         // JSON-এ সেই id এর url আছে কিনা
                    button.setAttribute("href", data[id]);   // url সেট করা
                    button.setAttribute("target", "_self");  // একই ট্যাবে ওপেন হবে
                } else {
    // যদি URL না থাকে, তাহলে href অ্যাট্রিবিউট সেট করুন
    button.setAttribute("href", "#");
    // একটি নতুন এলিমেন্ট তৈরি করা
    const message = document.createElement('div');
    message.className = 'avail-msg';
    message.textContent = '(🔔 Available Soon 🔔)';
    
    // নতুন এলিমেন্টটি বোতামের পরেই যোগ করা
    button.parentNode.insertBefore(message, button.nextSibling);

// 3 সেকেন্ড পরে মেসেজটি মুছে ফেল
    setTimeout(() => {
        message.remove();
    }, 3000);
}
            });
        })
        .catch(error => console.error("Error loading URLs:", error));
});


// ===================================
// ✅ নম্বর আপলোডের শেষ তারিখ এর জাভা স্ক্রিপ্ট
// ===================================

    // Apps Script Web App এর URL এখানে দিন
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcYA8sdD__TgIe-mHKE9n1fabVv_pDFam1K59O9FdD13r5rVcg5_Mf005mcAWsa6xjA/exec';

const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

// Google Apps Script থেকে ডেটা লোড করা
async function loadExamDates() {
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=get_github_data`);
    const data = await response.json();
    
    if (data && data.data) {
      examDatesMarquee.innerHTML = ''; // পুরোনো ডেটা মুছে নতুন করে যোগ করো
      
      const formattedData = data.data.map(item => {
        const span = document.createElement("span");
        span.textContent = item.text;
        span.style.color = item.color;
        return span.outerHTML;
      }).join(', ');
      
      const fullSpan = document.createElement("span");
      fullSpan.innerHTML = formattedData;
      examDatesMarquee.appendChild(fullSpan);
    }
  } catch (error) {
    console.error('Error loading exam dates:', error);
    // যদি ডেটা লোড করতে সমস্যা হয়, একটি বার্তা দেখাও
    examDatesMarquee.textContent = 'No exam dates available.';
  }
}

// Initial load
loadExamDates();

// Mouse hover করলে স্ক্রল থামানো
examDatesMarquee.addEventListener("mouseover", () => {
  examDatesMarquee.style.animationPlayState = 'paused';
});
examDatesMarquee.addEventListener("mouseout", () => {
  examDatesMarquee.style.animationPlayState = 'running';
});

// মোবাইলে touch করলে স্ক্রল থামানো
examDatesMarquee.addEventListener("touchstart", () => {
  examDatesMarquee.style.animationPlayState = 'paused';
});
examDatesMarquee.addEventListener("touchend", () => {
  examDatesMarquee.style.animationPlayState = 'running';
});



