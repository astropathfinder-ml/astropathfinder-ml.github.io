
import React from 'react';
import { Link } from 'react-router-dom';
import { TEAM_MEMBERS } from '../constants';
import TeamMemberCard from '../components/TeamMemberCard';
import { ArrowRightIcon } from '../components/Icons';

const Home: React.FC = () => {
  return (
    <div className="space-y-16 animate-fade-in">
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
          Welcome to <span className="text-cyan-500">Astro</span>Pathfinder ML
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-600">
          Your interactive journey into the world of AI and Machine Learning, tailored for the astrobiology community. Whether you're a seasoned researcher or just starting, this guide will help you navigate the core concepts of ML and apply them to the cosmos.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-8 text-cyan-500">Begin Your Adventure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Link to="/unsupervised" className="group flex flex-col p-8 bg-white rounded-lg border border-slate-200 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10">
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900">Unsupervised Learning</h3>
                <p className="mt-2 text-slate-600">Discover hidden patterns and structures in your data without pre-labeled examples. Ideal for exploratory analysis of astronomical surveys.</p>
            </div>
            <div className="mt-4 flex items-center text-cyan-500 font-semibold">
              Explore Clustering & DR <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          <Link to="/supervised" className="group flex flex-col p-8 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10">
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900">Supervised Learning</h3>
                <p className="mt-2 text-slate-600">Train models to make predictions based on labeled data. Perfect for classifying celestial objects or predicting exoplanet characteristics.</p>
            </div>
             <div className="mt-4 flex items-center text-indigo-500 font-semibold">
              Explore Classification & Regression <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
           <Link to="/playground" className="group flex flex-col p-8 bg-white rounded-lg border border-slate-200 hover:border-amber-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 md:col-span-1">
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900">Interactive Analysis</h3>
                <p className="mt-2 text-slate-600">See how Machine Learning outperforms traditional methods in a hands-on, interactive analysis of astronomical data.</p>
            </div>
             <div className="mt-4 flex items-center text-amber-600 font-semibold">
              Run Comparison <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
           <Link to="/datalab" className="group flex flex-col p-8 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 md:col-span-1">
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-slate-900">Data Lab</h3>
                <p className="mt-2 text-slate-600">Upload your own dataset and apply unsupervised clustering to uncover hidden structures in your data. Your data stays private and is processed in-browser.</p>
            </div>
             <div className="mt-4 flex items-center text-emerald-600 font-semibold">
              Analyze Your Data <ArrowRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12 text-cyan-500">Meet the Team</h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {TEAM_MEMBERS.map((member) => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;