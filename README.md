# Quote-Base v2.0

**Quote-Base** is an advanced, beginner-to-intermediate-level web application for managing your favorite book quotes. It provides seamless functionality for adding, editing, searching, sorting, and deleting quotes, complete with session handling, pagination, and database integration (MongoDB). Designed to showcase full-stack development skills, it includes robust front-end and back-end implementations.

---

## Features

### 1. **User Authentication and Session Management**

- **User Registration:** Register with email and password, with duplicate checks and secure password hashing (bcrypt).
- **Login/Logout:** Secure login with hashed password validation and session-based authentication.
- **Session Management:** Automatic session timeout after 30 minutes of inactivity for added security.
- **User-Specific Data:** Quotes are managed on a per-user basis, ensuring personalized experiences.

### 2. **Quote Management**

- Add new quotes with the following fields:
  - Book Series
  - Book Title (Required)
  - Characters
  - Quote (Required)
  - Author (Required)
- Edit or delete existing quotes with validations and duplicate checks.

### 3. **Search and Filter**

- Search for quotes globally or filter by specific fields (e.g., Author, Book Title).
- Case-insensitive keyword matching.
- Dynamic updates to the table based on search results.

### 4. **Sorting**

- Sort quotes by any column in ascending or descending order.
- Sorting updates dynamically with paginated results.

### 5. **Pagination**

- Efficient navigation with user-defined quotes per page.
- Displays current page and total pages (e.g., 2/3).

### 6. **Character Limit Indicators**

- Displays the number of characters remaining for input fields.
- Prevents exceeding maximum input limits.

### 7. **Responsive Design**

- Optimized for various screen sizes:
  - Automatically adjusts column visibility and element layout for smaller screens.
  - Uses CSS media queries for responsive design.

### 8. **Pop-Up Messages**

- Inform users of features under development (e.g., Change Password, Forgot Password).
- Display the user's remaining quote limit when they click the "Upgrade Account" button.

### 9. **Database Integration**

- MongoDB integration for persistent storage of user and quote data.
- Secure handling of sensitive user data with hashed passwords.
- Session-based quote retrieval and updates.

### 10. **Enhanced Security**

- Implements basic web security practices:
  - Session cookies are HTTP-only to prevent client-side access.
  - User email and sensitive data are excluded from client-side responses.

---

## Technologies Used

### **Front-End**

- **HTML5:** Structure of the app.
- **CSS3:** Styling, animations, and responsive design.
- **JavaScript:** Dynamic updates, event handling, and API integration.

### **Back-End**

- **Flask:** Python-based web framework for server-side logic and routing.
- **Flask-PyMongo:** MongoDB integration.
- **Bcrypt:** For secure password hashing.
- **Flask-CORS:** For enabling cross-origin resource sharing.

### **Database**

- **MongoDB:** Persistent data storage with collections for users and quotes.

---

## How to Use

### **Prerequisites**

1. **Python 3.8+**
2. **MongoDB Instance** (e.g., MongoDB Atlas or local MongoDB)

### **Installation**

1. Clone the repository:

   ```bash
   git clone https://github.com/omerfatihko/quote-base.git
   cd quote-base
   ```

2. Set up a virtual environment and install dependencies:

   ```bash
   python -m venv venv
   source venv/bin/activate  # For Linux/Mac
   venv\Scripts\activate     # For Windows
   pip install -r requirements.txt
   ```

3. Set up environment variables: Create a `.env` file based on the provided `.mockenv` file:

   ```env
   FLASK_APP=app.py
   FLASK_ENV=development
   MONGO_URI=mongodb+srv://<your_username>:<your_password>@<your_cluster_name>.dygad.mongodb.net/?retryWrites=true&w=majority&appName=<your_app_name> # MongoDB Connection String
   SECRET_KEY=<your_secret_key>
   ```

4. Run the app:

   ```bash
   flask run
   ```

5. Access the app at `http://127.0.0.1:5000`

---

## Future updates

This project is a work in progress, with planned enhancements including:

1. **Forgot Password:** Functionality to reset passwords via email.
2. **Change Password:** Enable users to change their existing passwords securely.
3. **Upgrade Account:** Allow users to increase their quote limits with subscription plans.
4. **Web Security Enhancements:**
   - Cross-Site Request Forgery (CSRF) protection.
   - HTTPS with secure cookies.
   - stricter Content Security Policies (CSP).
5. **Export/Import Quotes:** Ability to download and upload quotes in JSON or CSV format.

---

## License

This project is licensed under the [MIT License](/LICENSE.txt)

---

## Acknowledgements

- Background image by [Pawel Czerwinski](https://unsplash.com/@pawel_czerwinski?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/photos/a-close-up-of-a-pattern-of-wavy-shapes-_x16XKBPBwE?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash)
- Icons used for Github, LinkedIn, and Gmail links.
