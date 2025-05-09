function injectCourseButtons(containerBefore) {
    chrome.storage.local.get(['courses', 'starredCourses'], function (result) {
        let courses = result.courses || [];
        let starredCourses = result.starredCourses || {};

        // ONLY show courses for the quarter currently displayed
        const regQuarterEl = document.getElementById('reg-quarter');
        const currentQuarter = regQuarterEl
            ? (regQuarterEl.textContent.match(/\b(Winter|Spring|Summer|Autumn)\s+\d{4}\b/) || [])[0]
            : null;
        if (currentQuarter) {
            courses = courses.filter(course => course.includes(`(${currentQuarter})`));
        }

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

        // Label with icon above buttons
        const headerContainer = document.createElement('div');
        headerContainer.className = 'fw-bold mb-1 w-100';
        
        const icon = document.createElement('img');
        icon.src = 'https://lh3.googleusercontent.com/jzaAf6qJXnbeTRqE96InbSPDvKKrNkVJRm2kPZePLYZ9M_zmD1C9A4kHBHWsyKdiQjOrQVTda1_IChqOcODKwcU3wCc=s120';
        icon.alt = 'Icon';
        icon.style.marginRight = '0.5rem';
        icon.style.width = '40px';
        headerContainer.appendChild(icon);
        
        const label = document.createElement('span');
        label.textContent = 'Quick Add from Notify.UW:';
        headerContainer.appendChild(label);
        
        buttonContainer.appendChild(headerContainer);

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
