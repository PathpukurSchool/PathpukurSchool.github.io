// Global Constants
const CONSTANTS = {
    INDEX_LINK_JSON: 'index_link.json',
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyjes-oH2NNNl0mEIPOoYizfzP4QvKdR3y_ZM8F4qXNunoWRNie92sZqyjmg53ZTqTA/exec?action=read",
    NOTICES_PER_PAGE: 10,
    LOCAL_STORAGE_KEY: 'newStatusControl',
    SCHOOL_NAME: 'Pathpukur High School (HS)',
    NOTICE_SECTION_ID: 'help-list',
    STUDENTS_SECTION_ID: 'students-list',
    FORMS_SECTION_ID: 'forms-list',
};

// গ্লোবাল স্টেট ম্যানেজমেন্ট অবজেক্ট (সকল ডেটা ও স্টেট এক স্থানে)
const globalAppState = {
    // LocalStorage থেকে লোড করা বা ডিফল্ট NEW স্ট্যাটাস
    newStatusControl: {}, 
    // index_link.json থেকে লোড করা সমস্ত ডেটা (Students + Forms)
    dynamicItems: [], 
    // Google Sheet থেকে লোড করা Notices
    notices: [], 
    // Notices-এর জন্য পেজিনেশন স্টেট
    noticePage: { currentPage: 1, totalPages: 0 }, 
    // dynamicItems-এর জন্য পেজিনেশন স্টেট
    dynamicSectionsState: {
        [CONSTANTS.STUDENTS_SECTION_ID]: { data: [], currentPage: 1, totalPages: 0, linkType: 'url' },
        [CONSTANTS.FORMS_SECTION_ID]: { data: [], currentPage: 1, totalPages: 0, linkType: 'url' }
    },
    // index_link.json ডেটা একবার লোড হয়েছে কি না তার ফ্ল্যাগ
    isIndexDataLoaded: false,
};

// ===================================
// 🛠️ ইউটিলিটি ফাংশন (Utilities) 🛠️
// ===================================

/**
 * একটি কাস্টম বাটন তৈরি করে।
 */
function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    // ইনলাইন স্টাইল কমিয়ে ক্লাস বা স্টাইল ভেরিয়েবল ব্যবহারের পরামর্শ দেওয়া হয়
    btn.style.cssText = `
        padding: 8px 15px; margin: 0 5px;
        background-color: ${bgColor}; color: white;
        border: none; border-radius: 5px; cursor: pointer;
        opacity: ${disabled ? 0.6 : 1}; transition: opacity 0.3s;
    `;
    return btn;
}

/**
 * লোডিং বা এরর মেসেজের জন্য স্ট্যান্ডার্ড HTML বক্স তৈরি করে।
 */
function errorBox(title, message, isError = false) {
    let borderColor, bgColor, textColor;

    if (isError) {
        borderColor = '#ff9999'; 
        bgColor = '#ffe6e6';
        textColor = '#cc0000';
    } else if (title === "Loading...") {
        borderColor = '#6495ED'; 
        bgColor = '#E6F0FF';
        textColor = '#4169E1'; 
    } else { // Available Soon/No Data
        borderColor = '#FFD700'; 
        bgColor = '#FFFACD';
        textColor = '#B8860B'; 
    }
    
    return `
        <div style="
            border: 2px solid ${borderColor}; background-color: ${bgColor};
            color: ${textColor}; font-size: 18px; font-weight: bold;
            padding: 10px; border-radius: 8px; text-align: center;
            max-width: 320px; margin: 20px auto;
        ">
            <strong>${title}</strong><br>${message}
        </div>
    `;
}

// ============================================================
// 💾 NEW স্ট্যাটাস কন্ট্রোল এবং ডেটা লোড লজিক (LocalStorage ভিত্তিক) 💾
// ============================================================

/**
 * index_link.json থেকে ডেটা লোড করে এবং গ্লোবাল স্টেটে সেভ করে।
 * মেমোইজেশন ব্যবহার করা হয়েছে যাতে একবার লোড হলে আর কল না হয়।
 */
