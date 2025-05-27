# Waitlist Management System

A real-time restaurant waitlist management application with Django backend and React frontend.

## System Components

### Backend

- **Django Server**: Main application backend running on port 8000
- **Socket.IO Server**: Real-time notification server running on port 3000

### Frontend

- **React Application**: User interface running on port 3001

## Socket.IO Server Management

The Socket.IO server is essential for real-time updates. Several tools are available to manage it:

### Socket.IO Server Manager

```bash
# Check server status
node socket_server_manager.js status

# Start the server
node socket_server_manager.js start

# Stop the server
node socket_server_manager.js stop

# Restart the server
node socket_server_manager.js restart
```

### Health Check

To quickly check if the Socket.IO server is running properly:

```bash
node check_socketio.js
```

## Setup and Running the Application

### Backend Setup

1. Set up Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Run Django migrations:
   ```bash
   python manage.py migrate
   ```

3. Start Django server:
   ```bash
   python manage.py runserver
   ```

4. Start Socket.IO server:
   ```bash
   node socket_server_manager.js start
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

## Troubleshooting

If you experience issues with real-time updates:

1. Check Socket.IO server status:
   ```bash
   node socket_server_manager.js status
   ```

2. Ensure the Django backend is configured correctly to communicate with the Socket.IO server.

3. Verify the frontend is connecting properly to the Socket.IO server using the browser's developer console. 