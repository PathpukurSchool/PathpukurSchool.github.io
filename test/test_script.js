document.addEventListener('DOMContentLoaded', () => {
  // ------------------- Global Variables -------------------
  let rowToClear = null;

  const validationModal = document.getElementById('validationModal');
  const validationMessage = document.getElementById('validationMessage');
  const inputEditModal = document.getElementById('inputEditModal');
  const inputEditTextArea = document.getElementById('inputEditTextArea');
  const inputEditModalHeading = document.getElementById('inputEditModalHeading');
  const storeInputBtn = document.getElementById('storeInputBtn');
  const cancelInputBtn = document.getElementById('cancelInputBtn');

  function showValidationMessage(message) {
    validationMessage.textContent = message;
    validationModal.style.display = 'flex';
  }

  // ------------------- Section 1: Teacher Exam Link -------------------
  const table = document.getElementById('table-exam-link-teacher');
  const tbody = table.querySelector('tbody');
  const paginationContainer = document.getElementById('pagination-exam-link-teacher');
  const clearConfirmModalSection1 = document.getElementById('clearConfirmModalSection1');
  const confirmClearBtnSection1 = document.getElementById('confirmClearBtnSection1');
  const cancelClearBtnSection1 = document.getElementById('cancelClearBtnSection1');

  const classes = ["V_1ST", "V_2ND", "VI_1ST", "XII_TEST"];
  const allDataRows = classes.map(cls => ({ Class: cls, ID: '', Password: '', URL: '' }));

  function renderTable() {
    tbody.innerHTML = "";
    allDataRows.forEach(rowData => {
      const row = document.createElement('tr');
      Object.keys(rowData).forEach(col => {
        const cell = document.createElement('td');
        cell.textContent = rowData[col];
        row.appendChild(cell);
      });

      const actionCell = document.createElement('td');
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = () => {
        if (!rowData.ID && !rowData.Password && !rowData.URL) {
          showValidationMessage("এই রো-তে কোনও ডেটা নেই, তাই ক্লিয়ার করা যাবে না!");
          return;
        }
        rowToClear = rowData;
        clearConfirmModalSection1.style.display = 'flex';
      };
      actionCell.appendChild(clearBtn);
      row.appendChild(actionCell);

      tbody.appendChild(row);
    });
  }

  confirmClearBtnSection1.onclick = () => {
    if (rowToClear) {
      rowToClear.ID = "";
      rowToClear.Password = "";
      rowToClear.URL = "";
      renderTable();
      showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
      rowToClear = null;
    }
    clearConfirmModalSection1.style.display = 'none';
  };

  cancelClearBtnSection1.onclick = () => {
    rowToClear = null;
    clearConfirmModalSection1.style.display = 'none';
  };

  renderTable();

  // ------------------- Section 2: Student Link -------------------
  const studentTable = document.getElementById('table-link-student');
  const studentTbody = studentTable.querySelector('tbody');
  const clearConfirmModalSection2 = document.getElementById('clearConfirmModalSection2');
  const confirmClearBtnSection2 = document.getElementById('confirmClearBtnSection2');
  const cancelClearBtnSection2 = document.getElementById('cancelClearBtnSection2');

  const studentClasses = ["V_1ST", "VI_1ST", "XII_TEST"];
  const studentDataRows = studentClasses.map(cls => ({ Class: cls, Student_URL: "" }));

  function renderStudentTable() {
    studentTbody.innerHTML = "";
    studentDataRows.forEach(rowData => {
      const row = document.createElement('tr');
      Object.keys(rowData).forEach(col => {
        const cell = document.createElement('td');
        cell.textContent = rowData[col];
        row.appendChild(cell);
      });

      const actionCell = document.createElement('td');
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = () => {
        if (!rowData.Student_URL) {
          showValidationMessage("এই রো-তে কোনও URL নেই, তাই ক্লিয়ার করা যাবে না!");
          return;
        }
        rowToClear = rowData;
        clearConfirmModalSection2.style.display = 'flex';
      };
      actionCell.appendChild(clearBtn);
      row.appendChild(actionCell);

      studentTbody.appendChild(row);
    });
  }

  confirmClearBtnSection2.onclick = () => {
    if (rowToClear) {
      rowToClear.Student_URL = "";
      renderStudentTable();
      showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
      rowToClear = null;
    }
    clearConfirmModalSection2.style.display = 'none';
  };

  cancelClearBtnSection2.onclick = () => {
    rowToClear = null;
    clearConfirmModalSection2.style.display = 'none';
  };

  renderStudentTable();

  // ------------------- Section 3: Marks Submission Date -------------------
  const marksTable = document.getElementById('table-marks-submission');
  const marksTbody = marksTable.querySelector('tbody');
  const clearConfirmModalSection3 = document.getElementById('clearConfirmModalSection3');
  const confirmClearBtnSection3 = document.getElementById('confirmClearBtnSection3');
  const cancelClearBtnSection3 = document.getElementById('cancelClearBtnSection3');

  const exams = ["1st Exam", "2nd Exam", "XII Test"];
  const marksDataRows = exams.map(exam => ({ Exam: exam, Date: "", Color: "" }));

  function renderMarksTable() {
    marksTbody.innerHTML = "";
    marksDataRows.forEach(rowData => {
      const row = document.createElement('tr');
      Object.keys(rowData).forEach(col => {
        const cell = document.createElement('td');
        cell.textContent = rowData[col];
        row.appendChild(cell);
      });

      const actionCell = document.createElement('td');
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = () => {
        if (!rowData.Date && !rowData.Color) {
          showValidationMessage("এই রো-তে কোনও তথ্য নেই, তাই ক্লিয়ার করা যাবে না!");
          return;
        }
        rowToClear = rowData;
        clearConfirmModalSection3.style.display = 'flex';
      };
      actionCell.appendChild(clearBtn);
      row.appendChild(actionCell);

      marksTbody.appendChild(row);
    });
  }

  confirmClearBtnSection3.onclick = () => {
    if (rowToClear) {
      rowToClear.Date = "";
      rowToClear.Color = "";
      renderMarksTable();
      showValidationMessage("ডেটা সফলভাবে ক্লিয়ার হয়েছে!");
      rowToClear = null;
    }
    clearConfirmModalSection3.style.display = 'none';
  };

  cancelClearBtnSection3.onclick = () => {
    rowToClear = null;
    clearConfirmModalSection3.style.display = 'none';
  };

  renderMarksTable();

  // ------------------- Common Modal Close -------------------
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.table-modal-overlay').style.display = 'none';
    });
  });

  // ------------------- Input Edit Modal Logic (Optional) -------------------
  storeInputBtn.onclick = () => {
    inputEditModal.style.display = 'none';
    inputEditTextArea.value = '';
  };

  cancelInputBtn.onclick = () => {
    inputEditModal.style.display = 'none';
    inputEditTextArea.value = '';
  };
});