async function loadIndexData() {
    if (globalAppState.isIndexDataLoaded) {
        return globalAppState.dynamicItems;
    }
    try {
        const response = await fetch(CONSTANTS.INDEX_LINK_JSON);
        if (!response.ok) throw new Error('Failed to load config.');
        const data = await response.json();
        
        // Students এবং Forms ডেটা একসাথে করা
        const dynamicItems = [
            ...(data.students || []).map(item => ({ ...item, type: 'student' })),
            ...(data.forms || []).map(item => ({ ...item, type: 'form' }))
        ];
        
        globalAppState.dynamicItems = dynamicItems;
        globalAppState.dynamicSectionsState[CONSTANTS.STUDENTS_SECTION_ID].data = data.students || [];
        globalAppState.dynamicSectionsState[CONSTANTS.FORMS_SECTION_ID].data = data.forms || [];
        globalAppState.isIndexDataLoaded = true;

        return dynamicItems;

    } catch (error) {
        console.error("Failed to load index link data:", error);
        return [];
    }
}

/**
 * LocalStorage থেকে 'NEW' স্ট্যাটাস লোড করে বা ডিফল্ট থেকে ইনিসিয়ালাইজ করে।
 * @param {Array} baseData - index_link.json থেকে লোড করা Students এবং Forms ডেটা
 */
function initializeNewStatusControl(baseData) {
    const storedStatus = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY);
    let newStatusControl = storedStatus ? JSON.parse(storedStatus) : {};
    let statusChanged = false;

    // index_link.json-এর ডেটা দিয়ে LocalStorage আপডেট করা
    baseData.forEach(item => {
        // null/undefined Title এড়িয়ে যাওয়া
        const title = item.title;
        if (!title) return; 

        // যদি LocalStorage-এ না থাকে, তবে JSON থেকে ডিফল্ট নেওয়া হবে
        if (newStatusControl[title] === undefined) {
            newStatusControl[title] = item.isNew === true;
            statusChanged = true;
        }
    });
    
    globalAppState.newStatusControl = newStatusControl;

    // যদি নতুন কোনো আইটেম যোগ হয়, তবে LocalStorage-এ সেভ করা
    if (statusChanged) {
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(globalAppState.newStatusControl));
    }
}

// ===================================
// 📢 স্ক্রল বার (Marquee) রেন্ডারিং লজিক 📢
// ===================================

/**
 * NEW চিহ্নিত আইটেমগুলি দিয়ে স্ক্রল বার রেন্ডার করে।
 */
function renderMarquee() {
    const marqueeWrapper = document.getElementById('new-marquee-wrapper');
    const marqueeContainer = document.querySelector('.scrolling-line-container'); 

    if (!marqueeWrapper || !marqueeContainer) return;

    // Notices এবং Dynamic Items উভয় ডেটাকে একসাথে যোগ করা
    const allItems = [
        ...globalAppState.dynamicItems.map(item => ({ title: item.title, url: item.url })),
        ...globalAppState.notices.map(item => ({ title: item.text, url: item.link || '#' }))
    ].filter(item => item.title); // Title ছাড়া আইটেম বাদ দেওয়া

    // LocalStorage অনুযায়ী NEW চিহ্নিত আইটেমগুলি ফিল্টার করা
    const newItems = allItems.filter(item => {
        return globalAppState.newStatusControl[item.title] === true; 
    });

    let htmlContent = '';

    if (newItems.length > 0) {
        // NEW আইটেম থাকলে, সেই কন্টেন্ট তৈরি করা
        const newMarqueeItems = newItems.map(item => {
            // URL থাকলে, সেই URL ব্যবহার করে লিঙ্ক তৈরি করা
            const url = item.url && item.url.trim() !== '' ? item.url : '#'; 
            return `<a href="${url}" target="_blank" class="marquee-link">
                        <span class="new-badge blink">✨ NEW</span> ${item.title} 
                    </a>`;
        });
        
        // আইটেমগুলির মধ্যে সেপারেটর (|) যোগ করা
        const singleContent = newMarqueeItems.join(' <span class="marquee-separator">|</span> ');
        
        // কন্টেন্ট ডুপ্লিকেট করা (নির্দোষ স্ক্রলিং-এর জন্য)
        const space = ' <span style="padding: 0 80px;">| | |</span> ';
        htmlContent = singleContent + space + singleContent + space + singleContent;
        
    } else {
        // কোনো NEW আইটেম না থাকলে ডিফল্ট বার্তা
        const welcomeMessage = `🙏 Welcome to ${CONSTANTS.SCHOOL_NAME} Official Website 🙏`;
        htmlContent = `<div class="marquee-default-msg" style="width: max-content; padding-left: 100px;">${welcomeMessage}</div>`;
        // CSS-এ স্ক্রলিং বন্ধ করার জন্য একটি ক্লাস যোগ করা যেতে পারে
        marqueeContainer.classList.add('no-scroll'); 
    }

    marqueeWrapper.innerHTML = htmlContent;
}

