export const apiData = {
    apis: [
        {
            id: 'list-users',
            name: 'List Users API',
            description: 'List all users.',
            endpoint: '/api/v1/users',
            method: 'GET',
        },
        {
            id: 'get-user',
            name: 'Get Specific User API',
            description: 'Get a specific user.',
            endpoint: '/api/users/{id}',
            method: 'GET',
        }
    ],
};
