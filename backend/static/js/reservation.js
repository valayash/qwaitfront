document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('reservationModal');
    const addBtn = document.getElementById('addReservationBtn');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('reservationForm');
    const sizeOptions = document.querySelectorAll('.size-option');
    const partySizeInput = document.getElementById('party_size');
    const modalTitle = document.getElementById('modalTitle');
    const reservationIdInput = document.getElementById('reservationId');
    const confirmBtn = document.getElementById('confirmBtn');

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Select default party size (2)
    sizeOptions[1].classList.add('selected');
    
    // Open modal for adding new reservation
    addBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        // Reset form and set defaults
        document.getElementById('reservationForm').reset();
        document.getElementById('date').value = formatDate(new Date());
        selectPartySize(2);
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Handle party size selection
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const size = this.getAttribute('data-size');
            selectPartySize(size);
        });
    });
    confirmBtn.addEventListener('click', function() {
        // Submit the form
        document.getElementById('reservationForm').dispatchEvent(new Event('submit'));
    });
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const reservationId = reservationIdInput.value;
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            party_size: partySizeInput.value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            notes: document.getElementById('notes').value
        };
        
        // Format time for display
        const timeObj = new Date(`2000-01-01T${formData.time}`);
        formData.display_time = timeObj.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
        
        const url = reservationId 
            ? `/restaurant/edit-reservation/${reservationId}/` 
            : '/restaurant/add-reservation/';
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
    
    // Setup edit buttons
    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            editReservation(reservationId);
        });
    });
    
    // Setup delete buttons
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            deleteReservation(reservationId);
        });
    });
    
    // Helper functions
    function closeModal() {
        modal.style.display = 'none';
    }
    // Add this function to your reservation.js
    function formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
  
    function selectPartySize(size) {
        sizeOptions.forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`.size-option[data-size="${size}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            partySizeInput.value = size;
        }
    }
    
    function editReservation(id) {
        fetch(`/restaurant/get-reservation/${id}/`)
            .then(response => response.json())
            .then(data => {
                // Fill the form with reservation data
                document.getElementById('name').value = data.name;
                document.getElementById('phone').value = data.phone;
                selectPartySize(data.party_size);
                document.getElementById('date').value = data.date;
                document.getElementById('time').value = data.time;
                document.getElementById('notes').value = data.notes || '';
                
                // Set reservation ID and change modal title
                reservationIdInput.value = id;
                modalTitle.textContent = 'Edit reservation';
                
                // Open the modal
                modal.style.display = 'flex';
            })
            .catch(error => console.error('Error:', error));
    }
    
    function deleteReservation(id) {
        if (confirm('Are you sure you want to delete this reservation?')) {
            fetch(`/restaurant/delete-reservation/${id}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }
    
    // Get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
