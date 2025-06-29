// Global Variables for Master Login (from first code block)
let credentials = {}; // Stores exam link credentials from config.json
// masterCredential variable was declared but not used in the provided code, so it's kept for potential future use or removed if not needed.
// let masterCredential = {};

// Global Variables for Data Table (from second code block)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10;

// DOM Element Selections for Data Table
const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// DOM Element Selections for Date Picker Modal
const datePickerModal = document.getElementById('datePickerModal');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarDates = document.getElementById('calendarDates');
let currentDatePickerInput = null; // Tracks which input field opened the date picker
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// DOM Element Selections for Input Edit Modal
const inputEditModal = document.getElementById('inputEditModal');
const inputEditModalHeading = document.getElementById('inputEditModalHeading');
const inputEditTextArea = document.getElementById('inputEditTextArea');
const storeInputBtn = document.getElementById('storeInputBtn');
const cancelInputBtn = document.getElementById('cancelInputBtn');
let currentEditInput = null; // Tracks which input field is being edited/newly entered

// DOM Element Selections for Validation Modal
const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');

// Global variables for table actions
let rowToDelete = null;
let editingRowOriginalData = null; // Stores data before editing for cancel operation


// --- Master Login Functions ---

// Function to load master login configuration from masterConfig.json
async function getMasterCredentials() {
    try {
        const response = await fetch('masterConfig.json');
        if (!response.ok) {
            throw new Error('Failed to load master configuration (masterConfig.json)');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching master config:', error);
        return null;
    }
}

// Handles master login submission
async function submitMasterLogin() {
    const type = document.getElementById('loginType').value;
    const id = document.getElementById('masterId').value.trim();
    const pass = document.getElementById('masterPass').value.trim();
    const errorDiv = document.getElementById('masterLoginError');
    const successDiv = document.getElementById('masterLoginSuccess');

    errorDiv.innerText = "";
    successDiv.innerText = "";
    successDiv.style.display = "none";
    
    if (!type || !id || !pass) {
        errorDiv.innerText = "Please select login type and fill ID & Password.";
        return;
    }

    const allMasterCredentials = await getMasterCredentials(); // Renamed to avoid conflict

    if (!allMasterCredentials) {
        errorDiv.innerText = "Unable to load login configuration.";
        return;
    }

    const user = allMasterCredentials[type.toLowerCase()];

    if (user && id === user.id && pass === user.pass) {
        sessionStorage.setItem("userType", type.toLowerCase());
        if (type.toLowerCase() === "student") {
            sessionStorage.setItem("studentLoggedIn", "true");
        }

        successDiv.innerText = "✔️ Login Successful.";
        successDiv.style.display = "block";

        setTimeout(() => {
            if (type.toLowerCase() === 'student' || type.toLowerCase() === 'school') {
                window.location.href = user.redirect;
            } else {
                // Teacher login successful – hide the login overlay and load exam links
                const masterLoginOverlay = document.getElementById('masterLoginOverlay');
                if (masterLoginOverlay) {
                    masterLoginOverlay.style.display = "none";
                }
                loadExamLinks(); // Load main data for teacher
            }
        }, 1000);
    } else {
        errorDiv.innerText = "Incorrect ID or Password!";
        errorDiv.style.color = "red";
    }
}

// Function to load exam links from config.json
function loadExamLinks() {
    fetch('config.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load exam links configuration (config.json)');
            }
            return response.json();
        })
        .then(data => {
            credentials = data;
            renderButtons();
        })
        .catch(error => console.error('Error fetching exam config:', error));
}

let currentKey = ''; // Stores the key for the currently selected exam link