// ====================================================
// 📥 নোটিস বোর্ড এবং ডাইনামিক সেকশন ডেটা ফেচিং 📥
// ====================================================

/**
 * Google Sheet থেকে Notices ডেটা লোড করে।
 */
async function fetchNotices() {
    const container = document.getElementById(CONSTANTS.NOTICE_SECTION_ID);
    if (container) {
        container.innerHTML = errorBox("Loading...", "Please wait...");
    }
    
    try {
        const response = await fetch(CONSTANTS.APPS_SCRIPT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const notices = Array.isArray(data.notices) ? data.notices.filter(n => n.text) : [];
        globalAppState.notices = notices;
        
        // LocalStorage আপডেট করার লজিক
        let updatedStatusControl = { ...globalAppState.newStatusControl };
        let statusChanged = false;

        notices.forEach(notice => {
            const title = notice.text;
            const isNewFromSheet = notice.isNew === true;
            
            // যদি LocalStorage-এ না থাকে, তবে Google Sheet এর স্ট্যাটাস নেওয়া হবে
            if (updatedStatusControl[title] === undefined) {
                updatedStatusControl[title] = isNewFromSheet;
                statusChanged = true;
            }
        });
        
        globalAppState.newStatusControl = updatedStatusControl; 
        
        if (statusChanged) {
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE_KEY, JSON.stringify(globalAppState.newStatusControl));
        }

        renderList(CONSTANTS.NOTICE_SECTION_ID);
        // Notices ডেটা লোড হওয়ার পরে Marquee রেন্ডার করা
        renderMarquee(); 
        updateMoreLessButton('important-links-section-notice'); 

    } catch (error) {
        console.error("Failed to fetch notices:", error);
        if (container) {
            container.innerHTML = errorBox("Error!", "Failed to load notices.", true);
        }
    }
}

/**
 * Students এবং Forms সেকশনের ডেটা লোড করে।
 * Note: এখন loadIndexData() কল করে গ্লোবাল স্টেট ব্যবহার করা হবে।
 */
async function fetchDynamicSectionData(sectionId) {
    const container = document.getElementById(sectionId);
    if (container) container.innerHTML = errorBox("Loading...", "Please wait...");
    
    try {
        // ডেটা লোড হবে (যদি না হয়ে থাকে) এবং গ্লোবাল স্টেটে সেভ হবে
        await loadIndexData(); 
        
        // গ্লোবাল স্টেট থেকে সংশ্লিষ্ট ডেটা নেওয়া 
        // ডেটা লোড করার লজিক initializeNewStatusControl-এ নিয়ে যাওয়া হয়েছে
        
        renderList(sectionId);

        const parentSectionId = sectionId.replace('-list', '-section');
        updateMoreLessButton(parentSectionId); 
        
        // Dynamic Data লোড হওয়ার পরে Marquee রেন্ডার করা
        renderMarquee(); 

    } catch (error) {
        console.error(`Failed to load data for ${sectionId}:`, error);
        if (container) {
            container.innerHTML = errorBox("Error!", `Failed to load data for ${sectionId}.`, true);
        }
    }
}

// ======================================================
// 🖥️ সাধারণ কন্টেন্ট ও পেজিনেশন রেন্ডারিং লজিক 🖥️
// ======================================================

/**
 * Notices, Students বা Forms-এর জন্য একটি সাধারণ রেন্ডারিং ফাংশন।
 */
