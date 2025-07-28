
// ✅ মেনু টগল করে সাইডবার দেখানো/লুকানো
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ✅ বাইরে ক্লিক করলে মেনু বন্ধ হবে
document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target) && event.target !== menuToggle) {
    sidebar.classList.remove("open");
  }
});

// ✅ মেনু ক্লিকে সাবমেনু টগল + আগের গুলো লুকানো
function toggleMenu(element) {
  const allMenus = document.querySelectorAll(".menu-item");
  const allSubmenus = document.querySelectorAll(".submenu");

  allMenus.forEach(menu => {
    if (menu !== element) {
      menu.classList.remove("active");
      const submenu = menu.querySelector(".submenu");
      if (submenu) submenu.style.display = "none";
    }
  });

  const submenu = element.querySelector(".submenu");
  if (submenu) {
    const isVisible = submenu.style.display === "block";
    submenu.style.display = isVisible ? "none" : "block";
    element.classList.toggle("active", !isVisible);
  }
}

// ✅ কনটেন্ট এরিয়ায় নতুন অংশ লোড
function loadContent(page) {
  const contentArea = document.getElementById("main-content");
  let content = "";

  if (page === "notice") {
    content = "<h2>Upload Student Notice</h2><p>এখানে নোটিশ আপলোড ফর্ম থাকবে।</p>";
  } else {
    content = `<h2>${page.replace('-', ' ').toUpperCase()}</h2><p>${page} সম্পর্কিত কনটেন্ট এখানে লোড হবে।</p>`;
  }

  contentArea.innerHTML = content;
  sidebar.classList.remove("open");
}

// ✅ ড্যাশবোর্ড ক্লিকে পূর্বাবস্থায় ফেরা
function resetDashboard() {
  const contentArea = document.getElementById("main-content");
  contentArea.innerHTML = `
    <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
    <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;
  sidebar.classList.remove("open");
}
