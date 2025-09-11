import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/mockApiService';
import { Distributor, SKU, SpecialPrice, Scheme } from '../types';
import Card from './common/Card';
import Input from './common/Input';
import { Search, Tag, Sparkles } from 'lucide-react';

const SpecialAssignmentsPage = () => {
    const [activeTab, setActiveTab] = useState('pricing');
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [skus, setSkus] = useState<SKU[]>([]);
    const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
    const [distributorSchemes, setDistributorSchemes] = useState<Scheme[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [distData, skuData, priceData, schemeData] = await Promise.all([
                    api.getDistributors(),
                    api.getSKUs(),
                    api.getAllSpecialPrices(),
                    api.getSchemes(),
                ]);
                setDistributors(distData);
                setSkus(skuData.sort((a,b) => a.name.localeCompare(b.name)));
                setSpecialPrices(priceData);
                setDistributorSchemes(schemeData.filter(s => !s.isGlobal));
            } catch (error) {
                console.error("Failed to fetch data for special assignments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const filteredDistributors = useMemo(() => {
        return distributors.filter(d => 
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.id.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [distributors, searchTerm]);

    const priceMap = useMemo(() => {
        const map = new Map<string, SpecialPrice>();
        const todayStr = new Date().toISOString().split('T')[0];
        specialPrices.forEach(sp => {
            if (sp.startDate <= todayStr && sp.endDate >= todayStr) {
                map.set(`${sp.distributorId}-${sp.skuId}`, sp);
            }
        });
        return map;
    }, [specialPrices]);
    
    const schemeMap = useMemo(() => {
        const map = new Map<string, Scheme[]>();
        distributorSchemes.forEach(scheme => {
            if (scheme.distributorId) {
                const existing = map.get(scheme.distributorId) || [];
                map.set(scheme.distributorId, [...existing, scheme]);
            }
        });
        return map;
    }, [distributorSchemes]);

    if (loading) {
        return <div className="text-center p-8">Loading special assignments...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold">Special Assignments</h2>
                    <div className="w-full sm:w-auto sm:max-w-xs">
                        <Input
                            id="search-distributor"
                            placeholder="Search distributors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={16} className="text-text-secondary" />}
                        />
                    </div>
                </div>

                <div className="border-b border-border mt-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('pricing')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pricing' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}>
                            Special Pricing
                        </button>
                        <button onClick={() => setActiveTab('schemes')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'schemes' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}`}>
                            Special Schemes
                        </button>
                    </nav>
                </div>
            </Card>

            {activeTab === 'pricing' && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center"><Tag size={20} className="mr-2 text-primary" /> Special Pricing Matrix</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        This table shows the final price for each distributor and product. Prices highlighted in <span className="p-1 rounded bg-yellow-100 text-yellow-800">yellow</span> are active special prices. All other prices are the default.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead className="bg-background sticky top-0">
                                <tr>
                                    <th className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Distributor</th>
                                    {skus.map(sku => (
                                        <th key={sku.id} className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider text-center whitespace-nowrap">{sku.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDistributors.map(dist => (
                                    <tr key={dist.id} className="border-b border-border last:border-b-0 hover:bg-background">
                                        <td className="p-3 font-medium text-text-primary whitespace-nowrap">{dist.name}</td>
                                        {skus.map(sku => {
                                            const specialPrice = priceMap.get(`${dist.id}-${sku.id}`);
                                            const isSpecial = !!specialPrice;
                                            return (
                                                <td key={sku.id} className={`p-3 text-center font-semibold whitespace-nowrap ${isSpecial ? 'bg-yellow-100 text-yellow-800' : ''}`} title={isSpecial ? `Special price valid from ${specialPrice.startDate} to ${specialPrice.endDate}` : `Default price`}>
                                                    ₹{isSpecial ? specialPrice.price.toLocaleString() : sku.price.toLocaleString()}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredDistributors.length === 0 && (
                            <div className="text-center p-6 text-text-secondary">
                                <p>No distributors found for "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'schemes' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary flex items-center"><Sparkles size={20} className="mr-2 text-primary" /> Distributor-Specific Schemes</h3>
                    {filteredDistributors.map(dist => {
                        const schemesForDist = schemeMap.get(dist.id);
                        if (!schemesForDist) return null;

                        return (
                            <Card key={dist.id}>
                                <h4 className="font-bold text-text-primary">{dist.name}</h4>
                                <div className="mt-2 space-y-2 divide-y divide-border">
                                    {schemesForDist.map(scheme => (
                                        <div key={scheme.id} className="pt-2 first:pt-0">
                                            <p className="font-semibold text-sm">{scheme.description}</p>
                                            <p className="text-sm text-text-secondary">
                                                Buy {scheme.buyQuantity} x <span className="font-medium">{skus.find(s=>s.id === scheme.buySkuId)?.name}</span>,
                                                Get {scheme.getQuantity} x <span className="font-medium text-green-600">{skus.find(s=>s.id === scheme.getSkuId)?.name}</span> Free
                                            </p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                (Active: {scheme.startDate} to {scheme.endDate})
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )
                    })}
                    {Array.from(schemeMap.keys()).filter(id => filteredDistributors.some(d => d.id === id)).length === 0 && (
                        <Card>
                            <p className="text-center p-6 text-text-secondary">
                                No distributors with special schemes found{searchTerm ? ` for "${searchTerm}"` : ''}.
                            </p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};
export default SpecialAssignmentsPage;