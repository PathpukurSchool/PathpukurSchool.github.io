
document.addEventListener('DOMContentLoaded', () => {

    // --- Common Modals and Utility Functions (Global to these sections) ---
    // Make sure these modal IDs are unique and exist in your HTML
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea'); // This textarea will be used for all text/color input editing
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');

    // Date Picker Modals
    const datePickerModal = document.getElementById('datePickerModal');
    const dateSelectDay = document.getElementById('dateSelectDay');
    const dateSelectMonth = document.getElementById('dateSelectMonth');
    const dateSelectYear = document.getElementById('dateSelectYear');
    const calendarBody = document.getElementById('calendarBody');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');
    const cancelDateBtn = document.getElementById('cancelDateBtn');
    const okDateBtn = document.getElementById('okDateBtn');

    // Specific delete confirmation modals for Section 7 and 8
    const deleteConfirmModalSection7 = document.getElementById('deleteConfirmModalSection7');
    const confirmDeleteBtnSection7 = document.getElementById('confirmDeleteBtnSection7');
    const cancelDeleteBtnSection7 = document.getElementById('cancelDeleteBtnSection7');

    const deleteConfirmModalSection8 = document.getElementById('deleteConfirmModalSection8');
    const confirmDeleteBtnSection8 = document.getElementById('confirmDeleteBtnSection8');
    const cancelDeleteBtnSection8 = document.getElementById('cancelDeleteBtnSection8');


    let currentDatePickerInput = null; // Stores the input field that needs date
    let currentCalendarDate = new Date(); // Date for the calendar view

    // Global variable to keep track of the row being edited in the modal
    let currentEditingRowData = null; // Stores the data object of the row being edited
    let currentEditingTableId = null; // Stores the ID of the table being edited


    // --- Ensure all modals are hidden initially and use classes for display ---
    document.querySelectorAll('.table-modal-overlay').forEach(modal => {
        modal.classList.remove('show-modal'); // Ensure it's hidden and clean
        modal.style.display = 'none'; // Set initial display to none for proper transition setup
    });

    // Function to show validation/success messages
    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex'; // Use flex for centering
        validationModal.classList.add('show-modal'); // For CSS transition
        // Optional: Auto-hide after some time
        setTimeout(() => {
            validationModal.classList.remove('show-modal');
            setTimeout(() => validationModal.style.display = 'none', 300); // Hide completely after transition
        }, 3000);
    }

    // Function to get contrast color for text on a given background color
    function getContrastYIQ(hexcolor) {
        if (!hexcolor || hexcolor.length < 6) return 'black'; // Default to black
        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    // Function to format date from DD-MM-YYYY to 1st Jan 2025 format
    function formatDateForNotice(dateString) {
        const [day, month, year] = dateString.split('-');
        const dateObj = new Date(year, parseInt(month) - 1, day);
        const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        // Add ordinal suffix (st, nd, rd, th)
        const dayOfMonth = dateObj.getDate();
        const suffix = (dayOfMonth % 10 === 1 && dayOfMonth !== 11) ? 'st' :
                       (dayOfMonth % 10 === 2 && dayOfMonth !== 12) ? 'nd' :
                       (dayOfMonth % 10 === 3 && dayOfMonth !== 13) ? 'rd' : 'th';
        return formattedDate.replace(/(\d+)/, `$1${suffix}`).replace(',', '');
    }

    // --- Date Picker Functions ---
    function populateDateSelects() {
        dateSelectDay.innerHTML = '';
        dateSelectMonth.innerHTML = '';
        dateSelectYear.innerHTML = '';

        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = String(i).padStart(2, '0');
            dateSelectDay.appendChild(option);
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthNames.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = String(index + 1).padStart(2, '0');
            option.textContent = month;
            dateSelectMonth.appendChild(option);
        });

        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            dateSelectYear.appendChild(option);
        }
    }

    function generateCalendar() {
        calendarBody.innerHTML = '';
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sunday) to 6 (Saturday)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        currentMonthYear.textContent =
            `${new Date(year, month).toLocaleString('en-US', { month: 'long' })} ${year}`;

        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 weeks
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) { // 7 days a week
                const cell = document.createElement('td');
                if (i === 0 && j < firstDay) {
                    cell.textContent = '';
                } else if (date > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    const fullDateFormatted = `${String(date).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
                    if (currentDatePickerInput && currentDatePickerInput.value === fullDateFormatted) {
                        cell.classList.add('selected-date');
                    }
                    cell.addEventListener('click', () => {
                        const day = String(cell.textContent).padStart(2, '0');
                        const monthVal = String(month + 1).padStart(2, '0');
                        const yearVal = year;
                        if (currentDatePickerInput) {
                            currentDatePickerInput.value = `${day}-${monthVal}-${yearVal}`;
                        }
                        datePickerModal.classList.remove('show-modal');
                        setTimeout(() => datePickerModal.style.display = 'none', 300);
                    });
                    date++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);
            if (date > daysInMonth) break;
        }
    }

    // Date Picker Button Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentCalendarDate = new Date();
        generateCalendar();
    });

    cancelDateBtn.addEventListener('click', () => {
        datePickerModal.classList.remove('show-modal');
        setTimeout(() => datePickerModal.style.display = 'none', 300);
        currentDatePickerInput = null;
    });

    okDateBtn.addEventListener('click', () => {
        if (currentDatePickerInput && !currentDatePickerInput.value) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            currentDatePickerInput.value = `${day}-${month}-${year}`;
        }
        datePickerModal.classList.remove('show-modal');
        setTimeout(() => datePickerModal.style.display = 'none', 300);
    });


    // Helper for handling click on Subject textarea in the modal
    function handleSubjectTextAreaClick() {
        if (inputEditTextArea.dataset.linkedDateInputId) {
            const hiddenDateInput = document.getElementById(inputEditTextArea.dataset.linkedDateInputId);
            if (hiddenDateInput) {
                const dateParts = hiddenDateInput.value.split('-'); // Format: DD-MM-YYYY
                if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
                    currentCalendarDate = new Date(dateParts[2], parseInt(dateParts[1]) - 1, dateParts[0]);
                } else {
                    currentCalendarDate = new Date(); // Default to today if no valid date
                }
                currentDatePickerInput = hiddenDateInput; // Set the hidden input as the target
                populateDateSelects();
                generateCalendar();
                datePickerModal.style.display = 'flex';
                datePickerModal.classList.add('show-modal');
            }
        }
    }


    // --- Store/Cancel Input from Modal (Shared) ---
    storeInputBtn.onclick = () => {
        if (currentEditingRowData && currentEditingTableId) {
            const value = inputEditTextArea.value.trim();
            const colName = inputEditModalHeading.textContent.replace('Edit ', '').trim();

            if (colName === 'Subject') {
                const hiddenDateInputId = inputEditTextArea.dataset.linkedDateInputId;
                const hiddenDateInput = document.getElementById(hiddenDateInputId);
                const datePart = hiddenDateInput ? hiddenDateInput.value.trim() : '';

                if (!datePart || !value) {
                    showValidationMessage("তারিখ এবং বিষয় উভয়ই পূরণ করতে হবে।");
                    return;
                }
                const formattedDate = formatDateForNotice(datePart);
                currentEditingRowData.DateInternal = datePart; // Update internal date
                currentEditingRowData.Subject = `📅 ${formattedDate} - ${value}`;
            } else if (colName === 'Color') {
                currentEditingRowData.Color = value;
            } else {
                currentEditingRowData[colName] = value;
            }

            // Find the table instance and re-render the row
            const tableInstance = allTableInstances[currentEditingTableId];
            if (tableInstance) {
                tableInstance.updateRowInTable(currentEditingRowData.id, currentEditingRowData);
                showValidationMessage("ডেটা সফলভাবে সেভ হয়েছে!");
            }

            inputEditModal.classList.remove('show-modal');
            setTimeout(() => inputEditModal.style.display = 'none', 300);

            // Clean up
            inputEditTextArea.value = '';
            delete inputEditTextArea.dataset.linkedDateInputId;
            if (inputEditTextArea._hasSubjectClickListener) {
                inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                inputEditTextArea._hasSubjectClickListener = false;
            }
            inputEditTextArea.type = 'textarea'; // Reset to default
            currentEditingRowData = null;
            currentEditingTableId = null;
        }
    };

    cancelInputBtn.onclick = () => {
        inputEditModal.classList.remove('show-modal');
        setTimeout(() => inputEditModal.style.display = 'none', 300);
        inputEditTextArea.value = '';
        delete inputEditTextArea.dataset.linkedDateInputId;
        if (inputEditTextArea._hasSubjectClickListener) {
            inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
            inputEditTextArea._hasSubjectClickListener = false;
        }
        inputEditTextArea.type = 'textarea'; // Reset to default
        currentEditingRowData = null;
        currentEditingTableId = null;
    };


    // --- Sections 7 & 8: Tables with an External Input Form ---
    // Using a map to store instances of table functions for easy access
    const allTableInstances = {};

    function initializeExternalFormTable(tableId, initialDataRows = [], isTeacherNotice = true) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        // Find the correct form container for this specific table's section
        const formContainer = document.getElementById(tableId).closest('.admin-section').querySelector('.input-form-container');
        const dateInput = formContainer.querySelector('.date-input');
        const subjectInput = formContainer.querySelector('textarea.subject-input');
        const colorInput = formContainer.querySelector('.color-input');
        const colorPreviewForm = formContainer.querySelector('.color-preview');
        const saveBtn = formContainer.querySelector('.save-btn');
        const cancelBtn = formContainer.querySelector('.cancel-btn');


        let dataRows = JSON.parse(JSON.stringify(initialDataRows)); // Deep copy to avoid reference issues
        let editingRowId = null; // Store ID of row currently in "Edit" mode within the table (not modal)

        // Store this instance's functions for external access (e.g., from modal save)
        allTableInstances[tableId] = {
            updateRowInTable: (id, newData) => {
                const index = dataRows.findIndex(r => r.id === id);
                if (index !== -1) {
                    dataRows[index] = { ...dataRows[index], ...newData };
                    editingRowId = null; // Exit editing mode for this row
                    renderTable();
                }
            },
            deleteRowFromTable: (id) => {
                dataRows = dataRows.filter(row => row.id !== id);
                renderTable();
            }
        };


        // Initialize form color preview
        if (colorInput && colorPreviewForm) {
            colorPreviewForm.style.backgroundColor = colorInput.value || '#000000'; // Default to black
            colorPreviewForm.style.borderColor = colorInput.value ? colorInput.value : '#000000';
            colorInput.addEventListener('input', () => {
                colorPreviewForm.style.backgroundColor = colorInput.value || '#000000';
                colorPreviewForm.style.borderColor = colorInput.value ? colorInput.value : '#000000';
            });
        }


        // Attach date picker to form's date input
        if (dateInput) {
            dateInput.addEventListener('click', () => {
                currentDatePickerInput = dateInput;
                const dateParts = dateInput.value.split('-'); // Expects DD-MM-YYYY
                if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
                    currentCalendarDate = new Date(dateParts[2], parseInt(dateParts[1]) - 1, dateParts[0]);
                } else {
                    currentCalendarDate = new Date();
                }

                populateDateSelects();
                generateCalendar();
                datePickerModal.style.display = 'flex';
                datePickerModal.classList.add('show-modal');
            });
        }


        function createEditableInput(colName, currentValue, rowId) {
            let inputElement;
            const wrapper = document.createElement('div');

            if (colName === 'Subject') {
                inputElement = document.createElement('textarea');
                inputElement.value = currentValue;
                inputElement.classList.add('textarea-input');
                inputElement.readOnly = true; // Force modal edit
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRowData = dataRows.find(d => d.id === rowId); // Find the actual data object
                    currentEditingTableId = tableId; // Store which table is being edited

                    const hiddenDateInput = document.getElementById(`hidden-date-${tableId}-${rowId}`);
                    if (hiddenDateInput) {
                        inputEditTextArea.dataset.linkedDateInputId = hiddenDateInput.id;
                        if (!inputEditTextArea._hasSubjectClickListener) {
                            inputEditTextArea.addEventListener('click', handleSubjectTextAreaClick);
                            inputEditTextArea._hasSubjectClickListener = true;
                        }
                    } else {
                        delete inputEditTextArea.dataset.linkedDateInputId;
                        if (inputEditTextArea._hasSubjectClickListener) {
                            inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                            inputEditTextArea._hasSubjectClickListener = false;
                        }
                    }
                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });

            } else if (colName === 'Color') {
                inputElement = document.createElement('input');
                inputElement.type = 'text'; // Display as text, but allow color picker via modal
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.classList.add('color-input-in-table');
                const colorPreviewDiv = document.createElement('div');
                colorPreviewDiv.classList.add('color-preview');
                colorPreviewDiv.style.backgroundColor = currentValue || 'transparent';
                colorPreviewDiv.style.borderColor = currentValue ? currentValue : '#ccc';
                wrapper.appendChild(colorPreviewDiv);
                wrapper.classList.add('color-with-preview');

                inputElement.addEventListener('click', () => {
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    inputEditTextArea.type = 'color'; // Temporarily change modal input type for color
                    currentEditingRowData = dataRows.find(d => d.id === rowId);
                    currentEditingTableId = tableId;

                    if (inputEditTextArea._hasSubjectClickListener) {
                        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                        inputEditTextArea._hasSubjectClickListener = false;
                    }
                    delete inputEditTextArea.dataset.linkedDateInputId;

                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });
            } else { // For any other text field in the table
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true; // Default for modal editing
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRowData = dataRows.find(d => d.id === rowId);
                    currentEditingTableId = tableId;

                    if (inputEditTextArea._hasSubjectClickListener) {
                        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                        inputEditTextArea._hasSubjectClickListener = false;
                    }
                    delete inputEditTextArea.dataset.linkedDateInputId;

                    inputEditModal.style.display = 'flex';
                    inputEditModal.classList.add('show-modal');
                });
            }
            wrapper.appendChild(inputElement);
            return wrapper;
        }


        function createTableRow(rowData = {}) {
            const row = document.createElement('tr');
            row.dataset.id = rowData.id;

            columnNames.forEach((colName) => {
                const cell = document.createElement('td');
                let value = rowData[colName] || '';

                if (colName === 'Action') {
                    const actionDiv = document.createElement('div');
                    actionDiv.classList.add('action-buttons');

                    const editBtn = document.createElement('button');
                    editBtn.classList.add('edit-btn');
                    editBtn.textContent = 'Edit';
                    editBtn.addEventListener('click', () => editRow(rowData.id));
                    actionDiv.appendChild(editBtn);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('delete-btn');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.addEventListener('click', () => deleteRow(rowData.id, tableId)); // Pass tableId to delete handler
                    actionDiv.appendChild(deleteBtn);

                    cell.appendChild(actionDiv);
                } else {
                    if (rowData.id === editingRowId) { // If this row is in table-level edit mode
                        let displayValue = value;
                        let hiddenDateVal = rowData.DateInternal || ''; // Use DateInternal for hidden date

                        if (colName === 'Subject') {
                            // Extract just the subject text from the combined string for editing
                            const match = value.match(/📅\s*(\d{1,2}(?:st|nd|rd|th)?\s*\w{3}\s*\d{4})\s*-\s*(.*)/);
                            if (match) {
                                displayValue = match[2].trim();
                            }
                        }

                        const inputWrapper = createEditableInput(colName, displayValue, rowData.id);
                        cell.appendChild(inputWrapper);

                        if (colName === 'Subject') {
                            const hiddenDateInput = document.createElement('input');
                            hiddenDateInput.type = 'hidden';
                            hiddenDateInput.classList.add('hidden-date-for-scrolling-notice');
                            hiddenDateInput.value = hiddenDateVal;
                            hiddenDateInput.id = `hidden-date-${tableId}-${rowData.id}`;
                            hiddenDateInput.dataset.rowId = rowData.id;
                            cell.appendChild(hiddenDateInput);
                        }

                    } else { // Display mode
                        if (colName === 'Color' && value) {
                            cell.textContent = value; // Show hex code
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

        function renderTable() {
            tbody.innerHTML = '';
            dataRows.forEach(rowData => {
                const row = createTableRow(rowData); // Always render based on data, edit mode handled internally
                tbody.appendChild(row);
            });
        }

        // Add a new entry from the external form
        function addEntry(date, subject, color) {
            const newId = Date.now() + Math.floor(Math.random() * 1000); // Simple unique ID
            const newRow = {
                id: newId,
                DateInternal: date, // Store raw date internally for editing
                Subject: `📅 ${formatDateForNotice(date)} - ${subject}`, // Formatted for display
                Color: color
            };
            dataRows.unshift(newRow); // Add to the beginning
            renderTable();
            showValidationMessage("নতুন ডেটা সফলভাবে যোগ হয়েছে!");
        }

        function editRow(idToEdit) {
            // Store original data before entering edit mode
            const originalData = JSON.parse(JSON.stringify(dataRows.find(d => d.id === idToEdit)));
            const rowElement = tbody.querySelector(`tr[data-id="${idToEdit}"]`);
            if (rowElement) {
                rowElement.dataset.originalData = JSON.stringify(originalData);
            }
            editingRowId = idToEdit;
            renderTable(); // Re-render the table to show the specific row in edit mode
        }

        // This function will be called directly when clicking "Save" inside the table row
        function saveRow(rowElement) {
            const rowId = parseInt(rowElement.dataset.id);
            const index = dataRows.findIndex(r => r.id === rowId);

            if (index !== -1) {
                const updatedData = { id: rowId }; // Start with ID
                let isValid = true;
                let validationMessageText = '';

                rowElement.querySelectorAll('td').forEach((cell, i) => {
                    const colName = columnNames[i];
                    if (colName !== 'Action') {
                        if (colName === 'Subject') {
                            const textareaInput = cell.querySelector('.textarea-input');
                            const hiddenDateInput = cell.querySelector('.hidden-date-for-scrolling-notice');
                            const subjectText = textareaInput ? textareaInput.value.trim() : '';
                            const dateFromHidden = hiddenDateInput ? hiddenDateInput.value.trim() : '';

                            if (!dateFromHidden || !subjectText) {
                                isValid = false;
                                validationMessageText = "তারিখ এবং বিষয় ফিল্ডগুলো পূরণ করতে হবে।";
                                return; // Stop processing this cell
                            }
                            updatedData.DateInternal = dateFromHidden; // Update internal date
                            updatedData.Subject = `📅 ${formatDateForNotice(dateFromHidden)} - ${subjectText}`;
                        } else if (colName === 'Color') {
                            const colorInput = cell.querySelector('input.color-input-in-table');
                            updatedData.Color = colorInput ? colorInput.value.trim() : '';
                        }
                        // Other columns would be handled here if they were editable directly in the table
                    }
                });

                if (!isValid) {
                    showValidationMessage(validationMessageText);
                    return;
                }

                dataRows[index] = { ...dataRows[index], ...updatedData }; // Merge updated data
                editingRowId = null; // Exit editing mode
                renderTable(); // Re-render the table
                showValidationMessage("সফলভাবে সেভ হয়েছে!");
            }
        }

        // This function will be called directly when clicking "Cancel" inside the table row
        function cancelEdit(rowElement) {
            const originalData = JSON.parse(rowElement.dataset.originalData);
            const rowId = parseInt(rowElement.dataset.id);
            const index = dataRows.findIndex(r => r.id === rowId);

            if (index !== -1) {
                dataRows[index] = originalData; // Restore original data
                editingRowId = null; // Exit editing mode
                renderTable();
                showValidationMessage("সম্পাদনা বাতিল করা হয়েছে।");
            }
        }

        function deleteRow(idToDelete, tableId) {
            const deleteConfirmModal = (tableId === 'table-scrolling-notice-teachers') ? deleteConfirmModalSection7 : deleteConfirmModalSection8;
            const confirmDeleteBtn = (tableId === 'table-scrolling-notice-teachers') ? confirmDeleteBtnSection7 : confirmDeleteBtnSection8;
            const cancelDeleteBtn = (tableId === 'table-scrolling-notice-teachers') ? cancelDeleteBtnSection7 : cancelDeleteBtnSection8;

            deleteConfirmModal.dataset.rowToDeleteId = idToDelete;
            deleteConfirmModal.style.display = 'flex';
            deleteConfirmModal.classList.add('show-modal');

            // Clear previous listeners to avoid multiple executions
            confirmDeleteBtn.onclick = null;
            cancelDeleteBtn.onclick = null;

            confirmDeleteBtn.onclick = () => {
                const id = parseInt(deleteConfirmModal.dataset.rowToDeleteId);
                dataRows = dataRows.filter(row => row.id !== id);
                renderTable();
                showValidationMessage("রো সফলভাবে মুছে ফেলা হয়েছে!");
                deleteConfirmModal.classList.remove('show-modal');
                setTimeout(() => deleteConfirmModal.style.display = 'none', 300);
                delete deleteConfirmModal.dataset.rowToDeleteId;
            };

            cancelDeleteBtn.onclick = () => {
                deleteConfirmModal.classList.remove('show-modal');
                setTimeout(() => deleteConfirmModal.style.display = 'none', 300);
                delete deleteConfirmModal.dataset.rowToDeleteId;
            };
        }


        // Event Listeners for the external form (Add/Save/Cancel)
        if (saveBtn) {
            saveBtn.textContent = 'Add';
            saveBtn.onclick = () => {
                const dateVal = dateInput.value.trim();
                const subjectVal = subjectInput.value.trim();
                const colorVal = colorInput.value.trim();

                if (!dateVal || !subjectVal) {
                    showValidationMessage("তারিখ এবং বিষয় ফিল্ডগুলো পূরণ করতে হবে।");
                    return;
                }
                addEntry(dateVal, subjectVal, colorVal);
                // Clear the form fields after adding
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '#000000'; // Reset to a default color
                if (colorPreviewForm) {
                    colorPreviewForm.style.backgroundColor = '#000000';
                    colorPreviewForm.style.borderColor = '#000000';
                }
            };
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '#000000';
                if (colorPreviewForm) {
                    colorPreviewForm.style.backgroundColor = '#000000';
                    colorPreviewForm.style.borderColor = '#000000';
                }
            });
        }

        // Initial render for this specific table
        renderTable();
    }


    // --- Initialize Section 7: Scrolling Notice for Teachers ---
    // Example Data (you can load from localStorage or server here)
    const teacherNoticeData = [
        { id: 1, DateInternal: '01-07-2025', Subject: '📅 1st Jul 2025 - Teachers Meeting on new syllabus.', Color: '#ff5722' },
        { id: 2, DateInternal: '15-07-2025', Subject: '📅 15th Jul 2025 - Project submission deadline.', Color: '#4caf50' },
    ];
    initializeExternalFormTable('table-scrolling-notice-teachers', teacherNoticeData, true);


    // --- Initialize Section 8: Scrolling Notice for Students ---
    // Example Data (you can load from localStorage or server here)
    const studentNoticeData = [
        { id: 101, DateInternal: '05-07-2025', Subject: '📅 5th Jul 2025 - Holiday for Eid.', Color: '#2196f3' },
        { id: 102, DateInternal: '20-07-2025', Subject: '📅 20th Jul 2025 - Annual sports competition.', Color: '#9c27b0' },
    ];
    initializeExternalFormTable('table-scrolling-notice-students', studentNoticeData, false);

    // Common close modal button logic for all modals
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.table-modal-overlay').classList.remove('show-modal');
            setTimeout(() => btn.closest('.table-modal-overlay').style.display = 'none', 300);

            // Also reset current editing states if a modal is closed via X
            inputEditTextArea.value = '';
            delete inputEditTextArea.dataset.linkedDateInputId;
            if (inputEditTextArea._hasSubjectClickListener) {
                inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                inputEditTextArea._hasSubjectClickListener = false;
            }
            inputEditTextArea.type = 'textarea';
            currentEditingRowData = null;
            currentEditingTableId = null;
        });
    });

}); // End of DOMContentLoaded
