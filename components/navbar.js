import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '../lib/firebaseConfig'; // Firebase imports
import { doc, getDoc } from 'firebase/firestore'; // Firestore imports

const Navbar = () => {
  const [wallet, setWallet] = useState({ balance: 0 }); // State to store the wallet balance as an object
  const [username, setUsername] = useState(''); // State for the user's username
  const [profilePicture, setProfilePicture] = useState(''); // State for the user's profile picture
  const [dropdownOpen, setDropdownOpen] = useState(false); // State to manage dropdown visibility

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          // Check if wallet is an object and extract balance
          if (userData.wallet && typeof userData.wallet === 'object') {
            setWallet(userData.wallet); // Set the wallet object directly
          } else {
            setWallet({ balance: userData.wallet || 0 }); // If wallet is a number, wrap it in an object
          }

          setUsername(userData.name || '');
          setProfilePicture(userData.profilePicture || '');
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
          <Link legacyBehavior href="/viewerDash">
            <a className="text-white hover:text-blue-300 transition duration-200">Label Images</a>
          </Link>
          <Link legacyBehavior href="/previousLables">
            <a className="text-white hover:text-blue-300 transition duration-200">Previous Labels</a>
          </Link>
        </li>
        <li className="ml-auto flex items-center space-x-4 relative"
            onMouseEnter={() => setDropdownOpen(true)} // Show dropdown on hover
            onMouseLeave={() => setDropdownOpen(false)} // Hide dropdown on mouse leave
        >
          {/* Profile link with username and profile picture */}
          {profilePicture && (
            <img
              src={profilePicture}
              alt="Profile Picture"
              className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer"
            />
          )}
          <Link href="/viewerProfile" className="text-white hover:text-blue-300 transition duration-200">{username}</Link>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-4 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="p-4 text-gray-700">
                <Link legacyBehavior href="/wallet">
                  <a className="block hover:bg-gray-100 transition duration-200 p-2 rounded">
                    Wallet <span className="font-bold">₹{wallet.balance.toFixed(2)}</span> {/* Use wallet balance */}
                  </a>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-600 hover:bg-red-100 transition duration-200 p-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
