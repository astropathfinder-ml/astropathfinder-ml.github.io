import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type SpectrumPoint = { wavelength: number; depth: number };
type AnalysisType = 'none' | 'template' | 'ml';
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const GAS_SIGNATURES = {
    'H₂O': { center: 1.4, width: 0.1, depth: 0.0008 },
    'CO₂': { center: 2.0, width: 0.08, depth: 0.0006 },
    'O₃ (Biosignature)': { center: 1.7, width: 0.05, depth: 0.00025 } // Weaker signal
};

const TRADITIONAL_CODE = `def find_gases_template_matching(spectrum):
    # Uses a simple template matching algorithm
    # which looks for dips at exact wavelengths.
    # It is sensitive to noise and can miss
    # weak or overlapping signals.
    detected_gases = []
    
    # High-confidence detection for strong signals
    if has_dip_at(spectrum, 1.4):
        detected_gases.append('H₂O')
    if has_dip_at(spectrum, 2.0):
        detected_gases.append('CO₂')
        
    # Fails to detect the weak O₃ signal in noise
    return detected_gases`;

const ML_CODE = `from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, Dense

# A 1D-CNN model trained to recognize spectral
# patterns, even with significant noise.
# It learns the complex features of multiple
# gases and can detect weak biosignatures.
model = build_spectral_cnn()
model.fit(X_train, y_train)

# Correctly identifies all gases
predictions = model.predict(spectrum)
# Output: ['H₂O', 'CO₂', 'O₃ (Biosignature)']`;

// --- Data Generation & Logic ---
const generateSpectrum = (): SpectrumPoint[] => {
    const data: SpectrumPoint[] = [];
    for (let w = 1.0; w <= 2.4; w += 0.01) {
        let depth = 1.0; // Normalized baseline
        // Add gas signatures
        for (const gas of Object.values(GAS_SIGNATURES)) {
            depth -= gas.depth * Math.exp(-Math.pow((w - gas.center) / gas.width, 2));
        }
        // Add noise
        depth += (Math.random() - 0.5) * 0.00015;
        data.push({ wavelength: w, depth });
    }
    return data;
};

// --- Components ---
const AnalysisPlot: React.FC<{ data: SpectrumPoint[], highlight: AnalysisType }> = ({ data, highlight }) => {
    const width = 500;
    const height = 400;
    const padding = 50;

    const domainX = [1.0, 2.4];
    const domainY = [Math.min(...data.map(d => d.depth)) * 0.999, 1.0001];

    const scaleX = (w: number) => padding + ((w - domainX[0]) / (domainX[1] - domainX[0])) * (width - 2 * padding);
    const scaleY = (d: number) => (height - padding) - ((d - domainY[0]) / (domainY[1] - domainY[0])) * (height - 2 * padding);

    const linePath = data.map(p => `${scaleX(p.wavelength)},${scaleY(p.depth)}`).join(' L ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Exoplanet atmospheric spectrum">
            {/* Axis Labels */}
            <text x={width / 2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Wavelength (microns)</text>
            <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Transit Depth</text>

            {/* Line plot */}
            <path d={`M ${linePath}`} stroke="#a78bfa" strokeWidth="2" fill="none" />

            {/* Highlights */}
            {Object.entries(GAS_SIGNATURES).map(([name, gas]) => {
                const isActive = (highlight === 'template' && name !== 'O₃ (Biosignature)') || highlight === 'ml';
                const color = name === 'O₃ (Biosignature)' ? 'text-green-400' : 'text-cyan-400';
                return (
                    <g key={name} opacity={isActive ? 1 : 0.3} style={{transition: 'opacity 0.3s'}}>
                        <rect x={scaleX(gas.center - gas.width)} y={padding} width={scaleX(gas.center + gas.width) - scaleX(gas.center - gas.width)} height={height - 2 * padding} fill={name === 'O₃ (Biosignature)' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(34, 211, 238, 0.1)'} />
                        <text x={scaleX(gas.center)} y={padding - 5} textAnchor="middle" className={`fill-current text-xs ${color}`}>{name}</text>
                    </g>
                )
            })}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; detectedGases: string[]; active: boolean; icon: React.ReactNode; color: string;}> = ({title, detectedGases, active, icon, color}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold text-slate-700">Detected Gases:</h4>
            <ul className="mt-2 space-y-1">
                {detectedGases.map(gas => (
                    <li key={gas} className={`flex items-center gap-2 font-medium ${gas.includes('Biosignature') ? 'text-green-600' : 'text-slate-600'}`}>
                         {gas.includes('Biosignature') ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <span className="w-5 h-5 text-center">-</span> }
                        {gas}
                    </li>
                ))}
                 {detectedGases.length < 3 && <li className="text-red-600 font-medium flex items-center gap-2"><XCircleIcon className="w-5 h-5 text-red-500" />O₃ (Biosignature) - Not Found</li>}
            </ul>
        </div>
    </div>
);

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);


const AtmosphereExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<SpectrumPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);

    useEffect(() => {
        setData(generateSpectrum());
    }, []);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setTimeout(() => {
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

    return (
        <div className="animate-fade-in space-y-12">
             <header className="text-center">
                <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                Atmospheric Biosignature Detection
                </h1>
                <div className="flex justify-center items-center gap-2 mt-3">
                    <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                        Supervised Learning
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-semibold text-sm">
                        Classification (1D-CNN)
                    </span>
                </div>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    A key technique in the search for life is analyzing the light that passes through an exoplanet's atmosphere. Can we detect the chemical fingerprint of life—a biosignature—in a noisy spectrum?
                </p>
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-lg border border-indigo-200 hover:bg-indigo-200 hover:border-indigo-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Read the Research Paper: "{paperTitle}"
                </a>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="lg:sticky top-24">
                    <AnalysisPlot data={data} highlight={analysisType} />
                    <div className="mt-2 text-center text-sm text-slate-500">
                        Simulated atmospheric spectrum of a transiting exoplanet.
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <button onClick={() => handleRunAnalysis('template')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'template' ? 'Analyzing...' : 'Run Template Matching'}
                        </button>
                        {analysisType === 'template' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={TRADITIONAL_CODE} />
                                <ResultCard 
                                    title="Template Matching"
                                    detectedGases={['H₂O', 'CO₂']}
                                    active={analysisType === 'template'}
                                    icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                                    color="border-red-500"
                                />
                            </div>
                        )}
                    </div>
                     <div>
                        <button onClick={() => handleRunAnalysis('ml')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'ml' ? 'Analyzing...' : 'Run ML Analysis'}
                        </button>
                        {analysisType === 'ml' && (
                             <div className="mt-4 space-y-4 animate-fade-in">
                               <CodeDisplay code={ML_CODE} />
                               <ResultCard 
                                    title="1D-CNN Model (ML)"
                                    detectedGases={['H₂O', 'CO₂', 'O₃ (Biosignature)']}
                                    active={analysisType === 'ml'}
                                    icon={<CheckCircleIcon className="w-8 h-8 text-green-500" />}
                                    color="border-green-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AtmosphereExample;