import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type ImageType = 'normal' | 'transit' | 'noise' | 'offset';
type StarImage = { id: number; type: ImageType; data: number[][] };
type AnalysisType = 'none' | 'photometry' | 'cnn';
type ClassificationResult = { [id: number]: boolean }; // true if correct, false if incorrect
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const IMAGE_SIZE = 15;
const NUM_IMAGES = 16;

const TRADITIONAL_CODE = `from skimage.measure import regionprops
import numpy as np

def has_transit_photometry(image):
    # Sums the brightness of pixels inside
    # a fixed circle (aperture).
    # Prone to errors from noise, cosmic rays,
    # or off-center stars.
    h, w = image.shape
    center_y, center_x = h // 2, w // 2
    
    # Simple circular aperture
    Y, X = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((X - center_x)**2 + (Y-center_y)**2)
    mask = dist_from_center <= 3

    brightness = np.sum(image[mask])
    
    # Fails if brightness is too low (transit)
    # or too high (cosmic ray in aperture).
    return brightness < 130`;

const ML_CODE = `from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense

# A Convolutional Neural Network (CNN) can
# learn the spatial features of a transit.
# It is robust to noise and slight shifts
# in the star's position, leading to much
# higher accuracy.
model = build_cnn_classifier()
model.fit(X_train, y_train)

# Correctly identifies transits and non-transits
prediction = model.predict(image)
return prediction > 0.5`;

// --- Data Generation and Logic ---

// Generates a single star image
const generateImage = (type: ImageType): number[][] => {
    const data = Array(IMAGE_SIZE).fill(0).map(() => Array(IMAGE_SIZE).fill(0));
    const centerX = type === 'offset' ? IMAGE_SIZE / 2 + 2 : IMAGE_SIZE / 2;
    const centerY = type === 'offset' ? IMAGE_SIZE / 2 - 2 : IMAGE_SIZE / 2;
    const brightness = type === 'transit' ? 0.7 : 1.0;

    // Add star (Point Spread Function)
    for (let y = 0; y < IMAGE_SIZE; y++) {
        for (let x = 0; x < IMAGE_SIZE; x++) {
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            data[y][x] = brightness * Math.exp(-dist / 2) + Math.random() * 0.05;
        }
    }

    // Add noise/cosmic ray for 'noise' type
    if (type === 'noise') {
        const noiseX = Math.floor(Math.random() * IMAGE_SIZE);
        const noiseY = Math.floor(Math.random() * IMAGE_SIZE);
        data[noiseY][noiseX] = 1.5; // Cosmic ray
    }

    return data;
};

// Generates the full set of images
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

// Classifiers
const photometryClassifier = (image: StarImage): boolean => {
    const data = image.data;
    let brightness = 0;
    const center = Math.floor(IMAGE_SIZE / 2);
    // Sum pixels in a 3x3 aperture around the expected center
    for (let y = center - 1; y <= center + 1; y++) {
        for (let x = center - 1; x <= center + 1; x++) {
            brightness += data[y][x];
        }
    }
    const hasTransit = brightness < 7.0; // Threshold determined by experimentation
    return hasTransit === (image.type === 'transit');
};

const cnnClassifier = (image: StarImage): boolean => {
    // Mocked CNN - it's very good, but makes one mistake on a noisy image
    if (image.type === 'noise' && image.id === 3) return false; // Make one mistake
    return true; // Gets everything else right
};

// --- Components ---
const StarField: React.FC<{ images: StarImage[], results: ClassificationResult | null }> = ({ images, results }) => {
    return (
        <div className="grid grid-cols-4 gap-2 p-2 bg-slate-800 rounded-lg border-2 border-slate-700">
            {images.map(img => (
                <div key={img.id} className="relative aspect-square">
                    <ImageCanvas data={img.data} />
                    {results && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            {results[img.id] ?
                                <CheckCircleIcon className="w-8 h-8 text-green-400" /> :
                                <XCircleIcon className="w-8 h-8 text-red-400" />
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


const ImageryExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [images, setImages] = useState<StarImage[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);
    const [results, setResults] = useState<ClassificationResult | null>(null);

    useEffect(() => {
        setImages(generateImageData());
    }, []);

    const { photometryAccuracy, cnnAccuracy } = useMemo(() => {
        if (images.length === 0) return { photometryAccuracy: 0, cnnAccuracy: 0 };
        let photometryCorrect = 0;
        let cnnCorrect = 0;
        images.forEach(img => {
            if (photometryClassifier(img)) photometryCorrect++;
            if (cnnClassifier(img)) cnnCorrect++;
        });
        return {
            photometryAccuracy: Math.round((photometryCorrect / images.length) * 100),
            cnnAccuracy: Math.round((cnnCorrect / images.length) * 100)
        };
    }, [images]);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        setAnalysisType('none');
        setResults(null);
        setTimeout(() => {
            const newResults: ClassificationResult = {};
            const classifier = type === 'photometry' ? photometryClassifier : cnnClassifier;
            images.forEach(img => {
                newResults[img.id] = classifier(img);
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
                        Simulated starfield images. Find the transits!
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <button onClick={() => handleRunAnalysis('photometry')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'photometry' ? 'Analyzing...' : 'Run Aperture Photometry'}
                        </button>
                        {analysisType === 'photometry' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={TRADITIONAL_CODE} />
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
                    <div>
                        <button onClick={() => handleRunAnalysis('cnn')} disabled={!!isLoading} className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:bg-slate-400 disabled:cursor-wait">
                            {isLoading === 'cnn' ? 'Analyzing...' : 'Run CNN Analysis'}
                        </button>
                        {analysisType === 'cnn' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={ML_CODE} />
                                <ResultCard
                                    title="Convolutional Neural Network (ML)"
                                    description="The CNN learns the 'look' of a transit and is robust to noise and position shifts. It achieves a much higher accuracy."
                                    accuracy={cnnAccuracy}
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