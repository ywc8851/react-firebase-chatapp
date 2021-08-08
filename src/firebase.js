import firebase from "firebase";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var firebaseConfig = {
  apiKey: "AIzaSyD8V6Y6Gm_2lsNYPC-GwO6dr8TSbPgH55U",
  authDomain: "chat-app-13d3f.firebaseapp.com",
  projectId: "chat-app-13d3f",
  storageBucket: "chat-app-13d3f.appspot.com",
  messagingSenderId: "481255318319",
  appId: "1:481255318319:web:92b265941b1245b9a477da",
  measurementId: "G-9ETHLP00HG",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase;
