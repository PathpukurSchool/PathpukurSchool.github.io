
document.addEventListener('DOMContentLoaded', () => {
    // নিশ্চিত করুন যে সব মোডাল প্রাথমিকভাবে লুকানো আছে
    document.querySelectorAll('.table-modal-overlay').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show-modal'); // Ensure no initial show-modal class
    });

    // Common Modals - Assuming these are global and unique HTML elements
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea');
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');

    // Utility Function to show validation messages
    function showValidationMessage(message, isError = false) {
        validationMessage.textContent = message;
        validationModal.classList.remove('error'); // Clear previous state
        if (isError) {
            validationModal.classList.add('error');
        }
        validationModal.style.display = 'flex'; // Use flex to show
        validationModal.classList.add('show-modal'); // Add for transition
        // Auto-hide after 3 seconds
        setTimeout(() => {
            validationModal.classList.remove('show-modal');
            // Give time for transition before hiding display
            setTimeout(() => {
                validationModal.style.display = 'none';
            }, 300); // Match CSS transition duration
        }, 3000);
    }

    // Common close modal button logic (if you have one common close button class)
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.table-modal-overlay');
            modal.classList.remove('show-modal');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Match CSS transition duration
        });
    });


    // --- Function to initialize each section ---
    function initializeTableSection(
        tableId,
        paginationId,
        clearConfirmModalId,
        confirmClearBtnId,
        cancelClearBtnId,
        initialData,
        columnConfig // { name: string, type: 'text' | 'date' | 'color' | 'fixed' | 'action', required: boolean, default: string }
    ) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const paginationContainer = document.getElementById(paginationId);

        const clearConfirmModal = document.getElementById(clearConfirmModalId);
        const confirmClearBtn = document.getElementById(confirmClearBtnId);
        const cancelClearBtn = document.getElementById(cancelClearBtnId);

        let currentEditingRowData = null; // Stores the data object of the row being edited
        let currentEditingInput = null;   // Stores the specific input element being edited via modal

        let dataRows = initialData; // Use a local copy of data
        const rowsPerPage = 10;
        let currentPage = 1;

        // Common Input Edit Modal handlers for this section
        storeInputBtn.onclick = null; // Clear previous handlers
        cancelInputBtn.onclick = null; // Clear previous handlers

        storeInputBtn.onclick = () => {
            if (currentEditingInput) {
                const value = inputEditTextArea.value.trim();
                currentEditingInput.value = value; // Update the input field directly
                // Also update the underlying data model
                const rowElement = currentEditingInput.closest('tr');
                const rowDataIndex = Array.from(tbody.children).indexOf(rowElement);
                const actualDataIndex = (currentPage - 1) * rowsPerPage + rowDataIndex;

                if (actualDataIndex !== -1 && dataRows[actualDataIndex]) {
                    const colName = inputEditModalHeading.textContent.replace('Edit ', ''); // Get original column name
                    dataRows[actualDataIndex][colName] = value;
                }
            }
            inputEditModal.classList.remove('show-modal');
            setTimeout(() => {
                inputEditModal.style.display = 'none';
            }, 300);
            inputEditTextArea.value = '';
            currentEditingInput = null;
            inputEditModalHeading.textContent = ''; // Reset heading
        };

        cancelInputBtn.onclick = () => {
            inputEditModal.classList.remove('show-modal');
            setTimeout(() => {
                inputEditModal.style.display = 'none';
            }, 300);
            inputEditTextArea.value = '';
            currentEditingInput = null;
            inputEditModalHeading.textContent = '';
        };

        // Function to create editable inputs for table cells
        function createEditableTableCellContent(colConfig, value) {
            if (colConfig.type === 'action' || colConfig.type === 'fixed') {
                return null; // Actions and fixed columns don't get editable inputs here
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'editable-cell-content'; // A new class for styling

            const input = document.createElement('input');
            input.value = value;
            input.readOnly = true; // Initially read-only, becomes editable via modal
            input.className = 'data-table-input'; // Common class for table inputs

            if (colConfig.type === 'date') {
                input.type = 'text'; // Use text and open date picker modal
                input.placeholder = 'DD-MM-YYYY';
                input.addEventListener('click', () => {
                    // This will need a common date picker modal and logic
                    // For now, it will open the generic input edit modal for text entry
                    inputEditModalHeading.textContent = `Edit ${colConfig.name}`;
                    inputEditTextArea.value = input.value;
                    currentEditingInput = input; // Set the input element being edited
                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });
            } else if (colConfig.type === 'color') {
                // For color, we should use a native color picker first,
                // or a custom color picker if available.
                // For now, let's make it click to open inputEditModal
                // which will handle text input (e.g., #RRGGBB)
                // A better solution involves a custom color picker modal.
                input.type = 'text'; // Show hex code
                input.readOnly = true; // Always read-only, open modal on click
                input.style.backgroundColor = value;
                input.style.border = '1px solid #ccc';
                input.style.cursor = 'pointer';
                input.classList.add('color-input-in-table'); // Add for specific styling

                const colorPreview = document.createElement('div');
                colorPreview.className = 'color-preview';
                colorPreview.style.backgroundColor = value;
                colorPreview.style.width = '30px';
                colorPreview.style.height = '30px';
                colorPreview.style.borderRadius = '4px';
                colorPreview.style.border = '1px solid #ccc';
                colorPreview.style.cursor = 'pointer';

                // Combined wrapper for color and its preview
                const colorWrapper = document.createElement('div');
                colorWrapper.className = 'color-with-preview';
                colorWrapper.appendChild(input); // The text representation
                colorWrapper.appendChild(colorPreview); // The color block

                input.addEventListener('click', () => {
                    inputEditModalHeading.textContent = `Edit ${colConfig.name}`;
                    inputEditTextArea.value = input.value;
                    currentEditingInput = input;
                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });

                colorPreview.addEventListener('click', () => {
                    inputEditModalHeading.textContent = `Edit ${colConfig.name}`;
                    inputEditTextArea.value = input.value;
                    currentEditingInput = input;
                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });

                return colorWrapper;

            } else { // 'text' type
                input.type = 'text';
                input.addEventListener('click', () => {
                    inputEditModalHeading.textContent = `Edit ${colConfig.name}`;
                    inputEditTextArea.value = input.value;
                    currentEditingInput = input; // Set the input element being edited
                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });
            }
            wrapper.appendChild(input);
            return wrapper;
        }

        // Main function to create a table row
        function createTableRow(rowData, isEditing = false) {
            const row = document.createElement('tr');
            if (isEditing) row.classList.add('editing');

            columnConfig.forEach(col => {
                const cell = document.createElement('td');

                if (col.type === "fixed") {
                    cell.textContent = rowData[col.name];
                    cell.classList.add('fixed-column');
                } else if (col.type === "action") {
                    const div = document.createElement('div');
                    div.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'save-btn';
                        saveBtn.textContent = 'Save';
                        saveBtn.onclick = () => saveRow(row, rowData);
                        div.appendChild(saveBtn);

                        const cancelBtn = document.createElement('button');
                        cancelBtn.className = 'cancel-btn';
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.onclick = () => renderTable();
                        div.appendChild(cancelBtn);
                    } else {
                        const editBtn = document.createElement('button');
                        editBtn.className = 'edit-btn';
                        editBtn.textContent = 'Edit';
                        // Pass the specific row data for editing
                        editBtn.onclick = () => renderTable(true, rowData[columnConfig[0].name]);
                        div.appendChild(editBtn);

                        const clearBtn = document.createElement('button');
                        clearBtn.className = 'clear-btn';
                        clearBtn.textContent = 'Clear';
                        clearBtn.onclick = () => {
                            // Check if there's any data to clear based on 'required' columns
                            const hasDataToClear = columnConfig.some(c =>
                                c.type !== 'fixed' && c.type !== 'action' && rowData[c.name]
                            );

                            if (!hasDataToClear) {
                                showValidationMessage("এই রো-তে কোনও ডেটা নেই, তাই ক্লিয়ার করা যাবে না!", true); // true for error
                                return;
                            }
                            currentEditingRowData = rowData; // Set the data object to be cleared
                            clearConfirmModal.style.display = 'flex';
                            clearConfirmModal.classList.add('show-modal');
                        };
                        div.appendChild(clearBtn);
                    }
                    cell.appendChild(div);
                } else {
                    if (isEditing) {
                        const content = createEditableTableCellContent(col, rowData[col.name]);
                        if (content) {
                            cell.appendChild(content);
                        } else {
                             // Fallback for types not handled by createEditableTableCellContent (e.g., if we directly append input type color)
                            const input = document.createElement('input');
                            input.type = col.type; // e.g., 'date', 'color'
                            input.value = rowData[col.name];
                            input.readOnly = false; // direct edit
                            input.addEventListener('change', () => {
                                // Update underlying data model directly on change for simple inputs
                                rowData[col.name] = input.value;
                            });
                            cell.appendChild(input);
                        }
                    } else {
                        // Display for non-editing mode
                        if (col.type === 'color' && rowData[col.name]) {
                            const colorDisplay = document.createElement('span');
                            colorDisplay.style.backgroundColor = rowData[col.name];
                            colorDisplay.style.display = 'inline-block';
                            colorDisplay.style.width = '20px';
                            colorDisplay.style.height = '20px';
                            colorDisplay.style.borderRadius = '3px';
                            colorDisplay.style.border = '1px solid #ccc';
                            colorDisplay.style.verticalAlign = 'middle';
                            colorDisplay.style.marginRight = '5px';
                            cell.appendChild(colorDisplay);
                            cell.appendChild(document.createTextNode(rowData[col.name]));
                        } else {
                            cell.textContent = rowData[col.name];
                        }
                    }
                }
                row.appendChild(cell);
            });
            return row;
        }

        // Save row data (from save button)
        function saveRow(rowElement, originalRowData) {
            // Collect current values from the inputs in the row
            const inputs = rowElement.querySelectorAll('.data-table-input'); // Select inputs within the editable cell content
            let updatedValues = {};
            let allRequiredFilled = true;

            columnConfig.forEach(col => {
                if (col.type !== 'fixed' && col.type !== 'action') {
                    const inputElement = rowElement.querySelector(`input[value="${originalRowData[col.name]}"]`) ||
                                         Array.from(inputs).find(input => input.closest('td').previousElementSibling.textContent === originalRowData[columnConfig[0].name] && input.closest('td').querySelector('.editable-cell-content'));

                    if (inputElement) {
                        updatedValues[col.name] = inputElement.value.trim();
                    } else if (col.name === 'Date' && rowElement.querySelector('input[type="date"]')) {
                        updatedValues[col.name] = rowElement.querySelector('input[type="date"]').value.trim();
                    } else if (col.name === 'Color' && rowElement.querySelector('input[type="color"]')) {
                        updatedValues[col.name] = rowElement.querySelector('input[type="color"]').value.trim();
                    } else {
                        updatedValues[col.name] = originalRowData[col.name]; // Use original if no input found
                    }

                    if (col.required && !updatedValues[col.name]) {
                        allRequiredFilled = false;
                    }
                } else {
                    updatedValues[col.name] = originalRowData[col.name]; // Keep fixed and action columns as is
                }
            });

            if (!allRequiredFilled) {
                showValidationMessage("সব প্রয়োজনীয় ফিল্ড পূরণ করতে হবে!", true);
                return;
            }

            // Update the actual dataRows array
            const index = dataRows.findIndex(d => d[columnConfig[0].name] === originalRowData[columnConfig[0].name]);
            if (index !== -1) {
                dataRows[index] = { ...originalRowData, ...updatedValues };
                showValidationMessage("সফলভাবে সেভ হয়েছে!");
            }
            renderTable();
        }


        function renderTable(isEditing = false, editIdentifier = "") {
            tbody.innerHTML = "";
            const start = (currentPage - 1) * rowsPerPage;
            const end = start + rowsPerPage;

            dataRows.slice(start, end).forEach(rowData => {
                const editMode = isEditing && rowData[columnConfig[0].name] === editIdentifier;
                const row = createTableRow(rowData, editMode);
                tbody.appendChild(row);
            });
            renderPagination();
        }

        function renderPagination() {
            paginationContainer.innerHTML = "";
            const totalPages = Math.ceil(dataRows.length / rowsPerPage);

            if (totalPages <= 1) { // Hide pagination if only one page
                paginationContainer.style.display = 'none';
                return;
            } else {
                paginationContainer.style.display = 'flex'; // Show pagination
            }

            const prevBtn = document.createElement('button');
            prevBtn.textContent = "Previous";
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => {
                currentPage--;
                renderTable();
            };
            paginationContainer.appendChild(prevBtn);

            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
                if (i === currentPage) pageBtn.classList.add('active-page'); // Add a class for active page
                pageBtn.onclick = () => {
                    currentPage = i;
                    renderTable();
                };
                paginationContainer.appendChild(pageBtn);
            }

            const nextBtn = document.createElement('button');
            nextBtn.textContent = "Next";
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => {
                currentPage++;
                renderTable();
            };
            paginationContainer.appendChild(nextBtn);
        }

        // Clear Confirmation Logic for this section
        confirmClearBtn.onclick = () => {
            if (currentEditingRowData) { // Check if row to clear is set for THIS section
                columnConfig.forEach(col => {
                    if (col.type !== 'fixed' && col.type !== 'action') {
                        currentEditingRowData[col.name] = col.default || ""; // Clear to default or empty string
                    }
                });
                renderTable(); // Re-render this section's table
                showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            }
            currentEditingRowData = null; // Reset
            clearConfirmModal.classList.remove('show-modal');
            setTimeout(() => {
                clearConfirmModal.style.display = 'none';
            }, 300);
        };

        cancelClearBtn.onclick = () => {
            currentEditingRowData = null; // Reset
            clearConfirmModal.classList.remove('show-modal');
            setTimeout(() => {
                clearConfirmModal.style.display = 'none';
            }, 300);
        };

        // Initial render for this section
        renderTable();
    } // End of initializeTableSection function

    ---

    // --- Section 1: Exam Link for Teachers ---
    const examLinkTeacherCols = [
        { name: "Class", type: "fixed" },
        { name: "ID", type: "text", required: true },
        { name: "Password", type: "text", required: true },
        { name: "URL", type: "text", required: true },
        { name: "Action", type: "action" }
    ];
    const examLinkTeacherData = [
        // Ensure you have initial data if any, or it will be empty
        // Example: { Class: "V_1ST", ID: "", Password: "", URL: "" }
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ].map(cls => ({
        Class: cls,
        ID: '',
        Password: '',
        URL: ''
    }));
    initializeTableSection(
        'table-exam-link-teacher',
        'pagination-exam-link-teacher',
        'clearConfirmModalSection1',
        'confirmClearBtnSection1',
        'cancelClearBtnSection1',
        examLinkTeacherData,
        examLinkTeacherCols
    );

    // --- Section 2: Link for Students ---
    const studentLinkCols = [
        { name: "Class", type: "fixed" },
        { name: "Student_URL", type: "text", required: true },
        { name: "Action", type: "action" }
    ];
    const studentLinkData = [
        // Example: { Class: "V_1ST", Student_URL: "" }
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ].map(cls => ({
        Class: cls,
        Student_URL: ''
    }));
    initializeTableSection(
        'table-link-student',
        'pagination-link-student',
        'clearConfirmModalSection2',
        'confirmClearBtnSection2',
        'cancelClearBtnSection2',
        studentLinkData,
        studentLinkCols
    );

    // --- Section 3: Marks Submission Date for Teachers ---
    const marksSubmissionCols = [
        { name: "Exam", type: "fixed" },
        { name: "Date", type: "date", required: true },
        { name: "Color", type: "color", default: "#000000" }, // Default color for clear
        { name: "Action", type: "action" }
    ];
    const marksSubmissionData = [
        // Example: { Exam: "1st Exam", Date: "", Color: "" }
        "1st Exam", "2nd Exam", "X Test", "3rd Exam",
        "XI Semester I", "XI Semester II", "XII Test"
    ].map(exam => ({
        Exam: exam,
        Date: '',
        Color: ''
    }));
    initializeTableSection(
        'table-marks-submission',
        'pagination-marks-submission',
        'clearConfirmModalSection3',
        'confirmClearBtnSection3',
        'cancelClearBtnSection3',
        marksSubmissionData,
        marksSubmissionCols
    );

    // *******************************************************************
    // IMPORTANT: The date picker modal ('datePickerModal') from scrolling_notice.js
    // is not integrated into this refactored test_script.js.
    // If you need date picking functionality for 'Date' fields,
    // you will need to integrate the date picker logic into the `initializeTableSection`
    // function for the 'date' type inputs, similar to how it's done in `scrolling_notice.js`.
    // *******************************************************************
});
