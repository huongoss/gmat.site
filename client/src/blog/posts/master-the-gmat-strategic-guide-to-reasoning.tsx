import React from 'react';
import { BlogPost } from '../../types/blog';

// Local helpers for consistent spacing/typography
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
  slug: 'master-the-gmat-strategic-guide-to-reasoning',
  title: 'Master the GMAT: A Strategic Guide to "Reasoning" Questions',
  date: '2025-10-27',
  readingMinutes: 10,
  excerpt:
    'A practical playbook for Verbal Reasoning and Data Insights: how to analyze passages, arguments, and data to make executive decisions under time.',
  tags: ['reasoning', 'verbal', 'data-insights', 'strategy'],
  render: () => (
    <article>
      <header>
        <h1 style={{ fontSize: '2.1rem', margin: '0 0 0.5rem' }}>
          Master the GMAT: A Strategic Guide to "Reasoning" Questions
        </h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Published 2025-10-27 · ~10 min read · Tags: reasoning, verbal, data‑insights
        </div>
        <hr style={{ margin: '1rem 0' }} />
      </header>

      <P>
        When you hear <em>reasoning</em> on the GMAT, you’re looking at two core sections of the
        GMAT Focus Edition: Verbal Reasoning and Data Insights. Both measure executive reasoning—your
        ability to analyze information, evaluate arguments, and make sound decisions under time.
      </P>
      <P>Let’s break down the strategies that win both sections.</P>

      <H2>🧠 Part 1: Conquering Verbal Reasoning</H2>
      <P>
        45 minutes · 23 questions · Tested skills: reading comprehension, argument analysis, inference,
        and evaluation. Two question types dominate: Reading Comprehension (RC) and Critical Reasoning (CR).
      </P>

      <H3>Strategy for Reading Comprehension (RC)</H3>
      <UL>
        <li>
          <strong>Read for Structure, not Facts:</strong> Build a mental map. For each paragraph ask: does it
          introduce a problem, provide evidence, or counter an argument?
        </li>
        <li>
          <strong>Lock the Main Idea + Tone:</strong> Before viewing choices, summarize the author’s primary goal and tone in
          your own words.
        </li>
        <li>
          <strong>Prove from the Passage:</strong> Detail questions are paraphrased in the text. Don’t rely on memory—find the lines.
        </li>
        <li>
          <strong>Eliminate Extremes:</strong> Be suspicious of “always/never/only/impossible.” RC passages are usually nuanced.
        </li>
      </UL>

      <H3>Strategy for Critical Reasoning (CR)</H3>
      <OL>
        <li>
          <strong>Identify the Question First:</strong> Strengthen? Weaken? Assumption? Resolve the paradox? This sets your lens.
        </li>
        <li>
          <strong>Deconstruct the Argument:</strong> Mark the <em>conclusion</em>, list the <em>premises</em>, and note the unstated
          <em> assumption</em> that connects them.
        </li>
        <li>
          <strong>Attack the Assumption:</strong> To strengthen, confirm it. To weaken, break it or introduce an alternative cause.
        </li>
        <li>
          <strong>Stay in Scope:</strong> Correct answers tie tightly to the prompt’s topic—avoid too broad, too narrow, or irrelevant options.
        </li>
      </OL>

      <H2>📊 Part 2: Dominating Data Insights</H2>
      <P>
        45 minutes · 20 questions. The evolution of Integrated Reasoning + Quant. You’ll analyze data from
        text, graphs, and tables to make decisions.
      </P>

      <H3>Multi‑Source Reasoning (MSR)</H3>
      <P>
        Tabs of information (emails, charts, text) to synthesize.
        <strong> Strategy:</strong> Read the question first, then <em>hunt</em> for targeted data across tabs. Assemble clues like a logic puzzle.
      </P>

      <H3>Table Analysis</H3>
      <P>
        Large, sortable spreadsheets.
        <strong> Strategy:</strong> Extract the exact criteria; sort/filter aggressively. Minimize arithmetic by isolating relevant rows.
      </P>

      <H3>Graphics Interpretation</H3>
      <P>
        Single chart (bar/line/scatter, etc.).
        <strong> Strategy:</strong> Read axes and units first. Distinguish percentages vs absolute numbers; don’t infer shape without values.
      </P>

      <H3>Two‑Part Analysis (TPA)</H3>
      <P>
        Choose two answers—often interdependent.
        <strong> Strategy:</strong> Break into two smaller questions. If linked, solve simultaneously (e.g., a system of equations).
      </P>

      <H3>Data Sufficiency (DS)</H3>
      <P>
        Determine if statements provide a <em>single, definitive</em> answer—you often don’t compute the answer itself.
      </P>
      <OL>
        <li><strong>Analyze (1) Alone:</strong> Is it sufficient by itself?</li>
        <li><strong>Analyze (2) Alone:</strong> Forget (1). Is (2) sufficient by itself?</li>
        <li><strong>Together:</strong> If neither alone, combine. Do they yield one unambiguous answer?</li>
      </OL>
      <P>
        <strong>Trap to avoid:</strong> “Sufficient” doesn’t mean the answer is “yes”—only that it is uniquely determined.
      </P>

      <H2>🔑 Your Overall GMAT Reasoning Game Plan</H2>
      <UL>
        <li>
          <strong>Pacing is Everything:</strong> ~2 minutes per question. If stuck, guess intelligently and move on—protect downstream time.
        </li>
        <li>
          <strong>Process of Elimination Wins:</strong> It’s often faster to eliminate four wrong answers than find the one right one.
        </li>
        <li>
          <strong>Practice with a Timer:</strong> Simulate real timing to build stamina and an internal clock; debrief misses for pattern learning.
        </li>
      </UL>

      <footer style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#777' }}>
        Want targeted help on your weak spots? Try a timed mixed set in Daily Practice, then use “Ask GMAT”
        on any miss to see expert reasoning patterns.
      </footer>
    </article>
  )
};

export default post;
