import { describe, it, expect } from 'vitest';
import { generateContextualAiResponse, type NewsContextItem } from '../services/aiService';

describe('Nova AI Contextual Response & Knowledge Engine', () => {
  const sampleNews: NewsContextItem[] = [
    {
      id: 'test-1',
      title: 'Global Leaders Agree on New Climate Action Plan',
      category: 'Breaking',
      source: 'Reuters',
      publishedAt: '2 min ago',
      description: 'Historic agreement to accelerate climate action and reach net-zero by 2050.',
      content: 'Over 190 nations agreed to phase down thermal coal and boost green investments.',
    },
    {
      id: 'test-2',
      title: 'AI Revolution: New Breakthrough Brings Smarter Solutions',
      category: 'Technology',
      source: 'TechCrunch',
      publishedAt: '3 min ago',
      description: 'Major advancement in speculative decoding and hierarchical tree search.',
      content: 'Reduced inference costs by 42% while improving reasoning fidelity.',
    },
  ];

  // 1. Hi
  it('1. answers "Hi" naturally without returning onboarding welcome', () => {
    const res = generateContextualAiResponse('Hi', sampleNews);
    expect(res.toLowerCase()).toContain('hello');
    expect(res).not.toContain('Welcome to Nova AI!');
  });

  // 2. Who is the President of India?
  it('2. answers "Who is the President of India?" correctly', () => {
    const res = generateContextualAiResponse('Who is the President of India?', sampleNews);
    expect(res).toContain('Droupadi Murmu');
    expect(res).toContain('President of the Republic of India');
  });

  // 3. Who is the Prime Minister of India?
  it('3. answers "Who is the Prime Minister of India?" correctly', () => {
    const res = generateContextualAiResponse('Who is the Prime Minister of India?', sampleNews);
    expect(res).toContain('Narendra Modi');
    expect(res).toContain('Prime Minister of India');
  });

  // 4. What is artificial intelligence?
  it('4. answers "What is artificial intelligence?" with detailed breakdown', () => {
    const res = generateContextualAiResponse('What is artificial intelligence?', sampleNews);
    expect(res).toContain('Artificial Intelligence (AI)');
    expect(res).toContain('Reasoning');
    expect(res).toContain('Machine Learning');
  });

  // 5. Summarize today's latest news.
  it('5. answers "Summarize today\'s latest news." using loaded articles', () => {
    const res = generateContextualAiResponse('Summarize today\'s latest news.', sampleNews);
    expect(res).toContain('Latest News Summary');
    expect(res).toContain('Climate Action Plan');
    expect(res).toContain('Reuters');
  });

  // 6. Explain the latest technology news.
  it('6. answers "Explain the latest technology news." with tech context', () => {
    const res = generateContextualAiResponse('Explain the latest technology news.', sampleNews);
    expect(res).toContain('Technology News');
    expect(res).toContain('AI Revolution');
    expect(res).toContain('TechCrunch');
  });

  // 7. What is the difference between AI and machine learning?
  it('7. answers "What is the difference between AI and machine learning?" with comparison', () => {
    const res = generateContextualAiResponse('What is the difference between AI and machine learning?', sampleNews);
    expect(res).toContain('Difference Between Artificial Intelligence (AI) and Machine Learning (ML)');
    expect(res).toContain('subset of AI');
    expect(res).toContain('All Machine Learning is AI');
  });
});
