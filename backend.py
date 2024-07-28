from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64
import uuid

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ANNOTATED_FOLDER = 'annotated'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = str(uuid.uuid4()) + '.png'
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        return jsonify({'filename': filename})

@app.route('/annotate', methods=['POST'])
def annotate_image():
    data = request.json
    filename = data['filename']
    annotations = data['annotations']
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    img = cv2.imread(filepath)
    
    for annotation in annotations:
        x, y = annotation['position']
        text = annotation['text']
        cv2.putText(img, text, (int(x), int(y)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    annotated_filename = 'annotated_' + filename
    annotated_filepath = os.path.join(ANNOTATED_FOLDER, annotated_filename)
    cv2.imwrite(annotated_filepath, img)
    
    return jsonify({'annotated_filename': annotated_filename})

@app.route('/export/<filename>', methods=['GET'])
def export_image(filename):
    filepath = os.path.join(ANNOTATED_FOLDER, filename)
    return send_file(filepath, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)
