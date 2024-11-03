import { useEffect, useState } from 'react';
import { db } from '../../lib/firebaseConfig'; // Your Firebase configuration
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebaseConfig'; // Firebase auth
import { useRouter } from 'next/router';

const PreviousUploads = () => {
    const [uploads, setUploads] = useState([]);
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
                        const uploadsRef = collection(db, 'uploads');
                        const q = query(uploadsRef, where('userId', '==', user.uid));
                        const querySnapshot = await getDocs(q);
                        const uploadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        console.log('Uploads Data:', uploadsData); // Check the uploaded data
                        setUploads(uploadsData);
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
            <h1 className="text-2xl font-bold mb-4">Previous Uploads</h1>
            {uploads.length === 0 ? (
                <p>No uploads found.</p>
            ) : (
                <ul className="space-y-4">
                    {uploads.map(upload => (
                        <li key={upload.id} className="border p-4 rounded shadow">
                            <img src={upload.imageUrl} alt="Upload" className="w-full h-auto mb-2" />
                            <p><strong>Labels:</strong> {upload.labels.join(', ')}</p>
                            <p><strong>Uploaded on:</strong> {new Date(upload.createdAt).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PreviousUploads;