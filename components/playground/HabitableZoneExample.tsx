import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---

type DataPoint = { id: number; starTemp: number; orbitalDist: number; class: 0 | 1 }; // 0: Not Habitable, 1: Habitable
type AnalysisType = 'none' | 'traditional' | 'ml';
type Prediction = { predicted: 0 | 1; correct: boolean };
type Predictions = { [id: number]: Prediction };

interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const SUN_TEMP = 5780; // Sun's effective temperature in Kelvin
const trueInnerBoundary = (temp: number) => 0.95 * Math.pow(temp / SUN_TEMP, 2);
const trueOuterBoundary = (temp: number) => 1.67 * Math.pow(temp / SUN_TEMP, 2);
const simplifiedInnerBoundary = (temp: number) => 0.1 + 1.5 * (temp / SUN_TEMP);
const simplifiedOuterBoundary = (temp: number) => 0.2 + 2.5 * (temp / SUN_TEMP);

// --- Data Generation and Model Logic ---

const generateData = (numPoints = 200): DataPoint[] => {
  const data: DataPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const starTemp = 3000 + Math.random() * 5000;
    const orbitalDist = 0.1 + Math.random() * 3.4;
    const d_inner = trueInnerBoundary(starTemp);
    const d_outer = trueOuterBoundary(starTemp);
    const isHabitable = orbitalDist > d_inner && orbitalDist < d_outer;
    data.push({ id: i, starTemp, orbitalDist, class: isHabitable ? 1 : 0 });
  }
  return data;
};

const calculateAccuracy = (predictions: Predictions): number => {
    const values = Object.values(predictions);
    if (values.length === 0) return 0;
    const correct = values.filter(p => p.correct).length;
    return Math.round((correct / values.length) * 100);
}

// --- Real Classifiers ---

const traditionalClassifier = (p: DataPoint): 0 | 1 => {
    const { starTemp, orbitalDist } = p;
    return (orbitalDist > simplifiedInnerBoundary(starTemp) && orbitalDist < simplifiedOuterBoundary(starTemp)) ? 1 : 0;
};

// Real k-Nearest Neighbors classifier
const runKnnClassifier = (data: DataPoint[], k: number): Predictions => {
    const predictions: Predictions = {};
    const normalizedData = data.map(p => ({
        ...p,
        normTemp: (p.starTemp - 3000) / 5000,
        normDist: (p.orbitalDist - 0.1) / 3.4
    }));

    for (const p1 of normalizedData) {
        const distances = normalizedData
            .filter(p2 => p1.id !== p2.id)
            .map(p2 => ({
                ...p2,
                dist: Math.sqrt(Math.pow(p1.normTemp - p2.normTemp, 2) + Math.pow(p1.normDist - p2.normDist, 2))
            }))
            .sort((a, b) => a.dist - b.dist);
        
        const neighbors = distances.slice(0, k);
        const habitableNeighbors = neighbors.filter(n => n.class === 1).length;
        const predictedClass = habitableNeighbors > k / 2 ? 1 : 0;
        
        predictions[p1.id] = {
            predicted: predictedClass,
            correct: predictedClass === p1.class
        };
    }
    return predictions;
};


const TRADITIONAL_ANALYSIS_CODE = `const traditionalClassifier = (planet) => {
    // An early, simplified model that assumes a linear
    // relationship between stellar temperature and
    // the habitable zone distance.
    const { starTemp, orbitalDist } = planet;
    
    // Constants derived from basic assumptions for sun-like stars.
    const inner = 0.1 + 1.5 * (starTemp / 5780);
    const outer = 0.2 + 2.5 * (starTemp / 5780);
    
    return orbitalDist > inner && orbitalDist < outer ? 1 : 0;
};`;

const ML_ANALYSIS_CODE = `const runKnnClassifier = (data, k) => {
    // This k-NN model learns the non-linear shape of the
    // habitable zone by looking at the "k" nearest data points
    // (neighbors) for any given planet to make a classification.
    
    // For each planet...
    data.forEach(p1 => {
        // 1. Find the distance to all other planets.
        const distances = data.map(p2 => ({
            ...p2,
            dist: Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
        })).sort((a, b) => a.dist - b.dist);
        
        // 2. Get the 'k' nearest neighbors.
        const neighbors = distances.slice(1, k + 1);
        
        // 3. Take a majority vote of the neighbors' classes.
        const habitableCount = neighbors.filter(n => n.class === 1).length;
        const predicted = habitableCount > k / 2 ? 1 : 0;
    });
};`;


// --- Components ---

