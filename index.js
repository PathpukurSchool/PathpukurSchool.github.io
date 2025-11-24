/* =================================
 * NEW স্ট্যাটাস কন্ট্রোল লজিক (LocalStorage ভিত্তিক)
 * ================================= */

// গ্লোবাল ভেরিয়েবল: LocalStorage থেকে লোড করা হয়
let NEW_STATUS_CONTROL = {};
let ALL_ITEMS_DETAILS = [];

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
    const baseData = await loadAllItemDetails(); 
    const storedStatus = localStorage.getItem('newStatusControl');
    let newStatusControl = storedStatus ? JSON.parse(storedStatus) : {};

    baseData.forEach(item => {
        const title = item.title;
        // যদি LocalStorage এ না থাকে, তবে JSON থেকে ডিফল্ট নেওয়া হবে
        if (newStatusControl[title] === undefined) {
             newStatusControl[title] = item.isNew === true;
        }
    });
    
    NEW_STATUS_CONTROL = newStatusControl;
}

// ===================================
// ✅ নতুন: স্ক্রল বার রেন্ডারিং লজিক (গ্লোবাল)
// ===================================

function renderMainMarquee() { // ডান থেকে বাম দিকে চলমান (Students & Forms)
    const marqueeWrapper = document.getElementById('new-marquee-wrapper');
    if (!marqueeWrapper) return;

    // Students এবং Forms থেকে NEW status অনুযায়ী ফিল্টার
    const newItems = ALL_ITEMS_DETAILS.filter(item => NEW_STATUS_CONTROL[item.title] === true);

    let html = "";
    if (newItems.length > 0) {
        const main = newItems.map(item => {
            const url = item.url || "#";
            return `
                <a href="${url}" target="_blank" class="marquee-link">
                    <span class="new-badge blink">✨ NEW</span> ${item.title}
                </a>
            `;
        }).join('<span class="marquee-separator">|</span>');
        
        const gap = `<span class="marquee-gap"> &nbsp;&nbsp;&nbsp; | | | &nbsp;&nbsp;&nbsp; </span>`;
        html = main + gap + main + gap + main; // জাম্প-মুক্ত স্ক্রলিংয়ের জন্য
    } else {
        html = `<div class="marquee-default-msg">🙏 Welcome to our Official Website 🙏</div>`;
    }
    marqueeWrapper.innerHTML = html;
}

function renderNoticeMarquee() { // ✅ বাম থেকে ডান দিকে চলমান (Notices)
    const noticeMarqueeWrapper = document.getElementById('notice-marquee');
    if (!noticeMarqueeWrapper) return;

    // Notices (Helping) থেকে NEW status অনুযায়ী ফিল্টার
    const newNotices = Helping.filter(notice => NEW_STATUS_CONTROL[notice.text] === true).map(notice => ({
        title: notice.text,
        url: notice.link || '#'
    }));

    let html = "";
    if (newNotices.length > 0) {
        const main = newNotices.map(item => {
            const url = item.url || "#";
            return `
                <a href="${url}" target="_blank" class="marquee-link">
                    <span class="new-badge blink">🔔 NOTICE</span> ${item.title}
                </a>
            `;
        }).join('<span class="marquee-separator">|</span>');

        const gap = `<span class="marquee-gap"> &nbsp;&nbsp;&nbsp; | | | &nbsp;&nbsp;&nbsp; </span>`;
        html = main + gap + main + gap + main;
    } else {
        // যদি কোনো নতুন নোটিশ না থাকে, তবে Welcome বার্তা যোগ করা যেতে পারে, অথবা খালি রাখা যেতে পারে।
        // এখানে অন্য একটি ডিফল্ট বার্তা ব্যবহার করা হলো:
        html = `<div class="marquee-default-msg">🔔 Latest Notices are Available! 🔔</div>`;
    }
    noticeMarqueeWrapper.innerHTML = html;
}

