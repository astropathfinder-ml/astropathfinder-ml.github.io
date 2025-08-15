import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---

type DataPoint = { starTemp: number; orbitalDist: number; class: 0 | 1 }; // 0: Not Habitable, 1: Habitable
type AnalysisType = 'none' | 'traditional' | 'ml';
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const SUN_TEMP = 5780; // Sun's effective temperature in Kelvin

// The "ground truth" model for the habitable zone, based on a non-linear relationship.
// An ML model would be able to learn this complex shape from the data.
// d is proportional to T^2 for a more curved appearance.
const trueInnerBoundary = (temp: number) => 0.95 * Math.pow(temp / SUN_TEMP, 2);
const trueOuterBoundary = (temp: number) => 1.67 * Math.pow(temp / SUN_TEMP, 2);

// A simplified, linear model. This represents an earlier, less accurate physical model
// that fails to capture the non-linearities of the true habitable zone.
const simplifiedInnerBoundary = (temp: number) => 0.1 + 1.5 * (temp / SUN_TEMP);
const simplifiedOuterBoundary = (temp: number) => 0.2 + 2.5 * (temp / SUN_TEMP);


// --- Data Generation and Model Logic ---

const generateData = (numPoints = 200): DataPoint[] => {
  const data: DataPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const starTemp = 3000 + Math.random() * 5000; // Range from M-dwarfs to F-type stars
    const orbitalDist = 0.1 + Math.random() * 3.4; // Wide range of orbits
    
    const d_inner = trueInnerBoundary(starTemp);
    const d_outer = trueOuterBoundary(starTemp);

    const isHabitable = orbitalDist > d_inner && orbitalDist < d_outer;
    
    data.push({ starTemp, orbitalDist, class: isHabitable ? 1 : 0 });
  }
  return data;
};

const calculateAccuracy = (data: DataPoint[], classifier: (p: DataPoint) => 0 | 1): number => {
    let correct = 0;
    data.forEach(p => {
        if (classifier(p) === p.class) {
            correct++;
        }
    });
    return Math.round((correct / data.length) * 100);
}

const traditionalClassifier = (p: DataPoint): 0 | 1 => {
    const { starTemp, orbitalDist } = p;
    return (orbitalDist > simplifiedInnerBoundary(starTemp) && orbitalDist < simplifiedOuterBoundary(starTemp)) ? 1 : 0;
};
const mlClassifier = (p: DataPoint): 0 | 1 => {
    const { starTemp, orbitalDist } = p;
    return (orbitalDist > trueInnerBoundary(starTemp) && orbitalDist < trueOuterBoundary(starTemp)) ? 1 : 0;
}


const TRADITIONAL_ANALYSIS_CODE = `def is_habitable_simplified_model(planet):
    # An early, simplified model that assumes a linear
    # relationship between stellar temperature and
    # the habitable zone distance.
    temp = planet['star_temp']
    dist = planet['orbital_dist']
    
    # Constants derived from basic assumptions
    # for sun-like stars.
    SUN_TEMP = 5780
    inner_bound = 0.1 + 1.5 * (temp / SUN_TEMP)
    outer_bound = 0.2 + 2.5 * (temp / SUN_TEMP)
    
    if dist > inner_bound and dist < outer_bound:
        return 'Potentially Habitable'
    else:
        return 'Not Habitable'`;

const ML_ANALYSIS_CODE = `from sklearn.svm import SVC

# This non-linear SVM model can learn the
# true, curved shape of the habitable zone,
# making it accurate for a wide range of
# different star types.
model = SVC(kernel='rbf', gamma='auto')
model.fit(X_data, y_data)

accuracy = model.score(X_data, y_data)
print(f"Accuracy: {accuracy*100:.2f}%")`;


// --- Components ---

