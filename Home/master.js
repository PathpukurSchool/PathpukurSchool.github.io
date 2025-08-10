/* ============================
   master.js
   বাংলা কমেন্ট: ডায়নামিক লজিক ও ইভেন্ট হ্যান্ডলার
   - JSON থেকে ডেট/লিংক লোড করবে
   - লগইন ভেলিডেশন করবে
   - মেনু ড্রপডাউন ও ক্লিক আউট হ্যান্ডল করবে
   - সেকশন হাইলাইটিং (active) করবে
   ============================ */

/* ---------------------------
   Helper: DOM Shortcuts
   --------------------------- */
const $ = id => document.getElementById(id);

/* ---------------------------
   ভ্যারিয়েবল ডিক্লেয়ার
   --------------------------- */
let data = null; // master.json ডেটা হবে এখানে
const loginOverlay = $('loginOverlay');
const loginSubmit = $('loginSubmit');
const loginCancel = $('loginCancel');
const loginMsg = $('loginMsg');
const loginId = $('loginId');
const loginPass = $('loginPass');
const mainContent = $('mainContent');
const footerText = $('footerText');
const logoImg = $('logoImg');
const schoolTitle = $('schoolTitle');
const schoolNameTop = $('schoolNameTop');

/* ---------------------------
   JSON লোড — master.json থেকে
   --------------------------- */
fetch('master.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    // স্কুল নাম সেট করা
    if (data.schoolName) {
      schoolTitle.textContent = data.schoolName;
      schoolNameTop.textContent = data.schoolName;
    }
    // লোগো থাকলে সেট করুন
    if (data.logo && data.logo.trim() !== '') {
      logoImg.src = data.logo;
      logoImg.style.display = 'block';
    } else {
      logoImg.style.display = 'none';
    }

    // ফুটা footer
    footerText.textContent = data.footer || '';

    // ডাইনামিক অংশ রেন্ডার করুন
    renderLastDates();
    renderClassButtons();
    renderOtherLinks();

  })
  .catch(err => {
    console.error("Failed to load master.json:", err);
    loginMsg.textContent = "Failed to load configuration.";
    loginMsg.style.color = "red";
  });



// =================== JSON লোড ও লগইন চেক ===================
let credentials = null; // master.json থেকে teacher data সংরক্ষণ
let schoolName = "";

// master.json লোড
fetch('master.json')
    .then(res => res.json())
    .then(data => {
        credentials = data.teacher;
        schoolName = data.schoolName || "School Name";
        document.getElementById('schoolName').textContent = schoolName;
    })
    .catch(err => {
        console.error("JSON Load Error:", err);
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
    });

// লগইন বাটনে ক্লিক হ্যান্ডলার
loginSubmit.addEventListener('click', () => {
    const idVal = loginId.value.trim();
    const passVal = loginPass.value.trim();

    // যদি JSON লোড না হয়
    if (!credentials) {
        loginMsg.textContent = "Configuration missing. Contact admin.";
        loginMsg.style.color = "red";
        return;
    }

    // ফাঁকা ইনপুট চেক
    if (!idVal || !passVal) {
        loginMsg.textContent = "Please enter ID and Password before submitting.";
        loginMsg.style.color = "red";
        return;
    }

    // সঠিক ID/Password চেক
    if (idVal === credentials.id && passVal === credentials.pass) {
        loginMsg.textContent = "Login Successful!";
        loginMsg.style.color = "green";
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            loginOverlay.setAttribute('aria-hidden', 'true');
            mainContent.setAttribute('aria-hidden', 'false');
            initMenuBehaviour();
            initSectionObserver();
        }, 600);
    } else {
        loginMsg.textContent = "Invalid ID or Password!";
        loginMsg.style.color = "red";
    }
});

// ক্যান্সেল বাটন
loginCancel.addEventListener('click', () => {
    window.history.back();
});

/* ---------------------------
   Render: Last Dates
   - যদি কোন ডেট খালি থাকে সেটা দেখাবেন না
   --------------------------- */
