from flask import Flask, jsonify, render_template, request, session, redirect
from flask_pymongo import PyMongo
from flask_cors import CORS

import bcrypt
from datetime import datetime, timedelta, timezone 
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") # Used for session management
# app.config["SESSION_COOKIE_SECURE"] = True  # Send cookies only over HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = True  # Prevent client-side JavaScript access
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes= 30)  # Set session lifetime
# session.permanent = True  # Mark all sessions as permanent


mongo = PyMongo(app)
CORS(app)

@app.before_request
def makeSessionPermanent():
    session.permanent = True

@app.route("/home")
def home():
    if "user" in session: # Check if the user is logged in
        userEmail = session["user"]
        
        # Connect to MongoDB
        db = mongo.cx["quote-base"]
        quotesCollection = db["quotes"]
        
        #Fetch all quotes for the logged-in user
        userQuotes = list(quotesCollection.find({"userEmail": userEmail}, {"userEmail": 0}))
        for quote in userQuotes:
            quote["_id"] = str(quote["_id"]) # Convert ObjectId to string for JSON serialization
        
        return render_template("index.html", email=userEmail, quotes= userQuotes)
    
    return redirect("/") # Redirect to register page if not logged in

@app.route("/")
def registerPage():
    return render_template("register.html")

@app.route("/register", methods=["POST"])
def register():
    try:
        # Parse incoming JSON data
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Connect to MongoDB collections
        db = mongo.cx["quote-base"]
        userCollection = db["users"]
        userCollection.create_index("email", unique=True)
        
        # Check if user already exists
        existingUser = userCollection.find_one({"email": email})
        if existingUser:
            return jsonify({"error": "This account already exists"}), 400
        
        # Hash and salt the password
        hashedPassword = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        
        # Create a new user object
        user = {
            "email": email,
            "password": hashedPassword.decode("utf-8"), # store as a string
            "quotesRemaining": 100, #default quote limit, 100
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "lastLogin": datetime.now(timezone.utc)
        }
        
        # Insert new user into the database
        userCollection.insert_one(user)
        
        # Set session data
        session["user"] = email
        
        # Log success for debugging
        print(f"New user registered: {email}")
        
        # Redirect to the home page
        return jsonify({"message": "Registration successful!"}), 200
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": "Something went wrong"}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        # Parse incoming JSON data
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Connect to MongoDB collections 
        db = mongo.cx["quote-base"]
        userCollection = db["users"]
        
        # Find the user in the database by email
        existingUser = userCollection.find_one({"email": email})
        if not existingUser:
            return jsonify({"error": "Invalid email or password"}), 400
        
        # Verify the password
        if not bcrypt.checkpw(password.encode("utf-8"), existingUser["password"].encode("utf-8")):
            return jsonify({"error": "Invalid email or password"}), 400
        
        # Update last login time
        userCollection.update_one(
            {"email": email},
            {"$set": {"lastLogin": datetime.now(timezone.utc)}}
        )
        
        # Set session data
        session["user"] = email
        
        # Log success for debugging
        print(f"User logged in: {email}")
        
        # Redirect to the home page
        return jsonify({"message": "Login successful!"}), 200
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": "Something went wrong"}), 500

@app.route("/add-quote", methods=["POST"])
def addQuote():
    try:
        # Ensure the user is logged in
        if "user" not in session:
            return jsonify({"error": "Unauthorized access. Please log in."}), 401
        
        # Parse incoming JSON data
        data = request.get_json()
        bookSeries = data.get("bookSeries")
        bookTitle = data.get("bookTitle")
        characters = data.get("characters")
        quote = data.get("quote")
        author = data.get("author")
        
        # Basic validations
        if not bookTitle or not quote or not author:
            return jsonify({"error": "Book title, quote, and author are mandatory fields."}), 400
        
        # Connect to MongoDB
        db = mongo.cx["quote-base"]
        quotesCollection = db["quotes"]
        userCollection = db["users"]
        userEmail = session["user"]
        
        # Get user data to check quotesRemaining
        user = userCollection.find_one({"email": userEmail})
        if not user:
            session.pop("user", None) # User not found in DB; end the session and log them out
            return jsonify({"error": "User not found. Please log in again."}), 401
        if user["quotesRemaining"] <= 0:
            return jsonify({"error": "Quote limit reached. Upgrade to add more quotes."}), 403
        
        # Check for duplicate quotes for the user
        duplicate = quotesCollection.find_one({
            "userEmail": userEmail,
            "bookSeries": bookSeries,
            "bookTitle": bookTitle,
            "characters": characters,
            "quote": quote,
            "author": author,
        })
        if duplicate:
            return jsonify({"error": "Duplicate quote detected."}), 400
        
        # Create a new quote object
        newQuote = {
            "userEmail": userEmail,
            "bookSeries": bookSeries,
            "bookTitle": bookTitle,
            "characters": characters,
            "quote": quote,
            "author": author,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        
        # Insert the new quote
        quotesCollection.insert_one(newQuote)
        
        # Update user's quotesRemaining
        userCollection.update_one(
            {"email": userEmail},
            {"$inc": {"quotesRemaining": -1}, "$set": {"updatedAt": datetime.now(timezone.utc)}}
        )
        
        # Fetch all quotes for the user and return them
        userQuotes = list(quotesCollection.find({"userEmail": userEmail}, {"userEmail": 0}))
        for quoteBlock in userQuotes:
            quoteBlock["_id"] = str(quoteBlock["_id"]) # Convert ObjectId to string for JSON serialization
            
        return jsonify({"message": "Quote added successfully!", "quotes": userQuotes}), 200
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": "Something went wrong"}), 500

@app.route("/logout", methods= ["GET"])
def logout():
    session.pop("user", None) # Remove user session
    return redirect("/") # Redirect to the register page

if __name__ == "__main__":
    app.run(debug=True)
    
# TODO test connection without adding any data