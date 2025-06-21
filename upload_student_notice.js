// Data Storage (localStorage for persistence)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10;

// Get DOM elements
const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');

// Delete Confirmation Modal elements
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Date Picker Modal elements
const datePickerModal = document.getElementById('datePickerModal');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const calendarDates = document.getElementById('calendarDates');
let currentDatePickerInput = null; // To track which input field opened the date picker
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Input Edit/New Entry Modal elements
const inputEditModal = document.getElementById('inputEditModal');
const inputEditModalHeading = document.getElementById('inputEditModalHeading');
const inputEditTextArea = document.getElementById('inputEditTextArea');
const storeInputBtn = document.getElementById('storeInputBtn');
const cancelInputBtn = document.getElementById('cancelInputBtn');
let currentEditInput = null; // To track which input field is being edited/newly entered

// Validation Modal elements
const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');

// Variables for managing row state
let rowToDelete = null; // Stores the HTML row element to be deleted
let editingRowOriginalData = null; // Stores original data of a row when it's being edited


// --- Global Event Listeners for Modals ---
// This ensures that all modals can be closed by clicking their respective 'close-modal-btn'.
document.querySelectorAll('.close-modal-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
        // Specific cleanup when closing modals
        if (e.target.closest('.modal').id === 'inputEditModal') {
            inputEditTextArea.value = '';
            currentEditInput = null;
        } else if (e.target.closest('.modal').id === 'datePickerModal') {
            currentDatePickerInput = null;
        }
    });
});

// This handles closing modals when clicking outside their content.
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
        // When clicking outside inputEditModal, we do NOT store the data.
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditInput = null;
    }
    if (e.target === validationModal) {
        validationModal.style.display = 'none';
    }
});


// --- Initial Setup on DOM Content Loaded ---
// Ensures all HTML elements are loaded before trying to attach event listeners or manipulate them.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize month and year dropdowns in date picker
    populateMonthYearSelects();
    // Render the table with data
    renderTable();
    // Populate the calendar for the current month/year
    populateCalendar(currentMonth, currentYear);

    // Attach event listeners for the delete confirmation buttons
    confirmDeleteBtn.addEventListener('click', () => {
        if (rowToDelete) {
            const index = parseInt(rowToDelete.dataset.index); // Get the original index from the data-index attribute
            tableData.splice(index, 1); // Remove the row data from the array
            localStorage.setItem('tableData', JSON.stringify(tableData)); // Update localStorage
            rowToDelete = null; // Reset rowToDelete
            deleteConfirmModal.style.display = 'none'; // Hide the modal
            
            // Adjust current page if the last row on a page was deleted
            const totalPages = Math.ceil(tableData.length / rowsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            } else if (totalPages === 0) { // If all data is deleted, reset to page 1
                currentPage = 1;
            }
            renderTable(); // Re-render the table to reflect changes
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        rowToDelete = null; // Reset rowToDelete
        deleteConfirmModal.style.display = 'none'; // Hide the modal
    });
});


// --- Table Rendering Functions ---
/**
 * Renders the entire data table, including the empty input row and paginated data.
 */
function renderTable() {
    dataTableBody.innerHTML = ''; // Clear existing table rows

    // Always add the empty input row at the top
    dataTableBody.appendChild(createEmptyRow());

    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    // Iterate over paginated data to create and append table rows
    paginatedData.forEach((rowData, index) => {
        // Calculate SI. number for descending order
        // Total actual data rows - (current index on page + rows on previous pages)
        const siNumber = tableData.length - (startIndex + index);
        // Pass the SI number and the original index in the 'tableData' array
        const row = createTableRow(rowData, siNumber, startIndex + index); 
        dataTableBody.appendChild(row);
    });

    renderPaginationControls(); // Update pagination buttons
}

/**
 * Creates an HTML table row for existing data.
 * @param {Object} data - The data object for the row (date, heading, subject, link).
 * @param {number} siNumber - The calculated serial number for the row.
 * @param {number} originalIndex - The actual index of the data in the main tableData array.
 * @returns {HTMLElement} The created table row (<tr>).
 */
function createTableRow(data, siNumber, originalIndex) {
    const tr = document.createElement('tr');
    tr.dataset.index = originalIndex; // Store original index for update/delete operations

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

    // Attach event listeners to action buttons within this row
    tr.querySelector('.edit-btn').addEventListener('click', () => startEditing(tr, data));
    tr.querySelector('.save-btn').addEventListener('click', () => saveRow(tr));
    tr.querySelector('.cancel-btn').addEventListener('click', () => cancelEditing(tr));
    tr.querySelector('.delete-btn').addEventListener('click', () => confirmDelete(tr));

    return tr;
}

