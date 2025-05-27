document.addEventListener('DOMContentLoaded', function() {
    setupSorting();
    addPartyModal();
    setupModal();
});
function addPartyModal(){
    const sizeButtons = document.querySelectorAll('.size-btn');
    const peopleCountInput = document.getElementById('people_count');
    const quotedTimeInput = document.getElementById('quoted_time');
    const adjustTimeButtons = document.querySelectorAll('.adjust-time-btn');

    // Handle size selection
    sizeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            sizeButtons.forEach((btn) => btn.classList.remove('selected'));
            button.classList.add('selected');
            peopleCountInput.value = button.dataset.size;
        });
    });

    // Adjust quoted time
    adjustTimeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const modify = parseInt(button.dataset.modify);
            const currentValue = parseInt(quotedTimeInput.value || 0);
            quotedTimeInput.value = Math.max(0, currentValue + modify);
        });
    });
}
function setupSorting() {
    const headers = document.querySelectorAll('th[data-sort-field]');
    let currentSortField = 'arrival';
    let sortOrder = 'asc';

    headers.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            const clickedField = header.getAttribute('data-sort-field');

            if (currentSortField === clickedField) {
                sortOrder = (sortOrder === 'asc') ? 'desc' : 'asc';
            } else {
                currentSortField = clickedField;
                sortOrder = 'asc';
            }

            fetchSortedEntries(currentSortField, sortOrder);
        });
    });
}

function fetchSortedEntries(field, order) {
    fetch(`/restaurant/api/queue-entries/?sort_field=${field}&sort_order=${order}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => updateQueueTable(data.queue_entries))
    .catch(error => console.error('Error fetching sorted data:', error));
}

function updateQueueTable(entries) {
    const tbody = document.querySelector('.queue-table tbody');
    tbody.innerHTML = '';

    entries.forEach(entry => {
        const row = `
            <tr>
                <td>${entry.pos}</td>
                <td>${entry.customer_name}</td>
                <td>${entry.size}</td>
                <td>${entry.notes || '-'}</td>
                <td>${entry.quoted_time ? entry.quoted_time + ' min' : '-'}</td>
                <td>${entry.arrival}</td>
                <td>${entry.wait_time} min</td>
                <td><button class="notify-btn"><i class="fas fa-bell"></i></button></td>
                <td>
                    <div class="action-buttons">
                        <form method="POST" action="restaurant/remove-entry/${entry.id}/">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                            <button type="submit" class="btn remove-btn"><i class="fas fa-times"></i></button>
                        </form>
                        <form method="POST" action="restaurant/mark-as-served/${entry.id}/">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${getCookie('csrftoken')}">
                            <button type="submit" class="btn served-btn"><i class="fas fa-check"></i></button>
                        </form>
                        <a href="/edit-entry/${entry.id}/" class="btn edit-btn"><i class="fas fa-edit"></i></a>
                    </div>
                </td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            c = c.trim();
            if (c.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(c.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


// Open the Edit Modal with pre-filled details
function openEditModal(entryId) {
    // console.print(`Edit button clicked for entry ID: ${entryId}`);
    const modal = document.querySelector('#addPartyModal');
    const form = modal.querySelector('#add-party-form');

    // Fetch existing entry data by ID
    fetch(`/restaurant/get-entry/${entryId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Pre-fill the form with existing details
        console.log(`Data Fetched now assigning: ${entryId}`);
        form.action = `/restaurant/edit-party/${entryId}/`; // Update form action for editing
        form.querySelector('#name').value = data.customer_name;
        form.querySelector('#phone').value = data.phone_number;
        form.querySelector('#people_count').value = data.people_count;
        form.querySelector('#quoted_time').value = data.quoted_time || ''; // Handle null quoted_time
        form.querySelector('#notes').value = data.notes || ''; // Handle null notes

        console.log(`Now form showing ${entryId}`);
        // Open the modal
        modal.style.display = 'flex';
    })
    .catch(error => console.error('Error fetching entry details:', error));
}


function setupModal() {
    const modal = document.querySelector('#addPartyModal');
    const closeModalBtn = modal.querySelector('.modal-close');
    const form = modal.querySelector('#add-party-form');
    const queueTableBody = document.querySelector('.queue-table tbody');

    // Close modal
    closeModalBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle form submission
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(form);
        const url = form.action;

        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
    });
}
