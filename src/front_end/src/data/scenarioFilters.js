export const scenarioFilters = {
  "open-banking-account-payments": {
    displayName: "Open Banking – Account Management & Payments",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate", "Personal"]
      },
      market: {
        label: "Market",
        options: ["UK", "Europe", "Hong Kong", "Bahrain", "Global"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC", "HSBC Innovation Banking", "HSBC Kinetic", "MiVision", "first direct", "M&S Bank"]
      },
      apiType: {
        label: "API Type",
        options: ["Account Information", "Payment Initiation", "Funds Confirmation", "Variable Recurring Payments", "Modified Customer Interface"]
      }
    }
  },
  "corporate-treasury-payments": {
    displayName: "Corporate Treasury & Payments Management",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate"]
      },
      market: {
        label: "Market",
        options: ["Global", "Asia", "Brazil"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Account Information", "Payment Initiation", "Payment Pre-validation", "SWIFT gpi", "Global Disbursements", "Direct Debit Collections", "Virtual Account Management", "Credit Notifications", "Boleto Issuance"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC", "HSBC Innovation Banking"]
      }
    }
  },
  "securities-fund-administration": {
    displayName: "Securities & Fund Administration",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate"]
      },
      market: {
        label: "Market",
        options: ["Global"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Fund Administration", "Transfer Agency", "Custody"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "trade-finance-management": {
    displayName: "Trade Finance Management",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate"]
      },
      market: {
        label: "Market",
        options: ["Global", "Asia"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Import Letters of Credit", "Export Letters of Credit", "Collections", "Loans", "Supply Chain Finance", "Bank Guarantees", "Document Management", "Receivables Finance", "Point of Sale Finance"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "merchant-ecommerce-payments": {
    displayName: "Merchant & eCommerce Payments",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate"]
      },
      market: {
        label: "Market",
        options: ["Global", "Asia", "Hong Kong"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Digital Merchant Services", "Omni Collect", "PayMe for Business"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "banking-as-a-service": {
    displayName: "Banking-as-a-Service (BaaS)",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Corporate"]
      },
      market: {
        label: "Market",
        options: ["Global"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Customer Onboarding", "Account Information", "Payment Initiation", "Virtual Card Servicing", "Global Wallet", "Event Notifications", "Reporting"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "product-information-subscription": {
    displayName: "Product Information & Subscription",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Personal", "Corporate"]
      },
      market: {
        label: "Market",
        options: ["Hong Kong", "Asia", "UK"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Accounts", "Loans", "Mortgages", "Credit Cards", "FX"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "open-data-service-locator": {
    displayName: "Open Data & Service Locator",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Personal", "Corporate"]
      },
      market: {
        label: "Market",
        options: ["Hong Kong", "UK", "Mexico", "Germany"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["ATM Locator", "Branch Locator", "Open Data"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  },
  "sandbox-developer-tools": {
    displayName: "Sandbox & Developer Tools",
    filters: {
      customerType: {
        label: "Customer Type",
        options: ["Developers"]
      },
      market: {
        label: "Market",
        options: ["Global"]
      },
      apiFunctionalities: {
        label: "API Functionalities",
        options: ["Sandbox Data Management", "Dynamic Client Registration"]
      },
      brand: {
        label: "Brand",
        options: ["HSBC"]
      }
    }
  }
};

export default scenarioFilters;