import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import React from 'react';
import FinancialAssistantChat from '../FinancialAssistantChat.jsx';

const FinancialAssistantChatComponent = FinancialAssistantChat.default || FinancialAssistantChat;

describe('FinancialAssistantChat', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  test('sends a clickable prompt and renders the assistant answer', async () => {
    const onResult = jest.fn();
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-001',
        answer: 'Your spending increased because Travel and Dining rose.',
        toolCalls: [{ name: 'ais_analyze_spending_change', capability: 'AIS', status: 'success' }],
        ais: {
          transactions: [
            {
              id: 'txn-1',
              merchant: 'Singapore Airlines',
              date: '2026-04-15',
              category: 'Travel',
              amount: 386,
              currency: 'SGD',
            },
          ],
        },
        insights: [{ type: 'spending_increase', category: 'Travel', changeAmount: 591, currency: 'SGD' }],
        suggestedActions: [],
      })
    );
    render(React.createElement(FinancialAssistantChatComponent, { onResult, sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'Why did I spend more this month?' }));

    await waitFor(() => {
      expect(screen.getByText('Your spending increased because Travel and Dining rose.')).toBeTruthy();
    });

    expect(sendMessage).toHaveBeenCalledWith('Why did I spend more this month?', null);
    expect(screen.getByText('Agent Workbench')).toBeTruthy();
    expect(screen.queryByText(/Called ais_analyze_spending_change/)).toBeNull();
    expect(screen.getByText('Recent transactions')).toBeTruthy();
    expect(screen.getByText('Singapore Airlines')).toBeTruthy();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: 'Your spending increased because Travel and Dining rose.',
      })
    );
  });

  test('renders structured bill response and clears chat', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-002',
        answer: 'You have 2 bills due this week totaling SGD 42.00.',
        toolCalls: [{ name: 'ais_detect_upcoming_bills', capability: 'AIS', status: 'success' }],
        ais: {
          upcomingBills: {
            upcomingBills: [
              {
                merchant: 'Netflix',
                category: 'Subscription',
                amount: 21,
                currency: 'SGD',
                estimatedDueDate: '2026-05-05',
                confidence: 'high',
                balanceCheck: 'sufficient_funds',
              },
              {
                merchant: 'Spotify',
                category: 'Subscription',
                amount: 21,
                currency: 'SGD',
                estimatedDueDate: '2026-05-07',
                confidence: 'high',
                balanceCheck: 'sufficient_funds',
              },
            ],
          },
        },
        insights: [],
        suggestedActions: [],
      })
    );
    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'What bills do I need to pay this week?' }));

    await waitFor(() => {
      expect(screen.getByText('Bills due this week')).toBeTruthy();
      expect(screen.getByText('2 bills')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /view all bills/i }));

    expect(screen.getByText('Merchant')).toBeTruthy();
    expect(screen.getByText('Netflix')).toBeTruthy();
    expect(screen.getByText('Spotify')).toBeTruthy();
    expect(screen.getByRole('button', { name: /hide bills/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /clear chat/i }));

    expect(screen.getAllByText(/Ask anything about/).length).toBeGreaterThan(0);
    expect(screen.queryByText('2 bills')).toBeNull();
  });

  test('hides sample questions and persists preference', async () => {
    const sendMessage = jest.fn();
    const { unmount } = render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    expect(screen.getByRole('button', { name: 'Why did I spend more this month?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Hide/i }));

    expect(screen.queryByRole('button', { name: 'Why did I spend more this month?' })).toBeNull();
    expect(window.localStorage.getItem('financialAssistant.showSamplePrompts')).toBe('false');

    unmount();
    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    expect(screen.queryByRole('button', { name: 'Why did I spend more this month?' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Show/i }));
    expect(screen.getByRole('button', { name: 'Why did I spend more this month?' })).toBeTruthy();
  });

  test('renders structured subscription response below the assistant answer', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-003',
        answer: 'I found 2 likely recurring payments. Subscription details are shown below.',
        toolCalls: [{ name: 'ais_detect_subscriptions', capability: 'AIS', status: 'success' }],
        ais: {
          subscriptions: {
            count: 2,
            monthlyTotal: 33.96,
            currency: 'SGD',
            subscriptions: [
              {
                merchant: 'Netflix',
                category: 'Subscription',
                amount: 21.98,
                currency: 'SGD',
                frequency: 'monthly',
                nextExpectedDate: '2026-05-05',
                confidence: 'high',
              },
              {
                merchant: 'Spotify',
                category: 'Subscription',
                amount: 11.98,
                currency: 'SGD',
                frequency: 'monthly',
                nextExpectedDate: '2026-05-07',
                confidence: 'high',
              },
            ],
          },
        },
        insights: [],
        suggestedActions: [],
      })
    );
    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'Which subscriptions am I paying for?' }));

    await waitFor(() => {
      expect(screen.getByText('Recurring subscriptions')).toBeTruthy();
      expect(screen.getByText('Netflix')).toBeTruthy();
      expect(screen.getByText('Spotify')).toBeTruthy();
      expect(screen.getByText('2 detected')).toBeTruthy();
    });
  });

  test('renders structured account balance response below the assistant answer', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-004',
        answer: 'I found 2 AIS accounts. Account details are shown below.',
        toolCalls: [
          { name: 'ais_list_accounts', capability: 'AIS', status: 'success' },
          { name: 'ais_get_balances', capability: 'AIS', status: 'success' },
        ],
        ais: {
          accounts: [
            {
              accountId: 'acc-everyday-001',
              name: 'Everyday Global Account',
              type: 'current',
              currency: 'SGD',
              availableBalance: 6120.45,
            },
            {
              accountId: 'acc-savings-001',
              name: 'Bonus Saver Account',
              type: 'savings',
              currency: 'SGD',
              availableBalance: 24850,
            },
          ],
          balances: [
            {
              accountId: 'acc-everyday-001',
              type: 'InterimAvailable',
              amount: 6120.45,
              currency: 'SGD',
              creditDebitIndicator: 'Credit',
            },
            {
              accountId: 'acc-savings-001',
              type: 'InterimAvailable',
              amount: 24850,
              currency: 'SGD',
              creditDebitIndicator: 'Credit',
            },
          ],
        },
        insights: [],
        suggestedActions: [],
      })
    );
    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'Can I afford my bills this week?' }));

    await waitFor(() => {
      expect(screen.getByText('AIS account balances')).toBeTruthy();
      expect(screen.getByText('Everyday Global Account')).toBeTruthy();
      expect(screen.getByText('Bonus Saver Account')).toBeTruthy();
      expect(screen.getByText('2 accounts')).toBeTruthy();
    });
  });

  test('renders PIS domestic payment consent details inside the chat response', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-005',
        answer: 'I prepared 2 domestic payment consent records for review. No payment has been executed.',
        toolCalls: [{ name: 'pis_prepare_domestic_payment_consent', capability: 'PIS', status: 'success' }],
        pis: {
          domesticPaymentConsents: [
            {
              consentId: 'dpc-netflix-2026-05-05',
              payee: 'Netflix',
              amount: 21.98,
              currency: 'SGD',
              dueDate: '2026-05-05',
              status: 'AWAU',
              scaRequired: true,
              executionStatus: 'Not Executed',
            },
            {
              consentId: 'dpc-spotify-2026-05-07',
              payee: 'Spotify',
              amount: 11.98,
              currency: 'SGD',
              dueDate: '2026-05-07',
              status: 'AWAU',
              scaRequired: true,
              executionStatus: 'Not Executed',
            },
          ],
        },
        safetyNotice: 'No payment has been executed.',
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'Prepare these payments for review.' }));

    await waitFor(() => {
      expect(screen.getByText('Domestic payment consent prepared')).toBeTruthy();
      expect(screen.getByText('Netflix')).toBeTruthy();
      expect(screen.getByText('Spotify')).toBeTruthy();
      expect(screen.getAllByText('AWAU').length).toBeGreaterThan(1);
      expect(screen.getAllByText('No payment has been executed.').length).toBeGreaterThan(0);
    });
  });

  test('renders editable PIS payment review and submits completed rows', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-006',
        answer: 'I prepared an editable PIS payment review table. No payment has been executed.',
        toolCalls: [{ name: 'pis_prepare_payment_review', capability: 'PIS', status: 'success' }],
        pis: {
          paymentReview: {
            status: 'INPUT_REQUIRED',
            rows: [
              {
                rowId: 'manual-payment-1',
                payee: '',
                amount: '',
                currency: 'SGD',
                dueDate: '',
                remittanceInformation: '',
                editableFields: ['payee', 'amount', 'dueDate', 'remittanceInformation'],
                missingFields: ['payee', 'amount'],
              },
            ],
            editableNotice: 'Payee, amount, due date, and remittance information are editable by the user before final confirmation.',
            submitAction: { label: 'Submit final confirmation' },
            safetyNotice: 'No payment has been executed.',
          },
        },
      })
    );
    const preparePaymentDrafts = jest.fn(() =>
      Promise.resolve({
        paymentDrafts: [],
        domesticPaymentConsents: [
          {
            consentId: 'dpc-manual-001',
            payee: 'SP Group Electricity',
            amount: 109.1,
            currency: 'SGD',
            dueDate: '2026-05-08',
            status: 'AWAU',
            scaRequired: true,
            executionStatus: 'Not Executed',
          },
        ],
        safetyNotice: 'No payment has been executed.',
      })
    );
    const onResult = jest.fn();

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage, preparePaymentDrafts, onResult }));

    fireEvent.click(screen.getByRole('button', { name: 'Prepare these payments for review.' }));

    await waitFor(() => {
      expect(screen.getByText('Editable PIS payment review')).toBeTruthy();
      expect(screen.getByRole('button', { name: /submit final confirmation/i }).disabled).toBe(true);
    });

    fireEvent.change(screen.getByLabelText('Payee for manual-payment-1'), { target: { value: 'SP Group Electricity' } });
    fireEvent.change(screen.getByLabelText('Amount for manual-payment-1'), { target: { value: '109.10' } });
    fireEvent.change(screen.getByLabelText('Due date for manual-payment-1'), { target: { value: '2026-05-08' } });

    fireEvent.click(screen.getByRole('button', { name: /submit final confirmation/i }));

    await waitFor(() => {
      expect(preparePaymentDrafts).toHaveBeenCalledWith([
        expect.objectContaining({
          merchant: 'SP Group Electricity',
          amount: 109.1,
          estimatedDueDate: '2026-05-08',
        }),
      ], 'immediate_domestic');
      expect(screen.getByText('Domestic payment consent prepared')).toBeTruthy();
      expect(screen.getByText('dpc-manual-001')).toBeTruthy();
    });
  });

  test('renders Agent Workbench payment type choices and submits a choice', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-008',
        answer: 'What kind of payment would you like to prepare? No payment has been executed.',
        toolCalls: [{ name: 'pis_start_payment_journey', capability: 'PIS', status: 'success' }],
        capabilityUsed: ['PIS'],
        pis: {
          paymentIntentState: {
            status: 'payment_type_required',
            missingDetails: ['paymentType'],
          },
        },
        agentWorkbench: {
          intent: { label: 'Prepare payment', confidence: 'high' },
          capability: { name: 'PIS', reason: 'PSD2 PIS is required for payment consent preparation.' },
          paymentJourney: {
            status: 'payment_type_required',
            missingFields: ['paymentType'],
            collectedFields: [{ label: 'Payee', value: 'mom' }],
            supportedPaymentTypes: [
              { value: 'immediate_domestic', label: 'Immediate domestic payment', description: 'One-time consent.' },
              { value: 'scheduled_domestic', label: 'Scheduled domestic payment', description: 'Future dated consent.' },
              { value: 'variable_recurring', label: 'Variable recurring payment', description: 'VRP consent with limits.' },
            ],
          },
          controlChecks: [
            { label: 'Payment execution blocked', status: 'passed', detail: 'Consent only.' },
          ],
          toolTrace: [
            { label: 'Start payment journey', toolName: 'pis_start_payment_journey', capability: 'PIS', status: 'success' },
          ],
          preparedResources: [],
        },
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.change(screen.getByPlaceholderText(/Ask about AIS insights/), { target: { value: 'i want to make a payment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send financial assistant message' }));

    await waitFor(() => {
      expect(screen.getByText('Agent Workbench')).toBeTruthy();
      expect(screen.getByText('Payment type not selected')).toBeTruthy();
      expect(screen.getByRole('button', { name: /Immediate domestic payment/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Immediate domestic payment/i }));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenLastCalledWith('Immediate domestic payment', 'conv-test-008');
    });
  });

  test('renders AIS consent card with Demo Bank redirect action', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-consent-001',
        answer: 'I need your AIS consent first.',
        toolCalls: [{ name: 'ais_start_consent_journey', capability: 'AIS', status: 'success' }],
        capabilityUsed: ['AIS'],
        agentWorkbench: {
          intent: { label: 'AIS consent required', confidence: 'high' },
          capability: { name: 'AIS', reason: 'AIS consent is required.' },
          consentJourney: {
            journeyId: 'journey-ais-001',
            type: 'AIS_CONSENT',
            status: 'redirect_ready',
            consentId: 'aac-001',
            consentStatus: 'AWAU',
            redirectUrl: '/mock-aspsp/authorize?journeyId=journey-ais-001&consentId=aac-001&state=state-001',
            conversationId: 'conv-consent-001',
            display: {
              description: 'To answer this, the assistant needs account information consent.',
              requestedPermissions: ['ReadAccountsBasic', 'ReadBalances', 'ReadTransactionsDetail'],
            },
            steps: [
              { label: 'Consent resource created', status: 'completed', detail: 'ConsentId: aac-001' },
              { label: 'Waiting for user authorisation', status: 'active', detail: 'Continue at Demo Bank' },
            ],
          },
          paymentJourney: { status: 'not_required' },
          controlChecks: [],
          toolTrace: [],
          preparedResources: [],
        },
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'What bills do I need to pay this week?' }));

    await waitFor(() => {
      expect(screen.getByText('AIS Consent Required')).toBeTruthy();
      expect(screen.getByText('Consent Journey')).toBeTruthy();
      expect(screen.getByRole('button', { name: /continue to demo bank/i })).toBeTruthy();
      expect(screen.getByText('Read Accounts Basic')).toBeTruthy();
    });
  });

  test('stages PIS consent journey from editable review table', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-pis-consent',
        answer: 'Review the payment details before consent authorisation.',
        toolCalls: [{ name: 'pis_prepare_payment_review', capability: 'PIS', status: 'success' }],
        pis: {
          paymentReview: {
            status: 'READY_FOR_CONFIRMATION',
            paymentType: 'immediate_domestic',
            paymentTypeLabel: 'Immediate domestic payment',
            rows: [
              {
                rowId: 'payment-row-1',
                payee: 'SP Group Electricity',
                amount: 109.1,
                currency: 'SGD',
                dueDate: '2026-05-08',
                remittanceInformation: 'Electricity bill May 2026',
                missingFields: [],
              },
            ],
            editableNotice: 'Payment details are editable.',
            submitAction: { label: 'Submit final confirmation' },
            safetyNotice: 'No payment has been executed.',
          },
          paymentIntentState: { paymentType: 'immediate_domestic' },
        },
      })
    );
    const startPISConsentJourney = jest.fn(() =>
      Promise.resolve({
        journeyId: 'journey-pis-001',
        type: 'PIS_CONSENT',
        status: 'redirect_ready',
        consentId: 'dpc-001',
        consentStatus: 'AWAU',
        redirectUrl: '/mock-aspsp/authorize?journeyId=journey-pis-001&consentId=dpc-001&state=state-002',
        conversationId: 'conv-pis-consent',
        display: {
          description: 'Authorise the prepared payment consent at Demo Bank.',
          paymentTypeLabel: 'Immediate domestic payment',
          paymentSummary: {
            total: 109.1,
            currency: 'SGD',
            safetyNotice: 'No payment has been executed.',
            payments: [
              {
                consentId: 'dpc-001',
                payee: 'SP Group Electricity',
                amount: 109.1,
                currency: 'SGD',
                dueDate: '2026-05-08',
                status: 'AWAU',
              },
            ],
          },
        },
        steps: [{ label: 'Consent resource created', status: 'completed', detail: 'ConsentId: dpc-001' }],
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage, startPISConsentJourney }));

    fireEvent.click(screen.getByRole('button', { name: 'Prepare these payments for review.' }));

    await waitFor(() => {
      expect(screen.getByText('Editable PIS payment review')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /submit final confirmation/i }));

    await waitFor(() => {
      expect(startPISConsentJourney).toHaveBeenCalledWith(expect.objectContaining({
        conversationId: 'conv-pis-consent',
        paymentType: 'immediate_domestic',
        payments: [expect.objectContaining({ creditorName: 'SP Group Electricity', amount: 109.1 })],
      }));
      expect(screen.getByText('Payment Consent Ready for Authorisation')).toBeTruthy();
      expect(screen.getByRole('button', { name: /authorise at demo bank/i })).toBeTruthy();
    });
  });

  test('restores chat state and appends resume-after-consent response', async () => {
    window.sessionStorage.setItem(
      'financialAssistant.chatState.v1',
      JSON.stringify({
        conversationId: 'conv-resume-001',
        messages: [{ sender: 'assistant', text: 'Stored chat message', time: '10:00 AM' }],
      })
    );
    const resumeAfterConsent = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-resume-001',
        answer: 'AIS consent authorised. I’ll continue with your request.',
        toolCalls: [{ name: 'ais_detect_upcoming_bills', capability: 'AIS', status: 'success' }],
        agentWorkbench: {
          intent: { label: 'Detect upcoming bills', confidence: 'high' },
          capability: { name: 'AIS', reason: 'AIS consent authorised.' },
          consentJourney: {
            journeyId: 'journey-ais-001',
            type: 'AIS_CONSENT',
            status: 'resumed',
            consentId: 'aac-001',
            consentStatus: 'AUTH',
            display: { requestedPermissions: [] },
            steps: [{ label: 'Workflow resumed', status: 'completed' }],
          },
          paymentJourney: { status: 'not_required' },
          controlChecks: [],
          toolTrace: [],
          preparedResources: [],
        },
      })
    );
    const onResumeHandled = jest.fn();

    render(React.createElement(FinancialAssistantChatComponent, {
      sendMessage: jest.fn(),
      resumeAfterConsent,
      resumeRequest: { conversationId: 'conv-resume-001', journeyId: 'journey-ais-001' },
      onResumeHandled,
    }));

    expect(screen.getByText('Stored chat message')).toBeTruthy();

    await waitFor(() => {
      expect(resumeAfterConsent).toHaveBeenCalledWith({ conversationId: 'conv-resume-001', journeyId: 'journey-ais-001' });
      expect(screen.getByText('AIS consent authorised. I’ll continue with your request.')).toBeTruthy();
      expect(onResumeHandled).toHaveBeenCalled();
    });
  });

  test('does not append duplicate resume-after-consent response for same journey', async () => {
    window.sessionStorage.setItem(
      'financialAssistant.chatState.v1',
      JSON.stringify({
        conversationId: 'conv-resume-dup',
        messages: [{ sender: 'assistant', text: 'Stored chat message', time: '10:00 AM' }],
      })
    );
    window.sessionStorage.setItem('financialAssistant.resumeHandled.conv-resume-dup:journey-dup', '1');
    const resumeAfterConsent = jest.fn();
    const onResumeHandled = jest.fn();

    render(React.createElement(FinancialAssistantChatComponent, {
      sendMessage: jest.fn(),
      resumeAfterConsent,
      resumeRequest: { conversationId: 'conv-resume-dup', journeyId: 'journey-dup' },
      onResumeHandled,
    }));

    await waitFor(() => {
      expect(onResumeHandled).toHaveBeenCalled();
    });
    expect(resumeAfterConsent).not.toHaveBeenCalled();
    expect(screen.getAllByText('Stored chat message')).toHaveLength(1);
  });

  test('renders General capability without PSD2 prefix', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-general',
        answer: 'I can help with AIS insights, PIS consent preparation, or general product questions.',
        toolCalls: [{ name: 'general_assistant_response', capability: 'General', status: 'success' }],
        capabilityUsed: ['General'],
        agentWorkbench: {
          intent: { label: 'General question', confidence: 'high' },
          capability: { name: 'General', reason: 'No AIS or PIS capability was required.' },
          paymentJourney: { status: 'not_required', missingFields: [], collectedFields: [], supportedPaymentTypes: [] },
          controlChecks: [],
          toolTrace: [
            { label: 'General assistant response', toolName: 'general_assistant_response', capability: 'General', status: 'success' },
          ],
          preparedResources: [],
        },
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.change(screen.getByPlaceholderText(/Ask about AIS insights/), { target: { value: 'who are you?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send financial assistant message' }));

    await waitFor(() => {
      expect(screen.getAllByText('General').length).toBeGreaterThan(0);
      expect(screen.queryByText('PSD2 General')).toBeNull();
    });
  });

  test('renders assistant markdown tables and blockquotes instead of raw pipe text', async () => {
    const sendMessage = jest.fn(() =>
      Promise.resolve({
        conversationId: 'conv-test-007',
        answer: [
          "Here's a summary:",
          '---',
          '### Payment Review',
          '| Field | Details |',
          '|---|---|',
          '| **Payee** | Mom |',
          '| **Amount** | 300.00 SGD |',
          '> ⚠️ **Important:** No payment has been executed.',
          '- Confirm and create the AWAU consent record?',
        ].join('\n'),
        toolCalls: [{ name: 'pis_prepare_payment_review', capability: 'PIS', status: 'success' }],
        pis: {},
      })
    );

    render(React.createElement(FinancialAssistantChatComponent, { sendMessage }));

    fireEvent.click(screen.getByRole('button', { name: 'Prepare these payments for review.' }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeTruthy();
      expect(screen.getByText('Field')).toBeTruthy();
      expect(screen.getByText('Mom')).toBeTruthy();
      expect(screen.queryByText('|---|---|')).toBeNull();
      expect(screen.getByText(/No payment has been executed/)).toBeTruthy();
    });
  });
});
