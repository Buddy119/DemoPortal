import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOpenBankingCallback } from '../utils/financialApi.js';

export default function OpenBankingCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const handledCallbackRef = useRef('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) {
      setError('Missing callback code or state.');
      return;
    }
    const callbackKey = `${code}:${state}`;
    if (handledCallbackRef.current === callbackKey) return;
    handledCallbackRef.current = callbackKey;

    handleOpenBankingCallback({ code, state })
      .then((result) => {
        const params = new URLSearchParams({
          conversationId: result.conversationId,
          journeyId: result.journeyId,
          resumeConsent: '1',
        });
        navigate(`/financial-assistant?${params.toString()}`, { replace: true });
      })
      .catch((err) => {
        setError(err.message || 'Failed to process Open Banking callback');
      });
  }, [navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b14] px-6 text-white">
      <div className="max-w-lg rounded-2xl border border-[#263752] bg-[#101b2d] p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-400">Open Banking Callback</p>
        <h1 className="mt-4 text-2xl font-semibold">Returning to the assistant</h1>
        {error ? (
          <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Validating the Demo Bank authorisation result and resuming your chat workflow.
          </p>
        )}
      </div>
    </main>
  );
}