const AnalysisPlot: React.FC<{ 
    data: DataPoint[], 
    showBoundary: AnalysisType 
}> = ({ data, showBoundary }) => {
    const width = 500;
    const height = 400;
    const padding = 50;
    const tempDomain = [2800, 8200];
    const orbitDomain = [0, 3.5];

    const scaleX = (temp: number) => padding + ((temp - tempDomain[0]) / (tempDomain[1] - tempDomain[0])) * (width - 2 * padding);
    const scaleY = (dist: number) => (height - padding) - ((dist - orbitDomain[0]) / (orbitDomain[1] - orbitDomain[0])) * (height - padding * 1.5);

    const mlBoundaryArea = useMemo(() => {
        const innerPoints = [];
        const outerPoints = [];
        for (let temp = tempDomain[0]; temp <= tempDomain[1]; temp += 50) {
            innerPoints.push(`${scaleX(temp)},${scaleY(trueInnerBoundary(temp))}`);
            outerPoints.unshift(`${scaleX(temp)},${scaleY(trueOuterBoundary(temp))}`);
        }
        return `M ${innerPoints.join(' L ')} L ${outerPoints.join(' L ')} Z`;
    }, []);
    
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
            {/* Axis Labels */}
            <text x={width/2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Host Star Temperature (K)</text>
            <text x={-height/2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Orbital Distance (AU)</text>
            
            {/* Boundaries */}
             {showBoundary === 'ml' && (
                <path d={mlBoundaryArea} fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
            )}
             {showBoundary === 'traditional' && (
                <path d={traditionalBoundaryArea} fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 3" />
            )}
            
            {/* Data points */}
            {data.map((p, i) => (
                <circle
                    key={i}
                    cx={scaleX(p.starTemp)}
                    cy={scaleY(p.orbitalDist)}
                    r="3.5"
                    className={p.class === 1 ? 'fill-green-400' : 'fill-slate-500'}
                    opacity="0.9"
                />
            ))}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; accuracy: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, accuracy, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
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
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);


const HabitableZoneExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);

    useEffect(() => {
        setData(generateData());
    }, []);

    const traditionalAccuracy = useMemo(() => calculateAccuracy(data, traditionalClassifier), [data]);
    const mlAccuracy = useMemo(() => calculateAccuracy(data, mlClassifier), [data]);

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
        <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
          Habitable Exoplanet Classification
        </h1>
        <div className="flex justify-center items-center gap-2 mt-3">
            <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                Supervised Learning
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600 font-semibold text-sm">
                Classification (SVM)
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
            <AnalysisPlot data={data} showBoundary={analysisType} />
             <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div> Potentially Habitable</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div> Not Habitable</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-rose-500"></div> Simplified Model Zone</div>
                <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-emerald-500"></div> ML Habitable Zone</div>
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <button
                    onClick={() => handleRunAnalysis('traditional')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'traditional' ? 'Analyzing...' : 'Run Simplified Physical Model'}
                </button>
                {analysisType === 'traditional' && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                        <CodeDisplay code={TRADITIONAL_ANALYSIS_CODE} />
                        <ResultCard 
                            title="Simplified Physical Model"
                            description="This model uses a linear approximation of the habitable zone. It incorrectly excludes many habitable planets around cooler stars and misclassifies non-habitable planets around hotter stars."
                            accuracy={traditionalAccuracy}
                            active={analysisType === 'traditional'}
                            icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                            color="border-red-500"
                            textColor="text-red-500"
                        />
                    </div>
                )}
            </div>
            <div>
                 <button
                    onClick={() => handleRunAnalysis('ml')}
                    disabled={!!isLoading}
                    className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isLoading === 'ml' ? 'Analyzing...' : 'Run ML Analysis'}
                </button>
                 {analysisType === 'ml' && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                       <CodeDisplay code={ML_ANALYSIS_CODE} />
                       <ResultCard 
                            title="Support Vector Machine (ML)"
                            description="This ML model learns the true, non-linear shape of the habitable zone from the data. It correctly identifies habitable planets across a wide range of star types, achieving near-perfect classification."
                            accuracy={mlAccuracy}
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