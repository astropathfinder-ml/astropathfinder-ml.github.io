import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type GalaxyType = 'spiral' | 'elliptical' | 'irregular';
type DataPoint = { id: number; features: { color: number; concentration: number }; type: GalaxyType; };
type KMeansResult = {
    assignments: number[];
    centroids: { x: number; y: number }[];
};
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const KMEANS_CODE_FULL = `const runKMeans = (data, k, xCol, yCol, maxIterations = 50) => {
    // 1. Initialize centroids randomly from the data points
    let centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k && centroids.length < data.length) {
        const randomIndex = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(randomIndex)) {
            centroids.push({ x: data[randomIndex][xCol], y: data[randomIndex][yCol] });
            usedIndices.add(randomIndex);
        }
    }

    let assignments = new Array(data.length).fill(0);
    let changed = true;

    for (let iter = 0; iter < maxIterations && changed; iter++) {
        changed = false;
        
        // 2. Assign each point to the nearest centroid
        data.forEach((point, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, clusterIndex) => {
                const distance = Math.sqrt(
                    Math.pow(point[xCol] - centroid.x, 2) + 
                    Math.pow(point[yCol] - centroid.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = clusterIndex;
                }
            });
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                changed = true;
            }
        });

        // 3. Recalculate centroids based on the mean of assigned points
        const newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
        data.forEach((point, i) => {
            const clusterIndex = assignments[i];
            newCentroids[clusterIndex].x += point[xCol];
            newCentroids[clusterIndex].y += point[yCol];
            newCentroids[clusterIndex].count++;
        });

        centroids = newCentroids.map(c => ({
            x: c.count > 0 ? c.x / c.count : 0,
            y: c.count > 0 ? c.y / c.count : 0,
        }));
    }
    return { assignments, centroids };
};`;

const CODE_SECTIONS = [
    { key: 'start', code: `const runKMeans = (data, k, xCol, yCol, maxIterations = 50) => {` },
    { key: 'init', code: `    // 1. Initialize centroids randomly from the data points
    let centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k && centroids.length < data.length) {
        const randomIndex = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(randomIndex)) {
            centroids.push({ x: data[randomIndex][xCol], y: data[randomIndex][yCol] });
            usedIndices.add(randomIndex);
        }
    }

    let assignments = new Array(data.length).fill(0);
    let changed = true;` },
    { key: 'loop', code: `
    for (let iter = 0; iter < maxIterations && changed; iter++) {
        changed = false;
        
        // 2. Assign each point to the nearest centroid
        data.forEach((point, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, clusterIndex) => {
                const distance = Math.sqrt(
                    Math.pow(point[xCol] - centroid.x, 2) + 
                    Math.pow(point[yCol] - centroid.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = clusterIndex;
                }
            });
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                changed = true;
            }
        });

        // 3. Recalculate centroids based on the mean of assigned points
        const newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
        data.forEach((point, i) => {
            const clusterIndex = assignments[i];
            newCentroids[clusterIndex].x += point[xCol];
            newCentroids[clusterIndex].y += point[yCol];
            newCentroids[clusterIndex].count++;
        });

        centroids = newCentroids.map(c => ({
            x: c.count > 0 ? c.x / c.count : 0,
            y: c.count > 0 ? c.y / c.count : 0,
        }));
    }` },
    { key: 'return', code: `
    return { assignments, centroids };` },
    { key: 'end', code: `};` },
];


// --- Data Generation & Logic ---
const generateData = (numPoints = 150): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < numPoints; i++) {
        let type: GalaxyType;
        let color, concentration;
        const rand = Math.random();

        if (rand < 0.4) { // Spiral
            type = 'spiral';
            color = 0.7 + Math.random() * 0.3; // Blueish
            concentration = 0.2 + Math.random() * 0.4;
        } else if (rand < 0.8) { // Elliptical
            type = 'elliptical';
            color = 0.2 + Math.random() * 0.4; // Reddish
            concentration = 0.5 + Math.random() * 0.3;
        } else { // Irregular
            type = 'irregular';
            color = 0.5 + Math.random() * 0.4;
            concentration = 0.1 + Math.random() * 0.3;
        }
        data.push({ id: i, features: { color, concentration }, type });
    }
    return data;
};

