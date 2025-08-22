document.addEventListener('DOMContentLoaded', function () {

    /* =================================
     * Digital Notice Board Functions
     * ================================= */
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBBTOstepckaJrKR2CYYlx4UACjeHajExLTA5tMpmiNcZrwT6XIUwc7l7_pIdHdFDT/exec?action=read";
    const NOTICES_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 0;
    let Helping = [];

    async function fetchNotices() {
        try {
            const response = await fetch(APPS_SCRIPT_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            Helping = Array.isArray(data.notices) ? data.notices : [];
            renderHelpList();
        } catch (error) {
            console.error("Failed to fetch notices:", error);
            const container = document.getElementById('help-list');
            if (container) {
                container.innerHTML = errorBox("Error!", "Failed to load notices.");
            }
        }
    }

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

    function createButton(text, bgColor, onClick, disabled = false) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.onclick = onClick;
        btn.disabled = disabled;
        btn.style.cssText = `
            padding: 8px 15px; margin: 0 5px;
            background-color: ${bgColor}; color: white;
            border: none; border-radius: 5px; cursor: pointer;
        `;
        return btn;
    }

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

        if (date) {
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
                html2canvas(popup).then(canvas => {
                    const image = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = 'notice.png';
                    link.click();
                });
            }, 100);
        });

        const closeBtn = createButton('Back', '#dc3545', () => popup.remove());

        buttonContainer.append(downloadBtn, closeBtn);
        popup.appendChild(buttonContainer);
        document.body.appendChild(popup);
    }

    /* =================================
     * Student Section Links Functions
     * ================================= */
    function loadStudentLinks() {
        fetch('index_link.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load student links configuration.');
                return response.json();
            })
            .then(data => {
                const links = {
                    'exam-marks-link': data['exam-marks-url'],
                    'student-code-link': data['student-code-url'],
                    'class-routine-link': data['class-routine-url'],
                    'exam-routine-link': data['exam-routine-url'],
                    'xi-tab-form-link': data['xi-tab-form-url'],
                    'student-info-link': data['student-info-url'],
                    'new-admission-link': data['new-admission-url']
                };

                for (const id in links) {
                    const url = links[id];
                    const linkElement = document.getElementById(id);
                    if (linkElement) {
                        if (url && url.trim() !== '') {
                            linkElement.href = url;
                            linkElement.target = '_blank';
                        } else {
                            linkElement.href = 'javascript:void(0)';
                            linkElement.classList.add('disabled-link');
                            linkElement.addEventListener('click', () => showAvailableSoonMessage(linkElement));
                        }
                    }
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function showAvailableSoonMessage(element) {
        const parentContainer = element.closest('.shaded-info-box');
        if (!parentContainer) return;
        const existingMessage = parentContainer.querySelector('.avail-msg');
        if (existingMessage) existingMessage.remove();
        const msg = document.createElement('div');
        msg.className = 'avail-msg';
        msg.textContent = '🔔 শীঘ্রই উপলব্ধ হবে 🔔';
        parentContainer.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
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

    // --- Menu Bar Logic ---
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

    // --- Gallery Fullscreen Logic ---
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
    fetchNotices();
    loadStudentLinks();
});
