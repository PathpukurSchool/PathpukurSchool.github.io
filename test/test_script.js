document.addEventListener('DOMContentLoaded', () => {
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea');
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    let currentEditingRow = null;
    let currentEditingColIndex = -1;

    document.querySelectorAll('.close-modal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.table-modal-overlay');
            if (modal) modal.style.display = 'none';
        });
    });

    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    function initializeExamLinkTeachersTable() {
        const table = document.getElementById('table-exam-link-teacher');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];

        const initialDataRows = classes.map(cls => ({
            Class: cls,
            ID: '',
            Password: '',
            URL: ''
        }));

        function createEditableInput(colName, currentValue) {
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentValue;
            inputElement.readOnly = true;

            inputElement.addEventListener('click', () => {
                inputEditModalHeading.textContent = `Edit ${colName}`;
                inputEditTextArea.value = inputElement.value;
                currentEditingRow = inputElement.closest('tr');
                currentEditingColIndex = columnNames.indexOf(colName);
                inputEditModal.style.display = 'flex';
            });

            return inputElement;
        }

        function createTableRow(rowData = {}, isEditing = false) {
            const row = document.createElement('tr');

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                const value = rowData[colName] || '';

                if (colName === 'Class') {
                    cell.textContent = value;
                    cell.classList.add('fixed-column');
                } else if (colName === 'Action') {
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.addEventListener('click', () => editRow(row));

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.addEventListener('click', () => deleteRow(row));

                    const div = document.createElement('div');
                    div.classList.add('action-buttons');
                    div.appendChild(editBtn);
                    div.appendChild(deleteBtn);
                    cell.appendChild(div);
                } else {
                    if (isEditing) {
                        const input = createEditableInput(colName, value);
                        cell.appendChild(input);
                    } else {
                        cell.textContent = value;
                    }
                }
                row.appendChild(cell);
            });

            return row;
        }

        function populateTable(data) {
            tbody.innerHTML = '';
            data.forEach(rowData => {
                const row = createTableRow(rowData, false);
                tbody.appendChild(row);
            });
        }

        function editRow(row) {
            const originalData = {};
            row.querySelectorAll('td').forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            const editingRow = createTableRow(originalData, true);
            row.replaceWith(editingRow);
        }

        function deleteRow(row) {
            currentEditingRow = row;
            deleteConfirmModal.style.display = 'flex';
        }

        confirmDeleteBtn.onclick = () => {
            if (currentEditingRow) {
                currentEditingRow.remove();
                currentEditingRow = null;
                deleteConfirmModal.style.display = 'none';
                showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
            }
        };

        cancelDeleteBtn.onclick = () => {
            deleteConfirmModal.style.display = 'none';
            currentEditingRow = null;
        };

        storeInputBtn.onclick = () => {
            if (currentEditingRow && currentEditingColIndex !== -1) {
                const newValue = inputEditTextArea.value;
                const cell = currentEditingRow.children[currentEditingColIndex];
                const input = cell.querySelector('input');
                if (input) {
                    input.value = newValue;
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

        populateTable(initialDataRows);
    }

    initializeExamLinkTeachersTable();
});
