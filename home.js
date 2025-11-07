// ===================================
// ✅ NEW স্ট্যাটাস কন্ট্রোল প্যানেল লজিক
// ===================================

let NEW_STATUS_CONTROL = {};

// LocalStorage-এ স্ট্যাটাস সেভ করার ফাংশন
function saveNewStatusControl() {
    localStorage.setItem('newStatusControl', JSON.stringify(NEW_STATUS_CONTROL));
    console.log("NEW Status saved to LocalStorage:", NEW_STATUS_CONTROL);
    alert("স্ট্যাটাস সফলভাবে সেভ করা হয়েছে। মূল পেজে (index.html) এখন পরিবর্তন দেখা যাবে।");
}

// কন্ট্রোল প্যানেল রেন্ডার করার ফাংশন
function renderNewStatusControlPanel() {
    const container = document.getElementById('new-animation-control-panel');
    if (!container) return;

    let html = `
        <table class="control-table">
            <thead>
                <tr>
                    <th style="width: 70%;">Title</th>
                    <th style="width: 30%; text-align: center;">NEW (ON/OFF)</th>
                </tr>
            </thead>
            <tbody>
    `;

    // বর্তমান স্ট্যাটাস থেকে টেবিলের row গুলো তৈরি
    for (const title in NEW_STATUS_CONTROL) {
        const isNew = NEW_STATUS_CONTROL[title];
        const checked = isNew ? 'checked' : '';

        html += `
            <tr>
                <td>${title}</td>
                <td style="text-align: center;">
                    <label class="switch">
                        <input type="checkbox" data-title="${title}" ${checked} onchange="window.toggleNewStatus(this)">
                        <span class="slider round"></span>
                    </label>
                </td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// স্লাইড বাটন টগল করার লজিক
window.toggleNewStatus = function(checkbox) {
    const title = checkbox.getAttribute('data-title');
    NEW_STATUS_CONTROL[title] = checkbox.checked;
    saveNewStatusControl(); // পরিবর্তন LocalStorage এ সেভ করা হবে
};

// JSON ফাইল থেকে সব Title এবং ডিফল্ট স্ট্যাটাস লোড করা
async function loadAndInitializeControl() {
    try {
        // 'index_link.json' ফাইলটি লোড করা
        const response = await fetch('index_link.json');
        const data = await response.json();

        // Notices ডেটা (যদি Notices সেকশনেও isNew ব্যবহার হয়)
        // যেহেতু এই ফাইলটি Google Apps Script থেকে লোড হয়, তাই এখানে Notices বাদ দেওয়া হলো,
        // তবে প্রয়োজন হলে Notices ডেটা Load Exam Dates এর মাধ্যমে নিতে হবে।
        
        // Students এবং Forms ডেটা একসাথে করা
        const dynamicItems = [...(data.students || []), ...(data.forms || [])];
        
        const storedStatus = localStorage.getItem('newStatusControl');
        let newStatusControl = storedStatus ? JSON.parse(storedStatus) : {};

        // JSON-এ থাকা সব আইটেম কন্ট্রোল অবজেক্টে যোগ করা বা আপডেট করা
        dynamicItems.forEach(item => {
            const title = item.title;
            if (newStatusControl[title] === undefined) {
                 newStatusControl[title] = item.isNew === true; // JSON থেকে ডিফল্ট নেওয়া
            }
        });
        
        NEW_STATUS_CONTROL = newStatusControl;
        renderNewStatusControlPanel();

    } catch (error) {
        console.error("Error initializing control panel:", error);
        const container = document.getElementById('new-animation-control-panel');
        if (container) {
            container.innerHTML = 'Error loading NEW control data. Check index_link.json file path.';
        }
    }
}


// ===================================
// ✅ DOMContentLoaded
// ===================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. NEW স্ট্যাটাস কন্ট্রোল প্যানেল লোড করা
    loadAndInitializeControl();
    
    
    // 2. ✅ URL লোডিং ফাংশন (পূর্বের মতো অপরিবর্তিত)
    fetch("home_url.json")
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".exam-link").forEach(button => {
                const id = button.id;
                if (data[id]) {
                    button.setAttribute("href", data[id]);
                    button.setAttribute("target", "_blank"); 
                } else {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        button.style.display = 'none';
                        const message = document.createElement('div');
                        message.className = 'avail-msg';
                        message.textContent = '🔔 Available Soon 🔔';
                        message.style.cssText = "color: red; padding: 10px; border: 1px solid red; margin-top: 10px; text-align: center;";
                        button.parentNode.appendChild(message);

                        setTimeout(() => {
                            message.remove();
                            button.style.display = ''; 
                        }, 3000);
                    });
                }
            });
        })
        .catch(error => console.error("Error loading URLs:", error));


    // 3. ✅ নম্বর আপলোডের শেষ তারিখ এর জাভা স্ক্রিপ্ট (পূর্বের মতো অপরিবর্তিত)
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyfcYA8sdD__TgIe-mHKE9n1fabVv_pDFam1K59O9FdD13r5rVcg5_Mf005mcAWsa6xjA/exec';
    const examDatesMarquee = document.getElementById("exam-dates-marquee-content");

    async function loadExamDates() {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=get_github_data`);
            const data = await response.json();
            
            if (data && data.data) {
                examDatesMarquee.innerHTML = '';
                
                const formattedData = data.data.map(item => {
                    const span = document.createElement("span");
                    span.textContent = item.text;
                    span.style.color = item.color;
                    return span.outerHTML;
                }).join(', ');
                
                const fullSpan = document.createElement("span");
                fullSpan.innerHTML = formattedData;
                examDatesMarquee.appendChild(fullSpan);
            }
        } catch (error) {
            console.error('Error loading exam dates:', error);
            examDatesMarquee.textContent = 'No exam dates available.';
        }
    }

    loadExamDates();

    // Mouse hover and touch listeners (unchanged)
    if(examDatesMarquee) {
        examDatesMarquee.addEventListener("mouseover", () => {
            examDatesMarquee.style.animationPlayState = 'paused';
        });
        examDatesMarquee.addEventListener("mouseout", () => {
            examDatesMarquee.style.animationPlayState = 'running';
        });
        examDatesMarquee.addEventListener("touchstart", () => {
            examDatesMarquee.style.animationPlayState = 'paused';
        });
        examDatesMarquee.addEventListener("touchend", () => {
            examDatesMarquee.style.animationPlayState = 'running';
        });
    }
});
