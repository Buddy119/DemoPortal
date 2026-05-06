import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import FinancialInsightCards from '../FinancialInsightCards.jsx';

const FinancialInsightCardsComponent = FinancialInsightCards.default || FinancialInsightCards;

describe('FinancialInsightCards', () => {
  test('renders spending, bill, and readiness summaries', () => {
    render(
      React.createElement(FinancialInsightCardsComponent, {
        spendingComparison: {
          currency: 'SGD',
          topDrivers: [
            {
              category: 'Travel',
              changeAmount: 591,
              changePercent: 328.3,
            },
          ],
        },
        upcomingBills: {
          count: 2,
          totalDue: 42,
          currency: 'SGD',
          upcomingBills: [
            {
              merchant: 'Netflix',
              amount: 21,
              currency: 'SGD',
              estimatedDueDate: '2026-05-05',
              confidence: 'high',
              balanceCheck: 'sufficient_funds',
            },
            {
              merchant: 'Spotify',
              amount: 21,
              currency: 'SGD',
              estimatedDueDate: '2026-05-07',
              confidence: 'high',
              balanceCheck: 'sufficient_funds',
            },
          ],
        },
      })
    );

    expect(screen.getByText('Spending spike detected')).toBeTruthy();
    expect(screen.getByText('Travel spend increased to')).toBeTruthy();
    expect(screen.getByText('2 bills')).toBeTruthy();
    expect(screen.getByText('Payment readiness')).toBeTruthy();
    expect(screen.getAllByText('High confidence')).toHaveLength(2);
  });

  test('expands the payment readiness schedule', () => {
    const bills = [
      '2026-05-03',
      '2026-05-05',
      '2026-05-07',
      '2026-05-08',
      '2026-05-09',
    ].map((date, index) => ({
      merchant: `Bill ${index + 1}`,
      amount: 20 + index,
      currency: 'SGD',
      estimatedDueDate: date,
      confidence: 'high',
      balanceCheck: 'sufficient_funds',
    }));

    render(
      React.createElement(FinancialInsightCardsComponent, {
        upcomingBills: {
          count: bills.length,
          totalDue: 110,
          currency: 'SGD',
          upcomingBills: bills,
        },
      })
    );

    expect(screen.queryByText('2026-05-09')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /view full schedule/i }));

    expect(screen.getByText('2026-05-09')).toBeTruthy();
    expect(screen.getByRole('button', { name: /hide schedule/i })).toBeTruthy();
  });
});
