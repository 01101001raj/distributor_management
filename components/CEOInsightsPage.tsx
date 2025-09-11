import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { api } from '../services/mockApiService';
import Card from './common/Card';
import Button from './common/Button';
import { BrainCircuit, Sparkles, Send, BarChart3, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

// Simple Markdown-like renderer
const AIResponseRenderer = ({ text }: { text: string }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const renderLine = (line: string) => {
        // Bold text: **text**
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: line }} />;
    };

    const listItems: string[] = [];
    const content: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        if (line.trim().startsWith('* ')) {
            listItems.push(line.trim().substring(2));
        } else {
            if (listItems.length > 0) {
                content.push(
                    <ul key={`ul-${index}`} className="list-disc list-inside space-y-1 my-2">
                        {listItems.map((item, itemIndex) => <li key={itemIndex}>{renderLine(item)}</li>)}
                    </ul>
                );
                listItems.length = 0; // Clear the array
            }
            content.push(<p key={index} className="mb-2">{renderLine(line)}</p>);
        }
    });

    if (listItems.length > 0) {
        content.push(
            <ul key="ul-last" className="list-disc list-inside space-y-1 my-2">
                {listItems.map((item, itemIndex) => <li key={itemIndex}>{renderLine(item)}</li>)}
            </ul>
        );
    }

    return <div className="prose prose-sm max-w-none text-text-primary">{content}</div>;
};


const CEOInsightsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [userInput, setUserInput] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const examplePrompts = [
        "Summarize this month's sales performance.",
        "Who are my top 5 and bottom 5 distributors by sales volume?",
        "Which products are performing best in Maharashtra?",
        "Identify any distributors with low wallet balances but high recent order volume.",
    ];

    const handleGenerate = async (prompt?: string) => {
        const query = prompt || userInput;
        if (!query) return;

        setLoading(true);
        setError(null);
        setAiResponse('');

        try {
            // 1. Fetch all data from the mock API
            const [distributors, orders, orderItems, products, schemes] = await Promise.all([
                api.getDistributors(),
                api.getOrders(),
                api.getAllOrderItems(),
                api.getSKUs(),
                api.getSchemes(),
            ]);

            // 2. Prepare the data context for the AI
            const dataContext = JSON.stringify({
                dateRangeOfData: {
                    oldestOrder: orders.reduce((oldest, current) => new Date(current.date) < new Date(oldest.date) ? current : oldest).date,
                    newestOrder: orders.reduce((newest, current) => new Date(current.date) > new Date(newest.date) ? current : newest).date,
                },
                distributors,
                orders,
                orderItems,
                products,
                schemes
            }, null, 2);

            // 3. Initialize Gemini API and construct the prompt
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("API_KEY environment variable not set.");
            }
            const ai = new GoogleGenAI({ apiKey });

            const fullPrompt = `
                You are a top-tier business analyst and CEO assistant for a distribution company. Your task is to analyze the provided JSON data and answer the user's question with concise, actionable insights.
                Present your findings in clear, simple markdown format. Use bullet points for lists (e.g., "* Item 1"), and bold text for key metrics or names (e.g., "**Distributor Name**").
                Do not return JSON or code. Focus on providing a high-level summary suitable for a CEO. All currency is in Indian Rupees (₹).

                Here is the complete business data in JSON format:
                ${dataContext}

                Based on this data, please answer the following question: "${query}"
            `;

            // 4. Call the API
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: fullPrompt,
            });

            setAiResponse(response.text);

        } catch (err) {
            console.error("AI Insight Generation Error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating insights.");
        } finally {
            setLoading(false);
            setUserInput('');
        }
    };
    
    if (currentUser?.role !== UserRole.SUPER_ADMIN) {
        return (
            <Card className="text-center">
                <p className="text-text-secondary">You do not have permission to view this page.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <BrainCircuit size={48} className="mx-auto text-primary" />
                <h1 className="text-3xl font-bold mt-4 text-text-primary">CEO Insights</h1>
                <p className="mt-2 text-text-secondary">Ask questions about your business data and get AI-powered answers.</p>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="e.g., 'What are my top selling products this quarter?'"
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition bg-white text-sm text-text-primary border-border focus:border-primary"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <Button onClick={() => handleGenerate()} disabled={loading || !userInput} className="w-full sm:w-auto">
                        {loading ? 'Analyzing...' : <><Send size={16}/>Generate Insights</>}
                    </Button>
                </div>
                <div className="mt-4">
                    <p className="text-xs text-text-secondary mb-2">Or try an example:</p>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map(prompt => (
                            <button 
                                key={prompt}
                                onClick={() => handleGenerate(prompt)}
                                disabled={loading}
                                className="text-xs bg-background px-2 py-1 rounded-md border border-border hover:bg-primary/10 hover:border-primary transition-colors disabled:opacity-50"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>
            
            {(loading || aiResponse || error) && (
                 <Card>
                    <h2 className="text-lg font-semibold flex items-center mb-4">
                        <BarChart3 size={20} className="mr-2 text-primary" />
                        Analysis Report
                    </h2>
                    {loading && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Sparkles size={32} className="text-primary animate-pulse" />
                            <p className="text-text-secondary">AI is analyzing your data... this may take a moment.</p>
                        </div>
                    )}
                    {error && (
                         <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-sm">
                            <AlertTriangle size={20} className="mr-3 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Analysis Failed</h3>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}
                    {aiResponse && (
                        <div className="p-4 bg-background rounded-lg border border-border text-sm">
                            <AIResponseRenderer text={aiResponse} />
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default CEOInsightsPage;