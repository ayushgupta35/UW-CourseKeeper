document.addEventListener('DOMContentLoaded', function () {
    renderCourses();
});

// Function to re-render courses after a change in starred status
function renderCourses() {
    const courseList = document.getElementById('course-list');
    const previousOrder = Array.from(courseList.children).map(item => item.innerText);

    chrome.storage.local.get(['courses', 'starredCourses'], function (result) {
        let courses = result.courses || [];
        let starredCourses = result.starredCourses || {};

        // sort courses: starred first, then alpha
        courses = courses.sort((a, b) => {
            const aStar = starredCourses[a], bStar = starredCourses[b];
            if (aStar && !bStar) return -1;
            if (!aStar && bStar) return 1;
            return a.localeCompare(b);
        });

        // group by quarter (extract via the "(Quarter)" suffix)
        const grouped = {};
        courses.forEach(full => {
            const m = full.match(/^(.+)\s+\((.+)\)$/);
            const courseText = m ? m[1] : full;
            const quarter    = m ? m[2] : 'Unknown Quarter';
            (grouped[quarter] = grouped[quarter] || []).push(full);
        });

        // sort quarters chronologically: Winter → Spring → Summer → Autumn, then by year
        const seasonOrder = { Winter: 1, Spring: 2, Summer: 3, Autumn: 4 };
        const sortedQuarters = Object.keys(grouped).sort((a, b) => {
            const [seasonA, yearA] = a.split(' ');
            const [seasonB, yearB] = b.split(' ');
            const yearDiff = parseInt(yearA) - parseInt(yearB);
            if (yearDiff !== 0) return yearDiff;
            return (seasonOrder[seasonA] || 0) - (seasonOrder[seasonB] || 0);
        });

        // clear out old items
        while (courseList.firstChild) {
            courseList.removeChild(courseList.firstChild);
        }

        // render each quarter in sorted order
        sortedQuarters.forEach(quarter => {
            // quarter header
            const h2 = document.createElement('h2');
            h2.classList.add('quarter-header');
            h2.innerText = quarter;
            courseList.appendChild(h2);

            // its courses
            grouped[quarter].forEach(full => {
                const courseText = full.replace(` (${quarter})`, '');
                const sln = courseText.split(':')[0].trim();

                const li = document.createElement('li');
                li.classList.add('reordering');

                const link = document.createElement('a');
                link.href = '#';
                link.innerText = courseText;
                link.setAttribute('data-tooltip', 'Click to copy SLN');
                link.addEventListener('click', e => {
                    e.preventDefault();
                    navigator.clipboard.writeText(sln);
                    link.classList.add('copied');
                    setTimeout(() => link.classList.remove('copied'), 2000);
                });
                const check = document.createElement('span');
                check.classList.add('checkmark');
                link.appendChild(check);

                const star = document.createElement('button');
                star.classList.add('star-button');
                star.innerHTML = starredCourses[full] ? '★' : '☆';
                star.addEventListener('click', () => {
                    star.classList.add('star-clicked');
                    starredCourses[full] = !starredCourses[full];
                    animateCourseReordering(courses, previousOrder, starredCourses, courseList);
                    setTimeout(() => {
                        chrome.storage.local.set({ starredCourses }, () => renderCourses());
                    }, 500);
                });

                li.appendChild(link);
                li.appendChild(star);
                courseList.appendChild(li);

                // initial move animation
                const prevIndex = previousOrder.indexOf(full);
                const newIndex  = Array.from(courseList.children).indexOf(li);
                if (prevIndex > -1 && prevIndex !== newIndex) {
                    li.classList.add(prevIndex < newIndex ? 'moving-down' : 'moving-up');
                }
            });
        });

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

// Add event listener for the Notify.UW sync button
document.getElementById('syncNotifyButton').addEventListener('click', function() {
    // Set a flag in storage indicating we want to sync
    chrome.storage.local.set({ 'triggerNotifySync': true }, function() {
        console.log('Set trigger flag for Notify.UW sync');
        
        // Open the Notify.UW page in a new tab
        chrome.tabs.create({ url: 'https://notify.uw.edu/notify/' });
    });
});