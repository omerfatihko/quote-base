import pytest
import json
from app import app # Import Flask app
import mongomock # import mongomock
from bson import ObjectId
import bcrypt

@pytest.fixture
def client():
    """Setup Flask test client with testing config

    Yields:
        client: Flask test client
        mockDb: Mock db
    """    
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret-key"
    
    # Create a mock database using mongomock
    mockDb = mongomock.MongoClient()["quote-base"]
    app.db = mockDb # Inject the mock db into the app
    
    # Create a unique index for email
    mockDb["users"].create_index("email", unique=True)
    
    with app.test_client() as client:
        yield client, mockDb # Return both client and the mock database

def testRegisterSuccess(client):
    """Test successful registration of a user

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Mock data for testing
    userData = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = client.post(
        "/register",
        data= json.dumps(userData),
        content_type= "application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 200
    assert responseJSON["message"] == "Registration successful!"
    assert mockDb["users"].find_one({"email": "test@example.com"}) is not None # Verify user added to db
    
def testRegisterExistingUser(client):
    """Test attempting to register an existing user

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user into the mock database
    mockDb["users"].insert_one({"email": "test@example.com", "password": "hashedPass"})
    
    # Attempt to register the same user
    userData = {
        "email": "test@example.com",
        "password": "newpassword123"
    }
    
    response = client.post(
        "/register",
        data= json.dumps(userData),
        content_type= "application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "This account already exists"

def testRegisterMissingFields(client):
    """Test registration with password missing

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    # Missing password
    userData = {"email": "test@example.com"}
    
    response = client.post(
        "/register", 
        data=json.dumps(userData), 
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Password must be at least 8 characters long and contain no spaces"

def testRegisterInvalidEmail(client):
    """Test registration with invalid email

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    # Mock data for testing
    userData = {
        "email": "invalidEmail",
        "password": "validPass123"
    }
    
    response = client.post(
        "/register",
        data= json.dumps(userData),
        content_type= "application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Invalid email format"

def testRegisterInvalidPassword(client):
    """Test registration with invalid password

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    # Mock data for testing
    userData = {
        "email": "test@example.com",
        "password": "short"
    }
    
    response = client.post(
        "/register",
        data= json.dumps(userData),
        content_type= "application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Password must be at least 8 characters long and contain no spaces"

def testHomeRedirectIfNotLoggedIn(client):
    """Test that unauthorized users are redirected to the login page

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    response = client.get("/home")
    
    # Assertions
    assert response.status_code == 302 # 302 Found (redirection)
    assert response.location.endswith("/") # Redirects to the root

def testHomeWithValidSession(client):
    """Test that the home page is rendered for logged-in users with quotes

    Args:
        client (_type_): Mock db and client
    """    
    client, mockDb = client # Unpack client and mock database
    
    # Mock session data
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock database data
    mockDb["quotes"].insert_many([
        {"_id": ObjectId(), "userEmail": "test@example.com", "quote": "Test Quote 1"},
        {"_id": ObjectId(), "userEmail": "test@example.com", "quote": "Test Quote 2"},
    ])
    
    response = client.get("/home")
    
    # Assertions
    assert response.status_code == 200
    # Check that quotes are passed correctly to the template
    responseData = response.data.decode("utf-8")
    assert "Test Quote 1" in responseData
    assert "Test Quote 2" in responseData

def testLoginSuccess(client):
    """Test successful login of a user

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Add a mock user to the db
    email = "test@example.com"
    password = "password123"
    hashedPassword = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    mockDb["users"].insert_one({
        "email": email,
        "password": hashedPassword,
        "lastLogin": None
    })
    
    # Mock login data
    loginData = {
        "email": email,
        "password": password
    }
    
    response = client.post(
        "/login",
        data=json.dumps(loginData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 200
    assert responseJSON["message"] == "Login successful!"
    assert mockDb["users"].find_one({"email": email})["lastLogin"] is not None

def testLoginMissingFields(client):
    """Test login attempt with missing fields

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Missing email
    response = client.post(
        "/login",
        data=json.dumps({"password": "password123"}),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    assert response.status_code == 400
    assert responseJSON["error"] == "Email and password are required"
    
    # Missing password
    response = client.post(
        "/login",
        data=json.dumps({"email": "test@example.com"}),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    assert response.status_code == 400
    assert responseJSON["error"] == "Email and password are required"

def testLoginNonexistentUser(client):
    """Test login attempt with an email that does not exists

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Mock login data for a non-existent user
    loginData = {
        "email": "nonexistent@example.com",
        "password": "password123"
    }
    
    response = client.post(
        "/login",
        data=json.dumps(loginData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    assert response.status_code == 400
    assert responseJSON["error"] == "Invalid email or password"

def testLoginWrongPassword(client):
    """Test login attempt with the wrong password

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Add a mock user to the database
    email = "test@example.com"
    correctPassword = "correctPassword"
    hashedPassword = bcrypt.hashpw(correctPassword.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    mockDb["users"].insert_one({
        "email": email,
        "password": hashedPassword
    })
    
    # Mock login data with the wrong password
    loginData = {
        "email": email,
        "password": "wrongPassword"
    }
    
    response = client.post(
        "/login",
        data=json.dumps(loginData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    assert response.status_code == 400
    assert responseJSON["error"] == "Invalid email or password"

def testGetQuoteLimitSuccess(client):
    """Test successful fetching of quote limits for a logged-in user

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Mock user data
    email = "test@example.com"
    mockDb["users"].insert_one({
        "email": email,
        "quotesRemaining": 73,
        "totalQuotes": 100
    })
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = email
    
    # Send GET request to the endpoint
    response = client.get("/get-quote-limit")
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 200
    assert responseJSON["remainingQuotes"] == 73
    assert responseJSON["totalQuotes"] == 100

def testGetQuoteLimitUnauthorized(client):
    """Test accessing the endpoint without logging in

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Send GET request without a session
    response = client.get("/get-quote-limit")
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 401
    assert responseJSON["error"] == "Unauthorized access. Please log in."

def testGetQuoteLimitUserNotFound(client):
    """Test accessing the endpoint when the user is not in the database

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate a session with a non-existent user
    with client.session_transaction() as session:
        session["user"] = "nonexistent@example.com"
    
    # Send GET request
    response = client.get("/get-quote-limit")
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 401
    assert responseJSON["error"] == "User not found. Please log in again."

def testGetQuoteLimitServerError(client):
    """Test handling an unexpected server error

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Simulate a server error by causing a database failure (by overriding find_one)
    mockDb["users"].find_one = lambda *args, **kwargs: (_ for _ in ()).throw(Exception("Mocked DB error"))
    
    # Send GET request
    response = client.get("/get-quote-limit")
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 500
    assert responseJSON["error"] == "An error occurred. Please try again."