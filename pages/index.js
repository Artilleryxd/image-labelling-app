import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebaseConfig'; // Import Firebase Auth and Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore imports
import Navbar from '@/components/navbar';
import UploadImage from '@/components/UploadImage';

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

        // Fetch images with their labels
        const imagesQuery = query(collection(db, 'images'), where('status', '==', 'unlabeled'));
        const imagesSnapshot = await getDocs(imagesQuery);
        const fetchedImages = imagesSnapshot.docs.map(async (doc) => {
          const imageData = doc.data();

          // Fetch labels for each image
          const labelsQuery = query(collection(db, 'labels'), where('imageId', '==', doc.id));
          const labelsSnapshot = await getDocs(labelsQuery);
          const labels = labelsSnapshot.docs.map((labelDoc) => labelDoc.data());

          return {
            id: doc.id,
            url: `data:image/jpeg;base64,${imageData.imagesData}`, // Adjust the image format as needed
            ...imageData,
            labels, // Labels associated with the image
          };
        });

        // Wait for all image fetching to complete
        const resolvedImages = await Promise.all(fetchedImages);
        setImages(resolvedImages);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  if (!user) {
    return <div>Loading...</div>; // If user not logged in yet
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Navbar />

      <UploadImage />

      {/* Images and Labels Section */}
      {images.length > 0 ? (
        images.map((image) => (
          <div key={image.id} className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Image ID: {image.id}</h2>
            <img src={image.url} alt={`Image ${image.id}`} className="w-full h-60 object-cover rounded-lg mb-4" />
            <p><strong>Uploader Name:</strong> {image.uploaderName || 'Unknown'}</p>
            <p><strong>Image Information:</strong> {image.info || 'No additional information'}</p>

            {/* Display associated labels */}
            {image.labels.length > 0 ? (
              <div className="mt-4">
                <h3 className="font-bold text-lg">Labels:</h3>
                <ul className="list-disc pl-5">
                  {image.labels.map((label, index) => (
                    <li key={index} className="text-gray-700">
                      <strong>Label {index + 1}:</strong> {label.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className='mt-2'>No labels available for this image.</p>
            )}

            {/* Button to label this image */}
            <button className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
              Label this Image
            </button>
          </div>
        ))
      ) : (
        <p>No images available for labeling at the moment.</p>
      )}
    </div>
  );
};

export default Index;
