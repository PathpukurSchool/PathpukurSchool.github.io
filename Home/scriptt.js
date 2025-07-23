
const menuIcon = document.getElementById('menuIcon');
const sidebar = document.getElementById('sidebar');

menuIcon.addEventListener('click', (event) => {
  sidebar.classList.toggle('active');
  event.stopPropagation(); // ক্লিক ইভেন্ট বুবলিং বন্ধ
});

// 🔵 যেকোনো ফাঁকা স্থানে ক্লিক করলে মেনু হাইড হবে
document.body.addEventListener('click', () => {
  sidebar.classList.remove('active');
});

// 🔵 বাম দিকে স্ক্রল করলে মেনু হাইড হবে
document.addEventListener('scroll', () => {
  sidebar.classList.remove('active');
});

sidebar.addEventListener('click', (event) => {
  event.stopPropagation(); // সাইডবারে ক্লিক করলে মেনু হাইড হবে না
});

// 🔵 সাবমেনু টগল + অ্যারো ঘুরানো
function toggleSubmenu(id, element) {
  const submenu = document.getElementById(id);
  const allSubmenus = document.querySelectorAll('.submenu');
  const allArrows = document.querySelectorAll('.submenu ~ li .arrow, li .arrow');

  allSubmenus.forEach(sm => { if(sm !== submenu) sm.style.display = 'none'; });
  submenu.style.display = (submenu.style.display === 'block') ? 'none' : 'block';

  // অ্যারো ঘুরানো
  const arrow = element.querySelector('.arrow');
  allArrows.forEach(a => { if(a !== arrow) a.classList.remove('rotate-down'); });
  arrow.classList.toggle('rotate-down');
}

// 🔵 উপমেনু টগল + অ্যারো ঘুরানো
function toggleSubsubmenu(id, element) {
  const subsubmenu = document.getElementById(id);
  const allSubsubmenus = document.querySelectorAll('.subsubmenu');
  const allArrows = document.querySelectorAll('.subsubmenu ~ li .arrow, li .arrow');

  allSubsubmenus.forEach(ssm => { if(ssm !== subsubmenu) ssm.style.display = 'none'; });
  subsubmenu.style.display = (subsubmenu.style.display === 'block') ? 'none' : 'block';

  // অ্যারো ঘুরানো
  const arrow = element.querySelector('.arrow');
  allArrows.forEach(a => { if(a !== arrow) a.classList.remove('rotate-down'); });
  arrow.classList.toggle('rotate-down');
}

// 🔵 ড্যাশবোর্ডে রিস্টোর
function loadDashboard() {
  document.getElementById('content').innerHTML = `<h2 class="animated">ড্যাশবোর্ডে স্বাগতম</h2><p>এখানে আপনার কন্টেন্ট লোড হবে।</p>`;
  sidebar.classList.remove('active');
}

// 🔵 কন্টেন্ট লোড
function loadContent(text) {
  document.getElementById('content').innerHTML = `<h2 class="animated" style="color:#0066cc">${text}</h2><p>${text} এর কন্টেন্ট এখানে লোড হবে।</p>`;
  sidebar.classList.remove('active');
}
