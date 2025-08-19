import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type ImageType = 'normal' | 'transit' | 'noise' | 'offset';
type StarImage = { id: number; type: ImageType; data: number[][] };
type AnalysisType = 'none' | 'photometry' | 'cnn';
type ClassificationResult = { [id: number]: { actual: boolean; predicted: boolean } };
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const IMAGE_SIZE = 15;
const NUM_IMAGES = 16;

const TRADITIONAL_CODE = `const photometryClassifier = (image) => {
    // Sums the brightness of all pixels inside
    // a fixed 3x3 square (aperture) at the image center.
    // Prone to errors from noise or off-center stars.
    let brightness = 0;
    const center = Math.floor(IMAGE_SIZE / 2);
    for (let y = center - 1; y <= center + 1; y++) {
        for (let x = center - 1; x <= center + 1; x++) {
            brightness += image.data[y]?.[x] || 0;
        }
    }
    // Predict a transit if brightness is below a threshold.
    return brightness < 7.0;
};`;

const ML_CODE = `const mlClassifier = (image) => {
    // This model extracts multiple features from the image
    // to make a more robust classification.
    const { data } = image;
    let totalBrightness = 0, weightedX = 0, weightedY = 0, maxPixel = 0;

    // 1. Calculate total brightness, center of light, and cosmic rays.
    for (let y = 0; y < IMAGE_SIZE; y++) {
        for (let x = 0; x < IMAGE_SIZE; x++) {
            const pixel = data[y][x];
            totalBrightness += pixel;
            weightedX += x * pixel;
            weightedY += y * pixel;
            if (pixel > maxPixel) maxPixel = pixel;
        }
    }
    const centroidX = weightedX / totalBrightness;
    const centroidY = weightedY / totalBrightness;
    const distFromCenter = Math.sqrt(Math.pow(centroidX - 7, 2) + Math.pow(centroidY - 7, 2));

    // 2. Use features in a rule-based model.
    return totalBrightness < 9.5 && distFromCenter < 3.0 && maxPixel < 1.4;
};`;

// --- Data Generation and Logic ---
const generateImage = (type: ImageType): number[][] => {
    const data = Array(IMAGE_SIZE).fill(0).map(() => Array(IMAGE_SIZE).fill(0));
    const centerX = type === 'offset' ? IMAGE_SIZE / 2 + 2 : IMAGE_SIZE / 2;
    const centerY = type === 'offset' ? IMAGE_SIZE / 2 - 2 : IMAGE_SIZE / 2;
    const brightness = type === 'transit' ? 0.7 : 1.0;

    for (let y = 0; y < IMAGE_SIZE; y++) {
        for (let x = 0; x < IMAGE_SIZE; x++) {
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            data[y][x] = brightness * Math.exp(-dist / 2) + Math.random() * 0.05;
        }
    }

    if (type === 'noise') {
        const noiseX = Math.floor(Math.random() * IMAGE_SIZE);
        const noiseY = Math.floor(Math.random() * IMAGE_SIZE);
        data[noiseY][noiseX] = 1.5; // Cosmic ray
    }

    return data;
};

const generateImageData = (): StarImage[] => {
    const types: ImageType[] = [
        'normal', 'transit', 'transit', 'noise',
        'offset', 'transit', 'normal', 'normal',
        'transit', 'normal', 'transit', 'offset',
        'noise', 'normal', 'transit', 'normal'
    ];
    return types.map((type, i) => ({
        id: i,
        type: type,
        data: generateImage(type),
    }));
};

// --- Real Classifiers ---
const photometryClassifier = (image: StarImage): boolean => {
    const data = image.data;
    let brightness = 0;
    const center = Math.floor(IMAGE_SIZE / 2);
    // Sum pixels in a 3x3 aperture around the expected center
    for (let y = center - 1; y <= center + 1; y++) {
        for (let x = center - 1; x <= center + 1; x++) {
            brightness += data[y]?.[x] || 0;
        }
    }
    const predictedTransit = brightness < 7.0;
    return predictedTransit;
};

const mlClassifier = (image: StarImage): boolean => {
    const { data } = image;
    let totalBrightness = 0;
    let weightedX = 0;
    let weightedY = 0;
    let maxPixelValue = 0;

    for (let y = 0; y < IMAGE_SIZE; y++) {
        for (let x = 0; x < IMAGE_SIZE; x++) {
            const pixel = data[y][x];
            totalBrightness += pixel;
            weightedX += x * pixel;
            weightedY += y * pixel;
            if (pixel > maxPixelValue) {
                maxPixelValue = pixel;
            }
        }
    }

    const centroidX = totalBrightness > 0 ? weightedX / totalBrightness : IMAGE_SIZE / 2;
    const centroidY = totalBrightness > 0 ? weightedY / totalBrightness : IMAGE_SIZE / 2;
    const distFromCenter = Math.sqrt(Math.pow(centroidX - IMAGE_SIZE / 2, 2) + Math.pow(centroidY - IMAGE_SIZE / 2, 2));

    // This model is more robust:
    // 1. It checks total image brightness (less affected by one cosmic ray).
    // 2. It checks if the star is reasonably centered.
    // 3. It filters out obvious cosmic rays (maxPixelValue).
    const predictedTransit = totalBrightness < 9.5 && distFromCenter < 3.0 && maxPixelValue < 1.4;
    return predictedTransit;
};

