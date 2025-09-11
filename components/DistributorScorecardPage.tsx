import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { api } from '../services/mockApiService';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import { ClipboardList, Award, Sparkles, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';

interface ScorecardEntry {
    distributorId: string;
    distributorName: string;
    score: number;
    explanation: string[];
}

const ScorecardItem: React.FC<{ entry: ScorecardEntry, rank: number }> = ({ entry, rank }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: 'bg-green-600', text: 'text-green-100', border: 'border-green-700' };
        if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-100', border: 'border-yellow-600' };
        return { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-700' };
    };

    const scoreColor = getScoreColor(entry.score);

    return (
        <Card className="flex flex-col md:flex-row items-start gap-4">
            <div className="flex-shrink-0 w-full md:w-24 flex md:flex-col items-center justify-between md:justify-center text-center gap-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${scoreColor.bg} ${scoreColor.text} border-4 ${scoreColor.border}`}>
                    <span className="text-3xl font-bold">{entry.score}</span>
                </div>
                <div className="text-sm font-semibold text-text-secondary">Rank #{rank}</div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-border w-full md:w-auto pt-4 md:pt-0 md:pl-4">
                <Link to={`/distributors/${entry.distributorId}`} className="text-lg font-bold text-primary hover:underline">
                    {entry.distributorName}
                </Link>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-text-secondary">
                    {entry.explanation.map((line, index) => <li key={index}>{line}</li>)}
                </ul>
            </div>
        </Card>
    );
};


const DistributorScorecardPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [scorecardData, setScorecardData] = useState<ScorecardEntry[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setScorecardData(null);

        try {
            // 1. Fetch data
            const [distributors, orders, orderItems, schemes] = await Promise.all([
                api.getDistributors(),
                api.getOrders(),
                api.getAllOrderItems(),
                api.getSchemes(),
            ]);

            const dataContext = JSON.stringify({ distributors, orders, orderItems, schemes });
            
            // 2. Define response schema for AI
            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        distributorId: { type: Type.STRING },
                        distributorName: { type: Type.STRING },
                        score: { type: Type.INTEGER, description: "A score from 0 to 100" },
                        explanation: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "A list of 2-3 bullet points explaining the score."
                        },
                    },
                },
            };

            // 3. Construct the prompt
            const fullPrompt = `
                You are an expert business analyst for a distribution company. Your task is to analyze the provided JSON data about distributors, their orders, and promotional schemes.
                For each distributor, you must calculate a performance score from 0 to 100.
                Base the score on these factors:
                1. Total Sales Volume: Higher total sales amount is the most important positive factor.
                2. Order Frequency: A higher number of orders indicates consistent business.
                3. Scheme Participation: Analyze how often a distributor's orders include products that are part of a promotional scheme ('buySkuId'). Higher participation is a positive signal.
                
                For each distributor, provide the calculated score and a brief, 2-3 bullet point explanation for the score, mentioning the key factors.

                The current date is ${new Date().toISOString().split('T')[0]}.

                Here is the business data:
                ${dataContext}

                Return your response as a JSON array that strictly adheres to the provided schema.
            `;
            
            // 4. Call Gemini API
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API_KEY environment variable not set.");
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema,
                }
            });

            const parsedResponse = JSON.parse(response.text);
            const sortedData = parsedResponse.sort((a: ScorecardEntry, b: ScorecardEntry) => b.score - a.score);
            setScorecardData(sortedData);

        } catch (err) {
            console.error("Scorecard Generation Error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating the scorecard.");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!scorecardData) return [];
        return scorecardData.filter(entry =>
            entry.distributorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [scorecardData, searchTerm]);
    
    const canAccess = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.EXECUTIVE;

    if (!canAccess) {
        return (
            <Card className="text-center">
                <p className="text-text-secondary">You do not have permission to view this page.</p>
            </Card>
        );
    }


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <Card className="text-center">
                <ClipboardList size={48} className="mx-auto text-primary" />
                <h1 className="text-3xl font-bold mt-4 text-text-primary">Distributor Performance Scorecard</h1>
                <p className="mt-2 text-text-secondary">Use AI to analyze and rank distributors based on sales, order frequency, and scheme participation.</p>
                <Button onClick={handleGenerate} disabled={loading} className="mt-6">
                    {loading ? 'Analyzing...' : 'Generate Scorecard'}
                </Button>
            </Card>

            {loading && (
                 <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <Sparkles size={32} className="text-primary animate-pulse" />
                    <p className="text-text-secondary">AI is analyzing performance data... this may take a moment.</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                    <AlertTriangle size={20} className="mr-3"/>
                    <div>
                        <h3 className="font-semibold">Analysis Failed</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {scorecardData && (
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-text-primary flex items-center"><Award size={24} className="mr-2 text-primary"/> Performance Rankings</h2>
                        <div className="w-full sm:w-auto sm:max-w-xs">
                             <Input
                                id="search-scorecard"
                                placeholder="Search distributors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Search size={16} className="text-text-secondary" />}
                            />
                        </div>
                    </div>
                     <div className="space-y-4">
                        {filteredData.length > 0 ? (
                            filteredData.map((entry, index) => (
                                <ScorecardItem key={entry.distributorId} entry={entry} rank={scorecardData.findIndex(item => item.distributorId === entry.distributorId) + 1} />
                            ))
                        ) : (
                             <p className="text-center p-8 text-text-secondary">No distributors found for "{searchTerm}".</p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default DistributorScorecardPage;
