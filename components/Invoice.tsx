import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/mockApiService';
import { InvoiceData } from '../types';
import Button from './common/Button';
import { Printer } from 'lucide-react';
import { formatIndianCurrency, numberToWordsInRupees } from '../utils/formatting';

const GST_RATE = 0.18; // 18%
const CGST_RATE = GST_RATE / 2;
const SGST_RATE = GST_RATE / 2;
const COMPANY_GSTIN = "27ABCDE1234F1Z5"; // Example GSTIN

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
        return <div className="p-8 text-center bg-background min-h-screen">Loading Invoice...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500 bg-background min-h-screen">{error}</div>;
    }

    if (!invoiceData) {
        return null;
    }

    const { order, distributor, items } = invoiceData;
    const currencyOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    
    const taxableItems = items.filter(item => !item.isFreebie);
    const subtotal = taxableItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalCgst = subtotal * CGST_RATE;
    const totalSgst = subtotal * SGST_RATE;
    const grandTotal = subtotal + totalCgst + totalSgst;

    return (
        <>
            <style>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: #fff;
                    }
                    .no-print { display: none !important; }
                    .invoice-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .print-table th {
                        background-color: #F8F9FA !important;
                    }
                }
            `}</style>
            <div className="bg-slate-100 min-h-screen p-4 sm:p-8 flex flex-col items-center no-print">
                 <div className="w-full max-w-4xl mx-auto mb-4 text-right">
                    <Button onClick={() => window.print()}>
                        <Printer size={16}/>
                        Print Invoice
                    </Button>
                </div>
            </div>
            <div className="bg-slate-100 p-4 sm:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl mx-auto bg-white shadow-lg p-8 sm:p-12 border invoice-container">
                    <header className="flex justify-between items-start pb-6 border-b-2 border-primary">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">TAX INVOICE</h1>
                            <p className="font-semibold text-text-primary mt-2">Your Company Name</p>
                            <p className="text-text-secondary text-sm">123 Business Rd, Business City, Maharashtra, 400001</p>
                            <p className="text-text-secondary text-sm">Email: contact@yourcompany.com</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold">Invoice No: <span className="font-mono">{order.id}</span></p>
                            <p>Date: <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span></p>
                            <p className="mt-2 font-semibold">GSTIN: <span className="font-mono">{COMPANY_GSTIN}</span></p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                        <div>
                            <h2 className="text-sm font-semibold text-text-secondary mb-2">BILLED TO:</h2>
                            <p className="font-bold text-text-primary">{distributor.name}</p>
                            <p className="text-text-secondary">{distributor.area}, {distributor.state}</p>
                            <p className="text-text-secondary">{distributor.phone}</p>
                        </div>
                    </section>

                    <section className="w-full overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 print-table">
                                <tr>
                                    <th className="p-3 font-semibold text-text-secondary uppercase w-8">#</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase">Item & HSN</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-center">Qty</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">Rate</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">Taxable Value</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-center">GST</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">CGST</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">SGST</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const isTaxable = !item.isFreebie;
                                    const taxableValue = isTaxable ? item.quantity * item.unitPrice : 0;
                                    const cgst = isTaxable ? taxableValue * CGST_RATE : 0;
                                    const sgst = isTaxable ? taxableValue * SGST_RATE : 0;
                                    const total = isTaxable ? taxableValue + cgst + sgst : 0;
                                    return (
                                        <tr key={index} className={`border-b ${item.isFreebie ? 'bg-green-50' : ''}`}>
                                            <td className="p-3 text-text-secondary">{index + 1}</td>
                                            <td className="p-3 font-medium text-text-primary">
                                                {item.skuName} {item.isFreebie && <span className="text-green-600 font-normal">(Freebie)</span>}
                                                <span className="block text-xs text-text-secondary">HSN: {item.hsnCode}</span>
                                            </td>
                                            <td className="p-3 text-center text-text-primary">{item.quantity}</td>
                                            <td className="p-3 text-right text-text-primary">{isTaxable ? formatIndianCurrency(item.unitPrice, currencyOptions) : 'FREE'}</td>
                                            <td className="p-3 text-right text-text-primary">{formatIndianCurrency(taxableValue, currencyOptions)}</td>
                                            <td className="p-3 text-center text-text-secondary">{isTaxable ? `${GST_RATE * 100}%` : '-'}</td>
                                            <td className="p-3 text-right text-text-secondary">{formatIndianCurrency(cgst, currencyOptions)}</td>
                                            <td className="p-3 text-right text-text-secondary">{formatIndianCurrency(sgst, currencyOptions)}</td>
                                            <td className="p-3 text-right font-semibold text-text-primary">{formatIndianCurrency(total, currencyOptions)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>
                    
                    <section className="flex flex-col sm:flex-row justify-end mt-6 text-sm">
                        <div className="w-full sm:w-1/2 md:w-2/3">
                             <p className="font-semibold mb-2">Amount in Words:</p>
                             <p className="text-text-secondary italic">{numberToWordsInRupees(grandTotal)}</p>
                        </div>
                        <div className="w-full sm:w-1/2 md:w-1/3 space-y-2 mt-4 sm:mt-0">
                             <div className="flex justify-between">
                                <span className="text-text-secondary">Subtotal</span>
                                <span className="font-semibold text-text-primary">{formatIndianCurrency(subtotal, currencyOptions)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">CGST ({CGST_RATE * 100}%)</span>
                                <span className="text-text-primary">{formatIndianCurrency(totalCgst, currencyOptions)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">SGST ({SGST_RATE * 100}%)</span>
                                <span className="text-text-primary">{formatIndianCurrency(totalSgst, currencyOptions)}</span>
                            </div>
                            <div className="flex justify-between border-t-2 border-primary pt-2 mt-2">
                                <span className="text-text-primary font-bold text-base">GRAND TOTAL</span>
                                <span className="font-bold text-base text-primary">{formatIndianCurrency(grandTotal, currencyOptions)}</span>
                            </div>
                        </div>
                    </section>

                    <footer className="text-xs text-text-secondary mt-12 border-t pt-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="font-semibold">Terms & Conditions:</p>
                                <p>1. All payments must be made in full within 30 days.</p>
                                <p>Generated By: {order.placedByExecId}</p>
                            </div>
                            <div className="w-48 text-center">
                                <div className="border-b h-12"></div>
                                <p className="mt-1">Authorised Signatory</p>
                            </div>
                        </div>
                        <p className="text-center mt-6">This is a computer-generated invoice.</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default Invoice;