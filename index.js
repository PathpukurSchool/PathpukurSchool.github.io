/* =================================
 * NEW স্ট্যাটাস কন্ট্রোল লজিক (LocalStorage ভিত্তিক)
 * ================================= */

// গ্লোবাল ভেরিয়েবল: LocalStorage থেকে লোড করা হয়
let NEW_STATUS_CONTROL = {};
let ALL_ITEMS_DETAILS = [];
const LOCAL_STORAGE_KEY = 'newStatusControl'; // LocalStorage-এর জন্য নতুন ধ্রুবক যোগ করা হলো

// JSON থেকে শুধুমাত্র আইটেমের Title সংগ্রহ করে
async function loadAllItemDetails() {
    try {
        const response = await fetch('index_link.json');
        if (!response.ok) throw new Error('Failed to load config.');
        const data = await response.json();
        
        // Students এবং Forms ডেটা একসাথে করা
        const dynamicItems = [...(data.students || []), ...(data.forms || [])];
        
        ALL_ITEMS_DETAILS = dynamicItems; // সমস্ত ডেটা সেভ করা
        return dynamicItems;

    } catch (error) {
        console.error("Failed to load all item details for marquee:", error);
        return [];
    }
}

// LocalStorage থেকে বা ডিফল্ট থেকে 'NEW' স্ট্যাটাস লোড করার লজিক
async function initializeNewStatusControl() {
    // 1. Students ও Forms-এর ডেটা লোড করা
    const baseData = await loadAllItemDetails(); 
    
    // 2. Notices-এর ডেটা লোড করা (Google Sheet থেকে)
    let noticesData = [];
    try {
        const noticeResponse = await fetch(APPS_SCRIPT_URL);
        if (noticeResponse.ok) {
            const data = await noticeResponse.json();
            noticesData = Array.isArray(data.notices) ? data.notices : [];
        }
    } catch (error) {
        console.error("Failed to fetch notices for initial status control:", error);
    }

    // LocalStorage থেকে পূর্বের স্ট্যাটাস লোড করা
    const storedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
    let newStatusControl = storedStatus ? JSON.parse(storedStatus) : {};
    
    const allItems = [...baseData, ...noticesData]; // সমস্ত ডেটা একত্রিত করা

    // ✅ পরিবর্তন: NEW স্ট্যাটাস নিয়ন্ত্রণ লজিক
    // এখন LocalStorage-এর মানকে অগ্রাধিকার দেওয়া হবে। যদি LocalStorage-এ কোনো মান না থাকে:
    // - Notices (Google Sheet) থেকে আসা `isNew` (যদি থাকে) ব্যবহার করা হবে।
    // - Students/Forms (index_link.json)-এর জন্য `isNew` প্রপার্টি না থাকলে ডিফল্ট `false` হবে।

    allItems.forEach(item => {
        const title = item.text || item.title; 
        if (title) {
            // যদি LocalStorage-এ এই আইটেমের স্ট্যাটাস না থাকে, তবে ডিফল্ট মান সেট করা হবে।
            if (newStatusControl[title] === undefined) {
                 // Notices-এর ক্ষেত্রে, isNew: true/false আসবে।
                 // Students/Forms-এর ক্ষেত্রে, index_link.json থেকে isNew সরিয়ে দেওয়ায়, item.isNew হবে undefined, 
                 // ফলে item.isNew === true হবে false। এটিই আমাদের প্রয়োজন।
                 newStatusControl[title] = item.isNew === true; 
            }
        }
    });
    
    NEW_STATUS_CONTROL = newStatusControl;
    // গ্লোবাল ভেরিয়েবল আপডেট করার সাথে সাথে LocalStorage-এও সেভ করা
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(NEW_STATUS_CONTROL));
}

// ===================================
// ✅ নতুন: স্ক্রল বার (Marquee) রেন্ডারিং লজিক (গ্লোবাল) - সংশোধিত
// ===================================

