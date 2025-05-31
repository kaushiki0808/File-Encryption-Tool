from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from cryptography.fernet import Fernet
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Generate and save a key
def generate_key():
    key = Fernet.generate_key()
    with open("key.key", "wb") as key_file:
        key_file.write(key)

# Load an existing key
def load_key():
    return open("key.key", "rb").read()

# Encrypt a file
def encrypt_file(filename, key):
    f = Fernet(key)
    with open(filename, "rb") as file:
        file_data = file.read()
    encrypted_data = f.encrypt(file_data)
    with open(filename, "wb") as file:
        file.write(encrypted_data)
    print(f"Encrypted {filename}")

# Decrypt a file
def decrypt_file(filename, key):
    f = Fernet(key)
    with open(filename, "rb") as file:
        encrypted_data = file.read()
    decrypted_data = f.decrypt(encrypted_data)
    with open(filename, "wb") as file:
        file.write(decrypted_data)
    print(f"Decrypted {filename}")


@app.route("/generate-key", methods=["POST"])
def api_generate_key():
    generate_key()
    return jsonify({"message": "Key generated and saved as key.key"})

@app.route("/encrypt", methods=["POST"])
def api_encrypt():
    if not os.path.exists("key.key"):
        return jsonify({"message": "Key not found. Please generate one first."}), 400
    if "file" not in request.files:
        return jsonify({"message": "No file provided."}), 400
    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    key = load_key()
    try:
        encrypt_file(filepath, key)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({"message": f"Encryption failed: {str(e)}"}), 500

@app.route("/decrypt", methods=["POST"])
def api_decrypt():
    if not os.path.exists("key.key"):
        return jsonify({"message": "Key not found. Please generate one first."}), 400
    if "file" not in request.files:
        return jsonify({"message": "No file provided."}), 400
    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    key = load_key()
    try:
        decrypt_file(filepath, key)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({"message": f"Decryption failed: {str(e)}"}), 500

@app.route("/file-details", methods=["POST"])
def api_file_details():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400
    file = request.files["file"]
    filename = secure_filename(file.filename)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    details = {
        "name": filename,
        "type": file.content_type or "Unknown",
        "size_kb": round(size / 1024, 2)
    }
    return jsonify(details)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