function renderList(sectionId) {
    const container = document.getElementById(sectionId);
    if (!container) return console.error(`Error: '${sectionId}' container not found.`);

    let data, state, linkKey, clickHandler;
    
    if (sectionId === CONSTANTS.NOTICE_SECTION_ID) {
        data = globalAppState.notices;
        state = globalAppState.noticePage;
        linkKey = 'link';
        // Notices-এর জন্য পপ-আপ দেখানোর হ্যান্ডলার
        clickHandler = (item) => showPopup(item.text, item.date, item.link, item.subj);
    } else {
        state = globalAppState.dynamicSectionsState[sectionId];
        data = state.data;
        linkKey = 'url';
        // Students/Forms-এর জন্য সরাসরি লিঙ্ক খোলার হ্যান্ডলার
        clickHandler = (item, element) => {
            const linkUrl = item[linkKey];
            if (linkUrl && linkUrl.trim() !== '') {
                window.open(linkUrl, '_blank'); 
            } else {
                showAvailableSoonMessage(element); 
            }
        };
    }
    
    container.innerHTML = ""; 

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
        renderPaginationControls(sectionId); // ডেটা না থাকলে পেজিনেশন মুছে ফেলা
        return;
    }

    state.totalPages = Math.ceil(data.length / CONSTANTS.NOTICES_PER_PAGE);
    const startIndex = (state.currentPage - 1) * CONSTANTS.NOTICES_PER_PAGE;
    const endIndex = startIndex + CONSTANTS.NOTICES_PER_PAGE;
    const itemsToRender = data.slice(startIndex, endIndex);

    itemsToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        const titleText = item.text || item.title || "No Title";
        
        // LocalStorage-নিয়ন্ত্রিত গ্লোবাল অবজেক্ট থেকে স্ট্যাটাস পড়া
        const isItemNew = globalAppState.newStatusControl[titleText] === true; 
        
        let itemContent = titleText;
        if (sectionId === CONSTANTS.NOTICE_SECTION_ID) {
             itemContent += item.date ? ` [Date: ${item.date}]` : '';
        }

        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 
        
        // স্টাইলগুলি CSS-এ ক্লাস হিসেবে যোগ করার পরামর্শ দেওয়া হলো:
        itemDiv.className = 'list-item-style'; 
        itemDiv.onclick = () => clickHandler(item, itemDiv);
        itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
        itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
        
        container.appendChild(itemDiv);
    });

    renderPaginationControls(sectionId);
}

/**
 * পেজিনেশন কন্ট্রোল রেন্ডার করে।
 */
