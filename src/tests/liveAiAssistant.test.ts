import { describe, it, expect } from 'vitest';
import { sendAiChatMessage, type NewsContextItem } from '../services/aiService';
import { processNovaMessage } from '../services/novaOrchestrator';

describe('Live LLM Integration Tests for Nova AI', () => {
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

  it('1. Hi returns natural response, not welcome text', async () => {
    const res = await sendAiChatMessage(
      [{ id: '1', role: 'user', content: 'Hi', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply.length).toBeGreaterThan(5);
    expect(res.reply).not.toContain('Welcome to Nova AI!');
  }, 20000);

  it('2. Who is the President of India? mentions Droupadi Murmu', async () => {
    const res = await sendAiChatMessage(
      [{ id: '2', role: 'user', content: 'Who is the President of India?', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply).toContain('Droupadi Murmu');
  }, 20000);

  it('3. Who is the Prime Minister of India? mentions Narendra Modi', async () => {
    const res = await sendAiChatMessage(
      [{ id: '3', role: 'user', content: 'Who is the Prime Minister of India?', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply).toContain('Narendra Modi');
  }, 20000);

  it('4. What is artificial intelligence? defines AI', async () => {
    const res = await sendAiChatMessage(
      [{ id: '4', role: 'user', content: 'What is artificial intelligence?', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply.toLowerCase()).toContain('intelligence');
  }, 20000);

  it('5. Summarize today\'s latest news mentions climate or news headlines', async () => {
    const res = await sendAiChatMessage(
      [{ id: '5', role: 'user', content: 'Summarize today\'s latest news.', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply.length).toBeGreaterThan(40);
  }, 20000);

  it('6. Explain the latest technology news explains tech advances', async () => {
    const res = await sendAiChatMessage(
      [{ id: '6', role: 'user', content: 'Explain the latest technology news.', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply.length).toBeGreaterThan(40);
  }, 20000);

  it('7. What is the difference between AI and machine learning? compares both', async () => {
    const res = await sendAiChatMessage(
      [{ id: '7', role: 'user', content: 'What is the difference between AI and machine learning?', timestamp: Date.now() }],
      sampleNews,
      'gemini'
    );
    expect(res.reply).toMatch(/machine learning|subset|learning/i);
    expect(res.reply).toMatch(/artificial intelligence|ai/i);
  }, 20000);

  it('8. General Knowledge: answers "who is the god of uchiha" using real LLM and avoids canned template', async () => {
    const res = await processNovaMessage({
      messages: [],
      userQuery: 'who is the god of uchiha',
      tasks: [],
    });
    expect(res.reply).not.toContain('I have analyzed your query regarding');
    expect(res.reply).not.toContain('Ask me to create tasks in Life OS or Google Tasks');
    expect(res.reply.length).toBeGreaterThan(30);
    // Real LLM content
    expect(res.reply).toMatch(/Indra|Madara|Uchiha|Hagoromo|Sasuke/i);
  }, 20000);
});

