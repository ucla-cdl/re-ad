import { createContext, useContext, useEffect, useState } from "react";
import { PaperData, UserData, UserRole, useStorageContext } from "./StorageContext";

type WorkspaceContextData = {
    usersDict: Record<string, UserData>;
    papersDict: Record<string, PaperData>;
    setUsersDict: (usersDict: Record<string, UserData>) => void;
    setPapersDict: (papersDict: Record<string, PaperData>) => void;
    mode: ModeType;
    setMode: (mode: ModeType) => void;
    viewingPaperId: string | null;
    setViewingPaperId: (viewingPaperId: string | null) => void;
}

export const MODE_TYPES = {
    READING: "reading",
    ANALYZING: "analyzing",
};

export type ModeType = typeof MODE_TYPES[keyof typeof MODE_TYPES];

const WorkspaceContext = createContext<WorkspaceContextData | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
    const { userData, getAllUsers, getPapersByUser, getPaperDataById } = useStorageContext();

    const [usersDict, setUsersDict] = useState<Record<string, UserData>>({});
    const [papersDict, setPapersDict] = useState<Record<string, PaperData>>({});
    const [mode, setMode] = useState<ModeType>(MODE_TYPES.READING);
    const [viewingPaperId, setViewingPaperId] = useState<string | null>(null); // current viewing paper

    useEffect(() => {
        setMode(MODE_TYPES.READING);
        setViewingPaperId(null);
        loadUsersAndPapers();
    }, [userData]);

    const loadUsersAndPapers = async () => {
        if (!userData) return;

        // TODO: load users that the user has access to (e.g. friends, classmates, etc.)
        if (userData.role === UserRole.STUDENT) {
            setUsersDict({
                [userData.id]: userData,
            });
        }
        else {
            const users = await getAllUsers();
            setUsersDict(users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {} as Record<string, UserData>));
        }

        // load papers that the user has access to
        const userPaperTableData = await getPapersByUser(userData.id);
        const paperIds = userPaperTableData.map(data => data.paperId);
        const papers = await getPaperDataById(paperIds);
        setPapersDict(papers.reduce((acc, paper) => {
            acc[paper.id] = paper;
            return acc;
        }, {} as Record<string, PaperData>));
    }

    return (
        <WorkspaceContext.Provider value={{
            usersDict,
            papersDict,
            setUsersDict,
            setPapersDict,
            mode,
            setMode,
            viewingPaperId,
            setViewingPaperId,
        }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export const useWorkspaceContext = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
    }

    return context;
}