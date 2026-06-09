import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudentSearch } from './pages/StudentSearch';
import { RoomExplorer } from './pages/RoomExplorer';
import { StatsPage } from './pages/Stats';
import { Layout } from './components/Layout';
import { RoomInfo } from './pages/RoomInfo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
        {/* Default Route: The Student Search Page */}
        <Route path="/" element={<StudentSearch />} />
        
        {/* Admin Route: The Room Map Page */}
        <Route path="/explorer" element={<RoomExplorer />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/room" element={<RoomInfo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;