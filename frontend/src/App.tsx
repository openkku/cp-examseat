// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudentSearch } from './pages/StudentSearch';
import { RoomExplorer } from './pages/RoomExplorer';
import { StatsPage } from './pages/Stats';
import { AppShell } from './components/layout/AppShell';
import { PageTransition } from './components/layout/PageTransition';
import { RoomInfo } from './pages/RoomInfo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Default Route: The Student Search Page */}
          <Route path="/" element={<PageTransition><StudentSearch /></PageTransition>} />
          
          {/* Main App Routes */}
          <Route path="/explorer" element={<PageTransition><RoomExplorer /></PageTransition>} />
          <Route path="/stats" element={<PageTransition><StatsPage /></PageTransition>} />
          <Route path="/room" element={<PageTransition><RoomInfo /></PageTransition>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;