/* =================================
 * Digital Notice Board Functions (গ্লোবাল)
 * ================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjes-oH2NNNl0mEIPOoYizfzP4QvKdR3y_ZM8F4qXNunoWRNie92sZqyjmg53ZTqTA/exec?action=read";
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
    let borderColor = '#ff9999'; // Error/Available Soon
    let bgColor = '#ffe6e6';
    let textColor = '#cc0000';
    
    if (title === "Loading...") {
        borderColor = '#6495ED'; // CornflowerBlue
        bgColor = '#E6F0FF';
        textColor = '#4169E1'; // RoyalBlue
    }
    
    return `
        <div style="
            border: 2px solid ${borderColor}; background-color: ${bgColor};
            color: ${textColor}; font-size: 18px; font-weight: bold;
            padding: 10px; border-radius: 8px; text-align: center;
            max-width: 320px; margin: 0 auto;
        ">
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
        // ⭐ নতুন কোড: নোটিসগুলির স্ট্যাটাস LocalStorage-এ যোগ করা ⭐
        let updatedStatusControl = { ...NEW_STATUS_CONTROL }; // বিদ্যমান স্ট্যাটাস কপি করা
        let statusChanged = false;

        Helping.forEach(notice => {
            const title = notice.text;
            const isNewFromSheet = notice.isNew === true; // Sheet থেকে আসা স্ট্যাটাস
            
            // যদি LocalStorage এ না থাকে, তবে Google Sheet এর স্ট্যাটাস নেওয়া হবে
            if (updatedStatusControl[title] === undefined) {
                updatedStatusControl[title] = isNewFromSheet;
                statusChanged = true;
            }
        });
        
        NEW_STATUS_CONTROL = updatedStatusControl; // গ্লোবাল অবজেক্ট আপডেট করা
        
        // যদি নতুন কোনো আইটেম যোগ হয়, তবে LocalStorage-এ সেভ করা
       if (statusChanged) {
            localStorage.setItem('newStatusControl', JSON.stringify(NEW_STATUS_CONTROL));
            renderMainMarquee(); // ⭐ নতুন: Students/Forms-এর জন্য
            renderNoticeMarquee(); // ⭐ নতুন: Notices-এর জন্য
        }
        // ⭐ নতুন কোড শেষ ⭐
        
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
    if (!container) return console.error("Error: 'help-list' container not found.");
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
        
        const titleText = item.text || "No Title";
        const dateText = item.date ? ` [Date: ${item.date}]` : '';  
        
        // LocalStorage-নিয়ন্ত্রিত গ্লোবাল অবজেক্ট থেকে স্ট্যাটাস পড়া
        const isItemNew = NEW_STATUS_CONTROL[titleText] === true; 
        
        let itemContent = titleText + dateText;  
        
        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 
        
        // [Notices স্টাইল]
        itemDiv.style.cssText = `
            cursor: pointer; margin: 10px 0; padding: 8px 10px;
            background-color: #f9f9f9; border-left: 6px solid #8B4513;
            border-radius: 4px; transition: background-color 0.3s;
            display: flex; justify-content: space-between; align-items: center;
        `;
        itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
        itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
        itemDiv.onclick = () => showPopup(item.text, item.date, item.link, item.subj);
        container.appendChild(itemDiv);
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const backBtn = createButton('BACK', '#007bff', () => {
        if (currentPage > 1) { currentPage--; renderHelpList(); }
    }, currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Page ${currentPage}/${totalPages}`;
    pageInfo.style.cssText = `margin: 0 10px; font-weight: bold;`;

    const nextBtn = createButton('NEXT', '#007bff', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);

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
        const titleText = item.title || "No Title";
        const linkUrl = item.url || '';
        
        // LocalStorage-নিয়ন্ত্রিত গ্লোবাল অবজেক্ট থেকে স্ট্যাটাস পড়া
        const isItemNew = NEW_STATUS_CONTROL[titleText] === true;
        
        let itemContent = titleText;

        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 

        // [Notices সেকশনের স্টাইল]
        itemDiv.style.cssText = `
            cursor: pointer; margin: 10px 0; padding: 8px 10px;
            background-color: #f9f9f9; border-left: 6px solid #8B4513;
            border-radius: 4px; transition: background-color 0.3s;
            display: flex; justify-content: space-between; align-items: center;
        `;
        itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
        itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
        
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

    const backBtn = createButton('BACK', '#007bff', () => {
        if (state.currentPage > 1) { 
            state.currentPage--; 
            renderDynamicList(sectionId); 
        }
    }, state.currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Page ${state.currentPage}/${state.totalPages}`;
    pageInfo.style.cssText = `margin: 0 10px; font-weight: bold;`;

    const nextBtn = createButton('NEXT', '#007bff', () => {
        if (state.currentPage < state.totalPages) { 
            state.currentPage++; 
            renderDynamicList(sectionId); 
        }
    }, state.currentPage === state.totalPages);

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
    msg.style.cssText = `
        color: #FFFFFF;
        background-color: #E74C3C;
        border: 1px solid #C0392B;
        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
        padding: 10px 15px;
        border-radius: 5px; 
        font-weight: 600;
        font-size: 14px;
        text-align: center;
        margin: 10px auto; 
        width: 80%;
        display: block;
        letter-spacing: 0.5px;
    `;
    
    element.after(msg); 
    
    setTimeout(() => msg.remove(), 3000);
}

/* =================================
 * Utility Functions (গ্লোবাল)
 * ================================= */

function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    btn.style.cssText = `
        padding: 8px 15px; margin: 0 5px;
        background-color: ${bgColor}; color: white;
        border: none; border-radius: 5px; cursor: pointer;
        opacity: ${disabled ? 0.6 : 1}; transition: opacity 0.3s;
    `;
    return btn;
}

