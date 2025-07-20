const apis = [
  {
    id: "funds-confirmation",
    name: "Funds Confirmation - CE - HSBCnet",
    description: "Balance and transaction reporting for Corporate customers",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    version: "3.1.11",
    method: "POST",
    endpoint: "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations",
    relatedGuides: ["Payment Methods", "More Payment Scenarios"],
    subtitle: "Supports variable recurring payments for sweeping from current accounts",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: false,
    sections: [
      {
        heading: "Included",
        markdown: `This API enables TPP to create a funds confirmation consent. Supported products are Business Current Account and Credit cards, Working Capital.

Related guides: **Payment Methods** and **More Payment Scenarios**.

Was this section useful? **Yes** **No**`
      },
      {
        heading: "Not included",
        markdown: `• Initiating payments
• Retrieving detailed account balances  
• Accessing transaction histories
• Providing fund confirmation services for personal banking customers`
      },
      {
        heading: "Authentication",
        markdown: `**Bearer** string required

Enter your JSON Web Token (JWT) here. Refer to the Generate JWT section of our Authentication docs for information on how to generate your Bearer Token.

## Authentication Methods

The API supports the following authentication methods:

1. **Bearer Token Authentication** - The primary method for API access
2. **OAuth 2.0** - For third-party applications
3. **Client Certificate** - For enhanced security requirements

### Token Generation Process

To generate a Bearer token:

1. Obtain your client credentials from the HSBC Developer Portal
2. Make a POST request to the token endpoint
3. Include your \`client_id\` and \`client_secret\`
4. Receive your access token in the response

\`\`\`json
{
  "access_token": "your_token_here",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

### Security Requirements

- All API calls must be made over **HTTPS**
- Tokens expire after 1 hour
- Refresh tokens are available for long-running applications
- Rate limiting applies: 1000 requests per hour per client

For more information, see our [Authentication Guide](https://developer.hsbc.com/auth).`
      }
    ],
    codeSamples: {
      python: `import requests

url = "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"

payload = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}"
headers = {
    'fapi-auth-date': 'Wed, 30 Nov 2022 15:05:30 GMT',
    'fapi-customer-ip-address': '10.0.0.1',
    'fapi-interaction-id': 'f8273b70-d5c0-4ef7-b4df-cd2e4e2d4c47',
    'Authorization': 'Bearer GhHuml5VYhh6...oiSL_A',
    'x-customer-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)`,
      "c++": `#include <iostream>
#include <curl/curl.h>

int main() {
    CURL *curl;
    CURLcode res;
    
    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations");
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "fapi-auth-date: Wed, 30 Nov 2022 15:05:30 GMT");
        headers = curl_slist_append(headers, "Authorization: Bearer GhHuml5VYhh6...oiSL_A");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        
        const char *data = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\"}}";
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);
        
        res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }
    return 0;
}`,
      java: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class FundsConfirmation {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        String payload = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}";
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"))
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .header("Authorization", "Bearer GhHuml5VYhh6...oiSL_A")
            .header("fapi-auth-date", "Wed, 30 Nov 2022 15:05:30 GMT")
            .build();
            
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
      go: `package main

import (
    "fmt"
    "net/http"
    "strings"
)

func main() {
    url := "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"
    
    payload := strings.NewReader("{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}")
    
    req, _ := http.NewRequest("POST", url, payload)
    req.Header.Add("fapi-auth-date", "Wed, 30 Nov 2022 15:05:30 GMT")
    req.Header.Add("Authorization", "Bearer GhHuml5VYhh6...oiSL_A")
    
    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    
    fmt.Println("Response Status:", res.Status)
}`,
      "node.js": `const axios = require('axios');

const config = {
  method: 'post',
  url: 'https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations',
  headers: { 
    'fapi-auth-date': 'Wed, 30 Nov 2022 15:05:30 GMT',
    'fapi-customer-ip-address': '10.0.0.1',
    'fapi-interaction-id': 'f8273b70-d5c0-4ef7-b4df-cd2e4e2d4c47',
    'Authorization': 'Bearer GhHuml5VYhh6...oiSL_A',
    'x-customer-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  data: {
    "Data": {
      "ExpirationDateTime": "2022-05-25T10:56:59.269Z",
      "DebtorAccount": {
        "SchemeName": "UK.OBIE.SortCodeAccountNumber",
        "Identification": "40400512345679",
        "Name": "Mrs B Smith"
      }
    }
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});`
    }
  },
  {
    id: "fa-etf-order",
    name: "FA - ETF Order API",
    description: "Retrieve ETF orders that have been approved and validated",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    version: "2.0.3",
    method: "GET",
    endpoint: "https://api.hsbcnet.com/v2/etf/orders",
    subtitle: "Access validated ETF order data for corporate clients",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: false,
    sections: [
      {
        heading: "Overview",
        markdown: `Retrieve ETF orders that have been approved and validated through our securities platform. This API provides access to order status, execution details, and settlement information.

**Key Features:**
- Real-time order status
- Execution price tracking
- Settlement date information`
      },
      {
        heading: "Authentication",
        markdown: `**API Key** required

Include your API key in the Authorization header. Contact your relationship manager to obtain API credentials.`
      }
    ],
    codeSamples: {
      python: `import requests

url = "https://api.hsbcnet.com/v2/etf/orders"
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(url, headers=headers)
print(response.json())`,
      java: `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.hsbcnet.com/v2/etf/orders"))
    .header("Authorization", "Bearer YOUR_API_KEY")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`,
      go: `client := &http.Client{}
req, _ := http.NewRequest("GET", "https://api.hsbcnet.com/v2/etf/orders", nil)
req.Header.Add("Authorization", "Bearer YOUR_API_KEY")

resp, _ := client.Do(req)`,
      "node.js": `const axios = require('axios');

const response = await axios.get('https://api.hsbcnet.com/v2/etf/orders', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

console.log(response.data);`,
      "c++": `#include <curl/curl.h>

CURL *curl = curl_easy_init();
curl_easy_setopt(curl, CURLOPT_URL, "https://api.hsbcnet.com/v2/etf/orders");

struct curl_slist *headers = NULL;
headers = curl_slist_append(headers, "Authorization: Bearer YOUR_API_KEY");
curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

curl_easy_perform(curl);`
    }
  },
  {
    id: "transfer-agency-unitholder",
    name: "Transfer Agency - Unitholder API",
    description: "Balance and transaction reporting for Corporate customers",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    version: "3.1.11",
    method: "POST",
    endpoint: "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations",
    relatedGuides: ["Payment Methods", "More Payment Scenarios"],
    subtitle: "Supports variable recurring payments for sweeping from current accounts",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: false,
    sections: [
      {
        heading: "Included",
        markdown: `This API enables TPP to create a funds confirmation consent. Supported products are Business Current Account and Credit cards, Working Capital.

Related guides: **Payment Methods** and **More Payment Scenarios**.

Was this section useful? **Yes** **No**`
      },
      {
        heading: "Not included",
        markdown: `• Initiating payments
• Retrieving detailed account balances  
• Accessing transaction histories
• Providing fund confirmation services for personal banking customers`
      },
      {
        heading: "Authentication",
        markdown: `**Bearer** string required

Enter your JSON Web Token (JWT) here. Refer to the Generate JWT section of our Authentication docs for information on how to generate your Bearer Token.

## Authentication Methods

The API supports the following authentication methods:

1. **Bearer Token Authentication** - The primary method for API access
2. **OAuth 2.0** - For third-party applications
3. **Client Certificate** - For enhanced security requirements

### Token Generation Process

To generate a Bearer token:

1. Obtain your client credentials from the HSBC Developer Portal
2. Make a POST request to the token endpoint
3. Include your \`client_id\` and \`client_secret\`
4. Receive your access token in the response

\`\`\`json
{
  "access_token": "your_token_here",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

### Security Requirements

- All API calls must be made over **HTTPS**
- Tokens expire after 1 hour
- Refresh tokens are available for long-running applications
- Rate limiting applies: 1000 requests per hour per client

For more information, see our [Authentication Guide](https://developer.hsbc.com/auth).`
      }
    ],
    codeSamples: {
      python: `import requests

url = "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"

payload = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}"
headers = {
    'fapi-auth-date': 'Wed, 30 Nov 2022 15:05:30 GMT',
    'fapi-customer-ip-address': '10.0.0.1',
    'fapi-interaction-id': 'f8273b70-d5c0-4ef7-b4df-cd2e4e2d4c47',
    'Authorization': 'Bearer GhHuml5VYhh6...oiSL_A',
    'x-customer-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)`,
      "c++": `#include <iostream>
#include <curl/curl.h>

int main() {
    CURL *curl;
    CURLcode res;
    
    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations");
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "fapi-auth-date: Wed, 30 Nov 2022 15:05:30 GMT");
        headers = curl_slist_append(headers, "Authorization: Bearer GhHuml5VYhh6...oiSL_A");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        
        const char *data = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\"}}";
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);
        
        res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }
    return 0;
}`,
      java: `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

public class FundsConfirmation {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        
        String payload = "{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}";
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"))
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .header("Authorization", "Bearer GhHuml5VYhh6...oiSL_A")
            .header("fapi-auth-date", "Wed, 30 Nov 2022 15:05:30 GMT")
            .build();
            
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`,
      go: `package main

import (
    "fmt"
    "net/http"
    "strings"
)

func main() {
    url := "https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations"
    
    payload := strings.NewReader("{\\"Data\\":{\\"ExpirationDateTime\\":\\"2022-05-25T10:56:59.269Z\\",\\"DebtorAccount\\":{\\"SchemeName\\":\\"UK.OBIE.SortCodeAccountNumber\\",\\"Identification\\":\\"40400512345679\\",\\"Name\\":\\"Mrs B Smith\\"}}}")
    
    req, _ := http.NewRequest("POST", url, payload)
    req.Header.Add("fapi-auth-date", "Wed, 30 Nov 2022 15:05:30 GMT")
    req.Header.Add("Authorization", "Bearer GhHuml5VYhh6...oiSL_A")
    
    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    
    fmt.Println("Response Status:", res.Status)
}`,
      "node.js": `const axios = require('axios');

const config = {
  method: 'post',
  url: 'https://sandbox.ob.hsbcnet.com/mock/obio/open-banking/v3.1/cbpii/funds-confirmations',
  headers: { 
    'fapi-auth-date': 'Wed, 30 Nov 2022 15:05:30 GMT',
    'fapi-customer-ip-address': '10.0.0.1',
    'fapi-interaction-id': 'f8273b70-d5c0-4ef7-b4df-cd2e4e2d4c47',
    'Authorization': 'Bearer GhHuml5VYhh6...oiSL_A',
    'x-customer-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  data: {
    "Data": {
      "ExpirationDateTime": "2022-05-25T10:56:59.269Z",
      "DebtorAccount": {
        "SchemeName": "UK.OBIE.SortCodeAccountNumber",
        "Identification": "40400512345679",
        "Name": "Mrs B Smith"
      }
    }
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});`
    }
  },
  {
    id: "transfer-agency-fund-dividend",
    name: "Transfer Agency - Fund Dividend API",
    description: "Extracts fund dividend distribution details",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: false
  },
  {
    id: "transfer-agency-fund-static-data",
    name: "Transfer Agency - Fund Static Data API",
    description: "Extracts Fund/Sub-Fund/Share Class data setup details, also known as fund reference data",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: false
  },
  {
    id: "digital-merchant-services",
    name: "Digital Merchant Services",
    description: "Digital Merchant Services Cards and Alternative Payment Methods Specification",
    bundle: "Banking as a Service",
    type: "api",
    tags: ["Corporate", "Banking as a service"],
    market: "United Kingdom",
    locked: true
  },
  {
    id: "trade-finance-import-payment",
    name: "Trade Finance - Import payment",
    description: "Request financing directly with HSBC via our Import Payment APIs",
    bundle: "Dynamic Client Registration (DCR)",
    type: "api",
    tags: ["Corporate", "Open Banking"],
    market: "United Kingdom",
    locked: true
  },
  {
    id: "transfer-agency-payment",
    name: "Transfer Agency - Payment API",
    description: "Extracts transactional payment and settlement details",
    bundle: "Securities Services",
    type: "api",
    tags: ["Corporate", "Securities Services"],
    market: "United Kingdom",
    locked: true
  },
  {
    id: "account-information-service",
    name: "Account Information Service",
    description: "Access account information and transaction history",
    bundle: "Open Banking",
    type: "api",
    tags: ["Open Banking"],
    market: "Hong Kong",
    locked: false
  },
  {
    id: "payment-initiation-service",
    name: "Payment Initiation Service",
    description: "Initiate payments on behalf of customers",
    bundle: "Open Banking",
    type: "api",
    tags: ["Open Banking"],
    market: "Hong Kong",
    locked: false
  },
  {
    id: "corporate-banking-api",
    name: "Corporate Banking API",
    description: "Comprehensive corporate banking services",
    bundle: "Corporate",
    type: "api",
    tags: ["Corporate"],
    market: "Singapore",
    locked: false
  },
  {
    id: "securities-trading-api",
    name: "Securities Trading API",
    description: "Execute and manage securities trading operations",
    bundle: "Securities Services",
    type: "api",
    tags: ["Securities Services"],
    market: "Singapore",
    locked: false
  },
  {
    id: "real-time-notifications",
    name: "Real-time Notifications",
    description: "Receive real-time notifications for account activities",
    bundle: "Open Banking",
    type: "webhooks",
    tags: ["Open Banking"],
    market: "Global",
    locked: false
  },
  {
    id: "transaction-alerts",
    name: "Transaction Alerts",
    description: "Get instant alerts for high-value transactions",
    bundle: "Corporate",
    type: "webhooks",
    tags: ["Corporate"],
    market: "Global",
    locked: false
  },
  {
    id: "live-market-data",
    name: "Live Market Data",
    description: "Real-time market data streaming",
    bundle: "Securities Services",
    type: "websockets",
    tags: ["Securities Services"],
    market: "Global",
    locked: false
  },
  {
    id: "trade-execution-stream",
    name: "Trade Execution Stream",
    description: "Live trade execution updates",
    bundle: "Securities Services",
    type: "websockets",
    tags: ["Securities Services"],
    market: "Global",
    locked: false
  },
  {
    id: "banking-as-a-service-core",
    name: "Banking as a Service - Core",
    description: "Core banking services for fintech partners",
    bundle: "Banking as a Service",
    type: "api",
    tags: ["Banking as a service"],
    market: "United Kingdom",
    locked: false
  },
  {
    id: "banking-as-a-service-payments",
    name: "Banking as a Service - Payments",
    description: "Payment processing services for partners",
    bundle: "Banking as a Service",
    type: "api",
    tags: ["Banking as a service"],
    market: "Hong Kong",
    locked: false
  },
  {
    id: "corporate-treasury-api",
    name: "Corporate Treasury API",
    description: "Treasury management and cash positioning",
    bundle: "Corporate",
    type: "api",
    tags: ["Corporate"],
    market: "Singapore",
    locked: false
  },
  {
    id: "fx-trading-api",
    name: "FX Trading API",
    description: "Foreign exchange trading and pricing",
    bundle: "Corporate",
    type: "api",
    tags: ["Corporate", "Securities Services"],
    market: "Global",
    locked: false
  }
];

export default apis;