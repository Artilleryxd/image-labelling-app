import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../../lib/firebaseConfig';
import { collection, query, getDocs, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import Navbar from '@/components/navbar';

const Index = () => {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [selectedLabels, setSelectedLabels] = useState({});
  const [completedImages, setCompletedImages] = useState({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const username = userData.name;

          setWallet(userData.wallet.balance || 0);

          if (userData.role === 'uploader') {
            router.push('/uploaderDash');
            return;
          }

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
                labellers: imageData.labellers || [],
              };
            })
            .filter(image => !image.labellers.includes(username));

          setImages(fetchedImages);
        } catch (error) {
          console.error('Error fetching user data or images:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLabelClick = (imageId, label) => {
    setSelectedLabels((prevLabels) => ({
      ...prevLabels,
      [imageId]: label,
    }));
  };

  const handleDoneClick = async (imageId) => {
    try {
      const user = auth.currentUser;
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

      const currentImage = images.find(image => image.id === imageId);
      let userLabels = currentImage.userLabels;

      userLabels.push(selectedLabels[imageId]);

      await updateDoc(doc(db, 'images', imageId), {
        userLabels: userLabels,
        labellers: arrayUnion(username)
      });

      await updateDoc(userDocRef, {
        previousLabels: arrayUnion({
          imageId: imageId,
          label: selectedLabels[imageId],
          imageData: currentImage.imagesData,
        }),
        'wallet.balance': userData.wallet.balance + 2
      });

      setImages((prevImages) =>
        prevImages.map((image) => {
          if (image.id === imageId) {
            return {
              ...image,
              userLabels: userLabels,
            };
          }
          return image;
        })
      );

      setCompletedImages((prevCompleted) => ({
        ...prevCompleted,
        [imageId]: true,
      }));

      setWallet((prevWallet) => prevWallet + 1);
    } catch (error) {
      console.error('Error updating labels in Firestore:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Navbar />

      {/* Prominent Wallet Balance */}
      <div className="mb-6 text-2xl font-bold text-blue-600 shadow-lg p-4 mt-2 rounded-lg bg-white">
        Wallet Balance: ${wallet}
      </div>

      {/* Images Grid Section */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="bg-white p-4 rounded-lg shadow-lg flex flex-col">
              <h2 className="text-xl font-bold mb-2">{image.username}</h2>
              <img
                src={image.url}
                alt={`Image ${image.id}`}
                className="flex-grow h-40 object-cover rounded-lg mb-2"
              />
              <p><strong>Uploader Name:</strong> {image.username || 'Unknown'}</p>

              {/* Labels Section */}
              <div className="mt-4">
                <h3 className="font-bold text-lg">Labels:</h3>
                <div className="flex flex-wrap space-x-2 mt-2">
                  {image.labels.map((label, index) => (
                    <button
                      key={index}
                      onClick={() => handleLabelClick(image.id, label)}
                      className={`py-2 px-4 rounded hover:bg-blue-600 ${selectedLabels[image.id] === label ? 'bg-green-500' : 'bg-purple-500 text-white'}`}
                      disabled={completedImages[image.id]}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Done Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDoneClick(image.id)}
                  className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!selectedLabels[image.id] || completedImages[image.id]}
                >
                  Done
                </button>
              </div>

              {/* User Labels Display */}
              <div className="mt-4">
                <h4 className="font-bold text-md">Your Labels:</h4>
                <p>{image.userLabels.length > 0 ? image.userLabels.join(', ') : 'No labels selected yet.'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No images available for labeling at the moment.</p>
      )}
    </div>
  );
};

export default Index;
