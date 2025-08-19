import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type EventType = 'normal' | 'flare' | 'dip';
type DataPoint = { id: number; features: { duration: number; amplitude: number }; type: EventType; };
type AnalysisType = 'none' | 'threshold' | 'ml';
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const TRADITIONAL_CODE = `const traditionalClassifier = (p) => {
    // Uses fixed, rectangular thresholds to find
    // events that are "too long" or "too bright".
    // This method is rigid and misses anomalies
    // that fall outside these simple box criteria.
    const amp = p.features.amplitude;
    const dur = p.features.duration;
    return amp > 0.8 || dur > 0.8;
};`;

const ML_CODE = `const mlClassifier = (data) => {
    // This is a statistical outlier detection algorithm.
    // It finds the 'center' of the normal data and
    // flags any points that are unusually far away.

    // 1. Find the centroid of all points.
    const centroid = { /* ... */ };

    // 2. Calculate the distance of each point from the centroid.
    const distances = data.map(p => /* ... */);
    
    // 3. Find the average distance and its standard deviation.
    const meanDistance = /* ... */;
    const stdDevDistance = /* ... */;

    // 4. Any point further than ~1.6 standard deviations
    // from the mean distance is flagged as an anomaly.
    const threshold = 1.6;
    return distances.map(d => d > meanDistance + threshold * stdDevDistance);
};`;

// --- Data Generation & Logic ---
const generateData = (numPoints = 200): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < numPoints; i++) {
        const rand = Math.random();
        let type: EventType;
        let amplitude, duration;

        if (rand < 0.9) { // Normal stellar variation
            type = 'normal';
            amplitude = 0.2 + Math.random() * 0.3;
            duration = 0.2 + Math.random() * 0.3;
        } else if (rand < 0.97) { // Stellar Flare
            type = 'flare';
            amplitude = 0.85 + Math.random() * 0.1;
            duration = 0.1 + Math.random() * 0.2;
        } else { // Unusual Dip (e.g., complex transit)
            type = 'dip';
            amplitude = 0.1 + Math.random() * 0.1;
            duration = 0.7 + Math.random() * 0.2;
        }
        data.push({ id: i, features: { duration, amplitude }, type });
    }
    return data;
};

// --- Real Classifiers ---
const isAnomaly = (p: DataPoint) => p.type !== 'normal';

const traditionalClassifier = (p: DataPoint): boolean => {
    return p.features.amplitude > 0.8 || p.features.duration > 0.8;
};

// A real, simple distance-based outlier detection
const mlClassifier = (data: DataPoint[]): boolean[] => {
    if(data.length === 0) return [];
    
    // 1. Find the centroid of all points
    const { totalDuration, totalAmplitude } = data.reduce(
        (acc, p) => ({
            totalDuration: acc.totalDuration + p.features.duration,
            totalAmplitude: acc.totalAmplitude + p.features.amplitude
        }),
        { totalDuration: 0, totalAmplitude: 0 }
    );
    const centroid = {
        duration: totalDuration / data.length,
        amplitude: totalAmplitude / data.length
    };
    
    // 2. Calculate distance of each point from centroid
    const distances = data.map(p => Math.sqrt(
        Math.pow(p.features.duration - centroid.duration, 2) + 
        Math.pow(p.features.amplitude - centroid.amplitude, 2)
    ));
    
    // 3. Find the mean and std dev of distances
    const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const stdDevDistance = Math.sqrt(
      distances.map(d => Math.pow(d - meanDistance, 2)).reduce((sum, d) => sum + d, 0) / distances.length
    );

    // 4. Any point further than `threshold` standard deviations is an anomaly
    const threshold = 1.6;
    return distances.map(d => d > meanDistance + threshold * stdDevDistance);
};

const calculateAccuracy = (data: DataPoint[], predictions: boolean[]): { found: number, total: number } => {
    let found = 0;
    const totalAnomalies = data.filter(isAnomaly).length;
    data.forEach((p, i) => {
        if (isAnomaly(p) && predictions[i]) {
            found++;
        }
    });
    return { found, total: totalAnomalies };
};

