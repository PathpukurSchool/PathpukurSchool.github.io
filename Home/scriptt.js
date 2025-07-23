
// 🔵 মেনু বার টগল করা
const menuIcon = document.getElementById('menuIcon');
const sidebar = document.getElementById('sidebar');
menuIcon.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// 🔵 সাব মেনু টগল ফাংশন
function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  const allSubmenus = document.querySelectorAll('.submenu');
  allSubmenus.forEach(sm => { if(sm !== submenu) sm.style.display = 'none'; });
  submenu.style.display = (submenu.style.display === 'block') ? 'none' : 'block';
}

// 🔵 উপ মেনু টগল ফাংশন
function toggleSubsubmenu(id) {
  const subsubmenu = document.getElementById(id);
  const allSubsubmenus = document.querySelectorAll('.subsubmenu');
  allSubsubmenus.forEach(ssm => { if(ssm !== subsubmenu) ssm.style.display = 'none'; });
  subsubmenu.style.display = (subsubmenu.style.display === 'block') ? 'none' : 'block';
}

// 🔵 কন্টেন্ট লোড ফাংশন
function loadContent(text) {
  document.getElementById('content').innerHTML = `<h2>${text}</h2><p>${text} এর কন্টেন্ট এখানে লোড হবে।</p>`;
  sidebar.classList.remove('active'); // মেনু ক্লিকের পর sidebar hide হবে
}

// 🔵 ড্যাশবোর্ড টাইটেলে ক্লিক করলে হোম রিস্টোর
document.getElementById('dashboardTitle').addEventListener('click', () => {
  document.getElementById('content').innerHTML = `<h2>ড্যাশবোর্ডে স্বাগতম</h2><p>এখানে আপনার কন্টেন্ট লোড হবে।</p>`;
});

/* 🔵 🔶 🔴
✅ কাস্টমাইজ করার জন্য:
- logo.png পরিবর্তন করুন আপনার লোগো path অনুযায়ী।
- স্কুলের নাম <h1> এ বদলান।
- মেনু ও সাবমেনু এর লিস্ট পরিবর্তন করুন index.html এ।
- কালার পরিবর্তন করতে style.css এ background-color ও color প্রপার্টি পরিবর্তন করুন।
*/