function renderLastDates() {
  const container = $('lastDatesContainer');
  if (!data || !data.lastDates) {
    container.innerHTML = '<div class="item">No date information</div>';
    return;
  }
  container.innerHTML = ''; // ক্লিয়ার

  const mapping = [
    {key: '1stExam', label: 'Last date of 1st exam'},
    {key: '2ndExam', label: 'Last date of 2nd exam'},
    {key: '3rdExam', label: 'Last date of 3rd exam'}
  ];

  mapping.forEach(m => {
    const val = (data.lastDates && data.lastDates[m.key]) ? data.lastDates[m.key].trim() : '';
    if (val) {
      // ডেট আছে — দেখাবে
      const div = document.createElement('div');
      div.className = 'item';
      div.textContent = `${m.label}: ${formatDate(val)}`;
      container.appendChild(div);
    }
  });

  // যদি একটাও না থাকে, পুরো কনটেইনার লুকিয়ে দিন
  if (container.children.length === 0) {
    container.style.display = 'none';
  } else {
    container.style.display = 'flex';
  }
}

/* ছোট হেল্পার: YYYY-MM-DD -> readable (Aug 20, 2025) */
function formatDate(iso) {
  try {
    const d = new Date(iso);
    // Options - ইংরেজি (আপনি চাইলে বাংলা ফরম্যাট করবেন)
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  } catch (e) {
    return iso;
  }
}

/* ---------------------------
   Render: Class Buttons (V..X)
   - links from data.links[class]
   - Missing link -> Available Soon (non-clickable)
   --------------------------- */
function renderClassButtons() {
  if (!data || !data.links) return;

  const classes = Object.keys(data.links); // যেমন: V, VI, VII...
  classes.forEach(cls => {
    const btnContainer = $('class' + cls + 'Buttons') || null;
    if (!btnContainer) return;

    // পরিষ্কার
    btnContainer.innerHTML = '';

    const exams = ['1st','2nd','3rd'];
    exams.forEach(ex => {
      const url = (data.links[cls] && data.links[cls][ex]) ? data.links[cls][ex].trim() : '';
      const a = document.createElement('a');
      a.className = 'exam-btn';
      a.textContent = `${ex} Exam`;
      if (url) {
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.addEventListener('click', () => setLastAction(`Opened ${cls} ${ex} Exam`));
      } else {
        // Available Soon
        a.classList.add('avail-soon');
        a.href = 'javascript:void(0)';
        a.addEventListener('click', () => {
          setLastAction(`${cls} ${ex} Exam — Available Soon`);
          // শর্ট পপআপ
          alert('Available Soon');
        });
      }
      btnContainer.appendChild(a);
    });
  });
}

/* ---------------------------
   Render: Other Links (routine/update notice)
   --------------------------- */
function renderOtherLinks() {
  if (!data || !data.otherLinks) return;

  // Student Routine
  const s = data.otherLinks.studentRoutine || '';
  const sEl = $('studentRoutineLink').querySelector('.linkText');
  if (s) {
    sEl.textContent = s;
    sEl.parentElement.href = s;
  } else {
    sEl.textContent = 'Available Soon';
  }

  const t = data.otherLinks.teacherRoutine || '';
  const tEl = $('teacherRoutineLink').querySelector('.linkText');
  if (t) {
    tEl.textContent = t;
  } else {
    tEl.textContent = 'Available Soon';
  }

  const c = data.otherLinks.classRoutine || '';
  const cEl = $('classRoutineLink').querySelector('.linkText');
  if (c) {
    cEl.textContent = c;
  } else {
    cEl.textContent = 'Available Soon';
  }

  const subj = data.otherLinks.subjectRoutine || '';
  const subjEl = $('subjectRoutineLink').querySelector('.linkText');
  subjEl.textContent = subj ? subj : 'Available Soon';

  const up = data.otherLinks.updateStudentNotice || '';
  const upEl = $('updateNoticeLink').querySelector('.linkText');
  upEl.textContent = up ? up : 'Available Soon';
}

