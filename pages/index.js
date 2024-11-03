import React from 'react';
import { useRouter } from 'next/router';

function Index() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login'); // Redirect to your login page
  };

  const handleRegister = () => {
    router.push('/register'); // Redirect to your registration page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
      <p className="mb-8 text-lg text-center">
        Discover a new way to manage your images and labels effortlessly.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-500 transition"
        >
          Login
        </button>
        <button
          onClick={handleRegister}
          className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-500 transition"
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default Index;
