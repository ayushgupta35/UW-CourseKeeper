document.addEventListener('DOMContentLoaded', function () {
    renderCourses();
});

// Function to re-render courses after a change in starred status
function renderCourses() {
    const courseList = document.getElementById('course-list');
    const previousOrder = Array.from(courseList.children).map(item => item.innerText); // Capture the previous order

    // Retrieve courses and starred status from Chrome's local storage
    chrome.storage.local.get(['courses', 'starredCourses'], function (result) {
        let courses = result.courses || [];
        let starredCourses = result.starredCourses || {};

        // Sort courses: Starred courses first, and then alphabetically
        courses = courses.sort((a, b) => {
            const aStarred = starredCourses[a] || false;
            const bStarred = starredCourses[b] || false;

            // Starred courses come first, then sort alphabetically
            if (aStarred && !bStarred) return -1;
            if (!aStarred && bStarred) return 1;
            return a.localeCompare(b);
        });

        // Remove the previous list items
        while (courseList.firstChild) {
            courseList.removeChild(courseList.firstChild);
        }

        // Populate the list with courses and add transition effects
        courses.forEach((course, newIndex) => {
            const sln = course.split(':')[0].trim(); // Get the SLN value
            const listItem = document.createElement('li');
            listItem.classList.add('reordering'); // Add class for smooth transitions

            const courseLink = document.createElement('a');
            const checkmark = document.createElement('span');
            const starButton = document.createElement('button'); // Star button

            courseLink.href = '#'; // No URL, since we're copying to the clipboard
            courseLink.innerText = course;

            // Add an event listener to copy the SLN code to the clipboard
            courseLink.addEventListener('click', function (event) {
                event.preventDefault();
                navigator.clipboard.writeText(sln).then(() => {
                    courseLink.classList.add('copied');
                    setTimeout(() => {
                        courseLink.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });

            // Add hover tooltip
            courseLink.setAttribute("data-tooltip", "Click to copy SLN");

            // Add checkmark element for the animation
            checkmark.classList.add('checkmark');
            courseLink.appendChild(checkmark);

            // Star button
            starButton.innerHTML = starredCourses[course] ? '★' : '☆'; // Star icon
            starButton.classList.add('star-button');
            starButton.addEventListener('click', function () {
                // Add animation class for star click
                starButton.classList.add('star-clicked');

                // Toggle starred status
                starredCourses[course] = !starredCourses[course];
                
                // Trigger smooth reorder animation
                animateCourseReordering(courses, previousOrder, starredCourses, courseList);

                // Save the updated starred status and re-render the courses
                setTimeout(() => {
                    chrome.storage.local.set({ starredCourses: starredCourses }, () => {
                        renderCourses();
                    });
                }, 500); // Adjust timing to allow smooth animations
            });

            listItem.appendChild(courseLink);
            listItem.appendChild(starButton); // Append star button to list item
            courseList.appendChild(listItem);

            // Animate item movement using the current index and the previous one
            const previousIndex = previousOrder.indexOf(course);
            if (previousIndex > -1 && previousIndex !== newIndex) {
                if (previousIndex < newIndex) {
                    listItem.classList.add('moving-down');
                } else {
                    listItem.classList.add('moving-up');
                }
            }
        });

        // Trigger reordering animation
        animateReordering(courseList);
    });
}

// Function to animate the reordering of the list
function animateReordering(courseList) {
    courseList.childNodes.forEach((item) => {
        item.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        item.addEventListener('transitionend', () => {
            item.classList.remove('moving-up', 'moving-down'); // Clean up classes after animation
        });
    });
}

// Animate course reordering before updating DOM
function animateCourseReordering(courses, previousOrder, starredCourses, courseList) {
    const currentOrder = Array.from(courseList.children).map(item => item.innerText);

    courses.forEach((course, newIndex) => {
        const currentIndex = currentOrder.indexOf(course);
        const courseItem = courseList.children[currentIndex];
        if (currentIndex > -1 && newIndex !== currentIndex) {
            if (newIndex > currentIndex) {
                courseItem.classList.add('moving-down');
            } else {
                courseItem.classList.add('moving-up');
            }

            // Remove the transition classes after animation ends
            setTimeout(() => {
                courseItem.classList.remove('moving-up', 'moving-down');
            }, 500); // Duration matches CSS transition
        }
    });
}