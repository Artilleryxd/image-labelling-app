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
        <div className="min-h-screen bg-gray-100 p-6">
            <Navbar />
            <h1 className="text-2xl font-bold mb-4">Previous Labels</h1>
            {userLabels.length > 0 ? (
                userLabels.map((labelData, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-lg mb-6 mt-2">
                        <h2 className="text-xl font-bold mb-4">Image ID: {labelData.imageId}</h2>
                        <img src={`data:image/jpeg;base64,${labelData.imageData}`} alt={`Labeled Image ${labelData.imageId}`} className="w-full h-60 object-cover rounded-lg mb-4" />
                        <p><strong>Your Label:</strong> {labelData.label}</p>
                    </div>
                ))
            ) : (
                <p>No previous labels found.</p>
            )}
        </div>
    );
};

export default PreviousLabels;
