import { useEffect, useRef, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  CommandLineIcon,
  CpuChipIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ReceiptPercentIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const DEMO_PROMPTS = [
  { label: 'Why did I spend more this month?', Icon: UserIcon },
  { label: 'Which subscriptions am I paying for?', Icon: ArrowTrendingUpIcon },
  { label: 'What bills do I need to pay this week?', Icon: ReceiptPercentIcon },
  { label: 'Prepare these payments for review.', Icon: ArrowsRightLeftIcon },
  { label: 'Show my recent transactions.', Icon: MagnifyingGlassIcon },
  { label: 'Can I afford my bills this week?', Icon: ScaleIcon },
];

const PAYMENT_TYPE_LABELS = {
  immediate_domestic: 'Immediate domestic payment',
  scheduled_domestic: 'Scheduled domestic payment',
  variable_recurring: 'Variable recurring payment',
};

const RESOURCE_TYPE_LABELS = {
  'domestic-payment-consent': 'Domestic payment consent',
  'domestic-scheduled-payment-consent': 'Domestic scheduled payment consent',
  'domestic-vrp-consent': 'Domestic VRP consent',
};

const CHAT_STORAGE_KEY = 'financialAssistant.chatState.v1';
const RESUME_MARKER_PREFIX = 'financialAssistant.resumeHandled.';
const PROMPTS_VISIBILITY_KEY = 'financialAssistant.showSamplePrompts';

function loadStoredChatState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredChatState(payload) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredChatState() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
}

function resumeMarkerKey(resumeKey) {
  return `${RESUME_MARKER_PREFIX}${resumeKey}`;
}

function hasHandledResume(resumeKey) {
  if (typeof window === 'undefined' || !resumeKey) return false;
  return window.sessionStorage.getItem(resumeMarkerKey(resumeKey)) === '1';
}

function markResumeHandled(resumeKey) {
  if (typeof window === 'undefined' || !resumeKey) return;
  window.sessionStorage.setItem(resumeMarkerKey(resumeKey), '1');
}

function unmarkResumeHandled(resumeKey) {
  if (typeof window === 'undefined' || !resumeKey) return;
  window.sessionStorage.removeItem(resumeMarkerKey(resumeKey));
}

function clearResumeMarkers() {
  if (typeof window === 'undefined') return;
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith(RESUME_MARKER_PREFIX))
    .forEach((key) => window.sessionStorage.removeItem(key));
}

function loadPromptVisibility() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(PROMPTS_VISIBILITY_KEY) !== 'false';
}

function savePromptVisibility(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROMPTS_VISIBILITY_KEY, value ? 'true' : 'false');
}

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function currentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AssistantAvatar() {
  return (
    <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white text-red-600 shadow-lg flex items-center justify-center">
      <div className="flex gap-0.5">
        <span className="h-3 w-3 rotate-45 bg-red-600 block" />
        <span className="h-3 w-3 rotate-45 bg-red-600 block" />
      </div>
    </div>
  );
}

function renderInlineMarkdown(text) {
  return String(text || '')
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="rounded bg-[#0e1829] px-1.5 py-0.5 text-sm text-slate-100">{part.slice(1, -1)}</code>;
      }
      return part;
    });
}

function isMarkdownTableLine(line) {
  return line.startsWith('|') && line.endsWith('|') && line.includes('|');
}

function isMarkdownTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
}

