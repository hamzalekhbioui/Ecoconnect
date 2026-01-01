import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccueilView } from '../../ai-assistant/components/AccueilView';
import { MembershipApplicationModal } from './MembershipApplicationModal';
import { useAuth } from '../../../hooks/useAuth';

interface LandingViewProps {
  onExplore: () => void;
  onNavigateToAIConcierge: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onExplore, onNavigateToAIConcierge }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const handleBecomeMember = () => {
    if (!user) {
      // Redirect to signup if not logged in
      navigate('/signup');
    } else {
      // Open application modal if logged in
      setIsApplicationModalOpen(true);
    }
  };

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute top-[20%] right-[0%] w-[30%] h-[30%] rounded-full bg-blue-400/5 blur-3xl"></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 flex flex-col justify-center text-center lg:text-left">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark dark:text-primary w-fit mx-auto lg:mx-0 mb-6">
                <span className="mr-1">✨</span> Community-Driven Economy
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-secondary dark:text-white sm:text-5xl md:text-6xl mb-6">
                Unlocking Collective <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary dark:from-primary dark:to-green-300">Intelligence</span> for a Circular Future
              </h1>
              <p className="mx-auto lg:mx-0 max-w-lg text-lg text-text-secondary-light dark:text-gray-400 mb-8 leading-relaxed">
                Exchange skills, money, and knowledge in a sustainable ecosystem. Join the movement towards a circular economy where every resource finds its value.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={onExplore}
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-secondary shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
                >
                  Get Started
                </button>
                <button className="inline-flex h-12 items-center justify-center rounded-lg border border-border-dark/10 bg-white px-8 text-base font-bold text-secondary hover:bg-gray-50 dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:bg-white/20 transition-all">
                  <span className="material-symbols-outlined mr-2 text-xl">play_circle</span>
                  How it Works
                </button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-text-secondary-light dark:text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <img
                      key={i}
                      alt={`User Avatar ${i}`}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-background-dark"
                      src={`https://picsum.photos/seed/user${i}/100/100`}
                    />
                  ))}
                </div>
                <p>Joined by 2,000+ eco-pioneers</p>
              </div>
            </div>
            <div className="lg:col-span-6 mt-16 lg:mt-0 relative">
              <div className="relative rounded-2xl bg-card-bg-light dark:bg-card-bg-dark border border-border-light dark:border-border-dark shadow-2xl overflow-hidden aspect-[4/3] group">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary-dark dark:text-primary">
                        <span className="material-symbols-outlined">forest</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary dark:text-white">Reforestation Project</p>
                        <p className="text-xs text-gray-500">Funded by Community</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-dark dark:text-primary">104%</p>
                      <p className="text-xs text-gray-500">Goal Reached</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-white dark:bg-card-bg-dark border-y border-border-light dark:border-border-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-secondary dark:text-white sm:text-4xl mb-4">Exchange Resources, Create Value</h2>
            <p className="text-lg text-text-secondary-light dark:text-gray-400">Our platform is built on four pillars to foster a thriving, interconnected circular economy.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'menu_book', title: 'Share Knowledge', desc: 'Access expert insights, educational resources, and open-source sustainability guides.', color: 'blue' },
              { icon: 'handshake', title: 'Exchange Skills', desc: 'Offer your unique talents in exchange for services. A true barter system.', color: 'purple' },
              { icon: 'paid', title: 'Fund Projects', desc: 'Participate in circular finance. Micro-fund local initiatives or find investors.', color: 'green' },
              { icon: 'groups', title: 'Connect', desc: 'Network with purpose. Find the right partners, mentors, and peers who share your vision.', color: 'orange' }
            ].map((item, idx) => (
              <div key={idx} className="group relative rounded-2xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-${item.color}-100 text-${item.color}-600 dark:bg-${item.color}-900/30 dark:text-${item.color}-400`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-secondary dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary-light dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Concierge Section */}
      <section className="py-16 sm:py-24 bg-background-light dark:bg-background-dark overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-secondary dark:bg-card-bg-dark overflow-hidden px-6 py-16 sm:px-16 md:pt-20 md:pb-24 shadow-2xl lg:grid lg:grid-cols-12 lg:gap-x-12 lg:pt-20 lg:pb-24">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="h-full w-full" fill="none" height="100%" width="100%">
                <defs>
                  <pattern height="20" id="dots" patternUnits="userSpaceOnUse" width="20" x="0" y="0">
                    <circle className="text-white" cx="2" cy="2" fill="currentColor" r="1"></circle>
                  </pattern>
                </defs>
                <rect fill="url(#dots)" height="100%" width="100%"></rect>
              </svg>
            </div>
            <div className="lg:col-span-6 text-left relative z-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                <span className="text-primary font-bold tracking-wider text-sm uppercase">AI Powered</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl mb-6">
                Meet Your <br />Eco-Concierge
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-md">
                An intelligent AI guide designed to match your specific needs with community resources automatically. Don't search—let the opportunities find you.
              </p>
              <ul className="space-y-4 mb-8">
                {['Smart resource matching', 'Automated introduction to partners', 'Personalized impact suggestions'].map((txt, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <span className="material-symbols-outlined text-primary mr-3">check_circle</span>
                    {txt}
                  </li>
                ))}
              </ul>
              <button onClick={onNavigateToAIConcierge} className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-secondary shadow-lg hover:bg-white hover:text-secondary transition-colors">
                Try Concierge Beta
              </button>
            </div>
            <div className="lg:col-span-6 mt-12 lg:mt-0 relative z-10">
              {/* Real AI Concierge Component replaces static mockup */}
              <div className="w-full max-w-lg mx-auto transform hover:scale-[1.02] transition-transform duration-500">
                <AccueilView />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Hidden ONLY for members (not visitors, regardless of status) */}
      {profile?.role !== 'member' && (
        <section className="py-16 sm:py-24 bg-white dark:bg-card-bg-dark border-t border-border-light dark:border-border-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-secondary dark:text-white sm:text-4xl mb-4">Choose Your Impact Level</h2>
              <p className="text-lg text-text-secondary-light dark:text-gray-400">Flexible membership options designed to scale with your contribution.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Tier */}
              <div className="flex flex-col rounded-2xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 text-left">
                  <h3 className="text-lg font-bold text-secondary dark:text-white">Public Access</h3>
                  <p className="text-sm text-text-secondary-light dark:text-gray-400 mt-2">Perfect for exploring the ecosystem.</p>
                </div>
                <div className="mb-6 flex items-baseline">
                  <span className="text-4xl font-black text-secondary dark:text-white">Free</span>
                  <span className="text-base font-medium text-text-secondary-light dark:text-gray-400 ml-2">/forever</span>
                </div>
                <ul className="mb-8 space-y-4 flex-1 text-left">
                  {['Browse public listings', 'Read success stories', 'Limited exchanges (3/mo)'].map((f, i) => (
                    <li key={i} className="flex items-center text-sm text-secondary dark:text-gray-300">
                      <span className="material-symbols-outlined text-green-500 mr-3 text-xl">check</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full rounded-lg bg-border-light dark:bg-white/10 px-4 py-3 text-sm font-bold text-secondary dark:text-white hover:bg-primary/20 hover:text-primary-dark transition-colors">
                  Join for Free
                </button>
              </div>
              {/* Premium Tier */}
              <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background-light dark:bg-background-dark p-8 shadow-xl">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 sm:translate-x-0">
                  <span className="inline-flex rounded-full bg-primary px-4 py-1 text-xs font-bold text-secondary uppercase tracking-wide">Most Popular</span>
                </div>
                <div className="mb-4 text-left">
                  <h3 className="text-lg font-bold text-secondary dark:text-white">Private Membership</h3>
                  <p className="text-sm text-text-secondary-light dark:text-gray-400 mt-2">For active circular economy builders.</p>
                </div>
                <div className="mb-6 flex items-baseline">
                  <span className="text-4xl font-black text-secondary dark:text-white">$29</span>
                  <span className="text-base font-medium text-text-secondary-light dark:text-gray-400 ml-2">/month</span>
                </div>
                <ul className="mb-8 space-y-4 flex-1 text-left">
                  {['Unlimited messaging', 'Full AI Concierge access', 'Priority funding projects', 'Impact analytics'].map((f, i) => (
                    <li key={i} className="flex items-center text-sm text-secondary dark:text-gray-300">
                      <span className="material-symbols-outlined text-primary mr-3 text-xl">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleBecomeMember}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-secondary hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  Become a Member
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Only show when user is NOT signed in */}
      {!user && (
        <section className="py-16 bg-background-light dark:bg-background-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-secondary dark:text-white mb-6">Ready to join the revolution?</h2>
            <p className="text-lg text-text-secondary-light dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Start exchanging resources and building a sustainable future today. The circular economy is waiting for you.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-secondary shadow-lg hover:bg-primary-dark transition-all"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Membership Application Modal */}
      <MembershipApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
      />
    </div>
  );
};