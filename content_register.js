// Function to create a dropdown for SLN inputs with courses from memory
function createDropdownForSLNInputs() {
    // Get all rows from the second table (identified by class 'sps_table update')
    const table = document.querySelectorAll('.sps_table.update')[1]; // The second table
    const rows = table.querySelectorAll('tr');

    // Retrieve the subscribed courses and starred courses from Chrome's local storage
    chrome.storage.local.get(['courses', 'starredCourses'], function(result) {
        let courses = result.courses || [];
        let starredCourses = result.starredCourses || {};

        // Sort courses: Starred courses first, then alphabetically
        courses = courses.sort((a, b) => {
            const aStarred = starredCourses[a] || false;
            const bStarred = starredCourses[b] || false;

            // Starred courses come first, then sort alphabetically
            if (aStarred && !bStarred) return -1;
            if (!aStarred && bStarred) return 1;
            return a.localeCompare(b);
        });

        const numberOfCourses = courses.length;

        // Find the rows that contain SLN inputs, starting from the 6th input
        let inputRowCount = 0;
        let lastSLNRowIndex = -1;

        rows.forEach((row, index) => {
            const slnInput = row.querySelector('input[name^="sln"]');
            if (slnInput) {
                inputRowCount++;
                lastSLNRowIndex = index;

                // Only replace the first 8 SLN input fields with dropdowns
                if (inputRowCount <= Math.min(numberOfCourses, 8)) {
                    // Create a select element
                    const dropdown = document.createElement('select');
                    dropdown.style.width = '100%';
                    dropdown.name = slnInput.name;

                    // Create an empty option as the default
                    const defaultOption = document.createElement('option');
                    defaultOption.text = 'Select a course';
                    defaultOption.value = '';
                    dropdown.appendChild(defaultOption);

                    // Populate the dropdown with courses from memory
                    courses.forEach(course => {
                        const option = document.createElement('option');
                        option.text = course; // Format: "<sln>: <class name> <section name>"
                        option.value = course.split(':')[0].trim(); // Use only the SLN as value
                        dropdown.appendChild(option);
                    });

                    // Replace the SLN input field with the dropdown
                    const parent = slnInput.parentElement;
                    parent.replaceChild(dropdown, slnInput);
                }
            }
        });

        // Determine how many extra rows are needed
        const extraRowsNeeded = Math.max(0, Math.min(2, numberOfCourses - 6));

        // Add the necessary extra rows
        for (let i = 0; i < extraRowsNeeded; i++) {
            const newRow = document.createElement('tr');

            // Generate a new SLN input field
            const slnInputTd = document.createElement('td');
            slnInputTd.setAttribute('align', 'CENTER');
            const slnInput = document.createElement('input');
            slnInput.type = 'TEXT';
            slnInput.size = '5';
            slnInput.maxLength = '5';
            slnInput.name = `sln${inputRowCount + 1 + i}`;
            slnInputTd.appendChild(slnInput);
            newRow.appendChild(slnInputTd);

            // AddCode input field
            const entcodeTd = document.createElement('td');
            entcodeTd.setAttribute('align', 'CENTER');
            const entcodeInput = document.createElement('input');
            entcodeInput.type = 'TEXT';
            entcodeInput.size = '5';
            entcodeInput.maxLength = '5';
            entcodeInput.name = `entcode${inputRowCount + 1 + i}`;
            entcodeTd.appendChild(entcodeInput);
            newRow.appendChild(entcodeTd);

            // Credits input field
            const creditsTd = document.createElement('td');
            creditsTd.setAttribute('align', 'CENTER');
            const creditsInput = document.createElement('input');
            creditsInput.type = 'TEXT';
            creditsInput.size = '4';
            creditsInput.maxLength = '2';
            creditsInput.name = `credits${inputRowCount + 1 + i}`;
            creditsTd.appendChild(creditsInput);
            newRow.appendChild(creditsTd);

            // S/NS checkbox
            const snsTd = document.createElement('td');
            snsTd.setAttribute('align', 'CENTER');
            const snsCheckbox = document.createElement('input');
            snsCheckbox.type = 'CHECKBOX';
            snsCheckbox.value = 'sns';
            snsCheckbox.name = `gr_sys${inputRowCount + 1 + i}`;
            snsTd.appendChild(snsCheckbox);
            newRow.appendChild(snsTd);

            // Append new row to the table
            table.querySelector('tbody').appendChild(newRow);
        }
    });
}

// Run the function to modify SLN inputs once the DOM is loaded
window.onload = function() {
    createDropdownForSLNInputs();
};