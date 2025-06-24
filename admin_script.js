
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
    const datePickerModal = document.getElementById('datePickerModal');
    const colorPickerModal = document.getElementById('colorPickerModal');
    const colorPalette = document.getElementById('colorPalette');

    let currentEditingRow = null; // Currently selected row for edit/delete
    let currentEditingColIndex = -1; // Currently selected column index for input edit modal
    let currentDatePickerInput = null; // The input field that opened the date picker
    let currentSelectedColorBox = null; // For color picker modal
    let currentColorInput = null; // The input field that opened the color picker
    let currentColorPreview = null; // The div that shows color preview next to input (for form)

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
                    currentColorPreview = null;
                    if (currentSelectedColorBox) {
                        currentSelectedColorBox.classList.remove('selected');
                        currentSelectedColorBox = null;
                    }
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
            return new Date(parts[2], parts[1] - 1, parts[0]);
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
            option.textContent = new Date(0, i).toLocaleString('bn-BD', { month: 'long' });
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

        for (let i = 0; i < firstDayOfWeek; i++) {
            const span = document.createElement('span');
            span.classList.add('empty');
            calendarDates.appendChild(span);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const span = document.createElement('span');
            span.textContent = day;
            const fullDate = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
            span.dataset.date = fullDate;

            const today = new Date();
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                span.classList.add('today-date');
            }

            if (currentDatePickerInput && currentDatePickerInput.value === fullDate) {
                span.classList.add('selected-date');
            }

            span.addEventListener('click', () => {
                if (currentDatePickerInput) {
                    currentDatePickerInput.value = fullDate;
                    currentDatePickerInput.dispatchEvent(new Event('change'));
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

    populateDateSelects();

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
                    currentColorInput.dispatchEvent(new Event('change'));
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
        }
    };

    cancelInputBtn.onclick = () => {
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        currentEditingRow = null;
        currentEditingColIndex = -1;
    };


    // --- Section 1: Exam Link for Teachers ---
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

                    if (!cellValue && !['Class'].includes(colName)) { // 'Class' is fixed
                        isValid = false;
                        validationMessageText = `${colName} ফিল্ডটি আবশ্যিক।`;
                    }
                }
            });

            if (!isValid) {
                showValidationMessage(validationMessageText);
                return;
            }

            console.log(`Saving Exam Link Teacher data:`, rowData);
            // Simulate save operation (replace with actual API call)
            // try { await fetch('/api/saveExamLinkTeacher', { method: 'POST', body: JSON.stringify(rowData) }); } catch (error) { console.error('Save failed:', error); showValidationMessage('সেভ করতে সমস্যা হয়েছে।'); return; }

            const updatedRow = createTableRow(rowData, false); // Create a new display row
            row.replaceWith(updatedRow);
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
            row.dataset.originalData = JSON.stringify(originalData); // Store original data

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
            deleteConfirmModal.style.display = 'flex';
            confirmDeleteBtn.onclick = () => {
                if (currentEditingRow) {
                    // Simulate delete (replace with actual API call)
                    console.log(`Deleting row from table-exam-link-teacher`);
                    currentEditingRow.remove();
                    currentEditingRow = null;
                    deleteConfirmModal.style.display = 'none';
                    showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
                }
            };
        }
        populateTable(initialDataRows);
    }

    // --- Section 2: Marks Submission Date for Teacher ---
    function initializeMarksSubmissionDateTable() {
        const table = document.getElementById('table-marks-submission-date');
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        const exams = ["1st Exam", "2nd Exam", "X Test", "3Rd Exam", "XI Semester I", "XI Semester II", "XII Test"];
        const initialDataRows = exams.map(exam => ({
            Exam: exam,
            Date: '',
            Color: ''
        }));

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

        function populateTable(data) {
            tbody.innerHTML = '';
            data.forEach(rowData => {
                const row = createTableRow(rowData, false);
                tbody.appendChild(row);
            });
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
            // Simulate save operation
            const updatedRow = createTableRow(rowData, false);
            row.replaceWith(updatedRow);
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
            deleteConfirmModal.style.display = 'flex';
            confirmDeleteBtn.onclick = () => {
                if (currentEditingRow) {
                    console.log(`Deleting row from table-marks-submission-date`);
                    currentEditingRow.remove();
                    currentEditingRow = null;
                    deleteConfirmModal.style.display = 'none';
                    showValidationMessage("ডেটা সফলভাবে ডিলিট হয়েছে!");
                }
            };
        }
        populateTable(initialDataRows);
    }

    // --- Section 3: Exam Link for Student ---
    
