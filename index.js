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

// গ্লোবাল স্টেট ম্যানেজমেন্ট অবজেক্ট
const globalAppState = {
    newStatusControl: {}, 
    dynamicItems: [], 
    notices: [], 
    noticePage: { currentPage: 1, totalPages: 0 }, 
    dynamicSectionsState: {
        [CONSTANTS.STUDENTS_SECTION_ID]: { data: [], currentPage: 1, totalPages: 0, linkType: 'url' },
        [CONSTANTS.FORMS_SECTION_ID]: { data: [], currentPage: 1, totalPages: 0, linkType: 'url' }
    },
    isIndexDataLoaded: false,
};

// ===================================
// 🛠️ ইউটিলিটি ফাংশন (Utilities) 🛠️
// ===================================

/**
 * সাইডবার মেনু টগল করে।
 */
function toggleMenu() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.querySelector('.overlay');
    
    if (sidebarMenu) sidebarMenu.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll', sidebarMenu && sidebarMenu.classList.contains('active'));
}

/**
 * লগআউট বাটন থেকে কল করা হয়, ব্যবহারকারীকে লগইন পেজে নিয়ে যায়।
 * index.html এ onclick="goBack()" এর মাধ্যমে ব্যবহৃত হয়।
 */
function goBack() {
    const loginLink = document.getElementById('sidebar-login-link');
    
    // লগআউট মানে ব্যবহারকারীকে টিচার লগইন পেজে নিয়ে যাওয়া
    if (loginLink && loginLink.href) {
        window.location.href = loginLink.href;
    } else {
        // ফলব্যাক
        window.location.href = "home.html"; 
    }
}

/**
 * একটি কাস্টম বাটন তৈরি করে। (স্টাইল CSS-এ সরানো উচিত)
 */
function createButton(text, bgColor, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.onclick = onClick;
    btn.disabled = disabled;
    
    // ইনলাইন স্টাইল কমিয়ে ক্লাস ব্যবহার করা হলো
    btn.className = 'custom-btn'; // এই ক্লাসটি CSS-এ সংজ্ঞায়িত করুন
    btn.style.backgroundColor = bgColor; // শুধু ব্যাকগ্রাউন্ড কালার ডাইনামিক রাখা হলো
    btn.style.opacity = disabled ? 0.6 : 1;
    
    return btn;
}

/**
 * লোডিং বা এরর মেসেজের জন্য স্ট্যান্ডার্ড HTML বক্স তৈরি করে। (স্টাইল CSS-এ সরানো উচিত)
 */
