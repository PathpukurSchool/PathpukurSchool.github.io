// Data Storage (localStorage for persistence)
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentPage = 1;
const rowsPerPage = 10; // এক পৃষ্ঠায় সর্বোচ্চ 10টি রো

const dataTableBody = document.querySelector('#data-table tbody');
const paginationControls = document.getElementById('pagination-controls');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let rowToDelete = null; // Track which row is to be deleted

// 1. Initial Render
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the first empty row is always there when page loads
    // If no data exists, or if tableData is not full, add empty rows
    renderTable();
});

// Function to render table rows
function renderTable() {
    dataTableBody.innerHTML = ''; // Clear existing rows

    // Calculate start and end index for current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    // Render data rows
    paginatedData.forEach((rowData, index) => {
        const row = createTableRow(rowData, startIndex + index);
        dataTableBody.appendChild(row);
    });

    // Add empty row if tableData has less than rowsPerPage OR if it's the first page
    // and there's space for the input row
    const actualRowsOnPage = paginatedData.length;
    if (actualRowsOnPage < rowsPerPage || currentPage === 1) {
        // Add empty row only if total data is less than rowsPerPage * total pages + 1
        // This ensures input row is always on page 1, and only if there's less than 10 rows
        if (currentPage === 1 && actualRowsOnPage < rowsPerPage) {
             dataTableBody.appendChild(createEmptyRow());
        } else if (actualRowsOnPage < rowsPerPage && tableData.length < rowsPerPage) {
            // This case handles if user deletes all rows and comes to empty state,
            // or if initial data is < 10 but not on page 1
             dataTableBody.appendChild(createEmptyRow());
        }
       
    }


    renderPaginationControls();
}

// Function to create a data row
function createTableRow(data, index) {
    const tr = document.createElement('tr');
    tr.dataset.index = index; // Store original index for easy access

    tr.innerHTML = `
        <td>${data.date}</td>
        <td>${data.heading}</td>
        <td>${data.subject}</td>
        <td><a href="${data.link}" target="_blank" ${!data.link ? 'style="display:none;"' : ''}>${data.link || ''}</a></td>
        <td class="action-buttons">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;

    // Event Listeners for Edit/Delete
    tr.querySelector('.edit-btn').addEventListener('click', (e) => toggleEditSave(tr));
    tr.querySelector('.delete-btn').addEventListener('click', (e) => confirmDelete(tr));

    return tr;
}

// Function to create the always-present empty row for input
function createEmptyRow() {
    const tr = document.createElement('tr');
    tr.classList.add('empty-row'); // Add class for specific styling
    tr.dataset.index = 'new'; // Mark as a new, unsaved row

    tr.innerHTML = `
        <td><input type="text" class="input-date" placeholder="Date"></td>
        <td><input type="text" class="input-heading" placeholder="Heading"></td>
        <td><input type="text" class="input-subject" placeholder="Subject"></td>
        <td><input type="text" class="input-link" placeholder="Link (Optional)"></td>
        <td class="action-buttons">
            <button class="edit-btn">Edit</button>
            <button class="save-btn" style="display:none;">Save</button>
            <button class="delete-btn" style="display:none;">Delete</button> </td>
    `;
    
    // The "Edit" button on the empty row immediately becomes a "Save" button on click
    tr.querySelector('.edit-btn').addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        row.classList.add('editing'); // Make inputs active
        row.querySelector('.edit-btn').style.display = 'none';
        row.querySelector('.save-btn').style.display = 'inline-block';
        // No delete button on empty row, so no need to hide/show
    });

    tr.querySelector('.save-btn').addEventListener('click', (e) => saveRow(tr));

    return tr;
}


// 2. Edit/Save Functionality
function toggleEditSave(row) {
    const isEditing = row.classList.contains('editing');
    const cells = row.querySelectorAll('td');

    if (isEditing) {
        // Save logic
        saveRow(row);
    } else {
        // Edit logic
        row.classList.add('editing');
        cells.forEach((cell, index) => {
            if (index < 4) { // Date, Heading, Subject, Link columns
                const originalContent = cell.textContent.trim();
                let inputType = 'text';
                let inputClass = '';
                if (index === 0) inputClass = 'input-date';
                else if (index === 1) inputClass = 'input-heading';
                else if (index === 2) inputClass = 'input-subject';
                else if (index === 3) inputClass = 'input-link';

                // Handle Link column separately for <a> tag
                if (index === 3 && cell.querySelector('a')) {
                    cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${cell.querySelector('a').href || ''}" placeholder="Link (Optional)">`;
                } else {
                    cell.innerHTML = `<input type="${inputType}" class="${inputClass}" value="${originalContent}">`;
                }
            }
        });

        // Toggle buttons
        row.querySelector('.edit-btn').style.display = 'none';
        row.querySelector('.save-btn').style.display = 'inline-block';
        row.querySelector('.delete-btn').style.display = 'none'; // Hide delete when editing
    }
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
        // This is a new row from the empty input row
        tableData.unshift(newRowData); // Add to the beginning of the array
        currentPage = 1; // Always go back to the first page when new data is added
    } else {
        // Existing row is being edited
        tableData[rowIndex] = newRowData;
    }

    localStorage.setItem('tableData', JSON.stringify(tableData));
    row.classList.remove('editing'); // Remove editing class

    renderTable(); // Re-render the table to show updated data or move new row
}

// 3. Delete Functionality
function confirmDelete(row) {
    rowToDelete = row; // Store the row to be deleted globally
    deleteConfirmModal.style.display = 'block';
}

confirmDeleteBtn.addEventListener('click', () => {
    if (rowToDelete) {
        const index = parseInt(rowToDelete.dataset.index);
        tableData.splice(index, 1); // Remove from array
        localStorage.setItem('tableData', JSON.stringify(tableData));
        rowToDelete = null; // Reset
        deleteConfirmModal.style.display = 'none';
        
        // Adjust currentPage if last row on a page was deleted
        const totalPages = Math.ceil(tableData.length / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 1; // If all data is deleted, go to page 1
        }

        renderTable(); // Re-render the table
    }
});

cancelDeleteBtn.addEventListener('click', () => {
    rowToDelete = null; // Reset
    deleteConfirmModal.style.display = 'none';
});

// 4. Pagination
function renderPaginationControls() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    if (totalPages <= 1 && tableData.length < rowsPerPage) {
        // No pagination needed if less than or equal to 10 actual data rows
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

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage); // Highlight active page
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
