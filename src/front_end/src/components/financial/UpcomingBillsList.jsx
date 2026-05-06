import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

export default function UpcomingBillsList({ bills = [] }) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-white rounded-lg">
      <CardHeader className="border-gray-700">
        <CardTitle className="text-base">Upcoming bills</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {bills.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No bills detected for the next seven demo days.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {bills.map((bill) => (
              <div key={`${bill.merchant}-${bill.estimatedDueDate}`} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{bill.merchant}</p>
                  <p className="text-xs text-gray-400">{bill.estimatedDueDate} · {bill.confidence} confidence</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatMoney(bill.amount, bill.currency)}</p>
                  <p className="text-xs text-gray-400">{bill.balanceCheck}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

