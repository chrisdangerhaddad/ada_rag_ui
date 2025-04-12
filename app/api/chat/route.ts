import { supabase } from '../../../utils/supabase';
import { NextRequest } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

// Define types for document structures
interface DocumentResult {
  similarity: number;
  source: string;
  content: string;
}

// Configure Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    console.log("Processing query:", query);

    // 1. Get query embedding by calling your Python API
    const embeddingResponse = await fetch(process.env.EMBEDDING_API_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`Failed to get embedding: ${embeddingResponse.status} - ${errorText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.embedding;

    console.log("Embedding generated, length:", embedding.length);

    // 2. Query Supabase for similar documents
    const { data: documents, error } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 3
      }
    );

    if (error) {
      console.error('Error querying Supabase:', error);
      throw new Error(`Failed to retrieve relevant documents: ${error.message}`);
    }

    console.log("Found documents:", documents.length);
    
    if (documents.length > 0) {
      console.log("First document similarity:", documents[0].similarity);
    } else {
      console.log("No relevant documents found");
    }

    // 3. Prepare context from retrieved documents
    const context = (documents as DocumentResult[]).map((doc) => {
      return `Source: ${doc.source}\n${doc.content}`;
    }).join('\n\n');

    // 4. Generate Claude response - non-streaming
    console.log("Calling Claude API...");
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are a helpful assistant that answers questions based on the provided context. If the answer cannot be found in the context, say so clearly. Always cite your sources.",
      messages: [
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        {
          role: "user",
          content: `I need information about: ${query}
          
Context information:
${context}

Please answer based on this context information. If you can't find the answer in the context, just say you don't have enough information.`
        }
      ],
      stream: false
    });

    console.log("Claude API response received");

    // 5. Return regular JSON response
    return new Response(JSON.stringify({
      role: 'assistant',
      content: response.content[0].text
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}