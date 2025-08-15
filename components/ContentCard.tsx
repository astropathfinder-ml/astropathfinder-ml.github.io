import React from 'react';
import type { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
  colorClass: string;
  titleColorClass: string;
  onImageClick: (imageUrl: string) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ item, colorClass, titleColorClass, onImageClick }) => {
  return (
    <div className={`bg-white/70 rounded-lg border border-slate-200 backdrop-blur-sm overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colorClass}`}>
      <button onClick={() => onImageClick(item.imageUrl)} className="w-full h-48 block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-cyan-500 rounded-t-lg" aria-label={`View larger image for ${item.title}`}>
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover cursor-pointer" />
      </button>
      <div className="p-6">
        <h3 className={`text-xl font-bold ${titleColorClass}`}>{item.title}</h3>
        <p className="mt-3 text-slate-600">{item.description}</p>
      </div>
    </div>
  );
};

export default ContentCard;