// Renders exam link buttons based on loaded credentials
function renderButtons() {
    const mainContainer = document.getElementById('exam-buttons');
    if (!mainContainer) return; // Exit if container not found
    mainContainer.innerHTML = '';

    const classes = [...new Set(Object.keys(credentials).map(k => k.split('_')[0]))];
    const sortedClasses = classes.sort((a, b) => {
        const order = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return order.indexOf(a) - order.indexOf(b);
    });

    sortedClasses.forEach(cls => {
        const classBox = document.createElement('div');
        classBox.className = 'shaded-info-box';

        const boxHeading = document.createElement('h3');
        boxHeading.className = 'box-heading shine';
        boxHeading.textContent = 'CLASS ' + cls;
        classBox.appendChild(boxHeading);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exam-buttons-group';

        const exams = ['1ST', '2ND', '3RD', 'TEST', 'SEM1', 'SEM2'];
        exams.forEach(exam => {
            const key = `${cls}_${exam}`;
            if (credentials[key]) {
                const button = document.createElement('button');
                button.className = 'box-button exam-link';
                
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
                    case '1ST':
                    case '2ND':
                    case '3RD':
                        label = `${exam} EXAM`; // Consistent labeling
                        break;
                }
                
                button.textContent = label;
                if (credentials[key].url && credentials[key].url.trim() !== '') {
                    button.onclick = () => openLogin(key);
                } else {
                    button.onclick = () => showAvailableSoonMessage(key);
                    button.classList.add('disabled-exam-link');
                }
                buttonsContainer.appendChild(button);
            }
        });
        
        if (buttonsContainer.children.length > 0) {
            classBox.appendChild(buttonsContainer);
            mainContainer.appendChild(classBox);
        }
    });
}

// Opens the sub-login dialog for a specific exam link
function openLogin(key) {
    currentKey = key;
    const loginIdInput = document.getElementById('loginId');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');
    const loginDialog = document.getElementById('loginDialog');

    if (loginIdInput) loginIdInput.value = '';
    if (loginPasswordInput) loginPasswordInput.value = '';
    if (loginErrorDiv) loginErrorDiv.innerText = '';
    if (loginDialog) loginDialog.showModal();
}

// Closes the sub-login dialog
function closeLogin() {
    const loginDialog = document.getElementById('loginDialog');
    if (loginDialog) loginDialog.close();
}

// Validates sub-login credentials and opens the link
function submitLogin() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPassword').value;
    const loginErrorDiv = document.getElementById('loginError');
    const credential = credentials[currentKey];

    if (credential && credential.id === id && credential.pass === pass) {
        if (credential.url && credential.url.trim() !== '') {
            window.open(credential.url, '_blank');
            closeLogin();
        } else {
            closeLogin();
            showAvailableSoonMessage(currentKey);
        }
    } else {
        if (loginErrorDiv) {
            loginErrorDiv.innerText = 'Incorrect ID or Password!';
        }
    }
}

// Displays "Available Soon" message next to an exam link
function showAvailableSoonMessage(key) {
    const container = document.getElementById('exam-buttons');
    if (!container) return;
    const links = container.getElementsByClassName('exam-link');

    const expectedButtonText = getExamText(key); // Get the correct button text

    for (let link of links) {
        if (link.textContent === expectedButtonText) {
            const next = link.nextElementSibling;
            if (next && next.classList.contains('avail-msg')) next.remove(); // Remove existing message

            const msg = document.createElement('div');
            msg.className = 'avail-msg';
            msg.textContent = '🔔 Available Soon 🔔';

            link.parentNode.insertBefore(msg, link.nextSibling);

            setTimeout(() => {
                msg.remove();
            }, 3000);
            break;
        }
    }
}

// Helper to get the full exam text for button labeling
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
            return '1ST EXAM';
        case '2ND':
            return '2ND EXAM';
        case '3RD':
            return '3RD EXAM';
        default:
            return exam;
    }
}

// Loads and populates NOTICE & HELP lists from files.json
fetch('files.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load files configuration (files.json)');
        }
        return response.json();
    })
    .then(data => {
        populateList('notice-list', data.notices);
        populateList('help-list', data.help);
    })
    .catch(error => console.error('Error fetching files config:', error));

// Populates a given UL element with links
function populateList(elementId, items) {
    const ul = document.getElementById(elementId);
    if (!ul) return; // Ensure the element exists before trying to populate it

    ul.innerHTML = ''; // Clear existing content
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


// --- Table, Date Picker, and Input Edit Modal Functions ---

// Global Setup: Close modal buttons logic
document.querySelectorAll('.close-modal-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const modalOverlay = e.target.closest('.table-modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            // Specific cleanup based on modal ID
            if (modalOverlay.id === 'inputEditModal') {
                inputEditTextArea.value = '';
                currentEditInput = null;
            } else if (modalOverlay.id === 'datePickerModal') {
                currentDatePickerInput = null;
            }
        }
    });
});