function renderMarquee() {
    // HTML-এর আইডি 'new-marquee-wrapper' এখন কন্টেন্ট রাখবে
    const marqueeWrapper = document.getElementById('new-marquee-wrapper');
    const marqueeContainer = document.querySelector('.scrolling-line-container'); 

    if (!marqueeWrapper || !marqueeContainer) return;

    // 1. LocalStorage অনুযায়ী NEW চিহ্নিত আইটেমগুলি ফিল্টার করা
    const newItems = ALL_ITEMS_DETAILS.filter(item => {
        const title = item.title;
        return NEW_STATUS_CONTROL[title] === true; 
    });

    let htmlContent = '';

    if (newItems.length > 0) {
        // 2. NEW আইটেম থাকলে, সেই কন্টেন্ট তৈরি করা
        const newMarqueeItems = newItems.map(item => {
            const title = item.title;
            const url = item.url || '#';
            
            // প্রতিটি আইটেমকে লিঙ্ক সহ যুক্ত করা
            return `<a href="${url}" target="_blank" class="marquee-link">
                        <span class="new-badge blink">✨ NEW</span> ${title} 
                    </a>`;
        });
        
        // আইটেমগুলির মধ্যে সেপারেটর (|) যোগ করা
        const singleContent = newMarqueeItems.join(' <span class="marquee-separator">|</span> ');
        
        // 3. ✅ মূল ফিক্স: কন্টেন্ট ডুপ্লিকেট করা
        // স্ক্রলিংটি জাম্প-মুক্ত করার জন্য একই কন্টেন্ট দুবার যোগ করা হলো।
        // মাঝখানে একটি বড় সেপারেটর যোগ করা হলো, যাতে দুটি সেটের মধ্যে দূরত্ব থাকে।
        const space = ' <span class="marquee-spacer">| | |</span> ';
        htmlContent = singleContent + space + singleContent + space + singleContent;
        
    } else {
        // 4. কোনো NEW আইটেম না থাকলে ডিফল্ট বার্তা
        const welcomeMessage = "🙏 Welcome to our Official Website 🙏";
        htmlContent = `<div class="marquee-default-msg">${welcomeMessage}</div>`;
        // ডিফল্ট মেসেজের জন্য স্ক্রলিং দরকার নেই, তাই এটি wrapper-এর মধ্যেই থাকবে।
    }

    // 5. কন্টেইনারে কন্টেন্ট ইনজেক্ট করা
    marqueeWrapper.innerHTML = htmlContent;
}