const AnalysisPlot: React.FC<{ 
    data: DataPoint[], 
    analysisType: AnalysisType,
    predictions: Predictions | null
}> = ({ data, analysisType, predictions }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const tempDomain = [2800, 8200];
    const orbitDomain = [0, 3.5];

    const scaleX = (temp: number) => padding + ((temp - tempDomain[0]) / (tempDomain[1] - tempDomain[0])) * (width - 2 * padding);
    const scaleY = (dist: number) => (height - padding) - ((dist - orbitDomain[0]) / (orbitDomain[1] - orbitDomain[0])) * (height - padding * 1.5);

     const traditionalBoundaryArea = useMemo(() => {
        const innerPoints = [];
        const outerPoints = [];
        for (let temp = tempDomain[0]; temp <= tempDomain[1]; temp += 50) {
            innerPoints.push(`${scaleX(temp)},${scaleY(simplifiedInnerBoundary(temp))}`);
            outerPoints.unshift(`${scaleX(temp)},${scaleY(simplifiedOuterBoundary(temp))}`);
        }
        return `M ${innerPoints.join(' L ')} L ${outerPoints.join(' L ')} Z`;
    }, []);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Habitable zone diagram for exoplanets">
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Host Star Temperature (K)</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Orbital Distance (AU)</text>
            
             {analysisType === 'traditional' && (
                <path d={traditionalBoundaryArea} fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
            )}
            
            {data.map((p, i) => {
                const pred = predictions ? predictions[p.id] : null;
                const fill = p.class === 1 ? 'fill-green-400' : 'fill-slate-500';
                const stroke = pred && !pred.correct ? 'stroke-red-500' : 'stroke-none';
                
                return (
                    <circle
                        key={i}
                        cx={scaleX(p.starTemp)}
                        cy={scaleY(p.orbitalDist)}
                        r="3.5"
                        className={`${fill} ${stroke}`}
                        strokeWidth="2"
                        opacity="0.9"
                    />
                );
            })}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; accuracy: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, accuracy, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 mt-4 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-4 text-2xl font-bold text-slate-700">
            Accuracy: <span className={textColor}>{accuracy}%</span>
        </div>
    </div>
);

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm max-h-60 overflow-auto">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);


const HabitableZoneExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [predictions, setPredictions] = useState<Predictions | null>(null);

    useEffect(() => {
        setData(generateData());
    }, []);

    const currentAccuracy = useMemo(() => predictions ? calculateAccuracy(predictions) : 0, [predictions]);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setPredictions(null);

        setTimeout(() => {
            let newPredictions: Predictions = {};
            if (type === 'traditional') {
                data.forEach(p => {
                    const pred = traditionalClassifier(p);
                    newPredictions[p.id] = { predicted: pred, correct: pred === p.class };
                });
            } else if (type === 'ml') {
                newPredictions = runKnnClassifier(data, 5);
            }
            setPredictions(newPredictions);
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

  return (
    <div className="animate-fade-in space-y-12">
      <header className="text-center">
        <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
          Habitable Exoplanet Classification
        </h1>
        <div className="flex justify-center items-center gap-2 mt-3">
            <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                Supervised Learning
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600 font-semibold text-sm">
                Classification (k-NN)
            </span>
        </div>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
          A primary goal of astrobiology is finding planets in the "Habitable Zone" where liquid water could exist. The true zone is complex and non-linear. How does a simplified physical model compare to a more flexible ML approach?
        </p>
         <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-100 rounded-lg border border-amber-200 hover:bg-amber-200 hover:border-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500"
        >
            <BookOpenIcon className="w-5 h-5" />
            Read the Research Paper: "{paperTitle}"
        </a>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="lg:sticky top-24">
            <AnalysisPlot data={data} analysisType={analysisType} predictions={predictions} />
             <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div> Potentially Habitable</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div> Not Habitable</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-red-500"></div> Misclassified Point</div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Method 1: Simplified Physical Model</h3>
                <p className="text-sm text-slate-600">This traditional model uses a simplified, linear approximation of the habitable zone based on stellar temperature. It's a good first guess but struggles with the true non-linear nature of the zone.</p>
                <CodeDisplay code={TRADITIONAL_ANALYSIS_CODE} />
                <button
                    onClick={() => handleRunAnalysis('traditional')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'traditional' ? 'Analyzing...' : 'Run Simplified Model'}
                </button>
                {analysisType === 'traditional' && (
                    <div className="animate-fade-in">
                        <ResultCard 
                            title="Simplified Physical Model"
                            description="This model incorrectly excludes many habitable planets around cooler stars and misclassifies non-habitable planets around hotter stars."
                            accuracy={currentAccuracy}
                            active={analysisType === 'traditional'}
                            icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                            color="border-red-500"
                            textColor="text-red-500"
                        />
                    </div>
                )}
            </div>
            <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Method 2: k-Nearest Neighbors (ML)</h3>
                <p className="text-sm text-slate-600">This ML model doesn't assume a shape for the habitable zone. Instead, it classifies a planet based on the classification of its closest neighbors in the dataset, allowing it to learn the complex, non-linear boundary.</p>
                <CodeDisplay code={ML_ANALYSIS_CODE} />
                 <button
                    onClick={() => handleRunAnalysis('ml')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'ml' ? 'Analyzing...' : 'Run k-NN Analysis'}
                </button>
                 {analysisType === 'ml' && (
                    <div className="animate-fade-in">
                       <ResultCard 
                            title="k-Nearest Neighbors (ML)"
                            description="The k-NN model learns the non-linear shape of the habitable zone by classifying points based on their neighbors. It achieves a high accuracy across a wide range of star types."
                            accuracy={currentAccuracy}
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

export default HabitableZoneExample;