// Initial Render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize date picker and table
    populateMonthYearSelects();
    renderTable();
    populateCalendar(currentMonth, currentYear);

    // Initial check for master login overlay display (if needed, e.g., for teacher login)
    // If the teacher login is the primary entry point to the table,
    // the masterLoginOverlay should be shown by default or hidden if already logged in.
    // For now, assuming it's hidden by default and shown by some other event.
    // If you need to show it initially for teacher access, add:
    // document.getElementById('masterLoginOverlay').style.display = "block";
});

// Renders the data table including an empty input row
function renderTable() {
    if (!dataTableBody) return; // Ensure table body exists
    dataTableBody.innerHTML = '';

    // Always add the empty input row at the top for new entries
    dataTableBody.appendChild(createEmptyRow());

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    paginatedData.forEach((rowData, index) => {
        const row = createTableRow(rowData, startIndex + index);
        dataTableBody.appendChild(row);
    });

    renderPaginationControls();
}

// Creates a single table row with data and action buttons
function createTableRow(data, index) {
    const tr = document.createElement('tr');
    tr.dataset.index = index;

    tr.innerHTML = `
        <td>${data.date}</td>
        <td>${data.heading}</td>
        <td>${data.subject}</td>
        <td><a href="${data.link}" target="_blank" ${!data.link ? 'style="display:none;"' : ''}>${data.link || ''}</a></td>
        <td class="action-buttons">
            <button class="edit-btn">Edit</button>
            <button class="save-btn" style="display:none;">Save</button>
            <button class="cancel-btn" style="display:none;">Cancel</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => startEditing(tr, data));
    tr.querySelector('.save-btn').addEventListener('click', () => saveRow(tr));
    tr.querySelector('.cancel-btn').addEventListener('click', () => cancelEditing(tr));
    tr.querySelector('.delete-btn').addEventListener('click', () => confirmDelete(tr));

    return tr;
}

// Creates the initial empty row for new data entry
function createEmptyRow() {
    const tr = document.createElement('tr');
    tr.classList.add('empty-row', 'editing');
    tr.dataset.index = 'new';

    tr.innerHTML = `
        <td><input type="text" class="input-date" placeholder="Date" readonly></td>
        <td><input type="text" class="input-heading" placeholder="Heading"></td>
        <td><input type="text" class="input-subject" placeholder="Subject"></td>
        <td><input type="text" class="input-link" placeholder="Link (Optional)"></td>
        <td class="action-buttons">
            <button class="save-btn">Save</button>
            <button class="cancel-btn" style="display:none;">Cancel</button>
            <button class="delete-btn" style="display:none;">Delete</button>
        </td>
    `;
    
    attachInputEventListeners(tr); // Attach event listeners to newly created input fields
    tr.querySelector('.save-btn').addEventListener('click', () => saveRow(tr));
    
    return tr;
}

// Enables editing mode for a table row
function startEditing(row, originalData) {
    editingRowOriginalData = { ...originalData };
    row.classList.add('editing');
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
        if (index < 4) { // Date, Heading, Subject, Link columns
            const currentContent = originalData[Object.keys(originalData)[index]];
            let inputType = 'text';
            let inputClass = '';
            let placeholder = '';

            if (index === 0) { // Date column
                inputClass = 'input-date';
                inputType = 'text'; // For custom date picker
                placeholder = 'DD-MM-YYYY';
            } else if (index === 1) { // Heading
                inputClass = 'input-heading';
                placeholder = 'Heading';
            } else if (index === 2) { // Subject
                inputClass = 'input-subject';
                placeholder = 'Subject';
            } else if (index === 3) { // Link
                inputClass = 'input-link';
                placeholder = 'Link (Optional)';
            }

            cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${currentContent}" placeholder="${placeholder}" ${index === 0 ? 'readonly' : ''}>`;
        }
    });

    attachInputEventListeners(row); // Re-attach listeners to new input fields

    // Show/Hide buttons
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    if (deleteBtn) deleteBtn.style.display = 'none';
}

