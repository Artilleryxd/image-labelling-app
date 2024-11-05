import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebaseConfig'; // Firebase Auth and Firestore
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // Firestore imports
import UploaderNavbar from '@/components/uploaderNavbar';

const Index = () => {
  const router = useRouter();
  const [images, setImages] = useState([{ file: null }]); // State for images
  const [labels, setLabels] = useState(['']); // Global state for labels
  const [wallet, setWallet] = useState({ balance: 0 }); // Track user wallet balance
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login'); // If not logged in, redirect to login
      } else {
        try {
          // Fetch user data, including wallet balance
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          if (userData.role === 'viewer') {
            router.push('/viewerDash'); // Redirect viewer to home page
            return;
          }

          // Set wallet balance
          setWallet(userData.wallet); // Updated to directly set wallet object

        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    const newImages = [...images];
    newImages[index].file = file; // Store the selected file
    setImages(newImages);
  };

  const handleLabelChange = (e, labelIndex) => {
    const newLabels = [...labels];
    newLabels[labelIndex] = e.target.value; // Update the label
    setLabels(newLabels);
  };

  const addLabel = () => {
    setLabels([...labels, '']); // Add a new empty label
  };

  const addImage = () => {
    setImages([...images, { file: null }]); // Add a new image input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) {
        throw new Error('User is not authenticated');
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('User document does not exist');
      }

      const userData = userDocSnap.data();
      const username = userData.name;
      const currentWallet = userData.wallet.balance || 0;

      const uploadCost = images.length * 1; 
      const labelCost = labels.filter(label => label.trim() !== '').length * 0.1; 
      const totalCost = uploadCost + labelCost;

      if (currentWallet < totalCost) {
        setError(`You do not have enough balance. Required: $${totalCost.toFixed(2)}, Available: $${currentWallet.toFixed(2)}`);
        return;
      }

      const uploadsData = [];
      const uploadedImageIds = [];

      for (const img of images) {
        if (img.file) {
          const base64Image = await convertFileToBase64(img.file);

          const imageData = {
            imagesData: base64Image,
            labels: labels.filter(label => label.trim() !== ''),
            userLabels: [],
            labelers: [],
            uploaderId: user.uid,
            username: username,
          };

          const imageDocRef = doc(db, 'images', img.file.name);
          const imageDocSnap = await getDoc(imageDocRef);

          if (imageDocSnap.exists()) {
            // Update existing image document
            await updateDoc(imageDocRef, {
              imagesData: base64Image,
              labels: arrayUnion(...imageData.labels), // Add labels without duplicates
              userLabels: imageData.userLabels,
              labelers: imageData.labelers,
              uploaderId: user.uid,
              username: username,
            });
          } else {
            await setDoc(imageDocRef, imageData); 
          }

          uploadedImageIds.push(imageDocRef.id);
          uploadsData.push({
            imageId: imageDocRef.id,
            imageData: imageData.imagesData,
            labels: imageData.labels,
            userLabels: imageData.userLabels,
          });
        }
      }

      // Update the user's uploads array and wallet balance
      await updateDoc(userDocRef, {
        uploads: arrayUnion(...uploadsData), // Merge uploads
        'wallet.balance': currentWallet - totalCost // Deduct the total cost from wallet balance
      });

      console.log('Uploaded image IDs:', uploadedImageIds);
      setImages([{ file: null }]); // Reset images state
      setLabels(['']); // Reset labels state
      setWallet(prev => ({ ...prev, balance: currentWallet - totalCost })); // Update wallet balance locally
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.message); // Update the error message to display
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get base64 part
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen p-3">
      <UploaderNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-2xl font-bold mb-4 text-center">Upload Images</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>} {/* Error Message */}
        
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-lg shadow-md">
            Wallet Balance: ${wallet.balance.toFixed(2)} {/* Display Wallet Balance */}
          </div>
        </div>

        {images.map((image, index) => (
          <div key={index} className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, index)}
              className="border border-gray-300 rounded p-2 mb-2 w-full"
            />
          </div>
        ))}
        {labels.map((label, labelIndex) => (
          <div key={labelIndex} className="flex items-center mb-2">
            <input
              type="text"
              value={label}
              onChange={(e) => handleLabelChange(e, labelIndex)}
              placeholder={`Label ${labelIndex + 1}`}
              className="border border-gray-300 rounded p-2 mr-2 w-full"
            />
            {labelIndex === labels.length - 1 && (
              <button
              type="button"
              onClick={addLabel}
              className="bg-blue-500 text-white w-44 px-4 py-2 text-lg rounded"
            >
              Add Label
            </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addImage}
          className="bg-green-500 text-white px-4 py-2 rounded mb-4"
        >
          Add Another Image
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Upload Images
        </button>
      </div>
    </div>
  );
};

export default Index;
