/* =================================
 * NEW স্ট্যাটাস কন্ট্রোল লজিক (LocalStorage ভিত্তিক)
 * ================================= */

let NEW_STATUS_CONTROL = {};
let ALL_ITEMS_DETAILS = [];
const LOCAL_STORAGE_KEY = 'newStatusControl';

let dynamicSectionsState = {
    'students-list': { data: [], currentPage: 1, totalPages: 0 },
    'forms-list': { data: [], currentPage: 1, totalPages: 0 },
    'routine-list': { data: [], currentPage: 1, totalPages: 0 },
    'results-list': { data: [], currentPage: 1, totalPages: 0 }
};

/* =================================
 * HTML Element থেকে Data এবং LocalStorage ম্যানেজমেন্ট
 * ================================= */
function getSavedNewStatus() {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
        console.error("LocalStorage read error:", e);
        return {};
    }
}

function collectDetailsFromHTML() {
    ALL_ITEMS_DETAILS = [];
    NEW_STATUS_CONTROL = getSavedNewStatus();

    const links = document.querySelectorAll('.site-link, .notice-item-link, .link-item');

    links.forEach(link => {
        const title = link.getAttribute('data-title') || link.innerText.trim();
        const url = link.getAttribute('href') || '#';
        
        const attrIsNew = link.getAttribute('data-isnew')?.toLowerCase() === "true";
        const isNew = (NEW_STATUS_CONTROL[title] !== undefined) ? NEW_STATUS_CONTROL[title] : attrIsNew;

        if (title) {
            ALL_ITEMS_DETAILS.push({ title: title, url: url, isNew: isNew });
            NEW_STATUS_CONTROL[title] = isNew;
        }
    });

    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(NEW_STATUS_CONTROL));
    } catch (e) {
        console.error("LocalStorage write error:", e);
    }
}

/* =================================
 * স্ক্রল বার (Marquee) রেন্ডারিং লজিক
 * ================================= */
function renderMarquee() {
    const marqueeWrapper = document.getElementById('new-marquee-wrapper');
    if (!marqueeWrapper) return;

    const newItems = ALL_ITEMS_DETAILS.filter(item => item.isNew === true);
    let htmlContent = '';

    if (newItems.length > 0) {
        const newMarqueeItems = newItems.map(item => {
            const title = item.title;
            const url = item.url || '#';
            return `<a href="${url}" target="_blank" class="marquee-link">
                        <span class="new-badge blink">✨ NEW</span> ${title} 
                    </a>`;
        });
        
        const singleContent = newMarqueeItems.join(' <span class="marquee-separator">|</span> ');
        const space = ' <span class="marquee-spacer">| | |</span> ';
        htmlContent = singleContent + space + singleContent + space + singleContent;
    } else {
        const welcomeMessage = "🙏 Welcome to our Official Website 🙏";
        htmlContent = `<div class="marquee-default-msg">${welcomeMessage}</div>`;
    }

    marqueeWrapper.innerHTML = htmlContent;
}

/* =================================
 * Digital Notice Board Functions (Supabase REST API)
 * ================================= */
const SUPABASE_URL = "https://bjjwzgzjjcpnndbuelkh.supabase.co/rest/v1/Notice?select=*";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqand6Z3pqamNwbm5kYnVlbGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MTk1NDMsImV4cCI6MjEwMjM5NTU0M30.ICT0pRA2GtlJhxKxo8ghp0x2pVLem1csBkq_hvNVGUs";

const NOTICES_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;
let Helping = [];

function errorBox(title, message) {
    const boxClass = (title === "Loading...") ? 'loading-box' : 'error-box';
    return `
        <div class="info-box ${boxClass}">
            <strong>${title}</strong><br>${message}
        </div>
    `;
}

function parseFlexibleDate(dateStr) {
    if (!dateStr) return 0;
    
    let cleanStr = String(dateStr).trim().replace(/-/g, '/').replace(/\./g, '/');
    let parts = cleanStr.split('/');
    
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        let parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
    }
    
    let parsedTime = Date.parse(cleanStr);
    return isNaN(parsedTime) ? 0 : parsedTime;
}

