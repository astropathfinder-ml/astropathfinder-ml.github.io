
import React, { useState } from 'react';

const CodePlayground: React.FC = () => {
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitted(true);
    console.log("Submitted code:", code);
    // In a real scenario, this would connect to a code execution service
    setTimeout(() => {
      setSubmitted(false);
      setCode('');
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="code-input" className="sr-only">Code Input</label>
        <textarea
          id="code-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="import numpy as np..."
          className="w-full h-96 p-4 font-mono text-sm bg-slate-900 text-slate-200 rounded-md border-2 border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
          aria-label="Code input area"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitted}
          className="px-8 py-3 text-white font-semibold rounded-md transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {submitted ? 'Submitted!' : 'Run Code'}
        </button>
      </div>
    </form>
  );
};

export default CodePlayground;
