import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon, BookOpenIcon } from '../Icons';

// --- Data Types and Constants ---
type StarType = 'O-type' | 'G-type' | 'M-type';
type SpectrumPoint = { wavelength: number; flux: number };
type Star = { id: number; type: StarType; spectrum: SpectrumPoint[]; pca: { pc1: number; pc2: number } };
type AnalysisType = 'none' | 'traditional' | 'ml';
interface ExampleProps {
    paperTitle: string;
    paperUrl: string;
}

const TRADITIONAL_CODE = `def classify_by_color_index(spectrum):
    # Uses a simple ratio of flux at two
    # specific wavelengths (a "color index").
    # This is a form of manual feature extraction.
    # It's easily confused by noise or similar
    # colors between different star types.
    blue_flux = get_flux_at(spectrum, 450)
    red_flux = get_flux_at(spectrum, 700)
    color_index = blue_flux / red_flux

    if color_index > 1.5:
        return 'O-type' # Hot, blue star
    elif color_index > 0.8:
        return 'G-type' # Sun-like star
    else:
        return 'M-type' # Cool, red star`;

const ML_CODE = `from sklearn.decomposition import PCA

# Principal Component Analysis (PCA) is an
# unsupervised technique that finds the
# directions of maximum variance in the data.
# For spectra, PC1 often correlates with temperature
# and PC2 with metallicity, automatically
# finding the most important features.
pca = PCA(n_components=2)
princip_components = pca.fit_transform(all_spectra)

# The resulting 2D plot shows clear separation
# between the different stellar populations.`;

// --- Data Generation & Logic ---
const generateSpectrum = (type: StarType, pcaTarget: { pc1: number; pc2: number }): { spectrum: SpectrumPoint[], pca: { pc1: number, pc2: number } } => {
    const data: SpectrumPoint[] = [];
    const peakWavelength = type === 'O-type' ? 400 : type === 'G-type' ? 550 : 750;
    const tempFactor = type === 'O-type' ? 2.0 : type === 'G-type' ? 1.0 : 0.5;

    for (let w = 300; w <= 900; w += 10) {
        // Black-body radiation approximation
        let flux = tempFactor * Math.exp(-Math.pow((w - peakWavelength) / 150, 2));
        // Add some noise and mock absorption lines
        if ((w > 480 && w < 490) || (w > 650 && w < 660)) {
            flux *= 0.8;
        }
        flux += (Math.random() - 0.5) * 0.1;
        data.push({ wavelength: w, flux: Math.max(0, flux) });
    }

    // Add slight random deviation to PCA coordinates
    const pca = {
        pc1: pcaTarget.pc1 + (Math.random() - 0.5) * 0.4,
        pc2: pcaTarget.pc2 + (Math.random() - 0.5) * 0.4
    };

    return { spectrum: data, pca };
};

const generateData = (numStars = 45): Star[] => {
    const data: Star[] = [];
    const starsPerType = numStars / 3;
    const pcaTargets = {
        'O-type': { pc1: -2, pc2: 0 },
        'G-type': { pc1: 0, pc2: 1 },
        'M-type': { pc1: 2, pc2: -1 },
    };

    for (let i = 0; i < numStars; i++) {
        let type: StarType = i < starsPerType ? 'O-type' : i < starsPerType * 2 ? 'G-type' : 'M-type';
        const { spectrum, pca } = generateSpectrum(type, pcaTargets[type]);
        data.push({ id: i, type, spectrum, pca });
    }
    return data;
};

// --- Components ---
const AnalysisPlot: React.FC<{ data: Star[], analysis: AnalysisType }> = ({ data, analysis }) => {
    const width = 500;
    const height = 400;
    const padding = 50;

    const typeToColor = { 'O-type': 'stroke-cyan-400', 'G-type': 'stroke-amber-400', 'M-type': 'stroke-red-400' };
    const typeToFill = { 'O-type': 'fill-cyan-400', 'G-type': 'fill-amber-400', 'M-type': 'fill-red-400' };

    const renderSpectraPlot = () => {
        const domainX = [300, 900];
        const domainY = [0, 2.2];
        const scaleX = (w: number) => padding + ((w - domainX[0]) / (domainX[1] - domainX[0])) * (width - 2 * padding);
        const scaleY = (f: number) => (height - padding) - ((f - domainY[0]) / (domainY[1] - domainY[0])) * (height - padding * 1.5);

        return (
            <>
                <text x={width / 2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Wavelength (nm)</text>
                <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Relative Flux</text>
                {data.map(star => {
                    const linePath = star.spectrum.map(p => `${scaleX(p.wavelength)},${scaleY(p.flux)}`).join(' L ');
                    return <path key={star.id} d={`M ${linePath}`} className={`${typeToColor[star.type]}`} strokeWidth="1.5" fill="none" opacity="0.7" />;
                })}
            </>
        );
    };

    const renderPcaPlot = () => {
        const domainX = [-3.5, 3.5];
        const domainY = [-2.5, 2.5];
        const scaleX = (pc1: number) => padding + ((pc1 - domainX[0]) / (domainX[1] - domainX[0])) * (width - 2 * padding);
        const scaleY = (pc2: number) => (height - padding) - ((pc2 - domainY[0]) / (domainY[1] - domainY[0])) * (height - padding * 1.5);
        return (
            <>
                <text x={width / 2} y={height - 15} textAnchor="middle" className="fill-slate-400 text-sm font-sans">Principal Component 1 (Temperature)</text>
                <text x={-height / 2} y={15} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm font-sans">Principal Component 2 (Metallicity)</text>
                {data.map(star => (
                    <circle
                        key={star.id}
                        cx={scaleX(star.pca.pc1)}
                        cy={scaleY(star.pca.pc2)}
                        r="4"
                        className={typeToFill[star.type]}
                        opacity="0.9"
                    />
                ))}
            </>
        );
    };

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg border-2 border-slate-700" aria-label="Stellar spectra or PCA plot">
            {analysis === 'ml' ? renderPcaPlot() : renderSpectraPlot()}
        </svg>
    );
};

