import React from 'react';

export default function Disclaimer() {
  return (
    <div className="content-narrow section-base">
      <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: 'var(--space-5)' }}>Disclaimer</h1>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Trademarks & Affiliation</h2>
        <p>GMAT® is a registered trademark of the Graduate Management Admission Council (GMAC). GMAC does not endorse, nor is it affiliated with, GMAT.site. Any reference to the GMAT exam is for descriptive, preparatory purposes only.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Original Content</h2>
        <p>All practice questions, explanations, and performance analytics on this platform are original creations (or curated derivatives refined for quality). We do not reproduce proprietary official test questions. Similarity to official exam structure reflects intentional alignment with general test skills, not reuse.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>No Performance Guarantee</h2>
        <p>Your results depend on multiple factors including baseline ability, study discipline, review quality, and time investment. We make no promises of admission outcomes, score ranges, or comparative ranking improvements.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Intellectual Property & Reporting</h2>
        <p>If you believe any material here infringes legal or ethical boundaries (e.g., resembles a protected item), notify us via the Contact page with as much detail as possible so we can review and remediate promptly.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Appropriate Use</h2>
        <p>You agree not to scrape, bulk export, resell, or systematically replicate the content. Automated harvesting degrades platform integrity and may result in access revocation.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Data & Privacy</h2>
        <p>We capture essential interaction data (e.g., question attempts, correctness, timestamps) to improve personalization and question quality. We do not sell user data. Future policy docs will formalize retention windows and full deletion tooling.</p>
      </section>
      <section style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 var(--space-2)' }}>Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, the service is provided "as is." We are not liable for indirect, incidental, or consequential losses arising from usage or temporary unavailability.</p>
      </section>
      <p style={{ opacity: 0.7, fontSize: '.85rem' }}>This disclaimer may evolve as the product matures. Continued use implies acceptance of the latest version.</p>
    </div>
  );
}
