import React from 'react';

export default function About() {
  return (
    <div className="content-narrow section-base">
      <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: 'var(--space-5)' }}>About GMAT.site</h1>
      <p style={{ fontSize: '1.05rem', lineHeight: 1.55 }}>GMAT.site helps candidates build a high–leverage daily practice habit. We focus on consistency, calibrated difficulty, and tight feedback loops so every 10–15 minute session compounds into meaningful score improvement.</p>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Our Mission</h2>
        <p>Make high–quality GMAT preparation efficient, focused, and accessible to motivated learners globally—without overwhelming them with noise, distractions, or paywalls before value is delivered.</p>
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>What Makes Our Approach Different</h2>
        <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.5, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <li><strong>Daily Micro-Sets:</strong> Short, repeatable practice blocks reduce friction and strengthen recall.</li>
          <li><strong>Adaptive Progression (coming soon):</strong> Difficulty will shift toward your growth edge—neither too easy nor demoralizing.</li>
          <li><strong>Answer Quality Focus:</strong> We prioritize clarity of problem construction and future explanation depth over content volume.</li>
          <li><strong>Learning Velocity Signals:</strong> Tracking improvement patterns matters more than raw cumulative totals.</li>
          <li><strong>Retention-Oriented:</strong> Spaced resurfacing of weak skill areas to increase long-term recall durability.</li>
        </ul>
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Learning Principles We Use</h2>
        <p>Our roadmap is grounded in established cognitive science:</p>
        <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.5, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <li><strong>Spaced Repetition:</strong> Revisit skills just before they fade to strengthen retention.</li>
          <li><strong>Desirable Difficulty:</strong> Mild struggle improves encoding versus cruising through known patterns.</li>
          <li><strong>Error-Driven Refinement:</strong> We’ll increasingly surface patterns in your mistakes to guide targeted review.</li>
          <li><strong>Contextual Variation:</strong> Mixing question types prevents false pattern recognition and promotes transfer.</li>
        </ul>
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Product Roadmap (High-Level)</h2>
        <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.5, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <li><strong>Short Term:</strong> Answer explanations expansion • Skill tagging • Improved analytics.</li>
          <li><strong>Mid Term:</strong> Difficulty calibration models • Personalized review queues • Timing diagnostics.</li>
          <li><strong>Long Term:</strong> Scenario-based verbal drills • Adaptive full-length simulations • Benchmark progress projections.</li>
        </ul>
        <p style={{ opacity: 0.85, marginTop: 'var(--space-3)' }}>Roadmap subject to change as we learn from real usage.</p>
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>Data & Privacy</h2>
        <p>We collect only the minimum required to operate the platform and improve question quality (e.g., answer choices, timing intent later, aggregated performance trends). We do not sell user data. You can request deletion at any time.</p>
      </section>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>How to Contribute Feedback</h2>
        <p>If you notice ambiguity, awkward phrasing, or unrealistic question framing—tell us. Precision matters. Use the Contact page; we triage reports weekly and prioritize high-impact improvements.</p>
      </section>

      <p style={{ marginTop: 'var(--space-6)', opacity: 0.75 }}>We’re just getting started—thanks for being part of the early build phase.</p>
    </div>
  );
}
