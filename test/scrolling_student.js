
// scrolling_student.js

// --- গ্লোবাল ভেরিয়েবল এবং হেল্পার ফাংশন (এই ফাইলের জন্য নির্দিষ্ট) ---
const ROWS_PER_PAGE = 10; // প্রতি পৃষ্ঠায় সারির সংখ্যা

// এই সেকশনের জন্য ডেটা অ্যারে এবং পেজিনেশন অবজেক্ট
let scrollingStudentTableData = [];
let scrollingStudentPagination = null;

// সাধারণ মডেলের রেফারেন্স (যদি একই মডেল HTML-এ থাকে)
const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');
const validationCloseBtn = document.getElementById('validationCloseBtn');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let currentEditingRow = null; // বর্তমান এডিটিং/ডিলিটিং রো
let currentTableId = 'table-scrolling-student'; // এই ফাইলের জন্য নির্দিষ্ট টেবিল আইডি

// --- গ্লোবাল হেল্পার ফাংশন (এই ফাইলের জন্য কপি করা) ---
function getColumnNamesForTable(tableId) {
    if (tableId === 'table-scrolling-student') return ['Subject', 'Color', 'Action'];
    return []; // অন্য টেবিলের জন্য খালি
}

function getContrastYIQ(hexcolor){
    var r = parseInt(hexcolor.substr(1,2),16);
    var g = parseInt(hexcolor.substr(3,2),16);
    var b = parseInt(hexcolor.substr(5,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

function showValidationMessage(message) {
    validationMessage.textContent = message;
    validationModal.style.display = 'flex';
}

// createEditableInput ফাংশন (শুধুমাত্র Subject এবং Color এর জন্য)
function createEditableInput(colName, currentValue) {
    let inputElement;
    const wrapper = document.createElement('div'); // Color ইনপুটের জন্য Wrapper

    if (colName === 'Color') {
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = currentValue;
        inputElement.classList.add('color-input');
        const colorPreview = document.createElement('span');
        colorPreview.classList.add('color-preview');
        colorPreview.style.backgroundColor = currentValue;
        colorPreview.style.borderColor = currentValue ? currentValue : '#ccc';
        inputElement.addEventListener('input', (event) => {
            colorPreview.style.backgroundColor = event.target.value;
            colorPreview.style.borderColor = event.target.value ? event.target.value : '#ccc';
        });
        wrapper.appendChild(inputElement);
        wrapper.appendChild(colorPreview);
        wrapper.classList.add('color-input-wrapper');
        return wrapper;
    } else { // Subject
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = currentValue;
        inputElement.classList.add('text-input');
    }
    return inputElement;
}

// createTableRow ফাংশন (এই ফাইলের জন্য কপি করা)
function createTableRow(rowData = {}, isEditing = false, isInputRow = false) {
    const row = document.createElement('tr');
    if (isEditing) row.classList.add('editing');
    if (isInputRow) row.classList.add('input-row');

    const tableId = row.closest('table') ? row.closest('table').id : null;
    const columnNames = getColumnNamesForTable(tableId);

    if (!tableId || columnNames.length === 0) {
        console.error("Error: Could not determine column names for table:", tableId, "or table not found.");
        return row;
    }

    columnNames.forEach((colName) => {
        const cell = document.createElement('td');
        const value = rowData[colName] || '';

        if (colName === 'Action') {
            const actionDiv = document.createElement('div');
            actionDiv.classList.add('action-buttons');

            if (isInputRow) {
                const saveBtn = document.createElement('button');
                saveBtn.classList.add('save-btn');
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', () => saveRow(row, true));
                actionDiv.appendChild(saveBtn);
            } else if (isEditing) {
                const saveBtn = document.createElement('button');
                saveBtn.classList.add('save-btn');
                saveBtn.textContent = 'Save';
                saveBtn.addEventListener('click', () => saveRow(row, false));
                actionDiv.appendChild(saveBtn);

                const cancelBtn = document.createElement('button');
                cancelBtn.classList.add('cancel-btn');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.addEventListener('click', () => cancelEdit(row));
                actionDiv.appendChild(cancelBtn);
            } else {
                const editBtn = document.createElement('button');
                editBtn.classList.add('edit-btn');
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', () => editRow(row));

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-btn');
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => deleteRow(row));
                actionDiv.appendChild(deleteBtn);
                actionDiv.appendChild(editBtn);
            }
            cell.appendChild(actionDiv);
        } else {
            if (isEditing || isInputRow) {
                const input = createEditableInput(colName, value);
                cell.appendChild(input);
            } else {
                if (colName === 'Color' && value) {
                    cell.textContent = value;
                    cell.style.backgroundColor = value;
                    cell.style.color = getContrastYIQ(value);
                } else {
                    cell.textContent = value;
                }
            }
        }
        row.appendChild(cell);
    });
    return row;
}

// setupPagination ফাংশন (এই ফাইলের জন্য কপি করা)
function setupPagination(tableId, dataArray, createRowFn) {
    let currentPage = 1;
    const totalPages = Math.ceil(dataArray.length / ROWS_PER_PAGE);

    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const paginationContainer = document.getElementById(`pagination-${tableId}`);

    function displayPage(page) {
        currentPage = page;
        tbody.innerHTML = '';

        // Input Row কে সর্বদা শীর্ষে রাখুন (Scrolling Notice tables এর জন্য)
        if (tableId === 'table-scrolling-student') { // নিশ্চিত করুন সঠিক টেবিল আইডি
            const inputRowElement = createRowFn({}, false, true); // isInputRow = true
            tbody.appendChild(inputRowElement);
        }

        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        const pageData = dataArray.slice(startIndex, endIndex);

        if (pageData.length === 0 && tableId !== 'table-scrolling-student') {
            const noDataRow = document.createElement('tr');
            const colSpan = getColumnNamesForTable(tableId).length;
            noDataRow.innerHTML = `<td colspan="${colSpan}" style="text-align: center;">কোন ডেটা নেই।</td>`;
            tbody.appendChild(noDataRow);
        } else {
            pageData.forEach(rowData => {
                const row = createRowFn(rowData, false, false);
                tbody.appendChild(row);
            });
        }
        updatePaginationButtons();
    }

    function updatePaginationButtons() {
        if (!paginationContainer) return; // Null check
        paginationContainer.innerHTML = '';

        if (totalPages <= 1 && dataArray.length <= ROWS_PER_PAGE) {
            return;
        }

        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => displayPage(currentPage - 1));
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.textContent = i;
            if (i === currentPage) {
                pageSpan.classList.add('current-page');
            }
            pageSpan.addEventListener('click', () => displayPage(i));
            paginationContainer.appendChild(pageSpan);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => displayPage(currentPage + 1));
        paginationContainer.appendChild(nextBtn);
    }

    displayPage(1);

    return { displayPage, updatePaginationButtons, currentPage };
}

