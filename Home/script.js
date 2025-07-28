
// ✅ মেনু খোলা ও বন্ধ করা
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ✅ বাইরে ক্লিক করলে মেনু লুকানো
document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target) && event.target !== menuToggle) {
    sidebar.classList.remove("open");
  }
});

// ✅ একটি মেনু খুললে অন্যগুলো বন্ধ হবে
function toggleMenu(element) {
  const allSubmenus = document.querySelectorAll(".submenu");
  allSubmenus.forEach((menu) => {
    if (menu !== element.querySelector(".submenu")) {
      menu.style.display = "none";
    }
  });

  const submenu = element.querySelector(".submenu");
  if (submenu) {
    submenu.style.display = submenu.style.display === "block" ? "none" : "block";
  }
}

// ✅ ড্যাশবোর্ড কনটেন্ট লোডার
function loadContent(page) {
  const contentArea = document.getElementById("main-content");
  let content = "";

  if (page === "notice") {
    content = "<h2>Upload Student Notice</h2><p>এখানে নোটিশ আপলোড ফর্ম থাকবে।</p>";
  } else if (page.startsWith("class")) {
    content = `<h2>Marks Upload - ${page.toUpperCase()}</h2><p>এই অংশে মার্কস আপলোড ফর্ম থাকবে ${page.toUpperCase()} ক্লাসের জন্য।</p>`;
  }

  contentArea.innerHTML = content;
  sidebar.classList.remove("open"); // ✅ মেনু লুকানো
}

// ✅ ড্যাশবোর্ডে ক্লিক করলে পূর্বাবস্থা
function resetDashboard() {
  const contentArea = document.getElementById("main-content");
  contentArea.innerHTML = `
    <h2>ড্যাশবোর্ডে স্বাগতম!</h2>
    <p>মেনু থেকে একটি অপশন সিলেক্ট করুন।</p>`;
  sidebar.classList.remove("open");
}
