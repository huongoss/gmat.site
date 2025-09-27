import React from 'react';

interface FAQItem { q: string; a: string; category: string }

const faqs: FAQItem[] = [
  // General
  { category: 'General', q: 'What is GMAT.site?', a: 'A practice platform focused on deliberate, consistent daily improvement using original GMAT-style questions.' },
  { category: 'General', q: 'Is this affiliated with GMAC?', a: 'No. GMAT is a registered trademark of GMAC. We are independent and provide original prep content.' },
  { category: 'General', q: 'Does using this guarantee a higher score?', a: 'No guarantees—improvement depends on consistent practice quality, review discipline, and conceptual clarity.' },

  // Practice
  { category: 'Practice', q: 'How are questions selected for daily sets?', a: 'Currently a curated rotation; adaptive difficulty and weak-skill resurfacing are planned.' },
  { category: 'Practice', q: 'Are explanations included?', a: 'Some are in progress. Expansion prioritizes the most frequently missed or conceptually subtle items.' },
  { category: 'Practice', q: 'Will I see repeated questions?', a: 'Eventually spaced resurfacing will be intentional; right now repeats are minimal except for testing improvements.' },
  { category: 'Practice', q: 'Can I flag a bad question?', a: 'Yes—use the Contact form and mention the question ID. We review flags weekly.' },

  // Accounts & Plans
  { category: 'Accounts & Plans', q: 'What does the free plan include?', a: 'A capped daily micro-set and basic progress tracking.' },
  { category: 'Accounts & Plans', q: 'Why upgrade?', a: 'Unlock larger sets, deeper analytics, upcoming adaptive review, and early feature access.' },
  { category: 'Accounts & Plans', q: 'Do you offer refunds?', a: 'If something is broken or materially misrepresented, reach out—reasonable refund requests are reviewed case-by-case.' },
  { category: 'Accounts & Plans', q: 'Can I pause my subscription?', a: 'Planned—billing portal pause controls are on the roadmap.' },

  // Technical
  { category: 'Technical', q: 'Do you track my personal browsing behavior?', a: 'Only essential interactions (e.g., answer selections, success states). We avoid invasive tracking.' },
  { category: 'Technical', q: 'Can I delete my data?', a: 'Yes—contact support. Full self-service deletion is planned.' },
  { category: 'Technical', q: 'Do you use AI to generate questions?', a: 'Some drafting assistance may be used; each question is curated or refined for alignment and clarity.' },
  { category: 'Technical', q: 'Do you store payment details?', a: 'Payments are processed via Stripe. We never store raw card data.' },
];

const categories = Array.from(new Set(faqs.map(f => f.category)));

export default function FAQ() {
  return (
    <div className="content-narrow section-base">
      <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: 'var(--space-6)' }}>FAQ</h1>
      {categories.map(cat => (
        <section key={cat} style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 var(--space-3)' }}>{cat}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {faqs.filter(f => f.category === cat).map(f => (
              <div key={f.q} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 var(--space-2)' }}>{f.q}</h3>
                <p style={{ margin: 0, lineHeight: 1.5 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p style={{ opacity: 0.65, fontSize: '.85rem' }}>Have a question not listed? Use the Contact page—your feedback shapes our roadmap.</p>
    </div>
  );
}
