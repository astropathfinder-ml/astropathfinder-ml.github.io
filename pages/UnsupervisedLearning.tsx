import React, { useState } from 'react';
import { UNSUPERVISED_DR_CONTENT, UNSUPERVISED_CLUSTERING_CONTENT } from '../constants';
import ContentCard from '../components/ContentCard';
import { ChevronDownIcon } from '../components/Icons';
import AstroBotPanel from '../components/AstroBotPanel';
import Lightbox from '../components/Lightbox';

const UnsupervisedLearning: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };
  
  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  const sections = [
    {
      key: 'dr',
      title: 'Dimensionality Reduction',
      content: UNSUPERVISED_DR_CONTENT,
    },
    {
      key: 'clustering',
      title: 'Clustering',
      content: UNSUPERVISED_CLUSTERING_CONTENT,
    }
  ];
  
  const botSystemInstruction = "You are AstroBot, an expert AI assistant specializing in unsupervised machine learning for astrobiology. Your purpose is to answer questions about the topics on this page: dimensionality reduction (PCA, Kernel PCA, t-SNE) and clustering (K-Means, DBSCAN). Keep your answers focused on these concepts as they apply to astronomical data.";
  const botInitialMessage = "Hello! I can answer questions about the unsupervised learning topics on this page. For example, you could ask 'What is PCA?' or 'How does K-Means work?'";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        <div className="lg:col-span-2 space-y-12">
          <header className="text-center">
            <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              Unsupervised Learning
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              Uncover the hidden structures in your data. These methods find patterns and groupings without any prior labels or outcomes.
            </p>
          </header>
          
          <div className="space-y-8">
            {sections.map(section => (
              <section key={section.key}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex justify-between items-center text-left p-4 bg-white rounded-lg hover:bg-slate-200/60 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 border border-slate-200"
                  aria-expanded={openSection === section.key}
                  aria-controls={`section-content-${section.key}`}
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 border-l-4 border-cyan-500 pl-4">
                    {section.title}
                  </h2>
                  <ChevronDownIcon 
                    className={`h-8 w-8 text-cyan-500 transform transition-transform duration-300 ${openSection === section.key ? 'rotate-180' : ''}`} 
                  />
                </button>
                {openSection === section.key && (
                  <div
                    id={`section-content-${section.key}`}
                    className="mt-6 animate-fade-in"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {section.content.map((item) => (
                        <ContentCard 
                          key={item.title} 
                          item={item} 
                          colorClass="hover:shadow-cyan-500/20"
                          titleColorClass="text-cyan-500"
                          onImageClick={handleImageClick}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <AstroBotPanel 
              systemInstructionOverride={botSystemInstruction}
              initialMessage={botInitialMessage}
            />
          </div>
        </aside>
      </div>
      {lightboxImage && (
        <Lightbox imageUrl={lightboxImage} onClose={handleCloseLightbox} />
      )}
    </>
  );
};

export default UnsupervisedLearning;