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
	id: "dcr-register-client",
	name: "Post Register – Consumer Data Right",
	description: "Register a software product with a Data Holder in accordance with the Consumer Data Right Dynamic Client Registration specification.",
	bundle: "Dynamic Client Registration (DCR)",
	type: "api",
	version: "1.0",
	method: "POST",
	endpoint: "https://secure.api.dataholder.com/register",
	relatedGuides: ["Dynamic Client Registration", "Software Statement Assertions"],
	subtitle: "Submit a signed SSA‑JWT to create a client record at the Data Holder",
	tags: ["Consumer Data Right", "Dynamic Client Registration", "Open Banking"],
	market: "United Kingdom",
	locked: false,
	sections: [
		{
			heading: "Included",
			markdown: `This endpoint allows an Accredited Data Recipient (ADR) to register its **Software Product** with a Data Holder by sending a signed JWT (containing the Software Statement Assertion) as the request body using the \`application/jwt\` content type.

A successful call returns the newly issued \`client_id\` and the full set of registered metadata.`
		},
		{
			heading: "Not included",
			markdown: `• Updating an existing registration → **PUT /register/{clientId}**
• Retrieving a registration → **GET /register/{clientId}**
• Deleting a registration → **DELETE /register/{clientId}**
• Accessing consumer banking or energy data – use sector‑specific resource APIs instead.`
		},
		{
			heading: "Authentication",
			markdown: `**Initial POST /register calls are unauthenticated** (no bearer/access token required).

Subsequent management operations MUST use the **client_credentials** grant with the scope \`cdr:registration\`, authenticated via **private_key_jwt**.

All traffic must occur over **HTTPS**.`
		}
	],
	codeSamples: {
		python: "import requests\n\nurl = \"https://secure.api.dataholder.com/register\"\n# SSA JWT issued by the CDR Register\njwt_payload = \"eyJhbGciOiJQUzI1NiIsInR5cCI6IkpXVCJ9....\"\nheaders = {\n    \"Content-Type\": \"application/jwt\",\n    \"Accept\": \"application/json\",\n    \"x-v\": \"1\"\n}\nresponse = requests.post(url, data=jwt_payload, headers=headers,\n                         cert=(\"cert.pem\", \"key.pem\"))\nprint(response.status_code)\nprint(response.text)",
		curl: "curl -X POST https://secure.api.dataholder.com/register \\\n  -H 'Content-Type: application/jwt' \\\n  -H 'Accept: application/json' \\\n  -H 'x-v: 1' \\\n  --data @ssa.jwt \\\n  --cert ./cert.pem --key ./key.pem",
		"node.js": "const axios = require('axios');\nconst fs = require('fs');\n(async () => {\n  const jwt = fs.readFileSync('./ssa.jwt', 'utf8');\n  const res = await axios.post('https://secure.api.dataholder.com/register', jwt, {\n    headers: {\n      'Content-Type': 'application/jwt',\n      'Accept': 'application/json',\n      'x-v': '1'\n    },\n    httpsAgent: new (require('https').Agent)({\n      cert: fs.readFileSync('cert.pem'),\n      key: fs.readFileSync('key.pem')\n    })\n  });\n  console.log(res.data);\n})();"
	}
},
    {
  id: "dcr-get-client",
  name: "Get Register – Consumer Data Right",
  description: "Retrieve registration details of a software product previously registered with a Data Holder.",
  bundle: "Dynamic Client Registration (DCR)",
  type: "api",
  version: "1.0",
  method: "GET",
  endpoint: "https://secure.api.dataholder.com/register/{clientId}",
  relatedGuides: ["Dynamic Client Registration", "Client Management"],
  subtitle: "Fetch current metadata for a registered client",
  tags: ["Consumer Data Right", "Dynamic Client Registration", "Open Banking"],
  market: "United Kingdom",
  locked: false,
  sections: [
    {
      heading: "Included",
      markdown: `This endpoint returns the full **registration metadata** for the specified \`clientId\`.

Typical use‑cases include health checks, validation of existing redirect URIs, and troubleshooting integration issues.`
    },
    {
      heading: "Not included",
      markdown: `• Creating a new registration → **POST /register**  
• Updating registration details → **PUT /register/{clientId}**  
• Deleting a registration → **DELETE /register/{clientId}**  
• Accessing consumer banking or energy data – use sector‑specific resource APIs instead.`
    },
    {
      heading: "Authentication",
      markdown: `Requires a **Bearer token** obtained with the **client_credentials** grant and scope \`cdr:registration\`, authenticated via **private_key_jwt**.

All traffic must occur over **HTTPS**.`
    }
  ],
  codeSamples: {
    python: `import requests

client_id = "123e4567-e89b-12d3-a456-426614174000"
url = f"https://secure.api.dataholder.com/register/{client_id}"

headers = {
    "Authorization": "Bearer <access_token>",
    "Accept": "application/json",
    "x-v": "1"
}

response = requests.get(url, headers=headers, cert=("cert.pem", "key.pem"))
print(response.status_code)
print(response.json())`,
    curl: `curl -X GET https://secure.api.dataholder.com/register/{clientId} \\
  -H 'Authorization: Bearer <access_token>' \\
  -H 'Accept: application/json' \\
  -H 'x-v: 1' \\
  --cert ./cert.pem --key ./key.pem`,
    "node.js": `const axios = require('axios');
const https = require('https');
const fs = require('fs');

(async () => {
  const clientId = '123e4567-e89b-12d3-a456-426614174000';
  const res = await axios.get(
    'https://secure.api.dataholder.com/register/' + clientId,
    {
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Accept': 'application/json',
        'x-v': '1'
      },
      httpsAgent: new https.Agent({
        cert: fs.readFileSync('cert.pem'),
        key: fs.readFileSync('key.pem')
      })
    }
  );
  console.log(res.data);
})();`
  }
},
    {
  id: "dcr-update-client",
  name: "Put Register – Consumer Data Right",
  description: "Update the registration metadata of an existing software product at the Data Holder.",
  bundle: "Dynamic Client Registration (DCR)",
  type: "api",
  version: "1.0",
  method: "PUT",
  endpoint: "https://secure.api.dataholder.com/register/{clientId}",
  relatedGuides: ["Dynamic Client Registration", "Client Management"],
  subtitle: "Modify redirect URIs, scopes, or other client properties",
  tags: ["Consumer Data Right", "Dynamic Client Registration", "Open Banking"],
  market: "United Kingdom",
  locked: false,
  sections: [
    {
      heading: "Included",
      markdown: `This endpoint lets an ADR **replace** the existing registration metadata for a given \`clientId\`.

Typical updates include redirect URIs, JWKS URI, token endpoint auth method, or logo URI. Any fields omitted in the payload will be reset to their default values.`
    },
    {
      heading: "Not included",
      markdown: `• Creating a new registration → **POST /register**  
• Retrieving metadata → **GET /register/{clientId}**  
• Deleting a registration → **DELETE /register/{clientId}**  
• Partial / PATCH‑style modifications (must send full object).`
    },
    {
      heading: "Authentication",
      markdown: `Requires a **Bearer token** obtained with the **client_credentials** grant and scope \`cdr:registration\`, authenticated via **private_key_jwt**.

All traffic must occur over **HTTPS**.`
    }
  ],
  codeSamples: {
    python: `import requests, json

client_id = "123e4567-e89b-12d3-a456-426614174000"
url = f"https://secure.api.dataholder.com/register/{client_id}"

updated_metadata = {
  "redirect_uris": [
    "https://app.example.com/callback",
    "https://app.example.com/alt-callback"
  ],
  "jwks_uri": "https://app.example.com/.well-known/jwks.json",
  "token_endpoint_auth_method": "private_key_jwt"
}

headers = {
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json",
  "x-v": "1"
}

response = requests.put(
  url,
  headers=headers,
  data=json.dumps(updated_metadata),
  cert=("cert.pem", "key.pem")
)

print(response.status_code)
print(response.json())`,
    curl: `curl -X PUT https://secure.api.dataholder.com/register/{clientId} \\
  -H 'Authorization: Bearer <access_token>' \\
  -H 'Content-Type: application/json' \\
  -H 'x-v: 1' \\
  --data @updated-metadata.json \\
  --cert ./cert.pem --key ./key.pem`,
    "node.js": `const axios = require('axios');
const fs = require('fs');
const https = require('https');

(async () => {
  const clientId = '123e4567-e89b-12d3-a456-426614174000';
  const metadata = JSON.parse(fs.readFileSync('updated-metadata.json', 'utf8'));

  const res = await axios.put(
    'https://secure.api.dataholder.com/register/' + clientId,
    metadata,
    {
      headers: {
        'Authorization': 'Bearer <access_token>',
        'Content-Type': 'application/json',
        'x-v': '1'
      },
      httpsAgent: new https.Agent({
        cert: fs.readFileSync('cert.pem'),
        key: fs.readFileSync('key.pem')
      })
    }
  );
  console.log(res.data);
})();`
  }
}

];

export default apis;