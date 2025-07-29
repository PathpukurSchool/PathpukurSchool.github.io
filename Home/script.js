
// মেনু টগল করে সাইডবার খোলা/বন্ধ
function toggleMenu(icon) {
  icon.classList.toggle('open');
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// সাবমেনু বা উপমেনু খুলতে
function toggleSubMenu(element) {
  const submenu = element.nextElementSibling;
  if (!submenu || !submenu.classList.contains('submenu')) return;

  const allSubmenus = document.querySelectorAll(".submenu");
  allSubmenus.forEach(sub => {
    if (sub !== submenu) sub.style.display = "none";
  });

  submenu.style.display = submenu.style.display === "block" ? "none" : "block";

  // লোকাল স্টোরেজে খোলা মেনু মনে রাখে
  localStorage.setItem("lastOpenMenu", element.innerText.trim());
}

// লোকাল স্টোরেজ থেকে মেনু restore করে
window.onload = () => {
  const last = localStorage.getItem("lastOpenMenu");
  if (last) {
    const items = document.querySelectorAll(".menu-item");
    items.forEach(item => {
      if (item.innerText.trim() === last) {
        toggleSubMenu(item);
      }
    });
  }
};

// সাবমেনু ক্লিকে ড্যাশবোর্ড কনটেন্ট লোড
function loadContent(section) {
  const content = document.getElementById("content");
  content.innerHTML = `<h2>${section}</h2><p>${section} এর কনটেন্ট এখানে লোড হয়েছে।</p>`;
}
