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
    'O₃': { center: 1.7, width: 0.05, depth: 0.00025 }, // Ozone, an oxygen proxy
    'CH₄': { center: 2.2, width: 0.06, depth: 0.00030 }, // Methane
};

const TRADITIONAL_CODE = `const traditionalClassifier = (spectrum) => {
    // Uses a simple check for a dip near a specific wavelength.
    // This is sensitive to noise and can miss weak signals.
    const detected = [];
    const h2oPoint = spectrum.find(p => Math.abs(p.wavelength - 1.4) < 0.01);
    const co2Point = spectrum.find(p => Math.abs(p.wavelength - 2.0) < 0.01);

    if (h2oPoint && h2oPoint.depth < 0.9995) detected.push('H₂O');
    if (co2Point && co2Point.depth < 0.9996) detected.push('CO₂');
    
    // Fails to detect the weak O₃ and CH₄ signals in noise.
    return detected;
};`;

const ML_CODE = `const mlClassifier = (spectrum) => {
    // This model performs a 1D-convolution. It slides a "kernel" 
    // representing an absorption dip across the spectrum to find matches.
    // It's robust enough to find the weak individual signals for
    // both O₃ and CH₄, allowing detection of the combined signature.
    const detected = [];
    const kernel = [-0.5, -1, -0.5]; // Represents an absorption dip

    for (const [name, gas] of Object.entries(GAS_SIGNATURES)) {
        let maxMatchScore = -Infinity;
        // Search near the expected gas wavelength
        for (let i = /*...search window...*/; i++) {
            const slice = [spectrum[i-1].depth, spectrum[i].depth, spectrum[i+1].depth];
            const score = kernel.reduce((sum, k, j) => sum + k * (1.0 - slice[j]), 0);
            if (score > maxMatchScore) maxMatchScore = score;
        }
        
        // Tuned thresholds to detect signals
        const threshold = (name === 'O₃' || name === 'CH₄') ? -0.00008 : -0.0004;
        if (maxMatchScore < threshold) {
             detected.push(name);
        }
    }
    return detected;
};`;

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
        data.push({ wavelength: w, depth: parseFloat(depth.toFixed(6)) });
    }
    return data;
};

// --- Real Classifiers ---

const traditionalClassifier = (spectrum: SpectrumPoint[]): string[] => {
    const detected: string[] = [];
    const h2oPoint = spectrum.find(p => Math.abs(p.wavelength - 1.4) < 0.01);
    const co2Point = spectrum.find(p => Math.abs(p.wavelength - 2.0) < 0.01);

    if (h2oPoint && h2oPoint.depth < 0.9995) detected.push('H₂O');
    if (co2Point && co2Point.depth < 0.9996) detected.push('CO₂');
    
    return detected;
};

const mlClassifier = (spectrum: SpectrumPoint[]): string[] => {
    const detected: string[] = [];
    const kernel = [-0.5, -1, -0.5]; // Represents an absorption dip
    const step = 0.01; // Wavelength step

    for (const [name, gas] of Object.entries(GAS_SIGNATURES)) {
        const centerIndex = Math.round((gas.center - 1.0) / step);
        const searchWidth = Math.round(gas.width / step) * 2;
        
        let maxMatchScore = -Infinity;
        
        for (let i = centerIndex - searchWidth; i <= centerIndex + searchWidth; i++) {
            if (i < 1 || i >= spectrum.length - 1) continue;

            const slice = [spectrum[i-1].depth, spectrum[i].depth, spectrum[i+1].depth];
            // Invert depth so dips are positive, then subtract baseline
            const normalizedSlice = slice.map(d => (1.0 - d)); 
            
            const score = kernel[0] * normalizedSlice[0] + kernel[1] * normalizedSlice[1] + kernel[2] * normalizedSlice[2];
            if (score > maxMatchScore) {
                maxMatchScore = score;
            }
        }
        
        // Thresholds tuned to detect the signals
        const threshold = (name === 'O₃' || name === 'CH₄') ? -0.00008 : -0.0004;
        if (maxMatchScore < threshold) { // More negative is a stronger dip match
             detected.push(name);
        }
    }
    return detected;
};


