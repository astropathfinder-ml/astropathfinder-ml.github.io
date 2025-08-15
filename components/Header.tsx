import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon, XIcon } from './Icons';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeLinkClass = 'bg-slate-200 text-slate-900';
  const inactiveLinkClass = 'text-slate-600 hover:bg-slate-200 hover:text-slate-900';
  const linkBaseClass = 'block px-3 py-2 rounded-md text-base font-medium transition-colors';

  const NavLinks = () => (
    <>
      <NavLink
        to="/"
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        onClick={() => setIsMenuOpen(false)}
      >
        Home
      </NavLink>
      <NavLink
        to="/unsupervised"
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        onClick={() => setIsMenuOpen(false)}
      >
        Unsupervised Learning
      </NavLink>
      <NavLink
        to="/supervised"
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        onClick={() => setIsMenuOpen(false)}
      >
        Supervised Learning
      </NavLink>
      <NavLink
        to="/playground"
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        onClick={() => setIsMenuOpen(false)}
      >
        Interactive Analysis
      </NavLink>
      <NavLink
        to="/datalab"
        className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
        onClick={() => setIsMenuOpen(false)}
      >
        Data Lab
      </NavLink>
    </>
  );

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200/80">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center gap-3 text-slate-900 font-bold text-xl">
              <img src="assets/AMESlogoblack.png" alt="Ames logo" className="h-12 w-auto" />
              <span>
                <span className="text-cyan-500">Astro</span>Pathfinder ML
              </span>
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLinks />
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="bg-slate-100 inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-cyan-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;