'use client';

import { useState } from 'react';

// Define types for the response data
interface EmbeddingData {
  length: number;
  first10Values: number[];
  processingTimeMs: number;
}

interface DocumentPreview {
  similarity: number;
  source: string;
  contentPreview: string;
}

interface ResponseData {
  success: boolean;
  embedding?: EmbeddingData;
  documents?: DocumentPreview[];
  error?: string;
}

export default function DebugPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json() as ResponseData;
      setResult(data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err: unknown) {
      console.error('Debug test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">RAG Chatbot Debug</h1>
      
      <div className="mb-6">
        <p className="mb-2">
          This page tests your embedding API and Supabase connection to make sure everything is working.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a test query"
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={testConnections}
            disabled={loading || !query}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {loading ? 'Testing...' : 'Test Connections'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 rounded text-red-700">
          <h3 className="font-bold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="border border-gray-200 rounded p-4">
          <h2 className="text-xl font-bold mb-4">Results</h2>
          
          <div className="mb-6">
            <h3 className="font-bold mb-2">Embedding API</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p>Status: {result.success ? '✅ Working' : '❌ Failed'}</p>
              {result.embedding && (
                <>
                  <p>Vector length: {result.embedding.length}</p>
                  <p>Processing time: {result.embedding.processingTimeMs}ms</p>
                  <details>
                    <summary className="cursor-pointer text-blue-500">First 10 values</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                      {JSON.stringify(result.embedding.first10Values, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Supabase Results</h3>
            <div className="bg-gray-50 p-4 rounded">
              {result.documents && result.documents.length > 0 ? (
                <div>
                  <p className="mb-2">✅ Found {result.documents.length} relevant documents</p>
                  <div className="space-y-4">
                    {result.documents.map((doc, i) => (
                      <div key={i} className="border border-gray-200 p-3 rounded">
                        <p><strong>Similarity:</strong> {doc.similarity.toFixed(4)}</p>
                        <p><strong>Source:</strong> {doc.source}</p>
                        <p className="mt-1"><strong>Preview:</strong> {doc.contentPreview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>❌ No documents found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}