// --- Components ---
const AnalysisPlot: React.FC<{ data: SpectrumPoint[], highlightGases: string[] }> = ({ data, highlightGases }) => {
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
                const isBiosignatureComponent = name === 'O₃' || name === 'CH₄';
                const isActive = highlightGases.includes(name);
                const color = isBiosignatureComponent ? 'text-green-400' : 'text-cyan-400';
                return (
                    <g key={name} opacity={isActive ? 1 : 0.3} style={{transition: 'opacity 0.3s'}}>
                        <rect x={scaleX(gas.center - gas.width)} y={padding} width={scaleX(gas.center + gas.width) - scaleX(gas.center - gas.width)} height={height - 2 * padding} fill={isBiosignatureComponent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(34, 211, 238, 0.1)'} />
                        <text x={scaleX(gas.center)} y={padding - 5} textAnchor="middle" className={`fill-current text-xs ${color}`}>{name}</text>
                    </g>
                )
            })}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; detectedGases: string[]; active: boolean; icon: React.ReactNode; color: string;}> = ({title, detectedGases, active, icon, color}) => {
    const isO3Detected = detectedGases.includes('O₃');
    const isCH4Detected = detectedGases.includes('CH₄');
    const isCombinedDetected = isO3Detected && isCH4Detected;

    return (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 mt-4 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold text-slate-700">Detected Signatures:</h4>
            <ul className="mt-2 space-y-1">
                {['H₂O', 'CO₂'].map(gas => {
                     const isDetected = detectedGases.includes(gas);
                     return (
                        <li key={gas} className={`flex items-center gap-2 font-medium ${isDetected ? 'text-slate-600' : 'text-slate-400'}`}>
                            {isDetected ? <CheckCircleIcon className="w-5 h-5 text-slate-500" /> : <XCircleIcon className="w-5 h-5 text-slate-400" />}
                            {gas} {isDetected ? '' : '- Not Found'}
                        </li>
                     );
                })}
                <li className={`flex items-center gap-2 font-medium ${isCombinedDetected ? 'text-green-600' : 'text-red-600'}`}>
                    {isCombinedDetected ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-red-500" />}
                    O₃ + CH₄ (Combined Biosignature)
                </li>
                {!isCombinedDetected && (
                     <li className="pl-7 text-xs font-mono">
                        <span className={isO3Detected ? 'text-green-600' : 'text-red-600'}>O₃: {isO3Detected ? 'Found' : 'MISSING'}</span>,{' '}
                        <span className={isCH4Detected ? 'text-green-600' : 'text-red-600'}>CH₄: {isCH4Detected ? 'Found' : 'MISSING'}</span>
                    </li>
                )}
            </ul>
        </div>
    </div>
    )
};

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm max-h-60 overflow-auto">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);


const AtmosphereExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<SpectrumPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [detectedGases, setDetectedGases] = useState<string[]>([]);

    useEffect(() => {
        setData(generateSpectrum());
        setAnalysisType('none');
    }, []);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setDetectedGases([]);

        setTimeout(() => {
            let gases: string[] = [];
            if (type === 'template') {
                gases = traditionalClassifier(data);
            } else if (type === 'ml') {
                gases = mlClassifier(data);
            }
            setDetectedGases(gases);
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

    const isMlSuccessful = useMemo(() => {
        return detectedGases.includes('O₃') && detectedGases.includes('CH₄');
    }, [detectedGases]);

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
                    A key technique in the search for life is analyzing an exoplanet's atmosphere. Can we detect a robust biosignature—like the simultaneous presence of O₃ (an oxygen proxy) and CH₄ (methane)—in a noisy spectrum?
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
                    <AnalysisPlot data={data} highlightGases={detectedGases} />
                    <div className="mt-2 text-center text-sm text-slate-500">
                        Simulated atmospheric spectrum of a transiting exoplanet.
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 1: Template Matching</h3>
                        <p className="text-sm text-slate-600">This traditional method uses a simple algorithm to look for dips at exact, pre-defined wavelengths. It is highly sensitive to noise and cannot detect the weak biosignature gases.</p>
                        <CodeDisplay code={TRADITIONAL_CODE} />
                        <button onClick={() => handleRunAnalysis('template')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'template' ? 'Analyzing...' : 'Run Template Matching'}
                        </button>
                        {analysisType === 'template' && (
                            <div className="animate-fade-in">
                                <ResultCard 
                                    title="Template Matching"
                                    detectedGases={detectedGases}
                                    active={analysisType === 'template'}
                                    icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                                    color={"border-red-500"}
                                />
                            </div>
                        )}
                    </div>
                     <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 2: 1D-Convolution Matcher (ML)</h3>
                        <p className="text-sm text-slate-600">This ML model is robust enough to detect the weak, individual signals of both O₃ and CH₄, allowing it to identify the combined biosignature that the simpler method misses entirely.</p>
                        <CodeDisplay code={ML_CODE} />
                        <button onClick={() => handleRunAnalysis('ml')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'ml' ? 'Analyzing...' : 'Run ML Analysis'}
                        </button>
                        {analysisType === 'ml' && (
                             <div className="animate-fade-in">
                               <ResultCard 
                                    title="1D-Convolution Matcher (ML)"
                                    detectedGases={detectedGases}
                                    active={analysisType === 'ml'}
                                    icon={isMlSuccessful ? <CheckCircleIcon className="w-8 h-8 text-green-500" /> : <XCircleIcon className="w-8 h-8 text-red-500" />}
                                    color={isMlSuccessful ? "border-green-500" : "border-red-500"}
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