// --- Components ---
const StarField: React.FC<{ images: StarImage[], results: ClassificationResult | null }> = ({ images, results }) => {
    return (
        <div className="grid grid-cols-4 gap-2 p-2 bg-slate-800 rounded-lg border-2 border-slate-700">
            {images.map(img => (
                <div key={img.id} className="relative aspect-square">
                    <ImageCanvas data={img.data} />
                    {results && (
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${results[img.id].predicted === results[img.id].actual ? 'bg-black/50' : 'bg-red-500/60'}`}>
                            {results[img.id].predicted === results[img.id].actual ?
                                <CheckCircleIcon className="w-8 h-8 text-green-400" /> :
                                <XCircleIcon className="w-8 h-8 text-white" />
                            }
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const ImageCanvas: React.FC<{ data: number[][] }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const pixelSize = size / IMAGE_SIZE;
        ctx.clearRect(0, 0, size, size);

        for (let y = 0; y < IMAGE_SIZE; y++) {
            for (let x = 0; x < IMAGE_SIZE; x++) {
                const value = Math.min(Math.max(data[y][x], 0), 1.5) / 1.5;
                const grayscale = Math.floor(value * 255);
                ctx.fillStyle = `rgb(${grayscale}, ${grayscale}, ${grayscale})`;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }, [data]);

    return <canvas ref={canvasRef} width="100" height="100" className="w-full h-full rounded"></canvas>;
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


const ImageryExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [images, setImages] = useState<StarImage[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [results, setResults] = useState<ClassificationResult | null>(null);

    useEffect(() => {
        setImages(generateImageData());
    }, []);

    const calculateAccuracy = (res: ClassificationResult | null): number => {
        if (!res) return 0;
        const correct = Object.values(res).filter(r => r.predicted === r.actual).length;
        return Math.round((correct / images.length) * 100);
    };

    const photometryAccuracy = useMemo(() => {
        const photoResults: ClassificationResult = {};
        images.forEach(img => {
            photoResults[img.id] = {
                actual: img.type === 'transit',
                predicted: photometryClassifier(img)
            };
        });
        return calculateAccuracy(photoResults);
    }, [images]);
    
    const mlAccuracy = useMemo(() => {
        const mlResults: ClassificationResult = {};
        images.forEach(img => {
            mlResults[img.id] = {
                actual: img.type === 'transit',
                predicted: mlClassifier(img)
            };
        });
        return calculateAccuracy(mlResults);
    }, [images]);


    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setResults(null);
        setTimeout(() => {
            const newResults: ClassificationResult = {};
            const classifier = type === 'photometry' ? photometryClassifier : mlClassifier;
            images.forEach(img => {
                newResults[img.id] = {
                    actual: img.type === 'transit',
                    predicted: classifier(img)
                };
            });
            setResults(newResults);
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

    return (
        <div className="animate-fade-in space-y-12">
            <header className="text-center">
                <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                    Planetary Transit Detection
                </h1>
                <div className="flex justify-center items-center gap-2 mt-3">
                    <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                        Supervised Learning
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-semibold text-sm">
                        Classification (CNN)
                    </span>
                </div>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    One of the most successful methods for finding exoplanets is photometry—measuring the tiny dip in a star's brightness as a planet passes in front. Can we automatically detect this "transit" signal in noisy images?
                </p>
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-700 bg-cyan-100 rounded-lg border border-cyan-200 hover:bg-cyan-200 hover:border-cyan-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Read the Research Paper: "{paperTitle}"
                </a>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="lg:sticky top-24">
                    <StarField images={images} results={results} />
                    <div className="mt-2 text-center text-sm text-slate-500">
                        Simulated starfield images. Find the transits! Red overlays indicate a misclassification.
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 1: Aperture Photometry</h3>
                        <p className="text-sm text-slate-600">This traditional method sums the brightness of pixels inside a fixed circle (aperture). It's simple but prone to errors from noise, cosmic rays, or off-center stars.</p>
                        <CodeDisplay code={TRADITIONAL_CODE} />
                        <button onClick={() => handleRunAnalysis('photometry')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'photometry' ? 'Analyzing...' : 'Run Aperture Photometry'}
                        </button>
                        {analysisType === 'photometry' && (
                            <div className="animate-fade-in">
                                <ResultCard
                                    title="Aperture Photometry"
                                    description="This method is easily fooled by cosmic rays (noise) or stars that are not perfectly centered, leading to many misclassifications."
                                    accuracy={photometryAccuracy}
                                    active={analysisType === 'photometry'}
                                    icon={<XCircleIcon className="w-8 h-8 text-red-500" />}
                                    color="border-red-500"
                                    textColor="text-red-500"
                                />
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800">Method 2: Feature-Based Model (ML)</h3>
                        <p className="text-sm text-slate-600">Instead of a full CNN, this model demonstrates a simpler ML approach by extracting meaningful features from each image (total brightness, light concentration, etc.) to make a more robust decision.</p>
                        <CodeDisplay code={ML_CODE} />
                        <button onClick={() => handleRunAnalysis('cnn')} disabled={!!isLoading} className="w-full px-6 py-3 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'cnn' ? 'Analyzing...' : 'Run ML Analysis'}
                        </button>
                        {analysisType === 'cnn' && (
                            <div className="animate-fade-in">
                                <ResultCard
                                    title="Feature-Based Model (ML)"
                                    description="The ML model uses multiple image features to be more robust to noise and position shifts. It achieves a much higher accuracy."
                                    accuracy={mlAccuracy}
                                    active={analysisType === 'cnn'}
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

export default ImageryExample;
