import { supabase } from '../../../utils/supabase';
import { NextRequest } from 'next/server';

// Define types for document structures
interface DocumentResult {
  similarity: number;
  source: string;
  content: string;
}

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    // Test embedding API
    console.log("Testing embedding API with query:", query);
    const embeddingResponse = await fetch(process.env.EMBEDDING_API_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API error: ${embeddingResponse.status} ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    console.log("Embedding API response:", 
      `Length: ${embeddingData?.embedding?.length || 'N/A'}, ` +
      `Processing time: ${embeddingData?.processing_time_ms || 'N/A'}ms`
    );

    // Test Supabase
    console.log("Testing Supabase connection with sample embedding");
    const { data: documents, error } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embeddingData.embedding,
        match_threshold: 0.5,
        match_count: 2
      }
    );

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      embedding: {
        length: embeddingData.embedding.length,
        first10Values: embeddingData.embedding.slice(0, 10),
        processingTimeMs: embeddingData.processing_time_ms
      },
      documents: (documents as DocumentResult[]).map((doc) => ({
        similarity: doc.similarity,
        source: doc.source,
        contentPreview: doc.content.substring(0, 100) + '...'
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Debug API Error:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}