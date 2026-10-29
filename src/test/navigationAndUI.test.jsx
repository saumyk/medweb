import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import NotFound from '../pages/NotFound';
import MedicineInfo from '../pages/MedicineInfo';
import { LanguageProvider } from '../components/LanguageContext';

// Problematic component for testing ErrorBoundary
const CrashingComponent = ({ shouldCrash }) => {
  if (shouldCrash) {
    throw new Error('Test crash in child component');
  }
  return <div>Safe child content</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>All normal here</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All normal here')).toBeInTheDocument();
  });

  it('catches render errors and renders accessible error fallback with actions', () => {
    // Suppress console.error in vitest output for intentional test crash
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashingComponent shouldCrash={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong in this section')).toBeInTheDocument();
    expect(screen.getByText('Test crash in child component')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});

describe('NotFound 404 Page', () => {
  it('renders 404 message, search input, and core healthcare links', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/some-unknown-path']}>
          <NotFound />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(screen.getByText(/404 · Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /emergency sos/i })).toBeInTheDocument();
  });
});

describe('Routing and Redirects', () => {
  it('redirects common alias routes to their canonical destination', () => {
    render(
      <MemoryRouter initialEntries={['/medicines']}>
        <Routes>
          <Route path="/medicine" element={<div>Canonical Medicine Page</div>} />
          <Route path="/medicines" element={<Navigate to="/medicine" replace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Canonical Medicine Page')).toBeInTheDocument();
  });

  it('redirects /symptom alias to /symptoms', () => {
    render(
      <MemoryRouter initialEntries={['/symptom']}>
        <Routes>
          <Route path="/symptoms" element={<div>Canonical Symptoms Page</div>} />
          <Route path="/symptom" element={<Navigate to="/symptoms" replace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Canonical Symptoms Page')).toBeInTheDocument();
  });

  it('redirects /prescriptions alias to /ocr', () => {
    render(
      <MemoryRouter initialEntries={['/prescriptions']}>
        <Routes>
          <Route path="/ocr" element={<div>Canonical OCR Page</div>} />
          <Route path="/prescriptions" element={<Navigate to="/ocr" replace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Canonical OCR Page')).toBeInTheDocument();
  });

  it('redirects /global-medicine and /global-medicine-search to /medicine', () => {
    render(
      <MemoryRouter initialEntries={['/global-medicine']}>
        <Routes>
          <Route path="/medicine" element={<div>Canonical Medicine Page</div>} />
          <Route path="/global-medicine" element={<Navigate to="/medicine" replace />} />
          <Route path="/global-medicine-search" element={<Navigate to="/medicine" replace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Canonical Medicine Page')).toBeInTheDocument();
  });
});

describe('MedicineInfo Responsive UI Elements', () => {
  it('renders all accessible search controls and popular medicine chips', () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/medicine']}>
          <MedicineInfo />
        </MemoryRouter>
      </LanguageProvider>
    );

    // Search input
    expect(screen.getByRole('textbox', { name: /search medicine/i })).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();

    // Popular quick search chips
    expect(screen.getByRole('button', { name: /dolo 650/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /combiflam/i })).toBeInTheDocument();
  });
});
