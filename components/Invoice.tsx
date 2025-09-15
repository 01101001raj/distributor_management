import React, { useEffect, useState, useRef } from 'react';
// FIX: Use namespace import for react-router-dom to resolve export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { api } from '../services/mockApiService';
import { InvoiceData, CompanyDetails } from '../types';
import Button from './common/Button';
import { Download } from 'lucide-react';
import { formatIndianCurrency, numberToWordsInRupees } from '../utils/formatting';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COMPANY_DETAILS_KEY = 'companyDetails';

const Invoice: React.FC = () => {
    const { orderId } = ReactRouterDOM.useParams<{ orderId: string }>();
    const location = ReactRouterDOM.useLocation();
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const invoicePrintRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedDetails = localStorage.getItem(COMPANY_DETAILS_KEY);
            if (savedDetails) {
                setCompanyDetails(JSON.parse(savedDetails));
            }
        } catch (e) {
            console.error("Failed to load company details", e);
        }

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
    
    const handleDownloadPdf = async () => {
        const elementToCapture = invoicePrintRef.current;
        if (!elementToCapture || !orderId) {
            console.error("Invoice element or orderId not found");
            return;
        }

        try {
            const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasAspectRatio = canvas.width / canvas.height;
            let finalWidth = pdfWidth;
            let finalHeight = pdfWidth / canvasAspectRatio;
            if (finalHeight > pdfHeight) {
                finalHeight = pdfHeight;
                finalWidth = pdfHeight * canvasAspectRatio;
            }
            const xOffset = (pdfWidth - finalWidth) / 2;
            pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
            pdf.save(`invoice-${orderId}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        }
    };

    useEffect(() => {
        const autoDownloadAndClose = async () => {
            const searchParams = new URLSearchParams(location.search);
            if (searchParams.get('download') === 'true') {
                if (invoiceData && invoicePrintRef.current) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await handleDownloadPdf();
                    window.close();
                }
            }
        };
        autoDownloadAndClose();
    }, [invoiceData, location.search]);

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
    const GST_RATE = 0.18; // 18%
    const CGST_RATE = GST_RATE / 2;
    const SGST_RATE = GST_RATE / 2;
    const totalCgst = subtotal * CGST_RATE;
    const totalSgst = subtotal * SGST_RATE;
    const grandTotal = subtotal + totalCgst + totalSgst;

    return (
        <>
            <style>{`
                /* A4 page styling for screen and print */
                .a4-page-container {
                    padding: 1rem 0;
                    background-color: #f1f5f9; /* slate-100 */
                }
                .a4-page {
                    background: white;
                    display: block;
                    margin: 0 auto;
                    box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
                    /* A4 paper size */
                    width: 21cm;
                    min-height: 29.7cm;
                    padding: 1.5cm;
                }

                /* Responsive adjustments */
                @media only screen and (max-width: 22cm) {
                    .a4-page {
                        width: 100%;
                        min-height: unset;
                        box-shadow: none;
                        padding: 1.5rem;
                        margin: 0;
                    }
                    .a4-page-container {
                        padding: 0;
                    }
                }

                @media print {
                    body, .a4-page-container {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .no-print { display: none !important; }
                    .a4-page {
                        box-shadow: none;
                        margin: 0;
                        width: auto;
                        min-height: auto;
                        padding: 0;
                    }
                }
            `}</style>
            <div className="a4-page-container">
                 <div className="max-w-[21cm] mx-auto px-4 sm:px-0">
                    <div className="pb-4 text-right no-print">
                        <Button onClick={handleDownloadPdf}>
                            <Download size={16}/> Download PDF
                        </Button>
                    </div>
                 </div>
                <div ref={invoicePrintRef} className="a4-page">
                    <header className="grid grid-cols-2 gap-8 pb-6 border-b">
                        <div>
                            <p className="font-bold text-lg text-text-primary">{companyDetails?.companyName || '[Your Company Name]'}</p>
                            <p className="text-sm text-text-secondary">{companyDetails?.addressLine1 || '[Your Address Line 1]'}</p>
                            <p className="text-sm text-text-secondary">{companyDetails?.addressLine2 || '[City, State, PIN]'}</p>
                            <p className="text-sm text-text-secondary">Email: {companyDetails?.email || '[your.email@company.com]'}</p>
                            <p className="text-sm text-text-secondary mt-2">GSTIN: <span className="font-mono">{companyDetails?.gstin || '[YOUR_GSTIN]'}</span></p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                            <p className="mt-2">Invoice No: <span className="font-semibold font-mono">{order.id}</span></p>
                            <p>Date: <span className="font-semibold">{new Date(order.date).toLocaleDateString()}</span></p>
                        </div>
                    </header>

                    <section className="my-8 text-sm">
                        <h2 className="text-xs font-bold uppercase text-text-secondary mb-2">Billed To</h2>
                        <p className="font-bold text-text-primary">{distributor.name}</p>
                        <p className="text-text-secondary">{distributor.area}, {distributor.state}</p>
                        <p className="text-text-secondary">{distributor.phone}</p>
                    </section>

                    <section className="w-full overflow-x-auto">
                         <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 print-table">
                                <tr>
                                    <th className="p-3 font-semibold text-text-secondary uppercase w-8">#</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase">Item & HSN</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-center">Qty</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">Unit Price</th>
                                    <th className="p-3 font-semibold text-text-secondary uppercase text-right">Taxable Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className={`border-b ${item.isFreebie ? 'bg-green-50' : ''}`}>
                                        <td className="p-3 text-text-secondary">{index + 1}</td>
                                        <td className="p-3 font-medium text-text-primary">
                                            {item.skuName} {item.isFreebie && <span className="text-green-600 font-normal">(Freebie)</span>}
                                            <span className="block text-xs text-text-secondary">HSN: {item.hsnCode}</span>
                                        </td>
                                        <td className="p-3 text-center text-text-primary">{item.quantity}</td>
                                        <td className="p-3 text-right text-text-primary">{!item.isFreebie ? formatIndianCurrency(item.unitPrice, currencyOptions) : 'FREE'}</td>
                                        <td className="p-3 text-right font-semibold text-text-primary">{formatIndianCurrency(item.quantity * item.unitPrice, currencyOptions)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                    
                    <section className="mt-8 grid grid-cols-2 gap-x-12 text-sm">
                        <div className="space-y-2">
                            <p className="font-semibold text-text-primary mb-2">Amount in Words:</p>
                            <p className="text-text-secondary italic capitalize">{numberToWordsInRupees(grandTotal)}</p>
                        </div>
                        <div className="space-y-2">
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
                            <div className="flex justify-between bg-slate-50 p-3 rounded-md mt-2 font-bold">
                                <span className="text-text-primary text-base">GRAND TOTAL</span>
                                <span className="text-base text-primary">{formatIndianCurrency(grandTotal, currencyOptions)}</span>
                            </div>
                        </div>
                    </section>
                    
                    <footer className="text-xs text-text-secondary mt-12 border-t pt-6">
                        <div className="grid grid-cols-2 gap-x-8 items-end">
                            <div>
                                <p className="font-semibold">Terms & Conditions:</p>
                                <p>1. All payments must be made in full within 30 days.</p>
                                <p>2. Generated By: {order.placedByExecId}</p>
                            </div>
                            <div className="w-full text-center">
                                <div className="border-b h-12 border-slate-400"></div>
                                <p className="mt-1">Authorised Signatory</p>
                            </div>
                        </div>
                         <p className="text-center mt-8">This is a computer-generated invoice.</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default Invoice;