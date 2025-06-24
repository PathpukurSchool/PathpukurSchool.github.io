document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements and Modals ---
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
    const confirmMessage = document.getElementById('confirmMessage'); // New: For dynamic message
    const datePickerModal = document.getElementById('datePickerModal');
    const colorPickerModal = document.getElementById('colorPickerModal');
    const colorPalette = document.getElementById('colorPalette');

    let currentEditingRow = null; // Currently selected row for edit/delete/clear
    let currentEditingColIndex = -1; // Currently selected column index for input edit modal
    let currentDatePickerInput = null; // The input field that opened the date picker
    let currentSelectedColorBox = null; // For color picker modal
    let currentColorInput = null; // The input field that opened the color picker
    let currentColorPreview = null; // The div that shows color preview next to input (for form)
    let currentTableId = null; // To differentiate clear/delete logic

    const ROWS_PER_PAGE = 10; // Global setting for pagination

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
                    // Remove the specific listener for scrolling notice subject textarea
                    inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                    delete inputEditTextArea.dataset.linkedDateInputId;
                } else if (modal.id === 'datePickerModal') {
                    currentDatePickerInput = null;
                } else if (modal.id === 'colorPickerModal') {
                    currentColorInput = null;
                    currentColorPreview = null;
                    if (currentSelectedColorBox) {
                        currentSelectedColorBox.classList.remove('selected');
                        currentSelectedColorBox = null;
                    }
                } else if (modal.id === 'deleteConfirmModal') {
                    currentTableId = null;
                    currentEditingRow = null;
                }
            }
        });
    });

    // --- Utility Functions (Global) ---

    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // JS Date constructor is year, month (0-11), day
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    }

    function formatDayWithOrdinal(day) {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    function formatDateForNotice(dateString) {
        const date = parseDate(dateString);
        if (!date) return '';
        const day = date.getDate();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        // Remove the ordinal (st, nd, rd, th) if not strictly necessary for Bengali context, or use Bengali ordinals
        // For simplicity, keeping it as-is based on previous examples, but it's English ordinal.
        // If Bengali is required, this function needs significant change.
        return `${day}${formatDayWithOrdinal(day)} ${month} ${year}`;
    }


    function getContrastYIQ(hexcolor) {
        if (!hexcolor || hexcolor.length !== 7 || !/^#[0-9A-F]{6}$/i.test(hexcolor)) return '#333';
        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }


    // --- Date Picker Logic (Global) ---
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const calendarDates = document.getElementById('calendarDates');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    function populateDateSelects() {
        monthSelect.innerHTML = '';
        for (let i = 0; i < 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = new Date(0, i).toLocaleString('bn-BD', { month: 'long' }); // Bengali month names
            monthSelect.appendChild(option);
        }

        yearSelect.innerHTML = '';
        const currentYearFull = new Date().getFullYear();
        for (let i = currentYearFull - 5; i <= currentYearFull + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }

    function generateCalendar() {
        calendarDates.innerHTML = '';
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday

        monthSelect.value = currentMonth;
        yearSelect.value = currentYear;

        // Populate empty spaces for days before the 1st of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const span = document.createElement('span');
            span.classList.add('empty');
            calendarDates.appendChild(span);
        }

        // Populate days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const span = document.createElement('span');
            span.textContent = day;
            const fullDate = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
            span.dataset.date = fullDate;

            const today = new Date();
            // Check for "today" styling
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                span.classList.add('today-date');
            }
            // Check for "selected" styling
            if (currentDatePickerInput && currentDatePickerInput.value === fullDate) {
                span.classList.add('selected-date');
            }

            span.addEventListener('click', () => {
                if (currentDatePickerInput) {
                    currentDatePickerInput.value = fullDate;
                    currentDatePickerInput.dispatchEvent(new Event('change')); // Trigger change to update UI
                    datePickerModal.style.display = 'none';
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

    // --- Color Picker Logic (Global) ---
    const colors = [
        '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
        '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C',
        '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20',
        '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40',
        '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#0D47A1',
        '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17',
        '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100',
        '#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'
    ];

    function populateColorPalette() {
        colorPalette.innerHTML = '';
        colors.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box');
            colorBox.style.backgroundColor = color;
            colorBox.dataset.colorCode = color;

            colorBox.addEventListener('click', () => {
                if (currentSelectedColorBox) {
                    currentSelectedColorBox.classList.remove('selected');
                }
                colorBox.classList.add('selected');
                currentSelectedColorBox = colorBox;

                if (currentColorInput) {
                    currentColorInput.value = color;
                    if (currentColorPreview) {
                        currentColorPreview.style.backgroundColor = color;
                        currentColorPreview.style.borderColor = color;
                    }
                    colorPickerModal.style.display = 'none';
                    currentColorInput.dispatchEvent(new Event('change')); // Trigger change
                }
            });
            colorPalette.appendChild(colorBox);
        });
    }
    populateColorPalette();

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-input')) {
            currentColorInput = e.target;
            // Check if there's a next sibling and if it's a color-preview
            currentColorPreview = null;
            if (e.target.nextElementSibling && e.target.nextElementSibling.classList.contains('color-preview')) {
                currentColorPreview = e.target.nextElementSibling;
            } else if (e.target.previousElementSibling && e.target.previousElementSibling.classList.contains('color-preview')) {
                currentColorPreview = e.target.previousElementSibling; // Handle cases where preview is before input (e.g., in a cell)
            }

            const selectedColor = currentColorInput.value;
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
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('color-input')) {
            const input = e.target;
            let preview = null;
            if (input.nextElementSibling && input.nextElementSibling.classList.contains('color-preview')) {
                preview = input.nextElementSibling;
            } else if (input.previousElementSibling && input.previousElementSibling.classList.contains('color-preview')) {
                preview = input.previousElementSibling;
            }

            if (preview) {
                preview.style.backgroundColor = input.value || 'transparent';
                preview.style.borderColor = input.value ? input.value : '#ccc';
            }
        }
    });

    // --- Modal Input Store/Cancel ---
    storeInputBtn.onclick = () => {
        if (currentEditingRow && currentEditingColIndex !== -1) {
            const newValue = inputEditTextArea.value;
            const cell = currentEditingRow.children[currentEditingColIndex];
            const input = cell.querySelector('input, textarea'); // Can be input or textarea
            if (input) {
                input.value = newValue;
                input.dispatchEvent(new Event('change')); // Trigger change to update originalData if needed
            }
            inputEditModal.style.display = 'none';
            inputEditTextArea.value = '';
            currentEditingRow = null;
            currentEditingColIndex = -1;
            inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick); // Clean up
            delete inputEditTextArea.dataset.linkedDateInputId;
        }
    };

    cancelInputBtn.onclick = () => {
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditingRow = null;
        currentEditingColIndex = -1;
        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick); // Clean up
        delete inputEditTextArea.dataset.linkedDateInputId;
    };


    // --- Global Delete/Clear Confirmation Logic ---
    confirmDeleteBtn.onclick = () => {
        if (currentEditingRow) {
            if (currentTableId === 'table-exam-link-teacher' ||
                currentTableId === 'table-marks-submission-date' ||
                currentTableId === 'table-exam-link-student') {
                // Clear data for these tables
                const inputsToClear = currentEditingRow.querySelectorAll('input[type="text"], input[type="url"], input.color-input');
                inputsToClear.forEach(input => {
                    input.value = '';
                    if (input.classList.contains('color-input') && input.nextElementSibling && input.nextElementSibling.classList.contains('color-preview')) {
                        input.nextElementSibling.style.backgroundColor = 'transparent';
                        input.nextElementSibling.style.borderColor = '#ccc';
                    }
                });

                // For Marks Submission Date, clear the color background in the display row as well
                if (currentTableId === 'table-marks-submission-date') {
                    const colorCell = currentEditingRow.querySelector('td:nth-child(3)'); // Assuming Color is the 3rd column
                    if (colorCell) {
                        colorCell.style.backgroundColor = '';
                        colorCell.style.color = '';
                    }
                }
                showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            } else {
                // Delete row for other tables
                currentEditingRow.remove();
                showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
            }
            deleteConfirmModal.style.display = 'none';
            currentEditingRow = null;
            currentTableId = null;
        }
    };

    cancelDeleteBtn.onclick = () => {
        deleteConfirmModal.style.display = 'none';
        currentEditingRow = null;
        currentTableId = null;
    };


    // --- Pagination Logic ---
    function setupPagination(tableId, data, createRowFn) {
        let currentPage = 1;
        const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const paginationContainer = document.getElementById(`pagination-${tableId}`);

        function displayPage(page) {
            currentPage = page;
            tbody.innerHTML = '';
            const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
            const endIndex = startIndex + ROWS_PER_PAGE;
            const pageData = data.slice(startIndex, endIndex);

            pageData.forEach(rowData => {
                const row = createRowFn(rowData, false); // Create a non-editing row
                tbody.appendChild(row);
            });
            updatePaginationButtons();
        }

        function updatePaginationButtons() {
            paginationContainer.innerHTML = ''; // Clear previous buttons

            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Previous';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => displayPage(currentPage - 1));
            paginationContainer.appendChild(prevBtn);

            // Add page numbers
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

        // Initial display
        if (data.length > 0) {
            displayPage(1);
        } else {
            // Handle empty table case for pagination UI
            tbody.innerHTML = '<tr><td colspan="100%">কোন ডেটা নেই।</td></tr>';
            paginationContainer.innerHTML = ''; // No pagination if no data
        }

        return { displayPage, updatePaginationButtons }; // Return functions if needed externally
    }


    // --- Section 1: Exam Link for Teachers ---
    function initializeExamLinkTeachersTable() {
        const table = document.getElementById('table-exam-link-teacher');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];

        // Simulate fetching initial data (replace with actual fetch)
        // For demonstration, let's add some dummy data.
        const initialDataRows = classes.map(cls => {
            if (cls === 'V_1ST') return { Class: cls, ID: 'ID001', Password: 'Pass1', URL: 'http://example.com/v1' };
            if (cls === 'VI_1ST') return { Class: cls, ID: 'ID002', Password: 'Pass2', URL: 'http://example.com/vi1' };
            return { Class: cls, ID: '', Password: '', URL: '' };
        });

        // Store data locally for client-side pagination and edits
        let tableData = [...initialDataRows];

        function createEditableInput(colName, currentValue) {
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentValue;
            inputElement.readOnly = true; // Always read-only for modal edit

            inputElement.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent row click from propagating
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
            if (isEditing) row.classList.add('editing');

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                const value = rowData[colName] || '';

                if (colName === 'Class') {
                    cell.textContent = value;
                    cell.classList.add('fixed-column');
                } else if (colName === 'Action') {
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row));
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

                        const clearBtn = document.createElement('button');
                        clearBtn.classList.add('clear-btn');
                        clearBtn.textContent = 'Clear';
                        clearBtn.addEventListener('click', () => clearRow(row)); // Changed to clearRow

                        actionDiv.appendChild(editBtn);
                        actionDiv.appendChild(clearBtn); // Changed
                    }
                    cell.appendChild(actionDiv);
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

        function saveRow(row) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                if (colName !== 'Action') {
                    const inputElement = cells[index].querySelector('input');
                    let cellValue = inputElement ? inputElement.value.trim() : cells[index].textContent.trim();
                    rowData[colName] = cellValue;

                    // Validation for ID, Password, URL only if Class is not empty
                    if (colName !== 'Class' && rowData['Class']) {
                         // If Class is present, ID/Password/URL can be empty or filled
                         // No strict validation for empty ID/Password/URL here
                    }
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            console.log(`Saving Exam Link Teacher data:`, rowData);
            // Update tableData array
            const rowIndex = tableData.findIndex(item => item.Class === rowData.Class);
            if (rowIndex !== -1) {
                tableData[rowIndex] = { ...tableData[rowIndex], ...rowData }; // Merge updated data
            } else {
                // This scenario shouldn't happen if Class is fixed, but good for robustness
                tableData.push(rowData);
            }

            const updatedRow = createTableRow(rowData, false); // Create a new display row
            row.replaceWith(updatedRow);
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            pagination.updatePaginationButtons(); // Refresh pagination if data count changes (unlikely here)
            pagination.displayPage(pagination.currentPage); // Re-render current page
        }

        function editRow(row) {
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData); // Store original data

            const editingRow = createTableRow(originalData, true);
            row.replaceWith(editingRow);
        }

        function cancelEdit(row) {
            const originalData = JSON.parse(row.dataset.originalData);
            const originalRow = createTableRow(originalData, false);
            row.replaceWith(originalRow);
        }

        function clearRow(row) {
            currentEditingRow = row;
            currentTableId = 'table-exam-link-teacher'; // Set table ID for global clear/delete logic
            confirmMessage.textContent = "আপনি কি এই ডেটাগুলি ক্লিয়ার করতে চান?"; // Update confirmation message
            deleteConfirmModal.style.display = 'flex';
        }

        const pagination = setupPagination('table-exam-link-teacher', tableData, createTableRow);
    }

    // --- Section 2: Marks Submission Date for Teacher ---
    function initializeMarksSubmissionDateTable() {
        const table = document.getElementById('table-marks-submission-date');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const exams = ["1st Exam", "2nd Exam", "X Test", "3Rd Exam", "XI Semester I", "XI Semester II", "XII Test"];
        const initialDataRows = exams.map(exam => {
            if (exam === '1st Exam') return { Exam: exam, Date: '15-07-2025', Color: '#F44336' };
            return { Exam: exam, Date: '', Color: '' };
        });
        let tableData = [...initialDataRows];


        function createEditableInput(colName, currentValue) {
            let inputElement;
            const wrapper = document.createElement('div'); // Wrapper for date/color inputs

            if (colName === 'Date') {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.classList.add('date-input');
                inputElement.addEventListener('click', () => {
                    currentDatePickerInput = inputElement;
                    populateDateSelects();
                    generateCalendar();
                    datePickerModal.style.display = 'flex';
                });
                const icon = document.createElement('span');
                icon.classList.add('calendar-icon');
                icon.textContent = '📆';
                wrapper.appendChild(icon);
                wrapper.classList.add('date-with-icon');
            } else if (colName === 'Color') {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.classList.add('color-input');
                const colorPreviewDiv = document.createElement('div');
                colorPreviewDiv.classList.add('color-preview');
                colorPreviewDiv.style.backgroundColor = currentValue || 'transparent';
                colorPreviewDiv.style.borderColor = currentValue ? currentValue : '#ccc';
                wrapper.appendChild(colorPreviewDiv);
                wrapper.classList.add('color-with-preview');
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true; // Default for modal editing
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);
                    inputEditModal.style.display = 'flex';
                });
            }
            wrapper.appendChild(inputElement);
            return wrapper;
        }

        function createTableRow(rowData = {}, isEditing = false) {
            const row = document.createElement('tr');
            if (isEditing) row.classList.add('editing');

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                const value = rowData[colName] || '';

                if (colName === 'Exam') {
                    cell.textContent = value;
                    cell.classList.add('fixed-column');
                } else if (colName === 'Action') {
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row));
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

                        const clearBtn = document.createElement('button');
                        clearBtn.classList.add('clear-btn');
                        clearBtn.textContent = 'Clear';
                        clearBtn.addEventListener('click', () => clearRow(row));

                        actionDiv.appendChild(editBtn);
                        actionDiv.appendChild(clearBtn);
                    }
                    cell.appendChild(actionDiv);
                } else {
                    if (isEditing) {
                        const inputWrapper = createEditableInput(colName, value);
                        cell.appendChild(inputWrapper);
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

        function saveRow(row) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                if (colName !== 'Action') {
                    let inputElement = cells[index].querySelector('input');
                    let cellValue = inputElement ? inputElement.value.trim() : cells[index].textContent.trim();
                    rowData[colName] = cellValue;

                    if (colName === 'Date' && !cellValue) {
                        isValid = false;
                        validationMessageText = `Date ফিল্ডটি আবশ্যিক।`;
                    }
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            console.log(`Saving Marks Submission Date data:`, rowData);
            // Update tableData array
            const rowIndex = tableData.findIndex(item => item.Exam === rowData.Exam);
            if (rowIndex !== -1) {
                tableData[rowIndex] = { ...tableData[rowIndex], ...rowData };
            } else {
                tableData.push(rowData);
            }

            const updatedRow = createTableRow(rowData, false);
            row.replaceWith(updatedRow);
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            pagination.updatePaginationButtons();
            pagination.displayPage(pagination.currentPage);
        }

        function editRow(row) {
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, true);
            row.replaceWith(editingRow);
        }

        function cancelEdit(row) {
            const originalData = JSON.parse(row.dataset.originalData);
            const originalRow = createTableRow(originalData, false);
            row.replaceWith(originalRow);
        }

        function clearRow(row) {
            currentEditingRow = row;
            currentTableId = 'table-marks-submission-date';
            confirmMessage.textContent = "আপনি কি এই ডেটাগুলি ক্লিয়ার করতে চান?";
            deleteConfirmModal.style.display = 'flex';
        }
        const pagination = setupPagination('table-marks-submission-date', tableData, createTableRow);
    }

    // --- Section 3: Exam Link for Student ---
    function initializeExamLinkStudentsTable() {
        const table = document.getElementById('table-exam-link-student');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const classes = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
        const initialDataRows = classes.map(cls => {
            if (cls === 'V_1ST') return { Class: cls, URL: 'http://student.example.com/v1' };
            return { Class: cls, URL: '' };
        });
        let tableData = [...initialDataRows];


        function createEditableInput(colName, currentValue) {
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = currentValue;
            inputElement.readOnly = true;

            inputElement.addEventListener('click', (event) => {
                event.stopPropagation();
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
            if (isEditing) row.classList.add('editing');

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                const value = rowData[colName] || '';

                if (colName === 'Class') {
                    cell.textContent = value;
                    cell.classList.add('fixed-column');
                } else if (colName === 'Action') {
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row));
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

                        const clearBtn = document.createElement('button');
                        clearBtn.classList.add('clear-btn');
                        clearBtn.textContent = 'Clear';
                        clearBtn.addEventListener('click', () => clearRow(row));

                        actionDiv.appendChild(editBtn);
                        actionDiv.appendChild(clearBtn);
                    }
                    cell.appendChild(actionDiv);
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

        function saveRow(row) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                if (colName !== 'Action') {
                    const inputElement = cells[index].querySelector('input');
                    let cellValue = inputElement ? inputElement.value.trim() : cells[index].textContent.trim();
                    rowData[colName] = cellValue;

                    // URL can be empty
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            console.log(`Saving Exam Link Student data:`, rowData);
            // Update tableData array
            const rowIndex = tableData.findIndex(item => item.Class === rowData.Class);
            if (rowIndex !== -1) {
                tableData[rowIndex] = { ...tableData[rowIndex], ...rowData };
            } else {
                tableData.push(rowData);
            }

            const updatedRow = createTableRow(rowData, false);
            row.replaceWith(updatedRow);
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            pagination.updatePaginationButtons();
            pagination.displayPage(pagination.currentPage);
        }

        function editRow(row) {
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, true);
            row.replaceWith(editingRow);
        }

        function cancelEdit(row) {
            const originalData = JSON.parse(row.dataset.originalData);
            const originalRow = createTableRow(originalData, false);
            row.replaceWith(originalRow);
        }

        function clearRow(row) {
            currentEditingRow = row;
            currentTableId = 'table-exam-link-student';
            confirmMessage.textContent = "আপনি কি এই ডেটাগুলি ক্লিয়ার করতে চান?";
            deleteConfirmModal.style.display = 'flex';
        }
        const pagination = setupPagination('table-exam-link-student', tableData, createTableRow);
    }

    // --- Sections 4, 5, 6: Tables with an Input Row ---
    // Help for Teachers, Notice for Teachers, Notice for Students
    function initializeInputRowTable(tableId, initialDataRows = []) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        let tableData = [...initialDataRows];

        function createEditableInput(colName, currentValue) {
            let inputElement;
            const wrapper = document.createElement('div'); // Wrapper for date input

            if (colName === 'Date') {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true; // Make it read-only
                inputElement.classList.add('date-input');
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent row click from propagating
                    currentDatePickerInput = inputElement;
                    populateDateSelects();
                    generateCalendar();
                    datePickerModal.style.display = 'flex';
                });
                const icon = document.createElement('span');
                icon.classList.add('calendar-icon');
                icon.textContent = '📆';
                wrapper.appendChild(icon);
                wrapper.classList.add('date-with-icon');
            } else {
                inputElement = document.createElement(colName.includes('Text') ? 'textarea' : 'input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.classList.add(colName.includes('Text') ? 'textarea-input' : 'text-input');
                // No readOnly for direct input in input row and editing rows
                if (!inputElement.closest('.input-row') && !inputElement.closest('.editing')) {
                    inputElement.readOnly = true; // Force modal for non-input/non-editing rows
                    inputElement.addEventListener('click', (event) => {
                        event.stopPropagation();
                        inputEditModalHeading.textContent = `Edit ${colName}`;
                        inputEditTextArea.value = inputElement.value;
                        currentEditingRow = inputElement.closest('tr');
                        currentEditingColIndex = columnNames.indexOf(colName);
                        inputEditModal.style.display = 'flex';
                    });
                }
            }
            wrapper.appendChild(inputElement);
            return wrapper;
        }

        function createTableRow(rowData = {}, isInputRow = false, isEditing = false) {
            const row = document.createElement('tr');
            if (isInputRow) row.classList.add('input-row');
            if (isEditing) row.classList.add('editing');

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
                        saveBtn.addEventListener('click', () => saveRow(row, true)); // isNewRow = true
                        actionDiv.appendChild(saveBtn);

                        const cancelBtn = document.createElement('button');
                        cancelBtn.classList.add('cancel-btn');
                        cancelBtn.textContent = 'Clear'; // Clear form not cancel edit
                        cancelBtn.addEventListener('click', () => resetInputRow(row));
                        actionDiv.appendChild(cancelBtn);
                    } else if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row, false)); // isNewRow = false
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

                        actionDiv.appendChild(editBtn);
                        actionDiv.appendChild(deleteBtn);
                    }
                    cell.appendChild(actionDiv);
                } else {
                    if (isInputRow || isEditing) {
                        const inputWrapper = createEditableInput(colName, value);
                        cell.appendChild(inputWrapper);
                    } else {
                        cell.textContent = value;
                    }
                }
                row.appendChild(cell);
            });
            return row;
        }

        function resetInputRow(row) {
            Array.from(row.querySelectorAll('input, textarea')).forEach(input => input.value = '');
        }

        function saveRow(row, isNewRow) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                if (colName !== 'Action') {
                    const inputElement = cells[index].querySelector('input, textarea');
                    let cellValue = inputElement ? inputElement.value.trim() : '';
                    rowData[colName] = cellValue;

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
            // Simulate save operation and update tableData
            if (isNewRow) {
                tableData.unshift(rowData); // Add new row to the beginning of data
                resetInputRow(row); // Reset the input row
            } else {
                // Find and update existing row
                const originalRowData = JSON.parse(row.dataset.originalData);
                const rowIndex = tableData.findIndex(item =>
                    Object.keys(originalRowData).every(key => originalRowData[key] === item[key])
                );
                if (rowIndex !== -1) {
                    tableData[rowIndex] = { ...tableData[rowIndex], ...rowData };
                }
            }

            // Re-render the current page to reflect changes
            pagination.displayPage(pagination.currentPage);
            pagination.updatePaginationButtons(); // Update pagination if item count changes
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
        }

        function editRow(row) {
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, false, true); // Not input row, is editing
            row.replaceWith(editingRow);
        }

        function cancelEdit(row) {
            const originalData = JSON.parse(row.dataset.originalData);
            const originalRow = createTableRow(originalData, false, false);
            row.replaceWith(originalRow);
        }

        function deleteRow(row) {
            currentEditingRow = row;
            currentTableId = tableId; // Set table ID for global clear/delete logic
            confirmMessage.textContent = "আপনি কি এই ডেটাগুলি ডিলিট করতে চান?";
            deleteConfirmModal.style.display = 'flex';

            // Custom confirmDeleteBtn click for this context if needed, otherwise global will handle
            // The global confirmDeleteBtn.onclick now checks currentTableId for clear vs delete
            const originalRowData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalRowData[colName] = cell.textContent.trim();
                }
            });
            // Remove from tableData array
            tableData = tableData.filter(item =>
                !Object.keys(originalRowData).every(key => originalRowData[key] === item[key])
            );
            // If the deleted row was the last on a page, go to previous page
            if (pagination.currentPage > 1 && (tableData.length % ROWS_PER_PAGE === 0)) {
                pagination.displayPage(pagination.currentPage - 1);
            } else {
                pagination.displayPage(pagination.currentPage);
            }
            pagination.updatePaginationButtons(); // Update pagination buttons
        }

        const pagination = setupPagination(tableId, tableData, createTableRow);

        // Add the input row at the top *after* initial population
        // This needs to be handled by displayPage for proper pagination integration.
        // For simplicity with pagination, input row is static. If it needs to be part of paginated data,
        // it needs to be managed differently. For now, it's a fixed row above paginated data.
        const inputRowElement = createTableRow({}, true, false);
        tbody.prepend(inputRowElement); // Prepend so it's always at the top
    }


    // --- Sections 7 & 8: Tables with an External Input Form ---
    // Scrolling Notice for Teachers, Scrolling Notice for Students
    function initializeExternalFormTable(tableId, initialDataRows = []) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const formContainer = table.closest('.admin-section').querySelector('.input-form-container');
        const dateInput = formContainer.querySelector('.date-input');
        const subjectInput = formContainer.querySelector('textarea');
        const colorInput = formContainer.querySelector('.color-input');
        const colorPreviewForm = formContainer.querySelector('.color-preview'); // Preview specific to the form
        const saveBtn = formContainer.querySelector('.save-btn');
        const cancelBtn = formContainer.querySelector('.cancel-btn');

        // Initialize form color preview
        colorPreviewForm.style.backgroundColor = colorInput.value || 'transparent';
        colorPreviewForm.style.borderColor = colorInput.value ? colorInput.value : '#ccc';

        let tableData = [...initialDataRows];

        // Attach date picker to form's date input
        dateInput.addEventListener('click', () => {
            currentDatePickerInput = dateInput;
            populateDateSelects();
            generateCalendar();
            datePickerModal.style.display = 'flex';
        });

        function createEditableInput(colName, currentValue) {
            let inputElement;
            const wrapper = document.createElement('div'); // Wrapper for inputs inside cells

            if (colName === 'Subject') {
                inputElement = document.createElement('textarea');
                inputElement.value = currentValue;
                inputElement.classList.add('textarea-input');
                inputElement.readOnly = true; // Force modal edit
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);

                    // If Subject needs date, set up hidden date input for date picker via modal
                    const hiddenDateInput = currentEditingRow.querySelector('.hidden-date-for-scrolling-notice');
                    if (hiddenDateInput) {
                        // When modal opens for Subject, clicking on its textarea should also allow date picking
                        inputEditTextArea.dataset.linkedDateInputId = hiddenDateInput.id; // Store link to hidden date input
                        // Add an event listener to the modal's textarea to open date picker for linked input
                        inputEditTextArea.addEventListener('click', handleSubjectTextAreaClick); // Add this listener only once.
                    } else {
                        delete inputEditTextArea.dataset.linkedDateInputId;
                        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                    }

                    inputEditModal.style.display = 'flex';
                });

            } else if (colName === 'Color') {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.classList.add('color-input');
                const colorPreviewDiv = document.createElement('div');
                colorPreviewDiv.classList.add('color-preview');
                colorPreviewDiv.style.backgroundColor = currentValue || 'transparent';
                colorPreviewDiv.style.borderColor = currentValue ? currentValue : '#ccc';
                wrapper.appendChild(colorPreviewDiv);
                wrapper.classList.add('color-with-preview');
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true; // Default for modal editing
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);
                    inputEditModal.style.display = 'flex';
                });
            }
            wrapper.appendChild(inputElement);
            return wrapper;
        }

        // Helper for handling click on Subject textarea in the modal
        function handleSubjectTextAreaClick() {
            if (inputEditTextArea.dataset.linkedDateInputId) {
                const hiddenDateInput = document.getElementById(inputEditTextArea.dataset.linkedDateInputId);
                if (hiddenDateInput) {
                    currentDatePickerInput = hiddenDateInput;
                    populateDateSelects();
                    generateCalendar();
                    datePickerModal.style.display = 'flex';
                }
            }
        }


        function createTableRow(rowData = {}, isEditing = false) {
            const row = document.createElement('tr');
            if (isEditing) row.classList.add('editing');

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                let value = rowData[colName] || '';

                if (colName === 'Action') {
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    if (isEditing) {
                        const saveBtn = document.createElement('button');
                        saveBtn.classList.add('save-btn');
                        saveBtn.textContent = 'Save';
                        saveBtn.addEventListener('click', () => saveRow(row));
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

                        actionDiv.appendChild(editBtn);
                        actionDiv.appendChild(deleteBtn);
                    }
                    cell.appendChild(actionDiv);
                } else {
                    if (isEditing) {
                        // For editing Subject column, extract just the subject text
                        let displayValue = value;
                        let hiddenDateVal = '';
                        if (colName === 'Subject' && value.includes('📅')) {
                            // Example: "📅 24th Jun 2025 - This is a subject"
                            const match = value.match(/📅\s*(\d{1,2}(?:st|nd|rd|th)?\s*\w{3}\s*\d{4})\s*-\s*(.*)/);
                            if (match) {
                                displayValue = match[2]; // Only subject text for editing
                                const datePart = match[1];
                                // Convert '24th Jun 2025' to 'DD-MM-YYYY'
                                const dateMatch = datePart.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(\w{3})\s*(\d{4})/);
                                if (dateMatch) {
                                    const day = String(dateMatch[1]).padStart(2, '0');
                                    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    const monthIndex = monthNamesShort.indexOf(dateMatch[2]);
                                    const month = String(monthIndex + 1).padStart(2, '0');
                                    const year = dateMatch[3];
                                    hiddenDateVal = `${day}-${month}-${year}`;
                                }
                            }
                        }
                        const inputWrapper = createEditableInput(colName, displayValue);
                        cell.appendChild(inputWrapper);

                        if (colName === 'Subject') {
                            const hiddenDateInput = document.createElement('input');
                            hiddenDateInput.type = 'hidden';
                            hiddenDateInput.classList.add('hidden-date-for-scrolling-notice');
                            hiddenDateInput.value = hiddenDateVal;
                            hiddenDateInput.id = `${tableId}-hidden-date-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique ID
                            cell.appendChild(hiddenDateInput);
                        }

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

        saveBtn.addEventListener('click', () => {
            const date = dateInput.value.trim();
            const subject = subjectInput.value.trim();
            const color = colorInput.value.trim();

            if (!date || !subject) {
                showValidationMessage("Date এবং Subject ফিল্ডগুলো আবশ্যিক।");
                return;
            }

            const formattedDate = formatDateForNotice(date);
            const fullSubject = `📅 ${formattedDate} - ${subject}`;

            const newEntry = {
                Subject: fullSubject,
                Color: color
            };

            console.log(`Saving new form entry to ${tableId}:`, newEntry);
            // Add to tableData array
            tableData.unshift(newEntry); // Add new entry to the beginning

            // Clear form
            dateInput.value = '';
            subjectInput.value = '';
            colorInput.value = '';
            colorPreviewForm.style.backgroundColor = 'transparent';
            colorPreviewForm.style.borderColor = '#ccc';
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");

            // Re-render table
            pagination.displayPage(pagination.currentPage);
            pagination.updatePaginationButtons();
        });

        cancelBtn.addEventListener('click', () => {
            dateInput.value = '';
            subjectInput.value = '';
            colorInput.value = '';
            colorPreviewForm.style.backgroundColor = 'transparent';
            colorPreviewForm.style.borderColor = '#ccc';
        });

        function saveRow(row) {
            const cells = Array.from(row.children);
            const rowData = {};
            let isValid = true;
            let validationMessageText = '';

            columnNames.forEach((colName, index) => {
                if (colName !== 'Action') {
                    let inputElement = cells[index].querySelector('input, textarea');
                    let cellValue;

                    if (colName === 'Subject') {
                        const subjectText = inputElement ? inputElement.value.trim() : '';
                        const hiddenDateInput = cells[index].querySelector('.hidden-date-for-scrolling-notice');
                        const selectedDate = hiddenDateInput ? hiddenDateInput.value : '';

                        if (!selectedDate || !subjectText) {
                            isValid = false;
                            validationMessageText = `Subject এর তারিখ এবং বিষয়বস্তু উভয়ই আবশ্যিক।`;
                        } else {
                            const formattedDate = formatDateForNotice(selectedDate);
                            cellValue = `📅 ${formattedDate} - ${subjectText}`;
                        }
                    } else if (colName === 'Color') {
                        cellValue = inputElement ? inputElement.value.trim() : '';
                    } else {
                        cellValue = inputElement ? inputElement.value.trim() : cells[index].textContent.trim();
                    }
                    rowData[colName] = cellValue;
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            console.log(`Saving updated row to ${tableId}:`, rowData);
            // Update tableData array
            const originalRowData = JSON.parse(row.dataset.originalData);
            const rowIndex = tableData.findIndex(item =>
                Object.keys(originalRowData).every(key => originalRowData[key] === item[key])
            );
            if (rowIndex !== -1) {
                tableData[rowIndex] = { ...tableData[rowIndex], ...rowData };
            }

            const updatedRow = createTableRow(rowData, false);
            row.replaceWith(updatedRow);
            showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            pagination.displayPage(pagination.currentPage); // Re-render current page
            pagination.updatePaginationButtons(); // Update pagination if data count changes (unlikely here)
        }

        function editRow(row) {
            const originalData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalData[colName] = cell.textContent.trim();
                }
            });
            row.dataset.originalData = JSON.stringify(originalData);

            const editingRow = createTableRow(originalData, true);
            row.replaceWith(editingRow);
        }

        function cancelEdit(row) {
            const originalData = JSON.parse(row.dataset.originalData);
            const originalRow = createTableRow(originalData, false);
            row.replaceWith(originalRow);
        }

        function deleteRow(row) {
            currentEditingRow = row;
            currentTableId = tableId; // Set table ID for global clear/delete logic
            confirmMessage.textContent = "আপনি কি এই ডেটাগুলি ডিলিট করতে চান?";
            deleteConfirmModal.style.display = 'flex';

            // Custom logic for data deletion from array
            const originalRowData = {};
            Array.from(row.children).forEach((cell, index) => {
                const colName = columnNames[index];
                if (colName !== 'Action') {
                    originalRowData[colName] = cell.textContent.trim();
                }
            });
            tableData = tableData.filter(item =>
                !Object.keys(originalRowData).every(key => originalRowData[key] === item[key])
            );
            // If the deleted row was the last on a page, go to previous page
            if (pagination.currentPage > 1 && (tableData.length % ROWS_PER_PAGE === 0)) {
                pagination.displayPage(pagination.currentPage - 1);
            } else {
                pagination.displayPage(pagination.currentPage);
            }
            pagination.updatePaginationButtons(); // Update pagination buttons
        }

        const pagination = setupPagination(tableId, tableData, createTableRow);
    }

    // --- Initialize All Tables ---
    initializeExamLinkTeachersTable();
    initializeMarksSubmissionDateTable();
    initializeExamLinkStudentsTable();
    initializeInputRowTable('table-help-teacher', [
        { "Help Text": "For login issues, contact IT support at 123-456-7890.", "Date": "20-06-2025" },
        { "Help Text": "Please check your network connection before reporting issues.", "Date": "21-06-2025" }
    ]);
    initializeInputRowTable('table-notice-teacher', [
        { "Notice Text": "Teacher's meeting next Monday at 10 AM in the staff room.", "Date": "22-06-2025" }
    ]);
    initializeInputRowTable('table-notice-student', [
        { "Notice Text": "Annual sports day registration starts next week.", "Date": "23-06-2025" }
    ]);
    initializeExternalFormTable('table-scrolling-teacher', [
        { "Subject": "📅 20th Jun 2025 - Holiday on Eid al-Adha.", "Color": "#4CAF50" },
        { "Subject": "📅 25th Jun 2025 - Faculty meeting scheduled.", "Color": "#FFEB3B" }
    ]);
    initializeExternalFormTable('table-scrolling-student', [
        { "Subject": "📅 21st Jun 2025 - School will remain closed tomorrow.", "Color": "#D32F2F" },
        { "Subject": "📅 26th Jun 2025 - Exam schedule update.", "Color": "#2196F3" }
    ]);
});
