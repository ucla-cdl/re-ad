import "./App.css";
import { PaperContextProvider } from "./contexts/PaperContext";
import { PaperReader } from "./containers/PaperReader";
import { useEffect } from "react";
import { TourProvider } from "./contexts/TourContext";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Home } from "./containers/ProjectPage";
import { PapersHub } from "./containers/PapersHub";
import { ReadingAnalyticsProvider } from "./contexts/ReadingAnalyticsContext";
import { StorageProvider } from "./contexts/StorageContext";

function App() {
  useEffect(() => {
    window.sessionStorage.clear();
  }, []);

  return (
    <StorageProvider>
      <TourProvider>
        <PaperContextProvider>
          <ReadingAnalyticsProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/papers" element={<PapersHub />} />
                <Route path="/paper-reader" element={<PaperReader />} />
              </Routes>
            </HashRouter>
          </ReadingAnalyticsProvider>
        </PaperContextProvider>
      </TourProvider>
    </StorageProvider>
  );
}

export default App;