/* ---------------------------
   Last action setter (sidebar)
   --------------------------- */
function setLastAction(text) {
  $('lastAction').textContent = text;
}

/* ---------------------------
   Menu behaviour:
   - Click টপ মেনু toggles submenu (CSS class .open)
   - Click আউটসাইড হলে সব বন্ধ হবে
   - ক্লিক করলে সাবমেনু আইটেম active হবে, সেকশনে স্ক্রল ও সেকশন হাইলাইট হবে
   --------------------------- */
function initMenuBehaviour() {
  const menus = document.querySelectorAll('.nav .menu');
  menus.forEach(menu => {
    const btn = menu.querySelector('button');
    const submenu = menu.querySelector('.submenu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // সব মেনু বন্ধ করে তারপর শুধু এটা টগল
      closeAllMenus();
      menu.classList.toggle('open');
      // active state for top button
      document.querySelectorAll('.nav .menu > button').forEach(b => b.classList.remove('active'));
      btn.classList.toggle('active');
    });

    // সাবমেনু লিংকগুলোর হ্যান্ডল
    if (submenu) {
      submenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          const targetId = a.dataset.target;
          const section = document.getElementById(targetId);
          if (section) {
            section.scrollIntoView({behavior:'smooth', block:'start'});
            // সাবমেনু active
            submenu.querySelectorAll('a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            // টপ বাটন active রিলেশনশিপ স্থাপন
            document.querySelectorAll('.nav .menu > button').forEach(b => b.classList.remove('active'));
            menu.querySelector('button').classList.add('active');
            setLastAction(`Navigated to ${targetId}`);
          }
          // সব মেনু বন্ধ
          closeAllMenus();
        });
      });
    }
  });

  // ক্লিক আউটসাইড হলে ক্লোজ
  document.addEventListener('click', () => {
    closeAllMenus();
  });

  // ESC চাপলে সব বন্ধ
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });
}
function closeAllMenus() {
  document.querySelectorAll('.nav .menu').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.nav .menu > button').forEach(b => b.classList.remove('active'));
}

/* ---------------------------
   Section highlight: IntersectionObserver ব্যবহার করে
   - ভিউতে আসলে .active ক্লাস যোগ হবে
   - মেনু আইটেমগুলিকে হাইলাইট করবে
   --------------------------- */
function initSectionObserver() {
  const sections = document.querySelectorAll('section.section');
  const options = { root: null, rootMargin: '0px', threshold: 0.45 };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // সমস্ত সেকশন থেকে active অপসারণ
        document.querySelectorAll('section.section').forEach(s => s.classList.remove('active'));
        entry.target.classList.add('active');

        // মেনু/সাবমেনু হাইলাইট করুন: find menu link that points to this id
        const id = entry.target.id;
        document.querySelectorAll('.submenu a').forEach(a => a.classList.toggle('active', a.dataset.target === id));

        // টপ বাটন highlight: যদি কোনো সাবমেনু আইটেম active থাকে, সেক্ষেত্রে তার parent মেনুটি active করা হবে
        document.querySelectorAll('.nav .menu > button').forEach(b => b.classList.remove('active'));
        const activeSub = document.querySelector(`.submenu a.active`);
        if (activeSub) {
          const parentMenu = activeSub.closest('.menu');
          if (parentMenu) parentMenu.querySelector('button').classList.add('active');
        }

        setLastAction(`Viewing ${id}`);
      }
    });
  }, options);

  sections.forEach(s => observer.observe(s));
}

/* ============================
   শেষ: পেজ লোড হয়ে গেলে কিছু ইনিশিয়ালাইজ
   কিন্তু লগইন সফল হলে initMenuBehaviour ও initSectionObserver চালানো হবে
   (login successful হলে overlay লুকানো হবে এবং মেনু কাজ করবে)
   ============================ */
document.addEventListener('DOMContentLoaded', () => {
  // আরেকটি usability: Enter চাপলে সাবমিট
  [loginId, loginPass].forEach(el => el && el.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') loginSubmit.click();
  }));
});
