
document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content'); // Cache content area

    // Function to hide the sidebar
    const hideSidebar = () => {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    };

    // Toggle sidebar visibility
    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', (event) => {
            sidebar.classList.toggle('active');
            event.stopPropagation(); // Stop click event from bubbling up to document.body
        });

        // Hide sidebar when clicking outside
        document.body.addEventListener('click', (event) => {
            // Check if the click is outside the sidebar and not on the menu icon
            if (!sidebar.contains(event.target) && !menuIcon.contains(event.target)) {
                hideSidebar();
            }
        });

        // Hide sidebar on scroll
        // Using a throttled scroll listener for performance
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(hideSidebar, 100); // Adjust delay as needed
        });

        // Prevent sidebar clicks from closing the sidebar
        sidebar.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    // --- Submenu and Sub-submenu Toggling ---
    // General function for toggling nested menus
    const toggleNestedMenu = (menuElement, allMenuSelector, arrowElement) => {
        document.querySelectorAll(allMenuSelector).forEach(menu => {
            if (menu !== menuElement) {
                menu.style.display = 'none';
                // Find and remove 'rotate-down' from arrows of other menus
                const associatedArrow = menu.previousElementSibling?.querySelector('.arrow');
                if (associatedArrow) {
                    associatedArrow.classList.remove('rotate-down');
                }
            }
        });

        menuElement.style.display = (menuElement.style.display === 'block') ? 'none' : 'block';

        if (arrowElement) {
            // Remove 'rotate-down' from all arrows that are not the current one
            document.querySelectorAll('.arrow').forEach(arrow => {
                if (arrow !== arrowElement) {
                    arrow.classList.remove('rotate-down');
                }
            });
            arrowElement.classList.toggle('rotate-down');
        }
    };

    // Global function for submenu toggling
    window.toggleSubmenu = function(id, element) {
        const submenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (submenu && arrow) {
            toggleNestedMenu(submenu, '.submenu', arrow);
        }
    };

    // Global function for sub-submenu toggling
    window.toggleSubsubmenu = function(id, element) {
        const subsubmenu = document.getElementById(id);
        const arrow = element.querySelector('.arrow');
        if (subsubmenu && arrow) {
            toggleNestedMenu(subsubmenu, '.subsubmenu', arrow);
        }
    };

    // --- Content Loading Functions ---
    // Reusable function to load content and hide sidebar
    const loadContentAndHideSidebar = (htmlContent) => {
        if (contentArea) {
            contentArea.innerHTML = htmlContent;
        }
        hideSidebar();
    };

    // Global function to load dashboard content
    window.loadDashboard = function() {
        const dashboardHtml = `<h2 class="animated">ড্যাশবোর্ডে স্বাগতম</h2><p>এখানে আপনার কন্টেন্ট লোড হবে।</p>`;
        loadContentAndHideSidebar(dashboardHtml);
    };

    // Global function to load generic content
    window.loadContent = function(text) {
        const contentHtml = `<h2 class="animated" style="color:#0066cc">${text}</h2><p>${text} এর কন্টেন্ট এখানে লোড হবে।</p>`;
        loadContentAndHideSidebar(contentHtml);
    };
});
