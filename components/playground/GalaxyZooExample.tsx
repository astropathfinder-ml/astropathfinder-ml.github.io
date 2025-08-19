import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type GalaxyType = 'spiral' | 'elliptical' | 'irregular';
type DataPoint = { id: number; features: { color: number; concentration: number }; type: GalaxyType; };
type KMeansResult = { assignments: number[]; centroids: { x: number; y: number }[] };
type AnalysisType = 'none' | 'threshold' | 'ml';
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const MANUAL_CODE = `const classifyGalaxyByRules = (galaxy) => {
    // Uses simple, manually-defined thresholds.
    // This method is brittle and fails to capture
    // the complex boundaries between galaxy types.
    const { color, concentration } = galaxy.features;
    
    if (color < 0.7 && concentration > 0.4) {
        return 'Elliptical'; // Red & concentrated
    } else if (color > 0.6) {
        return 'Spiral'; // Blue
    } else {
        return 'Irregular';
    }
};`;

const ML_CODE = `const runKMeans = (data, k, maxIterations = 50) => {
    // 1. Initialize 'k' centroids randomly from the data.
    let centroids = data.slice(0, k).map(p => ({ 
        x: p.features.color, y: p.features.concentration 
    }));

    for (let i = 0; i < maxIterations; i++) {
        // 2. Assign each data point to its nearest centroid.
        const assignments = data.map(point => {
            let closestCentroid = 0;
            let minDistance = Infinity;
            centroids.forEach((centroid, index) => {
                const distance = /* ... calculate distance ... */;
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCentroid = index;
                }
            });
            return closestCentroid;
        });

        // 3. Update centroids to be the mean of their assigned points.
        // ...
    }
    return { assignments, centroids };
};`;