/**
 * Creates the always-present empty row for new data input.
 * @returns {HTMLElement} The created table row (<tr>) with input fields.
 */
function createEmptyRow() {
    const tr = document.createElement('tr');
    tr.classList.add('empty-row', 'editing'); // Add 'editing' class to style input fields
    tr.dataset.index = 'new'; // Indicate this is a new row, not an existing one

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
    
    // Attach input-specific event listeners (for date picker and input edit modal)
    attachInputEventListeners(tr);
    
    // Attach save button listener for this new row
    tr.querySelector('.save-btn').addEventListener('click', () => saveRow(tr));
    
    return tr;
}


// --- Edit/Save/Cancel Logic ---
/**
 * Puts a table row into editing mode, replacing display text with input fields.
 * @param {HTMLElement} row - The table row (<tr>) to edit.
 * @param {Object} originalData - The original data of the row before editing.
 */
function startEditing(row, originalData) {
    editingRowOriginalData = { ...originalData }; // Save a copy of original data for 'Cancel'
    row.classList.add('editing'); // Add class to apply editing styles
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
        if (index === 0) { // SI. column - not editable, skip
            // Do nothing, SI. number is automatically handled
        } else if (index >= 1 && index <= 4) { // Date, Heading, Subject, Link columns
            // Determine which data key corresponds to this cell's content
            const dataKeys = ['date', 'heading', 'subject', 'link'];
            const dataKeyIndex = index - 1; // Adjust index because SI. is at 0
            const currentContent = originalData[dataKeys[dataKeyIndex]];
            
            let inputType = 'text';
            let inputClass = '';
            let placeholder = '';

            if (dataKeyIndex === 0) { // Date column
                inputClass = 'input-date';
                inputType = 'text'; // Use text for custom date picker
                placeholder = 'DD-MM-YYYY';
            } else if (dataKeyIndex === 1) { // Heading
                inputClass = 'input-heading';
                placeholder = 'Heading';
            } else if (dataKeyIndex === 2) { // Subject
                inputClass = 'input-subject';
                placeholder = 'Subject';
            } else if (dataKeyIndex === 3) { // Link
                inputClass = 'input-link';
                placeholder = 'Link (Optional)';
            }

            // Replace cell content with an input field
            cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${currentContent}" placeholder="${placeholder}" ${dataKeyIndex === 0 ? 'readonly' : ''}>`;
        }
    });

    // Attach input-specific event listeners to the newly created input fields
    attachInputEventListeners(row);

    // Show/hide action buttons
    row.querySelector('.edit-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = 'inline-block';
    row.querySelector('.cancel-btn').style.display = 'inline-block';
    row.querySelector('.delete-btn').style.display = 'none';
}

/**
 * Saves the data from an edited or new table row.
 * Performs validation before saving.
 * @param {HTMLElement} row - The table row (<tr>) being saved.
 */
function saveRow(row) {
    // Retrieve values from input fields
    const dateInput = row.querySelector('.input-date');
    const headingInput = row.querySelector('.input-heading');
    const subjectInput = row.querySelector('.input-subject');
    const linkInput = row.querySelector('.input-link');

    const date = dateInput ? dateInput.value.trim() : '';
    const heading = headingInput ? headingInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value.trim() : '';
    const link = linkInput ? linkInput.value.trim() : '';

    // --- Validation ---
    if (!date) { 
        showValidationMessage('Please fill up the Date field.'); 
        if (dateInput) dateInput.focus(); // Focus on the problematic input
        return; 
    }
    if (!heading) { 
        showValidationMessage('Please fill up the Heading field.'); 
        if (headingInput) headingInput.focus();
        return; 
    }
    if (!subject) { 
        showValidationMessage('Please fill up the Subject field.'); 
        if (subjectInput) subjectInput.focus();
        return; 
    }

    const newRowData = { date, heading, subject, link };
    const rowIndex = row.dataset.index;

    if (rowIndex === 'new') { // If it's a new entry
        tableData.unshift(newRowData); // Add to the beginning of the array
        currentPage = 1; // Go to the first page to see the new entry
    } else { // If it's an existing row being edited
        tableData[parseInt(rowIndex)] = newRowData; // Update data at its original index
    }

    localStorage.setItem('tableData', JSON.stringify(tableData)); // Persist data
    row.classList.remove('editing'); // Remove editing class
    editingRowOriginalData = null; // Clear original data

    renderTable(); // Re-render the table to show updated data
}

