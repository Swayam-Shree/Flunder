import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: "AIzaSyCCwd8S-z1aYiHQdfR9bRg1DFIcbsHVHLE",
//   authDomain: "flunder-787d0.firebaseapp.com",
//   projectId: "flunder-787d0",
//   storageBucket: "flunder-787d0.appspot.com",
//   messagingSenderId: "1013887551567",
//   appId: "1:1013887551567:web:cb1f025240b3658832823a"
// };

// firebase deploy --only hosting:flunder
const firebaseConfig = {
	apiKey: "AIzaSyCCwd8S-z1aYiHQdfR9bRg1DFIcbsHVHLE",
	authDomain: "flunder-787d0.firebaseapp.com",
	projectId: "flunder-787d0",
	storageBucket: "flunder-787d0.appspot.com",
	messagingSenderId: "1013887551567",
	appId: "1:1013887551567:web:633787659158087532823a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };