// DOMContentLoaded ইভেন্টের জন্য অপেক্ষা করুন যাতে HTML পুরোপুরি লোড হয়
document.addEventListener('DOMContentLoaded', async () => {
    // DOM উপাদানগুলি ক্যাশ করুন
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content');
    const mainMenuItems = document.getElementById('mainMenuItems');
    const masterLoginOverlay = document.getElementById('masterLoginOverlay');

    let menuData = {}; // config.json থেকে লোড হওয়া মেনু ডেটা রাখার জন্য
    let masterCredentials = {}; // masterConfig.json থেকে লোড হওয়া মাস্টার লগইন ডেটা

    // --- ফাইল লোডিং ফাংশন ---

    // masterConfig.json ফাইল লোড করার ফাংশন (মাস্টার লগইনের জন্য)
    async function getMasterCredentials() {
        try {
            const response = await fetch('masterConfig.json');
            if (!response.ok) {
                throw new Error('Failed to load master config');
            }
            masterCredentials = await response.json();
            console.log('Master config loaded successfully:', masterCredentials);
            return masterCredentials;
        } catch (error) {
            console.error('Error fetching master config:', error);
            return null;
        }
    }

    // config.json ফাইল লোড করার ফাংশন (শিক্ষকদের এক্সাম লিঙ্কের জন্য)
    async function loadTeacherExamLinksConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            menuData.teacherExams = await response.json(); // শিক্ষকদের এক্সাম ডেটা 'teacherExams' প্রপার্টিতে রাখব
            console.log('Teacher exam config loaded successfully:', menuData.teacherExams);
        } catch (error) {
            console.error('Error loading teacher exam config.json:', error);
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Error loading teacher exam data!</h2><p>Please try again later.</p>`;
        }
    }

    // config_student.json ফাইল লোড করার ফাংশন (শিক্ষার্থীদের এক্সাম লিঙ্কের জন্য)
    async function loadStudentExamLinksConfig() {
        try {
            const response = await fetch('config_student.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            menuData.studentExams = await response.json(); // শিক্ষার্থীদের এক্সাম ডেটা 'studentExams' প্রপার্টিতে রাখব
            console.log('Student exam config loaded successfully:', menuData.studentExams);
        } catch (error) {
            console.error('Error loading student exam config.json:', error);
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Error loading student exam data!</h2><p>Please try again later.</p>`;
        }
    }

    // files.json ফাইল লোড করার ফাংশন (নোটিশ এবং হেল্প লিঙ্কের জন্য)
    async function loadFilesConfig() {
        try {
            const response = await fetch('files.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            menuData.files = await response.json(); // ফাইল ডেটা 'files' প্রপার্টিতে রাখব
            console.log('Files config loaded successfully:', menuData.files);
        } catch (error) {
            console.error('Error loading files.json:', error);
            // এখানে ব্যবহারকারীকে একটি ত্রুটি বার্তা দেখানো যেতে পারে
        }
    }

    // হোম পপ-আপের ডেটা লোড করার ফাংশন
    async function loadHomePopupData() {
        try {
            const response = await fetch('home_popup.json');
            if (!response.ok) {
                throw new Error('নেটওয়ার্ক রেসপন্স ঠিক ছিল না ' + response.statusText);
            }
            return await response.json();
        } catch (error) {
            console.error('পপ-আপ ডেটা লোড করতে সমস্যা হয়েছে:', error);
            return null;
        }
    }

    // --- মাস্টার লগইন লজিক ---

    // মাস্টার লগইন সাবমিট ফাংশন
    window.submitMasterLogin = async function() {
        const type = document.getElementById('loginType').value;
        const id = document.getElementById('masterId').value.trim();
        const pass = document.getElementById('masterPass').value.trim();
        const errorDiv = document.getElementById('masterLoginError');
        const successDiv = document.getElementById('masterLoginSuccess');

        errorDiv.innerText = "";
        successDiv.innerText = "";
        successDiv.style.display = "none";
        
        if (!type || !id || !pass) {
            errorDiv.innerText = "Please select login type and fill ID & Password.";
            return;
        }

        const allCredentials = await getMasterCredentials();

        if (!allCredentials) {
            errorDiv.innerText = "Unable to load login configuration.";
            return;
        }

        const user = allCredentials[type.toLowerCase()];

        if (user && id === user.id && pass === user.pass) {
            sessionStorage.setItem("userType", type.toLowerCase());
            successDiv.innerText = "✔️ Login Successful.";
            successDiv.style.display = "block";

            setTimeout(() => {
                if (type.toLowerCase() === 'student') {
                    // স্টুডেন্ট লগইন হলে ড্যাশবোর্ড ও মেনু লোড করুন এবং স্টুডেন্ট এক্সাম লিঙ্ক লোড করুন
                    masterLoginOverlay.style.display = "none";
                    loadDashboard();
                    buildSidebarMenu(type.toLowerCase()); // স্টুডেন্ট মেনু তৈরি করুন
                    loadStudentExamLinks(); // শিক্ষার্থীদের পরীক্ষার ফলাফল লোড করুন
                } else if (type.toLowerCase() === 'teacher') {
                    // টিচার লগইন হলে ড্যাশবোর্ড ও মেনু লোড করুন এবং টিচার এক্সাম লিঙ্ক লোড করুন
                    masterLoginOverlay.style.display = "none";
                    loadDashboard();
                    buildSidebarMenu(type.toLowerCase()); // টিচার মেনু তৈরি করুন
                    loadExamLinks(); // শিক্ষকদের পরীক্ষার লিঙ্ক লোড করুন
                } else if (type.toLowerCase() === 'school') {
                    // স্কুল লগইন হলে ড্যাশবোর্ড ও মেনু লোড করুন (প্রয়োজন অনুযায়ী)
                    masterLoginOverlay.style.display = "none";
                    loadDashboard();
                    buildSidebarMenu(type.toLowerCase()); // স্কুল মেনু তৈরি করুন
                    // স্কুলের জন্য নির্দিষ্ট লোডিং ফাংশন থাকলে এখানে কল করুন
                } else {
                    // অন্য কোনো প্রকারের জন্য ডিফল্ট আচরণ
                    masterLoginOverlay.style.display = "none";
                    loadDashboard();
                    buildSidebarMenu(type.toLowerCase());
                }
            }, 1000); // 1 সেকেন্ড পর রিডাইরেক্ট
        } else {
            errorDiv.innerText = "Incorrect ID or Password!";
            errorDiv.style.color = "red";
        }
    };

    // --- সাইডবার ও কন্টেন্ট ম্যানেজমেন্ট লজিক ---

    // সাইডবার লুকানোর জন্য একটি ফাংশন
    const hideSidebar = () => {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    };

    // মেনু আইকন এবং সাইডবার আছে কিনা তা নিশ্চিত করা
    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', (event) => {
            sidebar.classList.toggle('active');
            event.stopPropagation();
        });

        document.body.addEventListener('click', (event) => {
            if (!sidebar.contains(event.target) && !menuIcon.contains(event.target)) {
                hideSidebar();
            }
        });

        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(hideSidebar, 100);
        });

        sidebar.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    // সাবমেনু এবং সাব-সাবমেনু টগলিং
    const toggleNestedMenu = (menuElement, allMenuSelector, arrowElement) => {
        document.querySelectorAll(allMenuSelector).forEach(menu => {
            if (menu !== menuElement) {
                menu.style.display = 'none';
                const associatedArrow = menu.previousElementSibling?.querySelector('.arrow');
                if (associatedArrow) {
                    associatedArrow.classList.remove('rotate-down');
                }
            }
        });

        menuElement.style.display = (menuElement.style.display === 'block') ? 'none' : 'block';

        if (arrowElement) {
            document.querySelectorAll('.arrow').forEach(arrow => {
                if (arrow !== arrowElement) {
                    arrow.classList.remove('rotate-down');
                }
            });
            arrowElement.classList.toggle('rotate-down');
        }
    };

    window.toggleSubmenu = function(id, element) {
        const submenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (submenu && arrow) {
            toggleNestedMenu(submenu, '.submenu', arrow);
        }
    };

    window.toggleSubsubmenu = function(id, element) {
        const subsubmenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (subsubmenu && arrow) {
            toggleNestedMenu(subsubmenu, '.subsubmenu', arrow);
        }
    };

    // কন্টেন্ট লোড করার ফাংশন
    const loadContentAndHideSidebar = (htmlContent, linkUrl = null) => {
        if (contentArea) {
            contentArea.classList.remove('animated');
            void contentArea.offsetWidth;

            if (linkUrl && typeof linkUrl === 'string' && linkUrl.trim() !== '') {
                window.open(linkUrl, '_blank');
                contentArea.innerHTML = `<h2 class="animated" style="color:#0066cc">Loading External Link...</h2><p>The requested page is opening in a new tab.</p>`;
            } else {
                contentArea.innerHTML = htmlContent;
            }

            contentArea.classList.add('animated');
        }
        hideSidebar();
    };

    window.loadDashboard = function() {
        const dashboardHtml = `<h2 class="animated">Welcome to Dashboard</h2><p>Select an option from the sidebar to view content.</p>`;
        loadContentAndHideSidebar(dashboardHtml);
    };

    // সাধারণ কন্টেন্ট লোড করার জন্য গ্লোবাল ফাংশন
    window.loadContent = function(sectionHeading, urlSource, urlKey = null) {
        let displayContent = `<h2 class="animated" style="color:#0066cc">${sectionHeading}</h2>`;
        let url = null;

        // সঠিক ডেটা সোর্স থেকে URL খোঁজা
        let currentLevel;
        if (urlSource === 'teacherExams' && menuData.teacherExams) {
            currentLevel = menuData.teacherExams;
        } else if (urlSource === 'studentExams' && menuData.studentExams) {
            currentLevel = menuData.studentExams;
        } else if (urlSource === 'files' && menuData.files) {
            currentLevel = menuData.files;
        } else {
            currentLevel = null;
        }
        
        if (currentLevel && urlKey) {
            const keys = urlKey.split('.');
            let tempUrl = currentLevel;
            for (const key of keys) {
                if (tempUrl && tempUrl[key]) {
                    tempUrl = tempUrl[key];
                } else {
                    tempUrl = null;
                    break;
                }
            }
            url = tempUrl;
        }

        if (url && typeof url === 'string' && url.trim() !== '') {
            loadContentAndHideSidebar(displayContent, url);
        } else {
            displayContent += `<div style="
                border: 2px solid #ff9999;
                background-color: #ffe6e6;
                color: #cc0000;
                font-size: 20px;
                font-weight: bold;
                padding: 10px;
                border-radius: 8px;
                text-align: center;
                max-width: 300px;
                margin: 20px auto;
            ">
                <strong> 🔔 Available Soon! 🔔 </strong><br> Please check back later for updates.
            </div>`;
            loadContentAndHideSidebar(displayContent);
        }
    };

    // --- এক্সাম লিঙ্ক লোড ও ডিসপ্লে (শিক্ষক ও শিক্ষার্থী উভয়ের জন্য) ---

    // শিক্ষকদের এক্সাম লিঙ্ক লোড
    window.loadExamLinks = function() {
        const userType = sessionStorage.getItem("userType");
        if (userType !== 'teacher' && userType !== 'school') { // শুধুমাত্র শিক্ষক বা স্কুল লগইন থাকলে দেখাবে
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Access Denied!</h2><p>Please login as a Teacher or School to view this section.</p>`;
            return;
        }

        if (!menuData.teacherExams) {
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Loading Exam Data...</h2><p>Please wait.</p>`;
            // যদি ডেটা লোড না হয় তাহলে আবার লোড করার চেষ্টা করবে
            loadTeacherExamLinksConfig().then(() => renderExamLinks(menuData.teacherExams, 'Teacher Exam Links'));
        } else {
            renderExamLinks(menuData.teacherExams, 'Teacher Exam Links');
        }
    };

    // শিক্ষার্থীদের এক্সাম লিঙ্ক লোড
    window.loadStudentExamLinks = function() {
        const userType = sessionStorage.getItem("userType");
        if (userType !== 'student' && userType !== 'school') { // শুধুমাত্র শিক্ষার্থী বা স্কুল লগইন থাকলে দেখাবে
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Access Denied!</h2><p>Please login as a Student or School to view this section.</p>`;
            return;
        }

        if (!menuData.studentExams) {
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Loading Student Exam Data...</h2><p>Please wait.</p>`;
            // যদি ডেটা লোড না হয় তাহলে আবার লোড করার চেষ্টা করবে
            loadStudentExamLinksConfig().then(() => renderExamLinks(menuData.studentExams, 'Student Exam Results'));
        } else {
            renderExamLinks(menuData.studentExams, 'Student Exam Results');
        }
    };

    // পরীক্ষা লিঙ্কগুলো রেন্ডার করার জন্য জেনেরিক ফাংশন
    function renderExamLinks(examData, title) {
        let examHtml = `<h2 class="animated">${title}</h2>`;
        
        if (!examData || Object.keys(examData).length === 0) {
            examHtml += `<p style="text-align: center; color: #555;">No exam links available.</p>`;
            loadContentAndHideSidebar(examHtml);
            return;
        }

        const classes = [...new Set(Object.keys(examData).map(k => k.split('_')[0]))].sort((a, b) => {
            const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            return order.indexOf(a) - order.indexOf(b);
        });

        classes.forEach(cls => {
            examHtml += `<div class="shaded-info-box">`;
            examHtml += `<h3 class="box-heading shine">CLASS ${cls}</h3>`;
            examHtml += `<div class="exam-buttons-group">`;

            const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
            exams.forEach(exam => {
                const key = `${cls}_${exam}`;
                if (examData[key] && examData[key].url) {
                    let label = exam;
                    switch (exam) {
                        case 'TEST': label = 'TEST EXAM'; break;
                        case 'SEM1': label = 'SEMESTER I'; break;
                        case 'SEM2': label = 'SEMESTER II'; break;
                        case '1ST': label = '1ST EXAM'; break; // Added for clarity if needed
                        case '2ND': label = '2ND EXAM'; break; // Added for clarity if needed
                        case '3RD': label = '3RD EXAM'; break; // Added for clarity if needed
                    }
                    if (examData[key].url.trim() !== '') {
                        examHtml += `<a href="${examData[key].url}" target="_blank" class="box-button exam-link">${label}</a>`;
                    } else {
                        examHtml += `<button class="box-button exam-link disabled-exam-link" onclick="showAvailableSoonMessage(this, '${label}')">${label}</button>`;
                    }
                }
            });
            examHtml += `</div>`; // Close exam-buttons-group
            examHtml += `</div>`; // Close shaded-info-box
        });
        loadContentAndHideSidebar(examHtml);
    }

    // "Available Soon" মেসেজ দেখানোর ফাংশন (পরীক্ষার লিংকের জন্য)
    window.showAvailableSoonMessage = function(element, examText) {
        // আগে থেকে কোনো বার্তা থাকলে সরাও
        const oldMsg = element.nextElementSibling;
        if (oldMsg && oldMsg.classList.contains('avail-msg')) {
            oldMsg.remove();
        }

        const msg = document.createElement('div');
        msg.className = 'avail-msg';
        msg.textContent = `🔔 ${examText} Available Soon 🔔`; // কোন পরীক্ষার জন্য মেসেজ দেখানো হচ্ছে তা উল্লেখ
        
        // বোতামের পরে মেসেজটি ইনসার্ট করুন
        element.parentNode.insertBefore(msg, element.nextSibling);

        // 3 সেকেন্ড পরে মুছে ফেল
        setTimeout(() => {
            msg.remove();
        }, 3000);
    };


    // --- নোটিশ এবং হেল্প লিঙ্ক লোড (JSON থেকে) ---
    function populateNoticeHelpLists(sectionHeading, items, isNotice = true) {
        let listHtml = `<h2 class="animated">${sectionHeading}</h2>`;
        if (!items || items.length === 0) {
            listHtml += `<p style="text-align: center; color: #555;">No items available.</p>`;
            loadContentAndHideSidebar(listHtml);
            return;
        }

        listHtml += `<ul class="notice-help-list">`;
        items.forEach(item => {
            const url = item.url && item.url.trim() !== '' ? item.url : '#';
            const target = item.url && item.url.trim() !== '' ? '_blank' : '_self';
            const clickHandler = item.url && item.url.trim() !== '' ? '' : `onclick="showAvailableSoonMessage(this, '${item.name}')"`;
            listHtml += `<li><a href="${url}" target="${target}" ${clickHandler}>${item.name} (${item.date})</a></li>`;
        });
        listHtml += `</ul>`;
        loadContentAndHideSidebar(listHtml);
    }

    // --- JSON ডেটা ব্যবহার করে সাইডবার মেনু তৈরি করার ফাংশন ---
    // userType প্যারামিটার যোগ করা হয়েছে যাতে বিভিন্ন ব্যবহারকারীর জন্য বিভিন্ন মেনু দেখানো যায়
    function buildSidebarMenu(userType = null) {
        mainMenuItems.innerHTML = ''; // বিদ্যমান মেনু আইটেমগুলো পরিষ্কার করুন

        let currentMenuItems = [];
        if (userType === 'teacher') {
            currentMenuItems = menuData.menuItems.filter(item => item.roles.includes('teacher'));
        } else if (userType === 'student') {
            currentMenuItems = menuData.menuItems.filter(item => item.roles.includes('student'));
        } else if (userType === 'school') {
            currentMenuItems = menuData.menuItems.filter(item => item.roles.includes('school'));
        } else {
            // যদি কোনো রোল না থাকে বা অজানা রোল হয়, তাহলে ডিফল্ট মেনু দেখাবে (যেমন নোটিশ, হেল্প)
            currentMenuItems = menuData.menuItems.filter(item => item.roles.includes('guest'));
        }

        currentMenuItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `${item.emoji || ''} ${item.name}`;

            if (item.submenu && item.submenu.length > 0) {
                li.innerHTML += ` <span class="arrow">▶️</span>`;
                li.onclick = () => window.toggleSubmenu(item.id, li);

                const submenuUl = document.createElement('ul');
                submenuUl.classList.add('submenu');
                submenuUl.id = item.id;

                item.submenu.forEach(subItem => {
                    const subLi = document.createElement('li');
                    subLi.innerHTML = `${subItem.emoji || ''} ${subItem.name}`;

                    if (subItem.subsubmenu && subItem.subsubmenu.length > 0) {
                        subLi.innerHTML += ` <span class="arrow">▶️</span>`;
                        subLi.onclick = () => window.toggleSubsubmenu(subItem.id, subLi);

                        const subsubmenuUl = document.createElement('ul');
                        subsubmenuUl.classList.add('subsubmenu');
                        subsubmenuUl.id = subItem.id;

                        subItem.subsubmenu.forEach(subsubItem => {
                            const subsubLi = document.createElement('li');
                            // বিশেষ ক্ষেত্রে (যেমন নোটিশ, হেল্প) জন্য আলাদা হ্যান্ডলিং
                            if (subsubItem.action === 'loadNoticeList') {
                                subsubLi.onclick = () => populateNoticeHelpLists('School Notices', menuData.files.notices, true);
                            } else if (subsubItem.action === 'loadHelpList') {
                                subsubLi.onclick = () => populateNoticeHelpLists('Help Documents', menuData.files.help, false);
                            } else if (subsubItem.action === 'loadTeacherExamLinks') {
                                subsubLi.onclick = () => loadExamLinks(); // শিক্ষকদের পরীক্ষার লিঙ্ক লোড হবে
                            } else if (subsubItem.action === 'loadStudentExamLinks') {
                                subsubLi.onclick = () => loadStudentExamLinks(); // শিক্ষার্থীদের পরীক্ষার লিঙ্ক লোড হবে
                            }
                            else {
                                subsubLi.onclick = () => window.loadContent(subsubItem.name, subsubItem.urlSource, subsubItem.urlKey);
                            }
                            subsubLi.innerHTML = `${subsubItem.emoji || ''} ${subsubItem.name}`;
                            subsubmenuUl.appendChild(subsubLi);
                        });
                        submenuUl.appendChild(subLi);
                        submenuUl.appendChild(subsubmenuUl);
                    } else {
                        // কোনো সাব-সাবমেনু না থাকলে সরাসরি কন্টেন্ট লোড করবে
                        if (subItem.action === 'loadNoticeList') {
                            subLi.onclick = () => populateNoticeHelpLists('School Notices', menuData.files.notices, true);
                        } else if (subItem.action === 'loadHelpList') {
                            subLi.onclick = () => populateNoticeHelpLists('Help Documents', menuData.files.help, false);
                        } else if (subItem.action === 'loadTeacherExamLinks') {
                            subLi.onclick = () => loadExamLinks();
                        } else if (subItem.action === 'loadStudentExamLinks') {
                            subLi.onclick = () => loadStudentExamLinks();
                        } else {
                            subLi.onclick = () => window.loadContent(subItem.name, subItem.urlSource, subItem.urlKey);
                        }
                        submenuUl.appendChild(subLi);
                    }
                });
                mainMenuItems.appendChild(li);
                mainMenuItems.appendChild(submenuUl);
            } else {
                // কোনো সাবমেনু না থাকলে সরাসরি কন্টেন্ট লোড করবে
                if (item.action === 'loadNoticeList') {
                    li.onclick = () => populateNoticeHelpLists('School Notices', menuData.files.notices, true);
                } else if (item.action === 'loadHelpList') {
                    li.onclick = () => populateNoticeHelpLists('Help Documents', menuData.files.help, false);
                } else if (item.action === 'loadTeacherExamLinks') {
                    li.onclick = () => loadExamLinks();
                } else if (item.action === 'loadStudentExamLinks') {
                    li.onclick = () => loadStudentExamLinks();
                } else {
                    li.onclick = () => window.loadContent(item.name, item.urlSource, item.urlKey);
                }
                mainMenuItems.appendChild(li);
            }
        });
    }

    // --- ওয়েলকাম পপ-আপ লজিক ---
    // (এই অংশটি অপরিবর্তিত আছে যদি না আপনি এটি সরাতে বা পরিবর্তন করতে চান)
    async function showWebsiteWelcomePopup() {
        const popupData = await loadHomePopupData();
        if (!popupData) return;

        const welcomePopup = document.getElementById('websiteWelcomePopup');
        const popupTitleElement = document.getElementById('popupTitle');
        const popupMessageElement = document.getElementById('popupMessage');
        const downloadButton = document.getElementById('downloadPopupButton');
        const closeButton = document.getElementById('closePopupButton');

        if (popupTitleElement && popupData.popup_title) {
            popupTitleElement.textContent = popupData.popup_title;
        }

        if (popupMessageElement) {
            popupMessageElement.innerHTML = '';
            if (Array.isArray(popupData.popup_message)) {
                popupData.popup_message.forEach(paragraphText => {
                    const p = document.createElement('p');
                    p.textContent = paragraphText;
                    popupMessageElement.appendChild(p);
                });
            } else if (typeof popupData.popup_message === 'string') {
                popupMessageElement.innerHTML = popupData.popup_message;
            }
        }

        if (welcomePopup) {
            welcomePopup.style.display = 'flex';
        }

        if (closeButton) {
            closeButton.addEventListener('click', closeWebsiteWelcomePopup);
        }

        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                if (welcomePopup) {
                    downloadPopupAsJpg(welcomePopup);
                }
            });
        }
    }

    function closeWebsiteWelcomePopup() {
        const welcomePopup = document.getElementById('websiteWelcomePopup');
        if (welcomePopup) {
            welcomePopup.style.display = 'none';
        }
    }

    // `html2canvas` লাইব্রেরি প্রয়োজন হবে
    // <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
    async function downloadPopupAsJpg(popupElement) {
        try {
            const canvas = await html2canvas(popupElement);
            const dataURL = canvas.toDataURL('image/jpeg');

            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'popup_message.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            closeWebsiteWelcomePopup();

        } catch (error) {
            console.error('পপ-আপ ডাউনলোড করতে সমস্যা:', error);
        }
    }

    // --- ইনিশিয়ালাইজেশন ---
    // পেজ লোড হওয়ার সাথে সাথে সমস্ত কনফিগারেশন লোড করুন
    await Promise.all([
        getMasterCredentials(),
        loadTeacherExamLinksConfig(),
        loadStudentExamLinksConfig(),
        loadFilesConfig()
    ]);

    // ডিফল্টভাবে মাস্টার লগইন ওভারলে দেখান
    masterLoginOverlay.style.display = 'flex';

    // ইউজার টাইপ সেশনস্টোরেজে থাকলে সেই অনুযায়ী মেনু তৈরি করুন
    const storedUserType = sessionStorage.getItem("userType");
    if (storedUserType) {
        masterLoginOverlay.style.display = "none"; // যদি সেশনে লগইন থাকে তাহলে ওভারলে লুকান
        loadDashboard();
        buildSidebarMenu(storedUserType);
        // যদি শিক্ষক বা ছাত্র লগইন থাকে, তাদের সংশ্লিষ্ট পরীক্ষার লিঙ্ক লোড করুন
        if (storedUserType === 'teacher') {
            loadExamLinks();
        } else if (storedUserType === 'student') {
            loadStudentExamLinks();
        }
    }
});
