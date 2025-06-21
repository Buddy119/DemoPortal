import React from 'react';
import { apiData } from '../data/apis';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export default function ApiList() {
  return (
    <div className="space-y-4">
      {apiData.apis.map((api) => (
        <Card key={api.id}>
          <CardHeader>
            <CardTitle>{api.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">{api.description}</p>
            <p className="font-mono text-sm">
              <span className="font-semibold">{api.method}</span> {api.endpoint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
