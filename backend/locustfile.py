from locust import HttpUser, task, between
import random
import json

class RestaurantStaffUser(HttpUser):
    """Simulates restaurant staff users managing the waitlist and reservations"""
    wait_time = between(3, 8)  # Wait 3-8 seconds between tasks
    
    def on_start(self):
        """Login at the start of each simulated user session"""
        # Get login page first to get CSRF token
        response = self.client.get("/api/login/")
        
        # Extract CSRF token
        import re
        csrf_token = re.search(r"name='csrfmiddlewaretoken' value='([^']+)'", response.text)
        if csrf_token:
            csrf_token = csrf_token.group(1)
        else:
            csrf_token = ""
        
        # Log in with email instead of username
        response = self.client.post("/api/login/", {
            "email": "teststaff@example.com",
            "password": "password123",
            "csrfmiddlewaretoken": csrf_token
        })
        
        # Store cookies for subsequent requests
        self.client.cookies.update(response.cookies)
    
    @task(4)
    def view_waitlist(self):
        """Access the waitlist page"""
        self.client.get("/waitlist/")
    
    @task(3)
    def view_reservations(self):
        """Access the reservations page"""
        self.client.get("/reservations/")
    
    @task(2)
    def add_party_to_waitlist(self):
        """Add a new party to the waitlist"""
        # Get the CSRF token from cookies
        csrf_token = self.client.cookies.get('csrftoken', '')
        
        # Generate random party data
        party_data = {
            "customer_name": f"Test Customer {random.randint(1, 1000)}",
            "phone_number": f"+1{random.randint(1000000000, 9999999999)}",
            "people_count": random.randint(1, 8),
            "quoted_time": random.randint(10, 60),
            "notes": "Added via load test",
            "csrfmiddlewaretoken": csrf_token
        }
        
        # Submit the form
        self.client.post("/add-party/", 
                        party_data,
                        headers={"X-CSRFToken": csrf_token})
    
    @task(1)
    def add_reservation(self):
        """Add a new reservation"""
        # Get CSRF token
        csrf_token = self.client.cookies.get('csrftoken', '')
        
        # Generate a future date (1-7 days from now)
        import datetime
        future_date = (datetime.datetime.now() + 
                     datetime.timedelta(days=random.randint(1, 7))).strftime("%Y-%m-%d")
        
        # Random hour between 11 AM and 10 PM
        hour = random.randint(11, 22)
        minute = random.choice([0, 15, 30, 45])
        time = f"{hour}:{minute:02d}"
        
        # Reservation data
        reservation_data = {
            "name": f"Reservation {random.randint(1, 1000)}",
            "phone": f"+1{random.randint(1000000000, 9999999999)}",
            "party_size": random.randint(1, 8),
            "date": future_date,
            "time": time,
            "notes": "Created via load test",
            "request_id": f"{datetime.datetime.now().timestamp()}-{random.random()}"
        }
        
        # Submit as JSON since that's what the endpoint expects
        self.client.post("/restaurant/add-reservation/", 
                       json.dumps(reservation_data),
                       headers={
                           "X-CSRFToken": csrf_token,
                           "Content-Type": "application/json",
                           "X-Requested-With": "XMLHttpRequest"
                       })

class CustomerUser(HttpUser):
    """Simulates customers joining the waitlist"""
    wait_time = between(5, 15)  # Wait 5-15 seconds between tasks
    
    @task
    def join_queue(self):
        """Simulate a customer joining the queue via QR code"""
        # Get CSRF token from the join page first
        response = self.client.get("/restaurant/join-queue/1/")  # Adjust ID as needed
        
        # Extract CSRF token from the response
        import re
        csrf_token = re.search(r"name='csrfmiddlewaretoken' value='([^']+)'", response.text)
        if csrf_token:
            csrf_token = csrf_token.group(1)
        else:
            csrf_token = ""
        
        # Join queue data
        customer_data = {
            "customer_name": f"Walk-in Customer {random.randint(1, 1000)}",
            "phone_number": f"+1{random.randint(1000000000, 9999999999)}",
            "people_count": random.randint(1, 6),
            "csrfmiddlewaretoken": csrf_token
        }
        
        # Submit the form
        self.client.post("/restaurant/join-queue/1/", 
                        customer_data,
                        headers={"Referer": "/restaurant/join-queue/1/"}) 