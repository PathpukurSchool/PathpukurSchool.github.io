// master.js

document.addEventListener('DOMContentLoaded', () => {
    // JSON ফাইল থেকে ডেটা লোড করার ফাংশন
    fetch('master.json')
        .then(response => response.json())
        .then(data => {
            // CSS ভেরিয়েবল সেট করা হয়েছে থিমের জন্য
            document.documentElement.style.setProperty('--primary-color', data.themeColor);

            // ডেট ডেটা লোড করা
            const lastDatesContainer = document.getElementById('last-dates-container');
            data.lastDates.forEach(dateData => {
                if (dateData.date) { // যদি ডেট থাকে তবেই দেখাবে
                    const p = document.createElement('p');
                    p.innerHTML = `<span class="highlight-date">${dateData.text}:</span> ${dateData.date}`;
                    lastDatesContainer.appendChild(p);
                }
            });

            // বোতামগুলোতে URL সেট করা এবং "Available Soon" হ্যান্ডেল করা
            document.querySelectorAll('.btn').forEach(button => {
                const urlKey = button.getAttribute('data-url-key');
                const url = data.links[urlKey];

                if (url === 'Available Soon') {
                    button.classList.add('disabled');
                    button.textContent = button.textContent + " (Available Soon)";
                } else {
                    button.href = url;
                    button.target = '_blank';
                }
            });

            // সাব-মেনু আইটেমগুলোতে URL সেট করা
            document.querySelectorAll('.sub-menu-item').forEach(subMenuItem => {
                const urlKey = subMenuItem.getAttribute('data-url-key');
                if (urlKey) {
                    const url = data.links[urlKey];
                    subMenuItem.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (url && url !== 'Available Soon') {
                            window.open(url, '_blank');
                        }
                    });
                }
            });
        })
        .catch(error => console.error('Error fetching data:', error));

    // হাইলাইটিং এবং স্ক্রলিং এর জন্য ফাংশন
    let lastActiveElements = {
        menuItem: null,
        subMenuItem: null,
        section: null
    };

    // মেনু আইটেম ক্লিক হ্যান্ডলার
    document.querySelectorAll('.menu-item').forEach(menuItem => {
        menuItem.addEventListener('click', (event) => {
            removeHighlights();
            menuItem.classList.add('highlight');
            lastActiveElements.menuItem = menuItem;

            const subMenu = menuItem.querySelector('.sub-menu');
            if (subMenu) {
                subMenu.style.display = subMenu.style.display === 'block' ? 'none' : 'block';
            }

            // সেকশনে স্ক্রল করা
            const sectionId = menuItem.getAttribute('data-section-id');
            if (sectionId) {
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('highlight');
                    lastActiveElements.section = targetSection;
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // সাব-মেনু আইটেম ক্লিক হ্যান্ডলার
    document.querySelectorAll('.sub-menu-item').forEach(subMenuItem => {
        subMenuItem.addEventListener('click', (event) => {
            event.stopPropagation();
            removeHighlights();

            subMenuItem.classList.add('highlight');
            subMenuItem.closest('.menu-item').classList.add('highlight');
            lastActiveElements.subMenuItem = subMenuItem;
            lastActiveElements.menuItem = subMenuItem.closest('.menu-item');

            const sectionId = subMenuItem.getAttribute('data-section-id');
            if (sectionId) {
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('highlight');
                    lastActiveElements.section = targetSection;
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            
            // সাব-মেনু লুকানো
            subMenuItem.closest('.sub-menu').style.display = 'none';
        });
    });

    // ফাঁকা জায়গায় ক্লিক করলে মেনু লুকানো
    document.body.addEventListener('click', (event) => {
        const subMenus = document.querySelectorAll('.sub-menu');
        subMenus.forEach(subMenu => {
            const parentMenu = subMenu.closest('.menu-item');
            if (!parentMenu.contains(event.target)) {
                subMenu.style.display = 'none';
            }
        });
    });
    
    // হাইলাইট অপসারণ ফাংশন
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
