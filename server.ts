import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Server-side Gemini AI initialization
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API endpoint for natural language shop floor logging, shift summaries, and scrap analysis
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { action, prompt, jobContext } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not set in server environment. Please configure it in Secrets.',
      });
    }

    if (action === 'parse_voice_log') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an industrial shop-floor AI data parser for MPBL Plastic Packaging Manufacturing.
Parse the operator's voice or text log entry into structured JSON.
Input text: "${prompt}"

Current active jobs context: ${JSON.stringify(jobContext || [])}

Extract and return JSON with exact structure:
{
  "matchedOrderId": "Order number like JO-2026-0891 if mentioned or best match from context, else null",
  "producedQty": number (0 if not mentioned),
  "scrapQty": number (0 if not mentioned),
  "unit": "pcs" or "kg" or "rolls",
  "downtimeMinutes": number (0 if not mentioned),
  "downtimeReason": "downtime reason string or empty",
  "operatorNotes": "Clean normalized summary of what operator logged",
  "confidenceScore": number (0.0 to 1.0),
  "suggestedStage": "Extrusion" | "Printing" | "Bag Making" | "Dispatch" | null
}
Return only JSON.`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      return res.json({ success: true, result: JSON.parse(text) });
    } else if (action === 'shift_summary') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an Enterprise Production Manager generating a formal Shift Handover Report for MPBL Packaging Plant.
Active jobs and floor status: ${JSON.stringify(jobContext || [])}
User prompt: "${prompt || 'Summarize current shift performance, scrap alerts, and handover action items'}"

Provide a crisp markdown report:
### 1. Executive Summary & Total Output
### 2. Stage Progression & Bottlenecks
### 3. Machine Downtime & Scrap Analysis
### 4. Mandatory Supervisor Handover Action Items`,
      });

      return res.json({ success: true, text: response.text });
    } else if (action === 'scrap_anomaly_diagnosis') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are a Senior Plastics Quality & Reliability Specialist.
Diagnose potential equipment or material defects from this batch data:
${JSON.stringify(jobContext)}
Prompt: "${prompt || 'Analyze scrap rate spike and suggest immediate corrective maintenance'}"

Return JSON:
{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "rootCauses": ["cause 1", "cause 2"],
  "immediateActions": ["action 1", "action 2"],
  "maintenanceRecommendation": "string"
}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return res.json({ success: true, result: JSON.parse(response.text || '{}') });
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt || 'Provide guidelines for reducing film thickness variance in blown film extrusion.',
        config: {
          systemInstruction: 'You are the MPBL Manufacturing ERP AI Assistant, specializing in flexible packaging execution, shop-floor OEE, and quality management.',
        },
      });

      return res.json({ success: true, text: response.text });
    }
  } catch (err: any) {
    console.error('Server Gemini Error:', err);
    return res.status(500).json({ error: err.message || 'Gemini server error' });
  }
});

// Configure Vite middleware in development or serve static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, `<!doctype html><html><head></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`);
      const fs = await import('fs');
      const htmlFile = path.resolve(__dirname, 'index.html');
      if (fs.existsSync(htmlFile)) {
        template = await vite.transformIndexHtml(url, fs.readFileSync(htmlFile, 'utf-8'));
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`MPBL ERP Server running on http://localhost:${PORT}`);
});
