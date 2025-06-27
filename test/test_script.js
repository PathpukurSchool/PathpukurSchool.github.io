
document.addEventListener('DOMContentLoaded', () => {
    // নিশ্চিত করুন যে সব মোডাল প্রাথমিকভাবে লুকানো আছে
    document.querySelectorAll('.table-modal-overlay').forEach(modal => {
        modal.style.display = 'none';
    });

    // --- Common Modals and Utility Functions (Global) ---
    const validationModal = document.getElementById('validationModal');
    const validationMessage = document.getElementById('validationMessage');
    const inputEditModal = document.getElementById('inputEditModal');
    const inputEditTextArea = document.getElementById('inputEditTextArea');
    const inputEditModalHeading = document.getElementById('inputEditModalHeading');
    const storeInputBtn = document.getElementById('storeInputBtn');
    const cancelInputBtn = document.getElementById('cancelInputBtn');

    // Date Picker Modals (assuming these are global and shared)
    const datePickerModal = document.getElementById('datePickerModal'); // Make sure you have this ID in your HTML
    const dateSelectDay = document.getElementById('dateSelectDay');
    const dateSelectMonth = document.getElementById('dateSelectMonth');
    const dateSelectYear = document.getElementById('dateSelectYear');
    const calendarBody = document.getElementById('calendarBody');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');
    const cancelDateBtn = document.getElementById('cancelDateBtn');
    const okDateBtn = document.getElementById('okDateBtn');

    let currentDatePickerInput = null; // Stores the input field that needs date
    let currentCalendarDate = new Date(); // Date for the calendar view

    // --- Utility Functions (Shared across all sections) ---
    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    // Function to get contrast color for text (white or black)
    function getContrastYIQ(hexcolor) {
        if (!hexcolor || hexcolor.length < 6) return 'black';
        const r = parseInt(hexcolor.substr(1, 2), 16);
        const g = parseInt(hexcolor.substr(3, 2), 16);
        const b = parseInt(hexcolor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }

    // Date Picker Functions (Adapted from your previous code)
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

        document.getElementById('currentMonthYear').textContent =
            `${new Date(year, month).toLocaleString('en-US', { month: 'long' })} ${year}`;

        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 weeks
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) { // 7 days a week
                const cell = document.createElement('td');
                if (i === 0 && j < firstDay) {
                    // Empty cells before the first day of the month
                    cell.textContent = '';
                } else if (date > daysInMonth) {
                    // Empty cells after the last day of the month
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    const fullDate = new Date(year, month, date);
                    if (currentDatePickerInput && currentDatePickerInput.value === fullDate.toLocaleDateString('en-CA').replace(/\//g, '-')) {
                        cell.classList.add('selected-date');
                    }
                    cell.addEventListener('click', () => {
                        const day = String(cell.textContent).padStart(2, '0');
                        const monthVal = String(month + 1).padStart(2, '0');
                        const yearVal = year;
                        if (currentDatePickerInput) {
                            currentDatePickerInput.value = `${day}-${monthVal}-${yearVal}`;
                        }
                        datePickerModal.style.display = 'none';
                    });
                    date++;
                }
                row.appendChild(cell);
            }
            calendarBody.appendChild(row);
            if (date > daysInMonth) break; // Stop generating rows if all dates are placed
        }
    }

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
        datePickerModal.style.display = 'none';
        currentDatePickerInput = null;
    });

    okDateBtn.addEventListener('click', () => {
        // This is primarily for visual selection, actual input update happens on cell click
        // If nothing was selected, but OK is pressed, we might want to default to today or current input value
        if (currentDatePickerInput && !currentDatePickerInput.value) {
             const today = new Date();
             const day = String(today.getDate()).padStart(2, '0');
             const month = String(today.getMonth() + 1).padStart(2, '0');
             const year = today.getFullYear();
             currentDatePickerInput.value = `${day}-${month}-${year}`;
        }
        datePickerModal.style.display = 'none';
    });


    // Global variable to keep track of the row being edited in the modal
    let currentEditingRow = null;
    let currentEditingColIndex = -1;

    // --- Store/Cancel Input from Modal (Shared) ---
    storeInputBtn.onclick = () => {
        if (currentEditingRow && currentEditingColIndex !== -1) {
            const value = inputEditTextArea.value.trim();
            const cell = currentEditingRow.children[currentEditingColIndex];
            const inputElement = cell.querySelector('input, textarea'); // Can be input or textarea

            if (inputElement) {
                inputElement.value = value;
                // If it's a color input, update its preview
                if (inputElement.classList.contains('color-input')) {
                    const colorPreview = cell.querySelector('.color-preview');
                    if (colorPreview) {
                        colorPreview.style.backgroundColor = value || 'transparent';
                        colorPreview.style.borderColor = value ? value : '#ccc';
                    }
                }
            }
            inputEditModal.style.display = 'none';
            inputEditTextArea.value = '';
            // If the subject textarea was edited, update its linked date input as well
            if (inputEditTextArea.dataset.linkedDateInputId) {
                const hiddenDateInput = document.getElementById(inputEditTextArea.dataset.linkedDateInputId);
                if (hiddenDateInput) {
                    // You might need to update the date format if the user types a new date here
                    // For now, it just updates the subject text. Date is only changed via date picker.
                }
                delete inputEditTextArea.dataset.linkedDateInputId; // Clean up
                inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
            }
            currentEditingRow = null;
            currentEditingColIndex = -1;
        }
    };

    cancelInputBtn.onclick = () => {
        inputEditModal.style.display = 'none';
        inputEditTextArea.value = '';
        delete inputEditTextArea.dataset.linkedDateInputId; // Clean up
        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
        currentEditingRow = null;
        currentEditingColIndex = -1;
    };


    // --- Section 1: Exam Link for Teachers --- (Previous code, kept for context)
    const tableExamLinkTeacher = document.getElementById('table-exam-link-teacher');
    const tbodyExamLinkTeacher = tableExamLinkTeacher.querySelector('tbody');
    const paginationExamLinkTeacher = document.getElementById('pagination-exam-link-teacher');
    const clearConfirmModalSection1 = document.getElementById('clearConfirmModalSection1');
    const confirmClearBtnSection1 = document.getElementById('confirmClearBtnSection1');
    const cancelClearBtnSection1 = document.getElementById('cancelClearBtnSection1');

    let allDataRowsSection1 = [ /* ... initial data ... */ ]; // Placeholder, populate as needed
    // Example:
    const classes = [
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ];
    allDataRowsSection1 = classes.map(cls => ({
        Class: cls,
        ID: '',
        Password: '',
        URL: ''
    }));

    const columnNamesSection1 = ["Class", "ID", "Password", "URL", "Action"];
    const rowsPerPageSection1 = 10;
    let currentPageSection1 = 1;

    function createEditableInputSection1(colName, value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.readOnly = true;

        input.addEventListener('click', () => {
            inputEditModalHeading.textContent = `Edit ${colName}`;
            inputEditTextArea.value = input.value;
            currentEditingRow = input.closest('tr');
            currentEditingColIndex = columnNamesSection1.indexOf(colName);
            inputEditModal.style.display = 'flex';
        });
        return input;
    }

    function createTableRowSection1(rowData, isEditing = false) {
        const row = document.createElement('tr');
        if (isEditing) row.classList.add('editing');

        columnNamesSection1.forEach(col => {
            const cell = document.createElement('td');
            if (col === "Class") {
                cell.textContent = rowData.Class;
                cell.classList.add('fixed-column');
            } else if (col === "Action") {
                const div = document.createElement('div');
                div.classList.add('action-buttons');
                if (isEditing) {
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'save-btn';
                    saveBtn.textContent = 'Save';
                    saveBtn.onclick = () => saveRowSection1(row);
                    div.appendChild(saveBtn);
                    const cancelBtn = document.createElement('button');
                    cancelBtn.className = 'cancel-btn';
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.onclick = () => renderTableSection1();
                    div.appendChild(cancelBtn);
                } else {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-btn';
                    editBtn.textContent = 'Edit';
                    editBtn.onclick = () => renderTableSection1(true, rowData.Class);
                    div.appendChild(editBtn);
                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-btn';
                    clearBtn.textContent = 'Clear';
                    clearBtn.onclick = () => {
                        const target = allDataRowsSection1.find(r => r.Class === rowData.Class);
                        if (!target.ID && !target.Password && !target.URL) {
                            showValidationMessage("এই রো-তে কোনও ডেটা নেই, তাই ক্লিয়ার করা যাবে না!");
                            return;
                        }
                        // Use a specific variable for this section's clear context if `rowToClear` is global
                        // Or pass rowData directly if confirmClearBtnSection1's handler is scoped
                        clearConfirmModalSection1.dataset.rowToClearId = rowData.Class; // Store ID for lookup
                        clearConfirmModalSection1.style.display = 'flex';
                    };
                    div.appendChild(clearBtn);
                }
                cell.appendChild(div);
            } else {
                if (isEditing) {
                    const input = createEditableInputSection1(col, rowData[col]);
                    cell.appendChild(input);
                } else {
                    cell.textContent = rowData[col];
                }
            }
            row.appendChild(cell);
        });
        return row;
    }

    function saveRowSection1(row) {
        const className = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');
        const updated = {};
        inputs.forEach((input, i) => {
            updated[columnNamesSection1[i + 1]] = input.value.trim();
        });

        if (!updated.ID || !updated.Password || !updated.URL) {
            showValidationMessage(`Class: ${className}\nID, Password ও URL ফিল্ডগুলো পূরণ করতে হবে।`);
            return;
        }

        const index = allDataRowsSection1.findIndex(d => d.Class === className);
        if (index !== -1) {
            allDataRowsSection1[index] = { Class: className, ...updated };
            showValidationMessage("সফলভাবে সেভ হয়েছে!");
        }
        renderTableSection1();
    }

    function renderTableSection1(isEditing = false, editClass = "") {
        tbodyExamLinkTeacher.innerHTML = "";
        const start = (currentPageSection1 - 1) * rowsPerPageSection1;
        const end = start + rowsPerPageSection1;
        allDataRowsSection1.slice(start, end).forEach(rowData => {
            const editMode = isEditing && rowData.Class === editClass;
            const row = createTableRowSection1(rowData, editMode);
            tbodyExamLinkTeacher.appendChild(row);
        });
        renderPaginationSection1();
    }

    function renderPaginationSection1() {
        paginationExamLinkTeacher.innerHTML = "";
        const totalPages = Math.ceil(allDataRowsSection1.length / rowsPerPageSection1);
        const prevBtn = document.createElement('button');
        prevBtn.textContent = "Previous";
        prevBtn.disabled = currentPageSection1 === 1;
        prevBtn.onclick = () => { currentPageSection1--; renderTableSection1(); };
        paginationExamLinkTeacher.appendChild(prevBtn);
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === currentPageSection1) pageBtn.style.fontWeight = "bold";
            pageBtn.onclick = () => { currentPageSection1 = i; renderTableSection1(); };
            paginationExamLinkTeacher.appendChild(pageBtn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.textContent = "Next";
        nextBtn.disabled = currentPageSection1 === totalPages;
        nextBtn.onclick = () => { currentPageSection1++; renderTableSection1(); };
        paginationExamLinkTeacher.appendChild(nextBtn);
    }

    confirmClearBtnSection1.onclick = () => {
        const classIdToClear = clearConfirmModalSection1.dataset.rowToClearId;
        if (classIdToClear) {
            const rowToClear = allDataRowsSection1.find(r => r.Class === classIdToClear);
            if (rowToClear) {
                rowToClear.ID = "";
                rowToClear.Password = "";
                rowToClear.URL = "";
                renderTableSection1();
                showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            }
        }
        clearConfirmModalSection1.style.display = 'none';
        delete clearConfirmModalSection1.dataset.rowToClearId;
    };

    cancelClearBtnSection1.onclick = () => {
        clearConfirmModalSection1.style.display = 'none';
        delete clearConfirmModalSection1.dataset.rowToClearId;
    };
    renderTableSection1();

    // --- Section 2: Link for Students --- (Previous code, kept for context)
    const studentTable = document.getElementById('table-link-student');
    const studentTbody = studentTable.querySelector('tbody');
    const studentPagination = document.getElementById('pagination-link-student');
    const clearConfirmModalSection2 = document.getElementById('clearConfirmModalSection2');
    const confirmClearBtnSection2 = document.getElementById('confirmClearBtnSection2');
    const cancelClearBtnSection2 = document.getElementById('cancelClearBtnSection2');

    let studentDataRows = [ /* ... initial data ... */ ]; // Placeholder
    // Example:
    const studentClasses = [
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ];
    studentDataRows = studentClasses.map(cls => ({
        Class: cls,
        Student_URL: ""
    }));

    const studentColumnNames = ["Class", "Student_URL", "Action"];
    const studentRowsPerPage = 10;
    let studentCurrentPage = 1;

    function renderStudentTable(isEditing = false, editClass = "") {
        studentTbody.innerHTML = "";
        const start = (studentCurrentPage - 1) * studentRowsPerPage;
        const end = start + studentRowsPerPage;

        studentDataRows.slice(start, end).forEach(rowData => {
            const row = document.createElement('tr');
            if (isEditing && rowData.Class === editClass) row.classList.add('editing');

            studentColumnNames.forEach(col => {
                const cell = document.createElement('td');
                if (col === "Class") {
                    cell.textContent = rowData.Class;
                    cell.classList.add('fixed-column');
                } else if (col === "Action") {
                    const div = document.createElement('div');
                    div.classList.add('action-buttons');
                    if (isEditing && rowData.Class === editClass) {
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'save-btn';
                        saveBtn.textContent = 'Save';
                        saveBtn.onclick = () => saveStudentRow(row);
                        div.appendChild(saveBtn);
                        const cancelBtn = document.createElement('button');
                        cancelBtn.className = 'cancel-btn';
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.onclick = () => renderStudentTable();
                        div.appendChild(cancelBtn);
                    } else {
                        const editBtn = document.createElement('button');
                        editBtn.className = 'edit-btn';
                        editBtn.textContent = 'Edit';
                        editBtn.onclick = () => renderStudentTable(true, rowData.Class);
                        div.appendChild(editBtn);
                        const clearBtn = document.createElement('button');
                        clearBtn.className = 'clear-btn';
                        clearBtn.textContent = 'Clear';
                        clearBtn.onclick = () => {
                            const target = studentDataRows.find(r => r.Class === rowData.Class);
                            if (!target.Student_URL) {
                                showValidationMessage("এই রো-তে কোনও URL নেই, তাই ক্লিয়ার করা যাবে না!");
                                return;
                            }
                            clearConfirmModalSection2.dataset.rowToClearId = rowData.Class;
                            clearConfirmModalSection2.style.display = 'flex';
                        };
                        div.appendChild(clearBtn);
                    }
                    cell.appendChild(div);
                } else {
                    if (isEditing && rowData.Class === editClass) {
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = rowData[col];
                        input.readOnly = true;
                        input.addEventListener('click', () => {
                            inputEditModalHeading.textContent = `Edit ${col}`;
                            inputEditTextArea.value = input.value;
                            currentEditingRow = input.closest('tr');
                            currentEditingColIndex = studentColumnNames.indexOf(col);
                            inputEditModal.style.display = 'flex';
                        });
                        cell.appendChild(input);
                    } else {
                        cell.textContent = rowData[col];
                    }
                }
                row.appendChild(cell);
            });
            studentTbody.appendChild(row);
        });
        renderStudentPagination();
    }

    function renderStudentPagination() {
        studentPagination.innerHTML = "";
        const totalPages = Math.ceil(studentDataRows.length / studentRowsPerPage);
        const prevBtn = document.createElement('button');
        prevBtn.textContent = "Previous";
        prevBtn.disabled = studentCurrentPage === 1;
        prevBtn.onclick = () => { studentCurrentPage--; renderStudentTable(); };
        studentPagination.appendChild(prevBtn);
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === studentCurrentPage) pageBtn.style.fontWeight = "bold";
            pageBtn.onclick = () => { studentCurrentPage = i; renderStudentTable(); };
            studentPagination.appendChild(pageBtn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.textContent = "Next";
        nextBtn.disabled = studentCurrentPage === totalPages;
        nextBtn.onclick = () => { studentCurrentPage++; renderStudentTable(); };
        studentPagination.appendChild(nextBtn);
    }

    function saveStudentRow(row) {
        const className = row.querySelector('td').textContent;
        const input = row.querySelector('input');
        const url = input.value.trim();

        if (!url) {
            showValidationMessage(`Class: ${className} এর URL ফাঁকা রাখা যাবে না।`);
            return;
        }
        const index = studentDataRows.findIndex(r => r.Class === className);
        if (index !== -1) {
            studentDataRows[index].Student_URL = url;
            showValidationMessage("সফলভাবে সেভ হয়েছে!");
        }
        renderStudentTable();
    }

    confirmClearBtnSection2.onclick = () => {
        const classIdToClear = clearConfirmModalSection2.dataset.rowToClearId;
        if (classIdToClear) {
            const rowToClear = studentDataRows.find(r => r.Class === classIdToClear);
            if (rowToClear) {
                rowToClear.Student_URL = "";
                showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            } else {
                showValidationMessage("ক্লিয়ার করার জন্য রো খুঁজে পাওয়া যায়নি!");
            }
            renderStudentTable();
        }
        clearConfirmModalSection2.style.display = 'none';
        delete clearConfirmModalSection2.dataset.rowToClearId;
    };

    cancelClearBtnSection2.onclick = () => {
        clearConfirmModalSection2.style.display = 'none';
        delete clearConfirmModalSection2.dataset.rowToClearId;
    };
    renderStudentTable();

    // --- Section 3: Marks Submission Date for Teachers --- (Previous code, kept for context)
    const marksTable = document.getElementById('table-marks-submission');
    const marksTbody = marksTable.querySelector('tbody');
    const marksPagination = document.getElementById('pagination-marks-submission');
    const clearConfirmModalSection3 = document.getElementById('clearConfirmModalSection3');
    const confirmClearBtnSection3 = document.getElementById('confirmClearBtnSection3');
    const cancelClearBtnSection3 = document.getElementById('cancelClearBtnSection3');

    let marksDataRows = [ /* ... initial data ... */ ]; // Placeholder
    // Example:
    const examList = [
        "1st Exam", "2nd Exam", "X Test", "3rd Exam",
        "XI Semester I", "XI Semester II", "XII Test"
    ];
    marksDataRows = examList.map(exam => ({
        Exam: exam,
        Date: "",
        Color: ""
    }));

    const marksColumnNames = ["Exam", "Date", "Color", "Action"];
    const marksRowsPerPage = 10;
    let marksCurrentPage = 1;

    function renderMarksTable(isEditing = false, editExam = "") {
        marksTbody.innerHTML = "";
        const start = (marksCurrentPage - 1) * marksRowsPerPage;
        const end = start + marksRowsPerPage;

        marksDataRows.slice(start, end).forEach(rowData => {
            const row = document.createElement('tr');
            if (isEditing && rowData.Exam === editExam) row.classList.add('editing');

            marksColumnNames.forEach(col => {
                const cell = document.createElement('td');
                if (col === "Exam") {
                    cell.textContent = rowData.Exam;
                    cell.classList.add('fixed-column');
                } else if (col === "Action") {
                    const div = document.createElement('div');
                    div.classList.add('action-buttons');
                    if (isEditing && rowData.Exam === editExam) {
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'save-btn';
                        saveBtn.textContent = 'Save';
                        saveBtn.onclick = () => saveMarksRow(row);
                        div.appendChild(saveBtn);
                        const cancelBtn = document.createElement('button');
                        cancelBtn.className = 'cancel-btn';
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.onclick = () => renderMarksTable();
                        div.appendChild(cancelBtn);
                    } else {
                        const editBtn = document.createElement('button');
                        editBtn.className = 'edit-btn';
                        editBtn.textContent = 'Edit';
                        editBtn.onclick = () => renderMarksTable(true, rowData.Exam);
                        div.appendChild(editBtn);
                        const clearBtn = document.createElement('button');
                        clearBtn.className = 'clear-btn';
                        clearBtn.textContent = 'Clear';
                        clearBtn.onclick = () => {
                            const target = marksDataRows.find(r => r.Exam === rowData.Exam);
                            if (!target.Date && !target.Color) {
                                showValidationMessage("এই রো-তে কোনও তথ্য নেই, তাই ক্লিয়ার করা যাবে না!");
                                return;
                            }
                            clearConfirmModalSection3.dataset.rowToClearId = rowData.Exam;
                            clearConfirmModalSection3.style.display = 'flex';
                        };
                        div.appendChild(clearBtn);
                    }
                    cell.appendChild(div);
                } else {
                    if (isEditing && rowData.Exam === editExam) {
                        const input = document.createElement('input');
                        input.value = rowData[col];
                        input.readOnly = false; // Allow direct typing for Date/Color in this section's table cell

                        if (col === "Date") {
                            input.type = 'date'; // Use native date input for simplicity here, or integrate date picker.
                            input.addEventListener('click', () => {
                                // For date, you might want to open the date picker modal
                                currentDatePickerInput = input;
                                populateDateSelects();
                                generateCalendar();
                                datePickerModal.style.display = 'flex';
                            });
                        }
                        if (col === "Color") {
                            input.type = 'color';
                            // Add a preview div next to the color input
                            const colorInputWrapper = document.createElement('div');
                            colorInputWrapper.style.display = 'flex';
                            colorInputWrapper.style.alignItems = 'center';
                            colorInputWrapper.style.gap = '5px';
                            const colorPreviewDiv = document.createElement('div');
                            colorPreviewDiv.classList.add('color-preview-inline'); // New class for inline preview
                            colorPreviewDiv.style.backgroundColor = input.value || 'transparent';
                            colorPreviewDiv.style.borderColor = input.value ? input.value : '#ccc';
                            input.addEventListener('input', () => { // Use 'input' for real-time update
                                colorPreviewDiv.style.backgroundColor = input.value || 'transparent';
                                colorPreviewDiv.style.borderColor = input.value ? input.value : '#ccc';
                            });
                            colorInputWrapper.appendChild(input);
                            colorInputWrapper.appendChild(colorPreviewDiv);
                            cell.appendChild(colorInputWrapper);
                        } else {
                            cell.appendChild(input);
                        }
                    } else {
                        if (col === 'Color' && value) {
                            cell.textContent = value;
                            cell.style.backgroundColor = value;
                            cell.style.color = getContrastYIQ(value);
                        } else {
                            cell.textContent = rowData[col];
                        }
                    }
                }
                row.appendChild(cell);
            });
            marksTbody.appendChild(row);
        });
        renderMarksPagination();
    }

    function renderMarksPagination() {
        marksPagination.innerHTML = "";
        const totalPages = Math.ceil(marksDataRows.length / marksRowsPerPage);
        const prevBtn = document.createElement('button');
        prevBtn.textContent = "Previous";
        prevBtn.disabled = marksCurrentPage === 1;
        prevBtn.onclick = () => { marksCurrentPage--; renderMarksTable(); };
        marksPagination.appendChild(prevBtn);
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === marksCurrentPage) pageBtn.style.fontWeight = "bold";
            pageBtn.onclick = () => { marksCurrentPage = i; renderMarksTable(); };
            marksPagination.appendChild(pageBtn);
        }
        const nextBtn = document.createElement('button');
        nextBtn.textContent = "Next";
        nextBtn.disabled = marksCurrentPage === totalPages;
        nextBtn.onclick = () => { marksCurrentPage++; renderMarksTable(); };
        marksPagination.appendChild(nextBtn);
    }

    function saveMarksRow(row) {
        const exam = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');
        const date = inputs[0] ? inputs[0].value.trim() : '';
        const color = inputs[1] ? inputs[1].value.trim() : '';

        if (!date) {
            showValidationMessage(`Exam: ${exam} এর Date ফাঁকা রাখা যাবে না।`);
            return;
        }
        const index = marksDataRows.findIndex(r => r.Exam === exam);
        if (index !== -1) {
            marksDataRows[index].Date = date;
            marksDataRows[index].Color = color;
            showValidationMessage("সফলভাবে সেভ হয়েছে!");
        }
        renderMarksTable();
    }

    confirmClearBtnSection3.onclick = () => {
        const examToClear = clearConfirmModalSection3.dataset.rowToClearId;
        if (examToClear) {
            const rowToClear = marksDataRows.find(r => r.Exam === examToClear);
            if (rowToClear) {
                rowToClear.Date = "";
                rowToClear.Color = "";
                renderMarksTable();
                showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            }
        }
        clearConfirmModalSection3.style.display = 'none';
        delete clearConfirmModalSection3.dataset.rowToClearId;
    };

    cancelClearBtnSection3.onclick = () => {
        clearConfirmModalSection3.style.display = 'none';
        delete clearConfirmModalSection3.dataset.rowToClearId;
    };
    renderMarksTable();


    // --- Sections 7 & 8: Tables with an External Input Form ---
    // Scrolling Notice for Teachers, Scrolling Notice for Students

    // Shared Date Picker logic for form inputs (global scope)
    const datePickerModal = document.getElementById('datePickerModal'); // Ensure this modal exists in HTML
    const dateSelectDay = document.getElementById('dateSelectDay'); // Example ID, check your HTML
    const dateSelectMonth = document.getElementById('dateSelectMonth');
    const dateSelectYear = document.getElementById('dateSelectYear');
    const calendarBody = document.getElementById('calendarBody');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');
    const cancelDateBtn = document.getElementById('cancelDateBtn');
    const okDateBtn = document.getElementById('okDateBtn');


    // Global variable to hold the input element that triggered the date picker
    let currentDatePickerInput = null;
    let currentCalendarDate = new Date(); // Stores the current date displayed in the calendar


    // Helper for handling click on Subject textarea in the modal (defined globally)
    function handleSubjectTextAreaClick() {
        if (inputEditTextArea.dataset.linkedDateInputId) {
            const hiddenDateInput = document.getElementById(inputEditTextArea.dataset.linkedDateInputId);
            if (hiddenDateInput) {
                // If there's a date in the hidden input, set it to the date picker
                const dateParts = hiddenDateInput.value.split('-'); // Format: DD-MM-YYYY
                if (dateParts.length === 3) {
                    currentCalendarDate = new Date(dateParts[2], parseInt(dateParts[1]) - 1, dateParts[0]);
                } else {
                    currentCalendarDate = new Date(); // Default to today if no valid date
                }
                currentDatePickerInput = hiddenDateInput; // Set the hidden input as the target
                populateDateSelects();
                generateCalendar();
                datePickerModal.style.display = 'flex';
            }
        }
    }


    function initializeExternalFormTable(tableId, initialDataRows = [], isTeacherNotice = true) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const headerCells = Array.from(table.querySelector('thead tr').children);
        const columnNames = headerCells.map(th => th.textContent.trim());

        // Find the correct form container for this specific table's section
        const formContainer = document.getElementById(tableId).closest('.admin-section').querySelector('.input-form-container');
        const dateInput = formContainer.querySelector('.date-input');
        const subjectInput = formContainer.querySelector('textarea.subject-input'); // Added specific class
        const colorInput = formContainer.querySelector('.color-input');
        const colorPreviewForm = formContainer.querySelector('.color-preview');
        const saveBtn = formContainer.querySelector('.save-btn');
        const cancelBtn = formContainer.querySelector('.cancel-btn');
        const addBtn = formContainer.querySelector('.add-btn'); // Add button to add new rows


        let dataRows = [...initialDataRows]; // Private data for this table instance
        let editingRowId = null; // Store ID of row being edited (for update/cancel)

        // Initialize form color preview
        if (colorInput && colorPreviewForm) {
            colorPreviewForm.style.backgroundColor = colorInput.value || 'transparent';
            colorPreviewForm.style.borderColor = colorInput.value ? colorInput.value : '#ccc';
            colorInput.addEventListener('input', () => {
                colorPreviewForm.style.backgroundColor = colorInput.value || 'transparent';
                colorPreviewForm.style.borderColor = colorInput.value ? colorInput.value : '#ccc';
            });
        }


        // Attach date picker to form's date input
        if (dateInput) {
            dateInput.addEventListener('click', () => {
                currentDatePickerInput = dateInput;
                // If there's already a date in the input, set calendar to that date
                const dateParts = dateInput.value.split('-'); // Expects DD-MM-YYYY
                if (dateParts.length === 3) {
                    currentCalendarDate = new Date(dateParts[2], parseInt(dateParts[1]) - 1, dateParts[0]);
                } else {
                    currentCalendarDate = new Date();
                }

                populateDateSelects();
                generateCalendar();
                datePickerModal.style.display = 'flex';
            });
        }


        function createEditableInput(colName, currentValue, rowId) {
            let inputElement;
            const wrapper = document.createElement('div');

            if (colName === 'Subject') {
                inputElement = document.createElement('textarea');
                inputElement.value = currentValue;
                inputElement.classList.add('textarea-input');
                inputElement.readOnly = true;
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);

                    // Link the Subject textarea in the modal to the hidden date input for this row
                    const hiddenDateInput = currentEditingRow.querySelector(`.hidden-date-for-scrolling-notice[data-row-id="${rowId}"]`);
                    if (hiddenDateInput) {
                        inputEditTextArea.dataset.linkedDateInputId = hiddenDateInput.id;
                        // Attach event listener only if not already attached
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
                });

            } else if (colName === 'Color') {
                inputElement = document.createElement('input');
                inputElement.type = 'text'; // Display as text, but allow color picker via modal
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.classList.add('color-input-in-table'); // Differentiate from form color input

                const colorPreviewDiv = document.createElement('div');
                colorPreviewDiv.classList.add('color-preview');
                colorPreviewDiv.style.backgroundColor = currentValue || 'transparent';
                colorPreviewDiv.style.borderColor = currentValue ? currentValue : '#ccc';
                wrapper.appendChild(colorPreviewDiv);
                wrapper.classList.add('color-with-preview');

                inputElement.addEventListener('click', () => {
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    inputEditTextArea.type = 'color'; // Change modal input type for color
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);

                    // Remove existing event listener if any
                    if (inputEditTextArea._hasSubjectClickListener) {
                        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                        inputEditTextArea._hasSubjectClickListener = false;
                    }

                    inputEditModal.style.display = 'flex';
                });
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.value = currentValue;
                inputElement.readOnly = true;
                inputElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    inputEditModalHeading.textContent = `Edit ${colName}`;
                    inputEditTextArea.value = inputElement.value;
                    currentEditingRow = inputElement.closest('tr');
                    currentEditingColIndex = columnNames.indexOf(colName);
                    // Remove existing event listener if any
                    if (inputEditTextArea._hasSubjectClickListener) {
                        inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                        inputEditTextArea._hasSubjectClickListener = false;
                    }
                    inputEditModal.style.display = 'flex';
                });
            }
            wrapper.appendChild(inputElement);
            return wrapper;
        }


        function createTableRow(rowData = {}, isEditing = false) {
            const row = document.createElement('tr');
            row.dataset.id = rowData.id; // Store unique ID on the row

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
                        cancelBtn.addEventListener('click', () => cancelEdit()); // No row needed, just clear editing state
                        actionDiv.appendChild(cancelBtn);
                    } else {
                        const editBtn = document.createElement('button');
                        editBtn.classList.add('edit-btn');
                        editBtn.textContent = 'Edit';
                        editBtn.addEventListener('click', () => editRow(rowData.id));
                        actionDiv.appendChild(editBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.classList.add('delete-btn');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.addEventListener('click', () => deleteRow(rowData.id));
                        actionDiv.appendChild(deleteBtn);
                    }
                    cell.appendChild(actionDiv);
                } else {
                    if (isEditing && editingRowId === rowData.id) {
                        let displayValue = value;
                        let hiddenDateVal = '';

                        if (colName === 'Subject' && value.includes('📅')) {
                            const match = value.match(/📅\s*(\d{1,2}(?:st|nd|rd|th)?\s*\w{3}\s*\d{4})\s*-\s*(.*)/);
                            if (match) {
                                displayValue = match[2].trim(); // Only subject text for editing
                                const dateParts = match[1].match(/(\d{1,2})(?:st|nd|rd|th)?\s*(\w{3})\s*(\d{4})/);
                                if (dateParts) {
                                    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    const monthIndex = monthNamesShort.indexOf(dateParts[2]);
                                    if (monthIndex !== -1) {
                                        // Format DD-MM-YYYY for hidden input
                                        hiddenDateVal = `${String(dateParts[1]).padStart(2, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${dateParts[3]}`;
                                    }
                                }
                            }
                        }

                        const inputWrapper = createEditableInput(colName, displayValue, rowData.id);
                        cell.appendChild(inputWrapper);

                        if (colName === 'Subject') {
                            const hiddenDateInput = document.createElement('input');
                            hiddenDateInput.type = 'hidden';
                            hiddenDateInput.classList.add('hidden-date-for-scrolling-notice');
                            hiddenDateInput.value = hiddenDateVal;
                            hiddenDateInput.id = `hidden-date-${rowData.id}`; // Use row ID for unique hidden input ID
                            hiddenDateInput.dataset.rowId = rowData.id; // Store row ID on the hidden input
                            cell.appendChild(hiddenDateInput);
                        }

                    } else {
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
                const row = createTableRow(rowData, editingRowId === rowData.id);
                tbody.appendChild(row);
            });
            // No pagination for these tables as per common structure
        }

        function addEntry(date, subject, color) {
            const newId = Date.now(); // Simple unique ID
            const newRow = {
                id: newId,
                Date: date,
                Subject: `📅 ${date} - ${subject}`, // Formatted for display
                Color: color
            };
            dataRows.push(newRow);
            renderTable();
            showValidationMessage("নতুন ডেটা সফলভাবে যোগ হয়েছে!");
        }

        function editRow(id) {
            editingRowId = id;
            renderTable();
        }

        function saveRow(rowElement) {
            const rowId = parseInt(rowElement.dataset.id);
            const index = dataRows.findIndex(r => r.id === rowId);

            if (index !== -1) {
                const updatedData = {};
                rowElement.querySelectorAll('td').forEach((cell, i) => {
                    const colName = columnNames[i];
                    if (colName !== 'Action') {
                        let value;
                        if (colName === 'Subject') {
                            const textareaInput = cell.querySelector('.textarea-input');
                            const hiddenDateInput = cell.querySelector('.hidden-date-for-scrolling-notice');
                            const subjectText = textareaInput ? textareaInput.value.trim() : dataRows[index].Subject;
                            const dateFromHidden = hiddenDateInput ? hiddenDateInput.value.trim() : '';

                            // Reconstruct the Subject string with date and text
                            if (dateFromHidden && subjectText) {
                                // Convert DD-MM-YYYY to DD Month YYYY for display
                                const [day, month, year] = dateFromHidden.split('-');
                                const dateObj = new Date(year, parseInt(month) - 1, day);
                                const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                                               .replace(',', '').replace(/(\d+)\s*(\w+)\s*(\d+)/, (match, d, m, y) => {
                                                                   const suffix = (d % 10 === 1 && d !== 11) ? 'st' :
                                                                                  (d % 10 === 2 && d !== 12) ? 'nd' :
                                                                                  (d % 10 === 3 && d !== 13) ? 'rd' : 'th';
                                                                   return `${d}${suffix} ${m} ${y}`;
                                                               });
                                value = `📅 ${formattedDate} - ${subjectText}`;
                            } else {
                                value = subjectText; // If no date, just use the subject text
                            }
                        } else if (colName === 'Color') {
                            const colorInput = cell.querySelector('input.color-input-in-table');
                            value = colorInput ? colorInput.value.trim() : dataRows[index].Color;
                        } else {
                            const input = cell.querySelector('input');
                            value = input ? input.value.trim() : dataRows[index][colName];
                        }
                        updatedData[colName] = value;
                    }
                });

                // Validation
                if (!updatedData.Date || !updatedData.Subject) {
                    showValidationMessage("তারিখ এবং বিষয় ফিল্ডগুলো পূরণ করতে হবে।");
                    return;
                }

                dataRows[index] = { ...dataRows[index], ...updatedData };
                editingRowId = null; // Exit editing mode
                renderTable();
                showValidationMessage("সফলভাবে সেভ হয়েছে!");
            }
        }

        function cancelEdit() {
            editingRowId = null; // Exit editing mode
            renderTable();
            showValidationMessage("সম্পাদনা বাতিল করা হয়েছে।");
        }

        function deleteRow(idToDelete) {
            // Use the specific delete confirmation modal for this section
            const deleteConfirmModalId = isTeacherNotice ? 'deleteConfirmModalSection7' : 'deleteConfirmModalSection8';
            const confirmDeleteBtnId = isTeacherNotice ? 'confirmDeleteBtnSection7' : 'confirmDeleteBtnSection8';
            const cancelDeleteBtnId = isTeacherNotice ? 'cancelDeleteBtnSection7' : 'cancelDeleteBtnSection8';

            const deleteConfirmModal = document.getElementById(deleteConfirmModalId);
            const confirmDeleteBtn = document.getElementById(confirmDeleteBtnId);
            const cancelDeleteBtn = document.getElementById(cancelDeleteBtnId);

            // Temporarily store the ID of the row to be deleted
            deleteConfirmModal.dataset.rowToDeleteId = idToDelete;
            deleteConfirmModal.style.display = 'flex';

            // Clear previous listeners to avoid multiple executions
            confirmDeleteBtn.onclick = null;
            cancelDeleteBtn.onclick = null;

            confirmDeleteBtn.onclick = () => {
                const id = parseInt(deleteConfirmModal.dataset.rowToDeleteId);
                dataRows = dataRows.filter(row => row.id !== id);
                renderTable();
                showValidationMessage("রো সফলভাবে মুছে ফেলা হয়েছে!");
                deleteConfirmModal.style.display = 'none';
                delete deleteConfirmModal.dataset.rowToDeleteId; // Clean up
            };

            cancelDeleteBtn.onclick = () => {
                deleteConfirmModal.style.display = 'none';
                delete deleteConfirmModal.dataset.rowToDeleteId; // Clean up
            };
        }


        // Event Listeners for the external form
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                // Clear the form fields when "Add New" is clicked
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '#000000'; // Default black or any suitable color
                colorPreviewForm.style.backgroundColor = '#000000';
                colorPreviewForm.style.borderColor = '#000000';
                saveBtn.textContent = 'Add'; // Change button text to "Add"
                saveBtn.onclick = () => {
                    const dateVal = dateInput.value.trim();
                    const subjectVal = subjectInput.value.trim();
                    const colorVal = colorInput.value.trim();

                    if (!dateVal || !subjectVal) {
                        showValidationMessage("তারিখ এবং বিষয় ফিল্ডগুলো পূরণ করতে হবে।");
                        return;
                    }
                    addEntry(dateVal, subjectVal, colorVal);
                    // Reset form after adding
                    dateInput.value = '';
                    subjectInput.value = '';
                    colorInput.value = '#000000';
                    colorPreviewForm.style.backgroundColor = '#000000';
                    colorPreviewForm.style.borderColor = '#000000';
                    saveBtn.textContent = 'Save'; // Reset button text
                    // Clear the add button's click handler to prevent it from acting as 'Add'
                    // when the form is cleared, as saveBtn is used for both Add and Save in the form.
                };
            });
        }


        if (saveBtn) {
            // Initially, saveBtn acts as "Add" for new entries from the form
            saveBtn.textContent = 'Add'; // Default to Add
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
                colorInput.value = '#000000';
                colorPreviewForm.style.backgroundColor = '#000000';
                colorPreviewForm.style.borderColor = '#000000';
            };
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Clear the form fields
                dateInput.value = '';
                subjectInput.value = '';
                colorInput.value = '#000000';
                colorPreviewForm.style.backgroundColor = '#000000';
                colorPreviewForm.style.borderColor = '#000000';
                saveBtn.textContent = 'Add'; // Reset button text to "Add" for new entries
            });
        }

        // Initial render for this table
        renderTable();
    }

    // --- Initialize Section 7: Scrolling Notice for Teachers ---
    // Example Data (you can load from localStorage or server here)
    const teacherNoticeData = [
        { id: 1, Date: '01-07-2025', Subject: '📅 1st Jul 2025 - Teachers Meeting on new syllabus.', Color: '#ff5722' },
        { id: 2, Date: '15-07-2025', Subject: '📅 15th Jul 2025 - Project submission deadline.', Color: '#4caf50' },
    ];
    initializeExternalFormTable('table-scrolling-notice-teachers', teacherNoticeData, true);


    // --- Initialize Section 8: Scrolling Notice for Students ---
    // Example Data (you can load from localStorage or server here)
    const studentNoticeData = [
        { id: 101, Date: '05-07-2025', Subject: '📅 5th Jul 2025 - Holiday for Eid.', Color: '#2196f3' },
        { id: 102, Date: '20-07-2025', Subject: '📅 20th Jul 2025 - Annual sports competition.', Color: '#9c27b0' },
    ];
    initializeExternalFormTable('table-scrolling-notice-students', studentNoticeData, false);


    // Common close modal button logic (if you have one common close button class)
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.table-modal-overlay').style.display = 'none';
            // Also reset current editing states if a modal is closed via X
            inputEditTextArea.value = '';
            delete inputEditTextArea.dataset.linkedDateInputId;
            if (inputEditTextArea._hasSubjectClickListener) {
                inputEditTextArea.removeEventListener('click', handleSubjectTextAreaClick);
                inputEditTextArea._hasSubjectClickListener = false;
            }
            currentEditingRow = null;
            currentEditingColIndex = -1;
        });
    });

});
