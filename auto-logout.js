// ====================================================================
// ⏱️ 15-Minute Inactivity Auto-Logout & Session Redirect System
// ====================================================================

(function () {
    // ১৫ মিনিট = ১৫ * ৬০ * ১০০০০ মিলি সেকেন্ড
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 
    const REDIRECT_URL = "https://pathpukurschool.github.io/";

    // ১. ইউজার অ্যাক্টিভ হলে লাস্ট অ্যাক্টিভিটি টাইম আপডেট করা
    function resetInactivityTimer() {
        localStorage.setItem('lastActivityTime', Date.now().toString());
    }

    // ২. অ্যাক্টিভিটি চেক ও লগআউট লজিক
    function checkInactivityAndLogout() {
        const isLoggedIn = sessionStorage.getItem("teacherLoggedIn") === "true";
        const lastActivity = localStorage.getItem('lastActivityTime');
        const currentTime = Date.now();

        // সেশন না থাকলে বা নির্দিষ্ট সময় নিষ্ক্রিয় থাকলে রিডাইরেক্ট করবে
        if (!isLoggedIn || (lastActivity && (currentTime - parseInt(lastActivity, 10)) >= INACTIVITY_TIMEOUT)) {
            sessionStorage.clear();
            localStorage.removeItem('lastActivityTime'); // ক্লিনআপ
            window.location.replace(REDIRECT_URL);
        }
    }

    // ৩. ইউজারের বিভিন্ন অ্যাক্টিভিটি (Touch, Mouse, Keyboard, Scroll) ট্র্যাক করা
    const activityEvents = [
        'mousemove', 'mousedown', 'keydown', 'keypress', 
        'scroll', 'touchstart', 'touchmove', 'click'
    ];

    activityEvents.forEach(eventType => {
        document.addEventListener(eventType, resetInactivityTimer, { passive: true });
    });

    // ৪. ব্রাউজার ট্যাব আবার দেখা হলে বা ফোকাস পেলে চেক করা
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            checkInactivityAndLogout();
        }
    });

    window.addEventListener('focus', checkInactivityAndLogout);

    // ৫. প্রতি ৩০ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে ইনঅ্যাক্টিভিটি চেক করা
    setInterval(checkInactivityAndLogout, 30000);

    // ৬. পেজ লোড হওয়ার পর প্রারম্ভিক চেক ও টাইমার স্টার্ট
    resetInactivityTimer();
    checkInactivityAndLogout();
})();
