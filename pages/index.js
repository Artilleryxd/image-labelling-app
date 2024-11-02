import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebaseConfig'; // Import Firebase Auth

const Index = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If no user is logged in, redirect them to the login page
        router.push('/login');
      } else {
        // Set the user state if logged in
        setUser(user);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  // If user is not logged in, don't render the page yet
  if (!user) {
    return <div>Loading...</div>;
  }

  // If user is logged in, show the home page
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Welcome to the Home Page</h1>
      {/* Your content goes here */}
    </div>
  );
};

export default Index;
