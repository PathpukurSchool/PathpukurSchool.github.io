
// scrolling_student.js

// --- Constant & Data ---
const ROWS_PER_PAGE = 10;
let scrollingStudentTableData = [];
let scrollingStudentPagination = null;

// --- Modal Elements ---
const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');
const validationCloseBtn = document.getElementById('validationCloseBtn');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let currentEditingRow = null;
let currentTableId = 'table-scrolling-student';
let rowToClear = null;

// --- Helpers ---
function getColumnNamesForTable(tableId) {
    if (tableId === 'table-scrolling-student') return ['Subject', 'Color', 'Action'];
    return [];
}

function getContrastYIQ(hexcolor){
    const r = parseInt(hexcolor.substr(1,2),16);
    const g = parseInt(hexcolor.substr(3,2),16);
    const b = parseInt(hexcolor.substr(5,2),16);
    return ((r*299 + g*587 + b*114)/1000 >= 128) ? 'black' : 'white';
}

function showValidationMessage(message) {
    validationMessage.textContent = message;
    validationModal.style.display = 'flex';
}

// --- Row Creation ---
function createEditableInput(colName, currentValue) {
    if (colName === 'Color') {
        const wrapper = document.createElement('div');
        wrapper.classList.add('color-input-wrapper');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.classList.add('color-input');
        const preview = document.createElement('span');
        preview.classList.add('color-preview');
        preview.style.backgroundColor = currentValue;
        preview.style.borderColor = currentValue || '#ccc';
        input.addEventListener('input', (e) => {
            preview.style.backgroundColor = e.target.value;
            preview.style.borderColor = e.target.value || '#ccc';
        });
        wrapper.append(input, preview);
        return wrapper;
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.classList.add('text-input');
        return input;
    }
}

function createTableRow(rowData = {}, isEditing = false, isInputRow = false) {
    const row = document.createElement('tr');
    if (isEditing) row.classList.add('editing');
    if (isInputRow) row.classList.add('input-row');

    const table = document.getElementById(currentTableId);
    const cols = getColumnNamesForTable(currentTableId);

    cols.forEach(colName => {
        const cell = document.createElement('td');
        const val = rowData[colName] || '';

        if (colName === 'Action') {
            const div = document.createElement('div');
            div.classList.add('action-buttons');

            if (isInputRow) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-btn';
                saveBtn.textContent = 'Save';
                saveBtn.onclick = () => saveRow(row, true);
                div.appendChild(saveBtn);
            } else if (isEditing) {
                const saveBtn = document.createElement('button');
                saveBtn.className = 'save-btn';
                saveBtn.textContent = 'Save';
                saveBtn.onclick = () => saveRow(row, false);
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'cancel-btn';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.onclick = () => cancelEdit(row);
                div.append(saveBtn, cancelBtn);
            } else {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.textContent = 'Edit';
                editBtn.onclick = () => editRow(row);
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => deleteRow(row);
                div.append(editBtn, deleteBtn);
            }

            cell.appendChild(div);
        } else {
            if (isEditing || isInputRow) {
                const inp = createEditableInput(colName, val);
                cell.appendChild(inp);
            } else {
                if (colName === 'Color' && val) {
                    cell.textContent = val;
                    cell.style.backgroundColor = val;
                    cell.style.color = getContrastYIQ(val);
                } else {
                    cell.textContent = val;
                }
            }
        }

        row.appendChild(cell);
    });

    return row;
}

