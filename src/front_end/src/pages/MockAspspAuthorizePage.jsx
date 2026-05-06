import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authorizeMockAspsp, fetchConsentJourney } from '../utils/financialApi.js';

function formatMoney(value, currency = 'SGD') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function MockAspspAuthorizePage() {
  const [searchParams] = useSearchParams();
  const journeyId = searchParams.get('journeyId');
  const consentId = searchParams.get('consentId');
  const state = searchParams.get('state');
  const [journey, setJourney] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchConsentJourney(journeyId)
      .then((data) => {
        if (mounted) setJourney(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load consent journey');
      });
    return () => {
      mounted = false;
    };
  }, [journeyId]);

  const submitDecision = async (decision) => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await authorizeMockAspsp({ journeyId, consentId, state, decision });
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setError(err.message || 'Failed to submit authorisation decision');
      setIsSubmitting(false);
    }
  };

  const isPis = journey?.type === 'PIS_CONSENT';
  const permissions = journey?.display?.requestedPermissions || [];
  const summary = journey?.display?.paymentSummary || {};
  const payments = summary.payments || [];

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Demo Bank</p>
            <h1 className="mt-1 text-2xl font-semibold">Secure Authorisation</h1>
          </div>
          <span className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">
            PSD2 Sandbox
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-950 px-7 py-6 text-white">
            <p className="text-sm text-slate-300">Third Party Provider</p>
            <h2 className="mt-1 text-2xl font-semibold">PSD2 Intelligent Banking Assistant</h2>
            <p className="mt-3 text-sm text-slate-300">
              Consent {consentId} · Status {journey?.consentStatus || 'Loading'}
            </p>
          </div>

          <div className="px-7 py-6">
            {error ? <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
            {!journey && !error ? <p className="text-slate-500">Loading consent details...</p> : null}

            {journey ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    {isPis ? 'Payment Consent' : 'PSD2 Account Information Consent'}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {isPis
                      ? 'Review the payment consent. This demo authorises consent only and does not execute a payment.'
                      : 'Review the account information permissions requested by the assistant.'}
                  </p>
                </div>

                {isPis ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
                      <p className="text-sm text-slate-500">Payment type<br /><span className="text-base font-semibold text-slate-950">{journey.display?.paymentTypeLabel}</span></p>
                      <p className="text-sm text-slate-500">Total<br /><span className="text-base font-semibold text-slate-950">{formatMoney(summary.total, summary.currency)}</span></p>
                      <p className="text-sm text-slate-500">Execution<br /><span className="text-base font-semibold text-slate-950">Not Executed</span></p>
                    </div>
                    {payments.map((payment) => (
                      <div key={payment.consentId} className="rounded-xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{payment.payee}</p>
                            <p className="mt-1 text-sm text-slate-500">{payment.consentId}</p>
                            {payment.dueDate ? <p className="mt-2 text-sm text-slate-600">Due {payment.dueDate}</p> : null}
                          </div>
                          <p className="font-semibold">{formatMoney(payment.amount, payment.currency || summary.currency)}</p>
                        </div>
                      </div>
                    ))}
                    <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm font-medium text-yellow-900">
                      No payment has been executed.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold">Requested access</p>
                    <ul className="mt-4 space-y-3">
                      {permissions.map((permission) => (
                        <li key={permission} className="flex items-center gap-3 text-sm text-slate-700">
                          <span className="h-2 w-2 rounded-full bg-red-600" />
                          {permission.replace(/([a-z])([A-Z])/g, '$1 $2')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  You are authorising with Demo Bank. The assistant never receives your bank credentials.
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitDecision('approve')}
                    className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Redirecting...' : 'Approve Consent'}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitDecision('reject')}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
