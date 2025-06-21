// Data Storage (localStorage for persistence)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10;

const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Date Picker elements
const datePickerModal = document.getElementById('datePickerModal');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarDates = document.getElementById('calendarDates');
let currentDatePickerInput = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Input Edit/New Entry Modal elements
const inputEditModal = document.getElementById('inputEditModal');
const inputEditModalHeading = document.getElementById('inputEditModalHeading');
const inputEditTextArea = document.getElementById('inputEditTextArea');
const storeInputBtn = document.getElementById('storeInputBtn');
const cancelInputBtn = document.getElementById('cancelInputBtn');
let currentEditInput = null;

// Validation Modal elements
const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');

let rowToDelete = null;
let editingRowOriginalData = null;

// --- Global Setup ---
// Close modal buttons (general)
document.querySelectorAll('.close-modal-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
        if (e.target.closest('.modal').id === 'inputEditModal') {
            inputEditTextArea.value = '';
            currentEditInput = null;
        } else if (e.target.closest('.modal').id === 'datePickerModal') {
            currentDatePickerInput = null;
        }
    });
});

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    populateMonthYearSelects();
    renderTable();
    populateCalendar(currentMonth, currentYear);
});

// --- Table Rendering ---
function renderTable() {
    dataTableBody.innerHTML = '';

    // Always add the empty input row at the top
    dataTableBody.appendChild(createEmptyRow());

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    paginatedData.forEach((rowData, index) => {
        // Calculate SI. number for descending order
        // Total actual data rows - (current index on page + rows on previous pages)
        const siNumber = tableData.length - (startIndex + index);
        const row = createTableRow(rowData, siNumber, startIndex + index); // Pass siNumber and original index
        dataTableBody.appendChild(row);
    });

    renderPaginationControls();
}

// createTableRow function updated to accept siNumber
function createTableRow(data, siNumber, originalIndex) {
    const tr = document.createElement('tr');
    tr.dataset.index = originalIndex; // Store original index for data array operations

    tr.innerHTML = `
        <td>${siNumber}.</td> <td>${data.date}</td>
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

    tr.querySelector('.edit-btn').addEventListener('click', (e) => startEditing(tr, data));
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    tr.querySelector('.cancel-btn').addEventListener('click', (e) => cancelEditing(tr));
    tr.querySelector('.delete-btn').addEventListener('click', (e) => confirmDelete(tr));

    return tr;
}

function createEmptyRow() {
    const tr = document.createElement('tr');
    tr.classList.add('empty-row', 'editing');
    tr.dataset.index = 'new';

    tr.innerHTML = `
        <td></td> <td><input type="text" class="input-date" placeholder="Date" readonly></td>
        <td><input type="text" class="input-heading" placeholder="Heading"></td>
        <td><input type="text" class="input-subject" placeholder="Subject"></td>
        <td><input type="text" class="input-link" placeholder="Link (Optional)"></td>
        <td class="action-buttons">
            <button class="save-btn">Save</button>
            <button class="cancel-btn" style="display:none;">Cancel</button>
            <button class="delete-btn" style="display:none;">Delete</button>
        </td>
    `;
    
    attachInputEventListeners(tr);
    
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    
    return tr;
}

// --- Edit/Save/Cancel Logic ---
function startEditing(row, originalData) {
    editingRowOriginalData = { ...originalData };
    row.classList.add('editing');
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
        if (index === 0) { // SI. column - no edit
            // Do nothing, SI. number is automatically handled
        } else if (index < 5) { // Date, Heading, Subject, Link columns (indices 1, 2, 3, 4)
            const currentContent = originalData[Object.keys(originalData)[index - 1]]; // Adjust index for data object
            let inputType = 'text';
            let inputClass = '';
            let placeholder = '';

            if (index === 1) { // Date column
                inputClass = 'input-date';
                inputType = 'text';
                placeholder = 'DD-MM-YYYY';
            } else if (index === 2) { // Heading
                inputClass = 'input-heading';
                placeholder = 'Heading';
            } else if (index === 3) { // Subject
                inputClass = 'input-subject';
                placeholder = 'Subject';
            } else if (index === 4) { // Link
                inputClass = 'input-link';
                placeholder = 'Link (Optional)';
            }

            cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${currentContent}" placeholder="${placeholder}" ${index === 1 ? 'readonly' : ''}>`;
        }
    });

    attachInputEventListeners(row);

    row.querySelector('.edit-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = 'inline-block';
    row.querySelector('.cancel-btn').style.display = 'inline-block';
    row.querySelector('.delete-btn').style.display = 'none';
}

