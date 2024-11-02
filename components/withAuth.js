// components/withAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebaseConfig'; // Adjust the path to your Firebase config file

const withAuth = (WrappedComponent) => {
  return (props) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          router.push('/login'); // Redirect to login if not authenticated
        } else {
          setAuthenticated(true);
        }
        setLoading(false);
      });

      // Cleanup the subscription on unmount
      return () => unsubscribe();
    }, [router]);

    if (loading) {
      return <div>Loading...</div>; // You can render a loading spinner here
    }

    if (!authenticated) {
      return null; // While redirecting, avoid rendering protected content
    }

    return <WrappedComponent {...props} />; // Render the protected component
  };
};

export default withAuth;
