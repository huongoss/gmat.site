import React from 'react';
import { BlogPost } from '../../types/blog';

// Local helper components for consistent spacing/typography
const P: React.FC<React.PropsWithChildren> = ({ children }) => (
  <p style={{ margin: '0 0 1rem', lineHeight: 1.6 }}>{children}</p>
);
const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 style={{ margin: '2rem 0 0.75rem', fontSize: '1.45rem' }}>{children}</h2>
);
const H3: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h3 style={{ margin: '1.25rem 0 0.5rem', fontSize: '1.15rem' }}>{children}</h3>
);
const UL: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1rem' }}>{children}</ul>
);
const OL: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ol style={{ paddingLeft: '1.2rem', margin: '0 0 1rem' }}>{children}</ol>
);

const post: BlogPost = {
  slug: 'deep-dive-gmat-verbal-reasoning',
  title: 'A Deep Dive into GMAT Verbal Reasoning: How to Master CR & RC',
  date: '2025-10-27',
  readingMinutes: 12,
  excerpt:
    'Executive‑level thinking, not vocabulary: a systematic process for mastering Critical Reasoning and Reading Comprehension on GMAT Verbal.',
  tags: ['verbal', 'critical-reasoning', 'reading-comprehension', 'strategy'],
  render: () => (
    <article>
      <header>
        <h1 style={{ fontSize: '2.1rem', margin: '0 0 0.5rem' }}>
          A Deep Dive into GMAT Verbal Reasoning: How to Master CR & RC
        </h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Published 2025-10-27 · ~12 min read · Tags: verbal, CR, RC
        </div>
        <hr style={{ margin: '1rem 0' }} />
      </header>

      <P>
        GMAT Verbal Reasoning is less about vocabulary and more about executive‑level thinking. In 45 minutes,
        you’ll face 23 questions designed to measure how well you analyze and evaluate arguments and written material.
      </P>
      <P>
        The section has two related types:
      </P>
      <UL>
        <li><strong>Critical Reasoning (CR):</strong> Analyzing short, dense logical arguments.</li>
        <li><strong>Reading Comprehension (RC):</strong> Analyzing longer passages for structure, main idea, and details.</li>
      </UL>
      <P>
        You don’t need to be a speed reader or philosopher—you need a <em>systematic process</em>. Let’s break it down.
      </P>

      <H2>🧠 Part 1: How to Conquer Critical Reasoning (CR)</H2>
      <P>
        CR questions present a stimulus (argument) and a mission (question stem). Your job: dissect the logic.
      </P>

      <H3>The 3‑Step Master Process for Every CR Question</H3>
      <H3>Step 1: Read the Question Stem FIRST</H3>
      <P>
        Before the argument, read the stem to set your mission. Are you trying to:
      </P>
      <UL>
        <li>Strengthen it?</li>
        <li>Weaken it?</li>
        <li>Find the Assumption?</li>
        <li>Resolve a Paradox?</li>
        <li>Evaluate the conclusion?</li>
      </UL>
      <P>Knowing your mission focuses attention and reduces re‑reads.</P>

      <H3>Step 2: Deconstruct the Argument</H3>
      <P>Read the stimulus to locate core components:</P>
      <UL>
        <li>
          <strong>Find the Conclusion:</strong> The author’s main claim or recommendation. Look for cues like “therefore,” “thus,” “so.”
        </li>
        <li>
          <strong>Find the Premise(s):</strong> Evidence or data supporting the conclusion. Cues: “because,” “since,” “as,” “for example.”
        </li>
        <li>
          <strong>Identify the GAP (Assumption):</strong> The unstated bridge connecting premises to conclusion—the argument’s weak link.
        </li>
      </UL>
      <P>
        <em>Example:</em> “Our company’s sales increased by 20% last year (Premise). Therefore, our new marketing campaign was a success (Conclusion).”
      </P>
      <P>
        <em>Assumption (GAP):</em> The campaign primarily caused the increase. But what if a competitor exited or the market grew 30%?
      </P>

      <H3>Step 3: Predict and Eliminate</H3>
      <P>
        Once you spot the GAP, you can usually predict what the correct answer must do:
      </P>
      <UL>
        <li><strong>Weaken:</strong> Attack the gap (e.g., “The entire market grew by 30%”).</li>
        <li><strong>Strengthen:</strong> Confirm the gap (e.g., “Peers saw ≤ 5% growth; nothing else changed”).</li>
      </UL>
      <P>Use ruthless Process of Elimination:</P>
      <UL>
        <li><strong>Out of Scope:</strong> Different topic or irrelevant info.</li>
        <li><strong>Opposite:</strong> Does the reverse of your mission.</li>
        <li><strong>Too Extreme:</strong> “All/never/only/impossible.” GMAT arguments are rarely absolute.</li>
        <li><strong>Correlation ≠ Causation:</strong> Many traps lean on timing, not causality.</li>
      </UL>

      <H3>Pro‑Tip: The Negation Technique for Assumption Questions</H3>
      <OL>
        <li>Pick a candidate assumption answer.</li>
        <li>Logically negate it (“All dogs are friendly” → “Not all dogs are friendly”).</li>
        <li>If the negation destroys the argument, you’ve found the assumption.</li>
      </OL>

      <H2>📚 Part 2: How to Dominate Reading Comprehension (RC)</H2>
      <P>
        RC passages can be dense or dull. The test cares about your analysis of structure and evidence, not your interest in the topic.
      </P>

      <H3>Strategy 1: The “Mental Map” Read‑Through</H3>
      <P>
        First pass ≠ memorize details. Build a map. For each paragraph, ask:
      </P>
      <UL>
        <li>What’s the paragraph’s main point? (5–10 words)</li>
        <li>What function does it serve? (new idea, example, refutation, background, etc.)</li>
        <li>What’s the author’s tone? (neutral, supportive, critical, mixed)</li>
      </UL>
      <P>
        After the passage, pause 5 seconds and summarize the <strong>Primary Purpose</strong> (e.g., “Describe a problem and critique two solutions”).
      </P>

      <H3>Strategy 2: Attacking RC Questions</H3>
      <H3>Global Questions (Main Idea / Primary Purpose)</H3>
      <UL>
        <li>Use your Primary Purpose summary to select the answer.</li>
        <li>Eliminate answers that are too specific (one paragraph) or too broad (go beyond the passage).</li>
      </UL>

      <H3>Detail Questions (“According to the passage…”) </H3>
      <UL>
        <li>They are lookup questions. The correct answer is stated or paraphrased in the text.</li>
        <li>Use your map to jump to the right paragraph; find the exact sentence before answering.</li>
      </UL>

      <H3>Inference Questions (“It can be inferred…”) </H3>
      <UL>
        <li>On GMAT, an inference is a <em>small</em> logical step from what’s stated.</li>
        <li>Correct answer must be true based only on passage information.</li>
        <li>Trap: outside knowledge or leaps that go beyond the text.</li>
      </UL>

      <H3>Logical Structure Questions (“The author mentions X in order to…”) </H3>
      <UL>
        <li>Ask: Why is this example/quote placed here?</li>
        <li>Relate its function to the paragraph’s main point and the passage’s purpose.</li>
      </UL>

      <H2>Final Takeaways</H2>
      <UL>
        <li><strong>Process Over Speed:</strong> A consistent process beats raw speed for accuracy and stamina.</li>
        <li><strong>Eliminate, Don’t Pick:</strong> It’s often faster to find four wrong answers than the one right one.</li>
        <li><strong>Manage Your Time:</strong> ~2 minutes per question. If lost, make a best‑educated guess and move on to protect the set.</li>
      </UL>

      <footer style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#777' }}>
        Ready to pressure‑test your process? Try a timed RC/CR mixed set in Daily Practice, then use “Ask GMAT”
        on any miss to see expert reasoning patterns.
      </footer>
    </article>
  )
};

export default post;
