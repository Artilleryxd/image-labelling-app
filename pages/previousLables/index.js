import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebaseConfig'; // Adjust the path as necessary
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/navbar';

const PreviousLabels = () => {
    const [userLabels, setUserLabels] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserLabels = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            setUser(currentUser);
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setUserLabels(userData.previousLabels || []); // Get the previous labels
            }
        };

        fetchUserLabels();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Navbar />
            <h1 className="text-3xl font-bold mb-6 text-center mt-2">Your Labels</h1>
            {userLabels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {userLabels.map((labelData, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-lg mb-6 mt-2 flex flex-col">
                            <h2 className="text-xl font-bold mb-2">Image ID: {labelData.imageId}</h2>
                            <div className="aspect-w-1 aspect-h-1 mb-4">
                                <img 
                                    src={`data:image/jpeg;base64,${labelData.imageData}`} 
                                    alt={`Labeled Image ${labelData.imageId}`} 
                                    className="object-cover w-full h-full rounded-lg" 
                                />
                            </div>
                            <p className="text-lg"><strong>Your Label:</strong> {labelData.label}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-lg text-gray-600">No labels found.</p>
            )}
        </div>
    );
};

export default PreviousLabels;
