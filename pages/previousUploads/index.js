import { useEffect, useState } from 'react';
import { db } from '../../lib/firebaseConfig'; // Your Firebase configuration
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../../lib/firebaseConfig'; // Firebase auth
import { useRouter } from 'next/router';
import UploaderNavbar from '@/components/uploaderNavbar';

const PreviousUploads = () => {
    const [uploadsData, setUploadsData] = useState([]); // State variable to store uploads data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchUserRoleAndUploads = async () => {
            setLoading(true);
            try {
                const user = auth.currentUser; // Get current user
                if (!user) {
                    // Redirect to login if user is not authenticated
                    router.push('/login');
                    return;
                }

                const userRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    console.log('User Data:', userData);
                    setUserRole(userData.role || ''); // Set user role
                    
                    if (userData.role === 'uploader') {
                        // Fetch uploads for the current user
                        const uploadsData = userData.uploads || []; // Assuming uploads is an array in the user document
                        console.log('Uploads Data:', uploadsData); // Check the uploaded data

                        // Query images collection to get userLabels and imageData for uploads with the same uploader ID
                        const imagesQuery = query(
                            collection(db, 'images'),
                            where('uploaderId', '==', user.uid) // Assuming 'uploaderId' is the field in the images collection
                        );

                        const imagesSnapshot = await getDocs(imagesQuery);
                        const imagesData = imagesSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(), // Fetch both userLabels and imageData
                        }));

                        // Set uploadsData to include both userLabels and imageData
                        setUploadsData(imagesData);
                        console.log(uploadsData);
                    } else {
                        // Redirect non-uploader users
                        router.push('/'); // Redirect to homepage or another page
                    }
                } else {
                    setError('User not found. Please log in again.');
                }
            } catch (err) {
                setError('Failed to load uploads. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRoleAndUploads();
    }, [router]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="container mx-auto p-4">
            <UploaderNavbar/>

            <h1 className="text-2xl font-bold mb-4 text-center my-2">Previous Uploads</h1>
            {uploadsData.length === 0 ? (
                <p className='text-center'>No uploads found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    {uploadsData.map((upload) => (
                        <div key={upload.id} className="border p-2 rounded shadow bg-white flex flex-col items-center">
                            <div className="aspect-w-1 aspect-h-1 w-full">
                                <img 
                                    src={`data:image/jpeg;base64,${upload.imagesData}`} 
                                    alt="Upload" 
                                    className="object-cover w-full h-full rounded" 
                                />
                            </div>
                            {/* Display the userLabels */}
                            <p className="mt-2 text-center"><strong>Labels:</strong> {upload.userLabels?.join(', ')}</p>
                            {/* Optionally, display the image metadata (if any other details are needed) */}
                            <p className="text-center"><strong>Image ID:</strong> {upload.id}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PreviousUploads;
