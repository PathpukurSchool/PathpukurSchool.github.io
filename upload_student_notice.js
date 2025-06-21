// Data Storage (localStorage for persistence)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10;

const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// New: Date Picker elements
const datePickerModal = document.getElementById('datePickerModal');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarDates = document.getElementById('calendarDates');
let currentDatePickerInput = null; // To track which input field opened the date picker
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// New: Live Input View elements
const liveInputViewModal = document.getElementById('liveInputViewModal');
const liveInputTextArea = document.getElementById('liveInputTextArea');
let currentLiveInput = null; // To track which input field is being viewed

let rowToDelete = null;
let editingRowOriginalData = null;

// Close modal buttons (general)
document.querySelectorAll('.close-modal-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
        // Clear live input content when closing
        if (e.target.closest('.modal').id === 'liveInputViewModal') {
            liveInputTextArea.value = '';
            currentLiveInput = null;
        }
    });
});

// Initial Render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    // New: Populate date picker on load
    populateCalendar(currentMonth, currentYear);
});

// Function to render table rows
function renderTable() {
    dataTableBody.innerHTML = '';

    // Add the empty input row at the top (always)
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

// Function to create a data row (for existing data)
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

    tr.querySelector('.edit-btn').addEventListener('click', (e) => startEditing(tr, data));
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    tr.querySelector('.cancel-btn').addEventListener('click', (e) => cancelEditing(tr));
    tr.querySelector('.delete-btn').addEventListener('click', (e) => confirmDelete(tr));

    return tr;
}

// Function to create the always-present empty row for input
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
    
    // New: Date input click opens date picker
    const dateInput = tr.querySelector('.input-date');
    dateInput.addEventListener('click', (e) => {
        currentDatePickerInput = dateInput;
        datePickerModal.style.display = 'block';
        // Set calendar to current input date if available, or today
        const inputDate = new Date(dateInput.value);
        if (!isNaN(inputDate) && dateInput.value) {
            currentMonth = inputDate.getMonth();
            currentYear = inputDate.getFullYear();
        } else {
            currentMonth = new Date().getMonth();
            currentYear = new Date().getFullYear();
        }
        populateCalendar(currentMonth, currentYear);
    });

    // New: Add event listeners for Live Input View on all input fields except date
    tr.querySelectorAll('input[type="text"]:not(.input-date)').forEach(input => {
        input.addEventListener('focus', (e) => {
            currentLiveInput = e.target;
            liveInputTextArea.value = e.target.value;
            liveInputViewModal.style.display = 'block';
            liveInputTextArea.focus();
        });
        input.addEventListener('input', (e) => {
            liveInputTextArea.value = e.target.value;
        });
    });
    
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    
    return tr;
}


function startEditing(row, originalData) {
    editingRowOriginalData = { ...originalData };
    row.classList.add('editing');
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
        if (index < 4) {
            const currentContent = originalData[Object.keys(originalData)[index]];
            let inputType = 'text';
            let inputClass = '';
            if (index === 0) {
                inputClass = 'input-date';
                inputType = 'text'; // Use text type for custom date picker
            } else if (index === 1) inputClass = 'input-heading';
            else if (index === 2) inputClass = 'input-subject';
            else if (index === 3) inputClass = 'input-link';

            cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${currentContent}" ${index === 0 ? 'readonly' : ''}>`;
        }
    });

    // New: Date input click opens date picker for existing rows
    const dateInput = row.querySelector('.input-date');
    if (dateInput) {
        dateInput.addEventListener('click', (e) => {
            currentDatePickerInput = dateInput;
            datePickerModal.style.display = 'block';
            // Set calendar to current input date if available, or today
            const inputDate = new Date(dateInput.value);
            if (!isNaN(inputDate) && dateInput.value) {
                currentMonth = inputDate.getMonth();
                currentYear = inputDate.getFullYear();
            } else {
                currentMonth = new Date().getMonth();
                currentYear = new Date().getFullYear();
            }
            populateCalendar(currentMonth, currentYear);
        });
    }

    // New: Add event listeners for Live Input View on all input fields except date
    row.querySelectorAll('input[type="text"]:not(.input-date)').forEach(input => {
        input.addEventListener('focus', (e) => {
            currentLiveInput = e.target;
            liveInputTextArea.value = e.target.value;
            liveInputViewModal.style.display = 'block';
            liveInputTextArea.focus();
        });
        input.addEventListener('input', (e) => {
            liveInputTextArea.value = e.target.value;
        });
    });

    row.querySelector('.edit-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = 'inline-block';
    row.querySelector('.cancel-btn').style.display = 'inline-block';
    row.querySelector('.delete-btn').style.display = 'none';
}

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
    if (!date) { alert('Please fill up the Date field.'); dateInput.focus(); return; }
    if (!heading) { alert('Please fill up the Heading field.'); headingInput.focus(); return; }
    if (!subject) { alert('Please fill up the Subject field.'); subjectInput.focus(); return; }

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
        // If it was the empty row, clear inputs and re-render to reset
        row.querySelectorAll('input').forEach(input => input.value = '');
        row.classList.remove('editing'); // Remove editing class
        renderTable(); // This will recreate the empty row
    } else {
        tableData[parseInt(rowIndex)] = { ...editingRowOriginalData };
        editingRowOriginalData = null;
        row.classList.remove('editing');
        renderTable();
    }
}

// Delete Functionality - Remains same

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

// Pagination - Remains same

function renderPaginationControls() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    if (totalPages <= 1 && tableData.length === 0) {
        return; // No pagination if no data and only empty row
    }
    // Only show pagination if there's more than 1 page of data
    if (totalPages <= 1 && tableData.length <= rowsPerPage) {
        // If only 1 page or less data than rowsPerPage, no pagination needed
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


/* --- New Functions for Date Picker --- */
function populateCalendar(month, year) {
    currentMonthYear.textContent = `${new Date(year, month).toLocaleString('en-US', { month: 'long' })} ${year}`;
    calendarDates.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of month

    // Fill empty cells before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const span = document.createElement('span');
        span.classList.add('empty');
        calendarDates.appendChild(span);
    }

    // Fill days of the month
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
        const span = document.createElement('span');
        span.textContent = day;
        span.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // YYYY-MM-DD format

        // Highlight today's date
        if (day === todayDate && month === todayMonth && year === todayYear) {
            span.classList.add('today-date');
        }

        // Highlight selected date if it matches current input value
        if (currentDatePickerInput && currentDatePickerInput.value === span.dataset.date) {
            span.classList.add('selected-date');
        }

        span.addEventListener('click', () => {
            if (currentDatePickerInput) {
                currentDatePickerInput.value = span.dataset.date;
                datePickerModal.style.display = 'none'; // Close picker after selection
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

/* --- New Functions for Live Input View --- */
liveInputTextArea.addEventListener('input', (e) => {
    if (currentLiveInput) {
        currentLiveInput.value = e.target.value;
    }
});

liveInputViewModal.addEventListener('click', (e) => {
    // If clicked outside the modal content, close it
    if (e.target === liveInputViewModal) {
        liveInputViewModal.style.display = 'none';
        liveInputTextArea.value = '';
        currentLiveInput = null;
    }
});

datePickerModal.addEventListener('click', (e) => {
    // If clicked outside the modal content, close it
    if (e.target === datePickerModal) {
        datePickerModal.style.display = 'none';
        currentDatePickerInput = null;
    }
});
