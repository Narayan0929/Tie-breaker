import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const decisionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: 'A sharp, 2-3 sentence overview of the core tension and decisive factors in this dilemma.',
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        recommendedOption: {
          type: Type.STRING,
          description: 'The definitive recommended choice if forced to pick today.',
        },
        confidencePercentage: {
          type: Type.INTEGER,
          description: 'Confidence level from 50 to 95 percent.',
        },
        verdict: {
          type: Type.STRING,
          description: 'A punchy, memorable 1-line verdict declaration.',
        },
        keyTradeoff: {
          type: Type.STRING,
          description: 'The single most critical sacrifice or compromise you make with this choice.',
        },
        immediateNextStep: {
          type: Type.STRING,
          description: 'The exact first action step to take in the next 24 hours to test or commit.',
        },
      },
      required: ['recommendedOption', 'confidencePercentage', 'verdict', 'keyTradeoff', 'immediateNextStep'],
    },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          optionName: { type: Type.STRING },
          tagline: { type: Type.STRING, description: 'Short 4-6 word description of this path' },
          bestIf: { type: Type.STRING, description: 'Choose this option if your priority is...' },
          pros: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                category: { type: Type.STRING, description: 'e.g. Financial, Career, Well-being, Freedom, Speed' },
              },
              required: ['title', 'description', 'impact', 'category'],
            },
          },
          cons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                category: { type: Type.STRING, description: 'e.g. Risk, Cost, Effort, Stress, Lock-in' },
              },
              required: ['title', 'description', 'impact', 'category'],
            },
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['strengths', 'weaknesses', 'opportunities', 'threats'],
          },
        },
        required: ['optionName', 'tagline', 'bestIf', 'pros', 'cons', 'swot'],
      },
    },
    comparisonMatrix: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criteriaName: { type: Type.STRING },
          description: { type: Type.STRING },
          importance: { type: Type.STRING, enum: ['Critical', 'Important', 'Nice-to-have'] },
          winnerOption: { type: Type.STRING },
          why: { type: Type.STRING },
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                optionName: { type: Type.STRING },
                score: { type: Type.INTEGER, description: 'Score between 1 and 10' },
              },
              required: ['optionName', 'score'],
            },
          },
        },
        required: ['criteriaName', 'description', 'importance', 'winnerOption', 'why', 'scores'],
      },
    },
    tenTenTenRule: {
      type: Type.OBJECT,
      properties: {
        tenMinutes: { type: Type.STRING, description: 'How you will feel in 10 minutes after choosing' },
        tenMonths: { type: Type.STRING, description: 'The realities and milestones after 10 months' },
        tenYears: { type: Type.STRING, description: 'The enduring legacy or retrospective view in 10 years' },
      },
      required: ['tenMinutes', 'tenMonths', 'tenYears'],
    },
    worstCaseStressTest: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          optionName: { type: Type.STRING },
          worstCase: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
          reversibility: { type: Type.STRING, enum: ['Easily Reversible', 'Moderately Reversible', 'Hard to Reverse'] },
          mitigationStrategy: { type: Type.STRING },
        },
        required: ['optionName', 'worstCase', 'likelihood', 'reversibility', 'mitigationStrategy'],
      },
    },
    devilsAdvocateNudge: {
      type: Type.STRING,
      description: 'A provocative challenge to the user’s unexamined assumptions or hidden cognitive biases.',
    },
    blindSpotsToWatch: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2-4 hidden risks, second-order effects, or sunk cost traps to be aware of.',
    },
  },
  required: [
    'executiveSummary',
    'recommendation',
    'options',
    'comparisonMatrix',
    'tenTenTenRule',
    'worstCaseStressTest',
    'devilsAdvocateNudge',
    'blindSpotsToWatch',
  ],
};

