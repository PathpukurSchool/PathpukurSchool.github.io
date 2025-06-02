// script.js

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6mD_rAUBTqOd9wvtnlTT26VozSDpr9oa8iFd8781OUCowvuYX57CM4gm1_8PCN6AbOQ/exec'; // এখানে আপনার কপি করা Apps Script URL পেস্ট করুন

document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const table = document.getElementById('examLinkTable');
    let isEditing = false;

    // Function to fetch data from Google Sheet
    async function fetchData() {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getData`, {
                method: 'POST', // Use POST for data fetching as well for consistency with doPost
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'getData'
                })
            });
            const result = await response.json();
            if (result.status === 'success' && result.data.length > 0) {
                populateTable(result.data);
            } else if (result.status === 'success' && result.data.length === 0) {
                console.log("No data found in Google Sheet. Table will remain empty or with default values.");
            } else {
                console.error('Error fetching data:', result.message);
                alert('Error fetching data: ' + result.message);
            }
        } catch (error) {
            console.error('Network or parsing error:', error);
            alert('Failed to connect to Google Sheet. Check console for details.');
        }
    }

    // Function to populate the HTML table with data from Google Sheet
    function populateTable(data) {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing rows

        // Re-add fixed rows based on the required CLASS values
        const requiredClasses = [
            'V_1ST', 'V_2ND', 'V_3RD', 'VI_1ST', 'VII_1ST',
            'VIII_1ST', 'IX_1ST', 'X_1ST', 'X_2ND', 'X_TEST EXAM', 
            'XI_SEMESTER_I', 'XI_SEMESTER_II', 'XII_TEST EXAM'
        ];

        requiredClasses.forEach(className => {
            const rowData = data.find(item => item.CLASS === className);
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-class', className);

            const classCell = document.createElement('td');
            classCell.classList.add('fixed-cell');
            classCell.style.backgroundColor = '#4CAF50';
            classCell.style.color = 'white';
            classCell.textContent = className;
            newRow.appendChild(classCell);

            const idCell = document.createElement('td');
            idCell.setAttribute('contenteditable', 'false');
            idCell.textContent = rowData ? rowData.ID : '';
            newRow.appendChild(idCell);

            const passwordCell = document.createElement('td');
            passwordCell.setAttribute('contenteditable', 'false');
            passwordCell.textContent = rowData ? rowData.PASSWORD : '';
            newRow.appendChild(passwordCell);

            const linkCell = document.createElement('td');
            linkCell.setAttribute('contenteditable', 'false');
            linkCell.textContent = rowData ? rowData.LINK : '';
            newRow.appendChild(linkCell);

            tbody.appendChild(newRow);
        });
    }

    // Initial data load when the page loads
    fetchData();

    // Event listener for Edit button
    editBtn.addEventListener('click', () => {
        isEditing = !isEditing;
        const editableCells = table.querySelectorAll('tbody td:not(.fixed-cell)');

        editableCells.forEach(cell => {
            cell.setAttribute('contenteditable', isEditing);
            // Apply or remove styles for editable cells
            if (isEditing) {
                cell.style.backgroundColor = '#fffacd';
                cell.style.border = '1px solid #ffeb8a';
            } else {
                cell.style.backgroundColor = '';
                cell.style.border = '';
            }
        });

        if (isEditing) {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        } else {
            // If we are exiting edit mode without saving, it means we clicked edit again
            // In a real scenario, you might want to revert changes or just keep the current state
            // For now, it just toggles the mode.
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
        }
    });

    // Event listener for Save button
    saveBtn.addEventListener('click', async () => {
        const rows = table.querySelectorAll('tbody tr');
        const dataToSave = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            dataToSave.push({
                CLASS: cells[0].textContent,
                ID: cells[1].textContent,
                PASSWORD: cells[2].textContent,
                LINK: cells[3].textContent
            });
        });

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'save',
                    data: JSON.stringify(dataToSave)
                })
            });
            const result = await response.json();

            if (result.status === 'success') {
                alert('Data saved successfully to Google Sheet!');
                isEditing = false;
                editBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
                // Make cells non-editable after saving
                table.querySelectorAll('tbody td:not(.fixed-cell)').forEach(cell => {
                    cell.setAttribute('contenteditable', 'false');
                    cell.style.backgroundColor = '';
                    cell.style.border = '';
                });
                fetchData(); // Re-fetch data to ensure consistency and display latest data
            } else {
                alert('Error saving data: ' + result.message);
                console.error('Error saving data:', result.message);
            }
        } catch (error) {
            alert('Failed to save data. Check console for details.');
            console.error('Network or saving error:', error);
        }
    });
});

// Function to handle data deletion (can be integrated with a delete button per row if needed)
async function deleteData(className) {
    if (!confirm(`Are you sure you want to delete data for CLASS: ${className}?`)) {
        return;
    }
    try {
        const response = await fetch(`${WEB_APP_URL}?action=delete&class=${encodeURIComponent(className)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'delete',
                class: className
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert(result.message);
            // After successful deletion, re-fetch data to update the table
            fetchData();
        } else {
            alert('Error deleting data: ' + result.message);
            console.error('Error deleting data:', result.message);
        }
    } catch (error) {
        alert('Failed to delete data. Check console for details.');
        console.error('Network or deletion error:', error);
    }
}
