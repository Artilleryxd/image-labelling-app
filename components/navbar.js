import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '../lib/firebaseConfig'; // Firebase imports
import { doc, getDoc } from 'firebase/firestore'; // Firestore

const Navbar = () => {
  const [wallet, setWallet] = useState(0); // State to store the wallet balance
  const [username, setUsername] = useState(''); // State for the user's username
  const [profilePicture, setProfilePicture] = useState(''); // State for the user's profile picture

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          // Set the wallet balance and user info if it exists
          setWallet(userData.wallet || 0);
          setUsername(userData.name || ''); // Assuming name is stored in Firestore
          setProfilePicture(userData.profilePicture || ''); // Assuming profilePicture is stored in Firestore
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out the user
      // Optionally redirect to login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-blue-600 p-4 rounded-lg shadow-md">
      <ul className="flex justify-between items-center">
        <li className="flex space-x-6">
          <Link legacyBehavior href="/dashboard">
            <a className="text-white hover:text-blue-300 transition duration-200">Label Images</a>
          </Link>
          <Link legacyBehavior href="/previous-labels">
            <a className="text-white hover:text-blue-300 transition duration-200">Previous Labels</a>
          </Link>
        </li>
        <li className="ml-auto flex items-center space-x-4">
          {/* Profile link with username and profile picture */}
          {profilePicture && (
            <img
              src={profilePicture}
              alt="Profile Picture"
              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
            />
          )}
          <Link legacyBehavior href="/profile">
            <a className="text-white hover:text-blue-300 transition duration-200">{username}</a>
          </Link>
          <Link legacyBehavior href="/wallet">
            <a className="text-white hover:text-blue-300 transition duration-200">
              Wallet <span className="font-bold">₹{wallet}</span>
            </a>
          </Link>
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition duration-200"
          >
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