/* =================================
 * Digital Notice Board Functions (গ্লোবাল)
 * ================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsMTAcwAwgo-bvbYAQYe2YbU02zLdGxnt0EBlJclW1LvlIzGG5NME690uQz1fGMK56Xw/exec?action=read";
const NOTICES_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;
let Helping = []; // Notices ডেটা

// Students এবং Forms সেকশনের ডেটা ও পেজিনেশন স্টেট রাখার জন্য অবজেক্ট
const dynamicSectionsState = {
    'students-list': { data: [], currentPage: 1, totalPages: 0, },
    'forms-list': { data: [], currentPage: 1, totalPages: 0, }
};

function errorBox(title, message) {
    let boxClass = '';
    
    if (title === "Loading...") {
        boxClass = 'loading-box';
    } else {
        boxClass = 'error-box';
    }
    
    return `
        <div class="info-box ${boxClass}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
}

async function fetchNotices() {
    const container = document.getElementById('help-list');
    if (container) {
        container.innerHTML = errorBox("Loading...", "Please wait...");
    }
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        Helping = Array.isArray(data.notices) ? data.notices : [];
        currentPage = 1; 
        
        renderHelpList();
        updateMoreLessButton('important-links-section-notice'); 
    } catch (error) {
        console.error("Failed to fetch notices:", error);
        const container = document.getElementById('help-list');
        if (container) {
            container.innerHTML = errorBox("Error!", "Failed to load notices.");
        }
    }
}

function renderHelpList() {
    const container = document.getElementById('help-list');
    if (!container) return;
    container.innerHTML = ""; 

    if (!Array.isArray(Helping) || Helping.length === 0) {
        container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
        return;
    }

    totalPages = Math.ceil(Helping.length / NOTICES_PER_PAGE);
    const startIndex = (currentPage - 1) * NOTICES_PER_PAGE;
    const endIndex = startIndex + NOTICES_PER_PAGE;
    const noticesToRender = Helping.slice(startIndex, endIndex);

    noticesToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('notice-item'); 
        
        const titleText = item.text || "No Title";
        const dateText = item.date ? ` [Date: ${item.date}]` : '';  
        
        // ✅ ফিক্স: সরাসরি Apps Script থেকে আসা 'isNew' প্রপার্টি ব্যবহার করা
        // এখানে item.isNew হলো Apps Script-এর পাঠানো সেই Boolean মান
        const isItemNew = (item.isNew === true); 
        
        let itemContent = titleText + dateText;  
        
        // ✅ যদি শিটে Yes থাকে, তবেই এই ব্যাজটি যোগ হবে
        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 
        
        itemDiv.onmouseover = () => itemDiv.classList.add('hover');
        itemDiv.onmouseout = () => itemDiv.classList.remove('hover');
        itemDiv.onclick = () => showPopup(item.text, item.date, item.link, item.subj);
        container.appendChild(itemDiv);
    });

    renderPaginationControls();

    const noticeSection = document.getElementById('important-links-section-notice'); 
    
    if (noticeSection) {
        // সেকশনটিকে স্ক্রিনের উপরে নিয়ে যাওয়ার জন্য স্ক্রল করুন
        noticeSection.scrollIntoView({
            behavior: 'smooth', // স্মুথ স্ক্রলিং এর জন্য
            block: 'start'       // সেকশনটি স্ক্রিনের উপরে (start) দেখানোর জন্য
        });
    }
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;
    
    paginationContainer.classList.add('pagination-controls'); // নতুন ক্লাস যোগ করা হয়েছে

    const backBtn = createButton('BACK', () => {
        if (currentPage > 1) { currentPage--; renderHelpList(); }
    }, currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.classList.add('page-info'); // নতুন ক্লাস যোগ করা হয়েছে
    pageInfo.innerText = `Page ${currentPage}/${totalPages}`;

    const nextBtn = createButton('NEXT', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);
    
    backBtn.classList.add('pagination-btn');
    nextBtn.classList.add('pagination-btn');


    paginationContainer.append(backBtn, pageInfo, nextBtn);
}
// [Notices সেকশনের কোড শেষ]

/* =================================
 * Students & Forms Section (গ্লোবাল)
 * ================================= */

async function fetchDynamicSectionData(sectionId) {
    const container = document.getElementById(sectionId);
    const dataKey = sectionId === 'students-list' ? 'students' : 'forms'; 
    const state = dynamicSectionsState[sectionId];
    
    try {
        const response = await fetch('index_link.json'); 
        if (!response.ok) throw new Error('Failed to load configuration.');
        const data = await response.json();
        
        state.data = Array.isArray(data[dataKey]) ? data[dataKey] : [];
        state.currentPage = 1;
        
        renderDynamicList(sectionId);
        const parentSectionId = sectionId.replace('-list', '-section');
        updateMoreLessButton(parentSectionId); 

    } catch (error) {
        console.error(`Failed to fetch data for ${sectionId}:`, error);
        if (container) {
            container.innerHTML = errorBox("Error!", `Failed to load ${dataKey} links.`);
        }
    }
}

function renderDynamicList(sectionId) {
    const state = dynamicSectionsState[sectionId];
    const container = document.getElementById(sectionId);
    const paginationContainer = document.getElementById(sectionId.replace('-list', '-pagination')); 

    if (!container) return;
    container.innerHTML = "";
    if (paginationContainer) paginationContainer.innerHTML = '';

    if (!Array.isArray(state.data) || state.data.length === 0) {
        container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
        return;
    }

    state.totalPages = Math.ceil(state.data.length / NOTICES_PER_PAGE);
    const startIndex = (state.currentPage - 1) * NOTICES_PER_PAGE;
    const endIndex = startIndex + NOTICES_PER_PAGE;
    const itemsToRender = state.data.slice(startIndex, endIndex);

    itemsToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('notice-item'); // [Notices সেকশনের স্টাইল ক্লাস]
        
        const titleText = item.title || "No Title";
        const linkUrl = item.url || '';
        
        // LocalStorage-নিয়ন্ত্রিত গ্লোবাল অবজেক্ট থেকে স্ট্যাটাস পড়া
        const isItemNew = NEW_STATUS_CONTROL[titleText] === true;
        
        let itemContent = titleText;

        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 

        itemDiv.onmouseover = () => itemDiv.classList.add('hover');
        itemDiv.onmouseout = () => itemDiv.classList.remove('hover');
        
        // [Students ও Forms সেকশনের জন্য সরাসরি লিংক ওপেন করার লজিক]
        itemDiv.onclick = () => {
            if (linkUrl && linkUrl.trim() !== '') {
                window.open(linkUrl, '_blank'); 
            } else {
                showAvailableSoonMessage(itemDiv); 
            }
        };
        container.appendChild(itemDiv);
    });

    renderDynamicPagination(sectionId);
}
 
