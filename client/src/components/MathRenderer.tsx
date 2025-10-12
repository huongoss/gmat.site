import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with inline LaTeX math expressions.
 * Parses text containing $...$ delimited math expressions and renders them using KaTeX.
 * 
 * Example: "What is $x^2 - y^2$?" becomes "What is " + rendered math + "?"
 */
const isLikelyMath = (expr: string): boolean => {
  const trimmed = expr.trim();
  if (!trimmed) return false;

  // Fast paths that indicate plain text (e.g., currency or words)
  if (/^[0-9.,]+$/.test(trimmed)) return false; // pure numbers/decimals
  if (/^[0-9.,]+\s+(million|thousand|percent|percentages?|dollars?|hours?|minutes?)$/i.test(trimmed)) return false;
  if (/[a-z]{2,}/i.test(trimmed) && !/[=+\-^_*\\><]/.test(trimmed)) return false; // words without math symbols

  // Indicators that it's likely LaTeX/math content
  if (/[=+\-^_*\\><]/.test(trimmed)) return true;
  if (/(\\frac|\\sqrt|\\left|\\right|\\pi|\\theta|\\sum|\\int|\\lim|\\log|\\sin|\\cos|\\tan|\\mathrm|\\text)/.test(trimmed)) return true;
  if (/^[a-zA-Z]$/.test(trimmed)) return true; // single variable like x
  if (/^[a-zA-Z]\d+$/.test(trimmed)) return true; // variable with subscript number (e.g., a1)
  if (/^\d+\/[0-9]+$/.test(trimmed)) return true; // simple fraction like 1/2

  return false;
};

const MathRenderer: React.FC<MathRendererProps> = ({ text, className }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear the container
    containerRef.current.innerHTML = '';

    // Split the text by $ delimiters to separate text and math expressions
    const parts = text.split(/(\$[^$]+\$)/);

    parts.forEach((part) => {
      // Check if this part is a math expression (starts and ends with $)
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        // Remove the $ delimiters and render as math
        const mathExpression = part.slice(1, -1);
        if (isLikelyMath(mathExpression)) {
          const span = document.createElement('span');
          try {
            katex.render(mathExpression, span, {
              throwOnError: false,
              displayMode: false,
            });
          } catch (error) {
            // If KaTeX fails to render, fall back to displaying the original text
            console.warn('Failed to render math expression:', mathExpression, error);
            span.textContent = `$${mathExpression}$`;
          }
          containerRef.current?.appendChild(span);
        } else {
          const textNode = document.createTextNode(`$${mathExpression}$`);
          containerRef.current?.appendChild(textNode);
        }
      } else if (part) {
        // Regular text
        const textNode = document.createTextNode(part);
        containerRef.current?.appendChild(textNode);
      }
    });
  }, [text]);

  return <span ref={containerRef} className={className} />;
};

export default MathRenderer;