function saveRow(row) {
    // Note: Querying inputs by class now, not by specific td index, this is more robust
    const dateInput = row.querySelector('.input-date');
    const headingInput = row.querySelector('.input-heading');
    const subjectInput = row.querySelector('.input-subject');
    const linkInput = row.querySelector('.input-link');

    const date = dateInput ? dateInput.value.trim() : '';
    const heading = headingInput ? headingInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const link = linkInput ? linkInput.value.trim() : '';

    if (!date) { showValidationMessage('Please fill up the Date field.'); dateInput.focus(); return; }
    if (!heading) { showValidationMessage('Please fill up the Heading field.'); headingInput.focus(); return; }
    if (!subject) { showValidationMessage('Please fill up the Subject field.'); subjectInput.focus(); return; }

    const newRowData = { date, heading, subject, link };
    const rowIndex = row.dataset.index;

    if (rowIndex === 'new') {
        tableData.unshift(newRowData);
        currentPage = 1;
    } else {
        tableData[parseInt(rowIndex)] = newRowData;
    }

    localStorage.setItem('tableData', JSON.stringify(tableData));
    row.classList.remove('editing');
    editingRowOriginalData = null;

    renderTable();
}

function cancelEditing(row) {
    const rowIndex = row.dataset.index;
    if (rowIndex === 'new') {
        row.querySelectorAll('input').forEach(input => input.value = '');
        renderTable();
    } else {
        tableData[parseInt(rowIndex)] = { ...editingRowOriginalData };
        editingRowOriginalData = null;
        row.classList.remove('editing');
        renderTable();
    }
}

// --- Delete Functionality --- (Remains same)
confirmDeleteBtn.addEventListener('click', () => {
    if (rowToDelete) {
        const index = parseInt(rowToDelete.dataset.index);
        tableData.splice(index, 1);
        localStorage.setItem('tableData', JSON.stringify(tableData));
        rowToDelete = null;
        deleteConfirmModal.style.display = 'none';
        
        const totalPages = Math.ceil(tableData.length / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 1;
        }
        renderTable();
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    rowToDelete = null;
    deleteConfirmModal.style.display = 'none';
});

// --- Pagination --- (Remains same)
function renderPaginationControls() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    if (totalPages <= 1 && tableData.length <= rowsPerPage && dataTableBody.children.length <= 1) {
        return;
    }
    if (totalPages <= 1 && tableData.length <= rowsPerPage) {
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


/* --- Functions for Date Picker --- */
function populateMonthYearSelects() {
    const currentYearFull = new Date().getFullYear();
    for (let i = currentYearFull - 5; i <= currentYearFull + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

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

function populateCalendar(month, year) {
    monthSelect.value = month;
    yearSelect.value = year;

    calendarDates.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const span = document.createElement('span');
        span.classList.add('empty');
        calendarDates.appendChild(span);
    }

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

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
                datePickerModal.style.display = 'none';
            }
        });
        calendarDates.appendChild(span);
    }
}

prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    populateCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    populateCalendar(currentMonth, currentYear);
});

/* --- Functions for Input Edit Modal (Pop-up) --- */

function attachInputEventListeners(rowElement) {
    // Date input: opens date picker
    const dateInput = rowElement.querySelector('.input-date');
    if (dateInput) {
        dateInput.addEventListener('click', (e) => {
            currentDatePickerInput = e.target;
            datePickerModal.style.display = 'block';
            const inputDateStr = e.target.value;
            if (inputDateStr) {
                const parts = inputDateStr.split('-');
                if (parts.length === 3) {
                    // Current day of month is not stored in currentMonth/Year, only used for initial selection highlighting
                    currentMonth = parseInt(parts[1]) - 1;
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

    // Other inputs: opens general edit modal
    rowElement.querySelectorAll('input[type="text"]:not(.input-date)').forEach(input => {
        input.addEventListener('click', (e) => {
            currentEditInput = e.target;
            // Get header text for modal heading based on actual column index
            const cellIndex = Array.from(e.target.closest('tr').children).indexOf(e.target.closest('td'));
            const headerText = document.querySelector('#data-table thead th:nth-child(' + (cellIndex + 1) + ')').textContent;
            inputEditModalHeading.textContent = headerText;

            inputEditTextArea.value = e.target.value;
            inputEditModal.style.display = 'block';
            inputEditTextArea.focus();
        });
    });
}

storeInputBtn.addEventListener('click', () => {
    if (currentEditInput) {
        currentEditInput.value = inputEditTextArea.value.trim();
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditInput = null;
    }
});

cancelInputBtn.addEventListener('click', () => {
    inputEditModal.style.display = 'none';
    inputEditTextArea.value = '';
    currentEditInput = null;
});

// --- Validation Modal ---
function showValidationMessage(message) {
    validationMessage.textContent = message;
    validationModal.style.display = 'block';
}

// Ensure modals close when clicking outside them
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
