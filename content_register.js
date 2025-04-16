function injectCourseButtons(containerBefore) {
    chrome.storage.local.get(['courses', 'starredCourses'], function (result) {
        let courses = result.courses || [];
        let starredCourses = result.starredCourses || {};

        // Sort courses: Starred first, then alphabetically
        courses = courses.sort((a, b) => {
            const aStarred = starredCourses[a] || false;
            const bStarred = starredCourses[b] || false;
            if (aStarred && !bStarred) return -1;
            if (!aStarred && bStarred) return 1;
            return a.localeCompare(b);
        });

        // Create a container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mb-3 d-flex flex-wrap gap-2';

        // Label above buttons
        const label = document.createElement('div');
        label.textContent = 'Quick Add from Notify.UW:';
        label.className = 'fw-bold mb-1 w-100';
        buttonContainer.appendChild(label);

        // Create buttons
        courses.forEach(course => {
            const sln = course.split(':')[0].trim();
        
            const button = document.createElement('button');
            button.type = 'button';
            button.style.color = '#49317b';
            button.className = 'btn btn-sm';
            button.textContent = course;
            button.dataset.sln = sln;
            button.style.borderRadius = '0.4rem';
            button.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,.075)';
            
            // button hover that only lasts for 0.1s
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#49317b';
                button.style.color = '#fff';
                button.style.transition = '0.2s';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#fff';
                button.style.color = '#49317b';
            });
        
            // Style the button
            button.style.backgroundColor = '#fff';
            button.style.border = '1px solid #49317b';
        
            button.addEventListener('click', () => {
                const slnInput = document.getElementById('sln-suggest');
                const slnForm = document.getElementById('sln-suggest-form');
        
                if (slnInput && slnForm) {
                    slnInput.value = sln;
                    slnInput.dispatchEvent(new Event('input', { bubbles: true }));
                    slnForm.requestSubmit();
                }
            });
        
            buttonContainer.appendChild(button);
        });        

        // Insert the container just before the registration cart box
        containerBefore.parentNode.insertBefore(buttonContainer, containerBefore);
    });
}

function waitForTargetAndInject() {
    const observer = new MutationObserver(() => {
        const cartBox = document.querySelector('.shadow-sm.rounded-3.border');
        if (cartBox) {
            observer.disconnect();
            injectCourseButtons(cartBox);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

window.onload = function () {
    waitForTargetAndInject();
};
