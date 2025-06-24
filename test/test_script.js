document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements and Modals (Only those relevant to Section 1) ---
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

    let currentEditingRow = null; // Currently selected row for edit/delete
    let currentEditingColIndex = -1; // Currently selected column index for input edit modal

    // --- Global Close Modal Logic (Relevant to Section 1 modals) ---
    document.querySelectorAll('.close-modal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.table-modal-overlay');
            if (modal) {
                modal.style.display = 'none';
                if (modal.id === 'inputEditModal') {
                    inputEditTextArea.value = '';
                    currentEditingRow = null;
                    currentEditingColIndex = -1;
                }
            }
        });
    });

    // --- Utility Function to show validation message ---
    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    // --- Table Management Function for Section 1 ---
    function initializeExamLinkTeachersTable() {
        const table = document.getElementById('table-exam-link-teacher');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        // Initial Data for Section 1 (Fixed Classes)
        const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
        const initialDataRows = classes.map(cls => ({
            Class: cls,
            ID: '', // Default empty values
            Password: '',
            URL: ''
        }));

        // Function to create an editable input/textarea based on column name
        function createEditableInput(colName, currentValue, cell) {
            let inputElement;
            const isModalEditable = ['URL', 'ID', 'Password'].includes(colName);

            // For ID, Password, URL, we want text input that opens a modal
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentValue;
            inputElement.readOnly = true; // Make it read-only to force modal edit

            if (isModalEditable) {
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent row click from triggering
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);
                    inputEditModal.style.display = 'flex';
                });
            }
            return inputElement;
        }

        // Function to create a table row (for display or editing)
        function createTableRow(rowData = {}, isEditing = false) {
            const row = document.createElement('tr');
            if (isEditing) {
                row.classList.add('editing');
            }

            columnNames.forEach((colName, index) => {
                const cell = document.createElement('td');
                let cellValue = rowData[colName] !== undefined ? rowData[colName] : '';
                const isActionColumn = colName === 'Action';
                const isFixedColumn = colName === 'Class'; // Class is fixed for this section

                if (isFixedColumn) {
                    cell.textContent = cellValue;
                    cell.classList.add('fixed-column');
                } else if (!isActionColumn) {
                    if (isEditing) { // If row is in editing mode
                        const editableInput = createEditableInput(colName, cellValue, cell);
                        cell.appendChild(editableInput);
                    } else { // Display mode
                        cell.textContent = cellValue;
                    }
                } else { // Action column
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row, false)); // false indicates not a new row
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
                        actionDiv.appendChild(editBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.classList.add('delete-btn');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.addEventListener('click', () => deleteRow(row));
                        actionDiv.appendChild(deleteBtn);
                    }
                    cell.appendChild(actionDiv);
                }
            });
            return row;
        }
        
        // --- Save, Edit, Delete Row Functions ---
        async function saveRow(row, isNewRow) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                let cellValue;
                const inputElement = cells[index].querySelector('input') || cells[index].querySelector('textarea');
                if (inputElement) {
                    cellValue = inputElement.value.trim();
                } else {
                    cellValue = cells[index].textContent.trim(); // For fixed columns
                }
                rowData[colName] = cellValue;

                // Validation rules for Section 1
                if (['ID', 'Password', 'URL'].includes(colName) && !cellValue) {
                    isValid = false;
                    validationMessageText = `Class: ${rowData['Class']}\nID, Password, এবং URL ফিল্ডগুলো আবশ্যিক।`;
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            // Simulate Save operation (replace with actual API call)
            console.log(`Saving to table-exam-link-teacher:`, rowData);
            // Example: try { await fetch('/api/saveExamLinkTeacher', { method: 'POST', body: JSON.stringify(rowData) }); } catch (error) { console.error('Save failed:', error); showValidationMessage('সেভ করতে সমস্যা হয়েছে।'); return; }

            // After successful save, update the row to non-editing state
            const updatedRow = createTableRow(rowData, false); // Create a new display row
            row.replaceWith(updatedRow); // Replace the editing row with the updated display row

            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
        }

        function editRow(row) {
            // Store original data before editing for cancel functionality
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, true); // Create a new row in editing mode
            row.replaceWith(editingRow); // Replace the current row with the editing row
        }

        function cancelEdit(row) {
            const originalData = row.dataset.originalData ? JSON.parse(row.dataset.originalData) : {};
            const originalRow = createTableRow(originalData, false); // Recreate the original display row
            row.replaceWith(originalRow); // Replace the editing row with the original display row
        }

        function deleteRow(row) {
            currentEditingRow = row;
            deleteConfirmModal.style.display = 'flex';
        }

        confirmDeleteBtn.onclick = () => {
            if (currentEditingRow) {
                // Simulate delete operation (replace with actual API call)
                console.log(`Deleting row from table-exam-link-teacher:`, Array.from(currentEditingRow.children).map(c => c.textContent.trim()));
                currentEditingRow.remove();
                currentEditingRow = null;
                deleteConfirmModal.style.display = 'none';
                showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
            }
        };

        cancelDeleteBtn.onclick = () => {
            currentEditingRow = null;
            deleteConfirmModal.style.display = 'none';
        };

        // --- Store Input from Modal (for ID, Password, URL) ---
        storeInputBtn.addEventListener('click', () => {
            if (currentEditingRow && currentEditingColIndex !== -1) {
                const newValue = inputEditTextArea.value;
                const cell = currentEditingRow.children[currentEditingColIndex];
                const inputElement = cell.querySelector('input'); // Should be an input in this case

                if (inputElement) {
                    inputElement.value = newValue; // Update the input field in the table cell
                    inputElement.dispatchEvent(new Event('change')); // Trigger change event
                }
                
                inputEditModal.style.display = 'none';
                inputEditTextArea.value = '';
                currentEditingRow = null;
                currentEditingColIndex = -1;
            }
        });

        cancelInputBtn.addEventListener('click', () => {
            inputEditModal.style.display = 'none';
            inputEditTextArea.value = '';
            currentEditingRow = null;
            currentEditingColIndex = -1;
        });

        // --- Populate Initial Table Data ---
        function populateTable(data) {
            tbody.innerHTML = ''; // Clear existing rows
            data.forEach(rowData => {
                const row = createTableRow(rowData, false); // Create as display row, not editing initially
                tbody.appendChild(row);
            });
        }

        populateTable(initialDataRows);

        // Pagination (simplified - just buttons, no active logic here)
        const paginationContainer = document.getElementById('pagination-exam-link-teacher');
        if (paginationContainer) {
            // Already added in HTML. No dynamic logic needed for this snippet.
        }
    }

    // Initialize the table for Section 1
    initializeExamLinkTeachersTable();
});