// API: Analyze Decision
app.post('/api/analyze-decision', async (req, res) => {
  try {
    const { decisionTitle, options, context, priorities, advisorLens } = req.body;

    if (!decisionTitle || typeof decisionTitle !== 'string') {
      return res.status(400).json({ error: 'Please provide a decision title or question.' });
    }

    const cleanedOptions: string[] = Array.isArray(options) && options.filter((o: string) => typeof o === 'string' && o.trim().length > 0).length >= 2
      ? options.filter((o: string) => typeof o === 'string' && o.trim().length > 0)
      : ['Option A', 'Option B'];

    const userPriorities = Array.isArray(priorities) && priorities.length > 0
      ? priorities.join(', ')
      : 'Balanced risk, growth, and long-term satisfaction';

    const selectedLens = advisorLens || 'Pragmatic Strategist (Objective, realistic, evidence-focused)';

    const prompt = `
You are "The Tiebreaker", an elite decision-analysis strategist and executive advisor.
Analyze this difficult decision thoroughly, objectively, and deeply:

Decision Question / Dilemma: "${decisionTitle}"
Options to evaluate:
${cleanedOptions.map((opt, idx) => `${idx + 1}. "${opt}"`).join('\n')}

User Context & Details:
${context ? context : 'None provided; extrapolate realistic scenarios and constraints.'}

User's Key Priorities:
${userPriorities}

Advisor Persona / Analytical Lens:
${selectedLens}

Instructions:
1. Provide a rigorous, thoughtful Pros & Cons breakdown for EACH option with 3-5 distinct pros and 3-5 distinct cons. Each pro and con must have an impact level ("High", "Medium", or "Low") and a specific domain category.
2. Conduct an authentic SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for each option.
3. Build a comprehensive Comparison Matrix with 4 to 6 critical criteria (e.g. Cost & ROI, Growth & Learning, Stress & Quality of Life, Long-term Freedom, Execution Risk). Score each option from 1 to 10 on each criterion.
4. Deliver a clear, decisive Tiebreaker recommendation with confidence percentage (between 50% and 95%), an executive verdict, the single primary tradeoff, and an immediate next step.
5. Apply the 10/10/10 Rule (10 minutes, 10 months, 10 years).
6. Perform a Worst-Case Scenario Stress Test for each option assessing likelihood, reversibility ("Easily Reversible", "Moderately Reversible", "Hard to Reverse"), and mitigation strategy.
7. Provide a Devil's Advocate nudge challenging common cognitive biases and list 2-4 crucial blind spots.

Be insightful, realistic, nuanced, and actionable. Avoid generic platitudes.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are The Tiebreaker, an expert decision science advisor specializing in multi-criteria evaluation, behavioral economics, risk modeling, and strategic dilemma resolution.',
        responseMimeType: 'application/json',
        responseSchema: decisionResponseSchema,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error('No content returned from Gemini model.');
    }

    const parsed = JSON.parse(rawText);

    // Format criteria scores to Record<string, number>
    const formattedComparisonMatrix = parsed.comparisonMatrix.map((item: any, idx: number) => {
      const scoreMap: Record<string, number> = {};
      if (Array.isArray(item.scores)) {
        item.scores.forEach((s: any) => {
          if (s.optionName && typeof s.score === 'number') {
            scoreMap[s.optionName] = s.score;
          }
        });
      }
      return {
        id: `crit-${idx}-${Date.now()}`,
        criteriaName: item.criteriaName,
        description: item.description,
        importance: item.importance,
        winnerOption: item.winnerOption,
        why: item.why,
        scores: scoreMap,
        userWeight: item.importance === 'Critical' ? 5 : item.importance === 'Important' ? 3 : 2,
      };
    });

    // Add unique IDs to pros and cons
    const formattedOptions = parsed.options.map((opt: any, optIdx: number) => ({
      optionId: `opt-${optIdx}`,
      optionName: opt.optionName,
      tagline: opt.tagline,
      bestIf: opt.bestIf,
      pros: (opt.pros || []).map((p: any, pIdx: number) => ({
        id: `pro-${optIdx}-${pIdx}`,
        title: p.title,
        description: p.description,
        impact: p.impact,
        category: p.category,
        userWeight: p.impact === 'High' ? 5 : p.impact === 'Medium' ? 3 : 1,
        checked: false,
      })),
      cons: (opt.cons || []).map((c: any, cIdx: number) => ({
        id: `con-${optIdx}-${cIdx}`,
        title: c.title,
        description: c.description,
        impact: c.impact,
        category: c.category,
        userWeight: c.impact === 'High' ? 5 : c.impact === 'Medium' ? 3 : 1,
        checked: false,
      })),
      swot: opt.swot,
    }));

    const result = {
      id: `dec-${Date.now()}`,
      decisionTitle,
      createdAt: new Date().toISOString(),
      advisorLens: selectedLens,
      priorities: Array.isArray(priorities) ? priorities : [],
      userContext: context || '',
      executiveSummary: parsed.executiveSummary,
      recommendation: parsed.recommendation,
      options: formattedOptions,
      comparisonMatrix: formattedComparisonMatrix,
      tenTenTenRule: parsed.tenTenTenRule,
      worstCaseStressTest: parsed.worstCaseStressTest,
      devilsAdvocateNudge: parsed.devilsAdvocateNudge,
      blindSpotsToWatch: parsed.blindSpotsToWatch,
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Error analyzing decision:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze decision. Please check your connection or API key in Settings > Secrets.',
    });
  }
});

// API: Multi-turn Gemini Chatbot with selectable roles & model routing
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, roleId = 'general', modelPreference } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Role system instructions and model routing:
    // gemini-3.1-flash-lite for fast tasks
    // gemini-3.8-flash for general tasks
    // gemini-4-argon for complex tasks
    let systemInstruction = 'You are The Tiebreaker, an elite decision strategist and executive coach.';
    let selectedModel = 'gemini-3.8-flash';

    if (roleId === 'rapid') {
      systemInstruction =
        'You are The Rapid Pragmatist. You provide lightning-fast, high-density, bulleted advice and rapid gut-checks. Prioritize immediate actionability, brevity, and clear tradeoffs.';
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (roleId === 'complex') {
      systemInstruction =
        'You are The Master Decision Strategist & Game Theorist. Specialize in multi-stage game theory, asymmetric payoffs, risk matrices, Nash equilibriums, probabilistic scenarios, and deep systemic tradeoffs.';
      selectedModel = modelPreference || 'gemini-3.8-flash'; // Fallback to 3.8-flash or user request
    } else {
      systemInstruction =
        'You are The Strategic Dilemma Consultant. You help users navigate thorny life, career, and business decisions with nuanced pros and cons, empathetic wisdom, cognitive bias detection, and clear recommendations.';
      selectedModel = 'gemini-3.8-flash';
    }

    if (modelPreference && ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'].includes(modelPreference)) {
      selectedModel = modelPreference;
    }

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    return res.json({ reply: response.text || '', modelUsed: selectedModel });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Chat generation failed.',
    });
  }
});

// API: Follow-up chat for decision dashboard
app.post('/api/follow-up', async (req, res) => {
  try {
    const { decisionContext, message, chatHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const conversationPrompt = `
You are "The Tiebreaker", an expert strategic advisor assisting a user with their active decision analysis.

Decision Title: "${decisionContext?.decisionTitle || 'Current Decision'}"
Evaluated Options: ${(decisionContext?.options || []).map((o: any) => o.optionName).join(', ')}
Recommendation previously given: "${decisionContext?.recommendation?.recommendedOption}" (${decisionContext?.recommendation?.verdict})
Key Tradeoff: "${decisionContext?.recommendation?.keyTradeoff}"

Previous exchange context:
${(chatHistory || []).slice(-4).map((m: any) => `${m.role === 'user' ? 'User' : 'Tiebreaker'}: ${m.content}`).join('\n')}

User's new question or comment:
"${message}"

Provide a crisp, actionable, wise response (2-4 paragraphs or concise bullet points). Directly address their specific concern, trade-off, or hypothetical adjustment. Suggest concrete questions to ask or tests to run.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: conversationPrompt,
      config: {
        systemInstruction: 'You are The Tiebreaker, an incisive decision consultant and executive coach.',
      },
    });

    const reply = response.text || 'I apologize, but I could not formulate a response.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in follow-up chat:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process follow-up question.',
    });
  }
});

// Setup HTTP server to support both Express routes and WebSockets
const server = http.createServer(app);

// Live API WebSocket Server on /live path
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live API WebSocket');
  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are The Tiebreaker, an elite real-time vocal advisor. Speak concisely, decisively, with strategic warmth and crisp insights to help the user resolve tough choices.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
          }
          if (message.serverContent?.interrupted) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && session) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text && session) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('Error forwarding audio to Live session:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client WebSocket closed');
      if (session) {
        session.close().catch(() => {});
      }
    });
  } catch (err: any) {
    console.error('Failed to initialize Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err?.message || 'Live API connection failed' }));
      clientWs.close();
    }
  }
});

// Mount Vite or static server
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`The Tiebreaker server running with Live API on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