async function fetchNotices() {
    const container = document.getElementById('help-list');
    
    if (!container) {
        console.error("Error: HTML-এ 'help-list' আইডিযুক্ত কোনো Element পাওয়া যায়নি!");
        return;
    }

    container.innerHTML = errorBox("Loading...", "Please wait...");

    try {
        const response = await fetch(SUPABASE_URL, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        let data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            data.sort((a, b) => {
                let timeA = parseFlexibleDate(a.date_val || a.date);
                let timeB = parseFlexibleDate(b.date_val || b.date);
                
                if (timeB !== timeA) {
                    return timeB - timeA;
                }
                return (b.sl_no || 0) - (a.sl_no || 0);
            });
            
            Helping = data;
        } else {
            Helping = [];
        }

        currentPage = 1; 
        renderHelpList();
        
        if (typeof updateMoreLessButton === 'function') {
            updateMoreLessButton('important-links-section-notice'); 
        }
    } catch (error) {
        console.error("Failed to fetch notices from Supabase:", error);
        container.innerHTML = errorBox("Error!", "Failed to load notices from server.");
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
    const noticesToRender = Helping.slice(startIndex, startIndex + NOTICES_PER_PAGE);

    noticesToRender.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('notice-item'); 
        
        const titleText = item.heading || "No Title";
        const dateValText = item.date_val || item.date || '';
        const dateText = dateValText ? ` [Date: ${dateValText}]` : '';  
        
        const isItemNew = (item.is_new === true || item.is_new === "true" || String(item.is_new).toLowerCase() === "yes"); 
        
        let itemContent = titleText + dateText;  
        
        if (isItemNew) {
            itemContent += ` <span class="new-badge blink">NEW</span>`;  
        }
        
        itemDiv.innerHTML = itemContent; 
        itemDiv.onclick = () => {
            if (typeof showPopup === 'function') {
                showPopup(item.heading, dateValText, item.link, item.notice_body);
            }
        };
        container.appendChild(itemDiv);
    });
    
    renderPaginationControls();
}

function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;
    
    paginationContainer.classList.add('pagination-controls');

    const backBtn = createButton('BACK', () => {
        if (currentPage > 1) { currentPage--; renderHelpList(); }
    }, currentPage === 1);

    const pageInfo = document.createElement('span');
    pageInfo.classList.add('page-info');
    pageInfo.innerText = `Page ${currentPage}/${totalPages}`;

    const nextBtn = createButton('NEXT', () => {
        if (currentPage < totalPages) { currentPage++; renderHelpList(); }
    }, currentPage === totalPages);
    
    backBtn.classList.add('pagination-btn');
    nextBtn.classList.add('pagination-btn');

    paginationContainer.append(backBtn, pageInfo, nextBtn);
}

/* =================================
 * HTML-এ সরাসরি থাকা বাটনে NEW ব্যাজ যোগ করার ফাংশন
 * ================================= */
function applyNewBadgesToHTML() {
    const links = document.querySelectorAll('.site-link, .notice-item-link, .link-item');
    
    links.forEach(link => {
        const title = link.getAttribute('data-title') || link.innerText.trim();
        const isNew = NEW_STATUS_CONTROL[title] || link.getAttribute('data-isnew')?.toLowerCase() === "true";
        
        if (isNew && !link.querySelector('.new-badge')) {
            link.innerHTML += ` <span class="new-badge blink">✨ NEW</span>`;
        }
    });
}

function showAvailableSoonMessage(element) {
    const parentContainer = element.closest('.section-content-wrapper') || element.parentElement;
    if (parentContainer) {
        const existingMessages = parentContainer.querySelectorAll('.avail-msg');
        existingMessages.forEach(msg => msg.remove());
    }
    const msg = document.createElement('div');
    msg.className = 'avail-msg';
    msg.textContent = '🔔 Available Soon! Please Wait. 🔔';
    
    element.insertAdjacentElement('afterend', msg); 
    
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
    btn.classList.add('custom-button');
    if (disabled) {
        btn.classList.add('disabled');
    }
    return btn;
}

