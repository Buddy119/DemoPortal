import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HsbcNavbar from '../components/HsbcNavbar.jsx';
import FlowsSidebar from '../components/FlowsSidebar.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import AccountSummaryCards from '../components/financial/AccountSummaryCards.jsx';
import FinancialAssistantChat from '../components/financial/FinancialAssistantChat.jsx';
import FinancialInsightCards from '../components/financial/FinancialInsightCards.jsx';
import UpcomingBillsList from '../components/financial/UpcomingBillsList.jsx';
import {
  fetchAccounts,
  fetchSpendingComparison,
  fetchUpcomingBills,
  preparePaymentDrafts,
  resumeAfterConsent,
  sendAssistantMessage,
  startPisConsentJourney,
  submitImmediateMockPayment,
  submitScheduledMockPayment,
  submitVariableRecurringMockPayment,
} from '../utils/financialApi.js';

export default function FinancialAssistantPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFlowsSidebarOpen, setIsFlowsSidebarOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [accountsData, setAccountsData] = useState(null);
  const [spendingComparison, setSpendingComparison] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState(null);
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      try {
        const [accounts, spending, bills] = await Promise.all([
          fetchAccounts(),
          fetchSpendingComparison(),
          fetchUpcomingBills(),
        ]);
        if (!mounted) return;
        setAccountsData(accounts);
        setSpendingComparison(spending);
        setUpcomingBills(bills);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load financial overview');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const activeBills = assistantResponse?.ais?.upcomingBills?.upcomingBills || assistantResponse?.upcomingBills || upcomingBills?.upcomingBills || [];
  const resumeRequest = searchParams.get('resumeConsent') === '1'
    ? {
        conversationId: searchParams.get('conversationId'),
        journeyId: searchParams.get('journeyId'),
      }
    : null;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050b14] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(220,38,38,0.42),transparent_32%),radial-gradient(circle_at_28%_8%,rgba(29,78,216,0.20),transparent_35%),linear-gradient(135deg,#06101d_0%,#081322_46%,#100b12_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-35 [background-image:linear-gradient(120deg,transparent_0%,transparent_58%,rgba(255,255,255,0.08)_58.1%,transparent_59%),radial-gradient(ellipse_at_72%_26%,transparent_0%,transparent_55%,rgba(255,255,255,0.12)_55.5%,transparent_56%)]" />
      <div className="relative z-10">
      <HsbcNavbar
        onFlowsToggle={() => setIsFlowsSidebarOpen((value) => !value)}
        onChatToggle={() => setIsChatPanelOpen((value) => !value)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-semibold text-red-500">PSD2 AIS/PIS demo</p>
          <h1 className="max-w-5xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            PSD2 Intelligent Banking Assistant
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
            Natural-language access to AIS insights and PIS payment initiation preparation
          </p>
        </section>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-100 p-4 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-gray-400">Loading financial demo data...</div>
        ) : (
          <>
            <AccountSummaryCards
              accountsData={accountsData}
              spendingComparison={spendingComparison}
              upcomingBills={upcomingBills}
            />

            <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
              <FinancialAssistantChat
                onResult={setAssistantResponse}
                sendMessage={sendAssistantMessage}
                preparePaymentDrafts={preparePaymentDrafts}
                startPISConsentJourney={startPisConsentJourney}
                submitImmediateMockPayment={submitImmediateMockPayment}
                submitScheduledMockPayment={submitScheduledMockPayment}
                submitVariableRecurringMockPayment={submitVariableRecurringMockPayment}
                resumeAfterConsent={resumeAfterConsent}
                resumeRequest={resumeRequest}
                onResumeHandled={() => navigate('/financial-assistant', { replace: true })}
              />
              <FinancialInsightCards
                response={assistantResponse}
                spendingComparison={spendingComparison}
                upcomingBills={upcomingBills}
              />
            </section>

            <div className="lg:hidden">
              <UpcomingBillsList bills={activeBills} />
            </div>
          </>
        )}
      </main>

      <FlowsSidebar
        isOpen={isFlowsSidebarOpen}
        onClose={() => setIsFlowsSidebarOpen(false)}
      />
      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
      />
      </div>
    </div>
  );
}
