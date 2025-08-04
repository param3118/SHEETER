document.addEventListener('DOMContentLoaded', () => {
    // Check if on a topic page
    const topicContainer = document.querySelector('.topic-details');
    if (!topicContainer) return;

    const topicName = topicContainer.getAttribute('data-topic');
    const questions = document.querySelectorAll('.question-item');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // Load state from local storage or create a new one
    const savedState = JSON.parse(localStorage.getItem(topicName)) || {};

    // Helper function to update the progress bar and count
    const updateProgress = () => {
        const allQuestions = Array.from(document.querySelectorAll('.question-item'));
        const completedQuestions = allQuestions.filter(q => {
            const status = q.querySelector('.status-dropdown').value;
            return status === 'solved' || status === 'review';
        });
        
        const totalCount = allQuestions.length;
        const completedCount = completedQuestions.length;
        
        const progressHeader = document.getElementById('progress-header');
        if (progressHeader) {
            progressHeader.textContent = `Progress: ${completedCount} / ${totalCount}`;
        }
    };
    
    // Restore state and attach listeners
    questions.forEach((question) => {
        const questionId = question.getAttribute('data-id');
        const state = savedState[questionId] || { status: 'not-started', notes: '' };

        // Status dropdown
        const statusDropdown = question.querySelector('.status-dropdown');
        statusDropdown.value = state.status;
        statusDropdown.className = `status-dropdown status-${state.status.replace(/\s/g, '-')}`;
        statusDropdown.addEventListener('change', (e) => {
            const newStatus = e.target.value;
            if (!savedState[questionId]) savedState[questionId] = {};
            savedState[questionId].status = newStatus;
            localStorage.setItem(topicName, JSON.stringify(savedState));
            e.target.className = `status-dropdown status-${newStatus.replace(/\s/g, '-')}`;
            filterQuestions();
            updateProgress();
        });

        // Notes textarea
        const notesToggle = question.querySelector('.notes-toggle');
        const notesContainer = question.querySelector('.notes-container');
        const notesTextarea = notesContainer.querySelector('textarea');
        notesTextarea.value = state.notes;
        notesTextarea.addEventListener('input', (e) => {
            if (!savedState[questionId]) savedState[questionId] = {};
            savedState[questionId].notes = e.target.value;
            localStorage.setItem(topicName, JSON.stringify(savedState));
        });
        notesToggle.addEventListener('click', () => {
            const isVisible = notesContainer.style.display === 'block';
            notesContainer.style.display = isVisible ? 'none' : 'block';
        });

        // Initialize state in savedState if it doesn't exist
        if (!savedState[questionId]) {
            savedState[questionId] = state;
        }
    });

    // Handle search and filter
    const filterQuestions = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterStatus = statusFilter.value;
        const subtopicElements = document.querySelectorAll('.accordion-item');

        subtopicElements.forEach(subtopic => {
            let hasVisibleQuestions = false;
            const subtopicQuestions = subtopic.querySelectorAll('.question-item');
            
            subtopicQuestions.forEach(question => {
                const questionTitle = question.querySelector('.question-link').textContent.toLowerCase();
                const questionStatus = question.querySelector('.status-dropdown').value;

                const matchesSearch = questionTitle.includes(searchTerm);
                const matchesStatus = filterStatus === 'all' || questionStatus === filterStatus;

                if (matchesSearch && matchesStatus) {
                    question.style.display = 'flex';
                    hasVisibleQuestions = true;
                } else {
                    question.style.display = 'none';
                }
            });

            // Show/hide the entire subtopic based on its questions
            if (hasVisibleQuestions) {
                subtopic.style.display = 'block';
            } else {
                subtopic.style.display = 'none';
            }
        });
    };

    searchInput.addEventListener('input', filterQuestions);
    statusFilter.addEventListener('change', filterQuestions);

    // Accordion functionality for subtopics
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isActive = header.classList.toggle('active');
            if (isActive) {
                content.style.display = "block";
            } else {
                content.style.display = "none";
            }
        });
    });

    // Export functionality
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        const data = localStorage.getItem(topicName);
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${topicName}-progress.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Progress exported successfully!');
        } else {
            alert('No data to export.');
        }
    });

    // Import functionality
    document.getElementById('importFile')?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                localStorage.setItem(topicName, JSON.stringify(importedData));
                alert('Import successful! Page will reload to apply changes.');
                location.reload();
            } catch (err) {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    });

    // Initial call to update progress on page load
    updateProgress();
});