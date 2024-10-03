// Helper function to extract course details from the row
function extractCourseDetails(row) {
    const slnElement = row.querySelector('td a[href*="SLN"]');
    const sectionDiv = row.querySelector('div[id^="section-code"]');

    if (slnElement && sectionDiv) {
        const sln = slnElement.textContent.trim();
        const classInfo = sectionDiv.id.split('-').slice(-3, -1).join(' '); // Extract class name (e.g., INFO 201)
        const section = sectionDiv.id.split('-').pop(); // Extract section name (e.g., A)
        return `${sln}: ${classInfo} ${section}`;
    }

    return null;
}

// Track button state to ensure an action is only triggered on state change
document.addEventListener('click', function(event) {
    const bellButton = event.target.closest('button[title^="Subscribe to"], button[title^="Unsubscribe to"]');
    
    if (bellButton) {
        const row = bellButton.closest('tr');
        const courseDetails = extractCourseDetails(row);
        if (!courseDetails) return;

        // Check the current button state (Subscribe or Unsubscribe)
        const currentState = bellButton.title.startsWith("Subscribe to") ? "subscribe" : "unsubscribe";

        // Use MutationObserver to detect changes in the button's title attribute (which indicates state change)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'title') {
                    const newState = bellButton.title.startsWith("Subscribe to") ? "subscribe" : "unsubscribe";

                    if (currentState !== newState) {
                        // If the state changes, trigger the appropriate action
                        if (newState === "subscribe") {
                            // Unsubscribed, so remove the course from memory
                            chrome.storage.local.get('courses', function(result) {
                                let courses = result.courses || [];
                                courses = courses.filter(course => course !== courseDetails); // Remove the course
                                chrome.storage.local.set({ courses }, function() {
                                    console.log("Course unsubscribed:", courseDetails);
                                });
                            });
                        } else if (newState === "unsubscribe") {
                            // Subscribed, so add the course to memory
                            chrome.storage.local.get('courses', function(result) {
                                let courses = result.courses || [];
                                if (!courses.includes(courseDetails)) {
                                    courses.push(courseDetails);
                                    chrome.storage.local.set({ courses }, function() {
                                        console.log("Course subscribed:", courseDetails);
                                    });
                                }
                            });
                        }
                    }
                }
            });
        });

        // Observe the bell button for changes in the title attribute
        observer.observe(bellButton, { attributes: true });

        // Stop observing when the modal or page closes
        window.addEventListener('beforeunload', function() {
            observer.disconnect();
        });
    }
});