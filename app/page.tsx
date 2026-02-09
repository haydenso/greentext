'use client';

import { useState } from 'react';
import InputForm from './components/InputForm';
import GreentextDisplay from './components/GreentextDisplay';
import type { GreentextStyle } from '@/lib/prompt';

export default function Home() {
  const [greentext, setGreentext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleGenerate = async (url: string, style: GreentextStyle, maxChars: number) => {
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setGreentext('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, style, maxChars }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to generate greentext');
        setIsLoading(false);
        return;
      }

      // Check if response is streaming (Server-Sent Events)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        setIsStreaming(true);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          setError('Streaming not supported');
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            setIsStreaming(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || line.trim() === 'data: [DONE]') {
              continue;
            }

            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                const data = JSON.parse(jsonStr);
                
                if (data.content) {
                  setGreentext((prev) => prev + data.content);
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await response.json();
        if (data.success) {
          setGreentext(data.greentext);
        } else {
          setError(data.error || 'Failed to generate greentext');
        }
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <>
      <div className="header">
        <div className="logo-container">
          <div className="logo-box">
            <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 30 L50 15 L90 30 L90 70 L50 75 L10 70 Z" fill="#d4a574" stroke="#8b4513" strokeWidth="1.5"/>
              <path d="M10 30 L50 45 L90 30" fill="none" stroke="#8b4513" strokeWidth="1.5"/>
              <path d="M50 45 L50 75" fill="none" stroke="#8b4513" strokeWidth="1"/>
              <path d="M10 30 L5 20 L45 10 L50 15" fill="#c49a6c" stroke="#8b4513" strokeWidth="1"/>
              <path d="M90 30 L95 20 L55 10 L50 15" fill="#c49a6c" stroke="#8b4513" strokeWidth="1"/>
              <path d="M50 45 Q45 35 40 30 Q35 25 40 20 Q45 15 50 25 Q55 15 60 20 Q65 25 60 30 Q55 35 50 45" fill="#4a9b4a" stroke="#2d5a2d" strokeWidth="1"/>
              <ellipse cx="40" cy="22" rx="8" ry="5" fill="#5cb85c" transform="rotate(-20 40 22)"/>
              <ellipse cx="60" cy="22" rx="8" ry="5" fill="#5cb85c" transform="rotate(20 60 22)"/>
              <path d="M50 45 Q48 35 50 28" fill="none" stroke="#4a9b4a" strokeWidth="2"/>
            </svg>
          </div>
          <span className="logo-text">Greentext Generator</span>
        </div>
      </div>

      <div className="main-container">
        <div className="top-bar">Greentext Generator</div>
        
        <div className="content">
          <h1 className="title">Generate Greentexts from Wikipedia Bios</h1>
          
          <InputForm onGenerate={handleGenerate} isLoading={isLoading} />

          <hr className="divider" />

          <GreentextDisplay greentext={greentext} error={error} isStreaming={isStreaming} />
        </div>

        <div className="footer">
          <div className="disclaimer">
            This is a greentext generator powered by AI. All outputs are for entertainment purposes only.
          </div>
        </div>
      </div>
    </>
  );
}
