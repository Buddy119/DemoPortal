function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

export default function TransactionTable({ transactions = [] }) {
  if (!transactions.length) return null;

  return (
    <section className="overflow-hidden rounded-lg border border-[#263752] bg-[#101b2d]/90 text-white shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="border-b border-[#263752] px-5 py-4">
        <h3 className="text-base font-semibold">Related transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[#17243a] text-slate-300">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Merchant</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263752]">
            {transactions.map((transaction) => (
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
    </section>
  );
}
