import { BanknotesIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../ui/card.jsx';

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function formatPreciseMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AccountSummaryCards({ accountsData, spendingComparison, upcomingBills }) {
  const currency = accountsData?.currency || spendingComparison?.currency || 'SGD';
  const accountCount = accountsData?.accounts?.length || 0;
  const spendingChange = Number(spendingComparison?.increasePercent || 0);
  const spendingTrendClass = spendingChange >= 0 ? 'text-red-400' : 'text-emerald-400';
  const summaryItems = [
    {
      key: 'balance',
      label: 'Total balance',
      value: formatMoney(accountsData?.totalAvailableBalance, currency),
      detail: `Across ${accountCount} accounts`,
      icon: BanknotesIcon,
    },
    {
      key: 'monthlySpend',
      label: 'Last month spend',
      value: formatMoney(spendingComparison?.totalCurrent, currency),
      detail: `${spendingChange >= 0 ? '+' : ''}${spendingChange}% vs previous month`,
      detailClass: spendingTrendClass,
      icon: ChartBarIcon,
    },
    {
      key: 'upcomingBills',
      label: 'Bills due this week',
      value: `${upcomingBills?.count || 0} bills`,
      detail: `Estimated ${formatPreciseMoney(upcomingBills?.totalDue, currency)}`,
      icon: CalendarDaysIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {summaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.key}
            className="rounded-lg border border-[#263752] bg-[#111d30]/90 text-white shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-300">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal">{item.value}</p>
                  <p className={`mt-2 text-sm text-slate-400 ${item.detailClass || ''}`}>{item.detail}</p>
                </div>
                <div className="text-red-500">
                  <Icon className="h-10 w-10 stroke-[1.5]" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