// --- DOMContentLoaded ইভেন্ট লিসেনার ---
document.addEventListener('DOMContentLoaded', function() {

    // মডাল ক্লোজ বাটন ইভেন্ট লিসেনার
    if (validationCloseBtn) {
        validationCloseBtn.addEventListener('click', () => {
            validationModal.style.display = 'none';
        });
    }

    // ডিলিট কনফার্ম মডাল ইভেন্ট লিসেনার
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
            currentEditingRow = null;
        });
    }

    // কনফার্ম ডিলিট বাটন লজিক (শুধুমাত্র এই সেকশনের ডেটা ডিলিট করার জন্য)
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = () => {
            if (currentEditingRow && currentTableId === 'table-scrolling-student') {
                const rowDataFromDom = {};
                const cols = getColumnNamesForTable(currentTableId);
                Array.from(currentEditingRow.children).forEach((cell, index) => {
                    if (index < cols.length - 1) { // Exclude action column
                        rowDataFromDom[cols[index]] = cell.textContent.trim();
                    }
                });

                const initialLength = scrollingStudentTableData.length;
                scrollingStudentTableData = scrollingStudentTableData.filter(item => {
                    return !Object.keys(rowDataFromDom).every(key => rowDataFromDom[key] === item[key]);
                });

                if (scrollingStudentTableData.length < initialLength) {
                    if (scrollingStudentPagination) {
                        const newTotalPages = Math.ceil(scrollingStudentTableData.length / ROWS_PER_PAGE);
                        if (scrollingStudentPagination.currentPage > newTotalPages && newTotalPages > 0) {
                            scrollingStudentPagination.displayPage(newTotalPages);
                        } else if (newTotalPages === 0) {
                            scrollingStudentPagination.displayPage(1); // Go to page 1 if no data
                        } else {
                            scrollingStudentPagination.displayPage(scrollingStudentPagination.currentPage);
                        }
                        scrollingStudentPagination.updatePaginationButtons();
                    }
                    showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
                } else {
                    console.warn("Row to delete not found in data array.");
                    showValidationMessage("ডেটা ডিলিট করা যায়নি: সারি খুঁজে পাওয়া যায়নি।");
                }
            }
            deleteConfirmModal.style.display = 'none';
            currentEditingRow = null;
        };
    }

    // টেবিল ইনিশিয়ালাইজেশন (এই সেকশনের জন্য নির্দিষ্ট)
    initializeScrollingStudentTable();
});