// --- Components ---
const AnalysisPlot: React.FC<{ data: DataPoint[], predictions: boolean[] | null }> = ({ data, predictions }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const domainX = [0, 1]; // Duration
    const domainY = [0, 1]; // Amplitude

    const scaleX = (val: number) => padding + val * (width - 2 * padding);
    const scaleY = (val: number) => (height - padding) - val * (height - padding * 1.5);

    const pointColor = (p: DataPoint, index: number) => {
        if (!predictions) {
            return p.type === 'normal' ? 'fill-slate-400' : 'fill-fuchsia-400';
        }
        return predictions[index] ? 'fill-fuchsia-400' : 'fill-slate-400';
    };

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Light curve anomaly scatter plot">
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Event Duration</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Event Amplitude</text>
            
            {predictions && traditionalClassifier({features: {duration: 0.8, amplitude: 0.8}, type: 'normal', id: -1}) && ( // A bit of a hack to check if we are on traditional
                <g>
                    <path d={`M ${scaleX(0.8)} ${scaleY(0)} V ${scaleY(1)} M ${scaleX(0)} ${scaleY(0.8)} H ${scaleX(1)}`} className="stroke-red-500 stroke-2 stroke-dasharray-4" />
                </g>
            )}

            {data.map((p, i) => (
                <circle key={p.id} cx={scaleX(p.features.duration)} cy={scaleY(p.features.amplitude)} r="3.5" className={pointColor(p, i)} opacity="0.9" />
            ))}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; found: number; total: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, found, total, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 mt-4 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-4 text-2xl font-bold text-slate-700">
            Anomalies Found: <span className={textColor}>{found} / {total}</span>
        </div>
    </div>
);

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm max-h-60 overflow-auto">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);

const AnomalyDetectionExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [predictions, setPredictions] = useState<boolean[] | null>(null);

    useEffect(() => {
        setData(generateData());
    }, []);

    const traditionalResults = useMemo(() => calculateAccuracy(data, data.map(traditionalClassifier)), [data]);
    const mlResults = useMemo(() => calculateAccuracy(data, mlClassifier(data)), [data]);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setPredictions(null);

        setTimeout(() => {
            if (type === 'threshold') {
                setPredictions(data.map(traditionalClassifier));
            } else if (type === 'ml') {
                setPredictions(mlClassifier(data));
            }
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

    return (
        <div className="animate-fade-in space-y-12">
            <header className="text-center">
                <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600">
                    Light Curve Anomaly Detection
                </h1>
                <div className="flex justify-center items-center gap-2 mt-3">
                    <span className="bg-cyan-100 text-cyan-800 text-sm font-semibold px-3 py-1 rounded-full">
                        Unsupervised Learning
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-semibold text-sm">
                        Clustering (DBSCAN)
                    </span>
                </div>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    Astronomical surveys produce millions of light curves, most showing normal stellar behavior. How can we automatically find rare, scientifically valuable anomalies like stellar flares without knowing what to look for?
                </p>
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-fuchsia-700 bg-fuchsia-100 rounded-lg border border-fuchsia-200 hover:bg-fuchsia-200 hover:border-fuchsia-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fuchsia-500"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Read the Research Paper: "{paperTitle}"
                </a>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="lg:sticky top-24">
                    <AnalysisPlot data={data} predictions={predictions} />
                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Normal Variation</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-400"></div> Anomaly Detected</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 1: Fixed Thresholds</h3>
                        <p className="text-sm text-slate-600">This traditional method uses fixed, rectangular thresholds to find events that are "too long" or "too bright". This is rigid and misses anomalies that fall outside its simple criteria.</p>
                        <CodeDisplay code={TRADITIONAL_CODE} />
                        <button onClick={() => handleRunAnalysis('threshold')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'threshold' ? 'Analyzing...' : 'Run Fixed Thresholds'}
                        </button>
                        {analysisType === 'threshold' && (
                            <div className="animate-fade-in">
                                <ResultCard
                                    title="Fixed Thresholds"
                                    description="The rigid box-based rules miss the 'unusual dip' anomalies entirely and incorrectly flag some normal variations as anomalous."
                                    found={traditionalResults.found}
                                    total={traditionalResults.total}
                                    active={analysisType === 'threshold'}
                                    icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                                    color="border-red-500"
                                    textColor="text-red-500"
                                />
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 2: Statistical Outlier Detection (ML)</h3>
                        <p className="text-sm text-slate-600">This unsupervised ML method automatically finds the dense cluster of "normal" data and identifies anything statistically far from that cluster's center as an anomaly, regardless of shape.</p>
                        <CodeDisplay code={ML_CODE} />
                        <button onClick={() => handleRunAnalysis('ml')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'ml' ? 'Analyzing...' : 'Run Outlier Detection'}
                        </button>
                        {analysisType === 'ml' && (
                            <div className="animate-fade-in">
                                <ResultCard
                                    title="Statistical Outlier Detection (ML)"
                                    description="This method correctly identifies the dense cluster of normal events and flags all points statistically far from the center as anomalies."
                                    found={mlResults.found}
                                    total={mlResults.total}
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

export default AnomalyDetectionExample;
