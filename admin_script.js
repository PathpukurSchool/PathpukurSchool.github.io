document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements and Modals ---
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const datePickerModal = document.getElementById('datePickerModal');
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea');
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const colorPickerModal = document.getElementById('colorPickerModal');
    const colorPalette = document.getElementById('colorPalette');

    let currentEditingRow = null; // Currently selected row for edit/delete
    let currentEditingColIndex = -1; // Currently selected column index for input edit modal
    let currentDatePickerInput = null; // The input field that opened the date picker
    let currentSelectedColorBox = null; // For color picker modal
    let currentColorInput = null; // The input field that opened the color picker

    // --- Global Close Modal Logic ---
    document.querySelectorAll('.close-modal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.table-modal-overlay');
            if (modal) {
                modal.style.display = 'none';
                // Specific cleanup for modals
                if (modal.id === 'inputEditModal') {
                    inputEditTextArea.value = '';
                    currentEditingRow = null;
                    currentEditingColIndex = -1;
                } else if (modal.id === 'datePickerModal') {
                    currentDatePickerInput = null;
                } else if (modal.id === 'colorPickerModal') {
                    currentColorInput = null;
                    if (currentSelectedColorBox) {
                        currentSelectedColorBox.classList.remove('selected');
                        currentSelectedColorBox = null;
                    }
                }
            }
        });
    });

    // --- Utility Functions ---

    // Function to show validation message
    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    // Function to format date (DD-MM-YYYY)
    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Function to parse date from DD-MM-YYYY
    function parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return null;
    }

    // --- Date Picker Logic ---
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const calendarDates = document.getElementById('calendarDates');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Populate month and year selects
    function populateDateSelects() {
        monthSelect.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = new Date(0, i).toLocaleString('bn-BD', { month: 'long' });
            monthSelect.appendChild(option);
        }

        yearSelect.innerHTML = '';
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }

    // Generate calendar days
    function generateCalendar() {
        calendarDates.innerHTML = '';
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday

        monthSelect.value = currentMonth;
        yearSelect.value = currentYear;

        // Add empty spans for days before the 1st
        for (let i = 0; i < firstDayOfWeek; i++) {
            const span = document.createElement('span');
            span.classList.add('empty');
            calendarDates.appendChild(span);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const span = document.createElement('span');
            span.textContent = day;
            span.dataset.date = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;

            const today = new Date();
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                span.classList.add('today-date');
            }

            // Check if this date is already selected in the input
            if (currentDatePickerInput && currentDatePickerInput.value === span.dataset.date) {
                span.classList.add('selected-date');
            }

            span.addEventListener('click', () => {
                if (currentDatePickerInput) {
                    currentDatePickerInput.value = span.dataset.date;
                    // Add calendar icon for scrolling notice tables
                    const tableId = currentDatePickerInput.closest('table').id;
                    if (tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') {
                        const cell = currentDatePickerInput.parentElement;
                        // Remove existing icon if any
                        const existingIcon = cell.querySelector('.calendar-icon');
                        if (existingIcon) existingIcon.remove();

                        const icon = document.createElement('span');
                        icon.classList.add('calendar-icon');
                        icon.textContent = '📆'; // Calendar emoji
                        cell.prepend(icon);
                        cell.classList.add('date-with-icon'); // Add class to manage flex display
                        // Hide the input field, only show icon and date
                        currentDatePickerInput.style.display = 'none';
                    }
                    datePickerModal.style.display = 'none';
                    currentDatePickerInput.dispatchEvent(new Event('change')); // Trigger change event
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
        generateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
    });

    monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        generateCalendar();
    });

    yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        generateCalendar();
    });

    populateDateSelects(); // Initial population

    // --- Color Picker Logic ---
    const colors = [
        '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C', // Red palette
        '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', // Purple palette
        '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', // Green palette
        '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40', // Teal palette
        '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#0D47A1', // Blue palette
        '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17', // Yellow palette
        '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100', // Orange palette
        '#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'  // Grey palette
    ];

    function populateColorPalette() {
        colorPalette.innerHTML = '';
        colors.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            colorBox.dataset.colorCode = color; // Store color code

            colorBox.addEventListener('click', () => {
                if (currentSelectedColorBox) {
                    currentSelectedColorBox.classList.remove('selected');
                }
                colorBox.classList.add('selected');
                currentSelectedColorBox = colorBox;

                if (currentColorInput) {
                    currentColorInput.value = color; // Put color code in input
                    currentColorInput.style.backgroundColor = color; // Update input background
                    colorPickerModal.style.display = 'none';
                    currentColorInput.dispatchEvent(new Event('change')); // Trigger change event
                }
            });
            colorPalette.appendChild(colorBox);
        });
    }
    populateColorPalette();

    // --- Table Management Function (Main Logic for each section) ---
    function initializeTable(tableId, initialDataRows = [], isInputRowRequired = false) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        // Function to create an editable input/textarea based on column name
        function createEditableInput(colName, currentValue, cell, isInputRow) {
            let inputElement;

            const isModalEditable = ['URL', 'Link', 'Subject', 'Heading', 'ID', 'Password'].includes(colName);

            if (colName === 'Heading' || colName === 'Subject' || colName === 'URL' || colName === 'Link') {
                inputElement = document.createElement('textarea');
                inputElement.value = currentValue;
                inputElement.classList.add('textarea-input'); // Custom class for textarea
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
            }

            if (colName === 'Date') {
                inputElement.readOnly = true;
                inputElement.addEventListener('click', () => {
                    currentDatePickerInput = inputElement;
                    populateDateSelects(); // Reset selects to current date
                    generateCalendar();
                    datePickerModal.style.display = 'flex';
                });
            } else if (colName === 'Color') {
                inputElement.readOnly = true;
                inputElement.classList.add('color-input');
                inputElement.style.backgroundColor = currentValue || 'transparent';
                inputElement.addEventListener('click', () => {
                    currentColorInput = inputElement;
                    const selectedColor = inputElement.value;
                    if (currentSelectedColorBox) {
                        currentSelectedColorBox.classList.remove('selected');
                    }
                    const existingColorBox = colorPalette.querySelector(`[data-color-code="${selectedColor}"]`);
                    if (existingColorBox) {
                        existingColorBox.classList.add('selected');
                        currentSelectedColorBox = existingColorBox;
                    } else {
                        currentSelectedColorBox = null;
                    }
                    colorPickerModal.style.display = 'flex';
                });
                // Ensure background color updates if value is set programmatically
                inputElement.addEventListener('change', () => {
                    inputElement.style.backgroundColor = inputElement.value || 'transparent';
                });
            } else if (isModalEditable && (isInputRow || currentEditingRow)) { // Only open modal for edit/new entry
                inputElement.readOnly = true; // Make it read-only to force modal edit
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

        // Function to create a table row (for both display and input)
        function createTableRow(rowData = {}, isInputRow = false, isEditing = false) {
            const row = document.createElement('tr');
            if (isInputRow) {
                row.classList.add('empty-row');
            } else if (isEditing) {
                row.classList.add('editing');
            }

            columnNames.forEach((colName, index) => {
                const cell = document.createElement('td');
                let cellValue = rowData[colName] !== undefined ? rowData[colName] : '';
                const isActionColumn = colName === 'Action';

                // Determine if a column is fixed (non-editable)
                let isFixedColumn = false;
                if ((tableId === 'table-exam-link-teacher' || tableId === 'table-exam-link-student') && colName === 'Class') {
                    isFixedColumn = true;
                } else if (tableId === 'table-marks-submission-date' && colName === 'Exam') {
                    isFixedColumn = true;
                }

                if (isFixedColumn) {
                    cell.textContent = cellValue;
                    cell.classList.add('fixed-column');
                } else if (!isActionColumn) {
                    if (isInputRow || isEditing) { // If it's an input row or an editing row
                        const editableInput = createEditableInput(colName, cellValue, cell, isInputRow);
                        cell.appendChild(editableInput);

                        // Special handling for scrolling notice date icon
                        if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && colName === 'Date' && cellValue) {
                            const icon = document.createElement('span');
                            icon.classList.add('calendar-icon');
                            icon.textContent = '📆';
                            cell.prepend(icon);
                            cell.classList.add('date-with-icon');
                            editableInput.style.display = 'none'; // Hide input if date is selected
                        }
                    } else { // Display mode (not input row, not editing)
                        if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && colName === 'Date' && cellValue) {
                            cell.innerHTML = `<span class="calendar-icon">📆</span> ${cellValue}`;
                            cell.classList.add('date-with-icon');
                        } else if (colName === 'Color' && cellValue) {
                            // For color display, just show the text but can add a small color box later if desired
                            cell.textContent = cellValue;
                            cell.style.backgroundColor = cellValue; // Show color in cell background
                            cell.style.color = getContrastYIQ(cellValue); // Text color for contrast
                        }
                        else {
                            cell.textContent = cellValue;
                        }
                    }
                } else { // Action column
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isInputRow) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row, tableId, true));
                        actionDiv.appendChild(saveBtn);

                        const cancelBtn = document.createElement('button');
                        cancelBtn.classList.add('cancel-btn');
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.addEventListener('click', () => resetInputRow(row, tableId));
                        actionDiv.appendChild(cancelBtn);
                    } else if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row, tableId, false));
                        actionDiv.appendChild(saveBtn);

                        const cancelBtn = document.createElement('button');
                        cancelBtn.classList.add('cancel-btn');
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.addEventListener('click', () => cancelEdit(row, tableId));
                        actionDiv.appendChild(cancelBtn);
                    } else {
                        const editBtn = document.createElement('button');
                        editBtn.classList.add('edit-btn');
                        editBtn.textContent = 'Edit';
                        editBtn.addEventListener('click', () => editRow(row, tableId));
                        actionDiv.appendChild(editBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.classList.add('delete-btn');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.addEventListener('click', () => deleteRow(row, tableId));
                        actionDiv.appendChild(deleteBtn);
                    }
                    cell.appendChild(actionDiv);
                }
            });
            return row;
        }
        
        // Helper to determine text color for contrast
        function getContrastYIQ(hexcolor){
            if (!hexcolor || hexcolor.length !== 7) return '#333'; // Default for invalid or transparent
            const r = parseInt(hexcolor.substr(1,2),16);
            const g = parseInt(hexcolor.substr(3,2),16);
            const b = parseInt(hexcolor.substr(5,2),16);
            const yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128) ? 'black' : 'white';
        }

        // Reset input row after saving or canceling
        function resetInputRow(row, tableId) {
            Array.from(row.querySelectorAll('input, textarea')).forEach(input => {
                input.value = '';
                if (input.classList.contains('color-input')) {
                    input.style.backgroundColor = 'transparent';
                }
                if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && input.type === 'text') {
                    input.style.display = ''; // Show input again
                }
            });
            Array.from(row.querySelectorAll('.calendar-icon')).forEach(icon => icon.remove());
            Array.from(row.querySelectorAll('.date-with-icon')).forEach(cell => cell.classList.remove('date-with-icon'));
        }

        // --- Save, Edit, Delete Row Functions ---
        async function saveRow(row, tableId, isNewRow) {
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
                    // For fixed columns or non-editable cells
                    cellValue = cells[index].textContent.trim();
                }
                rowData[colName] = cellValue;

                // Validation rules
                if (tableId === 'table-exam-link-teacher') {
                    if (['ID', 'Password', 'URL'].includes(colName) && !cellValue) {
                        isValid = false;
                        validationMessageText = `Class: ${rowData['Class']}\nID, Password, এবং URL ফিল্ডগুলো আবশ্যিক।`;
                    }
                } else if (tableId === 'table-marks-submission-date') {
                    if (colName === 'Date' && !cellValue) {
                        isValid = false;
                        validationMessageText = `Exam: ${rowData['Exam']}\nDate ফিল্ডটি আবশ্যিক।`;
                    }
                } else if (tableId === 'table-exam-link-student') {
                    if (colName === 'URL' && !cellValue) {
                        isValid = false;
                        validationMessageText = `Class: ${rowData['Class']}\nURL ফিল্ডটি আবশ্যিক।`;
                    }
                } else if (['table-help-teacher', 'table-notice-teacher', 'table-notice-student'].includes(tableId)) {
                    if (['Date', 'Heading', 'Subject'].includes(colName) && !cellValue) {
                        isValid = false;
                        validationMessageText = `Date, Heading, এবং Subject ফিল্ডগুলো আবশ্যিক।`;
                    }
                } else if (['table-scrolling-teacher', 'table-scrolling-student'].includes(tableId)) {
                    if (['Date', 'Subject'].includes(colName) && !cellValue) {
                        isValid = false;
                        validationMessageText = `Date এবং Subject ফিল্ডগুলো আবশ্যিক।`;
                    }
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            // Simulate Save operation (replace with actual API call)
            console.log(`Saving to ${tableId}:`, rowData);
            // Example: try { await fetch('/api/saveData', { method: 'POST', body: JSON.stringify(rowData) }); } catch (error) { console.error('Save failed:', error); showValidationMessage('সেভ করতে সমস্যা হয়েছে।'); return; }

            // After successful save, update the row to non-editing state
            if (isNewRow) {
                // If it's a new row, prepend the new data row and reset the input row
                const newRow = createTableRow(rowData, false, false);
                tbody.prepend(newRow); // Add new row at the top
                resetInputRow(row, tableId); // Reset the input row
            } else {
                // For an edited row, replace the editing row with a new display row
                const updatedRow = createTableRow(rowData, false, false);
                row.replaceWith(updatedRow);
            }

            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            // Optionally re-render the pagination or specific rows if needed.
        }


        function editRow(row, tableId) {
            // Store original data before editing for cancel functionality
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, false, true); // Create a new row in editing mode
            row.replaceWith(editingRow); // Replace the current row with the editing row
        }

        function cancelEdit(row, tableId) {
            const originalData = row.dataset.originalData ? JSON.parse(row.dataset.originalData) : {};
            const originalRow = createTableRow(originalData, false, false); // Recreate the original display row
            row.replaceWith(originalRow); // Replace the editing row with the original display row
        }

        function deleteRow(row, tableId) {
            currentEditingRow = row;
            deleteConfirmModal.style.display = 'flex';
        }

        confirmDeleteBtn.onclick = () => {
            if (currentEditingRow) {
                // Simulate delete operation (replace with actual API call)
                console.log(`Deleting row from ${currentEditingRow.closest('table').id}:`, Array.from(currentEditingRow.children).map(c => c.textContent.trim()));
                currentEditingRow.remove();
                currentEditingRow = null;
                deleteConfirmModal.style.display = 'none';
                showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
                // Optionally re-render pagination or check if input row needs to be re-added if table is empty
            }
        };

        cancelDeleteBtn.onclick = () => {
            currentEditingRow = null;
            deleteConfirmModal.style.display = 'none';
        };

        // --- Store Input from Modal ---
        storeInputBtn.addEventListener('click', () => {
            if (currentEditingRow && currentEditingColIndex !== -1) {
                const newValue = inputEditTextArea.value; // Get value without trimming for multi-line
                const cell = currentEditingRow.children[currentEditingColIndex];
                const inputOrTextarea = cell.querySelector('input') || cell.querySelector('textarea');

                if (inputOrTextarea) {
                    inputOrTextarea.value = newValue; // Update the input field in the table cell
                    inputOrTextarea.dispatchEvent(new Event('change')); // Trigger change event
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
            if (isInputRowRequired) {
                tbody.appendChild(createTableRow({}, true)); // Add the static input row first
            }
            data.forEach(rowData => {
                const row = createTableRow(rowData, false, false); // Create as display row, not editing
                tbody.appendChild(row);
            });
        }

        // --- Initial Data Definitions for each section ---
        let sectionData = [];

        if (tableId === 'table-exam-link-teacher') {
            const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
            sectionData = classes.map(cls => ({
                Class: cls,
                ID: '',
                Password: '',
                URL: ''
            }));
        } else if (tableId === 'table-marks-submission-date') {
            const exams = ["1st Exam", "2nd Exam", "X Test", "3Rd Exam", "XI Semester I", "XI Semester II", "XII Test"];
            sectionData = exams.map(exam => ({
                Exam: exam,
                Date: '',
                Color: ''
            }));
        } else if (tableId === 'table-exam-link-student') {
            const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
            sectionData = classes.map(cls => ({
                Class: cls,
                URL: ''
            }));
        } else {
            // For sections 4, 5, 6, 7, 8 which require input rows, start with empty data.
            // In a real app, you'd fetch existing data from a backend here.
            sectionData = [
                // Example initial data for tables with input rows
                // { Date: '15-06-2025', Heading: 'New Notice', Subject: 'About Sports Day', Color: '#C8E6C9', Link: 'http://example.com/notice1' },
                // { Date: '10-06-2025', Heading: 'Exam Schedule', Subject: 'Final Exams', Color: '', Link: '' }
            ];
        }

        populateTable(sectionData);

        // Pagination (simplified for this context, needs full implementation for dynamic data)
        const paginationContainer = document.getElementById(`pagination-${tableId.replace('table-', '')}`);
        if (paginationContainer) {
            paginationContainer.innerHTML = `
                <button disabled>Previous</button>
                <button disabled>Next</button>
            `;
            // For a full implementation, you'd calculate total pages based on data and show page numbers.
        }
    }


    // --- Initialize all tables with their specific configurations ---
    initializeTable('table-exam-link-teacher', [], false); // No input row, fixed data handled internally
    initializeTable('table-marks-submission-date', [], false); // No input row, fixed data handled internally
    initializeTable('table-exam-link-student', [], false); // No input row, fixed data handled internally
    initializeTable('table-help-teacher', [], true); // Input row required
    initializeTable('table-notice-teacher', [], true); // Input row required
    initializeTable('table-notice-student', [], true); // Input row required
    initializeTable('table-scrolling-teacher', [], true); // Input row required
    initializeTable('table-scrolling-student', [], true); // Input row required

});