const ResultCard: React.FC<{title:string; description: string; score: number; active: boolean; icon: React.ReactNode; color: string; textColor: string}> = ({title, description, score, active, icon, color, textColor}) => (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 ${active ? 'bg-white shadow-lg' : 'bg-slate-50 border-transparent'} ${active ? color : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <p className="mt-3 text-slate-600">{description}</p>
        <div className="mt-4 text-2xl font-bold text-slate-700">
            Separation Score: <span className={textColor}>{score}%</span>
        </div>
    </div>
);

const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 font-mono text-sm">
        <pre><code className="text-slate-300 whitespace-pre-wrap">{code}</code></pre>
    </div>
);

const StellarSpectraExample: React.FC<ExampleProps> = ({ paperTitle, paperUrl }) => {
    const [data, setData] = useState<Star[]>([]);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('none');
    const [isLoading, setIsLoading] = useState<AnalysisType | null>(null);

    useEffect(() => {
        setData(generateData());
    }, []);

    const handleRunAnalysis = (type: AnalysisType) => {
        if (isLoading) return;
        setIsLoading(type);
        // Don't reset analysis type to keep showing the plot during transition
        setTimeout(() => {
            setAnalysisType(type);
            setIsLoading(null);
        }, 750);
    };

    return (
        <div className="animate-fade-in space-y-12">
            <header className="text-center">
                <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-600">
                    Stellar Spectral Classification
                </h1>
                <div className="flex justify-center items-center gap-2 mt-3">
                    <span className="bg-cyan-100 text-cyan-800 text-sm font-semibold px-3 py-1 rounded-full">
                        Unsupervised Learning
                    </span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-semibold text-sm">
                        Dimensionality Reduction (PCA)
                    </span>
                </div>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                    Stellar spectra contain vast amounts of information but are high-dimensional. How can we simplify this data to find meaningful patterns, like different star types, without knowing the classes beforehand?
                </p>
                <a
                    href={paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-pink-700 bg-pink-100 rounded-lg border border-pink-200 hover:bg-pink-200 hover:border-pink-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    Read the Research Paper: "{paperTitle}"
                </a>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="lg:sticky top-24">
                    <AnalysisPlot data={data} analysis={analysisType} />
                    <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-cyan-400"></div> O-type (Hot)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-amber-400"></div> G-type (Sun-like)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-1 rounded-full bg-red-400"></div> M-type (Cool)</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <button
                            onClick={() => handleRunAnalysis('traditional')}
                            disabled={!!isLoading}
                            className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 disabled:bg-slate-400 disabled:cursor-wait"
                        >
                            {isLoading === 'traditional' ? 'Analyzing...' : 'Run Color Index Analysis'}
                        </button>
                        {analysisType === 'traditional' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={TRADITIONAL_CODE} />
                                <ResultCard
                                    title="Manual Feature Extraction"
                                    description="Using a simple color index struggles to reliably separate the star types, especially between G-type and M-type stars, resulting in poor separation."
                                    score={62}
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
                            className="w-full px-6 py-4 text-lg font-semibold text-white rounded-md transition-all duration-300 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:bg-slate-400 disabled:cursor-wait"
                        >
                            {isLoading === 'ml' ? 'Analyzing...' : 'Run PCA Analysis'}
                        </button>
                        {analysisType === 'ml' && (
                            <div className="mt-4 space-y-4 animate-fade-in">
                                <CodeDisplay code={ML_CODE} />
                                <ResultCard
                                    title="Principal Component Analysis (ML)"
                                    description="PCA automatically reduces the complex spectra into two meaningful components, revealing three distinct clusters that map perfectly to the true star types."
                                    score={99}
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

export default StellarSpectraExample;