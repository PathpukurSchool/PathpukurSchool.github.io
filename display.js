// display.js

const PUBLIC_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6mD_rAUBTqOd9wvtnlTT26VozSDpr9oa8iFd8781OUCowvuYX57CM4gm1_8PCN6AbOQ/exec'; // এটি আপনার Apps Script এর একই URL হবে

document.addEventListener('DOMContentLoaded', async () => {
    const examLinksDisplay = document.getElementById('examLinksDisplay');
    const lastUpdatedElement = document.getElementById('lastUpdated');

    async function loadExamLinks() {
        examLinksDisplay.innerHTML = '<p>Loading exam links...</p>'; // Show loading message
        try {
            const response = await fetch(`${PUBLIC_WEB_APP_URL}?action=getData`, {
                method: 'POST', // Still using POST as defined in Apps Script
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'getData'
                })
            });
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                if (result.data.length > 0) {
                    renderTable(result.data);
                    lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
                } else {
                    examLinksDisplay.innerHTML = '<p>No exam links available at the moment.</p>';
                    lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
                }
            } else {
                examLinksDisplay.innerHTML = `<p style="color: red;">Error loading data: ${result.message || 'Unknown error'}</p>`;
                console.error('Error fetching data for public page:', result.message);
            }
        } catch (error) {
            examLinksDisplay.innerHTML = `<p style="color: red;">Failed to connect to the server. Please try again later.</p>`;
            console.error('Network or parsing error for public page:', error);
        }
    }

    function renderTable(data) {
        let tableHTML = `
            <table class="exam-links-table">
                <thead>
                    <tr>
                        <th>CLASS</th>
                        <th>ID</th>
                        <th>PASSWORD</th>
                        <th>LINK</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            tableHTML += `
                <tr>
                    <td>${row.CLASS}</td>
                    <td>${row.ID}</td>
                    <td>${row.PASSWORD}</td>
                    <td><a href="${row.LINK}" target="_blank" rel="noopener noreferrer">${row.LINK ? 'Go to Link' : ''}</a></td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        examLinksDisplay.innerHTML = tableHTML;
    }

    // Load links when the page loads
    loadExamLinks();

    // You can also add a refresh button or periodically refresh the data
    // For example, to refresh every 5 minutes:
    // setInterval(loadExamLinks, 5 * 60 * 1000);
});
