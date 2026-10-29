/**
 * api/assistant.js
 * 
 * Vercel Serverless Function & Backend API Endpoint for Arogya AI.
 * 
 * Endpoint: POST /api/assistant
 * 
 * Features:
 * - Keeps Google Gemini API Key secure in server-side process.env.GEMINI_API_KEY
 * - Never exposes API keys or internal stack traces to client browsers
 * - Enforces request validation and rate-limit guardrails
 * - Returns structured clinical responses and verified feature routes
 */

import { handleAssistantQuery } from '../src/services/ai/geminiClient.js';

export default async function handler(req, res) {
  // 1. Handle CORS preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST requests are supported.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { message, history, language } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_MESSAGE',
        message: 'Message is required and must be a non-empty string.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const result = await handleAssistantQuery({
      message,
      history: Array.isArray(history) ? history : [],
      language: language === 'hi' ? 'hi' : 'en',
      apiKey,
      model
    });

    if (result.error === 'QUOTA_EXHAUSTED') {
      return res.status(429).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[API /api/assistant] Unhandled error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      userMessage: 'An unexpected error occurred while processing your request. Please try again.'
    });
  }
}

