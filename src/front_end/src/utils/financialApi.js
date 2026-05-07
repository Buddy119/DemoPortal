import { API_BASE_URL } from './apiConfig.js';

const API_LOGS_ENABLED =
  (import.meta.env && import.meta.env.DEV) ||
  (import.meta.env && import.meta.env.VITE_API_LOGS === 'true');

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function parseBodyPreview(body) {
  if (!body || typeof body !== 'string') return undefined;
  try {
    const parsed = JSON.parse(body);
    return {
      ...parsed,
      message: parsed.message && parsed.message.length > 120
        ? `${parsed.message.slice(0, 120)}...`
        : parsed.message,
    };
  } catch {
    return '[non-json body]';
  }
}

function summarizeResponse(data) {
  if (!data || typeof data !== 'object') return data;
  return {
    keys: Object.keys(data),
    conversationId: data.conversationId,
    intent: data.intent,
    toolCalls: data.toolCalls?.map((call) => `${call.name}:${call.status}`),
    agentWorkbench: data.agentWorkbench
      ? {
          intent: data.agentWorkbench.intent?.label,
          capability: data.agentWorkbench.capability?.name,
      paymentStatus: data.agentWorkbench.paymentJourney?.status,
      paymentType: data.agentWorkbench.paymentJourney?.paymentType,
      consentStatus: data.agentWorkbench.consentJourney?.consentStatus,
      consentType: data.agentWorkbench.consentJourney?.type,
    }
      : undefined,
    capabilities: data.capabilityUsed,
    warnings: data.warnings,
    counts: {
      accounts: data.accounts?.length || data.ais?.accounts?.length || 0,
      transactions: data.transactions?.length || data.ais?.transactions?.length || 0,
      upcomingBills: data.upcomingBills?.length || data.ais?.upcomingBills?.upcomingBills?.length || 0,
      paymentReviewRows: data.paymentReview?.rows?.length || data.pis?.paymentReview?.rows?.length || 0,
      paymentDrafts: data.paymentDrafts?.length || 0,
      domesticPaymentConsents: data.pis?.domesticPaymentConsents?.length || 0,
      consentJourney: (data.consentJourney || data.agentWorkbench?.consentJourney) ? 1 : 0,
    },
  };
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method || 'GET';
  const startedAt = now();

  if (API_LOGS_ENABLED) {
    console.groupCollapsed(`[financialApi] ${method} ${path}`);
    console.info('request', {
      url,
      method,
      body: parseBodyPreview(options.body),
    });
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    if (API_LOGS_ENABLED) {
      console.error('response_error', {
        status: response.status,
        statusText: response.statusText,
        durationMs: Math.round(now() - startedAt),
      });
      console.groupEnd();
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (API_LOGS_ENABLED) {
    console.info('response', {
      status: response.status,
      durationMs: Math.round(now() - startedAt),
      summary: summarizeResponse(data),
    });
    console.debug('response_payload', data);
    console.groupEnd();
  }
  return data;
}

export function fetchAccounts(userId = 'demo-user-001') {
  return request(`/api/accounts?userId=${encodeURIComponent(userId)}`);
}

export function fetchTransactions({ from, to, userId = 'demo-user-001' } = {}) {
  const params = new URLSearchParams({ userId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request(`/api/transactions?${params.toString()}`);
}

export function fetchSpendingComparison({
  currentMonth = '2026-04',
  previousMonth = '2026-03',
  userId = 'demo-user-001',
} = {}) {
  const params = new URLSearchParams({ currentMonth, previousMonth, userId });
  return request(`/api/insights/spending-comparison?${params.toString()}`);
}

export function fetchUpcomingBills(userId = 'demo-user-001') {
  return request(`/api/insights/upcoming-bills?userId=${encodeURIComponent(userId)}`);
}

export function sendAssistantMessage(message, conversationId, userId = 'demo-user-001') {
  return request('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, userId, conversationId }),
  });
}

export function preparePaymentDrafts(bills, paymentType = 'immediate_domestic', userId = 'demo-user-001') {
  return request('/api/payment-drafts', {
    method: 'POST',
    body: JSON.stringify({ userId, bills, paymentType }),
  });
}

export function submitImmediateMockPayment(payment, userId = 'demo-user-001') {
  return request('/obie/open-banking/v4.0/pisp/domestic-payments', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payment }),
  });
}

export function submitScheduledMockPayment(payment, userId = 'demo-user-001') {
  return request('/obie/open-banking/v4.0/pisp/domestic-scheduled-payments', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payment }),
  });
}

export function submitVariableRecurringMockPayment(payment, userId = 'demo-user-001') {
  return request('/obie/open-banking/v4.0/pisp/domestic-vrps', {
    method: 'POST',
    body: JSON.stringify({ userId, ...payment }),
  });
}

export function startAisConsentJourney({
  conversationId,
  originalMessage,
  permissions,
  userId = 'demo-user-001',
}) {
  return request('/api/psd2/ais/consent/start', {
    method: 'POST',
    body: JSON.stringify({ conversationId, userId, originalMessage, permissions }),
  });
}

export function startPisConsentJourney({
  conversationId,
  paymentType = 'immediate_domestic',
  payment,
  payments,
  userId = 'demo-user-001',
}) {
  return request('/api/psd2/pis/consent/start', {
    method: 'POST',
    body: JSON.stringify({ conversationId, userId, paymentType, payment, payments }),
  });
}

export function fetchConsentJourney(journeyId) {
  return request(`/api/psd2/consent-journeys/${encodeURIComponent(journeyId)}`);
}

export function authorizeMockAspsp({ journeyId, consentId, state, decision }) {
  return request('/api/mock-aspsp/authorize', {
    method: 'POST',
    body: JSON.stringify({ journeyId, consentId, state, decision }),
  });
}

export function handleOpenBankingCallback({ code, state }) {
  return request('/api/open-banking/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
}

export function resumeAfterConsent({ conversationId, journeyId, userId = 'demo-user-001' }) {
  return request('/api/assistant/resume-after-consent', {
    method: 'POST',
    body: JSON.stringify({ conversationId, journeyId, userId }),
  });
}
