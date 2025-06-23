import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc } from "firebase/firestore";
import { ReadHighlight } from '../components/paper-components/HighlightContainer';
import { Node, Edge } from '@xyflow/react';
import { ReadingSession } from './ReadingAnalyticsContext';
import { ReadRecord } from "./PaperContext";

export type UserData = {
    id?: string;
    email: string;
    name: string;
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
        currentReadId: string;
        nodes: Node[];
        edges: Edge[];
        readingSessions: Record<string, ReadingSession>;
    };
}

type StorageContextData = {
    userId: string | undefined;
    getAllUsers: () => Promise<UserData[]>;
    getUser: (id: string) => Promise<UserData>;
    addUser: (userData: UserData) => Promise<void>;
    addPaperToUser: (userId: string, paperId: string) => Promise<void>;
    getAllPapersData: () => Promise<PaperData[]>;
    getPaperData: (paperId: string) => Promise<PaperData>;
    addPaperData: (paperData: PaperData) => Promise<void>;
    getPaperFile: (paperId: string) => Promise<string>;
    addPaperFile: (paperId: string, file: File) => Promise<void>;
    getReadingStateData: (userId: string, paperId: string) => Promise<ReadingState>;
    addReadingState: (readingStateData: ReadingState) => Promise<void>;
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

    const [userId, setUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        // For testing purposes, set the current user ID to 'test-user'
        sessionStorage.setItem('userId', 'test-user');
        const userId = sessionStorage.getItem('userId');
        if (userId) {
            setUserId(userId);
        }
    }, []);

    const getAllUsers = async () => {
        const userDocs = await getDocs(usersCollectionRef);
        console.log("userDocs", userDocs.docs.map((doc) => doc.data()));
        return userDocs.docs.map((doc) => doc.data() as UserData);
    }

    const getUser = async (id: string) => {
        const userDoc = await getDoc(doc(usersCollectionRef, id));
        console.log("userDoc", userDoc.data());
        return userDoc.data() as UserData;
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
        const readingStateRef = doc(readingStatesCollectionRef, userId, paperId);
        const readingStateDoc = await getDoc(readingStateRef);
        return readingStateDoc.data() as ReadingState;
    }

    // add reading state data
    const addReadingState = async (readingStateData: ReadingState) => {
        try {
            await setDoc(doc(readingStatesCollectionRef, readingStateData.id), readingStateData);
            console.log('Reading state added with ID:', readingStateData.id);
        } catch (error) {
            console.error('Error adding reading state:', error);
        }
    }

    return (
        <StorageContext.Provider
            value={{
                userId,
                getAllUsers,
                getUser,
                addUser,
                addPaperToUser,
                getAllPapersData,
                getPaperData,
                addPaperData,
                getPaperFile,
                addPaperFile,
                getReadingStateData,
                addReadingState,
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