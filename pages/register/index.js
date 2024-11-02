import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebaseConfig';  // Firebase configuration
import { setDoc, doc } from 'firebase/firestore';  // Firestore to save user role
import { useRouter } from 'next/router';
import Link from 'next/link';

const index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer'); // Default role is viewer
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // If user is logged in, redirect them to the home page
        router.push('/');
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
      });

      // Redirect after successful registration
      if (role === 'uploader') {
        router.push('/upload'); // Redirect to uploader page
      } else {
        router.push('/'); // Redirect to viewer page
      }
    } catch (err) {
      // Check for email-already-in-use error
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please try logging in.');
      } else {
        setError('Failed to register. Please check the details and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Select Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="viewer">Viewer</option>
              <option value="uploader">Uploader</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Register
          </button>
        </form>
        <p className="text-center mt-4">
        Already have an account? 
        <Link legacyBehavior href="/login">
            <a className="text-blue-500 hover:underline"> Login here.</a>
        </Link>
        </p>
      </div>
    </div>
  );
};

export default index;
