import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toFixed(2)}`;
}

export default function PaymentDraftReview({ drafts = [], safetyNotice }) {
  if (!drafts.length) return null;

  return (
    <Card className="bg-gray-800 border-gray-700 text-white rounded-lg">
      <CardHeader className="border-gray-700">
        <CardTitle className="text-base">PIS payment consent review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-100 p-3 text-sm flex gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{safetyNotice || 'No payment has been executed.'}</span>
        </div>
        <div className="space-y-3">
          {drafts.map((draft) => {
            const id = draft.draftId || draft.consentId;
            const status = draft.consentStatus || draft.status;
            return (
              <div key={id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{draft.payee}</p>
                    <p className="text-xs text-gray-400 mt-1">Due {draft.dueDate}</p>
                    {draft.consentId && <p className="text-xs text-gray-500 mt-1">Consent {draft.consentId}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(draft.amount, draft.currency)}</p>
                    <p className="text-xs text-red-300 mt-1">{status}</p>
                    <p className="text-xs text-gray-400 mt-1">{draft.executionStatus || 'Not Executed'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