const runKMeansWithHistory = (
    data: DataPoint[],
    k: number,
    xCol: 'color' | 'concentration',
    yCol: 'color' | 'concentration',
    maxIterations = 50
): KMeansResult[] => {
    const history: KMeansResult[] = [];
    
    // 1. Initialize centroids randomly
    let centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k && centroids.length < data.length) {
        const randomIndex = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(randomIndex)) {
            centroids.push({ x: data[randomIndex].features[xCol], y: data[randomIndex].features[yCol] });
            usedIndices.add(randomIndex);
        }
    }

    let assignments = new Array(data.length).fill(0);
    // Initial state
    history.push({ assignments: [...assignments], centroids: JSON.parse(JSON.stringify(centroids)) });
    
    let changed = true;
    for (let iter = 0; iter < maxIterations && changed; iter++) {
        changed = false;
        
        // 2. Assign points to the nearest centroid
        data.forEach((point, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, clusterIndex) => {
                const distance = Math.sqrt(
                    Math.pow(point.features[xCol] - centroid.x, 2) + Math.pow(point.features[yCol] - centroid.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = clusterIndex;
                }
            });
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                changed = true;
            }
        });

        // 3. Recalculate centroids
        const newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
        data.forEach((point, i) => {
            const clusterIndex = assignments[i];
            newCentroids[clusterIndex].x += point.features[xCol];
            newCentroids[clusterIndex].y += point.features[yCol];
            newCentroids[clusterIndex].count++;
        });

        centroids = newCentroids.map((c, i) => (
            c.count > 0 
                ? { x: c.x / c.count, y: c.y / c.count } 
                // If a centroid has no points, re-initialize it to avoid getting stuck
                : { x: data[Math.floor(Math.random() * data.length)].features[xCol], y: data[Math.floor(Math.random() * data.length)].features[yCol] }
        ));
        
        history.push({ assignments: [...assignments], centroids: JSON.parse(JSON.stringify(centroids)) });
    }
    return history;
};


// --- Components ---
const CLUSTER_COLORS = ['#2dd4bf', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8', '#84cc16', '#ef4444', '#f97316', '#6366f1', '#8b5cf6'];
const TRUE_TYPE_COLORS: {[key in GalaxyType]: string} = {
    spiral: '#06b6d4',
    elliptical: '#ef4444',
    irregular: '#64748b'
};


const AnalysisPlot: React.FC<{
    data: DataPoint[],
    result: KMeansResult | null,
    previousResult: KMeansResult | null
}> = ({ data, result, previousResult }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const domainX = [0.1, 1.1]; // Color
    const domainY = [0, 0.9]; // Concentration

    const scaleX = (val: number) => padding + ((val - domainX[0]) / (domainX[1] - domainX[0])) * (width - 2 * padding);
    const scaleY = (val: number) => (height - padding) - ((val - domainY[0]) / (domainY[1] - domainY[0])) * (height - padding * 1.5);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Galaxy morphology scatter plot">
            {/* Axis Labels */}
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Color Index (Blue &rarr; Red)</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Light Concentration</text>
            
            {/* Data points */}
            {data.map((p) => (
                 <circle
                    key={p.id}
                    cx={scaleX(p.features.color)}
                    cy={scaleY(p.features.concentration)}
                    r="4"
                    fill={result ? CLUSTER_COLORS[result.assignments[p.id] % CLUSTER_COLORS.length] : TRUE_TYPE_COLORS[p.type]}
                    opacity="0.9"
                    style={{transition: 'fill 0.3s ease-in-out'}}
                />
            ))}

             {/* Centroid Trails */}
            {result && previousResult && result.centroids.map((centroid, i) => {
                const prevCentroid = previousResult.centroids[i];
                if (!prevCentroid) return null;
                return (
                    <line
                        key={`trail-${i}`}
                        x1={scaleX(prevCentroid.x)}
                        y1={scaleY(prevCentroid.y)}
                        x2={scaleX(centroid.x)}
                        y2={scaleY(centroid.y)}
                        stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        opacity="0.6"
                        className="animate-fade-in"
                    />
                );
            })}

            {/* Centroids */}
             {result && result.centroids.map((c, i) => (
                <g key={i} className="animate-fade-in">
                    <circle cx={scaleX(c.x)} cy={scaleY(c.y)} r="12" fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} stroke="white" strokeWidth="2.5" opacity="0.7" />
                    <circle cx={scaleX(c.x)} cy={scaleY(c.y)} r="6" fill="white" stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth="2.5" />
                </g>
            ))}
        </svg>
    );
};

