import React from 'react';
import AstroBotPanel from '../components/AstroBotPanel';

const AstroBot: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          AstroBot
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
          Your personal AI assistant for astrobiology and machine learning. Ask me anything about the topics covered in this guide, or general questions about the field.
        </p>
      </header>
      <div className="w-full max-w-2xl">
        <AstroBotPanel />
      </div>
    </div>
  );
};

export default AstroBot;
