'use client';

import { useState } from 'react';

interface GreentextDisplayProps {
  greentext: string;
  error: string | null;
  isStreaming?: boolean;
}

export default function GreentextDisplay({ greentext, error, isStreaming = false }: GreentextDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(greentext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (error) {
    return (
      <div className="greentext-container error">
        <div className="greentext-content">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!greentext) {
    return null;
  }

  const charCount = greentext.length;

  return (
    <div className="greentext-container">
      <div className="greentext-header">
        <h2 className="section-title">
          Generated Greentext
          {isStreaming && <span className="streaming-indicator"> (generating...)</span>}
        </h2>
        <div className="greentext-meta">
          <span className="char-count">{charCount} characters</span>
          <button 
            onClick={handleCopy} 
            className="copy-btn"
            title="Copy to clipboard"
            disabled={isStreaming}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="greentext-content">
        <pre>{greentext}</pre>
        {isStreaming && <span className="cursor-blink">▋</span>}
      </div>
    </div>
  );
}
