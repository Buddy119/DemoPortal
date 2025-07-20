const apiBundles = [
    {
        name: "Fund Administration - Fund NAV Summary API",
        description: "Gain access to the assets and liabilities of the fund’s balance sheet to understand the fund’s NAV components",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Standing Instructions API",
        description: "Extracts standing instructions setup details per fund or plan by unitholder (investor) level",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Foreign Account Tax Compliance Act (FATCA) API",
        description: "Extracts FATCA and Common Reporting Standards (CRS) setup details by unitholder or Customer Information File (CIF) level",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Entities API",
        description: "Extracts transfer agency entities including Legal Entity, Agent, Agency Branch, Account Officer, IFA, Broker and Related Party",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Corporate Actions API",
        description: "Extracts corporate action details per fund include Liquidation, Merger, Split and more",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Fund Price API",
        description: "Extracts fund price details",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Trailer and Commission API",
        description: "Extracts trailer fee and commission data per entity level such as the agent",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Treasury - Boleto Initiation",
        description: "Issue boletos online to manage your receivables",
        tags: [
            "Brazil",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Brazil",
            "Payments"
        ]
    },
    {
        name: "Trade Finance - Document Managements",
        description: "Manage documents associated with your customers application",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking",
            "United Kingdom"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Omni Collect - Simulation API",
        description: "Simulation API for Hong Kong FPS, Malaysia DuitNow, Singapore PayNow and Vietnam VietQR",
        tags: [
            "Global",
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "Treasury - Virtual Account Management",
        description: "Global Receivables  - Virtual Account Management",
        tags: [
            "Global",
            "Receivables",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Sandbox & Developer Tools",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Receivables"
        ]
    },
    {
        name: "FA – ETF Order API",
        description: "Retrieve ETF orders that have been approved and validated",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Unitholder API",
        description: "Extracts unitholder (investor) level static data",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Fund Dividend API",
        description: "Extracts fund dividend distribution details",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Fund Static Data API",
        description: "Extracts Fund/Sub-Fund/Share Class data setup details, also known as fund rules",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Trade Finance - Import Payment",
        description: "Request financing directly with HSBC via our Import Payment APIs",
        tags: [
            "Asia",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Digital Merchant Services",
        description: "Digital Merchant Services Cards and Alternative Payment Methods Specifications",
        tags: [
            "Global",
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "Transfer Agency – Payment API",
        description: "Extracts transactional payment and settlement details",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Fund Administration – Income Earned",
        description: "Gain access to the income earned between NAV points.",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Fund Administration – Fund Valuation API",
        description: "Contains information on holdings and position details",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Holiday API",
        description: "Extracts the Holiday setup in system at different levels",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Box Management API",
        description: "Extracts box management setup and holding/position details",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – System Information API",
        description: "Extracts essential transfer agency system information such as the system date and online status prior to extracting individual APIs",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Customers API",
        description: "Extracts Customer Information File (CIF) level static data",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Contingency Deferred Sales Charge (CDSC) API",
        description: "Extraction of CDSC data",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Trade Finance - Exports Regularization",
        description: "Request financing directly with HSBC via our Exports Regularization APIs",
        tags: [
            "Asia",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "PayMe APIs for Business",
        description: "Collect payments seamlessly and connect to over 3 million customers with PayMe for Business.",
        tags: [
            "Payments",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Account Information",
        description: "Balance and transaction reporting for Corporate customers",
        tags: [
            "Global",
            "Account Information",
            "Corporate Banking",
            "United Kingdom"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "FA – ETF Order API",
        description: "Retrieve ETF orders that have been approved and validated",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Unitholder API",
        description: "Extracts unitholder (investor) level static data",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Fund Dividend API",
        description: "Extracts fund dividend distribution details",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Transfer Agency – Fund Static Data API",
        description: "Extracts Fund/Sub-Fund/Share Class data setup details, also known as fund rules",
        tags: [
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Trade Finance - Import Payment",
        description: "Request financing directly with HSBC via our Import Payment APIs",
        tags: [
            "Asia",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Digital Merchant Services",
        description: "Digital Merchant Services Cards and Alternative Payment Methods Specifications",
        tags: [
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "Treasury - Credit Notifications",
        description: "Credit Notifications sent by HSBC to report payments received in Corporate accounts.",
        tags: [
            "Global",
            "Corporate Banking",
            "Account Information",
            "United Kingdom"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Treasury - Direct Debit Collections",
        description: "Direct debit authorisation and instruction for corporate customers in Hong Kong and Singapore",
        tags: [
            "Asia",
            "Payments",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Global Disbursements",
        description: "Multi-currency payments with FX conversion",
        tags: [
            "Global",
            "Corporate Banking",
            "Payments",
            "United Kingdom"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Payment Initiation",
        description: "Single and bulk payment initiation for Corporate customers",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Payment Pre-validation",
        description: "Payment pre-validation provides assurance that payments are being routed to the intended recipient",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - SWIFT gpi",
        description: "Cross border payment status tracking via SWIFT gpi",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Sandbox Management API",
        description: "Add and reset data in the Corporate Sandbox",
        tags: [
            "Global",
            "Account Information",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Trade Finance - Bank Guarantee",
        description: "Bank Guarantee status for Financial Institutions",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Import Letters of Credit",
        description: "Submit applications/amendments/enquiries for Import Letters of Credit.",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - TradePay",
        description: "Request TradePay loan for buyers and sellers.",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Buyer Loans",
        description: "Request financing directly with HSBC via our Buyer Loan APIs",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Point of Sale Finance",
        description: "Support revenue growth and increase sales velocity by embedding financing solutions into your ecommerce platform.",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Export Collection",
        description: "Seamlessly send enquiries to HSBC about Export Collection bills received by HSBC",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Export Letters of Credit",
        description: "Seamlessly send enquiries to Export Letters of Credit (LC/ DC) advised by HSBC",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Receivables Finance",
        description: "Submit invoices or credit notes directly to HSBC in real-time.",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Import Collection",
        description: "Seamlessly send enquiries to Import Collection bill’s received by HSBC",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Seller Loans",
        description: "Request financing directly with HSBC via our Seller Loan APIs",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Trade Finance - Supply Chain Finance",
        description: "Submit one or many approved invoices via API for Supply Chain Finance.",
        tags: [
            "Global",
            "Trade Finance",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Trade Finance Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Trade Finance"
        ]
    },
    {
        name: "Omni Collect - Single API",
        description: "Omni Collect Single API Cards and Alternative Payment Methods Specifications",
        tags: [
            "Global",
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "Omni Collect - China",
        description: "China Cards and Alternate Payment Methods API Specification",
        tags: [
            "Asia",
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "Custody – Trade Status",
        description: "Real-time Trade settlement status enquiry",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Custody – Holdings",
        description: "Real-time enquiry for Custody holding positions",
        tags: [
            "Global",
            "Securities Services",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Securities & Fund Administration",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Securities Services"
        ]
    },
    {
        name: "Omni Collect - Vietnam Viettel",
        description: "Vietnam Cards and Alternate Payment Methods API Specification",
        tags: [
            "Asia",
            "Merchant Services",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Merchant & eCommerce Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Merchant Services"
        ]
    },
    {
        name: "BaaS - Account Information",
        description: "Provide balance and transaction reporting for your customers accounts",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Payment Initiation",
        description: "Provide single and bulk payment initiation to your customers",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Customer Onboarding",
        description: "Create a banking relationship from your platform with digital Customer Onboarding",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Customer Onboarding v3",
        description: "Create a banking relationship from your platform with digital Customer Onboarding",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Customer Onboarding",
        description: "Create a banking relationship from your platform with digital Customer Onboarding",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Credit Limit Check",
        description: "Check the ACH credit limit applied to your customers account",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Document Management",
        description: "Manage documents associated with your customers onboarding application.",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Event Notification",
        description: "Notification message from HSBC's Banking-as-a-Service Platform",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Event Notification Subscription",
        description: "Subscribe to receive Event Notifications from HSBC's Banking-as-a-Service platform",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Global Wallet",
        description: "Enable your customers to make and receive International Payments like a local",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Reports",
        description: "Reports containing your customers monthly bank statements or billing invoices",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "BaaS - Virtual Card Servicing",
        description: "Provide your customers with a convenient way to pay for goods and services directly within your own platform.",
        tags: [
            "Beta",
            "Banking-as-a-Service",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Banking-as-a-Service (BaaS)",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Banking-as-a-Service"
        ]
    },
    {
        name: "Account Information - CE - HSBCnet",
        description: "Securely access account information, balances and transaction history in our Continental European Markets.",
        tags: [
            "Europe",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Funds Confirmation - CE - HSBCnet",
        description: "Request confirmation of available funds to cover a proposed transaction in our Continental European Markets.",
        tags: [
            "Europe",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Funds Confirmation - CE - MiVision",
        description: "Request confirmation of available funds to cover a proposed transaction in our Continental European Markets.",
        tags: [
            "Europe",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "MiVision"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Event Notification",
        description: "create a notification event when resource change in the Bank using Open Banking APIs",
        tags: [
            "Global",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Variable Recurring Payments - UK - HSBC Kinetic",
        description: "Supports variable recurring payments for sweeping from business accounts",
        tags: [
            "Payments",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Kinetic"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Payment Pre-validation - HSBC Innovation Bank",
        description: "Payment pre-validation provides assurance that payments are being routed to the intended recipient.",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Account Information - HSBC Innovation Banking",
        description: "Transform your business processes by integrating real-time account balances and transactions.",
        tags: [
            "Account Information",
            "Corporate Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Funds Confirmation - UK - HSBC Innovation Banking",
        description: "Request confirmation of available funds to cover a proposed transaction in our UK market.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Account Information - UK - MiVision",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "MiVision"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Funds Confirmation - UK - MiVision",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "MiVision"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Payment Initiation - CE - HSBCnet",
        description: "Integrate secure payment initiation into your application and launch your business potential in our Continental European Markets.",
        tags: [
            "Europe",
            "Payments",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - CE - HSBCnet",
        description: "Integrate secure payment initiation into your application and launch your business potential in our Continental European Markets.",
        tags: [
            "Europe",
            "Payments",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Dynamic Client Registration (DCR)",
        description: "Allows Third Parties to register their client with HSBC's Open Banking platform",
        tags: [
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: ["dcr-register-client","dcr-get-client", "dcr-update-client", "funds-confirmation"],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Modified Customer Interface - Luxembourg",
        description: "Access Open Banking services for Private banking customers in Luxembourg.",
        tags: [
            "Luxembourg",
            "Account Information",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Luxembourg",
            "Account Information"
        ]
    },
    {
        name: "Variable Recurring Payments - UK - HSBC Personal",
        description: "Supports variable recurring payments for sweeping from current accounts",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - UK - HSBC Innovation Banking",
        description: "Integrate secure payment initiation into your application and launch your business potential in our UK market.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - SWIFT gpi - HSBC Innovation Banking",
        description: "Cross border payment status tracking via SWIFT gpi.",
        tags: [
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Sandbox Management API",
        description: "Add and reset data in the Corporate Sandbox.",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - UK - HSBCnet",
        description: "Integrate secure payment initiation into your application and launch your business potential in our UK market.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Funds Confirmation - UK - HSBCnet",
        description: "Request confirmation of available funds to cover a proposed transaction in our UK market.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Account Information - CE - MiVision",
        description: "Securely access real-time account information, balances and transaction history in Continental Europe (CE).",
        tags: [
            "Europe",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "MiVision"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - Malta - HSBC Personal",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "Malta",
            "Account Information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Malta",
            "Account Information"
        ]
    },
    {
        name: "Variable Recurring Payments - UK - HSBC Business",
        description: "Supports variable recurring payments for sweeping from business accounts",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Variable Recurring Payments - first direct",
        description: "Supports variable recurring payments for sweeping from current accounts",
        tags: [
            "Payments",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "first direct"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Treasury - Credit Notifications - HSBC Innovation Banking",
        description: "Credit Notifications sent by HSBC Innovation Banking to report payments received in Corporate accounts.",
        tags: [
            "Global",
            "Account Information",
            "Corporate Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - UK - HSBC Innovation Banking",
        description: "Securely access account information, balances and transaction history in our UK market.",
        tags: [
            "Account Information",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Treasury - Payment Initiation - HSBC Innovation Banking",
        description: "Single and bulk payment initiation for Corporate customers.",
        tags: [
            "Global",
            "Payments",
            "Corporate Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Corporate"
        ],
        brand: [
            "HSBC Innovation Banking"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Account Information - UK - HSBCnet",
        description: "Securely access account information, balances and transaction history in our UK market.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBCnet"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - Bahrain - HSBC Personal",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "Bahrain",
            "Account Information",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Bahrain",
            "Account Information"
        ]
    },
    {
        name: "Account Information - HK - Business",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "Account Information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - HK Personal",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "Account Information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - first direct",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "Account Information",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "first direct"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - UK - HSBC Business",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - M&S Bank",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "M&S Bank"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - UK - HSBC Personal",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Account Information - UK - HSBC Kinetic",
        description: "Securely access account information, balances and transaction history.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Kinetic"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "All-in-one (integrated) and savings accounts",
        description: "Access the latest information for our all-in-one (integrated) and savings accounts for personal and business / commercial customers, including eligibility requirements, fees and interest rates.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "ATM Locator - Mexico",
        description: "Get the location of all our Mexico ATMs.",
        tags: [
            "Mexico",
            "Open Data",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Mexico",
            "Open Data"
        ]
    },
    {
        name: "ATM Locator - UK",
        description: "Get the location of all our UK ATMs.",
        tags: [
            "Open Data",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Open Data"
        ]
    },
    {
        name: "ATMs",
        description: "Help your users access all the most useful information about our ATMs, including up-to-date locations and the different services available.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Branch Locator - UK",
        description: "Get the location of and facilities available at all our UK branches.",
        tags: [
            "UK",
            "Open Data",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Open Data"
        ]
    },
    {
        name: "Branches",
        description: "Integrate helpful information on all our HSBC HK branches into your application, including their location, opening hours and the services offered.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Business Integrated account applications",
        description: "Help your customers to apply for an HSBC Business Integrated Account by sending us basic company information through your apps or services.",
        tags: [
            "Product subscription",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Credit cards",
        description: "Integrate our credit card products for retail and business / commercial customers into your applications and services, including all the latest rewards, fees and charges.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Current accounts",
        description: "Help your users discover all the customer eligibility requirements and fees for our current accounts for retail customers.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Foreign currency accounts",
        description: "Share the available currencies, eligibility requirements, fees and interest rates for our personal foreign currency accounts with your users.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Foreign exchange (FX)",
        description: "The latest information on our foreign exchange services for retail customers, including available currencies and current exchange rates.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Funds Confirmation - UK - HSBC Personal",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Funds Confirmation - first direct",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "first direct"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Funds Confirmation - UK - HSBC Kinetic",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Kinetic"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Funds Confirmation - M&S Bank",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "UK",
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "M&S Bank"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Funds Confirmation - UK - HSBC Kinetic",
        description: "Request confirmation of available funds to cover a proposed transaction.",
        tags: [
            "Funds Confirmation",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC Kinetic"
        ],
        functionalities: [
            "Funds Confirmation"
        ]
    },
    {
        name: "Localizador de cajeros automáticos - México",
        description: "Obtén la ubicación de todos nuestros cajeros automáticos en México.",
        tags: [
            "Open Data",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Open Data"
        ]
    },
    {
        name: "Modified Customer Interface - UK",
        description: "Access Open Banking services for Personal and Business banking customers in the UK.",
        tags: [
            "UK",
            "Account Information",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Mortgage appointment booking",
        description: "Apply for this API to access the steps for product booking about our mortgages.",
        tags: [
            "Product subscription",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Modified Customer Interface - Malta",
        description: "Access Open Banking services for Personal banking customers in Malta.",
        tags: [
            "Malta",
            "Account Information",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Malta",
            "Account Information"
        ]
    },
    {
        name: "Modified Customer Interface - Europe",
        description: "Access Open Banking services for Corporate banking customers across Europe.",
        tags: [
            "Europe",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Account Information"
        ]
    },
    {
        name: "Mortgage loans",
        description: "Help your users discover our financing options geared towards property purchases for retail customers, including interest rates, eligibility requirements and term lengths.",
        tags: [
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Modified Customer Interface - France",
        description: "Access Open Banking services for HSBCnet and MiVision customers in France.",
        tags: [
            "France",
            "Account Information",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "France",
            "Account Information"
        ]
    },
    {
        name: "Open Banking APIs - Germany",
        description: "Access Open Banking services for Private Banking customers in Germany.",
        tags: [
            "Germany",
            "Account Information",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Open Banking – Account Management & Payments",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Germany",
            "Account Information"
        ]
    },
    {
        name: "Open Banking APIs - HK",
        description: "Access our Open Banking APIs in Hong Kong.",
        tags: [
            "Open Data",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Open Data"
        ]
    },
    {
        name: "Payment Initiation - UK - HSBC Personal",
        description: "Integrate secure payment initiation into your application and launch your business potential.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - Bahrain - HSBC Personal",
        description: "Integrate secure payment initiation into your application and launch your business potential.",
        tags: [
            "Bahrain",
            "Payments",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Bahrain",
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - UK - HSBC Business",
        description: "Integrate secure payment initiation into your application and launch your business potential.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "United Kingdom",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - UK - Kinetic",
        description: "Integrate secure payment initiation into your application and launch your business potential.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Payment Initiation - UK - first direct",
        description: "Integrate secure payment initiation into your application and launch your business potential.",
        tags: [
            "UK",
            "Payments",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Corporate Treasury & Payments Management",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "first direct"
        ],
        functionalities: [
            "Payments"
        ]
    },
    {
        name: "Personal all-in-one and savings accounts",
        description: "Apply for this API to access the steps for product application and information about our personal all-in-one and savings accounts.",
        tags: [
            "Hong Kong",
            "Product subscription",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Personal credit cards",
        description: "Apply for this API to access the steps for product application and information about our personal credit cards.",
        tags: [
            "Hong Kong",
            "Product subscription",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Personal mortgages",
        description: "Apply for this API to access the steps for product application and information about our personal mortgages.",
        tags: [
            "Hong Kong",
            "Product subscription",
            "Open Banking"
        ],
        market: "Global",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Personal current accounts",
        description: "Apply for this API to access the steps for product application and information about our personal current accounts.",
        tags: [
            "Asia",
            "Product subscription",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Personal unsecured loans",
        description: "Apply for this API to access the steps for product application and information about our personal unsecured loans.",
        tags: [
            "Hong Kong",
            "Product subscription",
            "Open Banking"
        ],
        market: "Singapore",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Personal current accounts",
        description: "Apply for this API to access the steps for product application and information about our personal current accounts.",
        tags: [
            "Asia",
            "Product subscription",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Time deposit accounts",
        description: "Access our time deposit accounts for retail customers, including the latest eligibility requirements, term lengths, fees and interest rates.",
        tags: [
            "Hong Kong",
            "Product information",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Unsecured loans",
        description: "Access the interest rates, eligibility requirements and loan tenors for our financing options for retail and business / commercial customers.",
        tags: [
            "Hong Kong",
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    },
    {
        name: "Time deposit accounts",
        description: "Apply for this API to access the steps for product application and information about our time deposit accounts.",
        tags: [
            "Hong Kong",
            "Product subscription",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product subscription"
        ]
    },
    {
        name: "Product Finder - UK",
        description: "Get details on our current accounts, SME lending products and commercial credit cards.",
        tags: [
            "UK",
            "Open Data",
            "Open Banking"
        ],
        market: "All Markets",
        locked: false,
        apis: [],
        scenario: "Open Data & Service Locator",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Open Data"
        ]
    },
    {
        name: "Secured loans",
        description: "Access information about our financing options, including the eligibility requirements, interest rates and loan tenor for our retail and business / commercial customers.",
        tags: [
            "Hong Kong",
            "Product information",
            "Open Banking"
        ],
        market: "Hong Kong",
        locked: false,
        apis: [],
        scenario: "Product Information & Subscription",
        customerType: [
            "Personal",
            "Corporate"
        ],
        brand: [
            "HSBC"
        ],
        functionalities: [
            "Product information"
        ]
    }
];

export default apiBundles;