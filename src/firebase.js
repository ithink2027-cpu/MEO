import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB_Q282pAxLitV2dACP2rr1nJyTmok6ioU',
  authDomain: 'marwan-engineering-office.firebaseapp.com',
  projectId: 'marwan-engineering-office',
  storageBucket: 'marwan-engineering-office.firebasestorage.app',
  messagingSenderId: '1002667766427',
  appId: '1:1002667766427:web:0c68748445d3ae6ed10c3e',
  measurementId: 'G-DXRV9FR7G0',
}

const app = initializeApp(firebaseConfig)

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const auth = getAuth(app)
export const db = getFirestore(app)

export async function logActivity(action, projectTitle) {
  await addDoc(collection(db, 'activity_logs'), {
    action,
    projectTitle,
    timestamp: serverTimestamp(),
  })
}

export { signInWithEmailAndPassword, signOut }
export { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc }
