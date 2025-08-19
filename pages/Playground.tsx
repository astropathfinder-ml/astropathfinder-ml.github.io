import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HabitableZoneExample from '../components/playground/HabitableZoneExample';
import ImageryExample from '../components/playground/ImageryExample';
import AtmosphereExample from '../components/playground/AtmosphereExample';
import GalaxyZooExample from '../components/playground/GalaxyZooExample';
import StellarSpectraExample from '../components/playground/StellarSpectraExample';
import AnomalyDetectionExample from '../components/playground/AnomalyDetectionExample';
import LiveKMeansExample from '../components/playground/LiveKMeansExample';
import { ArrowLeftIcon, TelescopeIcon, AtomIcon, PlanetIcon, GalaxyIcon, SpectrumIcon, SignalIcon, BeakerIcon } from '../components/Icons';

type Example = 'hub' | 'habitable-zone' | 'imagery' | 'atmosphere' | 'galaxy-zoo' | 'stellar-spectra' | 'anomaly-detection' | 'live-kmeans';

const EXAMPLES: {
    key: Example;
    title: string;
    description: string;
    shortDescription: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    paperTitle: string;
    paperUrl: string;
}[] = [
    {
        key: 'habitable-zone',
        title: 'Habitable Exoplanet Classification',
        description: 'Use orbital and stellar data to determine if a planet lies within the "Goldilocks Zone" where liquid water could exist.',
        shortDescription: 'Habitability',
        Icon: PlanetIcon,
        color: 'amber',
        paperTitle: 'Facing the Heat: A Machine Learning-Based Analysis of Exoplanetary Habitability',
        paperUrl: 'https://arxiv.org/abs/2105.02237',
    },
    {
        key: 'imagery',
        title: 'Planetary Transit Detection',
        description: 'Analyze starfield imagery to detect the subtle dip in brightness caused by a transiting exoplanet, a key method for discovery.',
        shortDescription: 'Transits',
        Icon: TelescopeIcon,
        color: 'cyan',
        paperTitle: 'Identifying Exoplanets with Deep Learning',
        paperUrl: 'https://iopscience.iop.org/article/10.3847/1538-3881/aa9e09',
    },
    {
        key: 'atmosphere',
        title: 'Atmospheric Biosignature Detection',
        description: 'Search for signs of life by analyzing the atmospheric spectra of exoplanets for tell-tale chemical fingerprints like oxygen or methane.',
        shortDescription: 'Atmospheres',
        Icon: AtomIcon,
        color: 'indigo',
        paperTitle: 'An unsupervised machine learning approach to identifying anomalous spectra for biosignature detection',
        paperUrl: 'https://www.nature.com/articles/s41550-021-01509-3',
    },
    {
        key: 'galaxy-zoo',
        title: 'Galaxy Morphology Clustering',
        description: 'Use color and shape data to automatically group galaxies into morphological classes like "spiral" or "elliptical" without prior labels.',
        shortDescription: 'Galaxies',
        Icon: GalaxyIcon,
        color: 'teal',
        paperTitle: 'Galaxy Zoo: unsupervised classification of galaxy morphologies',
        paperUrl: 'https://academic.oup.com/mnras/article/511/3/4313/6533038',
    },
    {
        key: 'stellar-spectra',
        title: 'Stellar Spectral Classification',
        description: 'Use PCA to reduce high-dimensional stellar spectra into a simple 2D plot, revealing distinct star types automatically.',
        shortDescription: 'Spectra',
        Icon: SpectrumIcon,
        color: 'pink',
        paperTitle: 'Stellar spectral classification using principal component analysis and artificial neural networks',
        paperUrl: 'https://academic.oup.com/mnras/article/296/2/329/979684',
    },
    {
        key: 'anomaly-detection',
        title: 'Light Curve Anomaly Detection',
        description: 'Use DBSCAN to find rare and unusual events like stellar flares in a vast dataset of star brightness measurements.',
        shortDescription: 'Anomalies',
        Icon: SignalIcon,
        color: 'fuchsia',
        paperTitle: 'An Anomaly Detection-based Search for New Physics in TESS Light Curves',
        paperUrl: 'https://arxiv.org/abs/2205.13203',
    },
    {
        key: 'live-kmeans',
        title: 'Live ML Code Execution',
        description: 'Run a real K-Means clustering algorithm in your browser. See the code, change the parameters, and get an AI-powered explanation.',
        shortDescription: 'Live K-Means',
        Icon: BeakerIcon,
        color: 'emerald',
        paperTitle: 'Understanding K-Means Clustering',
        paperUrl: 'https://en.wikipedia.org/wiki/K-means_clustering',
    }
];

const PlaygroundHub: React.FC<{ setExample: (example: Example) => void }> = ({ setExample }) => (
    <div className="space-y-12 animate-fade-in">
        <header className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                Interactive Analysis
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-600">
                Choose an analysis to see how Machine Learning compares to traditional methods in astrobiology. Each example provides a hands-on demonstration of ML's power to uncover cosmic secrets.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {EXAMPLES.map(({ key, title, description, Icon, color }) => (
                <button
                    key={key}
                    onClick={() => setExample(key)}
                    className={`group block p-8 text-left bg-white rounded-lg border border-slate-200 hover:border-${color}-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-${color}-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${color}-500`}
                >
                    <Icon className={`w-12 h-12 mb-4 text-${color}-500`} />
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-slate-600">{description}</p>
                </button>
            ))}
        </div>
    </div>
);

const AnalysisNavigator: React.FC<{
    current: Example;
    setExample: (example: Example) => void;
}> = ({ current, setExample }) => {

    const baseButtonClass = "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors border disabled:cursor-default shadow-sm";

    const colorClasses = {
        'habitable-zone': {
            active: 'bg-amber-500 text-white border-amber-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-400'
        },
        'imagery': {
            active: 'bg-cyan-500 text-white border-cyan-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-cyan-50 hover:border-cyan-400'
        },
        'atmosphere': {
            active: 'bg-indigo-500 text-white border-indigo-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50 hover:border-indigo-400'
        },
        'galaxy-zoo': {
            active: 'bg-teal-500 text-white border-teal-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-teal-50 hover:border-teal-400'
        },
        'stellar-spectra': {
            active: 'bg-pink-500 text-white border-pink-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-pink-50 hover:border-pink-400'
        },
        'anomaly-detection': {
            active: 'bg-fuchsia-500 text-white border-fuchsia-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-fuchsia-50 hover:border-fuchsia-400'
        },
        'live-kmeans': {
            active: 'bg-emerald-500 text-white border-emerald-600',
            inactive: 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-400'
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
                onClick={() => setExample('hub')}
                className={`${baseButtonClass} bg-white text-slate-700 border-slate-300 hover:bg-slate-100`}
                aria-label="Back to all analyses"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline">All Analyses</span>
            </button>
            <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
            {EXAMPLES.map(({ key, title, shortDescription, Icon }) => {
                const isActive = current === key;
                const styling = colorClasses[key as keyof typeof colorClasses];
                return (
                    <button
                        key={key}
                        onClick={() => !isActive && setExample(key)}
                        disabled={isActive}
                        className={`${baseButtonClass} ${isActive ? styling.active : styling.inactive}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="hidden xl:inline">{title}</span>
                        <span className="xl:hidden">{shortDescription}</span>
                    </button>
                );
            })}
        </div>
    );
};


const Playground: React.FC = () => {
    const { exampleId } = useParams();
    const navigate = useNavigate();

    const validExampleKeys = useMemo(() => EXAMPLES.map(e => e.key), []);

    const currentExample = useMemo((): Example => {
        if (exampleId && validExampleKeys.includes(exampleId as Example)) {
            return exampleId as Example;
        }
        return 'hub';
    }, [exampleId, validExampleKeys]);
    
    const setExample = (example: Example) => {
        if (example === 'hub') {
            navigate('/playground');
        } else {
            navigate(`/playground/${example}`);
        }
    };

    const currentExampleData = useMemo(() => {
        return EXAMPLES.find(e => e.key === currentExample);
    }, [currentExample]);

    const renderExample = () => {
        if (!currentExampleData || currentExample === 'hub') {
            return <PlaygroundHub setExample={setExample} />;
        }
        
        const props = {
            paperTitle: currentExampleData.paperTitle,
            paperUrl: currentExampleData.paperUrl,
        };

        switch (currentExample) {
            case 'habitable-zone':
                return <HabitableZoneExample {...props} />;
            case 'imagery':
                return <ImageryExample {...props} />;
            case 'atmosphere':
                return <AtmosphereExample {...props} />;
            case 'galaxy-zoo':
                return <GalaxyZooExample {...props} />;
            case 'stellar-spectra':
                return <StellarSpectraExample {...props} />;
            case 'anomaly-detection':
                return <AnomalyDetectionExample {...props} />;
            case 'live-kmeans':
                return <LiveKMeansExample {...props} />;
            default:
                return <PlaygroundHub setExample={setExample} />;
        }
    };

    return (
        <div className="animate-fade-in">
            {currentExample !== 'hub' && (
                <AnalysisNavigator current={currentExample} setExample={setExample} />
            )}
            {renderExample()}
        </div>
    );
};

export default Playground;