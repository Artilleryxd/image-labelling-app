import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, query, where, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore'; // Firestore imports
import Navbar from '@/components/navbar';

const Index = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login'); // If not logged in, redirect to login
      } else {
        setUser(user);

        try {
          // Fetch user data to check their role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          // Redirect if the user is an uploader
          if (userData.role === 'uploader') {
            router.push('/uploaderDash');
            return;
          }

          // Fetch images with their labels
          const imagesQuery = query(collection(db, 'images'), where('status', '==', 'unlabeled'));
          const imagesSnapshot = await getDocs(imagesQuery);
          const fetchedImages = await Promise.all(imagesSnapshot.docs.map(async (doc) => {
            const imageData = doc.data();
            return {
              id: doc.id,
              url: `data:image/jpeg;base64,${imageData.imagesData}`, // Adjust the image format as needed
              ...imageData,
              userLabels: imageData.userLabel ? [imageData.userLabel] : [] // Initialize userLabels from Firestore
            };
          }));

          // Wait for all image fetching to complete
          setImages(fetchedImages);
        } catch (error) {
          console.error('Error fetching user data or images:', error);
        }
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const handleLabelClick = async (imageId, label) => {
    try {
      // Find the current userLabels for the image
      const currentImage = images.find(image => image.id === imageId);
      
      // Check if the label is already selected
      const isAlreadySelected = currentImage.userLabels.includes(label);
  
      // Determine new userLabels based on selection
      let updatedLabels;
  
      if (!isAlreadySelected) {
        // If the label is not already selected, append it to the userLabels
        updatedLabels = [...currentImage.userLabels, label];
      } else {
        // If the label is already selected, we can choose to remove it or leave it as is
        updatedLabels = currentImage.userLabels.filter(userLabel => userLabel !== label); // This will remove the label if clicked again
      }
  
      // Update the image in Firestore with the new userLabels array
      await updateDoc(doc(db, 'images', imageId), {
        userLabels: updatedLabels // Store the updated array of userLabels
      });
  
      // Update local state to reflect the selected label
      setImages((prevImages) =>
        prevImages.map((image) => {
          if (image.id === imageId) {
            return {
              ...image,
              userLabels: updatedLabels, // Update userLabels to the appended labels
            };
          }
          return image;
        })
      );
    } catch (error) {
      console.error('Error updating labels in Firestore:', error);
    }
  };
  
  

  if (!user) {
    return <div>Loading...</div>; // If user not logged in yet
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Navbar />

      {/* Images and Labels Section */}
      {images.length > 0 ? (
        images.map((image) => (
          <div key={image.id} className="bg-white p-6 rounded-lg shadow-lg mb-6 mt-2">
            <h2 className="text-xl font-bold mb-4">Image ID: {image.id}</h2>
            <img src={image.url} alt={`Image ${image.id}`} className="w-full h-60 object-cover rounded-lg mb-4" />
            <p><strong>Uploader Name:</strong> {image.uploaderName || 'Unknown'}</p>
            <p><strong>Image Information:</strong> {image.info || 'No additional information'}</p>

            {/* Display associated labels as buttons */}
            <div className="mt-4">
              <h3 className="font-bold text-lg">Labels:</h3>
              <div className="flex flex-wrap space-x-2 mt-2">
                {image.labels.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => handleLabelClick(image.id, label)} // Directly use the label since it's an array
                    className={`py-2 px-4 rounded hover:bg-blue-600 ${image.userLabels.includes(label) ? 'bg-green-500' : 'bg-blue-500 text-white'}`}
                  >
                    {label} {/* Display label name */}
                  </button>
                ))}
              </div>
            </div>

            {/* Display the userLabels selected */}
            <div className="mt-4">
              <h4 className="font-bold text-md">Your Labels:</h4>
              <p>{image.userLabels.length > 0 ? image.userLabels.join(', ') : 'No labels selected yet.'}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No images available for labeling at the moment.</p>
      )}
    </div>
  );
};

export default Index;
