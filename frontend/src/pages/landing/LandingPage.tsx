
import React from 'react';
import { Button } from '../../app/DesignSystem';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-2xl font-black text-navy-800 tracking-tight">CODION</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#how" className="hover:text-orange-500">How it works</a>
          <a href="#" className="hover:text-orange-500">Features</a>
          <a href="#" className="hover:text-orange-500">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onNavigate('auth')}>Log in</Button>
          <Button size="sm" onClick={() => onNavigate('auth')}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center md:text-left md:flex items-center">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-navy-900 leading-[1.1]">
            Plan your outfit <span className="text-orange-500">before</span> you open the curtains.
          </h1>
          <p className="text-xl text-slate-500 max-w-xl">
            CODION syncs with your local weather and personal wardrobe to recommend the perfect look. No more checking the thermometer five times a morning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="px-12" onClick={() => onNavigate('auth')}>Get Started for Free</Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate('uikit')}>View UI Kit</Button>
          </div>
        </div>
        <div className="md:w-1/2 mt-16 md:mt-0 relative">
          <div className="bg-slate-100 aspect-video rounded-3xl border border-slate-200 shadow-2xl overflow-hidden transform md:rotate-3">
            <img src="https://picsum.photos/800/600?random=10" className="w-full h-full object-cover" alt="App Preview" />
          </div>
        </div>
      </header>

      {/* How it Works */}
      <section id="how" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-black text-navy-900 mb-4">How it works</h2>
             <p className="text-slate-500">Simplify your morning routine in 5 easy steps.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: 1, title: 'Sync Weather', icon: '☁️', desc: 'We fetch accurate local data.' },
              { step: 2, title: 'Map Closet', icon: '🧥', desc: 'Upload your items once.' },
              { step: 3, title: 'Daily Checklist', icon: '✅', desc: 'View essentials for the day.' },
              { step: 4, title: 'Smart Recs', icon: '✨', desc: 'AI suggests the best combos.' },
              { step: 5, title: 'Save History', icon: '📅', desc: 'Track your best looks.' },
            ].map((s) => (
              <div key={s.step} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center text-3xl">
                  {s.icon}
                </div>
                <h3 className="font-bold text-navy-900">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Demo CTA */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-navy-800 rounded-3xl p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
          <div className="space-y-4">
             <h2 className="text-3xl font-bold">Admin Experience</h2>
             <p className="text-slate-400 max-w-md">Curious how we manage the platform? Explore our administrative dashboard to see conversion funnels and user insights.</p>
          </div>
          <Button variant="primary" size="lg" className="whitespace-nowrap" onClick={() => onNavigate('admin-dashboard')}>
            Explore Admin Dashboard
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 text-center text-sm text-slate-400">
        &copy; 2024 CODION SaaS. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
