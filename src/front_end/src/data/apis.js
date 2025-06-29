export const apiData = {
    apis: [
        {
            id: 'list-users',
            name: 'List Users API',
            description: 'List all users.',
            endpoint: '/api/v1/users',
            method: 'GET',
            parameters: [
                { name: 'limit', type: 'integer', description: 'Max users to return' },
            ],
            curlExample: 'curl https://example.com/api/v1/users',
            responseExample: '{"users": []}',
            fields: [
                { name: 'id', type: 'string', description: 'User identifier' },
            ],
        },
        {
            id: 'get-user',
            name: 'Get Specific User API',
            description: 'Get a specific user.',
            endpoint: '/api/users/{id}',
            method: 'GET',
            parameters: [
                { name: 'id', type: 'string', description: 'User ID' },
            ],
            curlExample: 'curl https://example.com/api/users/123',
            responseExample: '{"id": "123", "name": "Alice"}',
            fields: [
                { name: 'id', type: 'string', description: 'User identifier' },
                { name: 'name', type: 'string', description: 'Full name' },
            ],
        }
    ],
};