// Saves the edited or new row data
function saveRow(row) {
    const dateInput = row.querySelector('.input-date');
    const headingInput = row.querySelector('.input-heading');
    const subjectInput = row.querySelector('.input-subject');
    const linkInput = row.querySelector('.input-link');

    const date = dateInput ? dateInput.value.trim() : '';
    const heading = headingInput ? headingInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const link = linkInput ? linkInput.value.trim() : '';

    // Validation
    if (!date) { showValidationMessage('Please fill up the Date field.'); if(dateInput) dateInput.focus(); return; }
    if (!heading) { showValidationMessage('Please fill up the Heading field.'); if(headingInput) headingInput.focus(); return; }
    if (!subject) { showValidationMessage('Please fill up the Subject field.'); if(subjectInput) subjectInput.focus(); return; }

    const newRowData = { date, heading, subject, link };
    const rowIndex = row.dataset.index;

    if (rowIndex === 'new') {
        tableData.unshift(newRowData);
        currentPage = 1; // Go to first page to see new entry
    } else {
        tableData[parseInt(rowIndex)] = newRowData;
    }

    localStorage.setItem('tableData', JSON.stringify(tableData));
    row.classList.remove('editing');
    editingRowOriginalData = null;

    renderTable(); // Re-render to show updated data
}

// Cancels the current editing operation
function cancelEditing(row) {
    const rowIndex = row.dataset.index;
    if (rowIndex === 'new') {
        // If it was the empty row, just re-render to reset it
        renderTable();
    } else {
        // Revert to original data for an existing row
        tableData[parseInt(rowIndex)] = { ...editingRowOriginalData };
        editingRowOriginalData = null;
        row.classList.remove('editing');
        renderTable(); // Re-render to show original data
    }
}

// Prompts user for delete confirmation
function confirmDelete(row) {
    rowToDelete = row;
    if (deleteConfirmModal) {
        deleteConfirmModal.style.display = 'block';
    }
}

// Handles actual deletion after confirmation
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (rowToDelete) {
            const index = parseInt(rowToDelete.dataset.index);
            tableData.splice(index, 1);
            localStorage.setItem('tableData', JSON.stringify(tableData));
            rowToDelete = null;
            if (deleteConfirmModal) {
                deleteConfirmModal.style.display = 'none';
            }
            
            // Adjust current page if last item on page was deleted
            const totalPages = Math.ceil(tableData.length / rowsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            } else if (totalPages === 0) { // If all data is deleted
                currentPage = 1;
            }
            renderTable();
        }
    });
}

// Cancels delete operation
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        rowToDelete = null;
        if (deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
        }
    });
}

// Renders pagination controls for the table
function renderPaginationControls() {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    // No pagination needed if data fits on one page (or no data beyond empty row)
    if (totalPages <= 1 && tableData.length <= rowsPerPage && dataTableBody.children.length <= 1) {
        return;
    }

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Back';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        currentPage--;
        renderTable();
    });
    paginationControls.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage);
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        currentPage++;
        renderTable();
    });
    paginationControls.appendChild(nextBtn);
}

/* --- Date Picker Functions --- */

// Populates month and year dropdowns for the date picker
function populateMonthYearSelects() {
    if (!monthSelect || !yearSelect) return;
    const currentYearFull = new Date().getFullYear();
    
    // Populate years (e.g., currentYear - 5 to currentYear + 5)
    yearSelect.innerHTML = ''; // Clear previous options
    for (let i = currentYearFull - 5; i <= currentYearFull + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

    // Populate months
    monthSelect.innerHTML = ''; // Clear previous options
    for (let i = 0; i < 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = new Date(0, i).toLocaleString('en-US', { month: 'long' });
        monthSelect.appendChild(option);
    }
    monthSelect.value = currentMonth;

    monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        populateCalendar(currentMonth, currentYear);
    });
    yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        populateCalendar(currentMonth, currentYear);
    });
}

