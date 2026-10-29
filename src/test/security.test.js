import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  sanitizeUrl,
  validateImageFile,
  sanitizeFilename,
  enforceMaxLength,
} from '../utils/security';

describe('Security Utilities', () => {
  describe('sanitizeUrl', () => {
    it('allows valid HTTPS URLs', () => {
      const url = 'https://www.google.com/maps?q=hospital';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('allows valid HTTP URLs', () => {
      const url = 'http://example.com/clinic';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('allows valid relative path navigation', () => {
      expect(sanitizeUrl('/dashboard')).toBe('/dashboard');
      expect(sanitizeUrl('#top')).toBe('#top');
    });

    it('blocks javascript: URLs and returns fallback', () => {
      expect(sanitizeUrl('javascript:alert(1)', '#')).toBe('#');
      expect(sanitizeUrl('javascript:/*--></title></style></textarea></script>alert(1)', '#')).toBe('#');
      expect(sanitizeUrl('  javascript:alert(document.cookie)  ', '#')).toBe('#');
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('blocks data: URLs and returns fallback', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>', '#')).toBe('#');
      expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', '#')).toBe('#');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('blocks vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)', '#')).toBe('#');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(sanitizeUrl('', '#')).toBe('#');
      expect(sanitizeUrl(null, '#')).toBe('#');
      expect(sanitizeUrl(undefined, '#')).toBe('#');
      expect(sanitizeUrl(12345, '#')).toBe('#');
    });
  });

  describe('validateImageFile', () => {
    it('accepts valid JPEG, PNG, and WebP files', () => {
      const validPng = new File(['dummy content'], 'prescription.png', { type: 'image/png' });
      const validJpg = new File(['dummy content'], 'rx.jpg', { type: 'image/jpeg' });
      const validWebp = new File(['dummy content'], 'report.webp', { type: 'image/webp' });

      expect(validateImageFile(validPng).valid).toBe(true);
      expect(validateImageFile(validJpg).valid).toBe(true);
      expect(validateImageFile(validWebp).valid).toBe(true);
    });

    it('rejects SVG files to prevent stored XSS attacks', () => {
      const svgFile = new File(['<svg onload="alert(1)"></svg>'], 'malicious.svg', { type: 'image/svg+xml' });
      const res = validateImageFile(svgFile);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/SVG files are not permitted/i);
    });

    it('rejects SVG disguised with spoofed mime type', () => {
      const spoofedSvg = new File(['<svg></svg>'], 'fake.svg', { type: 'image/png' });
      const res = validateImageFile(spoofedSvg);
      expect(res.valid).toBe(false);
    });

    it('rejects executable and non-image files', () => {
      const exeFile = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' });
      const res = validateImageFile(exeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/PNG, JPG, JPEG, or WEBP/i);
    });

    it('rejects zero-byte files', () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const res = validateImageFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/empty/i);
    });

    it('enforces maximum file size boundary', () => {
      const largeFile = {
        name: 'huge.jpg',
        size: 15 * 1024 * 1024, // 15MB
        type: 'image/jpeg'
      };
      const res = validateImageFile(largeFile, 10 * 1024 * 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/exceeds the 10 MB limit/i);
    });
  });

  describe('sanitizeFilename', () => {
    it('removes directory traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
    });

    it('removes special and unsafe characters', () => {
      expect(sanitizeFilename('my prescription*#? <test>.jpg')).toBe('my_prescription_____test_.jpg');
    });

    it('falls back to default safe filename when empty', () => {
      expect(sanitizeFilename('')).toBe('upload');
      expect(sanitizeFilename('   ')).toBe('upload');
      expect(sanitizeFilename(null)).toBe('upload');
    });
  });

  describe('enforceMaxLength', () => {
    it('truncates inputs exceeding max length', () => {
      const input = 'a'.repeat(500);
      expect(enforceMaxLength(input, 100).length).toBe(100);
    });

    it('leaves inputs within length unaltered', () => {
      expect(enforceMaxLength('hello world', 50)).toBe('hello world');
    });

    it('handles non-string values gracefully', () => {
      expect(enforceMaxLength(null, 50)).toBe('');
      expect(enforceMaxLength(undefined, 50)).toBe('');
    });
  });

  describe('Repository Security Boundaries', () => {
    it('verifies that .env files are excluded in .gitignore', () => {
      const gitignorePath = path.resolve(process.cwd(), '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf8');
      expect(content).toMatch(/^\.env/m);
      expect(content).toMatch(/^\.env\.\*/m);
    });

    it('verifies that supabase/schema.sql enables RLS on health data tables', () => {
      const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
      const content = fs.readFileSync(schemaPath, 'utf8').toLowerCase();
      
      expect(content).toContain('alter table public.vitals_logs enable row level security;');
      expect(content).toContain('alter table public.symptom_logs enable row level security;');
      expect(content).toContain('alter table public.prescriptions enable row level security;');
      expect(content).toContain('alter table public.cart enable row level security;');

      expect(content).toContain('auth.uid() = user_id');
    });

    it('verifies client code does not query API keys from localStorage', () => {
      const filesToCheck = [
        'src/pages/AIAssistant.jsx',
        'src/pages/SymptomsChecker.jsx',
        'src/pages/Nearby.jsx',
      ];

      for (const relPath of filesToCheck) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        expect(code).not.toContain("localStorage.getItem('gemini_api_key')");
        expect(code).not.toContain("localStorage.getItem('google_maps_api_key')");
      }
    });
  });
});
