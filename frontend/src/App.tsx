import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VisualizationPage from './pages/VisualizationPage';
import ExperimentsPage from './pages/ExperimentsPage';
import ResultsPage from './pages/ResultsPage';
import DatasetsPage from './pages/DatasetsPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path='visualization' element={<VisualizationPage />} />
          <Route path='experiments' element={<ExperimentsPage />} />
          <Route path='results' element={<ResultsPage />} />
          <Route path='datasets' element={<DatasetsPage />} />
          <Route path='about' element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
