document.addEventListener('DOMContentLoaded', function () {

    /* =================================
     * হিরো সেকশনের ছবি স্ক্রলিং এর জন্য সংশোধিত কোড
     * ================================= */
    const heroImagesContainer = document.querySelector('.hero-images');

    // 💡 সংশোধন ১: heroImagesContainer বিদ্যমান থাকলে তবেই কোড চালাও
    if (heroImagesContainer) {
        // এই ভেরিয়েবলগুলিকে অবশ্যই if ব্লকের ভিতরে সংজ্ঞায়িত করতে হবে
        const totalImages = heroImagesContainer.querySelectorAll('.hero-image').length;
        let imageIndex = 0;
        let scrollInterval;
        const scrollDuration = 4000; // 4 সেকেন্ড পর পর ছবি পরিবর্তন হবে
        
        // ম্যানুয়াল স্ক্রল বা হোভার ইভেন্টের জন্য ফ্যাগ
        let isManualScrolling = false;

        // 💡 স্বয়ংক্রিয় স্ক্রল শুরু করার ফাংশন
        function startAutoScroll() {
            if (scrollInterval) clearInterval(scrollInterval);
            
            scrollInterval = setInterval(() => {
                if (isManualScrolling) return; // ম্যানুয়াল স্ক্রল চললে থামবে
                
                imageIndex = (imageIndex + 1) % totalImages;
                const scrollDistance = imageIndex * heroImagesContainer.clientWidth;
                
                // স্মুথ স্ক্রল ফাংশন
                heroImagesContainer.scrollTo({
                    left: scrollDistance,
                    behavior: 'smooth'
                });

            }, scrollDuration);
        }
        
        // 💡 সংশোধন ২: ম্যানুয়াল স্ক্রল ইভেন্ট লিসেনারে startAutoScroll() যোগ করা হলো
        heroImagesContainer.addEventListener('scroll', function() {
            // ব্যবহারকারী স্ক্রল শুরু করলেই অটো-স্ক্রল বন্ধ করতে হবে
            isManualScrolling = true;
            
            // স্ক্রল শেষ হওয়ার পর আবার চালু করার জন্য একটি ছোট ডিলে দেওয়া হলো
            clearTimeout(heroImagesContainer.scrollTimeout);
            heroImagesContainer.scrollTimeout = setTimeout(() => {
                isManualScrolling = false;
                
                // স্ক্রল শেষ হবার পর current imageIndex update
                const scrollLeft = heroImagesContainer.scrollLeft;
                const imageWidth = heroImagesContainer.clientWidth;
                imageIndex = Math.round(scrollLeft / imageWidth);

                // ✅ ফিক্স: স্ক্রল শেষ হলে অটো স্ক্রল পুনরায় চালু
                startAutoScroll(); 
            }, 300); // 300ms পর মনে করা হবে যে স্ক্রল শেষ হয়েছে
        });

        // 💡 হোভার ইভেন্ট: হোভার করলে অটো-স্ক্রল বন্ধ হবে
        const heroSection = heroImagesContainer.closest('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', function() {
                if (scrollInterval) clearInterval(scrollInterval);
            });

            // 💡 হোভার শেষ হলে অটো-স্ক্রল আবার চালু হবে
            heroSection.addEventListener('mouseleave', function() {
                if (!isManualScrolling) {
                    startAutoScroll();
                }
            });
        }

        // ওয়েব পেজ লোড হওয়ার পর স্বয়ংক্রিয় স্ক্রল শুরু
        startAutoScroll();
    } 

    /* =================================
     * স্কুল লোগো কে সুরক্ষিত রাখার জন্য সংশোধিত কোড
     * ================================= */

    const logoContainer = document.querySelector('.logo-container');
    // 💡 সংশোধন ৩: সরাসরি লোগো কন্টেইনারের উপর ইভেন্ট লিসেনার যোগ করা
    if (logoContainer) {
        logoContainer.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // রাইট-ক্লিক মেনু ব্লক করা হলো
        });
    }

    /* =================================
     * Digital Notice Board Functions (Notices Section - অপরিবর্তিত)
     * ================================= */
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDb_1xNjReWRzuQxMhdfBkJFwIXS9q3FkvrppjLXFFzfPdutarWlkIHmWw8aa6lvLzTQ/exec?action=read";
    const NOTICES_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 0;
    let Helping = []; // Notices ডেটা

    // Students এবং Forms সেকশনের ডেটা ও পেজিনেশন স্টেট রাখার জন্য অবজেক্ট
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
    if (!container) return console.error("Error: 'help-list' container not found.");
    container.innerHTML = ""; // ✅ এই লাইনটিই লোডিং মেসেজটি মুছে দেবে

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
            
            // 1. নোটিশ হেডিং (C কলাম)
            const titleText = item.text || "No Title";
            
            // 2. ডেট ফরম্যাট করা (B কলাম) - আপনার নতুন লজিক
            const dateText = item.date ? ` [Date: ${item.date}]` : ''; 
            
            const isItemNew = item.isNew === true;
            
            // 3. হেডিং এবং ডেট একসাথে করে itemContent তৈরি
            let itemContent = titleText + dateText; 
            
            if (isItemNew) {
                itemContent += ` <span class="new-badge">NEW</span>`; 
            }
             
            itemDiv.innerHTML = itemContent; // 4. DOM এ রেন্ডার

            
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
     * Students & Forms Section (Notices-এর স্টাইল ব্যবহার করে)
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
            
            const isItemNew = item.isNew === true;
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
     * Utility Functions
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

        const downloadBtn = createButton('Download', '#28a745', () => {
            setTimeout(() => {
                if (typeof html2canvas === 'function') {
                    html2canvas(popup).then(canvas => {
                        const image = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = image;
                        link.download = (titleText || 'notice') + '.png';
                        link.click();
                    });
                } else {
                    alert("Error: html2canvas library is not loaded for download function.");
                }
            }, 100);
        });

        const closeBtn = createButton('Back', '#dc3545', () => popup.remove());

        buttonContainer.append(downloadBtn, closeBtn); 
        popup.appendChild(buttonContainer);
        document.body.appendChild(popup);
    }

    // ডাইনামিক কন্টেন্ট লোড হওয়ার পর More/Less বোতাম চেক করার জন্য নতুন ফাংশন
    function updateMoreLessButton(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const sectionContentWrapper = section.querySelector('.section-content-wrapper');
        const button = section.querySelector('.toggle-button');
        
        if (!sectionContentWrapper || !button) return;

        // ডেটা লোড হওয়ার পরে DOM রেন্ডার নিশ্চিত করতে একটি ছোট ডিলে দেওয়া হলো
        setTimeout(() => {
            // যদি স্ক্রল করার মতো কন্টেন্ট না থাকে, তবে বোতামটি লুকিয়ে ফেলা হবে
            if (sectionContentWrapper.scrollHeight <= sectionContentWrapper.clientHeight) {
                button.style.display = 'none';
            } else {
                button.style.display = 'block'; // কন্টেন্ট থাকলে বোতামটি দেখানো হবে
                button.textContent = 'More...'; // নিশ্চিত করা হলো যে প্রাথমিক লেখাটি 'More...'
                sectionContentWrapper.classList.remove('expanded'); // নিশ্চিত করা হলো যে প্রাথমিক অবস্থায় কলাপসড আছে
            }
        }, 50); // ছোট ডিলে (50ms)

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
    // ✅ ফিক্স: ডেটা লোডিং এখন সঠিকভাবে কাজ করবে
    fetchNotices(); // Notices সেকশন
    fetchDynamicSectionData('students-list'); // Students সেকশন
    fetchDynamicSectionData('forms-list'); // Forms সেকশন
    
}); // ✅ এই বন্ধনীটি নিশ্চিত করে যে সমস্ত কোড DOMContentLoaded এর স্কোপের মধ্যে আছে।
