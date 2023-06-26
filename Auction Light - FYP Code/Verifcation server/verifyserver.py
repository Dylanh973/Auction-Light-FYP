from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import numpy as np
import os
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)  # enable CORS for all routes

# Load the Haar Cascade classifier for face detection
cascade_file_path = os.path.join(
    cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
face_cascade = cv2.CascadeClassifier(cascade_file_path)


def detect_faces(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    return len(faces) > 0


def extract_expiry_date(text):
    # Find the date in the format "4b.28.11.09"
    pattern = r'\b4b\.(\d{2}\.\d{2}\.\d{2})\b'
    match = re.search(pattern, text)
    if match:
        expiry_date_str = match.group(1)
        expiry_date = datetime.strptime(expiry_date_str, '%d.%m.%y')
        return expiry_date
    return None


@app.route('/api/upload', methods=['POST'])
def upload_image():
    # Get the uploaded image file and document type from the request
    photo = request.files['photo']
    document_type = request.form['document_type']

    # Get the user's first name and last name from the request
    first_name = request.form['first_name']
    last_name = request.form['last_name']
    address_line1 = request.form['address_line1']
    city = request.form['city']
    first_name_upper = first_name.upper()
    last_name_upper = last_name.upper()
    address_line1_upper = address_line1.upper()
    city_upper = city.upper()

    # Process the image using OpenCV
    img = cv2.imdecode(np.fromstring(photo.read(), np.uint8), cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    tesseract_config = '--psm 6'
    text = pytesseract.image_to_string(gray, config=tesseract_config)

    # Define different expected_words based on document_type
    if document_type == "Driving licence":
        expected_words = [first_name_upper, last_name_upper, "DRIVING LICENCE",
                          address_line1_upper, city_upper, "ROAD SAFETY AUTHORITY"]
        expiry_date = extract_expiry_date(text)
        is_valid_id = all(word in text.upper()
                          for word in expected_words) and detect_faces(img) and expiry_date and expiry_date > datetime.now()
    elif document_type == "Passport":
        expected_words = [first_name_upper, last_name_upper, "PASSPORT"]
        first_name_count = text.upper().count(first_name_upper)
        last_name_count = text.upper().count(last_name_upper)
        is_valid_id = first_name_count >= 2 and last_name_count >= 2 and detect_faces(
            img) and all(word in text.upper() for word in expected_words)
    else:
        expected_words = [first_name_upper, last_name_upper]
        is_valid_id = all(word in text.upper()
                          for word in expected_words) and detect_faces(img)

    # Return the verification result to the React app
    print('Text:', text)
    result = {'is_valid_id': is_valid_id}
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
