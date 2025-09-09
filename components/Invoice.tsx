import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { InvoiceData } from '../types';
import Button from './common/Button';
import { Printer } from 'lucide-react';

const Invoice: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setError("No Order ID provided.");
            setLoading(false);
            return;
        }

        const fetchInvoiceData = async () => {
            setLoading(true);
            try {
                const data = await api.getInvoiceData(orderId);
                if (data) {
                    setInvoiceData(data);
                } else {
                    setError("Invoice not found.");
                }
            } catch (err) {
                setError("Failed to load invoice data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInvoiceData();
    }, [orderId]);

    if (loading) {
        return <div className="p-8 text-center">Loading Invoice...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!invoiceData) {
        return null;
    }

    const { order, distributor, items } = invoiceData;
    
    return (
        <>
            <style>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .invoice-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        border: none !important;
                    }
                }
            `}</style>
            <div className="bg-gray-100 min-h-screen p-4 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl mx-auto bg-white shadow-lg p-8 sm:p-12 border invoice-container">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                            <p className="text-text-secondary">Your Company Name</p>
                            <p className="text-text-secondary text-sm">123 Business Rd, Business City</p>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-sm text-text-secondary">#{order.id}</p>
                            <p><span className="font-semibold">Date:</span> {new Date(order.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-text-secondary mb-2">BILL TO</h2>
                        <p className="text-lg font-bold text-text-primary">{distributor.name}</p>
                        <p className="text-text-secondary">{distributor.area}, {distributor.state}</p>
                        <p className="text-text-secondary">{distributor.phone}</p>
                    </div>

                    {/* Items Table */}
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-text-secondary uppercase">Item</th>
                                    <th className="p-3 text-sm font-semibold text-text-secondary uppercase text-center">Qty</th>
                                    <th className="p-3 text-sm font-semibold text-text-secondary uppercase text-right">Rate</th>
                                    <th className="p-3 text-sm font-semibold text-text-secondary uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-3 font-medium">{item.skuName} {item.isFreebie && <span className="text-green-600 font-normal text-xs">(Freebie)</span>}</td>
                                        <td className="p-3 text-center">{item.quantity}</td>
                                        <td className="p-3 text-right">₹{item.unitPrice.toFixed(2)}</td>
                                        <td className="p-3 text-right font-semibold">₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Totals */}
                    <div className="flex justify-end mt-8">
                        <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                             <div className="flex justify-between">
                                <span className="text-text-secondary">Subtotal</span>
                                <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-3">
                                <span className="text-text-primary font-bold text-xl">TOTAL</span>
                                <span className="font-bold text-xl text-primary">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                             <div className="text-right text-sm text-text-secondary space-y-1 pt-4">
                                <p>Paid from Wallet: ₹{order.coveredByWallet.toFixed(2)}</p>
                                <p>Paid from Credit: ₹{order.coveredByCredit.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                     {/* Footer */}
                     <div className="text-center text-sm text-text-secondary mt-12 border-t pt-4">
                        <p>Thank you for your business!</p>
                     </div>
                </div>
                 <div className="w-full max-w-4xl mx-auto mt-4 text-center no-print">
                    <Button onClick={() => window.print()}>
                        <Printer size={16} className="mr-2" />
                        Print Invoice
                    </Button>
                </div>
            </div>
        </>
    );
};

export default Invoice;
