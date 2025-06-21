// Data Storage (localStorage for persistence)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10;

const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let rowToDelete = null; // Track which row is to be deleted
let editingRowOriginalData = null; // To store original data for cancel operation

// Initial Render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
});

// Function to render table rows
function renderTable() {
    dataTableBody.innerHTML = ''; // Clear existing rows

    // Add the empty input row at the top (always)
    // Problem 4 solved: Empty row always at the top
    dataTableBody.appendChild(createEmptyRow());

    // Calculate start and end index for current page from actual data
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    // Render data rows
    paginatedData.forEach((rowData, index) => {
        const row = createTableRow(rowData, startIndex + index);
        dataTableBody.appendChild(row);
    });

    renderPaginationControls();
}

// Function to create a data row (for existing data)
function createTableRow(data, index) {
    const tr = document.createElement('tr');
    tr.dataset.index = index; // Store original index for easy access
    
    // Set initial text content for data rows
    tr.innerHTML = `
        <td>${data.date}</td>
        <td>${data.heading}</td>
        <td>${data.subject}</td>
        <td><a href="${data.link}" target="_blank" ${!data.link ? 'style="display:none;"' : ''}>${data.link || ''}</a></td>
        <td class="action-buttons">
            <button class="edit-btn">Edit</button>
            <button class="save-btn" style="display:none;">Save</button>
            <button class="cancel-btn" style="display:none;">Cancel</button> <button class="delete-btn">Delete</button>
        </td>
    `;

    // Event Listeners
    tr.querySelector('.edit-btn').addEventListener('click', (e) => startEditing(tr, data));
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    tr.querySelector('.cancel-btn').addEventListener('click', (e) => cancelEditing(tr)); // Problem 5: Cancel button handler
    tr.querySelector('.delete-btn').addEventListener('click', (e) => confirmDelete(tr));

    return tr;
}

// Function to create the always-present empty row for input
function createEmptyRow() {
    const tr = document.createElement('tr');
    tr.classList.add('empty-row', 'editing'); // Empty row always starts in editing state for input
    tr.dataset.index = 'new'; // Mark as a new, unsaved row

    tr.innerHTML = `
        <td><input type="text" class="input-date" placeholder="Date"></td>
        <td><input type="text" class="input-heading" placeholder="Heading"></td>
        <td><input type="text" class="input-subject" placeholder="Subject"></td>
        <td><input type="text" class="input-link" placeholder="Link (Optional)"></td>
        <td class="action-buttons">
            <button class="save-btn">Save</button> <button class="cancel-btn" style="display:none;">Cancel</button> <button class="delete-btn" style="display:none;">Delete</button> </td>
    `;
    // Attach save handler to the save button
    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));
    
    // The "Edit" button logic is removed from empty row, as it's directly savable
    // No specific cancel logic needed here for empty row on initial render
    
    return tr;
}

// Problem 2 solved: Start editing on button click, not before
function startEditing(row, originalData) {
    editingRowOriginalData = { ...originalData }; // Store a copy of original data
    row.classList.add('editing');
    const cells = row.querySelectorAll('td');

    cells.forEach((cell, index) => {
        if (index < 4) { // Date, Heading, Subject, Link columns
            const currentContent = originalData[Object.keys(originalData)[index]]; // Get data from object keys
            let inputClass = '';
            if (index === 0) inputClass = 'input-date';
            else if (index === 1) inputClass = 'input-heading';
            else if (index === 2) inputClass = 'input-subject';
            else if (index === 3) inputClass = 'input-link';

            cell.innerHTML = `<input type="text" class="${inputClass}" value="${currentContent}">`;
        }
    });

    // Problem 1 solved: Show Save and Cancel buttons, hide Edit/Delete
    row.querySelector('.edit-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = 'inline-block';
    row.querySelector('.cancel-btn').style.display = 'inline-block'; // Show Cancel
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
        tableData.unshift(newRowData); // Add to the beginning
        currentPage = 1; // Go to first page for new entry
    } else {
        tableData[parseInt(rowIndex)] = newRowData; // Update existing
    }

    localStorage.setItem('tableData', JSON.stringify(tableData));
    row.classList.remove('editing'); // Remove editing class
    editingRowOriginalData = null; // Clear original data

    renderTable(); // Re-render the table
}

// Problem 5 solved: Cancel button functionality
function cancelEditing(row) {
    const rowIndex = row.dataset.index;
    if (rowIndex === 'new') {
        // If it was the empty row and user clicks cancel, just re-render
        // to reset the empty row if any changes were made but not saved.
        // It shouldn't have a cancel button initially, but good to handle.
        renderTable();
    } else {
        // Revert to original data for existing row
        tableData[parseInt(rowIndex)] = { ...editingRowOriginalData };
        editingRowOriginalData = null;
        row.classList.remove('editing'); // Remove editing class
        renderTable(); // Re-render to show original data
    }
}


// Delete Functionality
function confirmDelete(row) {
    rowToDelete = row;
    deleteConfirmModal.style.display = 'block';
}

confirmDeleteBtn.addEventListener('click', () => {
    if (rowToDelete) {
        const index = parseInt(rowToDelete.dataset.index);
        tableData.splice(index, 1);
        localStorage.setItem('tableData', JSON.stringify(tableData));
        rowToDelete = null;
        deleteConfirmModal.style.display = 'none';
        
        // Adjust currentPage if last row on a page was deleted
        const totalPages = Math.ceil(tableData.length / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) { // If all data is deleted
            currentPage = 1;
        }

        renderTable();
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    rowToDelete = null;
    deleteConfirmModal.style.display = 'none';
});

// Pagination
function renderPaginationControls() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    // Only show pagination if there's more than 1 page of data
    if (totalPages <= 1) {
        // If only 1 page or less data than rowsPerPage, no pagination needed except for empty state
        if (tableData.length === 0 && dataTableBody.children.length === 1 && dataTableBody.children[0].classList.contains('empty-row')) {
            // Only empty row, no pagination needed
            return;
        }
    }


    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Back';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        currentPage--;
        renderTable();
    });
    paginationControls.appendChild(prevBtn);

    // Page numbers
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
