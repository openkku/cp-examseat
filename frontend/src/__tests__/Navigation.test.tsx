import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { MobileTabBar } from '../components/layout/MobileTabBar';

vi.mock('../config', () => ({ CONFIG: { GITHUB_REPO_URL: 'https://example.test/repo' } }));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({ matches: false })),
});

describe('navigation', () => {
  it('marks the current route in desktop and mobile navigation', () => {
    render(
      <MemoryRouter initialEntries={['/stats']}>
        <Navbar />
        <MobileTabBar />
      </MemoryRouter>,
    );

    const statsLinks = screen.getAllByRole('link', { name: 'สถิติ' });
    expect(statsLinks).toHaveLength(2);
    statsLinks.forEach((link) => expect(link.className).toContain('text-faculty'));
  });
});
