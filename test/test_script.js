document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table-exam-link-teacher');
    const tbody = table.querySelector('tbody');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea');
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const clearConfirmModal = document.getElementById('clearConfirmModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');
    let rowToClear = null; // Temporarily store the row needing to be cleared


    const paginationContainer = document.getElementById('pagination-exam-link-teacher');
    let currentEditingRow = null;
    let currentEditingColIndex = -1;

    const classes = [
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ];
    const columnNames = ["Class", "ID", "Password", "URL", "Action"];
    let currentPage = 1;
    const rowsPerPage = 10;

    // Initial table data
    const allDataRows = classes.map(cls => ({
        Class: cls,
        ID: '',
        Password: '',
        URL: ''
    }));

    // Modal Close Button Handler
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.table-modal-overlay').style.display = 'none';
        });
    });

    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    function createEditableInput(colName, currentValue) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.readOnly = true;

        input.addEventListener('click', () => {
            inputEditModalHeading.textContent = `Edit ${colName}`;
            inputEditTextArea.value = input.value;
            currentEditingRow = input.closest('tr');
            currentEditingColIndex = columnNames.indexOf(colName);
            inputEditModal.style.display = 'flex';
        });

        return input;
    }

    function createTableRow(rowData, isEditing = false) {
        const row = document.createElement('tr');
        if (isEditing) row.classList.add('editing');

        columnNames.forEach(col => {
            const cell = document.createElement('td');

            if (col === 'Class') {
                cell.textContent = rowData[col];
                cell.classList.add('fixed-column');
            } else if (col === 'Action') {
                const div = document.createElement('div');
                div.className = 'action-buttons';

                if (isEditing) {
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'save-btn';
                    saveBtn.textContent = 'Save';
                    saveBtn.addEventListener('click', () => saveRow(row));
                    div.appendChild(saveBtn);

                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = 'cancel-btn';
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.addEventListener('click', () => renderTable());
                    div.appendChild(cancelBtn);
                } else {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-btn';
                    editBtn.textContent = 'Edit';
                    editBtn.addEventListener('click', () => {
                        renderTable(true, rowData.Class); // only edit this row
                    });
                    div.appendChild(editBtn);

                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-btn';
                    clearBtn.textContent = 'Clear';
                    clearBtn.addEventListener('click', () => {
    const target = allDataRows.find(r => r.Class === rowData.Class);

    if (!target.ID && !target.Password && !target.URL) {
        showValidationMessage("এই রো-তে কোনও ডেটা নেই, তাই ক্লিয়ার করা যাবে না!");
        return;
    }

    rowToClear = target;
    clearConfirmModal.style.display = 'flex';
});
    const confirmClear = confirm(`আপনি কি ${rowData.Class} এর ডেটা ক্লিয়ার করতে চান?`);

    if (confirmClear) {
        const target = allDataRows.find(r => r.Class === rowData.Class);
        if (target) {
            target.ID = '';
            target.Password = '';
            target.URL = '';
        }
        confirmClearBtn.addEventListener('click', () => {
    if (rowToClear) {
        rowToClear.ID = '';
        rowToClear.Password = '';
        rowToClear.URL = '';
        renderTable();
        showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
        rowToClear = null;
    }
    clearConfirmModal.style.display = 'none';
});

cancelClearBtn.addEventListener('click', () => {
    rowToClear = null;
    clearConfirmModal.style.display = 'none';
});
    }
});          
                    div.appendChild(clearBtn);
                }
                cell.appendChild(div);
            } else {
                if (isEditing) {
                    const input = createEditableInput(col, rowData[col]);
                    cell.appendChild(input);
                } else {
                    cell.textContent = rowData[col];
                }
            }
            row.appendChild(cell);
        });

        return row;
    }

    function saveRow(row) {
        const inputs = row.querySelectorAll('input');
        const updatedData = {};
        const className = row.querySelector('td').textContent;

        inputs.forEach((input, i) => {
            updatedData[columnNames[i + 1]] = input.value.trim();
        });

        if (!updatedData.ID || !updatedData.Password || !updatedData.URL) {
            const msg = `Class: ${className}\nID, Password ও URL ফিল্ডগুলো পূরণ করতে হবে।`;
            showValidationMessage(msg);
            return;
        }

        const index = allDataRows.findIndex(d => d.Class === className);
        if (index !== -1) {
            allDataRows[index] = { Class: className, ...updatedData };
        }

        showValidationMessage("সফলভাবে সেভ হয়েছে!");
        renderTable();
    }

    storeInputBtn.onclick = () => {
        if (currentEditingRow && currentEditingColIndex !== -1) {
            const value = inputEditTextArea.value.trim();
            const cell = currentEditingRow.children[currentEditingColIndex];
            const input = cell.querySelector('input');
            if (input) {
                input.value = value;
            }
            inputEditModal.style.display = 'none';
            inputEditTextArea.value = '';
            currentEditingRow = null;
            currentEditingColIndex = -1;
        }
    };

    cancelInputBtn.onclick = () => {
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditingRow = null;
        currentEditingColIndex = -1;
    };

    function renderTable(editClass = false, classToEdit = "") {
        tbody.innerHTML = '';
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const rowsToShow = allDataRows.slice(start, end);

        rowsToShow.forEach(rowData => {
            const isEditing = editClass && rowData.Class === classToEdit;
            const row = createTableRow(rowData, isEditing);
            tbody.appendChild(row);
        });

        renderPagination();
    }

    function renderPagination() {
        const totalPages = Math.ceil(allDataRows.length / rowsPerPage);
        paginationContainer.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            currentPage--;
            renderTable();
        };
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === currentPage) {
                pageBtn.style.fontWeight = 'bold';
            }
            pageBtn.onclick = () => {
                currentPage = i;
                renderTable();
            };
            paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            currentPage++;
            renderTable();
        };
        paginationContainer.appendChild(nextBtn);
    }

    renderTable();
});
