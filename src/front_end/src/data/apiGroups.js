import { apiData } from './apis.js';

const find = (id) => apiData.apis.find((a) => a.id === id);

export const apiGroups = [
  {
    title: 'Dynamic Client Registration APIs',
    apis: [
      find('dcr-register-client'),
      find('dcr-get-client'),
      find('dcr-update-client'),
      find('dcr-delete-client'),
    ],
  },
  {
    title: 'Authorization APIs',
    apis: [
      find('oauth-authorize'),
      find('oauth-par'),
      find('oauth-token'),
      find('oauth-revoke'),
      find('oauth-introspect'),
    ],
  },
  {
    title: 'Products',
    apis: [find('get-products'), find('get-product-detail')],
  },
  {
    title: 'Accounts',
    apis: [find('get-accounts'), find('get-account-detail')],
  },
  {
    title: 'Balances',
    apis: [find('get-bulk-balances'), find('get-account-balance')],
  },
  {
    title: 'Transactions',
    apis: [find('get-account-transactions'), find('get-transaction-detail')],
  },
  {
    title: 'Direct Debits',
    apis: [find('get-account-direct-debits'), find('get-bulk-direct-debits')],
  },
  {
    title: 'Scheduled Payments',
    apis: [find('get-account-scheduled-payments'), find('get-bulk-scheduled-payments')],
  },
  {
    title: 'Payees',
    apis: [find('get-payees'), find('get-payee-detail')],
  },
  {
    title: 'Common APIs',
    apis: [
      find('get-customer'),
      find('get-customer-detail'),
      find('get-common-status'),
      find('get-common-outages'),
    ],
  },
];
