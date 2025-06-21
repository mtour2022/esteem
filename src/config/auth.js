import { FaPassport } from 'react-icons/fa';
import { auth, googleProvider } from './firebase';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword, sendEmailVerification } from 'firebase/auth';

export const docreateUserWithEmailAndPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailAndPassword = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async (email, password) => {
    const result = await signInWithPopup(auth, googleProvider);

    //result.user save on firestore
    return result;
};

export const doSignOut = () => {
    return auth.signOut();
}

// export const doPasswordReset = (email) => {
//     return sendPasswordResetEmail(auth, email);
// }

// export const doPasswordChange = (password) => {
//     return updatePassword(auth.currentUser, password);
// }

// export const doSendEmailVerification = () => {
//     return sendEmailVerification(auth.currentUser, {
//         url: `${window.location.origin}/home`,
//     });
// };