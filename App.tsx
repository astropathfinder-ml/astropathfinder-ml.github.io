

import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import UnsupervisedLearning from './pages/UnsupervisedLearning';
import SupervisedLearning from './pages/SupervisedLearning';
import Playground from './pages/Playground';
import DataLab from './pages/DataLab';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/unsupervised" element={<UnsupervisedLearning />} />
            <Route path="/supervised" element={<SupervisedLearning />} />
            <Route path="/playground/:exampleId?" element={<Playground />} />
            <Route path="/datalab" element={<DataLab />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;