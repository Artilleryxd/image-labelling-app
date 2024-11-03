import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebaseConfig'; // Import Firebase Auth and Firestore
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Firestore imports
import UploaderNavbar from '@/components/uploaderNavbar';
import { serverTimestamp } from 'firebase/firestore'; // Import serverTimestamp

const Index = () => {
  const router = useRouter();
  const [images, setImages] = useState([{ file: null }]); // State for images
  const [labels, setLabels] = useState(['']); // Global state for labels

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login'); // If not logged in, redirect to login
      } else {
        try {
          // Fetch user data to check their role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          // Redirect if the user is a viewer
          if (userData.role === 'viewer') {
            router.push('/'); // Redirect viewer to home page
            return;
          }
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
    setImages([...images, { file: null }]); // Add a new image input, keeping existing labels
  };


const handleSubmit = async (e) => {
    e.preventDefault();
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

        const uploadedImageIds = [];
        const uploadsData = [];

        for (const img of images) {
            if (img.file) {
                const base64Image = await convertFileToBase64(img.file);

                const imageData = {
                    imagesData: base64Image,
                    labels: labels.filter(label => label.trim() !== ''),
                    userLabels: [],
                    uploaderId: user.uid,
                    username: username,
                    createdAt: serverTimestamp() // Add createdAt timestamp
                };

                const imageDocRef = doc(db, 'images', img.file.name);
                await setDoc(imageDocRef, imageData);
                uploadedImageIds.push(imageDocRef.id);
                
                uploadsData.push({
                    imageId: imageDocRef.id,
                    labels: imageData.labels,
                    createdAt: imageData.createdAt // Store timestamp
                });
            }
        }

        await setDoc(userDocRef, {
            uploads: uploadsData
        }, { merge: true });

        console.log('Uploaded image IDs:', uploadedImageIds);
        setImages([{ file: null }]);
        setLabels(['']);
    } catch (error) {
        console.error('Error uploading images:', error);
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
    <div>
      <UploaderNavbar />
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Upload Images</h2>
        {images.map((image, index) => (
          <div key={index} className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, index)}
              className="mb-2"
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
                className="bg-blue-500 text-white px-2 rounded"
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
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload Images
        </button>
      </form>
    </div>
  );
};

export default Index;
