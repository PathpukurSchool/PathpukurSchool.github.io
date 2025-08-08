let credentials = {};
let masterCredential = {};

// মাস্টার লগইনের তথ্য লোড
async function getCredentials() {
    try {
        const response = await fetch('masterConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching config:', error);
        return null;
    }
}

async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess'); // success ডিভ

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";
    
    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    const allCredentials = await getCredentials();

    if (!allCredentials) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = allCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        // Session set করুন
    sessionStorage.setItem("userType", type.toLowerCase());
            if (type.toLowerCase() === "student") {
        sessionStorage.setItem("studentLoggedIn", "true");
    }

        // সফল লগইন
        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else {
                // Teacher login successful – hide the login overlay
                document.getElementById('masterLoginOverlay').style.display = "none";
                loadExamLinks(); // মূল ডেটা লোড
            }
        }, 1000); // 1.5 সেকেন্ড পর রিডাইরেক্ট
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}

// এক্সাম লিংক লোড (মাস্টার লগইন সফল হলে)
function loadExamLinks() {
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            credentials = data;
            renderButtons();
        });
}

let currentKey = '';

// এক্সাম লিংক তৈরি ও দেখানো
function renderButtons() {
    const mainContainer = document.getElementById('exam-buttons');
    mainContainer.innerHTML = ''; // পূর্বের কন্টেন্ট পরিষ্কার করা

    // ইউনিক ক্লাস তালিকা তৈরি
    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];

    // ক্লাসগুলিকে একটি নির্দিষ্ট ক্রমে সাজানো যাতে V, VI, VII... XII পর্যন্ত আসে
    const sortedClasses = classes.sort((a, b) => {
        const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return order.indexOf(a) - order.indexOf(b);
    });

    sortedClasses.forEach(cls => {
        // প্রতিটি ক্লাসের জন্য একটি নতুন shaded-info-box তৈরি করা হচ্ছে
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box'; // CSS ক্লাস যা বক্সের স্টাইল দেবে

        // বক্সের হেডিং তৈরি করা হচ্ছে (ক্লাসের নাম)
        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading shine'; // CSS ক্লাস যা হেডিং এর স্টাইল দেবে
        boxHeading.textContent = 'CLASS ' + cls; // সরাসরি 'CLASS V', 'CLASS VI' ইত্যাদি হবে
        classBox.appendChild(boxHeading);

        // বোতামগুলির জন্য একটি কন্টেইনার তৈরি করা যাতে সেগুলো flexbox দিয়ে সাজানো যায়
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exam-buttons-group'; // নতুন ক্লাস, এর জন্য CSS লাগবে

        // প্রতিটি সম্ভাব্য পরীক্ষার প্রকারের জন্য বোতাম তৈরি
        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`; // যেমন: "V_1ST", "IX_TEST", "XII_SEM1"
            if (credentials[key]) { // যদি এই নির্দিষ্ট পরীক্ষার জন্য ডেটা config.json-এ থাকে
                const button = document.createElement('button');
                button.className = 'box-button exam-link'; // CSS ক্লাস যা বোতামের স্টাইল দেবে
                
                // বোতামের লেবেল নির্ধারণ
                let label = exam;
                switch (exam) {
                    case 'TEST':
                        label = 'TEST EXAM';
                        break;
                    case 'SEM1':
                        label = 'SEMESTER I';
                        break;
                    case 'SEM2':
                        label = 'SEMESTER II';
                        break;
                }
                
                button.textContent = label;
                // যদি URL না থাকে অথবা URL খালি হয়, তাহলে সরাসরি 'showAvailableSoonMessage' কল করব
                // অন্যথায়, সরাসরি লিংক খুলব
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => window.open(credentials[key].url, '_blank');
                } else {
                    button.onclick = () => showAvailableSoonMessage(key); // URL না থাকলে সরাসরি মেসেজ দেখাবে
                    button.classList.add('disabled-exam-link'); // ঐচ্ছিক: বোতামটি নিষ্প্রভ করতে একটি ক্লাস যোগ করুন
                }
                buttonsContainer.appendChild(button);
            }
        });
        
        // যদি কোন ক্লাসের জন্য কোন পরীক্ষার বোতাম না থাকে, তাহলে বক্সটি দেখাবে না
        if (buttonsContainer.children.length > 0) {
            classBox.appendChild(buttonsContainer); // বোতাম কন্টেইনারকে বক্সের মধ্যে যোগ করা
            mainContainer.appendChild(classBox); // ক্লাস বক্সকে মূল কন্টেইনারে যোগ করা
        }
    });
}

function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    const links = container.getElementsByClassName('exam-link');

    for (let link of links) {
        if (link.textContent === getExamText(key)) {
            // আগে থেকে কোন বার্তা থাকলে সরাও
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove();

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 Available Soon 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            // 3 সেকেন্ড পরে মুছে ফেল
            setTimeout(() => {
                msg.remove();
            }, 3000);

            break;
        }
    }
}

// পরীক্ষার টেক্সট ফেরত দেয় ('TEST EXAM', 'SEMESTER I', ...)
function getExamText(key) {
    const parts = key.split('_');
    const exam = parts[1];

    switch (exam) {
        case 'TEST':
            return 'TEST EXAM';
        case 'SEM1':
            return 'SEMESTER I';
        case 'SEM2':
            return 'SEMESTER II';
        case '1ST':
            return '1ST';
        case '2ND':
            return '2ND';
        case '3RD':
            return '3RD';
        default:
            return exam; // fallback
    }
}  

// NOTICE & HELP লোড করা
fetch('files.json')
    .then(response => response.json())
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    });

function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    items.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = `${item.name} (${item.date})`;
        a.target = '_blank';
        li.appendChild(a);
        ul.appendChild(li);
    });
}

// ওয়েলকাম পপ আপের জাভাস্ক্রিপ্ট কোড
document.addEventListener('DOMContentLoaded', function() {
    // JSON ফাইল থেকে ডেটা লোড করুন
    fetch('home_popup.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('নেটওয়ার্ক রেসপন্স ঠিক ছিল না ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // পপ-আপের শিরোনাম এবং বার্তা সেট করুন
            const popupTitleElement = document.getElementById('popupTitle');
            const popupMessageElement = document.getElementById('popupMessage');
            // বোতামগুলোর নতুন আইডি ব্যবহার করা হয়েছে
            const downloadButton = document.getElementById('downloadPopupButton'); // নতুন আইডি
            const closeButton = document.getElementById('closePopupButton');     // নতুন আইডি
            const welcomePopup = document.getElementById('websiteWelcomePopup');

            if (popupTitleElement && data.popup_title) {
                popupTitleElement.textContent = data.popup_title;
            }

            if (popupMessageElement && Array.isArray(data.popup_message)) {
                popupMessageElement.innerHTML = '';
                data.popup_message.forEach(paragraphText => {
                    const p = document.createElement('p');
                    p.textContent = paragraphText;
                    popupMessageElement.appendChild(p);
                });
            } else if (popupMessageElement && typeof data.popup_message === 'string') {
                popupMessageElement.innerHTML = data.popup_message;
            }

            // পপ-আপ দেখান
            if (welcomePopup) {
                welcomePopup.style.display = 'flex';
            }

            // ক্লোজ বাটনের কার্যকারিতা
            if (closeButton) {
                closeButton.addEventListener('click', closeWebsiteWelcomePopup);
            }

            // ডাউনলোড বাটনের কার্যকারিতা
            if (downloadButton) {
                downloadButton.addEventListener('click', () => {
                    if (welcomePopup) {
                        downloadPopupAsJpg(welcomePopup);
                    }
                });
            }
        })
        .catch(error => {
            console.error('পপ-আপ ডেটা লোড করতে সমস্যা হয়েছে:', error);
        });
});

function closeWebsiteWelcomePopup() {
    const welcomePopup = document.getElementById('websiteWelcomePopup');
    if (welcomePopup) {
        welcomePopup.style.display = 'none';
    }
}

// downloadPopupAsJpg ফাংশনটি অপরিবর্তিত থাকবে
async function downloadPopupAsJpg(popupElement) {
    try {
        const canvas = await html2canvas(popupElement);
        const dataURL = canvas.toDataURL('image/jpeg');

        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'popup_message.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        closeWebsiteWelcomePopup();

    } catch (error) {
        console.error('পপ-আপ ডাউনলোড করতে সমস্যা:', error);
    }
}

//Teacher Table Notice

let studentTableNotices = []; // JSON থেকে ডেটা লোড করার জন্য একটি খালি অ্যারে

// পেজ লোড হলে নোটিশ ডেটা লোড করুন
window.onload = () => {
    fetch('student_notices.json') // এখানে আপনার JSON ফাইলের নাম দিন
        .then(response => response.json())
        .then(data => {
            studentTableNotices = data.notices; // ধরে নিচ্ছি JSON ফাইলে 'notices' নামে একটি অ্যারে আছে
            renderNoticeTable(); // ডেটা লোড হওয়ার পর টেবিল রেন্ডার করা
        })
        .catch(error => {
            console.error('নোটিশ ডেটা লোড করতে সমস্যা হয়েছে:', error);
        });
};

function showPopup(titleText, date, link, subjText) {
// পপ-আপ কনটেইনার তৈরি
const popup = document.createElement('div');
popup.style.position = 'fixed';
popup.style.top = '50%';
popup.style.left = '50%';
popup.style.transform = 'translate(-50%, -50%)';
popup.style.background = '#f0f8ff'; // হালকা নীল
popup.style.padding = '20px';
popup.style.margin = '0 auto';        // সেন্টারে রাখবে
popup.style.border = '2px solid #333';
popup.style.borderRadius = '10px';
popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
popup.style.zIndex = '9999';
popup.style.textAlign = 'center';
popup.style.maxWidth = '90%'; // স্ক্রিনে overflow না হয়
popup.style.minWidth = '240px'; // খুব ছোট না হয়
popup.style.width = '300px'; // সর্বোচ্চ চওড়া
popup.style.fontFamily = 'Arial, sans-serif';
// হেডিং (Text) — বড়ো, সাদা, সবুজ ব্যাকগ্রাউন্ড
const titleElem = document.createElement('div');
titleElem.innerText = titleText;
titleElem.style.backgroundColor = 'green';
titleElem.style.color = 'white';
titleElem.style.fontWeight = 'bold';
titleElem.style.fontSize = '15px';
titleElem.style.padding = '10px';
titleElem.style.borderRadius = '5px';
titleElem.style.marginBottom = '15px';
popup.appendChild(titleElem);

// তারিখ (Date)
const dateElem = document.createElement('div');
dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
dateElem.style.marginBottom = '10px';
popup.appendChild(dateElem);

// subj থাকলে তা দেখাও — গাঢ় সবুজ রঙ, হালকা সবুজ ব্যাকগ্রাউন্ড, ছোট হরফে
if (subjText && subjText.trim() !== '') {
  const subjElem = document.createElement('div');
  subjElem.innerText = subjText;
  subjElem.style.color = 'darkgreen';
  subjElem.style.backgroundColor = '#e6ffe6'; // হালকা সবুজ
  subjElem.style.fontWeight = 'bold';
  subjElem.style.fontSize = '14px';
  subjElem.style.padding = '6px';
  subjElem.style.borderRadius = '4px';
  subjElem.style.marginBottom = '12px';
  popup.appendChild(subjElem);
}
// বোতাম কন্টেইনার
const buttonContainer = document.createElement('div');
buttonContainer.style.marginTop = '20px';
buttonContainer.style.display = 'flex';
buttonContainer.style.flexWrap = 'wrap';
buttonContainer.style.justifyContent = 'center';
buttonContainer.style.gap = '20px'; // বোতামের মাঝে দূরত্ব

// ফাইল খুলুন বোতাম লিঙ্ক থাকলে তা দেখাও
if (link && link.trim() !== '') {
  const linkBtn = document.createElement('a');
  linkBtn.href = link;
  linkBtn.innerText = 'Open Link';
  linkBtn.target = '_blank';
  linkBtn.style.backgroundColor = '#007bff';
  linkBtn.style.color = 'white';
  linkBtn.style.padding = '10px 16px';
  linkBtn.style.border = 'none';
  linkBtn.style.borderRadius = '5px';
  linkBtn.style.textDecoration = 'none';
  linkBtn.style.fontWeight = 'bold';
  linkBtn.style.fontSize = '12px'; // ছোট ফন্ট
  linkBtn.style.transition = 'background-color 0.3s';
  linkBtn.onmouseover = () => linkBtn.style.backgroundColor = '#0056b3';
  linkBtn.onmouseout = () => linkBtn.style.backgroundColor = '#007bff';
  buttonContainer.appendChild(linkBtn);
}

// ✅ PNG Download Button (fixed) যোগ করা হয়েছে
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download';
    downloadBtn.style.backgroundColor = '#28a745';
    downloadBtn.style.color = 'white';
    downloadBtn.style.padding = '6px 10px';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '5px';
    downloadBtn.style.fontWeight = 'bold';
    downloadBtn.style.fontSize = '12px'; // ছোট ফন্ট
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.onclick = () => {
        // Ensure reflow before capturing
        setTimeout(() => {
            html2canvas(popup).then(canvas => {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = 'notice.png';
                link.click();
            });
        }, 100); // slight delay for reflow
    };
    buttonContainer.appendChild(downloadBtn);

// বন্ধ করুন বোতাম
const closeBtn = document.createElement('button');
closeBtn.innerText = 'Back';
closeBtn.style.backgroundColor = '#dc3545';
closeBtn.style.color = 'white';
closeBtn.style.padding = '6px 10px';
closeBtn.style.border = 'none';
closeBtn.style.borderRadius = '5px';
closeBtn.style.fontWeight = 'bold';
closeBtn.style.fontSize = '12px'; // ছোট ফন্ট
closeBtn.style.cursor = 'pointer';
closeBtn.style.transition = 'background-color 0.3s';
closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#a71d2a';
closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#dc3545';
closeBtn.onclick = () => document.body.removeChild(popup);
buttonContainer.appendChild(closeBtn);

// পপআপে বোতাম কন্টেইনার যোগ করুন
popup.appendChild(buttonContainer);

  // স্ক্রিনে দেখাও
  document.body.appendChild(popup);
}

function closeModal() {
  document.getElementById('popupModal').style.display = 'none';
}

//স্টুডেন্ট নোটিশ টেবিল
    const noticesPerPage = 10;
    let currentPage = 1;

    function renderNoticeTable() {
      const container = document.getElementById('notice-board');
      container.innerHTML = "";

      const start = (currentPage - 1) * noticesPerPage;
      const end = start + noticesPerPage;
      const paginatedNotices = studentTableNotices.slice(start, end);

      const table = document.createElement('table');
      table.id = 'notice-table';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>তারিখ</th>
          <th>বিষয়বস্তু</th>
          <th>বিজ্ঞপ্তি</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      paginatedNotices.forEach(notice => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td>${notice.date}</td>
          <td style="color: ${notice.color || '#000'};">${notice.text}</td>
<td>
  <button onclick="showPopup('${notice.text}', '${notice.date}', '${notice.link || ''}', '${notice.subj || ''}')" 
          onmouseover="this.style.opacity=0.8" 
          onmouseout="this.style.opacity=1">
    View
  </button>
</td>
        `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      container.appendChild(table);

      const totalPages = Math.ceil(studentTableNotices.length / noticesPerPage);
      document.getElementById('pageNumber').textContent = `Page ${currentPage} of ${totalPages}`;
      document.getElementById('prevBtn').disabled = currentPage === 1;
      document.getElementById('nextBtn').disabled = currentPage === totalPages;
    }

    function nextPage() {
      if (currentPage < Math.ceil(studentTableNotices.length / noticesPerPage)) {
        currentPage++;
        renderNoticeTable();
      }
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        renderNoticeTable();
      }
    }

  
   // Student Table Notice popup handle