// [Notices সেকশনের জন্য প্রয়োজনীয় showPopup ফাংশন, ডাউনলোড বাটন সহ]
function showPopup(titleText, date, link, subjText) {
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    // ✅ নতুন: ওভারলে তৈরি করা (২ নম্বর পরিবর্তন)
    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 9998;
    `;
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    popup.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        max-height: 90vh; overflow-y: auto; 
        background: #f0f8ff; padding: 20px; border: 2px solid #333;
        border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.7);
        z-index: 9999; text-align: center; max-width: 90%; 
        min-width: 240px; 
        font-family: Arial, sans-serif;
        pointer-events: auto;
    `;

    // ✅ নতুন: স্কুলের নাম এবং নোটিস হেডিং যুক্ত করা (১ নম্বর পরিবর্তন)
    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = '<strong>Pathpukur High School (HS)</strong><br>Notice Board';
    schoolHeader.style.cssText = `
       color: darkgreen; background-color: #e6ffe6;
       font-size: 18px; font-weight: bold; margin-bottom: 10px;
       font-family: 'Times New Roman', serif;
    `;
    popup.appendChild(schoolHeader);

    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.style.cssText = `
        background-color: green; color: white; font-weight: bold;
        font-size: 15px; padding: 10px; border-radius: 5px; margin-bottom: 15px;
    `;
    popup.appendChild(titleElem);

    if (date && date.trim() !== '') {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        dateElem.style.marginBottom = '10px';
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.style.cssText = `
            color: darkgreen; background-color: #e6ffe6;
            font-weight: bold; font-size: 14px; padding: 6px;
            border-radius: 4px; margin-bottom: 12px;
        `;
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons'; // ✅ ক্লাস যুক্ত করা হয়েছে
    buttonContainer.style.cssText = `
        margin-top: 20px; display: flex; flex-wrap: wrap;
        justify-content: center; gap: 10px;
    `;

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.style.cssText = `
            background-color: #007bff; color: white; padding: 6px 10px;
            border-radius: 5px; font-weight: bold; font-size: 12px;
            text-decoration: none;
        `;
        buttonContainer.appendChild(linkBtn);
    }

 // 🌟 পরিবর্তন ২: ডাউনলোড লজিক আপডেট (সম্পূর্ণ ফিক্স)
const downloadBtn = createButton('Download', '#28a745', () => {

    // Download শুরু হলে বোতামগুলো লুকানো
    buttonContainer.style.visibility = 'hidden';

    // ⭐⭐ Capture এর আগে popup-এর height overflow ঠিক করা ⭐⭐
    const originalMaxHeight = popup.style.maxHeight;
    const originalOverflowY = popup.style.overflowY;

    // popup কে সম্পূর্ণ উচ্চতায় আনা
    popup.style.maxHeight = 'none';
    popup.style.overflowY = 'visible';

    // 50ms delay → Browser কে style apply করার সময় দেওয়া
    setTimeout(() => {

        html2canvas(popup).then(canvas => {

            // ⭐⭐ নতুন: Title থেকে File Name তৈরি ⭐⭐
            let safeTitle = (titleText || "notice")
                .replace(/[\\/:*?"<>|]+/g, "")   // ❌ ফাইল নাম নিষিদ্ধ ক্যারেক্টার remove
                .trim()
                .replace(/\s+/g, "_");          // space → underscore
            
            let fileName = safeTitle + ".png";

            const link = document.createElement('a');
            link.download = fileName;   // ⭐ ফাইল নাম সেট করা ⭐
            link.href = canvas.toDataURL();
            link.click();

            // ⭐⭐ capture শেষ হলে আগের অবস্থায় ফেরত ⭐⭐
            popup.style.maxHeight = originalMaxHeight;
            popup.style.overflowY = originalOverflowY;
            buttonContainer.style.visibility = 'visible';
        });

    }, 50);
});

    const closeBtn = createButton('Back', '#dc3545', () => overlay.remove()); // ২ নম্বর পরিবর্তন

    buttonContainer.append(downloadBtn, closeBtn);
    popup.appendChild(buttonContainer);
    // document.body.appendChild(popup); // এই লাইনটি মুছে দেওয়া হয়েছে
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

// ✅ নতুন: মোবাইলের ব্যাক বোতাম (Escape Key) দিয়ে পপ-আপ বন্ধ করার লজিক
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
    fetchNotices();
    fetchDynamicSectionData('students-list');
    fetchDynamicSectionData('forms-list');

    // ✅ স্ক্রল বার লোড করা
    renderMainMarquee(); // ⭐ নতুন ফাংশন কল
    renderNoticeMarquee(); // ⭐ নতুন ফাংশন কল
    });
});
