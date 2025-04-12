'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Suggested questions that can be updated easily
const SUGGESTED_QUESTIONS = [
  "What is the ADA CERP program?",
  "What is the difference between \"administrative services only (ASO)\" and a fully insured dental benefit program?",
  "Can you explain the \"birthday rule\" in the context of dental insurance for dependent children?",
  "According to this glossary, what are some examples of \"cost containment\" measures in a dental benefit program?",
  "How does the American Dental Political Action Committee (ADPAC) give dentists a voice in Washington, D.C.?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-focus the input field when the page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-resize textarea as user types
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content
    textarea.style.height = `${textarea.scrollHeight}px`;
    
    // Limit the maximum height
    if (textarea.scrollHeight > 150) {
      textarea.style.height = '150px';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    try {
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: ''
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Call API
      console.log("Sending request to API...");
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });
      
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.status}`);
      }
      
      // Process JSON response
      const result = await response.json();
      console.log("Received response:", result);
      
      // Update the assistant message with the response content
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: result.content
        };
        return updated;
      });
      
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove assistant placeholder
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send (but Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Dental AI Assistant</h1>
          <div className="text-sm text-gray-500 flex items-center space-x-2">
            <span>Created by Whitney Haddad</span>
            <span className="text-gray-300">|</span>
            <span>Powered by RAG + Claude</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col md:flex-row">
        {/* Chat Container */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col">
          {/* Messages */}
          <div className="flex-1 space-y-4 mb-6">
            {messages.length === 0 && (
              <div className="text-center py-16 px-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to the Dental AI Assistant</h2>
                <p className="text-gray-600 mb-4">
                  Ask me questions about dental programs, education, or policies, and I&apos;ll find the most relevant information for you.
                </p>
                <p className="text-gray-500 text-sm">Try one of the suggested questions from the sidebar →</p>
              </div>
            )}
            
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 rounded-tl-none'
                  }`}
                >
                  {message.content || (message.role === 'assistant' && isLoading && 
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse text-gray-400">Thinking</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>
        
        {/* Suggestions Sidebar */}
        <aside className="w-full md:w-72 lg:w-80 p-4 md:border-l border-gray-200 md:pl-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
            <h3 className="font-medium text-gray-800 mb-3">Suggested Questions</h3>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 text-sm transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
      
      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 sticky bottom-0">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 bg-gray-100 rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
              <textarea
                ref={inputRef}
                className="w-full bg-transparent p-3 max-h-[150px] focus:outline-none resize-none"
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask me about dental programs, education, or policies..."
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center min-w-[50px] h-[50px] disabled:bg-blue-300 disabled:cursor-not-allowed transition"
              disabled={isLoading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for a new line
          </div>
        </div>
      </footer>
    </div>
  );
}