const HighlightedCodeDisplay: React.FC<{
    sections: { key: string; code: string }[];
    highlightedKey: string | null;
}> = ({ sections, highlightedKey }) => {
    return (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm max-h-[22rem] overflow-auto">
            <pre><code className="text-slate-300 whitespace-pre-wrap">
                {sections.map(({ key, code }) => (
                    <span
                        key={key}
                        className={`block transition-all duration-300 rounded ${
                            highlightedKey === key ? 'bg-emerald-500/20' : 'bg-transparent'
                        }`}
                    >
                        {code}
                    </span>
                ))}
            </code></pre>
        </div>
    );
};

const ExplanationPanel: React.FC<{ explanation: string, isLoading: boolean, onExplain: () => void }> = ({ explanation, isLoading, onExplain }) => (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-indigo-800">AstroBot Explains the Code</h4>
            <button
                onClick={onExplain}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors"
            >
                <SparklesIcon className="w-4 h-4" />
                {isLoading ? 'Thinking...' : 'Explain'}
            </button>
        </div>
        {isLoading && !explanation && (
            <div className="mt-3 text-center text-indigo-700">Generating explanation...</div>
        )}
        {explanation && (
             <div className="mt-3 prose prose-sm text-slate-800 max-w-none whitespace-pre-wrap">{explanation}</div>
        )}
    </div>
);


const LiveKMeansExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [k, setK] = useState(3);
    const [result, setResult] = useState<KMeansResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
    
    // State for step-by-step execution
    const [isStepping, setIsStepping] = useState(false);
    const [iterationHistory, setIterationHistory] = useState<KMeansResult[]>([]);
    const [currentIteration, setCurrentIteration] = useState(0);
    const [highlightedSection, setHighlightedSection] = useState<string | null>(null);


    useEffect(() => {
        setData(generateData());
    }, []);
    
    useEffect(() => {
        if (!isStepping) {
            setHighlightedSection(null);
            return;
        }

        if (currentIteration === 0) {
            setHighlightedSection('init');
        } else if (currentIteration > 0 && currentIteration < iterationHistory.length - 1) {
            setHighlightedSection('loop');
        } else if (currentIteration === iterationHistory.length - 1) {
            setHighlightedSection('return');
        }

    }, [isStepping, currentIteration, iterationHistory.length]);

    const handleRun = () => {
        setIsLoading(true);
        setTimeout(() => {
            const history = runKMeansWithHistory(data, k, 'color', 'concentration');
            setResult(history[history.length - 1]);
            setIsStepping(false);
            setIterationHistory([]);
            setIsLoading(false);
        }, 50);
    };

    const handleRunStepwise = () => {
        setIsLoading(true);
        setTimeout(() => {
            const history = runKMeansWithHistory(data, k, 'color', 'concentration');
            setIterationHistory(history);
            setCurrentIteration(0);
            setIsStepping(true);
            setResult(null); // Clear full result
            setIsLoading(false);
        }, 50);
    };
    
    const handleGetExplanation = async () => {
        if (!process.env.API_KEY) {
            setExplanation("API Key is not configured. Cannot generate explanation.");
            return;
        }
        setIsGeneratingExplanation(true);
        setExplanation('');
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Explain this Javascript code for the K-Means clustering algorithm. Explain it step-by-step for a beginner in machine learning. Break it down into the main stages: Initialization, Assignment, and Update. \n\n\`\`\`javascript\n${KMEANS_CODE_FULL}\n\`\`\``
            });
            setExplanation(response.text);
        } catch (e) {
            console.error(e);
            setExplanation("Sorry, an error occurred while generating the explanation.");
        } finally {
            setIsGeneratingExplanation(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setIsStepping(false);
        setIterationHistory([]);
        setCurrentIteration(0);
    };
    
    const resultForPlot = isStepping ? iterationHistory[currentIteration] : result;
    const prevResultForPlot = isStepping && currentIteration > 0 ? iterationHistory[currentIteration - 1] : null;

    return (
        <div className="animate-fade-in space-y-12">
            <header className="text-center">
                <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-green-600">
                    Live ML Code Execution
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    This is a real, interactive demonstration. The K-Means clustering algorithm below is running live in your browser on a simulated dataset of galaxies. Change the parameters, see the code, and get a live explanation from our AI assistant.
                </p>
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-lg border border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Read More: "{paperTitle}"
                </a>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="lg:sticky top-24">
                    <AnalysisPlot data={data} result={resultForPlot} previousResult={prevResultForPlot} />
                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                        {resultForPlot ? (
                             <>
                                {resultForPlot.centroids.map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length]}}></div> Found Cluster {i + 1}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: TRUE_TYPE_COLORS.spiral}}></div> True Spiral</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: TRUE_TYPE_COLORS.elliptical}}></div> True Elliptical</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: TRUE_TYPE_COLORS.irregular}}></div> True Irregular</div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm space-y-4">
                         <div>
                            <label htmlFor="k-value" className="block text-lg font-bold text-slate-700">Number of Clusters (K)</label>
                            <p className="text-sm text-slate-500 mb-2">How many groups should the algorithm look for?</p>
                            <input
                                id="k-value"
                                type="range"
                                min="2"
                                max="5"
                                value={k}
                                onChange={(e) => setK(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                disabled={isStepping || isLoading}
                            />
                            <div className="flex justify-between text-sm font-medium text-slate-600 px-1">
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                            </div>
                        </div>

                        {isStepping ? (
                            <div className="space-y-3 pt-2">
                                <div className="text-center font-semibold text-slate-700">
                                     Iteration: {currentIteration} / {iterationHistory.length - 1}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentIteration(i => Math.max(0, i - 1))} disabled={currentIteration === 0} className="w-full py-2 text-sm font-semibold rounded-md bg-slate-200 hover:bg-slate-300 disabled:opacity-50">Previous Step</button>
                                    <button onClick={() => setCurrentIteration(i => Math.min(iterationHistory.length - 1, i + 1))} disabled={currentIteration === iterationHistory.length - 1} className="w-full py-2 text-sm font-semibold rounded-md bg-slate-200 hover:bg-slate-300 disabled:opacity-50">Next Step</button>
                                </div>
                                 <button onClick={handleReset} className="w-full px-6 py-2 text-lg font-semibold text-slate-700 bg-slate-200 rounded-md transition-all duration-300 hover:bg-slate-300">
                                    Reset & Exit
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button onClick={handleRun} disabled={isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:bg-slate-400 disabled:cursor-wait">
                                    {isLoading ? 'Running...' : `Run (K=${k})`}
                                </button>
                                 <button onClick={handleRunStepwise} disabled={isLoading} className="w-full px-6 py-3 text-lg font-semibold text-emerald-700 bg-emerald-100 rounded-md transition-all duration-300 hover:bg-emerald-200 border border-emerald-300 disabled:opacity-50">
                                    Run Step-by-Step
                                </button>
                                <button onClick={handleReset} disabled={isLoading || (!result && !isStepping)} className="px-6 py-3 text-lg font-semibold text-slate-700 bg-slate-200 rounded-md transition-all duration-300 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <HighlightedCodeDisplay sections={CODE_SECTIONS} highlightedKey={highlightedSection} />
                    
                    <ExplanationPanel explanation={explanation} isLoading={isGeneratingExplanation} onExplain={handleGetExplanation} />
                </div>
            </main>
        </div>
    );
};

export default LiveKMeansExample;