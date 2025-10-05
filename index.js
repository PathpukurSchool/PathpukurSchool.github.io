document.addEventListener('DOMContentLoaded', function () {

    /* =================================
     * Digital Notice Board Functions (Notices Section - অপরিবর্তিত)
     * ================================= */
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBBTOstepckaJrKR2CYYlx4UACjeHajExLTA5tMpmiNcZrwT6XIUwc7l7_pIdHdFDT/exec?action=read";
    const NOTICES_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 0;
    let Helping = []; // Notices ডেটা

    // [নতুন কোড] Students এবং Forms সেকশনের ডেটা ও পেজিনেশন স্টেট রাখার জন্য অবজেক্ট
    const dynamicSectionsState = {
        'students-list': {
            data: [],
            currentPage: 1,
            totalPages: 0,
        },
        'forms-list': {
            data: [],
            currentPage: 1,
            totalPages: 0,
        }
    };

    // [পরিবর্তন] একটি জেনারেলাইজড ফাংশন যা নোটিশের মতো errorBox তৈরি করে
    function errorBox(title, message) {
        return `
            <div style="
                border: 2px solid #ff9999; background-color: #ffe6e6;
                color: #cc0000; font-size: 20px; font-weight: bold;
                padding: 10px; border-radius: 8px; text-align: center;
                max-width: 300px; margin: 0 auto;
            ">
                <strong>${title}</strong><br>${message}
            </div>
        `;
    }

    // [Notices সেকশনের জন্য] fetchNotices, renderHelpList, renderPaginationControls অপরিবর্তিত রইল
    async function fetchNotices() {
        try {
            const response = await fetch(APPS_SCRIPT_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            Helping = Array.isArray(data.notices) ? data.notices : [];
            currentPage = 1; // নোটিশ ডেটা লোড হলে প্রথম পেজে সেট করা
            renderHelpList();
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
            itemDiv.innerText = item.text || "No Title";
            // [Notices স্টাইল]
            itemDiv.style.cssText = `
                cursor: pointer; margin: 10px 0; padding: 8px 10px;
                background-color: #f9f9f9; border-left: 6px solid #8B4513;
                border-radius: 4px; transition: background-color 0.3s;
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
     * Students & Forms Section (Notices-এর স্টাইল ব্যবহার করে)
     * ================================= */
    
    // [নতুন কোড] Students ও Forms সেকশনের ডেটা লোড করার জন্য জেনারেলাইজড ফাংশন
    async function fetchDynamicSectionData(sectionId) {
        const container = document.getElementById(sectionId);
        const dataKey = sectionId === 'students-list' ? 'students' : 'forms'; // JSON থেকে সঠিক কী নেওয়া
        const state = dynamicSectionsState[sectionId];
        
        try {
            const response = await fetch('index_link.json'); // Students ও Forms সেকশনের ডেটা লোড
            if (!response.ok) throw new Error('Failed to load configuration.');
            const data = await response.json();
            
            // ধরে নিচ্ছি JSON-এ dataKey-এর নামে একটি অ্যারে আছে
            state.data = Array.isArray(data[dataKey]) ? data[dataKey] : [];
            state.currentPage = 1; // ডেটা লোড হওয়ার পর প্রথম পেজে সেট করা
            
            renderDynamicList(sectionId);

        } catch (error) {
            console.error(`Failed to fetch data for ${sectionId}:`, error);
            if (container) {
                // [পরিবর্তন] Notices সেকশনের মতো Error Message দেখানো হয়েছে।
                container.innerHTML = errorBox("Error!", `Failed to load ${dataKey} links.`);
            }
        }
    }

    // [নতুন কোড] Students ও Forms সেকশনের ডেটা রেন্ডার করার জন্য ফাংশন (Notices-এর স্টাইল অনুযায়ী)
    function renderDynamicList(sectionId) {
        const state = dynamicSectionsState[sectionId];
        const container = document.getElementById(sectionId);
        // [পরিবর্তন] পেজিনেশন কন্টেইনারের ID পরিবর্তন করা হয়েছে
        const paginationContainer = document.getElementById(sectionId.replace('-list', '-pagination')); 

        if (!container) return;
        container.innerHTML = "";
        if (paginationContainer) paginationContainer.innerHTML = '';

        if (!Array.isArray(state.data) || state.data.length === 0) {
            // [পরিবর্তন] Notices সেকশনের মত Available Soon মেসেজ দেখাবে।
            container.innerHTML = errorBox("Available Soon!", "Please check back later for updates.");
            return;
        }

        // পেজিনেশন লজিক
        state.totalPages = Math.ceil(state.data.length / NOTICES_PER_PAGE);
        const startIndex = (state.currentPage - 1) * NOTICES_PER_PAGE;
        const endIndex = startIndex + NOTICES_PER_PAGE;
        const itemsToRender = state.data.slice(startIndex, endIndex);

        itemsToRender.forEach(item => {
            const itemDiv = document.createElement('div');
            const titleText = item.title || "No Title";
            const linkUrl = item.url || '';
            const description = item.description || '';

            itemDiv.innerText = titleText;
            // [পরিবর্তন] Notices সেকশনের স্টাইল ব্যবহার করা হয়েছে।
            itemDiv.style.cssText = `
                cursor: pointer; margin: 10px 0; padding: 8px 10px;
                background-color: #f9f9f9; border-left: 6px solid #8B4513;
                border-radius: 4px; transition: background-color 0.3s;
            `;
            itemDiv.onmouseover = () => itemDiv.style.backgroundColor = '#eef';
            itemDiv.onmouseout = () => itemDiv.style.backgroundColor = '#f9f9f9';
            
            // [পরিবর্তন] ক্লিক ইভেন্ট: লিংক থাকলে পপআপ দেখাবে, না থাকলে Unavailable মেসেজ দেখাবে।
            itemDiv.onclick = () => {
                if (linkUrl && linkUrl.trim() !== '') {
                    // Notices-এর মতো পপআপ দেখাবে
                    showPopup(titleText, item.date || '', linkUrl, description);
                } else {
                    // লিংক না পাওয়া গেলে Notices সেকশনের অনুরূপ মেসেজ দেখাবে।
                    showAvailableSoonMessage(itemDiv); 
                }
            };
            container.appendChild(itemDiv);
        });

        // পেজিনেশন কন্ট্রোল রেন্ডার করা
        renderDynamicPagination(sectionId);
    }
    
    // [নতুন কোড] Students ও Forms সেকশনের জন্য পেজিনেশন কন্ট্রোল রেন্ডার
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

    // [নতুন কোড] লিংক না থাকলে মেসেজ দেখানোর জন্য ফাংশন
    function showAvailableSoonMessage(element) {
        // এই ফাংশনটি Notices-এর মতো লিংক না থাকলে মেসেজ দেখানোর কাজ করবে
        const parentContainer = element.closest('.section-content-wrapper');
        if (!parentContainer) return;
        const existingMessage = parentContainer.querySelector('.avail-msg');
        if (existingMessage) existingMessage.remove();
        const msg = document.createElement('div');
        msg.className = 'avail-msg';
        msg.textContent = '🔔 Link Unavailable/Available Soon 🔔';
        // Notices সেকশনের ত্রুটি বার এর রঙের কাছাকাছি মেসেজ স্টাইল ব্যবহার করা যেতে পারে
        msg.style.cssText = `
            color: #cc0000; background-color: #ffe6e6; 
            border: 1px solid #ff9999; padding: 5px; border-radius: 5px; 
            font-weight: bold; text-align: center; margin-top: 10px;
        `;
        parentContainer.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }

    /* =================================
     * Utility Functions (createButton, showPopup)
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

    // Notices সেকশনের showPopup ফাংশনটি অপরিবর্তিত রইল
    function showPopup(titleText, date, link, subjText) {
        const existing = document.getElementById('notice-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'notice-popup';
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #f0f8ff; padding: 20px; border: 2px solid #333;
            border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5);
            z-index: 9999; text-align: center; max-width: 90%; min-width: 240px;
            width: 300px; font-family: Arial, sans-serif;
        `;

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

        const closeBtn = createButton('Back', '#dc3545', () => popup.remove());
        
        // এখানে Download বাটন-এর কোড রাখা হয়নি কারণ এটি html2canvas-এর উপর নির্ভরশীল।
        buttonContainer.appendChild(closeBtn);
        
        popup.appendChild(buttonContainer);
        document.body.appendChild(popup);
    }
    
    /* =================================
     * Other UI Logic (More/Less, Menu, Gallery etc.)
     * ================================= */
    // --- More/Less Button Logic ---
    const toggleButtons = document.querySelectorAll('.toggle-button');
    toggleButtons.forEach(button => {
        const sectionContentWrapper = button.previousElementSibling;
        if (sectionContentWrapper && sectionContentWrapper.scrollHeight <= sectionContentWrapper.clientHeight) {
            button.style.display = 'none';
        }
        button.addEventListener('click', function() {
            sectionContentWrapper.classList.toggle('expanded');
            button.textContent = sectionContentWrapper.classList.contains('expanded') ? 'Less...' : 'More...';
        });
    });

    // ... (Menu Bar Logic) ...
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

    // ... (Gallery Fullscreen Logic) ...
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
    fetchNotices(); // Notices সেকশনের কার্যপদ্ধতি (API)
    // [পরিবর্তন] Students ও Forms সেকশনের নতুন কার্যপদ্ধতি (JSON)
    fetchDynamicSectionData('students-list');
    fetchDynamicSectionData('forms-list');
});
