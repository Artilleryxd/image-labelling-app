import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, query, getDocs, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore'; // Firestore imports
import Navbar from '@/components/navbar';

const Index = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const router = useRouter();
  const [selectedLabels, setSelectedLabels] = useState({}); // Store selected labels per image
  const [completedImages, setCompletedImages] = useState({}); // Track images where Done was clicked

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login'); // Redirect if not logged in
      } else {
        setUser(user);
  
        try {
          // Fetch the user's data to get their role and username
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const username = userData.name;
  
          // Redirect if the user is an uploader
          if (userData.role === 'uploader') {
            router.push('/uploaderDash');
            return;
          }
  
          // Fetch all images from Firestore
          const imagesQuery = query(collection(db, 'images'));
          const imagesSnapshot = await getDocs(imagesQuery);

          const fetchedImages = imagesSnapshot.docs
            .map((doc) => {
              const imageData = doc.data();
              return {
                id: doc.id,
                url: `data:image/jpeg;base64,${imageData.imagesData}`,
                ...imageData,
                userLabels: imageData.userLabels || [],
                labellers: imageData.labellers || [], // Get labellers array
              };
            })
            // Filter out images already labeled by the current user (by username)
            .filter(image => !image.labellers.includes(username));
  
          setImages(fetchedImages);
        } catch (error) {
          console.error('Error fetching user data or images:', error);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);
  

  const handleLabelClick = (imageId, label) => {
    // Update selected label for the respective image
    setSelectedLabels((prevLabels) => ({
      ...prevLabels,
      [imageId]: label, // Update only the clicked image's selected label
    }));
  };

  const handleDoneClick = async (imageId) => {
    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) {
        throw new Error('User is not authenticated');
      }

      // Retrieve the user's document from Firestore to get their username
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('User document does not exist');
      }

      const userData = userDocSnap.data();
      const username = userData.name; // Get the username from Firestore

      // Find the current image and push the selected label to userLabels
      const currentImage = images.find(image => image.id === imageId);
      let userLabels = currentImage.userLabels;

      // Add the selected label to the userLabels array
      userLabels.push(selectedLabels[imageId]);

      // Update Firestore with the new label array and add the username to the labellers array
      await updateDoc(doc(db, 'images', imageId), {
        userLabels: userLabels, // Store the updated array with the selected label
        labellers: arrayUnion(username) // Add the username to the labellers array
      });

      // Also store the labeled image information in the user's document
      await updateDoc(userDocRef, {
        previousLabels: arrayUnion({
          imageId: imageId,
          label: selectedLabels[imageId],
          imageData: currentImage.imagesData, // Store the base64 image data
        })
      });

      // Update local state to reflect the userLabels
      setImages((prevImages) =>
        prevImages.map((image) => {
          if (image.id === imageId) {
            return {
              ...image,
              userLabels: userLabels, // Update userLabels to include the new label
            };
          }
          return image;
        })
      );

      // Mark the image as completed to disable buttons
      setCompletedImages((prevCompleted) => ({
        ...prevCompleted,
        [imageId]: true, // Set flag for the image as completed
      }));
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
                    onClick={() => handleLabelClick(image.id, label)} // Handle label click for the respective image
                    className={`py-2 px-4 rounded hover:bg-blue-600 ${selectedLabels[image.id] === label ? 'bg-green-500' : 'bg-purple-500 text-white'}`} // Turn green if selected for that image
                    disabled={completedImages[image.id]} // Disable if Done button clicked for this image
                  >
                    {label} {/* Display label name */}
                  </button>
                ))}
              </div>
            </div>

            {/* Done Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDoneClick(image.id)} // Lock the image labeling
                className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!selectedLabels[image.id] || completedImages[image.id]} // Disable Done button if no label selected or Done was already clicked
              >
                Done
              </button>
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
