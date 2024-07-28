// App.js
import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ImageAnnotation from './components/ImageAnnotation';

function App() {
  const [filename, setFilename] = useState(null);
  const [annotatedFilename, setAnnotatedFilename] = useState(null);

  return (
    <div className="App">
      <h1>Medical Image Annotation Tool</h1>
      <ImageUpload setFilename={setFilename} />
      {filename && (
        <ImageAnnotation 
          filename={filename} 
          setAnnotatedFilename={setAnnotatedFilename} 
        />
      )}
      {annotatedFilename && (
        <div>
          <h3>Annotated Image:</h3>
          <img src={`http://localhost:5000/export/${annotatedFilename}`} alt="Annotated" />
          <a href={`http://localhost:5000/export/${annotatedFilename}`} download>Download Annotated Image</a>
        </div>
      )}
    </div>
  );
}

export default App;

// components/ImageUpload.js
import React from 'react';
import axios from 'axios';

function ImageUpload({ setFilename }) {
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFilename(response.data.filename);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} accept="image/*" />
    </div>
  );
}

export default ImageUpload;

// components/ImageAnnotation.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function ImageAnnotation({ filename, setAnnotatedFilename }) {
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState('');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const image = new Image();
    image.src = `http://localhost:5000/export/${filename}`;
    image.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      imageRef.current = image;
    };
  }, [filename]);

  const handleCanvasClick = (event) => {
    if (currentAnnotation) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setAnnotations([...annotations, { position: [x, y], text: currentAnnotation }]);
      setCurrentAnnotation('');

      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'green';
      ctx.font = '16px Arial';
      ctx.fillText(currentAnnotation, x, y);
    }
  };

  const handleAnnotationSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/annotate', {
        filename,
        annotations
      });
      setAnnotatedFilename(response.data.annotated_filename);
    } catch (error) {
      console.error('Error submitting annotations:', error);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        value={currentAnnotation} 
        onChange={(e) => setCurrentAnnotation(e.target.value)}
        placeholder="Enter annotation"
      />
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        style={{ border: '1px solid black' }}
      />
      <button onClick={handleAnnotationSubmit}>Submit Annotations</button>
    </div>
  );
}

export default ImageAnnotation;
