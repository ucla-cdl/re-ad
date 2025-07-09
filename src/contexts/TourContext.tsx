import React, { createContext, useContext, useState } from "react";
import { Step } from "react-joyride";

type TourContextType = {
  runTour: boolean;
  setRunTour: (runTour: boolean) => void;
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  stepIndex: number;
  setStepIndex: (stepIndex: number) => void;
}

const STEPS: Step[] = [
  {
    target: '.upload-pdf',
    content: 'Get started by uploading your first PDF!',
    placement: 'bottom',
    data: {
      pause: true
    }
  },
  {
    target: ".add-new-read-btn",
    content: "Get started with setting up your first read here! Different reads should be mapped to different intentions.",
    placement: "bottom",
    data: {
      pause: true
    }
  },
  {
    target: ".active-read",
    content: "You can see what read you are currently on. Any highlight will be associated with the selected read. Use this to also toggle between your reads.",
    placement: "left-end",
  },
  {
    target: '.pdf-container',
    content: 'Get started by highlighting your first highlight! You can also hold option and take a screenshot as a highlight',
    placement: 'right'
  },
  {
    target: '.pdf-container',
    content: 'Each highlight you make will create a node corresponding to that node and the current read you are on. With this node, you are able to link them to other nodes, generate summaries & definitions, as well as take your own notes.',
    placement: 'right',
  },
];

export const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const [runTour, setRunTour] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [stepIndex, setStepIndex] = useState<number>(0);

  return (
    <TourContext.Provider
      value={{
        runTour,
        setRunTour,
        steps,
        setSteps,
        stepIndex,
        setStepIndex,
      }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTourContext must be used within a TourContextProvider');
  }

  return context;
};