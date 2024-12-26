from flask import Flask, jsonify, render_template, request
from flask_pymongo import PyMongo
from flask_cors import CORS

import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["SECRET-KEY"] = os.getenv("SECRET_KEY")

mongo = PyMongo(app)
CORS(app)

@app.route("/home")
def home():
    return render_template("index.html")

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
        
        # Log the received data (for testing purposes)
        print(f"Received registration data: Email: {email}, Password: {password}")
        
        # Send a success response
        return jsonify({"message": "Registration successful!"}), 200
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": "Something went wrong"}), 500

@app.route("/test-db")
def testDb():
    try:
        # Explicitly access the 'quote-base' database and its 'users' collection
        db = mongo.cx["quote-base"]  # Access the 'quote-base' database
        usersCollection = db["users"]  # Access the 'users' collection

        # Test insertion
        testDoc = {"test_field": "test_value"}
        result = usersCollection.insert_one(testDoc)

        # Fetch inserted document
        insertedDoc = usersCollection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for JSON serialization
        if insertedDoc:
            insertedDoc["_id"] = str(insertedDoc["_id"])
        
        return {
            "message": "MongoDB connection successful!",
            "inserted_doc": insertedDoc
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True)
    
# TODO test connection without adding any data