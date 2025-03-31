// Helper function to wait for elements to load before processing
function waitForClassesToLoad(callback) {
    const checkInterval = 500; // Check every 500ms
    const maxAttempts = 20; // Max number of attempts before timing out
    let attempts = 0;

    const intervalId = setInterval(() => {
        const removeButtons = document.querySelectorAll('button[title^="Remove Notification for:"]');
        if (removeButtons.length > 0 || attempts >= maxAttempts) {
            clearInterval(intervalId);
            callback();
        }
        attempts++;
    }, checkInterval);
}

// Helper function to safely access Chrome APIs
function safeChromeAccess(callback) {
    try {
        // Check if chrome API is available
        if (chrome && chrome.runtime && chrome.runtime.id) {
            callback();
        } else {
            console.log('Chrome API not available - extension context may be invalidated');
        }
    } catch (error) {
        console.log('Error accessing Chrome API:', error.message);
    }
}

// Function to sync the courses on Notify.UW with Chrome storage
function syncCoursesWithStorage() {
    const coursesInPage = [];

    // Get all the "Remove Notification" buttons
    const removeButtons = document.querySelectorAll('button[title^="Remove Notification for:"]');

    // Loop through each button to extract course details
    removeButtons.forEach((button) => {
        const courseInfo = button.getAttribute('title').replace('Remove Notification for: ', '').trim(); 
        // Example courseInfo: "INFO 300 A"

        // Get the SLN by navigating up the DOM to find the corresponding <a> element
        const slnElement = button.closest('li').querySelector('a[href*="sln.asp"]');
        const sln = slnElement ? slnElement.textContent.trim() : null;

        if (sln) {
            const courseDetails = `${sln}: ${courseInfo}`; // Example: "16871: INFO 300 A"
            coursesInPage.push(courseDetails); // Store the course and SLN in the array
        }
    });

    // Safely get the current courses from Chrome storage
    safeChromeAccess(() => {
        chrome.storage.local.get('courses', function(result) {
            const storedCourses = result.courses || [];
            
            // Identify courses to add (on page but not in storage)
            const coursesToAdd = coursesInPage.filter(course => !storedCourses.includes(course));
            
            // Identify courses to remove (in storage but not on page)
            const coursesToRemove = storedCourses.filter(course => !coursesInPage.includes(course));
            
            // Update the storage: Add and Remove courses
            let updatedCourses = [...storedCourses];
            
            coursesToAdd.forEach(course => {
                updatedCourses.push(course);
                console.log("Added course:", course);
            });
            
            coursesToRemove.forEach(course => {
                updatedCourses = updatedCourses.filter(storedCourse => storedCourse !== course);
                console.log("Removed course:", course);
            });
            
            // Store the updated courses back in local storage
            safeChromeAccess(() => {
                chrome.storage.local.set({ courses: updatedCourses }, function() {
                    console.log("Storage updated. Current courses:", updatedCourses);
                });
            });
        });
    });
}

// Initial sync when the page loads
window.onload = function() {
    // Check if we should trigger sync based on flag
    safeChromeAccess(() => {
        chrome.storage.local.get('triggerNotifySync', function(result) {
            if (result.triggerNotifySync) {
                // Clear the flag
                safeChromeAccess(() => {
                    chrome.storage.local.remove('triggerNotifySync', function() {
                        console.log('Cleared trigger flag and running sync...');
                        waitForClassesToLoad(syncCoursesWithStorage);
                    });
                });
            } else {
                // Normal page load behavior
                waitForClassesToLoad(syncCoursesWithStorage);
            }
        });
    });
};

// Function to listen for various interactions and trigger the sync
function setupEventListeners() {
    const events = ['click', 'mousemove', 'touchstart', 'keydown', 'scroll', 'wheel'];

    // Add event listeners for all the events specified
    events.forEach(eventType => {
        document.addEventListener(eventType, () => {
            waitForClassesToLoad(syncCoursesWithStorage);
        });
    });

    console.log('Listening for interactions on the page...');
}

// Setup event listeners on the page for all interactions
setupEventListeners();