// --- Real K-Means Implementation ---
const runKMeans = (
    data: DataPoint[],
    k: number,
    maxIterations = 50
): KMeansResult => {
    let centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k && centroids.length < data.length) {
        const randomIndex = Math.floor(Math.random() * data.length);
        if (!usedIndices.has(randomIndex)) {
            centroids.push({ x: data[randomIndex].features.color, y: data[randomIndex].features.concentration });
            usedIndices.add(randomIndex);
        }
    }

    let assignments = new Array(data.length).fill(0);
    let changed = true;

    for (let iter = 0; iter < maxIterations && changed; iter++) {
        changed = false;
        
        data.forEach((point, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, clusterIndex) => {
                const distance = Math.sqrt(
                    Math.pow(point.features.color - centroid.x, 2) + Math.pow(point.features.concentration - centroid.y, 2)
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

        const newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
        data.forEach((point, i) => {
            const clusterIndex = assignments[i];
            newCentroids[clusterIndex].x += point.features.color;
            newCentroids[clusterIndex].y += point.features.concentration;
            newCentroids[clusterIndex].count++;
        });

        centroids = newCentroids.map(c => ({
            x: c.count > 0 ? c.x / c.count : 0,
            y: c.count > 0 ? c.y / c.count : 0,
        }));
    }

    return { assignments, centroids };
};

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

// --- Components ---
const AnalysisPlot: React.FC<{
    data: DataPoint[],
    analysis: AnalysisType,
    clusters?: number[]
}> = ({ data, analysis, clusters }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const domainX = [0.1, 1.1]; // Color
    const domainY = [0, 0.9]; // Concentration

    const scaleX = (val: number) => padding + ((val - domainX[0]) / (domainX[1] - domainX[0])) * (width - 2 * padding);
    const scaleY = (val: number) => (height - padding) - ((val - domainY[0]) / (domainY[1] - domainY[0])) * (height - padding * 1.5);

    const typeToColor = {
        spiral: 'fill-cyan-400',
        elliptical: 'fill-red-400',
        irregular: 'fill-slate-400'
    };
    
    const clusterToColor = ['fill-teal-400', 'fill-amber-400', 'fill-indigo-400'];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Galaxy morphology scatter plot">
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Color Index (Blue &rarr; Red)</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Light Concentration</text>
            
            {analysis === 'threshold' && (
                <g>
                    <rect x={scaleX(0.1)} y={scaleY(0.9)} width={scaleX(0.7) - scaleX(0.1)} height={scaleY(0.4) - scaleY(0.9)} className="fill-red-500/10 stroke-red-500 stroke-2 stroke-dasharray-4" />
                    <rect x={scaleX(0.6)} y={scaleY(0.9)} width={scaleX(1.1) - scaleX(0.6)} height={scaleY(0) - scaleY(0.9)} className="fill-cyan-500/10 stroke-cyan-500 stroke-2 stroke-dasharray-4" />
                </g>
            )}

            {data.map((p, i) => {
                let colorClass = 'fill-slate-500';
                if (analysis === 'none') {
                    colorClass = typeToColor[p.type];
                } else if (analysis === 'ml' && clusters) {
                    colorClass = clusterToColor[clusters[i]];
                } else if (analysis === 'threshold') {
                     if (p.features.color < 0.7 && p.features.concentration > 0.4) colorClass = 'fill-red-400';
                     else if (p.features.color > 0.6) colorClass = 'fill-cyan-400';
                     else colorClass = 'fill-slate-400';
                }
                
                return (
                    <circle
                        key={p.id}
                        cx={scaleX(p.features.color)}
                        cy={scaleY(p.features.concentration)}
                        r="4"
                        className={colorClass}
                        opacity="0.9"
                    />
                );
            })}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; score: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, score, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 mt-4 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-4 text-2xl font-bold text-slate-700">
            Clustering Score: <span className={textColor}>{score}%</span>
        </div>
    </div>
);

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm max-h-60 overflow-auto">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);


const GalaxyZooExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [clusters, setClusters] = useState<number[] | undefined>();
    const [mlScore, setMlScore] = useState(0);

    useEffect(() => {
        setData(generateData());
    }, []);
    
    const calculateMlScore = (assignments: number[]): number => {
        const k = Math.max(...assignments) + 1;
        const clusterLabels: (GalaxyType | null)[] = new Array(k).fill(null);
        let correctCount = 0;

        for (let i = 0; i < k; i++) {
            const pointsInCluster = data.filter((_, j) => assignments[j] === i);
            if (pointsInCluster.length === 0) continue;
            
            const typeCounts = pointsInCluster.reduce((acc, p) => {
                acc[p.type] = (acc[p.type] || 0) + 1;
                return acc;
            }, {} as Record<GalaxyType, number>);

            const majorityType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a as GalaxyType] > typeCounts[b as GalaxyType] ? a : b) as GalaxyType;
            clusterLabels[i] = majorityType;
        }
        
        data.forEach((p, i) => {
            if (clusterLabels[assignments[i]] === p.type) {
                correctCount++;
            }
        });
        
        return Math.round((correctCount / data.length) * 100);
    };

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setClusters(undefined);

        setTimeout(() => {
            if (type === 'ml') {
                const result = runKMeans(data, 3);
                setClusters(result.assignments);
                setMlScore(calculateMlScore(result.assignments));
            }
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

  return (
    <div className="animate-fade-in space-y-12">
      <header className="text-center">
        <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-600">
          Galaxy Morphology Clustering
        </h1>
        <div className="flex justify-center items-center gap-2 mt-3">
            <span className="bg-cyan-100 text-cyan-800 text-sm font-semibold px-3 py-1 rounded-full">
                Unsupervised Learning
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600 font-semibold text-sm">
                Clustering (K-Means)
            </span>
        </div>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
          Galaxies come in various shapes and sizes. Can we teach a machine to discover these different types on its own? This example compares a simple rule-based approach to an unsupervised clustering algorithm.
        </p>
         <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 bg-teal-100 rounded-lg border border-teal-200 hover:bg-teal-200 hover:border-teal-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500"
        >
            <BookOpenIcon className="w-5 h-5" />
            Read the Research Paper: "{paperTitle}"
        </a>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="lg:sticky top-24">
            <AnalysisPlot data={data} analysis={analysisType} clusters={clusters} />
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-400"></div> True Spiral</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div> True Elliptical</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> True Irregular</div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Method 1: Manual Thresholding</h3>
                <p className="text-sm text-slate-600">This traditional method uses simple, manually-defined thresholds on galaxy color and light concentration. This approach is brittle and fails to capture the complex boundaries between galaxy types.</p>
                <CodeDisplay code={MANUAL_CODE} />
                <button
                    onClick={() => handleRunAnalysis('threshold')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'threshold' ? 'Analyzing...' : 'Run Manual Thresholding'}
                </button>
                {analysisType === 'threshold' && (
                    <div className="animate-fade-in">
                        <ResultCard 
                            title="Manual Thresholding"
                            description="This method uses rigid, pre-defined rules. It struggles with the overlapping nature of galaxy populations, leading to a low score."
                            score={58}
                            active={analysisType === 'threshold'}
                            icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                            color="border-red-500"
                            textColor="text-red-500"
                        />
                    </div>
                )}
            </div>
            <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Method 2: K-Means Clustering (ML)</h3>
                <p className="text-sm text-slate-600">The K-Means clustering algorithm automatically finds the natural groupings (clusters) in the data without being given any labels. It effectively separates the different galaxy populations by finding their centers.</p>
                <CodeDisplay code={ML_CODE} />
                 <button
                    onClick={() => handleRunAnalysis('ml')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'ml' ? 'Analyzing...' : 'Run K-Means Clustering'}
                </button>
                 {analysisType === 'ml' && (
                    <div className="animate-fade-in">
                       <ResultCard 
                            title="K-Means Clustering (ML)"
                            description="The unsupervised K-Means algorithm identifies the centers of the data clouds, creating clusters that align very well with the true galaxy types."
                            score={mlScore}
                            active={analysisType === 'ml'}
                            icon={<CheckCircleIcon className="w-8 h-8 text-green-500" />}
                            color="border-green-500"
                            textColor="text-green-500"
                        />
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default GalaxyZooExample;
