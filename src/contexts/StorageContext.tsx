import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, where, query } from "firebase/firestore";
import { ReadHighlight } from '../components/paper-components/HighlightContainer';
import { Node, Edge } from '@xyflow/react';
import { ReadingSession } from './ReadingAnalyticsContext';
import { ReadRecord } from "./PaperContext";

export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student'
}

export type UserData = {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    paperIds: string[];
}

// Displayed in Paper Hub
export type PaperData = {
    id: string;
    title: string;
}

// Paper File itself
export type PaperFile = {
    id: string;
    file: File;
}

export type ReadingState = {
    id: string;
    userId: string;
    paperId: string;
    state: {
        highlights: ReadHighlight[];
        readRecords: Record<string, ReadRecord>;
        nodes: Node[];
        edges: Edge[];
        readingSessions: Record<string, ReadingSession>;
    };
}

type StorageContextData = {
    userData: UserData | undefined;
    setUserData: (userData: UserData | undefined) => void;
    loadUserData: (userId: string) => Promise<void>;
    getAllUsers: () => Promise<UserData[]>;
    getUserById: (id: string) => Promise<UserData | null>;
    getUserByEmail: (email: string) => Promise<UserData | null>;
    addUser: (userData: UserData) => Promise<void>;
    updateUser: (userData: UserData) => Promise<void>;
    addPaperToUser: (userId: string, paperId: string) => Promise<void>;
    getAllPapersData: () => Promise<PaperData[]>;
    getPaperData: (paperId: string) => Promise<PaperData>;
    addPaperData: (paperData: PaperData) => Promise<void>;
    getPaperFile: (paperId: string) => Promise<string>;
    addPaperFile: (paperId: string, file: File) => Promise<void>;
    getReadingStateData: (userId: string, paperId: string) => Promise<ReadingState | null>;
    updateReadingState: (readingStateData: ReadingState) => Promise<void>;
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const StorageContext = createContext<StorageContextData | undefined>(undefined);

export const StorageProvider = ({ children }: { children: React.ReactNode }) => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const usersCollectionRef = collection(db, 'users');
    const papersDataCollectionRef = collection(db, 'papersData');
    const readingStatesCollectionRef = collection(db, 'readingStates');

    const storage = getStorage(app);

    const [userData, setUserData] = useState<UserData | undefined>(undefined);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            loadUserData(userId);
        }
    }, []);

    const loadUserData = async (userId: string) => {
        const userData = await getUserById(userId);
        setUserData(userData);
    }

    const getAllUsers = async () => {
        const userDocs = await getDocs(usersCollectionRef);
        console.log("userDocs", userDocs.docs.map((doc) => doc.data()));
        return userDocs.docs.map((doc) => doc.data() as UserData);
    }

    const getUserById = async (id: string) => {
        const userDoc = await getDoc(doc(usersCollectionRef, id));
        return userDoc.data() as UserData;
    }

    const getUserByEmail = async (email: string) => {
        const q = query(usersCollectionRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        return querySnapshot.docs[0].data() as UserData;
    }

    // add user data
    const addUser = async (userData: UserData) => {
        try {
            await setDoc(doc(usersCollectionRef, userData.id), userData);
            console.log('User added with ID:', userData.id);
        } catch (error) {
            console.error('Error adding user:', error);
        }
    }

    // update user data
    const updateUser = async (userData: UserData) => {
        try {
            await setDoc(doc(usersCollectionRef, userData.id), userData);
            console.log('User updated with ID:', userData.id);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }

    // add paper to user
    const addPaperToUser = async (userId: string, paperId: string) => {
        try {
            const userRef = doc(usersCollectionRef, userId);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() as UserData;
            if (!userData.paperIds.includes(paperId)) {
                userData.paperIds.push(paperId);
                await setDoc(doc(usersCollectionRef, userId), userData);
                console.log('Paper added to user with ID:', userId);
            }
            else {
                console.log('Paper already exists in user with ID:', userId);
            }
        } catch (error) {
            console.error('Error adding paper to user:', error);
        }
    }

    // get all papers data
    const getAllPapersData = async () => {
        const paperDocs = await getDocs(papersDataCollectionRef);
        console.log("paperDocs", paperDocs.docs.map((doc) => doc.data()));
        return paperDocs.docs.map((doc) => doc.data() as PaperData);
    }

    // get paper data
    const getPaperData = async (paperId: string) => {
        const paperRef = doc(papersDataCollectionRef, paperId);
        const paperDoc = await getDoc(paperRef);
        return paperDoc.data() as PaperData;
    }

    // add paper data
    const addPaperData = async (paperData: PaperData) => {
        try {
            await setDoc(doc(papersDataCollectionRef, paperData.id), paperData);
            console.log('Paper added with ID:', paperData.id);
        } catch (error) {
            console.error('Error adding paper:', error);
        }
    }

    // add paper file
    const addPaperFile = async (paperId: string, file: File) => {
        try {
            const fileRef = ref(storage, paperId);
            await uploadBytes(fileRef, file);
            console.log('Paper file uploaded to:', fileRef.fullPath);
        } catch (error) {
            console.error('Error adding paper file:', error);
        }
    }

    // get paper file
    const getPaperFile = async (paperId: string) => {
        const fileRef = ref(storage, paperId);
        const url = await getDownloadURL(fileRef);
        return url;
    }

    // get reading state data
    const getReadingStateData = async (userId: string, paperId: string) => {
        const readingStateId = `${userId}-${paperId}`;
        const readingStateRef = doc(readingStatesCollectionRef, readingStateId);
        const readingStateDoc = await getDoc(readingStateRef);
        const data = readingStateDoc.data();
        if (!data) return null;
        const readingStateData = {
            ...data,
            state: JSON.parse(data?.state)
        } as ReadingState;

        console.log("readingStateData", readingStateData);
        return readingStateData;
    }

    // add/update reading state data
    const updateReadingState = async (readingStateData: ReadingState) => {
        try {
            await setDoc(doc(readingStatesCollectionRef, readingStateData.id), {
                ...readingStateData,
                state: JSON.stringify(readingStateData.state)
            });
            console.log('Reading state added with ID:', readingStateData.id);
        } catch (error) {
            console.error('Error adding reading state:', error);
        }
    }

    return (
        <StorageContext.Provider
            value={{
                userData,
                setUserData,
                loadUserData,
                getAllUsers,
                getUserById,
                getUserByEmail,
                addUser,
                updateUser,
                addPaperToUser,
                getAllPapersData,
                getPaperData,
                addPaperData,
                getPaperFile,
                addPaperFile,
                getReadingStateData,
                updateReadingState,
            }}
        >
            {children}
        </StorageContext.Provider>
    );
};

export const useStorageContext = () => {
    const context = useContext(StorageContext);
    if (context === undefined) {
        throw new Error('useStorageContext must be used within a StorageProvider');
    }
    return context;
};