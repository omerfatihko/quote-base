import pytest
import json
from app import app, characterSpamLimit # Import Flask app
import mongomock # import mongomock
from bson import ObjectId
import bcrypt
from datetime import datetime, timezone

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
    
    # Simulate logged-in session
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

def testAddQuoteSuccess(client):
    """Test successful addition of a quote.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user with remaining quote limit
    mockDb["users"].insert_one({
        "email": "test@example.com",
        "quotesRemaining": 10,
        "totalQuotes": 100,
        "password": "hashedPassword",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    })
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock quote data
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "Test Book",
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    }
    
    # Send the POST request
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 200
    assert responseJSON["message"] == "Quote added successfully!"
    assert len(responseJSON["quotes"]) == 1  # Check if the quote list has one quote
    assert mockDb["users"].find_one({"email": "test@example.com"})["quotesRemaining"] == 9

def testAddQuoteUnauthorized(client):
    """Test accessing the endpoint without logging in

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Mock quote data
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "Test Book",
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    }
    
    # Send the POST request without logging in
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 401
    assert responseJSON["error"] == "Unauthorized access. Please log in."

def testAddQuoteMissingFields(client):
    """Test adding a quote with missing mandatory fields.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock quote data with missing fields
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "",
        "characters": "Test Character",
        "quote": "",
        "author": "",
    }
    
    # Send the POST request
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Book title, quote, and author are mandatory fields."

def testAddQuoteCharacterSpamLimitReached(client):
    """Test adding a quote with fields longer than allowed limit.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock quote data with fields longer than limit
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "x" * (characterSpamLimit + 1),
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    }
    
    # Send the POST request
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == f"Any field should not be longer than {characterSpamLimit} characters."

def testAddQuoteDuplicate(client):
    """Test adding a duplicate quote.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user and a quote
    mockDb["users"].insert_one({
        "email": "test@example.com",
        "quotesRemaining": 10,
    })
    mockDb["quotes"].insert_one({
        "userEmail": "test@example.com",
        "bookSeries": "Test Series",
        "bookTitle": "Test Book",
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    })
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock duplicate quote data
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "Test Book",
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    }
    
    # Send the POST request
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Duplicate quote detected."

def testAddQuoteLimitReached(client):
    """Test adding a quote when the user's quote limit is reached.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user with no remaining quote limit
    mockDb["users"].insert_one({
        "email": "test@example.com",
        "quotesRemaining": 0,
    })
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock quote data
    quoteData = {
        "bookSeries": "Test Series",
        "bookTitle": "Test Book",
        "characters": "Test Character",
        "quote": "This is a test quote.",
        "author": "Test Author",
    }
    
    # Send the POST request
    response = client.post(
        "/add-quote",
        data=json.dumps(quoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 403
    assert responseJSON["error"] == "Quote limit reached. Upgrade to add more quotes."

def testEditQuoteSuccess(client):
    """Test successful quote update.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user and a quote
    mockDb["users"].insert_one({"email": "test@example.com", "quotesRemaining": 10})
    quoteId = mockDb["quotes"].insert_one({
        "userEmail": "test@example.com",
        "bookSeries": "Old Series",
        "bookTitle": "Old Book",
        "characters": "Old Character",
        "quote": "Old quote",
        "author": "Old Author",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }).inserted_id
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock updated quote data
    updatedQuoteData = {
        "bookSeries": "New Series",
        "bookTitle": "New Book",
        "characters": "New Character",
        "quote": "New quote",
        "author": "New Author",
    }
    
    # Send the PUT request
    response = client.put(
        f"/edit-quote/{quoteId}",
        data=json.dumps(updatedQuoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 200
    assert responseJSON["message"] == "Quote updated successfully!"
    updatedQuote = mockDb["quotes"].find_one({"_id": ObjectId(quoteId)})
    assert updatedQuote["quote"] == "New quote"

def testEditQuoteUnauthorized(client):
    """Test unauthorized access (user not logged in)

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Mock updated quote data
    updatedQuoteData = {
        "bookSeries": "New Series",
        "bookTitle": "New Book",
        "characters": "New Character",
        "quote": "New quote",
        "author": "New Author",
    }
    quoteId = str(ObjectId())
    
    # Send the PUT request
    response = client.put(
        f"/edit-quote/{quoteId}",
        data=json.dumps(updatedQuoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 401
    assert responseJSON["error"] == "Unauthorized access. Please log in."

def testEditQuoteMissingFields(client):
    """Test updating a quote with missing mandatory fields.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock updated quote data with missing fields
    updatedQuoteData = {
        "bookSeries": "New Series",
        "bookTitle": "  ", # only white space, should not be accepted
        "characters": "New Character",
        "quote": "  ",
        "author": " ",
    }
    quoteId = str(ObjectId())
    
    # Send the PUT request
    response = client.put(
        f"/edit-quote/{quoteId}",
        data=json.dumps(updatedQuoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == "Book title, quote, and author are mandatory fields."

def testEditQuoteCharacterSpamLimitReached(client):
    """Test updating a quote with fields longer than allowed limit.

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock updated quote data
    updatedQuoteData = {
        "bookSeries": "New Series",
        "bookTitle": "x" * (characterSpamLimit + 1),
        "characters": "New Character",
        "quote": "New quote",
        "author": "New Author",
    }
    quoteId = str(ObjectId())
    
    # Send the PUT request
    response = client.put(
        f"/edit-quote/{quoteId}",
        data=json.dumps(updatedQuoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 400
    assert responseJSON["error"] == f"Any field should not be longer than {characterSpamLimit} characters."

def testEditQuoteNotFound(client):
    """Test updating a non-existing quote..

    Args:
        client (_type_): Mock db and client
    """
    client, mockDb = client # Unpack client and mock database
    
    # Insert a user
    mockDb["users"].insert_one({"email": "test@example.com", "quotesRemaining": 10})
    
    # Simulate logged-in session
    with client.session_transaction() as session:
        session["user"] = "test@example.com"
    
    # Mock updated quote data
    updatedQuoteData = {
        "bookSeries": "New Series",
        "bookTitle": "New Book",
        "characters": "New Character",
        "quote": "New quote",
        "author": "New Author",
    }
    quoteId = str(ObjectId())
    
    # Send the PUT request
    response = client.put(
        f"/edit-quote/{quoteId}",
        data=json.dumps(updatedQuoteData),
        content_type="application/json"
    )
    responseJSON = response.get_json()
    
    # Assertions
    assert response.status_code == 404
    assert responseJSON["error"] == "Quote not found or unauthorized"