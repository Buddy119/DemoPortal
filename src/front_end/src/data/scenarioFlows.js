export const scenarioFlows = {
  "open-banking-account-payments": {
    name: "Open Banking – Account Management & Payments",
    flow: "🔑 Consent → 📄 Account Information → 💳 Payment Initiation → ✅ Funds Confirmation"
  },
  "corporate-treasury-payments": {
    name: "Corporate Treasury & Payments Management", 
    flow: "📄 Account Information → 🔍 Payment Pre-validation → 💳 Payment Initiation → 🌐 SWIFT gpi → 📩 Credit Notifications"
  },
  "securities-fund-administration": {
    name: "Securities & Fund Administration",
    flow: "📁 Fund Static Data & NAV Summary → 📈 Fund Valuation & Income Earned → 👥 Transfer Agency Data → 🏦 Custody"
  },
  "trade-finance-management": {
    name: "Trade Finance Management",
    flow: "📑 Buyer/Seller Loan → 📦 Import/Export LCs & Collections → 📄 Document Management & Receivables → 🔒 Bank Guarantees & Supply Chain → 💰 TradePay & POS Finance"
  },
  "merchant-ecommerce-payments": {
    name: "Merchant & eCommerce Payments",
    flow: "🛒 Digital Merchant Services → 🌍 Omni Collect (Global methods) → 🌏 Omni Collect (Asia methods) → 📲 PayMe for Business"
  },
  "banking-as-a-service": {
    name: "Banking-as-a-Service (BaaS)",
    flow: "🆕 Customer Onboarding → 📄 Account Information → 💳 Payments & Virtual Cards → 🌎 Global Wallet → 📩 Notifications & Reporting"
  },
  "product-information-subscription": {
    name: "Product Information & Subscription",
    flow: "📚 Product Information → 📝 Product Finder → 📑 Product Subscription"
  },
  "open-data-service-locator": {
    name: "Open Data & Service Locator",
    flow: "🏧 ATM Locator → 🏦 Branch Locator → 📊 General Open Data"
  },
  "sandbox-developer-tools": {
    name: "Sandbox & Developer Tools",
    flow: "🛠️ Sandbox Data Management → 🔐 Dynamic Client Registration"
  }
};

export default scenarioFlows;