import React from 'react';
import MathRenderer from './MathRenderer';

interface MarkdownMathProps {
  text: string;
}

// Minimal Markdown renderer tailored for chat answers:
// - Headings: ### Title
// - Unordered lists: - item
// - Ordered lists: 1. item
// - Paragraphs: plain lines
// Math inside any line rendered via MathRenderer, supports $...$, $$...$$, \(\), \[\]
const MarkdownMath: React.FC<MarkdownMathProps> = ({ text }) => {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const ListTag = listType === 'ul' ? 'ul' : 'ol';
    blocks.push(
      <ListTag key={`list-${blocks.length}`} style={{ margin: '0 0 12px 18px', padding: 0 }}>
        {listItems}
      </ListTag>
    );
    listType = null;
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      // Paragraph break
      flushList();
      return;
    }

    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      flushList();
      blocks.push(
        <h3 key={`h3-${idx}`} style={{ marginTop: blocks.length ? 8 : 0 }}>{h3[1]}</h3>
      );
      return;
    }

    const ol = line.match(/^(\d+)\.\s+(.+)/);
    if (ol) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(
        <li key={`li-${idx}`} style={{ marginLeft: 18 }}>
          <MathRenderer text={ol[2]} />
        </li>
      );
      return;
    }

    const ul = line.match(/^[-•]\s+(.+)/);
    if (ul) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(
        <li key={`li-${idx}`} style={{ marginLeft: 18 }}>
          <MathRenderer text={ul[1]} />
        </li>
      );
      return;
    }

    // Paragraph
    flushList();
    blocks.push(
      <p key={`p-${idx}`} style={{ margin: '0 0 12px' }}>
        <MathRenderer text={line} />
      </p>
    );
  });

  flushList();
  return <>{blocks}</>;
};

export default MarkdownMath;