// Populates the calendar grid for a given month and year
function populateCalendar(month, year) {
    if (!calendarDates || !monthSelect || !yearSelect) return;

    monthSelect.value = month;
    yearSelect.value = year;
    calendarDates.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty spans for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
        const span = document.createElement('span');
        span.classList.add('empty');
        calendarDates.appendChild(span);
    }

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Add spans for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const span = document.createElement('span');
        const formattedDate = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
        span.textContent = day;
        span.dataset.date = formattedDate;

        if (day === todayDate && month === todayMonth && year === todayYear) {
            span.classList.add('today-date');
        }

        if (currentDatePickerInput && currentDatePickerInput.value === formattedDate) {
            span.classList.add('selected-date');
        }

        span.addEventListener('click', () => {
            if (currentDatePickerInput) {
                currentDatePickerInput.value = formattedDate;
                if (datePickerModal) {
                    datePickerModal.style.display = 'none';
                }
            }
        });
        calendarDates.appendChild(span);
    }
}

// Event listener for previous month button
if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        populateCalendar(currentMonth, currentYear);
    });
}

// Event listener for next month button
if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        populateCalendar(currentMonth, currentYear);
    });
}

/* --- Input Edit Modal (Pop-up) Functions --- */

// Attaches event listeners to input fields within a table row
function attachInputEventListeners(rowElement) {
    // Date input: opens date picker
    const dateInput = rowElement.querySelector('.input-date');
    if (dateInput) {
        dateInput.addEventListener('click', (e) => {
            currentDatePickerInput = e.target;
            if (datePickerModal) {
                datePickerModal.style.display = 'block';
            }
            // Set calendar to current input date if available, or today
            const inputDateStr = e.target.value;
            if (inputDateStr) {
                const parts = inputDateStr.split('-');
                if (parts.length === 3) {
                    currentMonth = parseInt(parts[1]) - 1; // Months are 0-indexed
                    currentYear = parseInt(parts[2]);
                }
            } else {
                const today = new Date();
                currentMonth = today.getMonth();
                currentYear = today.getFullYear();
            }
            populateCalendar(currentMonth, currentYear);
        });
    }

    // Other text inputs: opens general edit modal
    rowElement.querySelectorAll('input[type="text"]:not(.input-date)').forEach(input => {
        input.addEventListener('click', (e) => {
            currentEditInput = e.target;
            
            // Determine header title for the modal
            const cellIndex = Array.from(e.target.closest('tr').children).indexOf(e.target.closest('td'));
            const headerTh = document.querySelector('#data-table thead th:nth-child(' + (cellIndex + 1) + ')');
            const headerTitle = headerTh ? headerTh.textContent : 'Edit Field';
            if (inputEditModalHeading) {
                inputEditModalHeading.textContent = headerTitle;
            }

            if (inputEditTextArea) {
                inputEditTextArea.value = e.target.value;
            }
            if (inputEditModal) {
                inputEditModal.style.display = 'block';
            }
            if (inputEditTextArea) {
                inputEditTextArea.focus();
            }
        });
    });
}

// Stores edited text from the input edit modal
if (storeInputBtn) {
    storeInputBtn.addEventListener('click', () => {
        if (currentEditInput && inputEditTextArea) {
            currentEditInput.value = inputEditTextArea.value.trim();
            if (inputEditModal) {
                inputEditModal.style.display = 'none';
            }
            inputEditTextArea.value = '';
            currentEditInput = null;
        }
    });
}

// Cancels editing in the input edit modal
if (cancelInputBtn) {
    cancelInputBtn.addEventListener('click', () => {
        if (inputEditModal) {
            inputEditModal.style.display = 'none';
        }
        if (inputEditTextArea) {
            inputEditTextArea.value = '';
        }
        currentEditInput = null;
    });
}

// --- Validation Modal Functions ---

// Displays a validation message
function showValidationMessage(message) {
    if (validationMessage) {
        validationMessage.textContent = message;
    }
    if (validationModal) {
        validationModal.style.display = 'block';
    }
}

// Closes modals when clicking outside them
window.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
        deleteConfirmModal.style.display = 'none';
        rowToDelete = null;
    }
    if (e.target === datePickerModal) {
        datePickerModal.style.display = 'none';
        currentDatePickerInput = null;
    }
    if (e.target === inputEditModal) {
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditInput = null;
    }
    if (e.target === validationModal) {
        validationModal.style.display = 'none';
    }
});
