// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCL0gB2jwcLssfntJE_dOOSd2fT_6jGyHU",
    authDomain: "image-labelling-app-a25c2.firebaseapp.com",
    projectId: "image-labelling-app-a25c2",
    storageBucket: "image-labelling-app-a25c2.firebasestorage.app",
    messagingSenderId: "672666502945",
    appId: "1:672666502945:web:720798fee0e89ee6316060"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);

export { db , auth, storage};
