'use client';

import { useState } from 'react';
import type { GreentextStyle } from '@/lib/prompt';

interface InputFormProps {
  onGenerate: (url: string, style: GreentextStyle, maxChars: number) => void;
  isLoading: boolean;
}

// Top 10 most popular Wikipedia people (examples)
const EXAMPLE_PEOPLE = [
  { name: 'Donald Trump', url: 'https://en.wikipedia.org/wiki/Donald_Trump' },
  { name: 'Joe Biden', url: 'https://en.wikipedia.org/wiki/Joe_Biden' },
  { name: 'Elon Musk', url: 'https://en.wikipedia.org/wiki/Elon_Musk' },
  { name: 'Taylor Swift', url: 'https://en.wikipedia.org/wiki/Taylor_Swift' },
  { name: 'Albert Einstein', url: 'https://en.wikipedia.org/wiki/Albert_Einstein' },
  { name: 'Barack Obama', url: 'https://en.wikipedia.org/wiki/Barack_Obama' },
  { name: 'Adolf Hitler', url: 'https://en.wikipedia.org/wiki/Adolf_Hitler' },
  { name: 'Jesus', url: 'https://en.wikipedia.org/wiki/Jesus' },
  { name: 'Michael Jackson', url: 'https://en.wikipedia.org/wiki/Michael_Jackson' },
  { name: 'Leonardo da Vinci', url: 'https://en.wikipedia.org/wiki/Leonardo_da_Vinci' },
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
