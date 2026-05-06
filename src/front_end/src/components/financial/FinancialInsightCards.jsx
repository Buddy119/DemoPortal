import { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Sparkline() {
  return (
    <svg viewBox="0 0 220 90" className="h-14 w-32 text-red-500 xl:h-16 xl:w-40" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="8,72 28,62 45,64 64,55 82,38 102,48 120,62 139,41 160,36 178,42 194,26 211,4"
      />
      <circle cx="211" cy="4" r="6" fill="#ef4444" stroke="#fecaca" strokeWidth="3" />
    </svg>
  );
}

function Donut({ count }) {
  const filled = Math.min(92, Math.max(18, count * 14));
  return (
    <div
      className="relative h-20 w-20 rounded-full xl:h-24 xl:w-24"
      style={{
        background: `conic-gradient(#ef4444 ${filled}%, rgba(239,68,68,0.35) ${filled}% 100%)`,
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-3 rounded-full bg-[#101b2d] flex items-center justify-center">
        <ClipboardDocumentListIcon className="h-6 w-6 text-slate-200" />
      </div>
    </div>
  );
}

function confidenceLabel(value) {
  if (!value) return 'Review';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)} confidence`;
}

export default function FinancialInsightCards({ response, spendingComparison, upcomingBills }) {
  const [showSchedule, setShowSchedule] = useState(false);
  const activeSpending = response?.ais?.spendingAnalysis || response?.spendingComparison || spendingComparison;
  const responseBills = response?.ais?.upcomingBills?.upcomingBills || response?.upcomingBills;
  const activeBills = responseBills?.length
    ? { upcomingBills: responseBills, count: responseBills.length, totalDue: responseBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0), currency: responseBills[0]?.currency || 'SGD' }
    : upcomingBills;
  const topDriver = activeSpending?.topDrivers?.[0];
  const bills = activeBills?.upcomingBills || [];
  const visibleBills = showSchedule ? bills : bills.slice(0, 4);
  const currency = activeBills?.currency || activeSpending?.currency || 'SGD';

  return (
    <aside className="flex h-[calc(100vh+4rem)] min-h-[860px] max-h-[1240px] flex-col overflow-hidden rounded-lg border border-[#263752] bg-[#101b2d]/90 p-4 text-white shadow-[0_28px_100px_rgba(0,0,0,0.42)] backdrop-blur md:p-5 lg:sticky lg:top-24">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-semibold">Intelligence layer</h2>
        <p className="mt-1.5 text-sm text-slate-400">Structured tool outputs behind the assistant response.</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
        <section className="rounded-lg border border-[#263752] bg-[#111d30]/80 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 text-slate-300">
                <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Spending spike detected</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-200">
                {topDriver?.category || 'Spending'} spend increased to
              </p>
              <div className="mt-1.5 flex flex-wrap items-end gap-2">
                <p className="text-xl font-semibold xl:text-2xl">{formatMoney(topDriver?.changeAmount, activeSpending?.currency || currency)}</p>
                <span className="rounded bg-red-500/30 px-2.5 py-1.5 text-xs font-bold text-red-100">
                  +{topDriver?.changePercent || 0}%
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">vs previous month</p>
            </div>
            <div className="hidden xl:block">
              <Sparkline />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#263752] bg-[#111d30]/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-slate-300">
                <CalendarDaysIcon className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Bills due this week</span>
              </div>
              <p className="mt-3 text-xl font-semibold xl:text-2xl">{activeBills?.count || 0} bills</p>
              <p className="mt-1.5 text-xs text-slate-400">Estimated total</p>
              <p className="mt-1 text-base text-slate-200">{formatMoney(activeBills?.totalDue, currency)}</p>
            </div>
            <Donut count={activeBills?.count || 0} />
          </div>
        </section>

        <section className="rounded-lg border border-[#263752] bg-[#111d30]/80 p-4">
          <div className="flex items-center gap-3 text-slate-300">
            <ShieldCheckIcon className="h-5 w-5 text-red-500" />
            <span className="font-semibold">Payment readiness</span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#263752] text-left text-slate-400">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Confidence</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visibleBills.map((bill) => (
                  <tr key={`${bill.merchant}-${bill.estimatedDueDate}`} className="border-b border-[#263752]/80">
                    <td className="py-2.5 font-medium text-slate-300">{bill.estimatedDueDate}</td>
                    <td className="py-2.5">
                      <span className="rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {confidenceLabel(bill.confidence)}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{bill.balanceCheck}</td>
                    <td className="py-2.5 text-right">
                      <CheckCircleIcon className="ml-auto h-4 w-4 text-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bills.length > 4 ? (
            <button
              type="button"
              aria-expanded={showSchedule}
              onClick={() => setShowSchedule((value) => !value)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300"
            >
              {showSchedule ? 'Hide schedule' : 'View full schedule'}
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${showSchedule ? 'rotate-90' : ''}`} />
            </button>
          ) : null}
        </section>

      </div>
    </aside>
  );
}
