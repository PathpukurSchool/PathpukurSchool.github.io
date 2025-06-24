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
    let currentColorPreview = null; // The div that shows color preview next to input

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

    // Function to format date into "DDth Mon YYYY" (e.g., "23rd Jun 2025")
    function formatDayWithOrdinal(day) {
        if (day > 3 && day < 21) return 'th'; // covers 11th to 20th
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

    // Helper to determine text color for contrast (for Color column)
    function getContrastYIQ(hexcolor) {
        if (!hexcolor || hexcolor.length !== 7 || !/^#[0-9A-F]{6}$/i.test(hexcolor)) return '#333'; // Default for invalid or transparent
        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
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
        const currentYearFull = new Date().getFullYear();
        for (let i = currentYearFull - 5; i <= currentYearFull + 5; i++) {
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
            const fullDate = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
            span.dataset.date = fullDate;

            const today = new Date();
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                span.classList.add('today-date');
            }

            // Check if this date is already selected in the input
            if (currentDatePickerInput && currentDatePickerInput.value === fullDate) {
                span.classList.add('selected-date');
            }

            span.addEventListener('click', () => {
                if (currentDatePickerInput) {
                    currentDatePickerInput.value = fullDate;
                    currentDatePickerInput.dispatchEvent(new Event('change')); // Trigger change event

                    // For scrolling notice tables, display as icon + date
                    const tableId = currentDatePickerInput.closest('table')?.id; // Null-safe access
                    const formId = currentDatePickerInput.closest('.input-form-container')?.id;

                    if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && currentDatePickerInput.classList.contains('date-input') && !currentDatePickerInput.readOnly) {
                        // This applies when editing a row in scrolling tables
                        const cell = currentDatePickerInput.parentElement;
                        const existingIcon = cell.querySelector('.calendar-icon');
                        if (existingIcon) existingIcon.remove();
                        const icon = document.createElement('span');
                        icon.classList.add('calendar-icon');
                        icon.textContent = '📆';
                        cell.prepend(icon);
                        cell.classList.add('date-with-icon');
                        currentDatePickerInput.style.display = 'none';
                    } else if ((formId === 'scrolling-teacher' || formId === 'scrolling-student') && currentDatePickerInput.classList.contains('date-input')) {
                        // This applies to the form's date input
                        // No specific icon logic needed for form input, just set value
                    }
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
                    if (currentColorPreview) {
                        currentColorPreview.style.backgroundColor = color; // Update input background
                    } else {
                        // Fallback if preview is not found, apply to input itself (less ideal)
                        currentColorInput.style.backgroundColor = color;
                    }
                    colorPickerModal.style.display = 'none';
                    currentColorInput.dispatchEvent(new Event('change')); // Trigger change event
                }
            });
            colorPalette.appendChild(colorBox);
        });
    }
    populateColorPalette();

    // Attach color picker to inputs dynamically
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-input')) {
            currentColorInput = e.target;
            currentColorPreview = e.target.nextElementSibling; // Assuming preview is next sibling
            if (currentColorPreview && !currentColorPreview.classList.contains('color-preview')) {
                currentColorPreview = null; // Reset if not the correct element
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

    // Handle color input change (e.g., if set programmatically)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('color-input')) {
            const input = e.target;
            const preview = input.nextElementSibling;
            if (preview && preview.classList.contains('color-preview')) {
                preview.style.backgroundColor = input.value || 'transparent';
            } else {
                input.style.backgroundColor = input.value || 'transparent'; // Fallback
            }
        }
    });

    // --- Global createTableRow Function (moved outside initializeTable) ---
    // This function now handles creating rows for all table types based on parameters
    function createTableRow(tableId, columnNames, rowData = {}, isInputRow = false, isEditing = false) {
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
            } else if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && colName === 'Date') {
                // 'Date' is not a table column for scrolling notices, it's part of subject string
                // But if it was, it would be fixed here.
            }

            if (isFixedColumn) {
                cell.textContent = cellValue;
                cell.classList.add('fixed-column');
            } else if (!isActionColumn) {
                if (isInputRow || isEditing) { // If it's an input row or an editing row
                    let inputElement;
                    const isModalEditable = ['URL', 'Link', 'ID', 'Password', 'Heading', 'Subject'].includes(colName);

                    if (colName === 'Heading' || colName === 'Subject' || colName === 'URL' || colName === 'Link') {
                        inputElement = document.createElement('textarea');
                        inputElement.value = cellValue;
                        inputElement.classList.add('textarea-input'); // Custom class for textarea
                    } else {
                        inputElement = document.createElement('input');
                        inputElement.type = 'text';
                        inputElement.value = cellValue;
                    }

                    if (colName === 'Date') { // For tables where Date is a direct column (not scrolling notices)
                        inputElement.readOnly = true;
                        inputElement.classList.add('date-input');
                        inputElement.addEventListener('click', () => {
                            currentDatePickerInput = inputElement;
                            populateDateSelects(); // Reset selects to current date
                            generateCalendar();
                            datePickerModal.style.display = 'flex';
                        });
                    } else if (colName === 'Color') {
                        inputElement.readOnly = true;
                        inputElement.classList.add('color-input');
                        // Add a color preview div next to the input
                        const colorPreview = document.createElement('div');
                        colorPreview.classList.add('color-preview');
                        colorPreview.style.backgroundColor = cellValue || 'transparent';
                        cell.appendChild(colorPreview);
                        
                        // Set current value and update preview on change (manual trigger or via picker)
                        inputElement.value = cellValue;
                        inputElement.addEventListener('change', () => {
                            colorPreview.style.backgroundColor = inputElement.value || 'transparent';
                        });
                    } else if (isModalEditable) {
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
                    cell.appendChild(inputElement);

                    // Special handling for scrolling notice dates when editing a row
                    // If colName is Subject, and it contains date icon, we need to extract date and subject
                    if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && colName === 'Subject' && cellValue.includes('📅')) {
                         // Extract date from the beginning of the subject string
                         const match = cellValue.match(/📅\s*(\d{1,2}(?:st|nd|rd|th)?\s*\w{3}\s*\d{4})\s*-\s*(.*)/);
                         if (match) {
                             const originalDate = match[1]; // e.g., "23rd Jun 2025"
                             const originalSubject = match[2]; // e.g., "Subject (যেমন - নির্ধারিত সময়ের মধ্যে নম্বর আপলোড করে দেবেন)"
                             // Store this original subject in a data attribute for retrieval during save/cancel
                             inputElement.dataset.originalFormattedSubject = originalSubject;
                             inputElement.value = originalSubject; // Show only subject in editor
                             
                             // Add an invisible date input next to it for date picker to modify
                             const hiddenDateInput = document.createElement('input');
                             hiddenDateInput.type = 'hidden'; // Keep it hidden
                             hiddenDateInput.classList.add('hidden-date-for-scrolling-notice');
                             // Convert "23rd Jun 2025" back to "DD-MM-YYYY" for date picker
                             const dateParts = originalDate.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(\w{3})\s*(\d{4})/);
                             if (dateParts) {
                                 const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                 const monthIndex = monthNames.indexOf(dateParts[2]);
                                 if (monthIndex !== -1) {
                                     hiddenDateInput.value = `${String(dateParts[1]).padStart(2, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${dateParts[3]}`;
                                 }
                             }
                             cell.appendChild(hiddenDateInput);
                             
                             // When the Subject input is clicked for modal edit, handle date picker too
                             inputElement.addEventListener('click', (e) => {
                                 currentDatePickerInput = hiddenDateInput;
                                 populateDateSelects();
                                 generateCalendar();
                                 datePickerModal.style.display = 'flex';
                                 e.stopPropagation(); // Prevent modal from immediately opening if this is a textarea/input click
                             });
                             inputElement.readOnly = true; // Make it read-only to force modal edit for subject

                         } else {
                             inputElement.value = cellValue; // Fallback if format doesn't match
                         }
                    }

                } else { // Display mode (not input row, not editing)
                    if (colName === 'Color' && cellValue) {
                        cell.textContent = cellValue;
                        cell.style.backgroundColor = cellValue;
                        cell.style.color = getContrastYIQ(cellValue);
                    } else {
                        cell.textContent = cellValue;
                    }
                }
            } else { // Action column
                const actionDiv = document.createElement('div');
                actionDiv.classList.add('action-buttons');

                if (isInputRow) { // This block for tables that use 'input rows' for new entries
                    const saveBtn = document.createElement('button');
                    saveBtn.classList.add('save-btn');
                    saveBtn.textContent = 'Save';
                    saveBtn.addEventListener('click', () => saveRow(row, tableId, columnNames, true));
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
                    saveBtn.addEventListener('click', () => saveRow(row, tableId, columnNames, false));
                    actionDiv.appendChild(saveBtn);

                    const cancelBtn = document.createElement('button');
                    cancelBtn.classList.add('cancel-btn');
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.addEventListener('click', () => cancelEdit(row, tableId, columnNames));
                    actionDiv.appendChild(cancelBtn);
                } else {
                    const editBtn = document.createElement('button');
                    editBtn.classList.add('edit-btn');
                    editBtn.textContent = 'Edit';
                    editBtn.addEventListener('click', () => editRow(row, tableId, columnNames));
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


    // Reset input row after saving or canceling (for tables with input rows)
    function resetInputRow(row, tableId) {
        Array.from(row.querySelectorAll('input, textarea')).forEach(input => {
            input.value = '';
            if (input.classList.contains('color-input')) {
                input.style.backgroundColor = 'transparent';
                const preview = input.nextElementSibling;
                if (preview && preview.classList.contains('color-preview')) {
                    preview.style.backgroundColor = 'transparent';
                }
            }
            if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && input.classList.contains('date-input')) {
                input.style.display = ''; // Show input again
            }
        });
        Array.from(row.querySelectorAll('.calendar-icon')).forEach(icon => icon.remove());
        Array.from(row.querySelectorAll('.date-with-icon')).forEach(cell => cell.classList.remove('date-with-icon'));
    }

    // --- Save, Edit, Delete Row Functions ---
    async function saveRow(row, tableId, columnNames, isNewRow) {
        const cells = Array.from(row.children);
        const rowData = {};
        let isValid = true;
        let validationMessageText = '';

        columnNames.forEach((colName, index) => {
            let cellValue;
            const inputElement = cells[index].querySelector('input') || cells[index].querySelector('textarea');
            
            if (inputElement) {
                if (colName === 'Subject' && (tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student')) {
                    // For scrolling notices, subject might be combined with date
                    cellValue = inputElement.value.trim();
                } else {
                    cellValue = inputElement.value.trim();
                }
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
                // Validation for Scrolling notices (Date is from form, Subject is in table)
                // Note: Actual date validation happens in form submission for sections 7&8
                if (colName === 'Subject' && !cellValue) {
                    isValid = false;
                    validationMessageText = `Subject ফিল্ডটি আবশ্যিক।`;
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
            // For tables with input rows (sections 4,5,6), prepend new row and reset input row
            const newRow = createTableRow(tableId, columnNames, rowData, false, false);
            row.closest('tbody').prepend(newRow); // Add new row at the top
            resetInputRow(row, tableId); // Reset the input row
        } else {
            // For an edited row, replace the editing row with a new display row
            const updatedRow = createTableRow(tableId, columnNames, rowData, false, false);
            row.replaceWith(updatedRow);
        }

        showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
        // Optionally re-render the pagination or specific rows if needed.
    }


    function editRow(row, tableId, columnNames) {
        // Store original data before editing for cancel functionality
        const originalData = {};
        Array.from(row.children).forEach((cell, index) => {
            const colName = columnNames[index];
            if (colName !== 'Action') {
                // For scrolling notices, Subject needs special handling to extract original text
                if ((tableId === 'table-scrolling-teacher' || tableId === 'table-scrolling-student') && colName === 'Subject' && cell.textContent.includes('📅')) {
                    const match = cell.textContent.match(/📅\s*(\d{1,2}(?:st|nd|rd|th)?\s*\w{3}\s*\d{4})\s*-\s*(.*)/);
                    if (match) {
                        originalData['Date'] = match[1]; // Store formatted date part
                        originalData[colName] = match[2]; // Store only subject part
                    } else {
                        originalData[colName] = cell.textContent.trim();
                    }
                } else {
                    originalData[colName] = cell.textContent.trim();
                }
            }
        });
        row.dataset.originalData = JSON.stringify(originalData);

        const editingRow = createTableRow(tableId, columnNames, originalData, false, true); // Create a new row in editing mode
        row.replaceWith(editingRow); // Replace the current row with the editing row
    }

    function cancelEdit(row, tableId, columnNames) {
        const originalData = row.dataset.originalData ? JSON.parse(row.dataset.originalData) : {};
        // Special re-formatting for scrolling notices subject
        if (['table-scrolling-teacher', 'table-scrolling-student'].includes(tableId) && originalData['Subject'] && originalData['Date']) {
            originalData['Subject'] = `📅 ${originalData['Date']} - ${originalData['Subject']}`;
        }
        const originalRow = createTableRow(tableId, columnNames, originalData, false, false); // Recreate the original display row
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

    // --- Table Management Function (Main Logic for each section) ---
    // isInputRowRequired: If true, adds a dedicated input row inside the table (sections 4,5,6)
    // isInputFormRequired: If true, expects an external input form (sections 7,8)
    function initializeTable(tableId, initialDataRows = [], isInputRowRequired = false, isInputFormRequired = false) {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error(`Table with ID '${tableId}' not found.`);
            return;
        }
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        // Populate Initial Table Data
        function populateTable(data) {
            tbody.innerHTML = ''; // Clear existing rows
            if (isInputRowRequired) {
                // For tables with an input row, add it at the top
                tbody.appendChild(createTableRow(tableId, columnNames, {}, true));
            }
            data.forEach(rowData => {
                const row = createTableRow(tableId, columnNames, rowData, false, false); // Create as display row
                tbody.appendChild(row);
            });
        }

        populateTable(initialDataRows);

        // --- Section 7 & 8 Specific Form Handling ---
        if (isInputFormRequired) {
            const formContainer = table.closest('.admin-section').querySelector('.input-form-container');
            const dateInput = formContainer.querySelector('.date-input');
            const subjectInput = formContainer.querySelector('textarea');
            const colorInput = formContainer.querySelector('.color-input');
            const colorPreview = formContainer.querySelector('.color-preview');
            const saveBtn = formContainer.querySelector('.save-btn');
            const cancelBtn = formContainer.querySelector('.cancel-btn');

            // Initialize color preview for the form
            colorPreview.style.backgroundColor = colorInput.value || 'transparent';

            // Date picker for form
            dateInput.addEventListener('click', () => {
                currentDatePickerInput = dateInput;
                populateDateSelects();
                generateCalendar();
                datePickerModal.style.display = 'flex';
            });
            
            // Color picker for form (already handled by global click listener on .color-input)
            
            saveBtn.addEventListener('click', async () => {
                const date = dateInput.value.trim();
                const subject = subjectInput.value.trim();
                const color = colorInput.value.trim();

                if (!date || !subject) {
                    showValidationMessage("Date এবং Subject ফিল্ডগুলো আবশ্যিক।");
                    return;
                }

                // Format the subject string as required
                const formattedDate = formatDateForNotice(date);
                const fullSubject = `📅 ${formattedDate} - ${subject}`;

                const newEntry = {
                    Subject: fullSubject,
                    Color: color
                };

                // Simulate save to backend (replace with actual fetch)
                console.log(`Saving new form entry to ${tableId}:`, newEntry);
                // Example: try { await fetch('/api/saveNotice', { method: 'POST', body: JSON.stringify(newEntry) }); } catch (error) { console.error('Save failed:', error); showValidationMessage('সেভ করতে সমস্যা হয়েছে।'); return; }

                // Prepend new row to the table
                const newRowElement = createTableRow(tableId, columnNames, newEntry, false, false);
                tbody.prepend(newRowElement);

                // Reset form fields
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '';
                colorPreview.style.backgroundColor = 'transparent';
                showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            });

            cancelBtn.addEventListener('click', () => {
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '';
                colorPreview.style.backgroundColor = 'transparent';
            });
        }
    }


    // --- Initial Data Definitions and Table Initialization Calls ---

    // Section 1: Exam Link for Teachers
    const examLinkTeacherClasses = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
    const examLinkTeacherData = examLinkTeacherClasses.map(cls => ({
        Class: cls,
        ID: '',
        Password: '',
        URL: ''
    }));
    initializeTable('table-exam-link-teacher', examLinkTeacherData, false, false);

    // Section 2: Marks Submission Date for Teacher
    const marksSubmissionExams = ["1st Exam", "2nd Exam", "X Test", "3Rd Exam", "XI Semester I", "XI Semester II", "XII Test"];
    const marksSubmissionData = marksSubmissionExams.map(exam => ({
        Exam: exam,
        Date: '',
        Color: ''
    }));
    initializeTable('table-marks-submission-date', marksSubmissionData, false, false);

    // Section 3: Exam Link for Student
    const examLinkStudentClasses = ["V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD", "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD", "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST", "XI_SEM1", "XI_SEM2", "XII_TEST"];
    const examLinkStudentData = examLinkStudentClasses.map(cls => ({
        Class: cls,
        URL: ''
    }));
    initializeTable('table-exam-link-student', examLinkStudentData, false, false);

    // Sections 4, 5, 6 require an input row within the table
    // Initial data for these will typically be fetched from a backend. For now, empty.
    initializeTable('table-help-teacher', [], true, false);
    initializeTable('table-notice-teacher', [], true, false);
    initializeTable('table-notice-student', [], true, false);

    // Sections 7, 8 use a dedicated input form above the table
    // Initial data will typically be fetched from a backend. For now, empty.
    initializeTable('table-scrolling-teacher', [], false, true);
    initializeTable('table-scrolling-student', [], false, true);

    // Pagination (simplified for this context, needs full implementation for dynamic data)
    document.querySelectorAll('.pagination').forEach(paginationContainer => {
        paginationContainer.innerHTML = `
            <button disabled>Previous</button>
            <button disabled>Next</button>
        `;
    });
});
