import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { trackEvent } from '../utils/analytics';

const bgUrl = 'https://images.unsplash.com/photo-1596496056700-5c4f7a4b93f4?auto=format&fit=crop&w=1600&q=80';

const Home: React.FC = () => {
  return (
    <div className="home">
      {/* Hero Section */}
  <section className="hero section-base" aria-labelledby="hero-heading">
        <div className="hero-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden="true" />
        <div className="hero-inner">
          <h1 id="hero-heading" className="hero-title">Smarter GMAT Prep Powered by Learning Science</h1>
          <p className="hero-sub">
            “Research in learning science shows that consistent daily practice leads to measurable improvements in test performance. Our platform applies this principle to help you prepare effectively.”
          </p>
          <div className="hero-actions">
            <Link
              to="/test"
              className="btn-accent"
              onClick={() => trackEvent('cta_click', { location: 'home_hero', cta: 'start_free_questions' })}
            >Start Free Questions</Link>
            <Link
              to="/register"
              className="btn-outline"
              onClick={() => trackEvent('cta_click', { location: 'home_hero', cta: 'register_now' })}
            >Create Account</Link>
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="credibility section-base" aria-labelledby="credibility-heading">
        <div className="credibility-inner">
          <h2 id="credibility-heading">Based on Peer-Reviewed Research</h2>
          <p className="mt-0">Our approach applies findings from learning science to help you study effectively.</p>
          <div className="citation-links" role="list" aria-label="Research sources">
            <a href="https://www.nature.com/articles/s44159-022-00089-1" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('outbound_citation', { source: 'home_research', ref: 'nature_2022' })}>Nature (2022)</a>
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10229024/" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('outbound_citation', { source: 'home_research', ref: 'pmc_2023' })}>PMC (2023)</a>
          </div>
          <p style={{ fontSize: '.75rem', color: 'var(--color-text-subtle)' }}>Not affiliated with GMAC. GMAT is a registered trademark of GMAC.</p>
        </div>
      </section>

      {/* How It Works */}
  <section className="how section-base" aria-labelledby="how-heading">
        <div className="how-inner">
          <h2 id="how-heading" className="how-title">How It Works</h2>
          <div className="how-grid">
            <div className="how-card" aria-label="Practice Daily step">
              <h3>1. Practice Daily</h3>
              <p>Solve a few questions each day designed to reinforce memory and build consistency.</p>
            </div>
            <div className="how-card" aria-label="Track Progress step">
              <h3>2. Track Progress</h3>
              <p>Monitor improvements with simple, motivating feedback.</p>
            </div>
            <div className="how-card" aria-label="Master the GMAT step">
              <h3>3. Master the GMAT</h3>
              <p>Consistency compounds into confidence and higher scores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Section */}
  <section className="science section-base" aria-labelledby="science-heading">
        <div className="science-inner">
          <h2 id="science-heading">Science-Backed Learning</h2>
          <p>Daily retrieval practice and spaced learning help boost long-term retention. GMAT.site is designed to reinforce knowledge efficiently, so you learn smarter, not harder.</p>
          <Link
            to="/daily"
            className="btn-accent"
            onClick={() => trackEvent('cta_click', { location: 'home_science', cta: 'start_daily' })}
          >Start Daily Practice</Link>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="pricing-teaser section-base" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading">Simple Pricing</h2>
        <p>Only $10/month — cancel anytime. Start with a free trial and see your improvement.</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link
            to="/pricing"
            className="btn-accent"
            onClick={() => trackEvent('cta_click', { location: 'home_pricing', cta: 'view_pricing' })}
          >View Pricing</Link>
          <Link
            to="/test"
            className="btn-outline"
            onClick={() => trackEvent('cta_click', { location: 'home_pricing', cta: 'start_trial_secondary' })}
          >Try 10 Free Questions</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;