function showPopup(titleText, date, link, subjText) {
    const existingOverlay = document.getElementById('notice-popup-overlay');
    if (existingOverlay) existingOverlay.remove();

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
    popup.classList.add('notice-popup-box'); 

    const schoolHeader = document.createElement('div');
    schoolHeader.innerHTML = '<strong>Pathpukur High School (HS)</strong><br>Notice Board';
    schoolHeader.classList.add('school-header');
    popup.appendChild(schoolHeader);

    const titleElem = document.createElement('div');
    titleElem.innerText = titleText || "No Title";
    titleElem.classList.add('notice-title');
    popup.appendChild(titleElem);

    if (date && date.trim() !== '') {
        const dateElem = document.createElement('div');
        dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
        dateElem.classList.add('notice-date');
        popup.appendChild(dateElem);
    }

    if (subjText && subjText.trim() !== '') {
        const subjElem = document.createElement('div');
        subjElem.innerText = subjText;
        subjElem.classList.add('notice-subject');
        popup.appendChild(subjElem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    popup.appendChild(buttonContainer);

    if (link && link.trim() !== '') {
        const linkBtn = document.createElement('a');
        linkBtn.href = link;
        linkBtn.innerText = 'Open Link';
        linkBtn.target = '_blank';
        linkBtn.classList.add('popup-link-btn');
        buttonContainer.appendChild(linkBtn);
    }

    const downloadBtn = createButton('Download', () => {
        buttonContainer.style.visibility = 'hidden';
        downloadBtn.classList.add('download-btn');

        const originalMaxHeight = popup.style.maxHeight;
        const originalOverflowY = popup.style.overflowY;

        popup.style.maxHeight = 'none';
        popup.style.overflowY = 'visible';

        setTimeout(() => {
            if (typeof html2canvas === 'function') {
                html2canvas(popup).then(canvas => {
                    let safeTitle = (titleText || "notice")
                        .replace(/[\\/:*?"<>|]+/g, "")
                        .trim()
                        .replace(/\s+/g, "_");
                    
                    let fileName = safeTitle + ".png";

                    const downloadLink = document.createElement('a');
                    downloadLink.download = fileName;
                    downloadLink.href = canvas.toDataURL();
                    downloadLink.click();

                    popup.style.maxHeight = originalMaxHeight;
                    popup.style.overflowY = originalOverflowY;
                    buttonContainer.style.visibility = 'visible';
                });
            } else {
                alert("Image download library is missing!");
                buttonContainer.style.visibility = 'visible';
            }
        }, 50);
    });

    const closeBtn = createButton('Back', () => overlay.remove());
    closeBtn.classList.add('close-btn');

    buttonContainer.append(downloadBtn, closeBtn);
    overlay.appendChild(popup);
}

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

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        const popupOverlay = document.getElementById('notice-popup-overlay');
        if (popupOverlay) {
            popupOverlay.remove();
            event.preventDefault();
        }
    }
});

/* =================================
 * DOMContentLoaded - একমাত্র মূল ইনিশিয়ালাইজেশন অংশ
 * ================================= */
document.addEventListener('DOMContentLoaded', function () {
    
    // ১. হিরো সেকশনের ছবি স্ক্রলিং
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
            heroSection.addEventListener('mouseenter', () => { if (scrollInterval) clearInterval(scrollInterval); });
            heroSection.addEventListener('mouseleave', () => { if (!isManualScrolling) startAutoScroll(); });
        }

        startAutoScroll();
    } 

    // ২. স্কুল লোগো প্রটেকশন
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.addEventListener('contextmenu', event => event.preventDefault());
    }

    // ৩. More/Less Button Logic
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

    // ৪. Menu Bar Logic
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

    // ৫. Gallery Fullscreen Logic
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

    // ৬. ডাটা সংগ্রহ, Marquee ও Supabase Notice ফেচ
    collectDetailsFromHTML();
    applyNewBadgesToHTML();
    renderMarquee();
    fetchNotices();

    // ৭. খালি/লিঙ্ক ছাড়া বোতামে ক্লিক করলে 'Available Soon' মেসেজ দেখানোর লজিক
    const allLinks = document.querySelectorAll('.site-link, .notice-item-link, .link-item, a');
    
    allLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const href = this.getAttribute('href');
            
            if (!href || href.trim() === '' || href === '#' || href.startsWith('javascript:')) {
                event.preventDefault(); 
                showAvailableSoonMessage(this); 
            }
        });
    });

/* =========================================================
 * ৮. নতুন যোগ করা সার্চ লজিক (সংশোধিত)
 * ========================================================= */
const searchInput = document.getElementById('site-search-input');
const searchResultsDropdown = document.getElementById('search-dropdown-list');
const clearSearchBtn = document.getElementById('clear-search-btn');

if (searchInput && searchResultsDropdown) {
    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        searchResultsDropdown.innerHTML = '';

        // ক্লিয়ার বাটন দেখানো বা লুকানোর লজিক
        if (clearSearchBtn) {
            clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        if (query.length < 2) {
            searchResultsDropdown.classList.remove('active');
            return;
        }

        // HTML লিঙ্ক এবং Supabase নোটিশ থেকে ডাটা ফিল্টার করা
        let matchedItems = ALL_ITEMS_DETAILS.filter(item => 
            item.title && item.title.toLowerCase().includes(query)
        );

        if (matchedItems.length > 0) {
            matchedItems.forEach(item => {
                const resDiv = document.createElement('div');
                resDiv.className = 'search-dropdown-item';
                resDiv.innerHTML = `
                    <span class="item-title">${item.title}</span>
                    <a href="${item.url}" class="item-btn" target="_blank">দেখা যান ➔</a>
                `;
                searchResultsDropdown.appendChild(resDiv);
            });
            searchResultsDropdown.classList.add('active');
        } else {
            searchResultsDropdown.innerHTML = `<div style="padding:15px; text-align:center; color:#777;">কোনো তথ্য পাওয়া যায়নি!</div>`;
            searchResultsDropdown.classList.add('active');
        }
    });

    // ✖ ক্লিয়ার বাটনে ক্লিক করলে সার্চ ইনপুট ফাকা হওয়া
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchResultsDropdown.innerHTML = '';
            searchResultsDropdown.classList.remove('active');
            this.style.display = 'none';
            searchInput.focus();
        });
    }

    // সার্চ বক্সের বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হয়ে যাওয়া
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
            searchResultsDropdown.classList.remove('active');
        }
    });
}
