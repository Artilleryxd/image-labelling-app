import { useState } from 'react';
import { auth, db } from '../lib/firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, addDoc } from 'firebase/firestore'; // Firestore imports

const UploadImage = () => {
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState('');
  const [uploaderName, setUploaderName] = useState(auth.currentUser?.displayName || 'Anonymous');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result); // Set the base64 string
      };
      reader.readAsDataURL(selectedFile); // Convert image file to base64
    }
  };

  const handleInfoChange = (event) => {
    setInfo(event.target.value); // Set additional information
  };

  const handleUpload = async () => {
    if (!file) return; // If no file is selected, do nothing

    // Add the image metadata to Firestore
    await addDoc(collection(db, 'images'), {
      imagesData: file.split(',')[1], // Store only the base64 part
      info,
      uploaderName,
      status: 'unlabeled' // Set the initial status
    });

    // Reset state after upload
    setFile(null);
    setInfo('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Upload New Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
      <input
        type="text"
        value={info}
        onChange={handleInfoChange}
        placeholder="Additional information"
        className="border border-gray-300 p-2 mb-4 rounded"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
      >
        Upload Image
      </button>
    </div>
  );
};

export default UploadImage;