/**
 * Cancels editing for a row, reverting it to its original state or clearing it if new.
 * @param {HTMLElement} row - The table row (<tr>) on which editing is cancelled.
 */
function cancelEditing(row) {
    const rowIndex = row.dataset.index;
    if (rowIndex === 'new') {
        // If it was the empty row, simply clear inputs and re-render to reset
        row.querySelectorAll('input').forEach(input => input.value = '');
        renderTable(); // This will recreate the empty row in its initial state
    } else {
        // Revert to original data for an existing row
        tableData[parseInt(rowIndex)] = { ...editingRowOriginalData };
        editingRowOriginalData = null; // Clear original data
        row.classList.remove('editing'); // Remove editing class
        renderTable(); // Re-render to show original data
    }
}


// --- Delete Functionality ---
/**
 * Shows the delete confirmation modal.
 * @param {HTMLElement} row - The table row (<tr>) to be deleted.
 */
function confirmDelete(row) {
    rowToDelete = row; // Store the row element globally
    deleteConfirmModal.style.display = 'block'; // Show the modal
}


// --- Pagination Functions ---
/**
 * Renders the pagination controls (Previous, Next, and page number buttons).
 */
function renderPaginationControls() {
    paginationControls.innerHTML = ''; // Clear existing controls
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    // Don't show pagination if there's no data or only one page of data
    if (totalPages <= 1 && tableData.length <= rowsPerPage && dataTableBody.children.length <= 1) {
        return;
    }
    if (totalPages <= 1 && tableData.length <= rowsPerPage) {
         return; // If only 1 page or less data than rowsPerPage, no pagination needed
    }

    // Create 'Back' button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Back';
    prevBtn.disabled = currentPage === 1; // Disable if on the first page
    prevBtn.addEventListener('click', () => {
        currentPage--; // Decrement page number
        renderTable(); // Re-render table
    });
    paginationControls.appendChild(prevBtn);

    // Create page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage); // Highlight active page
        pageBtn.addEventListener('click', () => {
            currentPage = i; // Set current page
            renderTable(); // Re-render table
        });
        paginationControls.appendChild(pageBtn);
    }

    // Create 'Next' button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages; // Disable if on the last page
    nextBtn.addEventListener('click', () => {
        currentPage++; // Increment page number
        renderTable(); // Re-render table
    });
    paginationControls.appendChild(nextBtn);
}


// --- Date Picker Functions ---
/**
 * Populates the month and year dropdowns in the date picker.
 */
function populateMonthYearSelects() {
    const currentYearFull = new Date().getFullYear();

    // Populate years (e.g., from 5 years before to 5 years after current year)
    for (let i = currentYearFull - 5; i <= currentYearFull + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear; // Set initial selected year

    // Populate months (January to December)
    for (let i = 0; i < 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = new Date(0, i).toLocaleString('en-US', { month: 'long' }); // Get full month name
        monthSelect.appendChild(option);
    }
    monthSelect.value = currentMonth; // Set initial selected month

    // Add event listeners for month and year changes
    monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        populateCalendar(currentMonth, currentYear);
    });
    yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        populateCalendar(currentMonth, currentYear);
    });
}

/**
 * Populates the calendar grid for a given month and year.
 * @param {number} month - The month (0-indexed: 0 for Jan, 11 for Dec).
 * @param {number} year - The full year (e.g., 2023).
 */
function populateCalendar(month, year) {
    // Update dropdowns to match current calendar view
    monthSelect.value = month;
    yearSelect.value = year;

    calendarDates.innerHTML = ''; // Clear previous dates

    // Get the day of the week for the first day of the month (0=Sunday, 6=Saturday)
    const firstDay = new Date(year, month, 1).getDay(); 
    // Get the number of days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 

    // Add empty spans for days before the 1st of the month to align correctly
    for (let i = 0; i < firstDay; i++) {
        const span = document.createElement('span');
        span.classList.add('empty'); // Hide these empty cells
        calendarDates.appendChild(span);
    }

    // Get today's date for highlighting
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Populate days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const span = document.createElement('span');
        // Format date as DD-MM-YYYY
        const formattedDate = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
        span.textContent = day; // Display just the day number
        span.dataset.date = formattedDate; // Store full formatted date in data attribute

        // Add 'today-date' class if it's today
        if (day === todayDate && month === todayMonth && year === todayYear) {
            span.classList.add('today-date');
        }

        // Add 'selected-date' class if it matches the current input field's value
        if (currentDatePickerInput && currentDatePickerInput.value === formattedDate) {
            span.classList.add('selected-date');
        }

        // Add click listener to select the date
        span.addEventListener('click', () => {
            if (currentDatePickerInput) {
                currentDatePickerInput.value = formattedDate; // Set input field's value
                datePickerModal.style.display = 'none'; // Close picker
            }
        });
        calendarDates.appendChild(span);
    }
}
// Event listeners for month navigation buttons
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { // If going back from January, go to December of previous year
        currentMonth = 11;
        currentYear--;
    }
    populateCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { // If going forward from December, go to January of next year
        currentMonth = 0;
        currentYear++;
    }
    populateCalendar(currentMonth, currentYear);
});