function parseMarkdownTableLine(line) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function AssistantMarkdown({ children }) {
  const lines = String(children || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const blocks = [];
  let listItems = [];
  let tableLines = [];

  const flushList = () => {
    if (!listItems.length) return;
    const currentItems = listItems;
    listItems = [];
    blocks.push(
      <ul key={`list-${blocks.length}`} className="mb-3 list-disc space-y-1 pl-5">
        {currentItems.map((item, index) => (
          <li key={index} className="pl-1">{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  };

  const flushTable = () => {
    if (!tableLines.length) return;
    const rows = tableLines
      .filter((line) => !isMarkdownTableSeparator(line))
      .map(parseMarkdownTableLine)
      .filter((cells) => cells.some(Boolean));
    tableLines = [];
    if (!rows.length) return;
    const [headers, ...bodyRows] = rows;
    blocks.push(
      <div key={`table-${blocks.length}`} className="my-4 max-w-3xl overflow-hidden rounded-lg border border-[#263752]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#17243a] text-slate-300">
              <tr>
                {headers.map((header, index) => (
                  <th key={`${header}-${index}`} className="px-4 py-3 text-left font-medium">
                    {renderInlineMarkdown(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263752]">
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-[#101b2d]/70">
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-slate-200">
                      {renderInlineMarkdown(row[cellIndex] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  lines.forEach((line) => {
    if (isMarkdownTableLine(line)) {
      flushList();
      tableLines.push(line);
      return;
    }
    flushTable();

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      return;
    }
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      listItems.push(orderedMatch[1]);
      return;
    }
    flushList();

    if (line.startsWith('### ')) {
      blocks.push(<h5 key={blocks.length} className="mb-2 mt-4 text-base font-semibold leading-snug text-slate-100">{renderInlineMarkdown(line.slice(4))}</h5>);
    } else if (line.startsWith('## ')) {
      blocks.push(<h4 key={blocks.length} className="mb-2 mt-4 text-lg font-semibold leading-snug text-white">{renderInlineMarkdown(line.slice(3))}</h4>);
    } else if (line.startsWith('# ')) {
      blocks.push(<h3 key={blocks.length} className="mb-3 text-xl font-semibold leading-snug text-white">{renderInlineMarkdown(line.slice(2))}</h3>);
    } else if (/^-{3,}$/.test(line)) {
      blocks.push(<hr key={blocks.length} className="my-4 border-[#263752]" />);
    } else if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={blocks.length} className="my-4 border-l-4 border-yellow-400/50 bg-yellow-500/10 px-4 py-3 text-yellow-50">
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
    } else {
      blocks.push(<p key={blocks.length} className="mb-3 last:mb-0">{renderInlineMarkdown(line)}</p>);
    }
  });
  flushTable();
  flushList();

  return <div className="max-w-3xl text-sm leading-7 text-slate-200 md:text-base">{blocks}</div>;
}

function BillsResultCard({ result }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bills = result?.ais?.upcomingBills?.upcomingBills || result?.upcomingBills || [];
  if (!bills.length) return null;
  const highest = [...bills].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const total = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const allCovered = bills.every((bill) => bill.balanceCheck === 'sufficient_funds');
  const currency = bills[0]?.currency || 'SGD';

  return (
    <div className="mt-5 max-w-3xl rounded-lg border border-[#263752] bg-[#111d30]/80 p-5 shadow-inner">
      <div className="flex items-center justify-between border-b border-[#263752] pb-4">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-slate-100">Bills due this week</span>
        </div>
        <span className="text-sm text-slate-400">{bills.length} bills</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5">
        <div>
          <p className="text-sm text-slate-400">Total amount</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatMoney(total, currency)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <CheckCircleIcon className={`h-5 w-5 ${allCovered ? 'text-emerald-500' : 'text-yellow-400'}`} />
            {allCovered ? 'All covered by available balance' : 'Some bills need review'}
          </p>
        </div>
        <div className="border-t border-[#263752] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-sm text-slate-400">Highest bill</p>
          <p className="mt-2 text-2xl font-semibold text-white">{highest.category || highest.merchant}</p>
          <p className="mt-2 text-sm text-slate-300">
            {formatMoney(highest.amount, highest.currency)} <span className="text-slate-500">·</span> Due {highest.estimatedDueDate}
          </p>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((value) => !value)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300"
      >
        {isExpanded ? 'Hide bills' : 'View all bills'}
        <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      {isExpanded ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#263752]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#17243a] text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Merchant</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Due date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263752]">
                {bills.map((bill) => (
                  <tr key={`${bill.merchant}-${bill.estimatedDueDate}`} className="bg-[#101b2d]/70">
                    <td className="px-4 py-3 font-medium text-slate-100">{bill.merchant}</td>
                    <td className="px-4 py-3 text-slate-300">{bill.category || 'Recurring bill'}</td>
                    <td className="px-4 py-3 text-slate-300">{bill.estimatedDueDate}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {bill.balanceCheck === 'sufficient_funds' ? 'Covered' : 'Review'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-100">
                      {formatMoney(bill.amount, bill.currency || currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountBalancesResultCard({ result }) {
  const accounts = result?.ais?.accounts || result?.accounts || [];
  const balances = result?.ais?.balances || result?.balances || [];
  if (!accounts.length && !balances.length) return null;

  const balanceByAccountId = new Map(
    balances.map((balance) => [balance.accountId, balance])
  );
  const rows = accounts.length
    ? accounts.map((account) => {
        const balance = balanceByAccountId.get(account.accountId);
        return {
          id: account.accountId,
          name: account.name,
          type: account.type,
          currency: balance?.currency || account.currency || 'SGD',
          amount: balance?.amount ?? account.availableBalance ?? account.balance,
          status: account.raw?.Status || 'Enabled',
        };
      })
    : balances.map((balance) => ({
        id: balance.accountId,
        name: balance.accountId,
        type: balance.type,
        currency: balance.currency || 'SGD',
        amount: balance.amount,
        status: balance.creditDebitIndicator || 'Available',
      }));
  const currency = rows[0]?.currency || 'SGD';
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <div className="mt-5 max-w-3xl overflow-hidden rounded-lg border border-[#263752] bg-[#111d30]/80 shadow-inner">
      <div className="flex items-center justify-between border-b border-[#263752] px-5 py-4">
        <div>
          <span className="font-semibold text-slate-100">AIS account balances</span>
          <p className="mt-1 text-sm text-slate-400">Total available {formatMoney(total, currency)}</p>
        </div>
        <span className="text-sm text-slate-400">{rows.length} accounts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#17243a] text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Account</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Available balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263752]">
            {rows.map((row) => (
              <tr key={row.id} className="bg-[#101b2d]/70">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-100">{row.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.id}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-300">{row.type}</td>
                <td className="px-4 py-3 text-slate-300">{row.status}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-100">
                  {formatMoney(row.amount, row.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConsentJourneyCard({ result, onRedirect }) {
  const journey = result?.agentWorkbench?.consentJourney || result?.consentJourney;
  if (!journey) return null;
  const isPis = journey.type === 'PIS_CONSENT';
  const display = journey.display || {};
  const paymentSummary = display.paymentSummary || {};
  const payments = paymentSummary.payments || [];
  const permissions = display.requestedPermissions || [];
  const canRedirect = journey.redirectUrl && !['authorised', 'rejected', 'resumed'].includes(journey.status);

  return (
    <div className="mt-5 max-w-3xl overflow-hidden rounded-lg border border-sky-400/30 bg-[#0c1a2e]/90 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#263752] px-5 py-4">
        <div>
          <p className="font-semibold text-slate-100">
            {isPis ? 'Payment Consent Ready for Authorisation' : 'AIS Consent Required'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {display.description || 'Continue to Demo Bank to authorise this consent.'}
          </p>
        </div>
        <span className="rounded bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">
          {journey.consentStatus}
        </span>
      </div>

      <div className="px-5 py-4 text-sm text-slate-300">
        {isPis ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p>Payment Type<br /><span className="font-medium text-white">{display.paymentTypeLabel || humanizeLabel(display.paymentType)}</span></p>
              <p>Total<br /><span className="font-medium text-white">{formatMoney(paymentSummary.total, paymentSummary.currency || 'SGD')}</span></p>
            </div>
            {payments.slice(0, 4).map((payment) => (
              <div key={payment.consentId} className="rounded border border-[#263752] bg-[#101b2d]/80 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{payment.payee}</p>
                    <p className="mt-1 text-xs text-slate-500">{payment.consentId}</p>
                  </div>
                  <p className="font-semibold text-slate-100">{formatMoney(payment.amount, payment.currency || paymentSummary.currency || 'SGD')}</p>
                </div>
                {payment.dueDate ? <p className="mt-2 text-xs text-slate-400">Due {payment.dueDate}</p> : null}
              </div>
            ))}
            <p className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 font-medium text-yellow-100">
              {paymentSummary.safetyNotice || 'No payment has been executed.'}
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-slate-100">Requested access</p>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {permissions.map((permission) => (
                <li key={permission} className="rounded border border-[#263752] bg-[#101b2d]/80 px-3 py-2 text-sm">
                  {humanizeLabel(permission)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#263752] px-5 py-4">
        <p className="text-xs text-slate-500">
          Consent {journey.consentId} · {journey.status?.replaceAll('_', ' ')}
        </p>
        {canRedirect ? (
          <button
            type="button"
            onClick={() => onRedirect?.(journey)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            {isPis ? 'Authorise at Demo Bank' : 'Continue to Demo Bank'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentReviewResultCard({ result, preparePaymentDrafts, startPISConsentJourney, onSubmitResult, onRedirect }) {
  const review = result?.pis?.paymentReview || result?.paymentReview;
  const [rows, setRows] = useState(review?.rows || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState('');

  if (!review) return null;

  const updateRow = (rowId, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              [field]: field === 'amount' ? value : value,
            }
          : row
      )
    );
  };

  const normalizedRows = rows.map((row) => ({
    ...row,
    amount: row.amount === '' || row.amount === null || row.amount === undefined ? '' : row.amount,
    missingFields: [
      !String(row.payee || '').trim() ? 'payee' : null,
      row.amount === '' || row.amount === null || row.amount === undefined || Number.isNaN(Number(row.amount)) ? 'amount' : null,
    ].filter(Boolean),
  }));
  const canSubmit = normalizedRows.length > 0 && normalizedRows.every((row) => row.missingFields.length === 0);

  const submitReview = async () => {
    if ((!preparePaymentDrafts && !startPISConsentJourney) || !canSubmit || isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const payments = normalizedRows.map((row) => ({
        creditorName: row.payee,
        merchant: row.payee,
        amount: Number(row.amount),
        currency: row.currency || 'SGD',
        dueDate: row.dueDate || undefined,
        estimatedDueDate: row.dueDate || undefined,
        category: row.category || 'Payment',
        reference: row.remittanceInformation || undefined,
        remittanceInformation: row.remittanceInformation || undefined,
      }));
      const paymentType = review.paymentType || result?.pis?.paymentIntentState?.paymentType || 'immediate_domestic';
      let mergedResult;
      if (startPISConsentJourney) {
        const journey = await startPISConsentJourney({
          conversationId: result.conversationId,
          paymentType,
          payments,
        });
        mergedResult = {
          ...result,
          consentJourney: journey,
          safetyNotice: journey.display?.paymentSummary?.safetyNotice || result.safetyNotice,
          agentWorkbench: {
            ...(result.agentWorkbench || {}),
            consentJourney: journey,
          },
          pis: {
            ...(result.pis || {}),
            paymentIntentState: {
              ...(result.pis?.paymentIntentState || {}),
              status: 'consent_staged',
              paymentType,
              paymentTypeLabel: PAYMENT_TYPE_LABELS[paymentType] || review.paymentTypeLabel,
            },
          },
        };
      } else {
        const draftResult = await preparePaymentDrafts(payments, paymentType);
        mergedResult = {
          ...result,
          paymentDrafts: draftResult.paymentDrafts || [],
          safetyNotice: draftResult.safetyNotice || result.safetyNotice,
          pis: {
            ...(result.pis || {}),
            domesticPaymentConsents: draftResult.domesticPaymentConsents || [],
            paymentIntentState: {
              ...(result.pis?.paymentIntentState || {}),
              status: 'consent_prepared',
              paymentType,
              paymentTypeLabel: PAYMENT_TYPE_LABELS[paymentType] || review.paymentTypeLabel,
              preparedResources: (draftResult.domesticPaymentConsents || []).map((consent) => ({
                resourceType: consent.resourceType || 'domestic-payment-consent',
                resourceId: consent.consentId,
                status: consent.status || 'AWAU',
                statusLabel: 'AWAU - awaiting PSU authorisation',
              })),
            },
          },
        };
      }
      setSubmittedResult(mergedResult);
      onSubmitResult?.(mergedResult);
    } catch (err) {
      setError(err.message || 'Failed to submit PIS review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-5 w-full max-w-full overflow-hidden rounded-lg border border-red-500/30 bg-red-950/10 shadow-inner">
      <div className="flex items-start justify-between gap-4 border-b border-red-500/20 px-5 py-4">
        <div>
          <p className="font-semibold text-slate-100">Editable PIS payment review</p>
          <p className="mt-1 text-sm text-slate-400">
            {normalizedRows.length} row(s) · {review.status === 'READY_FOR_CONFIRMATION' ? 'Ready for user confirmation' : 'Manual input required'}
          </p>
          {review.paymentTypeLabel ? <p className="mt-1 text-xs text-red-200">{review.paymentTypeLabel}</p> : null}
        </div>
        <span className="rounded bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">
          {review.status}
        </span>
      </div>

      <div className="px-5 py-4 text-sm text-slate-300">
        <p>{review.editableNotice || 'All payment details are editable by the user before final confirmation.'}</p>
        <p className="mt-2 text-yellow-100">{review.safetyNotice || 'No payment has been executed.'}</p>
      </div>

      <div className="space-y-3 border-y border-red-500/20 px-5 py-4">
        {normalizedRows.map((row, index) => (
          <div key={row.rowId} className="rounded-lg border border-[#263752] bg-[#101b2d]/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-100">Payment row {index + 1}</p>
              {row.missingFields.length ? (
                <span className="rounded bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold text-yellow-100">
                  Input required
                </span>
              ) : (
                <span className="rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Ready
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-xs font-medium text-slate-400">
                Payee
                <input
                  aria-label={`Payee for ${row.rowId}`}
                  value={row.payee || ''}
                  onChange={(event) => updateRow(row.rowId, 'payee', event.target.value)}
                  placeholder="Required"
                  className="mt-1 w-full rounded border border-[#33445f] bg-[#0e1829] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-red-400 focus:outline-none"
                />
                {row.missingFields.includes('payee') ? <span className="mt-1 block text-xs text-yellow-200">Required</span> : null}
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Amount
                <div className="mt-1 flex rounded border border-[#33445f] bg-[#0e1829] focus-within:border-red-400">
                  <span className="flex items-center border-r border-[#33445f] px-3 text-xs text-slate-500">{row.currency || 'SGD'}</span>
                  <input
                    aria-label={`Amount for ${row.rowId}`}
                    value={row.amount}
                    onChange={(event) => updateRow(row.rowId, 'amount', event.target.value)}
                    placeholder="Required"
                    inputMode="decimal"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
                {row.missingFields.includes('amount') ? <span className="mt-1 block text-xs text-yellow-200">Required</span> : null}
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Due date
                <input
                  aria-label={`Due date for ${row.rowId}`}
                  value={row.dueDate || ''}
                  onChange={(event) => updateRow(row.rowId, 'dueDate', event.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded border border-[#33445f] bg-[#0e1829] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-red-400 focus:outline-none"
                />
              </label>
              <label className="block text-xs font-medium text-slate-400">
                Remittance
                <input
                  aria-label={`Remittance for ${row.rowId}`}
                  value={row.remittanceInformation || ''}
                  onChange={(event) => updateRow(row.rowId, 'remittanceInformation', event.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded border border-[#33445f] bg-[#0e1829] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-red-400 focus:outline-none"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 px-5 py-4">
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="button"
          disabled={!canSubmit || isSubmitting || (!preparePaymentDrafts && !startPISConsentJourney)}
          onClick={submitReview}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : review.submitAction?.label || 'Submit final confirmation'}
        </button>
        <p className="text-xs text-slate-500">
          Submit stages an AWAU consent and redirects to Demo Bank for authorisation. No payment has been executed.
        </p>
      </div>

      {submittedResult?.consentJourney ? (
        <ConsentJourneyCard result={submittedResult} onRedirect={onRedirect} />
      ) : submittedResult ? (
        <PaymentDraftResultCard result={submittedResult} />
      ) : null}
    </div>
  );
}

function PaymentDraftResultCard({ result }) {
  const drafts = result?.pis?.domesticPaymentConsents?.length
    ? result.pis.domesticPaymentConsents
    : result?.domesticPaymentConsents?.length
      ? result.domesticPaymentConsents
      : result?.paymentDrafts || [];
  if (!drafts.length) return null;
  const total = drafts.reduce((sum, draft) => sum + Number(draft.amount || 0), 0);
  const currency = drafts[0]?.currency || 'SGD';
  const rows = drafts.map((draft) => ({
    id: draft.consentId || draft.id || `${draft.payee || draft.merchant}-${draft.dueDate || draft.estimatedDueDate}`,
    payee: draft.payee || draft.merchant || 'Payment consent',
    amount: draft.amount,
    currency: draft.currency || currency,
    dueDate: draft.dueDate || draft.estimatedDueDate || draft.requestedExecutionDate || 'Review',
    status: draft.status || 'AWAU',
    resourceType: draft.resourceType || 'domestic-payment-consent',
    scaRequired: draft.scaRequired ?? true,
    executionStatus: draft.executionStatus || 'Not Executed',
  }));
  const primaryResourceType = rows[0]?.resourceType || 'domestic-payment-consent';
  const title = RESOURCE_TYPE_LABELS[primaryResourceType] || 'PIS payment consent';

  return (
    <div className="mt-5 w-full max-w-full overflow-hidden rounded-lg border border-red-500/30 bg-red-950/10 shadow-inner">
      <div className="flex items-center justify-between gap-4 border-b border-red-500/20 px-5 py-4">
        <div>
          <p className="font-semibold text-slate-100">{title} prepared</p>
          <p className="mt-1 text-sm text-slate-400">{drafts.length} consents · {formatMoney(total, currency)}</p>
        </div>
        <span className="rounded bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">AWAU</span>
      </div>
      <div className="grid grid-cols-1 gap-3 px-5 py-4 text-sm text-slate-300 sm:grid-cols-2">
        <p>Review Required: <span className="font-medium text-white">Yes</span></p>
        <p>SCA Required: <span className="font-medium text-white">Yes</span></p>
        <p>Execution Status: <span className="font-medium text-white">Not Executed</span></p>
        <p>Status: <span className="font-medium text-white">Awaiting PSU authorisation</span></p>
      </div>

      <div className="space-y-3 border-y border-red-500/20 px-5 py-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-[#263752] bg-[#101b2d]/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-100">{row.payee}</p>
                <p className="mt-1 break-all text-xs text-slate-500">{row.id}</p>
              </div>
              <span className="shrink-0 rounded bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-200">
                {row.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <p className="text-slate-400">Due date<br /><span className="font-medium text-slate-100">{row.dueDate}</span></p>
              <p className="text-slate-400">Execution<br /><span className="font-medium text-slate-100">{row.executionStatus}</span></p>
              <p className="text-slate-400">Amount<br /><span className="font-medium text-slate-100">{formatMoney(row.amount, row.currency)}</span></p>
            </div>
            {row.scaRequired ? <p className="mt-3 text-xs text-slate-500">SCA required</p> : null}
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        <p className="rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm font-medium text-yellow-100">
          {result.safetyNotice || 'No payment has been executed.'}
        </p>
      </div>
    </div>
  );
}

function SubscriptionsResultCard({ result }) {
  const subscriptionResult = result?.ais?.subscriptions;
  const subscriptions = subscriptionResult?.subscriptions || result?.subscriptions || [];
  if (!subscriptions.length) return null;
  const currency = subscriptionResult?.currency || subscriptions[0]?.currency || 'SGD';
  const monthlyTotal = subscriptionResult?.monthlyTotal
    ?? subscriptions.reduce((sum, subscription) => sum + Number(subscription.amount || 0), 0);

  return (
    <div className="mt-5 max-w-3xl overflow-hidden rounded-lg border border-[#263752] bg-[#111d30]/80 shadow-inner">
      <div className="flex items-center justify-between border-b border-[#263752] px-5 py-4">
        <div>
          <span className="font-semibold text-slate-100">Recurring subscriptions</span>
          <p className="mt-1 text-sm text-slate-400">Estimated monthly total {formatMoney(monthlyTotal, currency)}</p>
        </div>
        <span className="text-sm text-slate-400">{subscriptions.length} detected</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#17243a] text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Merchant</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Next expected</th>
              <th className="px-4 py-3 text-left font-medium">Confidence</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263752]">
            {subscriptions.map((subscription) => (
              <tr key={`${subscription.merchant}-${subscription.nextExpectedDate}`} className="bg-[#101b2d]/70">
                <td className="px-4 py-3 font-medium text-slate-100">{subscription.merchant}</td>
                <td className="px-4 py-3 text-slate-300">{subscription.category}</td>
                <td className="px-4 py-3 text-slate-300">{subscription.nextExpectedDate}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {subscription.confidence || 'review'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-100">
                  {formatMoney(subscription.amount, subscription.currency || currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsResultCard({ result }) {
  const transactions = result?.ais?.transactions || result?.transactions || [];
  if (!transactions.length) return null;
  const visibleTransactions = transactions.slice(0, 8);
  const countLabel = transactions.length > visibleTransactions.length
    ? `${visibleTransactions.length} of ${transactions.length}`
    : `${transactions.length}`;

  return (
    <div className="mt-5 max-w-3xl overflow-hidden rounded-lg border border-[#263752] bg-[#111d30]/80 shadow-inner">
      <div className="flex items-center justify-between border-b border-[#263752] px-5 py-4">
        <span className="font-semibold text-slate-100">Recent transactions</span>
        <span className="text-sm text-slate-400">{countLabel} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#17243a] text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Merchant</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263752]">
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id} className="bg-[#101b2d]/70">
                <td className="px-4 py-3 text-slate-100">{transaction.merchant}</td>
                <td className="px-4 py-3 text-slate-300">{transaction.date}</td>
                <td className="px-4 py-3 text-slate-300">{transaction.category}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-100">
                  {formatMoney(transaction.amount, transaction.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusTone(status) {
  if (status === 'failed' || status === 'blocked') return 'text-red-300 bg-red-500/10';
  if (status === 'warning' || status === 'skipped') return 'text-yellow-100 bg-yellow-500/10';
  return 'text-emerald-300 bg-emerald-500/10';
}

function humanizeLabel(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function capabilityDisplayName(name) {
  if (!name) return '';
  return name === 'General' ? 'General' : `PSD2 ${name}`;
}

function WorkbenchPulseIcon() {
  return (
    <svg viewBox="0 0 72 48" className="h-6 w-10 text-sky-300" aria-hidden="true">
      <path
        d="M4 25h12l5-13 6 28 8-36 8 32 6-18 5 7h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkbenchStep({ index, icon: Icon, label, title, children, status }) {
  return (
    <div className="relative grid grid-cols-[2.75rem_2rem_minmax(0,1fr)] gap-2 border-t border-[#21314a]/80 py-3 first:border-t-0">
      {index > 1 ? <div className="absolute left-[3.7rem] top-0 h-3 border-l border-dashed border-sky-300/35" /> : null}
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-400/20 bg-[#142641]/80 text-sky-200 shadow-[inset_0_0_14px_rgba(96,165,250,0.10)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative flex justify-center">
        <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full border border-sky-300/80 bg-[#0c1a2e] text-[11px] font-semibold text-sky-200 shadow-[0_0_0_2px_rgba(14,33,58,0.95)]">
          {index}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-300/90">{label}</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-slate-100">{title}</p>
          </div>
          {status ? (
            <span className={`rounded-md border border-current/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusTone(status)}`}>
              {humanizeLabel(status)}
            </span>
          ) : null}
        </div>
        {children ? <div className="mt-2 text-xs leading-5 text-slate-400">{children}</div> : null}
      </div>
    </div>
  );
}

function AgentWorkbench({ result, onPrompt }) {
  const workbench = result?.agentWorkbench;
  const calls = workbench?.toolTrace?.length
    ? workbench.toolTrace
    : (result?.toolCalls || []).map((call) => ({
        label: call.name?.replaceAll('_', ' '),
        toolName: call.name,
        capability: call.capability,
        status: call.status,
      }));
  if (!workbench && !calls.length) return null;

  const journey = workbench?.paymentJourney || {};
  const consent = workbench?.consentJourney || result?.consentJourney;
  const controls = workbench?.controlChecks || [];
  const resources = workbench?.preparedResources || [];
  const choices = journey.supportedPaymentTypes || [];
  const missing = journey.missingFields || [];
  const collected = journey.collectedFields || [];
  const firstCall = calls[0] || {};
  let stepNumber = 1;

  return (
    <div className="mt-4 max-w-2xl overflow-hidden rounded-lg border border-sky-400/25 bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.12),transparent_34%),linear-gradient(135deg,rgba(8,20,36,0.92),rgba(6,15,28,0.88))] shadow-[0_12px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(148,163,184,0.06)]">
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <WorkbenchPulseIcon />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-100">Agent Workbench</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Supporting trace, not the final answer.</p>
            </div>
          </div>
          {workbench?.capability?.name ? (
            <span className="rounded-md border border-sky-400/35 bg-sky-500/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200 shadow-[inset_0_0_16px_rgba(59,130,246,0.10)]">
              {capabilityDisplayName(workbench.capability.name)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-1">
        {workbench?.intent ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={CpuChipIcon}
            label="Intent Understanding"
            title={workbench.intent.label || 'LLM Agent'}
          >
            {workbench.intent.confidence ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-[#2a3b56] bg-[#0b1728] px-3 py-1 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Confidence: {humanizeLabel(workbench.intent.confidence)}
              </span>
            ) : null}
          </WorkbenchStep>
        ) : null}

        {workbench?.capability ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={ShieldCheckIcon}
            label="Capability Required"
            title={capabilityDisplayName(workbench.capability.name)}
          >
            {workbench.capability.reason ? <p>{workbench.capability.reason}</p> : null}
          </WorkbenchStep>
        ) : null}

        {consent ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={ClipboardDocumentCheckIcon}
            label="Consent Journey"
            title={consent.type === 'PIS_CONSENT' ? 'PIS consent handoff' : 'AIS consent handoff'}
            status={consent.consentStatus === 'RJCT' ? 'failed' : consent.status}
          >
            <div className="space-y-1.5">
              {(consent.steps || []).map((step) => (
                <div key={step.label} className="flex items-start gap-2 rounded border border-[#263752]/70 bg-[#07111f]/80 px-2 py-1.5">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    step.status === 'completed' ? 'bg-emerald-400' : step.status === 'failed' ? 'bg-red-300' : step.status === 'active' ? 'bg-sky-300' : 'bg-slate-600'
                  }`} />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-slate-200">{step.label}</span>
                    {step.detail ? <span className="block text-[10px] text-slate-500">{step.detail}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </WorkbenchStep>
        ) : null}

        {journey.status && journey.status !== 'not_required' ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={CreditCardIcon}
            label="Payment Journey"
            title={journey.paymentTypeLabel || 'Payment type not selected'}
            status={journey.status}
          >
            {choices.length ? (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {choices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => onPrompt?.(choice.label)}
                    className="rounded-md border border-sky-400/25 bg-[#10213a] p-2 text-left text-xs text-slate-200 hover:border-sky-300/70 hover:bg-[#152946] hover:text-white"
                  >
                    <span className="font-semibold">{choice.label}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">{choice.description}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {collected.length || missing.length ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {collected.length ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Collected Information</p>
                    <dl className="mt-1.5 space-y-1 text-xs">
                      {collected.map((item) => (
                        <div key={`${item.label}-${item.value}`} className="flex gap-2">
                          <dt className="w-24 shrink-0 text-slate-500">{item.label}</dt>
                          <dd className="min-w-0 text-slate-200">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
                {missing.length ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Missing Information</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {missing.map((field) => (
                        <span key={field} className="rounded bg-yellow-500/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-100">
                          {humanizeLabel(field)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </WorkbenchStep>
        ) : null}

        {controls.length ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={ShieldCheckIcon}
            label="Risk & Control Check"
            title="Payment controls"
          >
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {controls.map((check) => (
                <div key={check.label} className="rounded border border-[#263752]/80 bg-[#07111f]/90 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-200">{check.label}</p>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(check.status)}`}>{check.status}</span>
                  </div>
                  {check.detail ? <p className="mt-1 text-[11px] leading-4 text-slate-500">{check.detail}</p> : null}
                </div>
              ))}
            </div>
          </WorkbenchStep>
        ) : null}

        {resources.length ? (
          <WorkbenchStep
            index={stepNumber++}
            icon={ClipboardDocumentCheckIcon}
            label="Consent Preparation"
            title="Prepared resources"
          >
            <div className="space-y-1.5">
              {resources.map((resource) => (
                <div key={resource.resourceId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#263752]/80 bg-[#07111f]/90 p-2 text-[11px]">
                  <span className="font-medium text-slate-100">{RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType}</span>
                  <span className="break-all text-slate-500">{resource.resourceId}</span>
                  <span className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-200">{resource.statusLabel || resource.status}</span>
                </div>
              ))}
            </div>
          </WorkbenchStep>
        ) : null}

      {calls.length ? (
        <WorkbenchStep
          index={stepNumber++}
          icon={CommandLineIcon}
          label="Tool Execution"
          title={firstCall.label || humanizeLabel(firstCall.toolName || firstCall.name || 'LLM agent')}
          status={firstCall.status}
        >
          {calls.length > 1 ? (
            <ol className="space-y-1 text-xs text-slate-500">
              {calls.slice(1).map((call, index) => (
                <li key={`${call.toolName || call.name}-${index}`} className="flex items-center justify-between gap-4">
                  <span>{call.label || humanizeLabel(call.toolName || call.name)}</span>
                  <span className={call.status === 'success' ? 'text-emerald-400' : call.status === 'skipped' ? 'text-yellow-200' : 'text-red-300'}>{humanizeLabel(call.status)}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </WorkbenchStep>
      ) : null}
      </div>
    </div>
  );
}

function StructuredResult({ result, preparePaymentDrafts, startPISConsentJourney, onSubmitResult, onPrompt, onRedirect }) {
  if (!result) return null;
  if (result.toolCalls?.length || result.agentWorkbench) {
    return (
      <>
        <AgentWorkbench result={result} onPrompt={onPrompt} />
        {result.agentWorkbench?.consentJourney || result.consentJourney ? (
          <ConsentJourneyCard result={result} onRedirect={onRedirect} />
        ) : null}
        {result.ais?.accounts?.length || result.accounts?.length || result.ais?.balances?.length || result.balances?.length ? <AccountBalancesResultCard result={result} /> : null}
        {result.ais?.transactions?.length || result.transactions?.length ? <TransactionsResultCard result={result} /> : null}
        {result.ais?.subscriptions?.subscriptions?.length || result.subscriptions?.length ? <SubscriptionsResultCard result={result} /> : null}
        {result.ais?.upcomingBills?.upcomingBills?.length || result.upcomingBills?.length ? <BillsResultCard result={result} /> : null}
        {result.pis?.paymentReview || result.paymentReview ? (
          <PaymentReviewResultCard
            result={result}
            preparePaymentDrafts={preparePaymentDrafts}
            startPISConsentJourney={startPISConsentJourney}
            onSubmitResult={onSubmitResult}
            onRedirect={onRedirect}
          />
        ) : null}
        {result.pis?.domesticPaymentConsents?.length || result.paymentDrafts?.length ? <PaymentDraftResultCard result={result} /> : null}
      </>
    );
  }
  if (result.ais?.accounts?.length || result.accounts?.length || result.ais?.balances?.length || result.balances?.length) return <AccountBalancesResultCard result={result} />;
  if (result.ais?.transactions?.length || result.transactions?.length) return <TransactionsResultCard result={result} />;
  if (result.ais?.subscriptions?.subscriptions?.length || result.subscriptions?.length) return <SubscriptionsResultCard result={result} />;
  if (result.ais?.upcomingBills?.upcomingBills?.length || result.upcomingBills?.length) return <BillsResultCard result={result} />;
  if (result.pis?.paymentReview || result.paymentReview) {
    return (
      <PaymentReviewResultCard
        result={result}
        preparePaymentDrafts={preparePaymentDrafts}
        startPISConsentJourney={startPISConsentJourney}
        onSubmitResult={onSubmitResult}
        onRedirect={onRedirect}
      />
    );
  }
  if (result.pis?.domesticPaymentConsents?.length || result.paymentDrafts?.length) return <PaymentDraftResultCard result={result} />;
  return null;
}

export default function FinancialAssistantChat({
  onResult,
  sendMessage,
  preparePaymentDrafts,
  startPISConsentJourney,
  resumeRequest,
  resumeAfterConsent,
  onResumeHandled,
}) {
  const initialMessage = {
    sender: 'assistant',
    text: 'Ask anything about your spending, subscriptions, bills, or payments.',
    time: currentTime(),
  };
  const storedState = loadStoredChatState();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(
    storedState?.messages?.length ? storedState.messages : [initialMessage]
  );
  const [conversationId, setConversationId] = useState(storedState?.conversationId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [handledResumeKey, setHandledResumeKey] = useState('');
  const [showPrompts, setShowPrompts] = useState(loadPromptVisibility);
  const inFlightResumeKeyRef = useRef('');
  const messagesEndRef = useRef(null);
  const resumeConversationId = resumeRequest?.conversationId;
  const resumeJourneyId = resumeRequest?.journeyId;

  const clearChat = () => {
    setMessages([{ ...initialMessage, time: currentTime() }]);
    setConversationId(null);
    setError('');
    clearStoredChatState();
    clearResumeMarkers();
  };

  const togglePrompts = () => {
    setShowPrompts((current) => {
      const next = !current;
      savePromptVisibility(next);
      return next;
    });
  };

  const handleConsentRedirect = (journey) => {
    if (!journey?.redirectUrl) return;
    saveStoredChatState({
      conversationId: journey.conversationId || conversationId,
      messages,
    });
    window.location.assign(journey.redirectUrl);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading, error]);

  useEffect(() => {
    if (!resumeJourneyId || !resumeAfterConsent) return;
    const resumeKey = `${resumeConversationId || conversationId || ''}:${resumeJourneyId}`;
    if (handledResumeKey === resumeKey || inFlightResumeKeyRef.current === resumeKey || hasHandledResume(resumeKey)) {
      onResumeHandled?.();
      return;
    }
    inFlightResumeKeyRef.current = resumeKey;
    markResumeHandled(resumeKey);
    setHandledResumeKey(resumeKey);
    setIsLoading(true);
    setError('');

    resumeAfterConsent({
      conversationId: resumeConversationId || conversationId,
      journeyId: resumeJourneyId,
    })
      .then((result) => {
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }
        setMessages((current) => [
          ...current,
          { sender: 'assistant', text: result.answer, result, time: currentTime() },
        ]);
        onResult?.(result);
        clearStoredChatState();
        onResumeHandled?.();
      })
      .catch((err) => {
        unmarkResumeHandled(resumeKey);
        inFlightResumeKeyRef.current = '';
        setError(err.message || 'Failed to resume after consent');
      })
      .finally(() => {
        setIsLoading(false);
        if (inFlightResumeKeyRef.current === resumeKey) {
          inFlightResumeKeyRef.current = '';
        }
      });
  }, [resumeJourneyId, resumeConversationId, conversationId, handledResumeKey, resumeAfterConsent, onResult, onResumeHandled]);

  const submitMessage = async (message) => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    setError('');
    setInput('');
    setIsLoading(true);
    setMessages((current) => [...current, { sender: 'user', text: trimmed, time: currentTime() }]);

    try {
      if (!sendMessage) {
        throw new Error('Assistant API client is not configured');
      }
      const result = await sendMessage(trimmed, conversationId);
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }
      setMessages((current) => [
        ...current,
        { sender: 'assistant', text: result.answer, result, time: currentTime() },
      ]);
      onResult?.(result);
    } catch (err) {
      setError(err.message || 'Assistant request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  return (
    <section className="flex h-[calc(100vh+4rem)] min-h-[860px] max-h-[1240px] flex-col rounded-lg border border-[#263752] bg-[#101b2d]/90 text-white shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur">
      <div className="flex flex-shrink-0 items-start justify-between gap-5 border-b border-[#263752] px-5 py-6 md:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <SparklesIcon className="mt-1 h-10 w-10 flex-shrink-0 text-red-500" />
          <div>
            <h2 className="text-xl font-semibold leading-tight tracking-tight md:text-2xl">PSD2 AIS/PIS assistant</h2>
            <p className="mt-2 max-w-xl text-base leading-7 text-slate-400">
              Ask about AIS accounts, transactions, insights, bills, or PIS consent preparation.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="inline-flex min-h-[76px] min-w-[172px] flex-shrink-0 items-center justify-center gap-3 rounded-xl border border-[#33445f] bg-[#101b2d]/80 px-6 py-4 text-base font-semibold text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-red-500/50 hover:bg-[#142238] hover:text-white"
        >
          <TrashIcon className="h-6 w-6 text-slate-300" />
          Clear chat
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-[#263752] px-5 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Sample questions</p>
          <button
            type="button"
            onClick={togglePrompts}
            className="inline-flex items-center gap-2 rounded-lg border border-[#33445f] bg-[#0e1a2d]/85 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-sky-400/50 hover:bg-[#14233a] hover:text-white"
            aria-expanded={showPrompts}
            aria-controls="financial-sample-prompts"
          >
            {showPrompts ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            {showPrompts ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPrompts ? (
          <div id="financial-sample-prompts" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {DEMO_PROMPTS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => submitMessage(label)}
                className="group inline-flex min-h-[58px] items-center gap-3 rounded-xl border border-[#33445f] bg-[#0e1a2d]/85 px-5 py-3 text-left text-base font-semibold leading-snug text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_26px_rgba(0,0,0,0.10)] transition hover:border-sky-400/50 hover:bg-[#14233a] hover:text-white"
              >
                <Icon className="h-6 w-6 flex-shrink-0 text-slate-300 transition group-hover:text-white" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6 space-y-6 scrollbar-hide">
        {messages.map((message, index) => (
          <div key={`${message.sender}-${index}`}>
            {message.sender === 'user' ? (
              <div className="flex items-start justify-end gap-4">
                <div className="max-w-2xl">
                  <div className="rounded-lg bg-[#1d2f4d] px-5 py-4 text-sm font-medium text-white shadow">
                    {message.text}
                  </div>
                  <p className="mt-2 text-right text-xs text-slate-500">{message.time}</p>
                </div>
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-[#1d2f4d] flex items-center justify-center">
                  <UserCircleIcon className="h-7 w-7 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <AssistantAvatar />
                <div className="min-w-0 max-w-full flex-1">
                  <p className="mb-3 text-xs text-slate-500">{message.time}</p>
                  <AssistantMarkdown>{message.text}</AssistantMarkdown>
                  <StructuredResult
                    result={message.result}
                    preparePaymentDrafts={preparePaymentDrafts}
                    startPISConsentJourney={startPISConsentJourney}
                    onSubmitResult={onResult}
                    onPrompt={submitMessage}
                    onRedirect={handleConsentRedirect}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && <div className="text-sm text-slate-400">Analyzing with financial tools...</div>}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      <div className="mt-auto flex-shrink-0 px-5 pb-5 md:px-6 md:pb-6">
        {error && <div className="mb-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="flex min-h-[74px] items-stretch gap-3 rounded-lg border border-[#263752] bg-[#0e1829] p-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about AIS insights, bills, or PIS payment consent preparation..."
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex w-16 flex-shrink-0 items-center justify-center rounded-md bg-red-600 text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-20"
            aria-label="Send financial assistant message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Assistant can make mistakes. Verify important AIS/PIS information.</p>
      </div>
    </section>
  );
}
