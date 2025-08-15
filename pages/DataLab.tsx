import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { BeakerIcon, UploadCloudIcon, FileJsonIcon } from '../components/Icons';

type DataRow = { [key: string]: any };
type AppState = 'upload' | 'configure' | 'result';
type KMeansResult = {
    assignments: number[];
    centroids: { x: number; y: number }[];
};


// --- Example Data ---
const EXAMPLE_CSV_DATA = `name,planet_mass,planet_radius,orbital_period,star_temperature,star_mass
TRAPPIST-1e,0.69,0.92,6.1,2566,0.089
Kepler-186f,1.47,1.17,129.9,3755,0.54
Proxima Cen b,1.07,1.1,11.2,3042,0.12
TRAPPIST-1f,1.04,1.04,9.2,2566,0.089
Kepler-452b,5,1.63,384.8,5757,1.04
TRAPPIST-1g,1.32,1.13,12.3,2566,0.089
Gliese 581g,3.1,1.5,36.6,3498,0.31
Kepler-22b,2.4,2.4,289.9,5518,0.97
Kepler-62f,2.8,1.41,267.3,4925,0.69
LHS 1140 b,6.6,1.43,24.7,3131,0.15
TRAPPIST-1d,0.3,0.78,4.05,2566,0.089
Kepler-62e,4.5,1.61,122.4,4925,0.69
Gliese 667 Cc,3.8,1.5,28.1,3700,0.6
Kepler-1229b,2.7,1.4,86.8,4490,0.7
Wolf 1061c,4.3,1.6,17.9,3380,0.25`;

// --- Helper Functions ---

const parseCSV = (text: string): { data: DataRow[]; headers: string[] } => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const row: DataRow = {};
        headers.forEach((header, index) => {
            const value = values[index]?.trim();
            row[header] = isNaN(Number(value)) || value === '' ? value : Number(value);
        });
        return row;
    });
    return { data, headers };
};

const runKMeans = (
    data: DataRow[],
    k: number,
    xCol: string,
    yCol: string,
    maxIterations = 50
): KMeansResult => {
    // 1. Initialize centroids randomly
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
        
        // 2. Assign points to the nearest centroid
        data.forEach((point, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, clusterIndex) => {
                const distance = Math.sqrt(
                    Math.pow(point[xCol] - centroid.x, 2) + Math.pow(point[yCol] - centroid.y, 2)
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
};


// --- UI Components ---

const UploadStep: React.FC<{ 
    onFile: (file: File) => void; 
    onError: (msg: string) => void;
    onLoadExample: () => void;
}> = ({ onFile, onError, onLoadExample }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.type !== 'text/csv') {
            onError("Invalid file type. Please upload a .csv file.");
            return;
        }
        onFile(file);
    };

    const handleDrag = (e: React.DragEvent, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(enter);
    };

    const handleDrop = (e: React.DragEvent) => {
        handleDrag(e, false);
        handleFile(e.dataTransfer.files);
    };

    return (
        <div className="text-center">
            <label
                htmlFor="csv-upload"
                onDragEnter={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full max-w-lg mx-auto p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
            >
                <UploadCloudIcon className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">Drop your CSV file here</h3>
                <p className="text-slate-500 mt-1">or click to browse</p>
                <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files)}
                />
            </label>
             <div className="mt-6 text-center">
                <p className="text-slate-600 mb-2">Don't have a file on hand?</p>
                <button 
                    onClick={onLoadExample}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-lg border border-emerald-200 hover:bg-emerald-200 hover:border-emerald-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
                >
                    <FileJsonIcon className="w-5 h-5" />
                    Try with an example dataset
                </button>
            </div>
        </div>
    );
};

