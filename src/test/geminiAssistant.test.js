import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  handleAssistantQuery,
  callGeminiApi,
  validateApplicationRoute,
  DEFAULT_GEMINI_MODEL
} from '../services/ai/geminiClient';
import handler from '../../api/assistant';

describe('Gemini AI Assistant & Intelligent Feature Routing Tests', () => {

  describe('1. Model Configuration & Server-side Security', () => {
    it('uses official Google free-tier model by default', () => {
      expect(DEFAULT_GEMINI_MODEL).toBe('gemini-1.5-flash');
    });

    it('never exposes GEMINI_API_KEY through client-side bundles or window object', () => {
      expect(typeof window !== 'undefined' ? window.GEMINI_API_KEY : undefined).toBeUndefined();
      expect(typeof window !== 'undefined' ? window.VITE_GEMINI_API_KEY : undefined).toBeUndefined();
    });

    it('throws CONFIG_MISSING_KEY when called without an API key', async () => {
      await expect(callGeminiApi({
        message: 'Hello',
        apiKey: ''
      })).rejects.toThrow('GEMINI_API_KEY is not configured');
    });
  });

  describe('2. Application Route Allowlist & Security Validation', () => {
    it('validates allowed internal application routes', () => {
      expect(validateApplicationRoute('/medicine')).toBe('/medicine');
      expect(validateApplicationRoute('/symptoms')).toBe('/symptoms');
      expect(validateApplicationRoute('/ocr')).toBe('/ocr');
      expect(validateApplicationRoute('/nearby')).toBe('/nearby');
      expect(validateApplicationRoute('/nearby?emergency=true')).toBe('/nearby?emergency=true');
      expect(validateApplicationRoute('/dashboard')).toBe('/dashboard');
      expect(validateApplicationRoute('/telemedicine')).toBe('/telemedicine');
    });

    it('permits valid query parameters for medicine search and symptom checker', () => {
      expect(validateApplicationRoute('/medicine?search=Dolo%20650')).toContain('/medicine?search=Dolo%20650');
      expect(validateApplicationRoute('/symptoms?query=headache')).toContain('/symptoms?query=headache');
    });

    it('rejects external or unapproved routes to prevent arbitrary redirects', () => {
      expect(validateApplicationRoute('https://malicious-site.com')).toBeNull();
      expect(validateApplicationRoute('/admin/secrets')).toBeNull();
      expect(validateApplicationRoute('/unauthorized-page')).toBeNull();
      expect(validateApplicationRoute('')).toBeNull();
    });
  });

  describe('3. Error & Free-Tier Quota Handling', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('handles HTTP 429 quota exhaustion gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 429,
            message: 'Resource has been exhausted (e.g. check quota).',
            status: 'RESOURCE_EXHAUSTED'
          }
        })
      });

      const res = await handleAssistantQuery({
        message: 'I have a headache',
        apiKey: 'test-key-mock'
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('QUOTA_EXHAUSTED');
      expect(res.userMessage).toContain('temporarily reached its usage limit');
      expect(res.fallbackText).toBeDefined();
    });

    it('handles invalid API key (HTTP 400) gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
            details: [{ reason: 'API_KEY_INVALID' }]
          }
        })
      });

      const res = await handleAssistantQuery({
        message: 'What is paracetamol?',
        apiKey: 'invalid-key'
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('INVALID_API_KEY');
      expect(res.userMessage).toContain('invalid');
    });

    it('handles network timeouts gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue({
        name: 'AbortError',
        message: 'The operation was aborted'
      });

      const res = await handleAssistantQuery({
        message: 'Tell me about fever',
        apiKey: 'test-key'
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('TIMEOUT');
      expect(res.userMessage).toContain('timed out');
    });
  });

  describe('4. Intent Detection & Website Feature Routing', () => {
    it('intelligently routes medicine queries to Medicine Information (/medicine)', async () => {
      const res = await handleAssistantQuery({
        message: 'What is paracetamol used for and what are its side effects?'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toContain('/medicine');
      expect(res.suggestedAction.label).toContain('Medicine');
    });

    it('routes symptom descriptions to Symptom Checker (/symptoms)', async () => {
      const res = await handleAssistantQuery({
        message: 'I have had a high fever and body chills since yesterday.'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toContain('/symptoms');
    });

    it('routes prescription upload requests to Prescription OCR (/ocr)', async () => {
      const res = await handleAssistantQuery({
        message: 'Can I upload a picture of my prescription to scan the medicines?'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toBe('/ocr');
      expect(res.suggestedAction.label).toContain('Prescription');
    });

    it('routes hospital and clinic searches to Nearby Care (/nearby)', async () => {
      const res = await handleAssistantQuery({
        message: 'Find a 24/7 hospital or pharmacy near me.'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toBe('/nearby');
    });

    it('routes vitals and health logs to Health Dashboard (/dashboard)', async () => {
      const res = await handleAssistantQuery({
        message: 'Where can I see my saved blood pressure and sugar vitals?'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toBe('/dashboard');
    });

    it('routes doctor consultation queries to Telemedicine (/telemedicine)', async () => {
      const res = await handleAssistantQuery({
        message: 'I want an online doctor consultation for a second opinion.'
      });

      expect(res.success).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toBe('/telemedicine');
    });

    it('routes physical emergencies to Emergency SOS (/nearby?emergency=true)', async () => {
      const res = await handleAssistantQuery({
        message: 'Severe crushing chest pain radiating to left arm and sweating.'
      });

      expect(res.success).toBe(true);
      expect(res.isEmergency).toBe(true);
      expect(res.suggestedAction).not.toBeNull();
      expect(res.suggestedAction.route).toBe('/nearby?emergency=true');
    });

    it('handles non-medical chitchat without forcing medical warnings', async () => {
      const res = await handleAssistantQuery({
        message: 'Tell me a joke.'
      });

      expect(res.success).toBe(true);
      expect(res.isEmergency).toBe(false);
      expect(res.text.toLowerCase()).not.toContain('seek immediate emergency care');
    });
  });

  describe('5. Multi-turn History Context & Structured API Response', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('passes conversation history correctly to Gemini and receives structured response', async () => {
      let capturedBody = null;

      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        text: "Paracetamol is commonly used to treat mild-to-moderate pain and reduce fever.",
                        intent: "medicine_information",
                        confidence: 0.96,
                        suggestedAction: {
                          type: "internal_route",
                          route: "/medicine?search=paracetamol",
                          label: "View Medicine Information",
                          description: "Official drug monograph and safety warnings"
                        },
                        isEmergency: false
                      })
                    }
                  ]
                }
              }
            ]
          })
        };
      });

      const history = [
        { role: 'user', text: 'Hello' },
        { role: 'assistant', text: 'Hello! How can I help you today?' }
      ];

      const res = await callGeminiApi({
        message: 'What is paracetamol?',
        history,
        apiKey: 'test-api-key-123'
      });

      expect(res.success).toBe(true);
      expect(res.text).toContain('Paracetamol is commonly used');
      expect(res.intent).toBe('medicine_information');
      expect(res.suggestedAction.route).toBe('/medicine?search=paracetamol');

      // Verify conversation history was formatted into API payload
      expect(capturedBody.contents.length).toBe(3); // 2 history items + 1 user query
      expect(capturedBody.contents[0].parts[0].text).toBe('Hello');
      expect(capturedBody.contents[1].parts[0].text).toContain('How can I help');
      expect(capturedBody.contents[2].parts[0].text).toBe('What is paracetamol?');
    });
  });

  describe('6. Serverless API Endpoint Handler (/api/assistant)', () => {
    it('returns 405 Method Not Allowed for GET requests', async () => {
      const req = { method: 'GET' };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'METHOD_NOT_ALLOWED' }));
    });

    it('returns 400 Bad Request for empty message payload', async () => {
      const req = {
        method: 'POST',
        body: { message: '' }
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'EMPTY_MESSAGE' }));
    });

    it('processes valid POST message and returns HTTP 200 with structured response', async () => {
      const req = {
        method: 'POST',
        body: {
          message: 'What is a fever?',
          history: [],
          language: 'en'
        }
      };
      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await handler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        text: expect.any(String)
      }));
    });
  });
});
