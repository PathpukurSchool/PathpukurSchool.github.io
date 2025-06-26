
// scrolling_student.js

const ROWS_PER_PAGE = 10;
let scrollingStudentTableData = [];
let scrollingStudentPagination = null;

const validationModal = document.getElementById('validationModal');
const validationMessage = document.getElementById('validationMessage');
const validationCloseBtn = document.getElementById('validationCloseBtn');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

let currentEditingRow = null;
let rowToDelete = null;

function getColumnNamesForTable(tableId) {
  if (tableId === 'table-scrolling-student') return ['Subject','Color','Action'];
  return [];
}

function showValidationMessage(msg) {
  validationMessage.textContent = msg;
  validationModal.style.display = 'flex';
}

function createEditableInput(col, value) {
  const input = document.createElement('input');
  if (col === 'Color') input.type = 'color';
  else input.type = 'text';
  input.value = value;
  return input;
}

function createTableRow(data={}, isEditing=false, isInput=false) {
  const tr = document.createElement('tr');
  if (isEditing) tr.classList.add('editing');
  if (isInput) tr.classList.add('input-row');

  getColumnNamesForTable('table-scrolling-student').forEach(col => {
    const td = document.createElement('td');
    if (col === 'Action') {
      const div = document.createElement('div');
      div.classList.add('action-buttons');

      if (isInput) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => saveRow(tr, true);
        div.appendChild(saveBtn);
      } else if (isEditing) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => saveRow(tr, false);
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => cancelEdit(tr);
        div.append(saveBtn,cancelBtn);
      } else {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editRow(tr);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'clear-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
          rowToDelete = tr;
          deleteConfirmModal.style.display = 'flex';
        };

        div.append(editBtn, deleteBtn);
      }

      td.appendChild(div);
    } else {
      if (isEditing || isInput) {
        const inp = createEditableInput(col, data[col]||'');
        td.appendChild(inp);
      } else {
        td.textContent = data[col]||'';
      }
    }
    tr.appendChild(td);
  });

  return tr;
}

function setupPagination() {
  let currentPage = 1;
  const totalPages = Math.ceil(scrollingStudentTableData.length / ROWS_PER_PAGE);
  const tbody = document.getElementById('table-scrolling-student').querySelector('tbody');
  const pagination = document.getElementById('pagination-table-scrolling-student');

  function renderPage(page) {
    currentPage = page;
    tbody.innerHTML = '';

    tbody.appendChild(createTableRow({}, false, true));

    const start = (page-1)*ROWS_PER_PAGE;
    const end = start+ROWS_PER_PAGE;
    scrollingStudentTableData.slice(start,end)
      .forEach(r=>tbody.appendChild(createTableRow(r,false,false)));

    updateControls();
  }

  function updateControls() {
    pagination.innerHTML = '';
    if (scrollingStudentTableData.length <= ROWS_PER_PAGE && totalPages<=1) return;

    const prev = document.createElement('button');
    prev.textContent='Previous';
    prev.disabled = currentPage===1;
    prev.onclick = ()=>renderPage(currentPage-1);
    pagination.appendChild(prev);

    for (let i=1;i<=totalPages;i++){
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i===currentPage) btn.style.fontWeight='bold';
      btn.onclick = ()=>renderPage(i);
      pagination.appendChild(btn);
    }

    const next = document.createElement('button');
    next.textContent='Next';
    next.disabled = currentPage===totalPages;
    next.onclick = ()=>renderPage(currentPage+1);
    pagination.appendChild(next);
  }

  renderPage(1);
  return {renderPage, updateControls};
}

function saveRow(tr, isNew) {
  const cols = getColumnNamesForTable('table-scrolling-student');
  const inputs = tr.querySelectorAll('input');
  const values = {};
  inputs.forEach((inp,i)=>values[cols[i]] = inp.value.trim());

  if (!values.Subject) {
    showValidationMessage('Subject ফাঁকা রাখা যাবে না।');
    return;
  }

  if (isNew) {
    scrollingStudentTableData.unshift(values);
    showValidationMessage('সফলভাবে যোগ হয়েছে!');
  } else {
    const original = JSON.parse(tr.dataset.orig);
    const idx = scrollingStudentTableData.findIndex(r=>r.Subject===original.Subject && r.Color===original.Color);
    if (idx>=0) scrollingStudentTableData[idx] = values;
    showValidationMessage('সফলভাবে আপডেট হয়েছে!');
  }

  scrollingStudentPagination.renderPage(scrollingStudentPagination.renderPage.currentPage||1);
}

function editRow(tr) {
  const cols = getColumnNamesForTable('table-scrolling-student');
  const data = {};
  tr.querySelectorAll('td').forEach((td,i)=>{
    if (cols[i]!=='Action') data[cols[i]] = td.textContent.trim();
  });
  tr.dataset.orig = JSON.stringify(data);
  tr.replaceWith(createTableRow(data, true, false));
}

function cancelEdit(tr) {
  const data = JSON.parse(tr.dataset.orig);
  tr.replaceWith(createTableRow(data, false, false));
}

function deleteRowConfirmed() {
  if (rowToDelete) {
    const cols = getColumnNamesForTable('table-scrolling-student');
    const data = {};
    rowToDelete.querySelectorAll('td').forEach((td,i)=>{
      if (cols[i]!=='Action') data[cols[i]] = td.textContent.trim();
    });
    scrollingStudentTableData = scrollingStudentTableData.filter(r=>r.Subject!==data.Subject || r.Color!==data.Color);
    scrollingStudentPagination.renderPage(scrollingStudentPagination.renderPage.currentPage||1);
    showValidationMessage('সফলভাবে ডিলেট হয়েছে!');
    rowToDelete=null;
  }
  deleteConfirmModal.style.display='none';
}

document.addEventListener('DOMContentLoaded', () => {
  validationCloseBtn.onclick = () => validationModal.style.display='none';
  cancelDeleteBtn.onclick = () => { deleteConfirmModal.style.display='none'; rowToDelete=null; };
  confirmDeleteBtn.onclick = deleteRowConfirmed;

  scrollingStudentTableData = [];
  scrollingStudentPagination = setupPagination();
});