function errorBox(title, message, isError = false) {
    let borderColor, bgColor, textColor;

    if (isError) {
        borderColor = '#ff9999'; 
        bgColor = '#ffe6e6';
        textColor = '#cc0000';
        boxClass = 'error-box';
    } else if (title === "Loading...") {
        borderColor = '#6495ED'; 
        bgColor = '#E6F0FF';
        textColor = '#4169E1'; 
        boxClass = 'loading-box';
    } else { // Available Soon/No Data
        borderColor = '#FFD700'; 
        bgColor = '#FFFACD';
        textColor = '#B8860B'; 
        boxClass = 'info-box';
    }
    
    return `
        <div class="status-box ${boxClass}" style="
            border-color: ${borderColor}; background-color: ${bgColor};
            color: ${textColor};
            /* অন্যান্য স্টাইল CSS-এ সরানো উচিত */
            font-size: 18px; font-weight: bold; padding: 10px; 
            border-radius: 8px; text-align: center; max-width: 320px; margin: 20px auto;
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
 */
async function loadIndexData() {
    if (globalAppState.isIndexDataLoaded) {
        return globalAppState.dynamicItems;
    }
    try {
        const response = await fetch(CONSTANTS.INDEX_LINK_JSON);
        if (!response.ok) throw new Error('Failed to load config.');
        const data = await response.json();
        
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
 */
function initializeNewStatusControl(baseData) {
    const storedStatus = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_KEY);
    let newStatusControl = storedStatus ? JSON.parse(storedStatus) : {};
    let statusChanged = false;

    // index_link.json-এর ডেটা দিয়ে LocalStorage আপডেট করা
    baseData.forEach(item => {
        const title = item.title;
        if (!title) return; 

        if (newStatusControl[title] === undefined) {
            newStatusControl[title] = item.isNew === true;
            statusChanged = true;
        }
    });
    
    globalAppState.newStatusControl = newStatusControl;

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
    marqueeContainer.classList.remove('no-scroll');

    if (newItems.length > 0) {
        const newMarqueeItems = newItems.map(item => {
            const url = item.url && item.url.trim() !== '' ? item.url : '#'; 
            return `<a href="${url}" target="_blank" class="marquee-link">
                        <span class="new-badge blink">✨ NEW</span> ${item.title} 
                    </a>`;
        });
        
        const singleContent = newMarqueeItems.join(' <span class="marquee-separator">|</span> ');
        
        // কন্টেন্ট ডুপ্লিকেট করা
        const space = ' <span style="padding: 0 80px;">| | |</span> ';
        htmlContent = singleContent + space + singleContent + space + singleContent;
        
    } else {
        // কোনো NEW আইটেম না থাকলে ডিফল্ট বার্তা
        const welcomeMessage = `🙏 Welcome to ${CONSTANTS.SCHOOL_NAME} Official Website 🙏`;
        htmlContent = `<div class="marquee-default-msg" style="width: max-content; padding-left: 100px;">${welcomeMessage}</div>`;
        // CSS-এ স্ক্রলিং বন্ধ করার জন্য ক্লাস যোগ করা
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
 */
async function fetchDynamicSectionData(sectionId) {
    const container = document.getElementById(sectionId);
    if (container) container.innerHTML = errorBox("Loading...", "Please wait...");
    
    try {
        // মেমোইজেশনের কারণে শুধু একবার ডেটা লোড হবে
        await loadIndexData(); 
        
        // initializeNewStatusControl-এ LocalStorage আপডেট করার লজিক একবার লোড হয়ে গেছে
        
        renderList(sectionId);

        const parentSectionId = sectionId.replace('-list', '-section');
        updateMoreLessButton(parentSectionId); 
        
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
        clickHandler = (item) => showPopup(item.text, item.date, item.link, item.subj);
    } else {
        state = globalAppState.dynamicSectionsState[sectionId];
        data = state.data;
        linkKey = 'url';
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
        renderPaginationControls(sectionId); 
        return;
    }

    state.totalPages = Math.ceil(data.length / CONSTANTS.NOTICES_PER_PAGE);
    const startIndex = (state.currentPage - 1) * CONSTANTS.NOTICES_PER_PAGE;
    const endIndex = startIndex + CONSTANTS.NOTICES_PER_PAGE;
    const itemsToRender = data.slice(startIndex, endIndex);

    itemsToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        const titleText = item.text || item.title || "No Title";
        
        const isItemNew = globalAppState.newStatusControl[titleText] === true; 
        
        let itemContent = titleText;
        if (sectionId === CONSTANTS.NOTICE_SECTION_ID) {
             itemContent += item.date ? ` [Date: ${item.date}]` : '';
        }

        if (isItemNew) {
            itemContent += ` <span class="new-badge">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 
        
        itemDiv.className = 'list-item-style'; 
        // ইনলাইন স্টাইল সরিয়ে CSS ক্লাস ব্যবহার করা হয়েছে:
        itemDiv.onclick = () => clickHandler(item, itemDiv);
        itemDiv.onmouseover = () => itemDiv.classList.add('hover'); 
        itemDiv.onmouseout = () => itemDiv.classList.remove('hover');
        
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
        const hasOverflow = sectionContentWrapper.scrollHeight > sectionContentWrapper.clientHeight + 5; 
        button.style.display = hasOverflow ? 'block' : 'none';
        if (hasOverflow) {
            button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
        }
    }, 50); 
}

/**
 * Notices-এর জন্য পপ-আপ দেখায় (ইনলাইন স্টাইল সরানো উচিত)।
 */