// --- সেকশন এইট এর জন্য ফাংশন সংজ্ঞা ---
function initializeScrollingStudentTable() {
    const tableId = 'table-scrolling-student';
    const initialDataRows = [
        // এখানে আপনার প্রাথমিক ডেটা যোগ করুন (যদি থাকে)
        // উদাহরণ:
        // { 'Subject': 'স্কুল খোলা', 'Color': '#28a745' },
        // { 'Subject': 'নতুন বছরের ছুটি', 'Color': '#dc3545' }
    ];

    scrollingStudentTableData = [...initialDataRows];
    scrollingStudentPagination = setupPagination(tableId, scrollingStudentTableData, createTableRow);

    // saveRow, editRow, cancelEdit, deleteRow ফাংশনগুলি এখানে সংজ্ঞায়িত হবে
    function saveRow(row, isNewRow) {
        const rowData = {};
        let isValid = true;
        let validationMessageText = '';

        const cols = getColumnNamesForTable(tableId);

        Array.from(row.children).forEach((cell, index) => {
            const input = cell.querySelector('input, textarea');
            if (input) {
                rowData[cols[index]] = input.value.trim();
            } else {
                rowData[cols[index]] = cell.textContent.trim();
            }
        });

        cols.forEach((colName) => {
            if (colName !== 'Action') {
                const cellValue = rowData[colName];
                if (!cellValue) {
                    isValid = false;
                    validationMessageText = `${colName} ফিল্ডটি আবশ্যিক।`;
                }
            }
        });

        if (!isValid) {
            showValidationMessage(validationMessageText);
            return;
        }

        console.log(`Saving to ${tableId}:`, rowData);

        if (isNewRow) {
            scrollingStudentTableData.unshift(rowData); // Add new row at the beginning
            showValidationMessage("নতুন ডেটা সফলভাবে যোগ হয়েছে!");
            resetInputRow(row);
        } else {
            const originalRowData = JSON.parse(row.dataset.originalData);
            const rowIndex = scrollingStudentTableData.findIndex(item =>
                Object.keys(originalRowData).every(key => originalRowData[key] === item[key])
            );
            if (rowIndex !== -1) {
                scrollingStudentTableData[rowIndex] = { ...scrollingStudentTableData[rowIndex], ...rowData };
            }
            showValidationMessage("ডেটা সফলভাবে আপডেট হয়েছে!");
        }

        scrollingStudentPagination.displayPage(scrollingStudentPagination.currentPage);
        scrollingStudentPagination.updatePaginationButtons();
    }

    function editRow(row) {
        const originalData = {};
        const cols = getColumnNamesForTable(tableId);
        Array.from(row.children).forEach((cell, index) => {
            const colName = cols[index];
            if (colName !== 'Action') {
                originalData[colName] = cell.textContent.trim();
            }
        });
        row.dataset.originalData = JSON.stringify(originalData);
        const editingRow = createTableRow(originalData, true, false);
        row.replaceWith(editingRow);
    }

    function cancelEdit(row) {
        if (!row.dataset.originalData) {
            console.warn("No original data found to cancel edit.");
            return;
        }
        const originalData = JSON.parse(row.dataset.originalData);
        const originalRow = createTableRow(originalData, false, false);
        row.replaceWith(originalRow);
    }

    function deleteRow(row) {
        currentEditingRow = row;
        currentTableId = tableId; // এই ফাইলের জন্য নির্দিষ্ট

        confirmMessage.textContent = "আপনি কি এই ডেটা ডিলিট করতে চান?";
        deleteConfirmModal.style.display = 'flex';
    }

    function resetInputRow(row) {
        Array.from(row.querySelectorAll('input, textarea')).forEach(input => input.value = '');
    }
}