const ConfigureStep: React.FC<{
    headers: string[];
    data: DataRow[];
    onRun: (config: { k: number; xCol: string; yCol: string }) => void;
    onReset: () => void;
}> = ({ headers, data, onRun, onReset }) => {
    const numericHeaders = useMemo(() => headers.filter(h => typeof data[0]?.[h] === 'number'), [headers, data]);

    const [k, setK] = useState(3);
    const [xCol, setXCol] = useState(numericHeaders[3] || numericHeaders[0] || '');
    const [yCol, setYCol] = useState(numericHeaders[4] || numericHeaders[1] || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRun({ k, xCol, yCol });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Configure Analysis</h3>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
                    <div>
                        <label htmlFor="k-value" className="block text-sm font-medium text-slate-700">Number of Clusters (K)</label>
                        <input
                            id="k-value"
                            type="number"
                            min="2"
                            max="10"
                            value={k}
                            onChange={(e) => setK(parseInt(e.target.value, 10))}
                            className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="x-col" className="block text-sm font-medium text-slate-700">X-Axis Column (must be numeric)</label>
                        <select
                            id="x-col"
                            value={xCol}
                            onChange={(e) => setXCol(e.target.value)}
                            className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="y-col" className="block text-sm font-medium text-slate-700">Y-Axis Column (must be numeric)</label>
                        <select
                            id="y-col"
                            value={yCol}
                            onChange={(e) => setYCol(e.target.value)}
                            className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="submit" disabled={!xCol || !yCol} className="w-full px-6 py-3 text-white font-semibold rounded-md transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed">Run K-Means Clustering</button>
                        <button type="button" onClick={onReset} className="w-full px-6 py-3 text-slate-700 font-semibold bg-slate-200 hover:bg-slate-300 rounded-md transition-colors">Start Over</button>
                    </div>
                </form>
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Data Preview</h3>
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 max-h-96">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>{headers.map(h => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 10).map((row, i) => (
                                <tr key={i} className="bg-white border-b">
                                    {headers.map(h => <td key={h} className="px-4 py-2">{row[h]}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CLUSTER_COLORS = ['#2dd4bf', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8', '#84cc16', '#ef4444', '#f97316', '#6366f1', '#8b5cf6'];

const KMeansPlot: React.FC<{
    data: DataRow[];
    result: KMeansResult;
    config: { xCol: string; yCol: string };
    width: number;
    height: number;
}> = ({ data, result, config, width, height }) => {
    const { xCol, yCol } = config;
    const padding = 60;
    
    const { xDomain, yDomain } = useMemo(() => {
        const xVals = data.map(d => d[xCol]);
        const yVals = data.map(d => d[yCol]);
        const xMin = Math.min(...xVals);
        const xMax = Math.max(...xVals);
        const yMin = Math.min(...yVals);
        const yMax = Math.max(...yVals);
        const xPad = (xMax - xMin) * 0.1;
        const yPad = (yMax - yMin) * 0.1;
        return {
            xDomain: [xMin - xPad, xMax + xPad],
            yDomain: [yMin - yPad, yMax + yPad],
        };
    }, [data, xCol, yCol]);

    const scaleX = useCallback((val: number) => padding + ((val - xDomain[0]) / (xDomain[1] - xDomain[0])) * (width - 2 * padding), [xDomain, width]);
    const scaleY = useCallback((val: number) => (height - padding) - ((val - yDomain[0]) / (yDomain[1] - yDomain[0])) * (height - padding * 1.5), [yDomain, height]);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-50 rounded-lg">
            <text x={width / 2} y={height - 15} textAnchor="middle" className="fill-slate-600 text-lg font-sans">{xCol}</text>
            <text x={-height / 2} y={20} textAnchor="middle" transform="rotate(-90)" className="fill-slate-600 text-lg font-sans">{yCol}</text>
            
            {/* Data Points */}
            {data.map((point, i) => (
                <circle
                    key={i}
                    cx={scaleX(point[xCol])}
                    cy={scaleY(point[yCol])}
                    r="5"
                    fill={CLUSTER_COLORS[result.assignments[i] % CLUSTER_COLORS.length]}
                    opacity="0.7"
                />
            ))}
            {/* Centroids */}
            {result.centroids.map((c, i) => (
                <g key={i}>
                    <circle cx={scaleX(c.x)} cy={scaleY(c.y)} r="14" fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} stroke="white" strokeWidth="3" opacity="0.6" />
                    <circle cx={scaleX(c.x)} cy={scaleY(c.y)} r="7" fill="white" stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} strokeWidth="3" />
                </g>
            ))}
        </svg>
    );
};


const ResultStep: React.FC<{
    data: DataRow[];
    headers: string[];
    result: KMeansResult;
    config: { xCol: string; yCol: string };
    onReset: () => void;
    isExampleData: boolean;
}> = ({ data, headers, result, config, onReset, isExampleData }) => {

    const dataWithClusters = useMemo(() => {
        return data.map((row, index) => ({
            ...row,
            'Cluster': result.assignments[index] + 1
        }));
    }, [data, result]);

    const finalHeaders = useMemo(() => [...headers, 'Cluster'], [headers]);

    const clusterSizes = useMemo(() => {
        const sizes = new Array(result.centroids.length).fill(0);
        result.assignments.forEach(assignment => {
            sizes[assignment]++;
        });
        return sizes;
    }, [result]);

    return (
        <div className="space-y-8 text-center">
            <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-6">K-Means Clustering Results</h3>
                <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg border border-slate-200">
                    <div className="relative">
                        <KMeansPlot data={data} result={result} config={config} width={800} height={600} />
                    </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-y-2">
                    <h4 className="font-semibold text-slate-700">Discovered Clusters</h4>
                    <div className="flex justify-center flex-wrap gap-x-6 gap-y-2">
                        {result.centroids.map((_, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <span 
                                    className="inline-block w-3.5 h-3.5 rounded-full"
                                    style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                                ></span>
                                Cluster {i + 1} ({clusterSizes[i]} items)
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isExampleData && (
                <div className="max-w-4xl mx-auto p-4 bg-emerald-50 text-emerald-800 text-left rounded-lg border border-emerald-200">
                    <h4 className="font-bold">Interpreting the Example Results</h4>
                    <p className="mt-2 text-sm">
                        This example dataset contains known exoplanets. The K-Means algorithm, without any prior knowledge, has grouped them based on the two features you selected: <strong>{config.xCol}</strong> and <strong>{config.yCol}</strong>. Notice how the planets from the TRAPPIST-1 system, which orbit a very cool, low-mass star, often form their own distinct cluster. This demonstrates how clustering can reveal natural populations in your data based on their physical properties. Explore the table below to see which planets were grouped together.
                    </p>
                </div>
            )}
            
            <div>
                 <h3 className="text-2xl font-bold text-slate-800 mb-4">Clustered Data Table</h3>
                 <div className="overflow-auto bg-white rounded-lg border border-slate-200 max-h-96 max-w-5xl mx-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>{finalHeaders.map(h => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {dataWithClusters.map((row, i) => (
                                <tr key={i} className="bg-white border-b">
                                    {finalHeaders.map(h => 
                                        <td key={h} className={`px-4 py-2 ${h === 'Cluster' ? 'font-bold' : ''}`}>
                                            {h === 'Cluster' ? (
                                                <span className="px-2 py-1 rounded-full text-xs" style={{
                                                    backgroundColor: `${CLUSTER_COLORS[(row[h]-1) % CLUSTER_COLORS.length]}33`, // Add alpha for background
                                                    color: CLUSTER_COLORS[(row[h]-1) % CLUSTER_COLORS.length]
                                                }}>
                                                    {row[h]}
                                                </span>
                                            ) : (
                                                row[h]
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             <div className="mt-8">
                <button onClick={onReset} className="px-8 py-3 text-white font-semibold rounded-md transition-colors bg-emerald-600 hover:bg-emerald-700">Analyze a New Dataset</button>
            </div>
        </div>
    );
};


// --- Main Page Component ---

const DataLab: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('upload');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExampleData, setIsExampleData] = useState(false);

    const [data, setData] = useState<DataRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [config, setConfig] = useState<{ k: number; xCol: string; yCol: string } | null>(null);
    const [kmeansResult, setKmeansResult] = useState<KMeansResult | null>(null);

    const handleFile = (file: File) => {
        setIsLoading(true);
        setIsExampleData(false);
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { data, headers } = parseCSV(text);
                if (data.length < 2 || headers.length < 2) {
                    throw new Error("CSV must have at least 2 columns and 2 rows of data.");
                }
                setData(data);
                setHeaders(headers);
                setAppState('configure');
            } catch (err: any) {
                setError(err.message || "Failed to parse CSV file.");
                setAppState('upload');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Error reading the file.");
            setIsLoading(false);
        };
        reader.readAsText(file);
    };

    const handleLoadExampleData = () => {
        setIsLoading(true);
        setIsExampleData(true);
        setError(null);
        setTimeout(() => {
            try {
                const { data, headers } = parseCSV(EXAMPLE_CSV_DATA);
                setData(data);
                setHeaders(headers);
                setAppState('configure');
            } catch (err: any) {
                setError(err.message || "Failed to parse the example data.");
                setAppState('upload');
            } finally {
                setIsLoading(false);
            }
        }, 300); // Small delay to show feedback
    };
    
    const handleRun = (newConfig: { k: number; xCol: string; yCol: string }) => {
        setIsLoading(true);
        setError(null);
        setConfig(newConfig);
        // Simulate processing time
        setTimeout(() => {
             try {
                const { k, xCol, yCol } = newConfig;
                // Validate that selected columns are numeric
                if (typeof data[0][xCol] !== 'number' || typeof data[0][yCol] !== 'number') {
                    throw new Error(`Columns "${xCol}" and "${yCol}" must contain numeric data. Please check your CSV or select different columns.`);
                }

                const result = runKMeans(data, k, xCol, yCol);
                setKmeansResult(result);
                setAppState('result');
            } catch(err: any) {
                setError(err.message);
                setAppState('configure');
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handleReset = () => {
        setAppState('upload');
        setData([]);
        setHeaders([]);
        setConfig(null);
        setKmeansResult(null);
        setError(null);
        setIsExampleData(false);
    };
    
    return (
        <div className="space-y-12 animate-fade-in">
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-3">
                    <BeakerIcon className="w-12 h-12 text-emerald-500" />
                    Data Lab
                </h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    Your personal workbench for astronomical data analysis. Upload a CSV dataset, configure your parameters, and apply unsupervised machine learning to uncover hidden patterns. All processing is done securely in your browser.
                </p>
            </header>

            <main className="bg-white/80 backdrop-blur-sm p-8 rounded-xl border border-slate-200 min-h-[400px] flex items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 text-slate-600">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-semibold">Analyzing Data...</p>
                    </div>
                ) : (
                    <div className="w-full">
                        {error && (
                            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg" role="alert">
                                <p className="font-bold">An error occurred:</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {appState === 'upload' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 text-center mb-4">How to Get Started</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700">1. Prepare Your Data</h4>
                                            <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
                                                <li>File must be in <strong>.csv</strong> format.</li>
                                                <li>The first row must be a header.</li>
                                                <li>Include at least two numeric columns.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700">2. Upload Your File</h4>
                                            <p className="mt-2 text-sm text-slate-600">Drag and drop your file into the box below, or click to browse. Your data will be processed instantly.</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <h4 className="font-semibold text-slate-700">3. Your Privacy</h4>
                                            <p className="mt-2 text-sm text-slate-600">Your data never leaves your computer. All parsing and analysis happens securely within your browser.</p>
                                        </div>
                                    </div>
                                </div>
                                <UploadStep onFile={handleFile} onError={setError} onLoadExample={handleLoadExampleData} />
                            </div>
                        )}
                        {appState === 'configure' && <ConfigureStep data={data} headers={headers} onRun={handleRun} onReset={handleReset} />}
                        {appState === 'result' && config && kmeansResult && (
                            <ResultStep 
                                data={data} 
                                headers={headers}
                                result={kmeansResult} 
                                config={config} 
                                onReset={handleReset} 
                                isExampleData={isExampleData}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DataLab;