document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('table-exam-link-teacher');
    const tbody = table.querySelector('tbody');
    const paginationContainer = document.getElementById('pagination-exam-link-teacher');

    // Modals
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

    let currentEditingRow = null;
    let currentEditingColIndex = -1;
    let rowToClear = null;

    const columnNames = ["Class", "ID", "Password", "URL", "Action"];
    const rowsPerPage = 10;
    let currentPage = 1;

    const classes = [
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ];

    const allDataRows = classes.map(cls => ({
        Class: cls,
        ID: '',
        Password: '',
        URL: ''
    }));

    // Utility Functions
    function showValidationMessage(message) {
        validationMessage.textContent = message;
        validationModal.style.display = 'flex';
    }

    function createEditableInput(colName, value) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
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
                    saveBtn.onclick = () => saveRow(row);
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
                    editBtn.onclick = () => renderTable(true, rowData.Class);
                    div.appendChild(editBtn);

                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-btn';
                    clearBtn.textContent = 'Clear';
                    clearBtn.onclick = () => {
                        const target = allDataRows.find(r => r.Class === rowData.Class);
                        if (!target.ID && !target.Password && !target.URL) {
                            showValidationMessage("এই রো-তে কোনও ডেটা নেই, তাই ক্লিয়ার করা যাবে না!");
                            return;
                        }
                        rowToClear = target;
                        clearConfirmModal.style.display = 'flex';
                    };
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
        const className = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');
        const updated = {};
        inputs.forEach((input, i) => {
            updated[columnNames[i + 1]] = input.value.trim();
        });

        if (!updated.ID || !updated.Password || !updated.URL) {
            showValidationMessage(`Class: ${className}\nID, Password ও URL ফিল্ডগুলো পূরণ করতে হবে।`);
            return;
        }

        const index = allDataRows.findIndex(d => d.Class === className);
        if (index !== -1) {
            allDataRows[index] = { Class: className, ...updated };
            showValidationMessage("সফলভাবে সেভ হয়েছে!");
        }

        renderTable();
    }

    function renderTable(isEditing = false, editClass = "") {
        tbody.innerHTML = "";
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        allDataRows.slice(start, end).forEach(rowData => {
            const editMode = isEditing && rowData.Class === editClass;
            const row = createTableRow(rowData, editMode);
            tbody.appendChild(row);
        });

        renderPagination();
    }

    function renderPagination() {
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(allDataRows.length / rowsPerPage);

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
            if (i === currentPage) pageBtn.style.fontWeight = "bold";
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

    // Modal Button Handlers
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

    confirmClearBtn.onclick = () => {
        if (rowToClear) {
            rowToClear.ID = "";
            rowToClear.Password = "";
            rowToClear.URL = "";
            renderTable();
            showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            rowToClear = null;
        }
        clearConfirmModal.style.display = 'none';
    };

    cancelClearBtn.onclick = () => {
        rowToClear = null;
        clearConfirmModal.style.display = 'none';
    };

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.table-modal-overlay').style.display = 'none';
        });
    });

    renderTable();

// -------------------- Section 2: Link for Students --------------------

    const studentTable = document.getElementById('table-link-student');
    const studentTbody = studentTable.querySelector('tbody');
    const studentPagination = document.getElementById('pagination-link-student');

    const studentColumnNames = ["Class", "Student_URL", "Action"];
    const studentRowsPerPage = 10;
    let studentCurrentPage = 1;

    const studentClasses = [
        "V_1ST", "V_2ND", "V_3RD", "VI_1ST", "VI_2ND", "VI_3RD",
        "VII_1ST", "VII_2ND", "VII_3RD", "VIII_1ST", "VIII_2ND", "VIII_3RD",
        "IX_1ST", "IX_2ND", "IX_3RD", "X_1ST", "X_2ND", "X_TEST",
        "XI_SEM1", "XI_SEM2", "XII_TEST"
    ];

    const studentDataRows = studentClasses.map(cls => ({
        Class: cls,
        Student_URL: ""
    }));

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
                            rowToClear = target;
                            clearConfirmModalStudentLink.style.display = 'flex';
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
        prevBtn.onclick = () => {
            studentCurrentPage--;
            renderStudentTable();
        };
        studentPagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === studentCurrentPage) pageBtn.style.fontWeight = "bold";
            pageBtn.onclick = () => {
                studentCurrentPage = i;
                renderStudentTable();
            };
            studentPagination.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = "Next";
        nextBtn.disabled = studentCurrentPage === totalPages;
        nextBtn.onclick = () => {
            studentCurrentPage++;
            renderStudentTable();
        };
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
    
// ------- Clear Modal Setup, Section 2 ------ 
 confirmClearBtn.onclick = () => {
        if (rowToClear) {
            rowToClear.Student_URL = "";
            renderStudentTable();
            showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            rowToClear = null;
        }
        clearConfirmModalStudentLink.style.display = 'none';
    };
    
    renderStudentTable();


// -------------------- Section 3: Marks Submission Date for Teachers --------------------

    const marksTable = document.getElementById('table-marks-submission');
    const marksTbody = marksTable.querySelector('tbody');
    const marksPagination = document.getElementById('pagination-marks-submission');

    const marksColumnNames = ["Exam", "Date", "Color", "Action"];
    const marksRowsPerPage = 10;
    let marksCurrentPage = 1;

    const examList = [
        "1st Exam", "2nd Exam", "X Test", "3rd Exam",
        "XI Semester I", "XI Semester II", "XII Test"
    ];

    const marksDataRows = examList.map(exam => ({
        Exam: exam,
        Date: "",
        Color: ""
    }));

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
                            rowToClear = target;
                            clearConfirmModal.style.display = 'flex';
                        };
                        div.appendChild(clearBtn);
                    }
                    cell.appendChild(div);
                } else {
                    if (isEditing && rowData.Exam === editExam) {
                        const input = document.createElement('input');
                        input.value = rowData[col];
                        input.readOnly = false;

                        if (col === "Date") input.type = 'date';
                        if (col === "Color") input.type = 'color';

                        input.addEventListener('change', () => {
                            input.setAttribute('data-modified', 'true');
                        });

                        cell.appendChild(input);
                    } else {
                        cell.textContent = rowData[col];
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
        prevBtn.onclick = () => {
            marksCurrentPage--;
            renderMarksTable();
        };
        marksPagination.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === marksCurrentPage) pageBtn.style.fontWeight = "bold";
            pageBtn.onclick = () => {
                marksCurrentPage = i;
                renderMarksTable();
            };
            marksPagination.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = "Next";
        nextBtn.disabled = marksCurrentPage === totalPages;
        nextBtn.onclick = () => {
            marksCurrentPage++;
            renderMarksTable();
        };
        marksPagination.appendChild(nextBtn);
    }

    function saveMarksRow(row) {
        const exam = row.querySelector('td').textContent;
        const inputs = row.querySelectorAll('input');
        const date = inputs[0].value.trim();
        const color = inputs[1].value.trim();

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

// ------- Clear Modal Setup, Section 3 ------ 
confirmClearBtn.onclick = () => {
        if (rowToClear) {
            rowToClear.Date = "";
            rowToClear.Color = "";
            renderMarksTable();
            showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
            rowToClear = null;
        }
        clearConfirmModal.style.display = 'none';
    };
    
renderMarksTable();

    
});
