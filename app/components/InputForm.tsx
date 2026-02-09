'use client';

import { useState } from 'react';
import type { GreentextStyle } from '@/lib/prompt';

interface InputFormProps {
  onGenerate: (url: string, style: GreentextStyle, maxChars: number) => void;
  isLoading: boolean;
}

// Top 10 most popular Wikipedia people (examples)
const EXAMPLE_PEOPLE = [
  { name: 'Elon Musk', url: 'https://en.wikipedia.org/wiki/Elon_Musk' },
  { name: 'Dario Amodei', url: 'https://en.wikipedia.org/wiki/Dario_Amodei' },
  { name: 'Marc Andreessen', url: 'https://en.wikipedia.org/wiki/Marc_Andreessen' },
  { name: 'Paul Graham', url: 'https://en.wikipedia.org/wiki/Paul_Graham_(programmer)' },
  { name: 'Sam Altman', url: 'https://en.wikipedia.org/wiki/Sam_Altman' },
    { name: 'Niccolò Machiavelli', url: 'https://en.wikipedia.org/wiki/Niccol%C3%B2_Machiavelli' },
    { name: 'Mark Zuckerberg', url: 'https://en.wikipedia.org/wiki/Mark_Zuckerberg' },
    { name: 'Bill Gates', url: 'https://en.wikipedia.org/wiki/Bill_Gates' }
];

export default function InputForm({ onGenerate, isLoading }: InputFormProps) {
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState<GreentextStyle>('normal');
  const [lengthMode, setLengthMode] = useState<'preset' | 'custom'>('preset');
  const [maxChars, setMaxChars] = useState(1500);
  const [customMaxChars, setCustomMaxChars] = useState(1500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Client-side validation
    try {
      const u = new URL(url);
      if (!u.hostname.endsWith('wikipedia.org')) {
        alert('Please enter a valid Wikipedia URL');
        return;
      }
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const finalMaxChars = lengthMode === 'custom' ? customMaxChars : maxChars;
    onGenerate(url, style, finalMaxChars);
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
  };

  return (
    <div className="archive-form">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="archive-input"
            placeholder="Enter a Wikipedia URL (e.g., https://en.wikipedia.org/wiki/Person_Name)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="archive-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate!'}
          </button>
        </div>
      </form>

      <div className="options-group">
        <div className="option-section">
          <label>Style:</label>
          <label className="radio-label">
            <input
              type="radio"
              name="style"
              value="normal"
              checked={style === 'normal'}
              onChange={(e) => setStyle(e.target.value as GreentextStyle)}
              disabled={isLoading}
            />
            Normal
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="style"
              value="long"
              checked={style === 'long'}
              onChange={(e) => setStyle(e.target.value as GreentextStyle)}
              disabled={isLoading}
            />
            Long
          </label>
        </div>

        <div className="option-section">
          <label>Length:</label>
          <label className="radio-label">
            <input
              type="radio"
              name="lengthMode"
              value="preset"
              checked={lengthMode === 'preset'}
              onChange={(e) => setLengthMode('preset')}
              disabled={isLoading}
            />
            Preset (1500 chars)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="lengthMode"
              value="custom"
              checked={lengthMode === 'custom'}
              onChange={(e) => setLengthMode('custom')}
              disabled={isLoading}
            />
            Custom
          </label>
        </div>

        {lengthMode === 'custom' && (
          <div className="option-section">
            <label htmlFor="customMaxChars">Custom characters:</label>
            <input
              id="customMaxChars"
              type="number"
              min="64"
              max="2000"
              value={customMaxChars}
              onChange={(e) => setCustomMaxChars(parseInt(e.target.value) || 500)}
              disabled={isLoading}
              className="max-chars-input"
            />
          </div>
        )}
      </div>

      <div className="examples-section">
        <h3 className="section-title">Quick Examples:</h3>
        <div className="thread-list">
          {EXAMPLE_PEOPLE.map((person) => (
            <button
              key={person.url}
              onClick={() => handleExampleClick(person.url)}
              className="example-link"
              disabled={isLoading}
            >
              {person.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