function renderDynamicPagination(sectionId) {
    const state = dynamicSectionsState[sectionId];
    const paginationContainer = document.getElementById(sectionId.replace('-list', '-pagination'));
    
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (state.totalPages <= 1) return;
    
    paginationContainer.classList.add('pagination-controls'); // নতুন ক্লাস যোগ করা হয়েছে


    const backBtn = createButton('BACK', () => {
        if (state.currentPage > 1) { 
            state.currentPage--; 
            renderDynamicList(sectionId); 
        }
    }, state.currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.classList.add('page-info'); // নতুন ক্লাস যোগ করা হয়েছে
    pageInfo.innerText = `Page ${state.currentPage}/${state.totalPages}`;

    const nextBtn = createButton('NEXT', () => {
        if (state.currentPage < state.totalPages) { 
            state.currentPage++; 
            renderDynamicList(sectionId); 
        }
    }, state.currentPage === state.totalPages);
    
    backBtn.classList.add('pagination-btn');
    nextBtn.classList.add('pagination-btn');


    paginationContainer.append(backBtn, pageInfo, nextBtn);
}

function showAvailableSoonMessage(element) {
    const parentContainer = element.closest('.section-content-wrapper');
    if (parentContainer) {
        const existingMessages = parentContainer.querySelectorAll('.avail-msg');
        existingMessages.forEach(msg => msg.remove());
    }

    const msg = document.createElement('div');
    msg.className = 'avail-msg';
    msg.textContent = '🔔 Available Soon! Please Wait. 🔔';
    
    element.after(msg); 
    
    setTimeout(() => msg.remove(), 3000);
}

/* =================================
 * Utility Functions (গ্লোবাল)
 * ================================= */

function createButton(text, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    btn.classList.add('custom-button'); // নতুন ক্লাস যোগ করা হয়েছে
    if (disabled) {
        btn.classList.add('disabled');
    }
    return btn;
}

// [Notices সেকশনের জন্য প্রয়োজনীয় showPopup ফাংশন, ডাউনলোড বাটন সহ]
function showPopup(titleText, date, link, subjText) {
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    // ✅ নতুন: ওভারলে তৈরি করা (২ নম্বর পরিবর্তন)
    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    // CSS ক্লাস যুক্ত করা হয়েছে
    popup.classList.add('notice-popup-box'); 

    // ✅ নতুন: স্কুলের নাম এবং নোটিস হেডিং যুক্ত করা (১ নম্বর পরিবর্তন)
    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = '<strong>Pathpukur High School (HS)</strong><br>Notice Board';
    schoolHeader.classList.add('school-header'); // CSS ক্লাস যুক্ত করা হয়েছে
    popup.appendChild(schoolHeader);

    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.classList.add('notice-title'); // CSS ক্লাস যুক্ত করা হয়েছে
    popup.appendChild(titleElem);

    if (date && date.trim() !== '') {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        dateElem.classList.add('notice-date'); // CSS ক্লাস যুক্ত করা হয়েছে
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.classList.add('notice-subject'); // CSS ক্লাস যুক্ত করা হয়েছে
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons'; // ✅ ক্লাস যুক্ত করা হয়েছে
    popup.appendChild(buttonContainer);

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.classList.add('popup-link-btn'); // CSS ক্লাস যুক্ত করা হয়েছে
        buttonContainer.appendChild(linkBtn);
    }

// 🌟 পরিবর্তন ২: ডাউনলোড লজিক আপডেট (সম্পূর্ণ ফিক্স)
const downloadBtn = createButton('Download', () => {

    // Download শুরু হলে বোতামগুলো লুকানো
    buttonContainer.style.visibility = 'hidden';
    downloadBtn.classList.add('download-btn'); // স্টাইল করার জন্য

    // ⭐⭐ Capture এর আগে popup-এর height overflow ঠিক করা ⭐⭐
    const originalMaxHeight = popup.style.maxHeight;
    const originalOverflowY = popup.style.overflowY;

    // popup কে সম্পূর্ণ উচ্চতায় আনা
    popup.style.maxHeight = 'none';
    popup.style.overflowY = 'visible';

    // 50ms delay → Browser কে style apply করার সময় দেওয়া
    setTimeout(() => {

        html2canvas(popup).then(canvas => {

            // ⭐⭐ নতুন: Title থেকে File Name তৈরি ⭐⭐
            let safeTitle = (titleText || "notice")
                .replace(/[\\/:*?"<>|]+/g, "")    // ❌ ফাইল নাম নিষিদ্ধ ক্যারেক্টার remove
                .trim()
                .replace(/\s+/g, "_");         // space → underscore
            
            let fileName = safeTitle + ".png";

            const link = document.createElement('a');
            link.download = fileName;    // ⭐ ফাইল নাম সেট করা ⭐
            link.href = canvas.toDataURL();
            link.click();

            // ⭐⭐ capture শেষ হলে আগের অবস্থায় ফেরত ⭐⭐
            popup.style.maxHeight = originalMaxHeight;
            popup.style.overflowY = originalOverflowY;
            buttonContainer.style.visibility = 'visible';
        });

    }, 50);
});

    const closeBtn = createButton('Back', () => overlay.remove()); // ২ নম্বর পরিবর্তন
    closeBtn.classList.add('close-btn'); // স্টাইল করার জন্য

    buttonContainer.append(downloadBtn, closeBtn);
    overlay.appendChild(popup); // ✅ পপ-আপকে ওভারলের ভিতরে যুক্ত করা হয়েছে
}
// [Popup function logic end]

// ডাইনামিক কন্টেন্ট লোড হওয়ার পর More/Less বোতাম চেক করার জন্য ফাংশন
function updateMoreLessButton(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const sectionContentWrapper = section.querySelector('.section-content-wrapper');
    const button = section.querySelector('.toggle-button');
    
    if (!sectionContentWrapper || !button) return;

    setTimeout(() => {
        if (sectionContentWrapper.scrollHeight <= sectionContentWrapper.clientHeight) {
            button.style.display = 'none';
        } else {
            button.style.display = 'block'; 
            button.textContent = 'More...'; 
            sectionContentWrapper.classList.remove('expanded'); 
        }
    }, 50); 
}
// [Popup function logic end]

// ✅ নতুন: মোবাইলের ব্যাক বোতাম (Escape Key) দিয়ে পপ-আপ বন্ধ করার লজিক
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const popupOverlay = document.getElementById('notice-popup-overlay');
        if (popupOverlay) {
            popupOverlay.remove();
            event.preventDefault(); // ব্রাউজারের ডিফল্ট আচরণ বন্ধ করা
        }
    }
});

