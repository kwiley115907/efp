"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function signUpUser(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  }

  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

export async function signInUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function listenForAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