function renderPaginationControls(sectionId) {
    const paginationContainer = document.getElementById(sectionId === CONSTANTS.NOTICE_SECTION_ID ? 'pagination-controls' : sectionId.replace('-list', '-pagination'));
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    let state, renderFunction;
    if (sectionId === CONSTANTS.NOTICE_SECTION_ID) {
        state = globalAppState.noticePage;
        renderFunction = () => renderList(CONSTANTS.NOTICE_SECTION_ID);
    } else {
        state = globalAppState.dynamicSectionsState[sectionId];
        renderFunction = () => renderList(sectionId);
    }

    if (state.totalPages <= 1) return;

    const backBtn = createButton('BACK', '#007bff', () => {
        if (state.currentPage > 1) { 
            state.currentPage--; 
            renderFunction(); 
        }
    }, state.currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Page ${state.currentPage}/${state.totalPages}`;
    pageInfo.style.cssText = `margin: 0 10px; font-weight: bold;`;

    const nextBtn = createButton('NEXT', '#007bff', () => {
        if (state.currentPage < state.totalPages) { 
            state.currentPage++; 
            renderFunction(); 
        }
    }, state.currentPage === state.totalPages);

    paginationContainer.append(backBtn, pageInfo, nextBtn);
}


// অন্যান্য অপ্রয়োজনীয় ফাংশনগুলি সংক্ষেপিত করা হলো:

/**
 * More/Less বোতামের দৃশ্যমানতা আপডেট করে।
 */
function updateMoreLessButton(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const sectionContentWrapper = section.querySelector('.section-content-wrapper');
    const button = section.querySelector('.toggle-button');
    
    if (!sectionContentWrapper || !button) return;

    // DOM রেন্ডার হওয়ার জন্য অপেক্ষা
    setTimeout(() => {
        const hasOverflow = sectionContentWrapper.scrollHeight > sectionContentWrapper.clientHeight + 5; // ছোট মার্জিন যোগ করা হয়েছে
        button.style.display = hasOverflow ? 'block' : 'none';
        if (hasOverflow) {
            button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
        }
    }, 50); 
}

/**
 * Notices-এর জন্য পপ-আপ দেখায় (showPopup-এর লজিক অপরিবর্তিত রাখা হলো)।
 */
function showPopup(titleText, date, link, subjText) {
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    // CSS-এ সরানো উচিত
    overlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); z-index: 9998;`;
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    // CSS-এ সরানো উচিত
    popup.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-height: 90vh; overflow-y: auto; background: #f0f8ff; padding: 20px; border: 2px solid #333; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.7); z-index: 9999; text-align: center; max-width: 90%; min-width: 240px; font-family: Arial, sans-serif; pointer-events: auto;`;

    // স্কুলের নাম এবং নোটিস হেডিং যুক্ত করা
    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = `<strong>${CONSTANTS.SCHOOL_NAME}</strong><br>Notice Board`;
    schoolHeader.style.cssText = `color: darkgreen; background-color: #e6ffe6; font-size: 18px; font-weight: bold; margin-bottom: 10px; font-family: 'Times New Roman', serif;`;
    popup.appendChild(schoolHeader);

    // অন্যান্য পপ-আপ কন্টেন্ট (title, date, subject) এবং ডাউনলোড লজিক... (অপরিবর্তিত)
    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.style.cssText = `background-color: green; color: white; font-weight: bold; font-size: 15px; padding: 10px; border-radius: 5px; margin-bottom: 15px;`;
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
        subjElem.style.cssText = `color: darkgreen; background-color: #e6ffe6; font-weight: bold; font-size: 14px; padding: 6px; border-radius: 4px; margin-bottom: 12px;`;
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    buttonContainer.style.cssText = `margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;`;

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.style.cssText = `background-color: #007bff; color: white; padding: 6px 10px; border-radius: 5px; font-weight: bold; font-size: 12px; text-decoration: none;`;
        buttonContainer.appendChild(linkBtn);
    }
    
    // ডাউনলোড লজিক (html2canvas নির্ভর, লজিকটি অপরিবর্তিত রাখা হলো)
    // ডাউনলোড বোতাম তৈরির লজিক... 
    const downloadBtn = createButton('Download', '#28a745', () => {
        buttonContainer.style.visibility = 'hidden';
        const originalMaxHeight = popup.style.maxHeight;
        const originalOverflowY = popup.style.overflowY;

        popup.style.maxHeight = 'none';
        popup.style.overflowY = 'visible';

        setTimeout(() => {
            // html2canvas ফাংশনটি যেহেতু কোডে নেই, তাই ধরে নেওয়া হচ্ছে এটি গ্লোবালি উপলব্ধ
            // if (typeof html2canvas !== 'undefined') { 
                html2canvas(popup).then(canvas => {
                    let safeTitle = (titleText || "notice").replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "_");
                    let fileName = safeTitle + ".png";

                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL();
                    link.click();

                    popup.style.maxHeight = originalMaxHeight;
                    popup.style.overflowY = originalOverflowY;
                    buttonContainer.style.visibility = 'visible';
                });
            // } else {
            //     alert('html2canvas library is missing.');
            //     popup.style.maxHeight = originalMaxHeight;
            //     popup.style.overflowY = originalOverflowY;
            //     buttonContainer.style.visibility = 'visible';
            // }

        }, 50);
    });
    
    const closeBtn = createButton('Back', '#dc3545', () => overlay.remove()); 

    buttonContainer.append(downloadBtn, closeBtn);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup); 
}

/**
 * 'Available Soon' বার্তা দেখায়।
 */