// --- Pagination Setup ---
function setupPagination(tableId, dataArray) {
    let currentPage = 1;
    const totalPages = Math.ceil(dataArray.length / ROWS_PER_PAGE);
    const tbody = document.getElementById(tableId).querySelector('tbody');
    const paginationContainer = document.getElementById(`pagination-${tableId}`);

    function displayPage(page) {
        currentPage = page;
        tbody.innerHTML = '';

        const inputRow = createTableRow({}, false, true);
        tbody.appendChild(inputRow);

        const start = (page - 1) * ROWS_PER_PAGE;
        const end = start + ROWS_PER_PAGE;
        const pageData = dataArray.slice(start, end);

        pageData.forEach(rd => tbody.appendChild(createTableRow(rd, false, false)));
        updatePagination();
    }

    function updatePagination() {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1 && dataArray.length <= ROWS_PER_PAGE) return;

        const prev = document.createElement('button');
        prev.textContent = 'Previous';
        prev.disabled = currentPage === 1;
        prev.onclick = () => displayPage(currentPage - 1);
        paginationContainer.append(prev);

        for (let i = 1; i <= totalPages; i++) {
            const span = document.createElement('span');
            span.textContent = i;
            if (i === currentPage) span.classList.add('current-page');
            span.onclick = () => displayPage(i);
            paginationContainer.append(span);
        }

        const next = document.createElement('button');
        next.textContent = 'Next';
        next.disabled = currentPage === totalPages;
        next.onclick = () => displayPage(currentPage + 1);
        paginationContainer.append(next);
    }

    displayPage(1);
    return { displayPage, updatePagination, get currentPage() { return currentPage; } };
}

// --- Row Actions ---
function saveRow(row, isNew) {
    const cols = getColumnNamesForTable(currentTableId);
    const rowData = {};
    let valid = true;
    let msg = '';

    row.querySelectorAll('td').forEach((cell, idx) => {
        const colName = cols[idx];
        const inp = cell.querySelector('input');
        const val = inp ? inp.value.trim() : cell.textContent.trim();
        rowData[colName] = val;
    });

    ['Subject', 'Color'].forEach(col => {
        if (!rowData[col]) {
            valid = false;
            msg = `${col} ফিল্ডটি আবশ্যিক।`;
        }
    });

    if (!valid) {
        showValidationMessage(msg);
        return;
    }

    if (isNew) {
        scrollingStudentTableData.unshift(rowData);
        showValidationMessage("নতুন ডেটা সফলভাবে যোগ হয়েছে!");
    } else {
        const orig = JSON.parse(row.dataset.originalData);
        scrollingStudentTableData = scrollingStudentTableData.map(item =>
            (item.Subject === orig.Subject && item.Color === orig.Color)
                ? rowData : item
        );
        showValidationMessage("ডেটা সফলভাবে আপডেট হয়েছে!");
    }

    scrollingStudentPagination.displayPage(scrollingStudentPagination.currentPage);
    scrollingStudentPagination.updatePagination();
}

function editRow(row) {
    const cols = getColumnNamesForTable(currentTableId);
    const orig = {};
    row.querySelectorAll('td').forEach((cell, idx) => {
        if (cols[idx] !== 'Action') orig[cols[idx]] = cell.textContent.trim();
    });
    row.dataset.originalData = JSON.stringify(orig);
    row.replaceWith(createTableRow(orig, true, false));
}

function cancelEdit(row) {
    const orig = JSON.parse(row.dataset.originalData || '{}');
    row.replaceWith(createTableRow(orig, false, false));
}

function deleteRow(row) {
    currentEditingRow = row;
    confirmMessage.textContent = "আপনি কি এই সারি ডিলেট করতে চান?";
    deleteConfirmModal.style.display = 'flex';
}

// --- Modal Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    validationCloseBtn.onclick = () => validationModal.style.display = 'none';
    cancelDeleteBtn.onclick = () => { deleteConfirmModal.style.display = 'none'; currentEditingRow = null; };
    confirmDeleteBtn.onclick = () => {
        if (currentEditingRow) {
            const cols = getColumnNamesForTable(currentTableId);
            const data = {};
            currentEditingRow.querySelectorAll('td').forEach((cell, i) => {
                data[cols[i]] = cell.textContent.trim();
            });
            scrollingStudentTableData = scrollingStudentTableData.filter(item =>
                !(item.Subject === data.Subject && item.Color === data.Color)
            );
            scrollingStudentPagination.displayPage(scrollingStudentPagination.currentPage);
            scrollingStudentPagination.updatePagination();
            showValidationMessage("সফলভাবে ডিলিট হয়েছে!");
        }
        deleteConfirmModal.style.display = 'none';
    };
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    scrollingStudentTableData = [];
    scrollingStudentPagination = setupPagination('table-scrolling-student', scrollingStudentTableData);
});
