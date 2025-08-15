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

const TRADITIONAL_CODE = `def find_anomalies_with_thresholds(events):
    # Uses fixed, rectangular thresholds to find
    # events that are "too long" or "too bright".
    # This method is rigid and will miss anomalies
    # that fall outside these simple box criteria
    # or misclassify normal variations.
    anomalies = []
    for event in events:
        amp = event['amplitude']
        dur = event['duration']
        if amp > 0.8 or dur > 0.8:
            anomalies.append(event)
    return anomalies`;

const ML_CODE = `from sklearn.cluster import DBSCAN

# DBSCAN (Density-Based Spatial Clustering of
# Applications with Noise) is ideal for anomaly
# detection. It finds dense regions of "normal"
# data and classifies anything outside these
# regions as an outlier (anomaly).
# It can find arbitrarily shaped clusters.
model = DBSCAN(eps=0.3, min_samples=10)
clusters = model.fit_predict(X_data)

# Anomalies are assigned the label '-1'
anomalies = X_data[clusters == -1]
print(f"Found {len(anomalies)} anomalies.")`;

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

// --- Mock Classifiers ---
const isAnomaly = (p: DataPoint) => p.type !== 'normal';

const traditionalClassifier = (p: DataPoint): boolean => {
    return p.features.amplitude > 0.8 || p.features.duration > 0.8;
};

const mlClassifier = (p: DataPoint): boolean => {
    // A mock DBSCAN that perfectly identifies the sparse points
    const { amplitude, duration } = p.features;
    const isNormal = amplitude > 0.15 && amplitude < 0.55 && duration > 0.15 && duration < 0.55;
    return !isNormal;
};

const calculateAccuracy = (data: DataPoint[], classifier: (p: DataPoint) => boolean): { found: number, total: number } => {
    let found = 0;
    const totalAnomalies = data.filter(isAnomaly).length;
    data.forEach(p => {
        if (isAnomaly(p) && classifier(p)) {
            found++;
        }
    });
    return { found, total: totalAnomalies };
};

// --- Components ---
const AnalysisPlot: React.FC<{ data: DataPoint[], analysis: AnalysisType }> = ({ data, analysis }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const domainX = [0, 1]; // Duration
    const domainY = [0, 1]; // Amplitude

    const scaleX = (val: number) => padding + val * (width - 2 * padding);
    const scaleY = (val: number) => (height - padding) - val * (height - padding * 1.5);

    const pointColor = (p: DataPoint) => {
        if (analysis === 'none') {
            return p.type === 'normal' ? 'fill-slate-400' : 'fill-fuchsia-400';
        }
        if (analysis === 'threshold') {
            return traditionalClassifier(p) ? 'fill-fuchsia-400' : 'fill-slate-400';
        }
        if (analysis === 'ml') {
            return mlClassifier(p) ? 'fill-fuchsia-400' : 'fill-slate-400';
        }
    };

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Light curve anomaly scatter plot">
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Event Duration</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Event Amplitude</text>
            
            {analysis === 'threshold' && (
                <g>
                    <path d={`M ${scaleX(0.8)} ${scaleY(0)} V ${scaleY(1)} M ${scaleX(0)} ${scaleY(0.8)} H ${scaleX(1)}`} className="stroke-red-500 stroke-2 stroke-dasharray-4" />
                </g>
            )}

            {data.map(p => (
                <circle key={p.id} cx={scaleX(p.features.duration)} cy={scaleY(p.features.amplitude)} r="3.5" className={pointColor(p)} opacity="0.9" />
            ))}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; found: number; total: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, found, total, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
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
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);

const AnomalyDetectionExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);

    useEffect(() => {
        setData(generateData());
    }, []);

    const traditionalResults = useMemo(() => calculateAccuracy(data, traditionalClassifier), [data]);
    const mlResults = useMemo(() => calculateAccuracy(data, mlClassifier), [data]);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setTimeout(() => {
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
                    <AnalysisPlot data={data} analysis={analysisType} />
                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Normal Variation</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-400"></div> Anomaly Detected</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <button onClick={() => handleRunAnalysis('threshold')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'threshold' ? 'Analyzing...' : 'Run Fixed Thresholds'}
                        </button>
                        {analysisType === 'threshold' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={TRADITIONAL_CODE} />
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
                    <div>
                        <button onClick={() => handleRunAnalysis('ml')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'ml' ? 'Analyzing...' : 'Run DBSCAN Analysis'}
                        </button>
                        {analysisType === 'ml' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={ML_CODE} />
                                <ResultCard
                                    title="DBSCAN Clustering (ML)"
                                    description="DBSCAN correctly identifies the dense cluster of normal events and flags all points outside of it as anomalies, successfully finding both flares and dips."
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