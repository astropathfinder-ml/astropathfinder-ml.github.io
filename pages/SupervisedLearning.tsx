import React, { useState } from 'react';
import ContentCard from '../components/ContentCard';
import { SUPERVISED_CLASSIFICATION_CONTENT, SUPERVISED_REGRESSION_CONTENT } from '../constants';
import { ChevronDownIcon } from '../components/Icons';
import AstroBotPanel from '../components/AstroBotPanel';
import Lightbox from '../components/Lightbox';

const SupervisedLearning: React.FC = () => {
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
      key: 'regression',
      title: 'Regression',
      content: SUPERVISED_REGRESSION_CONTENT,
    },
    {
      key: 'classification',
      title: 'Classification',
      content: SUPERVISED_CLASSIFICATION_CONTENT,
    }
  ];
  
  const botSystemInstruction = "You are AstroBot, an expert AI assistant specializing in supervised machine learning for astrobiology. Your purpose is to answer questions about the topics on this page: regression (including Linear and Random Forest Regression) and classification (like SVMs and CNNs). Keep your answers focused on these concepts as they apply to astronomical data.";
  const botInitialMessage = "Hello! I can answer questions about supervised learning. For example, you could ask 'What is the difference between classification and regression?' or 'Tell me about Random Forest Regression'.";


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        <div className="lg:col-span-2 space-y-12">
          <header className="text-center">
            <h1 className="py-2 text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              Supervised Learning
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              Train models to make predictions. These methods learn from labeled data to classify new observations or predict continuous values.
            </p>
          </header>

          <div className="space-y-8">
            {sections.map(section => (
              <section key={section.key}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex justify-between items-center text-left p-4 bg-white rounded-lg hover:bg-slate-200/60 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border border-slate-200"
                  aria-expanded={openSection === section.key}
                  aria-controls={`section-content-${section.key}`}
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 border-l-4 border-indigo-500 pl-4">
                    {section.title}
                  </h2>
                  <ChevronDownIcon
                    className={`h-8 w-8 text-indigo-500 transform transition-transform duration-300 ${openSection === section.key ? 'rotate-180' : ''}`}
                  />
                </button>
                {openSection === section.key && (
                  <div
                    id={`section-content-${section.key}`}
                    className="mt-6 animate-fade-in"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {section.content.map((item) => (
                        <ContentCard 
                            key={item.title} 
                            item={item} 
                            colorClass="hover:shadow-indigo-500/20"
                            titleColorClass="text-indigo-500"
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

export default SupervisedLearning;