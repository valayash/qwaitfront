# QWait - Restaurant Waitlist & Reservation Management System

QWait is a comprehensive restaurant management system designed to streamline waitlist and reservation management. The application helps restaurants efficiently manage their customer queues, handle reservations, and provide excellent service.

## Features

### Waitlist Management
- **Digital Waitlist**: Replace traditional pen-and-paper waitlists with a digital solution
- **QR Code Check-in**: Allow customers to join the waitlist by scanning a QR code
- **Priority Management**: Automatically places checked-in reservations at the top of the waitlist
- **Visual Indicators**: Clearly identifies entries that originated from reservations
- **Real-time Updates**: Instantly updates the waitlist when new parties join or are served
- **Custom View**: Configurable columns to display the information that matters most

### Reservation System
- **Reservation Calendar**: View all upcoming reservations organized by date
- **Quick Check-in**: Seamlessly check in customers with existing reservations
- **Reservation Management**: Add, edit, and delete reservations with ease
- **Party Size Selection**: Visual interface for selecting party sizes

### Dashboard & Analytics
- **Queue Overview**: See at a glance how many parties are waiting
- **Recently Served**: Track recently served customers
- **Party History**: Keep a record of all parties served

## Technology Stack

- **Backend**: Django (Python)
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Real-time Updates**: Socket.IO for instant waitlist updates
- **Database**: PostgreSQL
- **Authentication**: Django's built-in authentication system

## Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git
- PostgreSQL (version 12 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/qwait.git
   cd qwait
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up PostgreSQL:
   - Install PostgreSQL if not already installed:
     - For Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
     - For macOS (using Homebrew): `brew install postgresql`
     - For Windows: Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)
   
   - Create a database and user:
     ```
     sudo -u postgres psql
     postgres=# CREATE DATABASE qwait_db;
     postgres=# CREATE USER qwait_user WITH PASSWORD 'qwait_password';
     postgres=# ALTER ROLE qwait_user SET client_encoding TO 'utf8';
     postgres=# ALTER ROLE qwait_user SET default_transaction_isolation TO 'read committed';
     postgres=# ALTER ROLE qwait_user SET timezone TO 'UTC';
     postgres=# GRANT ALL PRIVILEGES ON DATABASE qwait_db TO qwait_user;
     postgres=# \q
     ```

5. Apply migrations:
   ```
   python manage.py migrate
   ```

6. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```
   python manage.py runserver
   ```

8. Navigate to http://127.0.0.1:8000/ in your browser to access the application.

## Migrating from SQLite to PostgreSQL

If you're migrating an existing QWait installation from SQLite to PostgreSQL:

1. Install the PostgreSQL adapter for Python:
   ```
   pip install psycopg2-binary
   ```

2. Create a PostgreSQL database and user as described in the installation steps above.

3. Update your database settings in `Qwait/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'qwait_db',
           'USER': 'qwait_user',
           'PASSWORD': 'qwait_password',  # Use a secure password in production
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

4. Export data from SQLite (optional, if you have existing data):
   ```
   python manage.py dumpdata --exclude contenttypes --exclude auth.permission > data_dump.json
   ```

5. Apply migrations to the new PostgreSQL database:
   ```
   python manage.py migrate
   ```

6. Import data into PostgreSQL (if you exported data in step 4):
   ```
   python manage.py loaddata data_dump.json
   ```

7. Verify the migration:
   ```
   python manage.py runserver
   ```
   And check that all your existing data is available.

## Key Workflows

### Waitlist Management
1. Restaurant staff can add walk-in parties to the waitlist
2. Customers can join the queue by scanning a QR code
3. Staff can mark parties as served or remove them from the queue
4. Staff can edit party details as needed

### Reservation Management
1. Create reservations for future dates and times
2. When customers with reservations arrive, check them in with a single click
3. Checked-in reservations automatically appear at the top of the waitlist
4. Visual indicators clearly show which waitlist entries came from reservations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or feature requests, please open an issue on the GitHub repository. 

