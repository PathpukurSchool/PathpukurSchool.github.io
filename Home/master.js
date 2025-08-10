// master.js

document.addEventListener('DOMContentLoaded', () => {
    // JSON ফাইল থেকে ডেটা লোড করার ফাংশন
    fetch('master.json')
        .then(response => response.json())
        .then(data => {
            // CSS ভেরিয়েবল সেট করা হয়েছে থিমের জন্য
            document.documentElement.style.setProperty('--primary-color', data.themeColor);

            // লোগো এবং স্কুলের নাম সেট করা হয়েছে
            document.getElementById('school-logo').src = data.schoolLogoUrl;
            document.getElementById('school-name').textContent = data.schoolName;

            // ফুটার টেক্সট সেট করা হয়েছে
            document.getElementById('footer-text').textContent = data.footerText;

            // মেনু এবং সাব-মেনু তৈরি করার ফাংশন
            const mainMenu = document.getElementById('main-menu');
            const mainContentContainer = document.getElementById('main-content-container');

            data.menu.forEach(menuItemData => {
                const menuItem = document.createElement('li');
                menuItem.className = 'menu-item';
                menuItem.textContent = menuItemData.title;

                // মেনুতে ক্লিক করলে হাইলাইট হবে
                menuItem.addEventListener('click', () => {
                    handleMenuClick(menuItem, menuItemData.sectionId);
                });

                // সাব-মেনু তৈরি করা
                if (menuItemData.subMenu.length > 0) {
                    const subMenu = document.createElement('ul');
                    subMenu.className = 'sub-menu';

                    menuItemData.subMenu.forEach(subMenuItemData => {
                        const subMenuItem = document.createElement('li');
                        subMenuItem.className = 'sub-menu-item';
                        subMenuItem.textContent = subMenuItemData.title;

                        // সাব-মেনুতে ক্লিক করলে নির্দিষ্ট সেকশনে যাবে
                        subMenuItem.addEventListener('click', (event) => {
                            event.stopPropagation(); // উপরের মেনু আইটেমের ক্লিক বন্ধ করতে
                            handleSubMenuClick(subMenuItem, subMenuItemData.sectionId, subMenuItemData.url);
                            subMenu.style.display = 'none'; // ক্লিক করার পর সাব-মেনু লুকানো
                        });
                        subMenu.appendChild(subMenuItem);
                    });
                    menuItem.appendChild(subMenu);
                }
                mainMenu.appendChild(menuItem);
            });

            // সেকশন তৈরি করার ফাংশন
            data.menu.forEach(menuItemData => {
                const section = document.createElement('section');
                section.id = menuItemData.sectionId;
                section.className = 'section';

                const sectionTitle = document.createElement('h2');
                sectionTitle.textContent = menuItemData.title;
                section.appendChild(sectionTitle);

                // সাব-মেনুর কন্টেন্ট (বোতাম) তৈরি করা
                if (menuItemData.subMenu.length > 0) {
                    menuItemData.subMenu.forEach(subMenuItemData => {
                        const subSection = document.createElement('div');
                        subSection.id = subMenuItemData.sectionId;

                        const subSectionTitle = document.createElement('h3');
                        subSectionTitle.textContent = subMenuItemData.title;
                        subSection.appendChild(subSectionTitle);

                        // বোতাম তৈরি করা
                        if (subMenuItemData.buttons) {
                            const buttonContainer = document.createElement('div');
                            buttonContainer.className = 'button-container';
                            subMenuItemData.buttons.forEach(buttonData => {
                                const btn = document.createElement('a');
                                btn.className = 'btn';
                                btn.textContent = buttonData.text;
                                btn.href = (buttonData.url === "Available Soon") ? '#' : buttonData.url;
                                if (buttonData.url === "Available Soon") {
                                    btn.classList.add('disabled');
                                } else {
                                    btn.target = '_blank';
                                }
                                buttonContainer.appendChild(btn);
                            });
                            subSection.appendChild(buttonContainer);
                        }
                        section.appendChild(subSection);
                    });
                }
                mainContentContainer.appendChild(section);
            });

            // লাস্ট ডেট সেকশন তৈরি করা
            const lastDatesSection = document.createElement('div');
            lastDatesSection.className = 'last-dates';
            lastDatesSection.id = 'last-dates-section';
            const lastDatesTitle = document.createElement('h2');
            lastDatesTitle.textContent = 'Marks Submission Last Dates';
            lastDatesSection.appendChild(lastDatesTitle);
            
            // JSON থেকে ডেট ডেটা লোড করা
            data.lastDates.forEach(dateData => {
                if (dateData.date) { // যদি ডেট থাকে তবেই দেখাবে
                    const p = document.createElement('p');
                    p.innerHTML = `<span class="highlight-date">${dateData.text}:</span> ${dateData.date}`;
                    lastDatesSection.appendChild(p);
                }
            });
            mainContentContainer.insertBefore(lastDatesSection, mainContentContainer.firstChild);

            // মেনু, সাব-মেনু এবং ওয়েব পেজের ফাঁকা অংশে ক্লিক করলে সাব-মেনু লুকিয়ে যাবে
            document.body.addEventListener('click', (event) => {
                const subMenus = document.querySelectorAll('.sub-menu');
                subMenus.forEach(subMenu => {
                    const parentMenu = subMenu.closest('.menu-item');
                    if (!parentMenu.contains(event.target)) {
                        subMenu.style.display = 'none';
                    }
                });
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // হাইলাইটিং এবং স্ক্রলিং এর জন্য ফাংশন
    let lastActiveElements = {
        menuItem: null,
        subMenuItem: null,
        section: null
    };

    function handleMenuClick(menuItem, sectionId) {
        // আগের হাইলাইটগুলো সরিয়ে ফেলা
        removeHighlights();

        // নতুন মেনু আইটেম হাইলাইট করা
        menuItem.classList.add('highlight');
        lastActiveElements.menuItem = menuItem;

        // সাব-মেনু দেখানো বা লুকানো
        const subMenu = menuItem.querySelector('.sub-menu');
        if (subMenu) {
            subMenu.style.display = subMenu.style.display === 'block' ? 'none' : 'block';
        }
    }

    function handleSubMenuClick(subMenuItem, sectionId, url) {
        // আগের হাইলাইটগুলো সরিয়ে ফেলা
        removeHighlights();

        // নতুন সাব-মেনু এবং তার মূল মেনু হাইলাইট করা
        subMenuItem.classList.add('highlight');
        subMenuItem.closest('.menu-item').classList.add('highlight');
        lastActiveElements.subMenuItem = subMenuItem;
        lastActiveElements.menuItem = subMenuItem.closest('.menu-item');

        // নির্দিষ্ট সেকশনে স্ক্রল করা
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('highlight');
            lastActiveElements.section = targetSection;
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // যদি URL থাকে তাহলে নতুন ট্যাবে খোলা
        if (url && url !== "Available Soon" && url !== '#') {
            window.open(url, '_blank');
        }
    }

    function removeHighlights() {
        if (lastActiveElements.menuItem) {
            lastActiveElements.menuItem.classList.remove('highlight');
        }
        if (lastActiveElements.subMenuItem) {
            lastActiveElements.subMenuItem.classList.remove('highlight');
        }
        if (lastActiveElements.section) {
            lastActiveElements.section.classList.remove('highlight');
        }
    }
});