function showAvailableSoonMessage(element) {
    const parentContainer = element.closest('.section-content-wrapper');
    if (parentContainer) {
        parentContainer.querySelectorAll('.avail-msg').forEach(msg => msg.remove());
    }

    const msg = document.createElement('div');
    msg.className = 'avail-msg';
    msg.textContent = '🔔 Available Soon! Please Wait. 🔔';
    // স্টাইলগুলিকে CSS-এ সরানো উচিত
    msg.style.cssText = `color: #FFFFFF; background-color: #E74C3C; border: 1px solid #C0392B; box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4); padding: 10px 15px; border-radius: 5px; font-weight: 600; font-size: 14px; text-align: center; margin: 10px auto; width: 80%; display: block; letter-spacing: 0.5px;`;
    
    element.after(msg); 
    
    setTimeout(() => msg.remove(), 3000);
}


// ==========================================================
// 🚀 DOMContentLoaded - ইভেন্ট লিসেনারের ভেতরের অপ্টিমাইজড অংশ 🚀
// ==========================================================

document.addEventListener('DOMContentLoaded', function () {
    
    // --- Hero Images Scrolling Logic --- (লজিক প্রায় অপরিবর্তিত, তবে আরও সুগঠিত)
    const heroImagesContainer = document.querySelector('.hero-images');

    if (heroImagesContainer) {
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
        
        // Manual Scroll Debounce
        let scrollTimeout;
        heroImagesContainer.addEventListener('scroll', function() {
            isManualScrolling = true;
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isManualScrolling = false;
                
                const scrollLeft = heroImagesContainer.scrollLeft;
                const imageWidth = heroImagesContainer.clientWidth;
                imageIndex = Math.round(scrollLeft / imageWidth);

                startAutoScroll(); 
            }, 300); // 300ms debounce

            // Manual scrolling-এর সময় Autoscroll বন্ধ রাখা
            if (scrollInterval) clearInterval(scrollInterval);
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
        
        // Initial Start
        startAutoScroll();
    } 

    // --- School Logo Right-Click Protection ---
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.addEventListener('contextmenu', event => event.preventDefault()); 
    }

    // --- More/Less Button Logic --- (অপরিবর্তিত)
    document.querySelectorAll('.toggle-button').forEach(button => {
        const sectionContentWrapper = button.previousElementSibling;
        if (sectionContentWrapper) {
            button.addEventListener('click', function() {
                sectionContentWrapper.classList.toggle('expanded');
                button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
            });
        }
    });

    // --- Menu & Gallery Logic --- (অপরিবর্তিত রাখা হলো)

    // Initial function calls (অপ্টিমাইজড লোড সিকোয়েন্স)
    loadIndexData()
        .then(data => {
            initializeNewStatusControl(data); // LocalStorage ইনিসিয়ালাইজ করা
        })
        .finally(() => {
            // ডেটা লোড হোক বা না হোক, রেন্ডারিং শুরু করা:
            fetchNotices();
            fetchDynamicSectionData(CONSTANTS.STUDENTS_SECTION_ID);
            fetchDynamicSectionData(CONSTANTS.FORMS_SECTION_ID);
            // Marquee-কে প্রথমবার রেন্ডার করার জন্য fetchDynamicSectionData/fetchNotices-এর ভেতরে কল করা হয়েছে।
        });
        
    // --- Escape Key Logic (Popup & Menu) --- (একত্রিত ও পরিচ্ছন্ন)
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            // 1. Popup বন্ধ করা
            const popupOverlay = document.getElementById('notice-popup-overlay');
            if (popupOverlay) {
                popupOverlay.remove();
                event.preventDefault(); 
            }
            
            // 2. Menu বন্ধ করা
            const sidebarMenu = document.getElementById('sidebar-menu');
            if (sidebarMenu && sidebarMenu.classList.contains('active')) {
                // toggleMenu ফাংশনটিকে উপরে গ্লোবালি ডিফাইন করা প্রয়োজন
                // বর্তমানে এটি DOMContentLoaded-এর বাইরে নেই, তাই লজিকটি এখানে রিপিট করা হলো
                if (sidebarMenu) sidebarMenu.classList.toggle('active');
                const overlay = document.querySelector('.overlay');
                if (overlay) overlay.classList.toggle('active');
                document.body.classList.toggle('no-scroll', sidebarMenu && sidebarMenu.classList.contains('active'));
                event.preventDefault();
            }
        }
    });
});
