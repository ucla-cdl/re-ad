import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, where, query } from "firebase/firestore";
import { Content, Highlight } from "react-pdf-highlighter-extended";

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

export type ReadPurpose = {
    id: string;
    userId: string;
    paperId: string;
    title: string;
    color: string;
    description?: string;
};

export type ReadHighlight = Highlight & {
    id: string;
    userId: string;
    paperId: string;
    readPurposeId: string;
    sessionId: string;
    content: Content;
    timestamp: number;
    posPercentage: number;
};

// Atomic logging unit of user's reading process
export type ReadSession = {
    id: string;
    userId: string;
    paperId: string;
    readPurposeId: string;
    startTime: number;
    duration: number;
    scrollSequence: number[];
}

// Canvas is a collection of papers, read sessions, and react flow json => This keeps track of how users read paper(s)
export type Canvas = {
    id: string;
    userId: string;
    paperId: string;
    reactFlowJson: string; // react flow json string (nodes, edges, viewport)
}

type StorageContextData = {
    userData: UserData | undefined;
    setUserData: (userData: UserData | undefined) => void;
    loadUserData: (userId: string) => Promise<void>;
    getAllUsers: (role?: UserRole) => Promise<UserData[]>;
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
    
    // Canvas Functions
    getCanvasUserAndPaper: (userId: string, paperId: string) => Promise<Canvas | null>;
    createCanvas: (canvasData: Canvas) => Promise<string>;
    updateCanvas: (canvasId: string, updates: Partial<Canvas>) => Promise<void>;

    // Highlight Functions
    getHighlightsByUser: (userId: string) => Promise<ReadHighlight[]>;
    getHighlightsByPaper: (paperId: string) => Promise<ReadHighlight[]>;
    getHighlightsByUsersAndPapers: (userIds: string[], paperIds: string[]) => Promise<Record<string, ReadHighlight[]>>;
    addHighlight: (highlight: ReadHighlight) => Promise<string>;

    // Purpose Functions
    getPurposesByUser: (userId: string) => Promise<ReadPurpose[]>;
    getPurposesByPaper: (paperId: string) => Promise<ReadPurpose[]>;
    getPurposesByUserAndPaper: (userId: string, paperId: string) => Promise<ReadPurpose[]>;
    addPurpose: (purpose: ReadPurpose) => Promise<string>;

    // Session Functions
    getSessionsByUser: (userId: string, paperIds?: string[]) => Promise<ReadSession[]>;
    getSessionsByPaper: (paperId: string, userIds?: string[]) => Promise<ReadSession[]>;
    getSessionsByUsersAndPapers: (userIds: string[], paperIds: string[]) => Promise<Record<string, ReadSession[]>>;
    addSession: (session: ReadSession) => Promise<string>;

    // Batch Operations
    batchAddHighlights: (highlights: ReadHighlight[]) => Promise<string[]>;
    batchAddPurposes: (purposes: ReadPurpose[]) => Promise<string[]>;
    batchAddSessions: (sessions: ReadSession[]) => Promise<string[]>;
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
    const canvasesCollectionRef = collection(db, 'canvases');
    const highlightsCollectionRef = collection(db, 'highlights');
    const purposesCollectionRef = collection(db, 'readPurposes');
    const sessionsCollectionRef = collection(db, 'readSessions');

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

    const getAllUsers = async (role?: UserRole) => {
        let userDocs;
        if (role) {
            const q = query(usersCollectionRef, where('role', '==', role));
            userDocs = await getDocs(q);
        }
        else {
            userDocs = await getDocs(usersCollectionRef);
        }
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

    // Canvas Functions
    const getCanvasUserAndPaper = async (userId: string, paperId: string): Promise<Canvas | null> => {
        const q = query(canvasesCollectionRef, where('userId', '==', userId), where('paperId', '==', paperId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Canvas)[0];
    }

    const createCanvas = async (canvasData: Canvas): Promise<string> => {
        await setDoc(doc(canvasesCollectionRef, canvasData.id), canvasData);
        return canvasData.id;
    }

    const updateCanvas = async (canvasId: string, updates: Partial<Canvas>): Promise<void> => {
        const canvasRef = doc(canvasesCollectionRef, canvasId);
        await setDoc(canvasRef, updates, { merge: true });
    }

    // Highlight Functions
    const getHighlightsByUser = async (userId: string): Promise<ReadHighlight[]> => {
        const q = query(highlightsCollectionRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadHighlight);
    }

    const getHighlightsByPaper = async (paperId: string): Promise<ReadHighlight[]> => {
        const q = query(highlightsCollectionRef, where('paperId', '==', paperId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadHighlight);
    }

    const getHighlightsByUsersAndPapers = async (userIds: string[], paperIds: string[]): Promise<Record<string, ReadHighlight[]>> => {
        const q = query(highlightsCollectionRef, where('userId', 'in', userIds), where('paperId', 'in', paperIds));
        const querySnapshot = await getDocs(q);
        const highlights = querySnapshot.docs.map(doc => doc.data() as ReadHighlight);
        const grouped: Record<string, ReadHighlight[]> = {};
        highlights.forEach(highlight => {
            const key = `${highlight.userId}_${highlight.paperId}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(highlight);
        });
        return grouped;
    }

    const addHighlight = async (highlight: ReadHighlight): Promise<string> => {
        await setDoc(doc(highlightsCollectionRef, highlight.id), highlight);
        return highlight.id;
    }

    // Purpose Functions
    const getPurposesByUser = async (userId: string): Promise<ReadPurpose[]> => {
        const q = query(purposesCollectionRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadPurpose);
    }

    const getPurposesByPaper = async (paperId: string): Promise<ReadPurpose[]> => {
        const q = query(purposesCollectionRef, where('paperId', '==', paperId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadPurpose);
    }

    const getPurposesByUserAndPaper = async (userId: string, paperId: string): Promise<ReadPurpose[]> => {
        const q = query(purposesCollectionRef, where('userId', '==', userId), where('paperId', '==', paperId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadPurpose);
    }

    const addPurpose = async (purpose: ReadPurpose): Promise<string> => {
        await setDoc(doc(purposesCollectionRef, purpose.id), purpose);
        return purpose.id;
    }

    // Session Functions
    const getSessionsByUser = async (userId: string, paperIds?: string[]): Promise<ReadSession[]> => {
        let q;
        if (paperIds && paperIds.length > 0) {
            q = query(sessionsCollectionRef, where('userId', '==', userId), where('paperId', 'in', paperIds));
        } else {
            q = query(sessionsCollectionRef, where('userId', '==', userId));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadSession);
    }

    const getSessionsByPaper = async (paperId: string, userIds?: string[]): Promise<ReadSession[]> => {
        let q;
        if (userIds && userIds.length > 0) {
            q = query(sessionsCollectionRef, where('paperId', '==', paperId), where('userId', 'in', userIds));
        } else {
            q = query(sessionsCollectionRef, where('paperId', '==', paperId));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ReadSession);
    }

    // Returns a dictionary grouped by (paperId, userId) pair: { [paperId_userId]: ReadSession[] }
    const getSessionsByUsersAndPapers = async (
        userIds: string[],
        paperIds: string[]
    ): Promise<Record<string, ReadSession[]>> => {
        const q = query(
            sessionsCollectionRef,
            where('userId', 'in', userIds),
            where('paperId', 'in', paperIds)
        );
        const querySnapshot = await getDocs(q);
        const sessions = querySnapshot.docs.map(doc => doc.data() as ReadSession);

        // Group by (paperId, userId) pair
        const grouped: Record<string, ReadSession[]> = {};
        sessions.forEach(session => {
            const key = `${session.userId}_${session.paperId}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(session);
        });
        return grouped;
    }

    const addSession = async (session: ReadSession): Promise<string> => {
        await setDoc(doc(sessionsCollectionRef, session.id), session);
        return session.id;
    }

    // Batch Operations
    const batchAddHighlights = async (highlights: ReadHighlight[]): Promise<string[]> => {
        const promises = highlights.map(highlight => 
            setDoc(doc(highlightsCollectionRef, highlight.id), highlight)
        );
        await Promise.all(promises);
        return highlights.map(h => h.id);
    }

    const batchAddPurposes = async (purposes: ReadPurpose[]): Promise<string[]> => {
        const promises = purposes.map(purpose => 
            setDoc(doc(purposesCollectionRef, purpose.id), purpose)
        );
        await Promise.all(promises);
        return purposes.map(p => p.id);
    }

    const batchAddSessions = async (sessions: ReadSession[]): Promise<string[]> => {
        const promises = sessions.map(session => 
            setDoc(doc(sessionsCollectionRef, session.id), session)
        );
        await Promise.all(promises);
        return sessions.map(s => s.id);
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
                getCanvasUserAndPaper,
                createCanvas,
                updateCanvas,
                getHighlightsByUser,
                getHighlightsByPaper,
                getHighlightsByUsersAndPapers,
                addHighlight,
                getPurposesByUser,
                getPurposesByPaper,
                getPurposesByUserAndPaper,
                addPurpose,
                getSessionsByUser,
                getSessionsByPaper,
                getSessionsByUsersAndPapers,
                addSession,
                batchAddHighlights,
                batchAddPurposes,
                batchAddSessions,
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