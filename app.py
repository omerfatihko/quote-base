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
        return render_template("index.html", email=session["user"])
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
            "updatedAt": datetime.now(timezone.utc)
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

@app.route("/logout", methods= ["GET"])
def logout():
    session.pop("user", None) # Remove user session
    return redirect("/") # Redirect to the register page

if __name__ == "__main__":
    app.run(debug=True)
    
# TODO test connection without adding any data