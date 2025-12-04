import React from 'react';
import MathRenderer from './MathRenderer';

interface MarkdownMathProps {
  text: string;
}

// Minimal Markdown renderer tailored for chat answers:
// - Headings: #### Title, ### Title
// - Bold: **text**
// - Unordered lists: - item
// - Ordered lists: 1. item
// - Paragraphs: plain lines
// Math inside any line rendered via MathRenderer, supports $...$, $$...$$, \(\), \[\]

// Helper component to render text with bold formatting **text** AND math via MathRenderer
const TextWithBoldAndMath: React.FC<{ text: string }> = ({ text }) => {
  // First split by bold markers
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={`bold-${i}`}>
              <MathRenderer text={boldText} />
            </strong>
          );
        }
        return <MathRenderer key={`text-${i}`} text={part} />;
      })}
    </>
  );
};

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

    // Support both #### and ### headers
    const h4 = line.match(/^####\s+(.+)/);
    if (h4) {
      flushList();
      blocks.push(
        <h4 key={`h4-${idx}`} style={{ marginTop: blocks.length ? 8 : 0, marginBottom: 4, fontSize: '1em', fontWeight: 600 }}>
          <TextWithBoldAndMath text={h4[1]} />
        </h4>
      );
      return;
    }

    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      flushList();
      blocks.push(
        <h3 key={`h3-${idx}`} style={{ marginTop: blocks.length ? 8 : 0 }}>
          <TextWithBoldAndMath text={h3[1]} />
        </h3>
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
          <TextWithBoldAndMath text={ol[2]} />
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
          <TextWithBoldAndMath text={ul[1]} />
        </li>
      );
      return;
    }

    // Paragraph
    flushList();
    blocks.push(
      <p key={`p-${idx}`} style={{ margin: '0 0 12px' }}>
        <TextWithBoldAndMath text={line} />
      </p>
    );
  });

  flushList();
  return <>{blocks}</>;
};

export default MarkdownMath;
