import pytest
import json
from app import app # Import Flask app
import mongomock # import mongomock

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
        client (_type_): Mock db client and mock db
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
        client (_type_): Mock db client and mock db
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
    assert responseJSON["error"] == "Email and password are required"