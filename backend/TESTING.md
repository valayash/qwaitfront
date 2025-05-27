# Testing QWait with Multiple Users

This document provides instructions for testing the QWait application with multiple users, both for manual testing and automated load testing.

## Prerequisites

- QWait application running with PostgreSQL
- Python virtual environment set up
- Required packages installed:
  ```
  pip install locust
  ```

## 1. Setting Up Test Users

First, create test users by running:

```bash
python create_test_users.py
```

This will create:
- A staff user (`teststaff`) with a test restaurant
- 5 customer users (`customer1` through `customer5`)
- All users have the password `password123`

## 2. Manual Testing Methods

### Local Testing with Multiple Browsers

This approach is useful for testing basic interactions:

1. **Open multiple browser types** (Chrome, Firefox, Safari)
2. **Use Incognito/Private windows** in the same browser
3. **Log in with different user accounts** in each window
4. **Test interactions** between accounts:
   - Staff adds people to waitlist in one window
   - Customer joins queue in another window 
   - Watch real-time updates across windows

### Network Testing

To test with real devices on the same network:

1. **Make your development server visible on the network**:
   ```
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Find your computer's local IP address**:
   ```
   ifconfig | grep inet   # On macOS/Linux
   ipconfig               # On Windows
   ```

3. **Access QWait from other devices** using:
   ```
   http://YOUR_IP_ADDRESS:8000
   ```

4. **Log in with different test accounts** on each device

## 3. Automated Load Testing with Locust

Locust allows you to simulate hundreds of users interacting with your application simultaneously.

### Running the Load Test

1. **Start the Locust server**:
   ```
   locust -H http://localhost:8000
   ```

2. **Open the Locust web interface** at http://localhost:8089

3. **Configure and start your test**:
   - Number of users: Start with 10-50
   - Spawn rate: 1-5 users per second
   - Host: Should already be set to your application URL

4. **Monitor the test results** in real-time:
   - Request statistics
   - Response times
   - Failure rates

5. **Adjust user types** in `locustfile.py` to simulate different behaviors

### Customizing the Load Test

The default `locustfile.py` includes:
- `RestaurantStaffUser`: Simulates staff managing the waitlist and reservations
- `CustomerUser`: Simulates customers joining the waitlist

You can modify the tasks and weights in the file to test specific scenarios.

## 4. Testing Real-time Features

QWait uses Socket.IO for real-time updates. To specifically test these features:

1. **Open multiple browser windows** side by side
2. **Log in as staff in one window** and as a customer in another
3. **Track these key interactions**:
   - When staff adds someone to the waitlist, it should appear for all users
   - When a reservation is checked in, it should appear at the top of the waitlist
   - When someone is marked as served, they should be removed from all users' views

## 5. Performance Monitoring

While testing, monitor:

1. **Django development server output** for errors and slow requests
2. **Browser console** for JavaScript errors
3. **Database queries** (consider Django Debug Toolbar for this)
4. **Memory usage** on your server

## 6. Production Testing

Before going to production:

1. **Configure for production** in `settings.py`:
   - Set `DEBUG = False`
   - Configure proper `ALLOWED_HOSTS`
   - Use environment variables for sensitive settings

2. **Use a proper web server**:
   - Gunicorn or uWSGI for the application
   - Nginx or Apache as a reverse proxy
   - Redis for the channel layer instead of in-memory

3. **Test the production configuration** with a small number of users first

## Troubleshooting

- **Socket.IO Connection Issues**: Ensure the correct Socket.IO version is used between client and server
- **Database Locks**: PostgreSQL handles concurrent requests better than SQLite, but watch for lock timeouts
- **CSRF Token Errors**: Ensure proper CSRF handling for AJAX requests
- **Session Consistency**: Check for session-related issues when testing with multiple users 