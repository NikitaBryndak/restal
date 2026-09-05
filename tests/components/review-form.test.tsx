// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render, nextNavigationMock, nextLinkMock } from './test-utils';
import ReviewForm from '@/components/trip/review-form';

vi.mock('next/navigation', () =>
  nextNavigationMock({ usePathname: () => '/shared/trip/NIKITA-REVIEW-DEMO' })
);
vi.mock('next/link', () => nextLinkMock());

describe('ReviewForm login CTA (callbackUrl)', () => {
  it('sends anonymous visitors to /login with a callbackUrl back to the trip page', () => {
    render(<ReviewForm tripNumber="TEST-REVIEW-DEMO" status="Completed" isAuthenticated={false} />);

    const link = screen.getByRole('link', { name: 'Увійти, щоб залишити відгук' });
    expect(link).toHaveAttribute('href', '/login?callbackUrl=%2Fshared%2Ftrip%2FNIKITA-REVIEW-DEMO');
  });

  it('renders the star form for authenticated users on a completed trip', () => {
    render(<ReviewForm tripNumber="TEST-REVIEW-DEMO" status="Completed" isAuthenticated={true} />);

    expect(screen.getByText('Залишити відгук')).toBeInTheDocument();
    // Five rating buttons, one per star.
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `Оцінка ${i}` })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Опублікувати відгук' })).toBeDisabled();
  });

  it('renders nothing for trips that are not reviewable yet', () => {
    render(<ReviewForm tripNumber="TEST-REVIEW-DEMO" status="In Booking" isAuthenticated={true} />);
    expect(screen.queryByText('Залишити відгук')).toBeNull();
  });
});
