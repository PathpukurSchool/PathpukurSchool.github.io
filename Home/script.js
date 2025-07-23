
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
    async function loadConfigData() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            menuData = await response.json(); // সকল মেনু ও URL ডেটা menuData ভেরিয়েবলে রাখব
            console.log('Config data loaded successfully:', menuData);
        } catch (error) {
            console.error('Error loading config.json:', error);
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Error loading essential data!</h2><p>Please try again later.</p>`;
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
                masterLoginOverlay.style.display = "none";
                loadDashboard();
                buildSidebarMenu(type.toLowerCase()); // ইউজার টাইপ অনুযায়ী মেনু তৈরি করুন
                
                // লগইন এর উপর ভিত্তি করে প্রাথমিক কন্টেন্ট লোড করুন
                if (type.toLowerCase() === 'teacher') {
                    // শিক্ষকদের জন্য এক্সাম লিঙ্ক লোড করুন (যদি থাকে)
                    const teacherExamLink = menuData.menuItems.find(item => item.id === 'marksUploadVtoVIII')?.submenu.find(subItem => subItem.action === 'loadTeacherExamLinks');
                    if (teacherExamLink) {
                        loadContent(teacherExamLink.name, 'examLinks', teacherExamLink.urlKey);
                    } else {
                        loadDashboard(); // ডিফল্ট ড্যাশবোর্ড
                    }
                } else if (type.toLowerCase() === 'student') {
                    // শিক্ষার্থীদের জন্য এক্সাম লিঙ্ক লোড করুন (যদি থাকে)
                    const studentExamLink = menuData.menuItems.find(item => item.id === 'studentPanel')?.submenu.find(subItem => subItem.action === 'loadStudentExamLinks');
                    if (studentExamLink) {
                        loadContent(studentExamLink.name, 'examLinks', studentExamLink.urlKey);
                    } else {
                        loadDashboard(); // ডিফল্ট ড্যাশবোর্ড
                    }
                } else {
                    loadDashboard(); // অন্যথায় ড্যাশবোর্ড লোড করুন
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
            void contentArea.offsetWidth; // রিফ্লো ট্রিগার করার জন্য

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

    // জেনেরিক কন্টেন্ট লোড করার জন্য গ্লোবাল ফাংশন
    window.loadContent = function(sectionHeading, urlSourceKey, urlKey = null) {
        let displayContent = `<h2 class="animated" style="color:#0066cc">${sectionHeading}</h2>`;
        let url = null;

        // সঠিক ডেটা সোর্স থেকে URL খোঁজা
        // urlSourceKey: "examLinks", "notices", "routines", "studentInfo", "uploadStudentNotice"
        const sourceData = menuData[urlSourceKey];
        
        if (sourceData && urlKey) {
            // urlKey টি "class.exam" বা "category.item" ফরম্যাটে হতে পারে
            const keys = urlKey.split('.');
            let tempUrl = sourceData;
            for (const key of keys) {
                if (tempUrl && tempUrl[key]) {
                    tempUrl = tempUrl[key];
                } else {
                    tempUrl = null;
                    break;
                }
            }
            if (tempUrl && tempUrl.url) { // যদি অবজেক্টে url প্রপার্টি থাকে
                url = tempUrl.url;
            } else if (typeof tempUrl === 'string') { // যদি সরাসরি URL স্ট্রিং হয়
                url = tempUrl;
            }
        }

        if (url && typeof url === 'string' && url.trim() !== '') {
            loadContentAndHideSidebar(displayContent, url);
        } else if (urlSourceKey === 'examLinks') {
            // যদি এটি একটি এক্সাম লিঙ্ক হয় এবং URL না থাকে, তাহলে একটি সুন্দর বক্স দেখান
            displayContent += `<div class="shaded-info-box">
                                <h3 class="box-heading shine">🔔 Available Soon! 🔔</h3>
                                <p style="text-align: center; color: #555;">The ${sectionHeading} link is not available yet. Please check back later for updates.</p>
                                </div>`;
            loadContentAndHideSidebar(displayContent);
        }
        else {
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

    // পরীক্ষা লিঙ্কগুলো রেন্ডার করার জন্য জেনেরিক ফাংশন
    window.renderExamLinks = function(title) {
        const userType = sessionStorage.getItem("userType");
        if (userType !== 'teacher' && userType !== 'school' && userType !== 'student') { 
            contentArea.innerHTML = `<h2 class="animated" style="color:red;">Access Denied!</h2><p>Please login to view this section.</p>`;
            return;
        }

        const examData = menuData.examLinks; // config.json থেকে examLinks ডেটা নিন

        let examHtml = `<h2 class="animated">${title}</h2>`;
        
        if (!examData || Object.keys(examData).length === 0) {
            examHtml += `<p style="text-align: center; color: #555;">No exam links available.</p>`;
            loadContentAndHideSidebar(examHtml);
            return;
        }

        // ক্লাসগুলোকে নির্দিষ্ট ক্রমে সাজানো
        const classOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'AdmissionTest'];
        const classes = [...new Set(Object.keys(examData).map(k => k.split('_')[0]))]
                        .sort((a, b) => classOrder.indexOf(a) - classOrder.indexOf(b));

        classes.forEach(cls => {
            examHtml += `<div class="shaded-info-box">`;
            examHtml += `<h3 class="box-heading shine">CLASS ${cls.replace(/([A-Z])/g, ' $1').trim()}</h3>`; // AdmissionTest কে Admission Test এ পরিবর্তন
            examHtml += `<div class="exam-buttons-group">`;

            const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2', 'UPLOAD']; // "UPLOAD"Admission Test এর জন্য যোগ করা হয়েছে
            exams.forEach(exam => {
                const key = `${cls}_${exam}`;
                if (examData[key] && examData[key].url !== undefined) { // নিশ্চিত করুন যে 'url' প্রপার্টি বিদ্যমান
                    let label = exam;
                    switch (exam) {
                        case 'TEST': label = 'TEST EXAM'; break;
                        case 'SEM1': label = 'SEMESTER I'; break;
                        case 'SEM2': label = 'SEMESTER II'; break;
                        case '1ST': label = '1ST EXAM'; break;
                        case '2ND': label = '2ND EXAM'; break;
                        case '3RD': label = '3RD EXAM'; break;
                        case 'UPLOAD': label = 'UPLOAD MARKS'; break; // Admission Test এর জন্য
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


    // --- JSON ডেটা ব্যবহার করে সাইডবার মেনু তৈরি করার ফাংশন ---
    // userType প্যারামিটার যোগ করা হয়েছে যাতে বিভিন্ন ব্যবহারকারীর জন্য বিভিন্ন মেনু দেখানো যায়
    function buildSidebarMenu(userType = null) {
        mainMenuItems.innerHTML = ''; // বিদ্যমান মেনু আইটেমগুলো পরিষ্কার করুন

        let currentMenuItems = [];
        if (menuData.menuItems) {
            currentMenuItems = menuData.menuItems.filter(item => item.roles.includes(userType));
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
                            if (subsubItem.action === 'renderExamLinks') {
                                // Exam Links এর জন্য renderExamLinks ফাংশন কল করুন
                                subsubLi.onclick = () => window.renderExamLinks(subsubItem.name);
                            } else {
                                subsubLi.onclick = () => window.loadContent(subsubItem.name, subsubItem.urlSource, subsubItem.urlKey);
                            }
                            subsubLi.innerHTML = `${subsubItem.emoji || ''} ${subsubItem.name}`;
                            subsubmenuUl.appendChild(subsubLi);
                        });
                        submenuUl.appendChild(subLi);
                        submenuUl.appendChild(subsubmenuUl);
                    } else {
                        // কোনো সাব-সাবমেনু না থাকলে সরাসরি কন্টেন্ট লোড করবে
                        if (subItem.action === 'renderExamLinks') {
                            subLi.onclick = () => window.renderExamLinks(subItem.name);
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
                if (item.action === 'renderExamLinks') {
                    li.onclick = () => window.renderExamLinks(item.name);
                } else {
                    li.onclick = () => window.loadContent(item.name, item.urlSource, item.urlKey);
                }
                mainMenuItems.appendChild(li);
            }
        });
    }

    // --- ইনিশিয়ালাইজেশন ---
    // পেজ লোড হওয়ার সাথে সাথে সমস্ত কনফিগারেশন লোড করুন
    await Promise.all([
        getMasterCredentials(),
        loadConfigData()
    ]);

    // ডিফল্টভাবে মাস্টার লগইন ওভারলে দেখান
    masterLoginOverlay.style.display = 'flex';

    // ইউজার টাইপ সেশনস্টোরেজে থাকলে সেই অনুযায়ী মেনু তৈরি করুন
    const storedUserType = sessionStorage.getItem("userType");
    if (storedUserType) {
        masterLoginOverlay.style.display = "none"; // যদি সেশনে লগইন থাকে তাহলে ওভারলে লুকান
        loadDashboard();
        buildSidebarMenu(storedUserType);
    }
});