function showPopup(titleText, date, link, subjText) {
// পপ-আপ কনটেইনার তৈরি
const popup = document.createElement('div');
popup.style.position = 'fixed';
popup.style.top = '50%';
popup.style.left = '50%';
popup.style.transform = 'translate(-50%, -50%)';
popup.style.background = '#f0f8ff'; // হালকা নীল
popup.style.padding = '20px';
popup.style.margin = '0 auto';      // সেন্টারে রাখবে
popup.style.border = '2px solid #333';
popup.style.borderRadius = '10px';
popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
popup.style.zIndex = '9999';
popup.style.textAlign = 'center';
popup.style.maxWidth = '90%'; // স্ক্রিনে overflow না হয়
popup.style.minWidth = '240px'; // খুব ছোট না হয়
popup.style.width = '300px'; // সর্বোচ্চ চওড়া
popup.style.fontFamily = 'Arial, sans-serif';

// হেডিং (Text) — বড়ো, সাদা, সবুজ ব্যাকগ্রাউন্ড
const titleElem = document.createElement('div');
titleElem.innerText = titleText;
titleElem.style.backgroundColor = 'green';
titleElem.style.color = 'white';
titleElem.style.fontWeight = 'bold';
titleElem.style.fontSize = '15px';
titleElem.style.padding = '10px';
titleElem.style.borderRadius = '5px';
titleElem.style.marginBottom = '15px';
popup.appendChild(titleElem);

// তারিখ (Date)
const dateElem = document.createElement('div');
dateElem.innerHTML = `<strong>তারিখ:</strong> ${date}`;
dateElem.style.marginBottom = '10px';
popup.appendChild(dateElem);

// subj থাকলে তা দেখাও — গাঢ় সবুজ রঙ, হালকা সবুজ ব্যাকগ্রাউন্ড, ছোট হরফে
if (subjText && subjText.trim() !== '') {
  const subjElem = document.createElement('div');
  subjElem.innerText = subjText;
  subjElem.style.color = 'darkgreen';
  subjElem.style.backgroundColor = '#e6ffe6'; // হালকা সবুজ
  subjElem.style.fontWeight = 'bold';
  subjElem.style.fontSize = '14px';
  subjElem.style.padding = '6px';
  subjElem.style.borderRadius = '4px';
  subjElem.style.marginBottom = '12px';
  popup.appendChild(subjElem);
}
// বোতাম কন্টেইনার
const buttonContainer = document.createElement('div');
buttonContainer.style.marginTop = '20px';
buttonContainer.style.display = 'flex';
buttonContainer.style.flexWrap = 'wrap';
buttonContainer.style.justifyContent = 'center';
buttonContainer.style.gap = '10px'; // বোতামের মাঝে দূরত্ব

// ফাইল খুলুন বোতাম লিঙ্ক থাকলে তা দেখাও
if (link && link.trim() !== '') {
  const linkBtn = document.createElement('a');
  linkBtn.href = link;
  linkBtn.innerText = 'Open Link';
  linkBtn.target = '_blank';
  linkBtn.style.backgroundColor = '#007bff';
  linkBtn.style.color = 'white';
  linkBtn.style.padding = '6px 10px';
  linkBtn.style.border = 'none';
  linkBtn.style.borderRadius = '5px';
  linkBtn.style.textDecoration = 'none';
  linkBtn.style.fontWeight = 'bold';
  linkBtn.style.fontSize = '12px'; // ছোট ফন্ট
  linkBtn.style.transition = 'background-color 0.3s';
  linkBtn.onmouseover = () => linkBtn.style.backgroundColor = '#0056b3';
  linkBtn.onmouseout = () => linkBtn.style.backgroundColor = '#007bff';
  buttonContainer.appendChild(linkBtn);
}

// ✅ PNG Download Button (fixed)
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Download';
    downloadBtn.style.backgroundColor = '#28a745';
    downloadBtn.style.color = 'white';
    downloadBtn.style.padding = '6px 10px';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '5px';
    downloadBtn.style.fontWeight = 'bold';
    downloadBtn.style.fontSize = '12px'; // ছোট ফন্ট
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.onclick = () => {
        // Ensure reflow before capturing
        setTimeout(() => {
            html2canvas(popup).then(canvas => {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = image;
                link.download = 'notice.png';
                link.click();
            });
        }, 100); // slight delay for reflow
    };
    buttonContainer.appendChild(downloadBtn);
    
// বন্ধ করুন বোতাম
const closeBtn = document.createElement('button');
closeBtn.innerText = 'Back';
closeBtn.style.backgroundColor = '#dc3545';
closeBtn.style.color = 'white';
closeBtn.style.padding = '6px 10px';
closeBtn.style.border = 'none';
closeBtn.style.borderRadius = '5px';
closeBtn.style.fontWeight = 'bold';
closeBtn.style.fontSize = '12px'; // ছোট ফন্ট
closeBtn.style.cursor = 'pointer';
closeBtn.style.transition = 'background-color 0.3s';
closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#a71d2a';
closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#dc3545';
closeBtn.onclick = () => document.body.removeChild(popup);
buttonContainer.appendChild(closeBtn);

// পপআপে বোতাম কন্টেইনার যোগ করুন
popup.appendChild(buttonContainer);

  // স্ক্রিনে দেখাও
  document.body.appendChild(popup);
}

function closeModal() {
  document.getElementById('popupModal').style.display = 'none';
}