// --- Functions for Input Edit Modal (Pop-up) ---
/**
 * Attaches event listeners to input fields within a row.
 * This includes opening the date picker for date fields and
 * opening the general input edit modal for other text fields.
 * @param {HTMLElement} rowElement - The table row (<tr>) containing input fields.
 */
function attachInputEventListeners(rowElement) {
    // Date input: opens date picker
    const dateInput = rowElement.querySelector('.input-date');
    if (dateInput) {
        dateInput.addEventListener('click', (e) => {
            currentDatePickerInput = e.target; // Store reference to the clicked input
            datePickerModal.style.display = 'block'; // Show date picker modal
            
            const inputDateStr = e.target.value; // Get current date string from the input field
            if (inputDateStr) {
                const parts = inputDateStr.split('-'); // Split DD-MM-YYYY
                if (parts.length === 3) {
                    // Update currentMonth and currentYear to show the input's date in calendar
                    currentMonth = parseInt(parts[1]) - 1; // Month is 0-indexed
                    currentYear = parseInt(parts[2]);
                }
            } else {
                // If input is empty, show today's date in calendar
                const today = new Date();
                currentMonth = today.getMonth();
                currentYear = today.getFullYear();
            }
            populateCalendar(currentMonth, currentYear); // Re-populate calendar based on determined month/year
        });
    }
    // Other inputs (Heading, Subject, Link): opens general edit modal
    rowElement.querySelectorAll('input[type="text"]:not(.input-date)').forEach(input => {
        input.addEventListener('click', (e) => {
            currentEditInput = e.target; // Store reference to the clicked input
            
            // Determine modal heading based on the table header of the clicked column
            const cellIndex = Array.from(e.target.closest('tr').children).indexOf(e.target.closest('td'));
            const headerText = document.querySelector('#data-table thead th:nth-child(' + (cellIndex + 1) + ')').textContent;
            inputEditModalHeading.textContent = headerText; // Set modal heading

            inputEditTextArea.value = e.target.value; // Set textarea value to current input value
            inputEditModal.style.display = 'block'; // Show input edit modal
            inputEditTextArea.focus(); // Focus on the textarea for easy editing
        });
    });
}
// Event listener for 'Store' button in the input edit modal
storeInputBtn.addEventListener('click', () => {
    if (currentEditInput) {
        currentEditInput.value = inputEditTextArea.value.trim(); // Transfer edited text to the table input field
        inputEditModal.style.display = 'none'; // Hide modal
        inputEditTextArea.value = ''; // Clear textarea
        currentEditInput = null; // Reset
    }
});

// Event listener for 'Cancel' button in the input edit modal
cancelInputBtn.addEventListener('click', () => {
    inputEditModal.style.display = 'none'; // Hide modal
    inputEditTextArea.value = ''; // Clear textarea
    currentEditInput = null; // Reset
    // Note: The original input field's value is not changed here, ensuring 'Cancel' truly reverts.
});
// Event listener for 'Cancel' button in the input edit modal
cancelInputBtn.addEventListener('click', () => {
    inputEditModal.style.display = 'none'; // Hide modal
    inputEditTextArea.value = ''; // Clear textarea
    currentEditInput = null; // Reset
    // Note: The original input field's value is not changed here, ensuring 'Cancel' truly reverts.
});


// --- Validation Modal ---
/**
 * Displays a custom validation/alert message in a modal.
 * @param {string} message - The message to display.
 */
function showValidationMessage(message) {
    validationMessage.textContent = message; // Set message content
    validationModal.style.display = 'block'; // Show the validation modal
}

        