/* =================================
 * DOMContentLoaded - ইভেন্ট লিসেনারের ভেতরের অংশ
 * ================================= */

document.addEventListener('DOMContentLoaded', function () {

    /* =================================
     * হিরো সেকশনের ছবি স্ক্রলিং এর জন্য সংশোধিত কোড
     * ================================= */
    const heroImagesContainer = document.querySelector('.hero-images');

    if (heroImagesContainer) {
        // এই ভেরিয়েবলগুলিকে অবশ্যই if ব্লকের ভিতরে সংজ্ঞায়িত করতে হবে
        const totalImages = heroImagesContainer.querySelectorAll('.hero-image').length;
        let imageIndex = 0;
        let scrollInterval;
        const scrollDuration = 4000; 
        let isManualScrolling = false;

        function startAutoScroll() {
            if (scrollInterval) clearInterval(scrollInterval);
            
            scrollInterval = setInterval(() => {
                if (isManualScrolling) return; 
                
                imageIndex = (imageIndex + 1) % totalImages;
                const scrollDistance = imageIndex * heroImagesContainer.clientWidth;
                
                heroImagesContainer.scrollTo({
                    left: scrollDistance,
                    behavior: 'smooth'
                });

            }, scrollDuration);
        }
        
        heroImagesContainer.addEventListener('scroll', function() {
            isManualScrolling = true;
            
            clearTimeout(heroImagesContainer.scrollTimeout);
            heroImagesContainer.scrollTimeout = setTimeout(() => {
                isManualScrolling = false;
                
                const scrollLeft = heroImagesContainer.scrollLeft;
                const imageWidth = heroImagesContainer.clientWidth;
                imageIndex = Math.round(scrollLeft / imageWidth);

                startAutoScroll(); 
            }, 300); 
        });

        const heroSection = heroImagesContainer.closest('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', function() {
                if (scrollInterval) clearInterval(scrollInterval);
            });

            heroSection.addEventListener('mouseleave', function() {
                if (!isManualScrolling) {
                    startAutoScroll();
                }
            });
        }

        startAutoScroll();
    } 

    /* =================================
     * স্কুল লোগো কে সুরক্ষিত রাখার জন্য সংশোধিত কোড
     * ================================= */

    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // রাইট-ক্লিক মেনু ব্লক করা হলো
        });
    }

    /* =================================
     * Other UI Logic (More/Less, Menu, Gallery etc.)
     * ================================= */

    // --- More/Less Button Logic (EventListener বজায় রাখা হলো) ---
    const toggleButtons = document.querySelectorAll('.toggle-button');
    toggleButtons.forEach(button => {
        const sectionContentWrapper = button.previousElementSibling;
        button.addEventListener('click', function() {
            if (sectionContentWrapper) {
                sectionContentWrapper.classList.toggle('expanded');
                button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
            }
        });
    });

    // --- Menu Bar Logic (অপরিবর্তিত) ---
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.querySelector('.overlay');

    function toggleMenu() {
        if (sidebarMenu) sidebarMenu.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll', sidebarMenu && sidebarMenu.classList.contains('active'));
    }

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', event => {
            event.stopPropagation();
            toggleMenu();
        });
    }

    if (sidebarMenu) {
        sidebarMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', event => {
                toggleMenu();
                const href = link.getAttribute('href');
                sidebarMenu.querySelectorAll('a').forEach(otherLink => otherLink.classList.remove('active-link'));
                link.classList.add('active-link');
                if (href && href.startsWith('#')) {
                    event.preventDefault();
                    const targetSection = document.getElementById(href.substring(1));
                    if (targetSection) {
                        const approximateHeaderHeight = 400;
                        window.scrollTo({
                            top: targetSection.offsetTop - approximateHeaderHeight,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            if (sidebarMenu && sidebarMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && sidebarMenu && sidebarMenu.classList.contains('active')) {
            toggleMenu();
        }
    });

    // --- Gallery Fullscreen Logic (অপরিবর্তিত) ---
    const galleryImages = document.querySelectorAll('.gallery-image');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const fullscreenImage = document.getElementById('fullscreen-image');

    if (galleryImages.length > 0 && fullscreenOverlay && fullscreenImage) {
        galleryImages.forEach(image => {
            image.addEventListener('click', () => {
                const imageUrl = image.getAttribute('data-src') || image.src;
                if (imageUrl) {
                    fullscreenImage.src = imageUrl;
                    fullscreenOverlay.classList.add('active');
                }
            });
        });

        fullscreenOverlay.addEventListener('click', () => {
            fullscreenOverlay.classList.remove('active');
            fullscreenImage.src = '';
            document.body.style.overflow = '';
        });
    }


   // Initial function calls
initializeNewStatusControl().then(() => {
    // LocalStorage লোড হওয়ার পর ডেটা লোড এবং UI রেন্ডার শুরু হবে
    fetchNotices(); // Notices লোড হচ্ছে
    fetchDynamicSectionData('students-list'); // Students লোড হচ্ছে
    fetchDynamicSectionData('forms-list'); // Forms লোড হচ্ছে
    
    // ✅ স্ক্রল বার লোড করা
    renderMarquee(); 
});
});