function showPopup(titleText, date, link, subjText) {
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'notice-popup-overlay';
    overlay.className = 'notice-popup-overlay-style'; // CSS-এ সরান
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.id = 'notice-popup';
    popup.className = 'notice-popup-style'; // CSS-এ সরান

    // স্কুলের নাম এবং নোটিস হেডিং যুক্ত করা
    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = `<strong>${CONSTANTS.SCHOOL_NAME}</strong><br>Notice Board`;
    schoolHeader.className = 'school-header-style'; // CSS-এ সরান
    popup.appendChild(schoolHeader);

    // অন্যান্য পপ-আপ কন্টেন্ট (title, date, subject)
    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.className = 'notice-title-style'; // CSS-এ সরান
    popup.appendChild(titleElem);

    if (date && date.trim() !== '') {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        dateElem.className = 'notice-date-style'; // CSS-এ সরান
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.className = 'notice-subject-style'; // CSS-এ সরান
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.className = 'popup-link-btn'; // CSS-এ সরান
        buttonContainer.appendChild(linkBtn);
    }
    
    // ডাউনলোড লজিক
    const downloadBtn = createButton('Download', '#28a745', () => {
        buttonContainer.style.visibility = 'hidden';
        const originalMaxHeight = popup.style.maxHeight;
        const originalOverflowY = popup.style.overflowY;

        popup.style.maxHeight = 'none';
        popup.style.overflowY = 'visible';

        setTimeout(() => {
            if (typeof html2canvas !== 'undefined') {
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
            } else {
                 console.error('html2canvas library is missing.');
                 popup.style.maxHeight = originalMaxHeight;
                 popup.style.overflowY = originalOverflowY;
                 buttonContainer.style.visibility = 'visible';
            }
        }, 50);
    });
    
    const closeBtn = createButton('Back', '#dc3545', () => overlay.remove()); 

    buttonContainer.append(downloadBtn, closeBtn);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup); 
}

/**
 * 'Available Soon' বার্তা দেখায়। (ইনলাইন স্টাইল সরানো উচিত)
 */
function showAvailableSoonMessage(element) {
    const parentContainer = element.closest('.section-content-wrapper');
    if (parentContainer) {
        parentContainer.querySelectorAll('.avail-msg').forEach(msg => msg.remove());
    }

    const msg = document.createElement('div');
    msg.className = 'avail-msg'; // এই ক্লাসটি CSS-এ সংজ্ঞায়িত করুন
    msg.textContent = '🔔 Available Soon! Please Wait. 🔔';
    
    element.after(msg); 
    
    setTimeout(() => msg.remove(), 3000);
}


// ==========================================================
// 🚀 DOMContentLoaded - ইভেন্ট লিসেনারের ভেতরের অপ্টিমাইজড অংশ 🚀
// ==========================================================

document.addEventListener('DOMContentLoaded', function () {
    
    // --- Menu Toggle Logic --- (সংশোধিত)
    const menuToggleButton = document.getElementById('menu-toggle-button');
    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', toggleMenu);
    }

    // --- Hero Images Scrolling Logic ---
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

    // --- More/Less Button Logic ---
    document.querySelectorAll('.toggle-button').forEach(button => {
        const sectionContentWrapper = button.previousElementSibling;
        if (sectionContentWrapper) {
            button.addEventListener('click', function() {
                sectionContentWrapper.classList.toggle('expanded');
                button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
            });
        }
    });
    
    // --- Gallery Fullscreen Logic ---
    const galleryImages = document.querySelectorAll('.gallery-image');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const fullscreenImage = document.getElementById('fullscreen-image');

    if (galleryImages.length > 0 && fullscreenOverlay && fullscreenImage) {
        galleryImages.forEach(image => {
            image.addEventListener('click', function() {
                fullscreenImage.src = this.getAttribute('data-src') || this.src;
                fullscreenOverlay.style.display = 'flex';
                document.body.classList.add('no-scroll');
            });
        });

        fullscreenOverlay.addEventListener('click', function(event) {
            if (event.target === fullscreenOverlay || event.target === fullscreenImage) {
                fullscreenOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        });
    }

    // Initial function calls
    loadIndexData()
        .then(data => {
            initializeNewStatusControl(data); // LocalStorage ইনিসিয়ালাইজ করা
        })
        .finally(() => {
            // ডেটা লোড হোক বা না হোক, রেন্ডারিং শুরু করা:
            fetchNotices();
            fetchDynamicSectionData(CONSTANTS.STUDENTS_SECTION_ID);
            fetchDynamicSectionData(CONSTANTS.FORMS_SECTION_ID);
        });
        
    // --- Escape Key Logic (Popup & Menu) --- (সংশোধিত)
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
                toggleMenu(); // গ্লোবাল ফাংশন কল করা
                event.preventDefault();
            }
            
            // 3. Fullscreen Gallery বন্ধ করা
            if (fullscreenOverlay && fullscreenOverlay.style.display === 'flex') {
                fullscreenOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        }
    });
});
