'use client';
import { useState, useEffect } from 'react';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  grandTotal: number;
  items: LineItem[];
}

export default function InvoiceBuilder() {
  const [invoiceNumber, setInvoiceNumber] = useState('PTS-2026-001');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [items, setItems] = useState<LineItem[]>([
    { description: 'Full-Stack Web Application Architecture & Cloud Deployment', quantity: 1, unitPrice: 35000 }
  ]);

  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  // Auto-initialize dates and generate next sequential invoice number on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setInvoiceDate(today);

    // Default due date to 7 days later
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split('T')[0]);

    const stored = localStorage.getItem('paraspara_invoices');
    if (stored) {
      try {
        const parsed: SavedInvoice[] = JSON.parse(stored);
        setSavedInvoices(parsed);

        // Auto-increment invoice number based on history
        if (parsed.length > 0) {
          const latestInvNum = parsed[0].invoiceNumber; // e.g. PTS-2026-002
          const parts = latestInvNum.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) {
            const nextNumStr = String(lastNum + 1).padStart(3, '0');
            setInvoiceNumber(`PTS-2026-${nextNumStr}`);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const grandTotal = subTotal;

  // Save to DB Helper Function
  const saveInvoiceRecord = () => {
    if (!clientName) {
      alert('Please enter a client name before downloading or saving.');
      return false;
    }

    const newInvoice: SavedInvoice = {
      id: Date.now().toString(),
      invoiceNumber,
      invoiceDate,
      dueDate,
      clientName,
      clientEmail,
      clientAddress,
      grandTotal,
      items,
    };

    const filtered = savedInvoices.filter(inv => inv.invoiceNumber !== invoiceNumber);
    const updated = [newInvoice, ...filtered];
    
    setSavedInvoices(updated);
    localStorage.setItem('paraspara_invoices', JSON.stringify(updated));
    return true;
  };

  // AUTOMATIC SAVE + DOWNLOAD PDF HANDLER
  const handleDownloadAndSave = () => {
    const saved = saveInvoiceRecord();
    if (!saved) return;

    const sanitizedClient = clientName ? clientName.replace(/[^a-zA-Z0-9]/g, '-') : 'Client';
    const originalTitle = document.title;
    document.title = `Paraspara-Invoice-${invoiceNumber}-${sanitizedClient}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const filteredInvoices = savedInvoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white print:bg-white print:text-slate-900 print:p-0 pb-16">
      
      <style jsx global>{`
        @media print {
          @page {
            margin: 6mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: inherit !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 no-print shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center font-black text-lg text-slate-950 shadow-lg shadow-emerald-900/30">
              P
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white">Paraspara Tech Solutions LLP</h1>
              <p className="text-[11px] text-emerald-400 font-medium tracking-wider uppercase">Enterprise Billing Engine v2.4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                // Create a brand new invoice with auto-incremented number
                const nextNumStr = String(savedInvoices.length + 1).padStart(3, '0');
                setInvoiceNumber(`PTS-2026-${nextNumStr}`);
                setClientName('');
                setClientEmail('');
                setClientAddress('');
              }}
              className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold transition shadow-sm"
            >
              ✨ New Invoice
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition border border-slate-700 shadow-sm"
            >
              {showHistory ? 'Hide Database' : '📂 Saved Records'}
            </button>
            <button 
              onClick={saveInvoiceRecord}
              className="text-xs bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition border border-slate-700 shadow-sm"
            >
              💾 Save to DB
            </button>
            <button 
              onClick={handleDownloadAndSave}
              className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-5 py-2.5 rounded-xl font-black transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
            >
              <span>📥</span> Download Branded PDF
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 pt-8 flex gap-8 items-start">
        
        {/* DATABASE SIDEBAR */}
        {showHistory && (
          <aside className="w-80 bg-slate-950/60 backdrop-blur rounded-2xl border border-slate-800 p-5 no-print sticky top-24 max-h-[82vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Local Database</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">{filteredInvoices.length} Records</span>
            </div>
            
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search client or invoice #..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-3 bg-slate-900/90 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 transition shadow-inner"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {filteredInvoices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No saved invoices found in storage.</p>
              ) : (
                filteredInvoices.map((inv) => (
                  <div 
                    key={inv.id}
                    onClick={() => {
                      setInvoiceNumber(inv.invoiceNumber);
                      setInvoiceDate(inv.invoiceDate);
                      setDueDate(inv.dueDate);
                      setClientName(inv.clientName);
                      setClientEmail(inv.clientEmail);
                      setClientAddress(inv.clientAddress);
                      setItems(inv.items);
                    }}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/30 hover:border-emerald-500/50 rounded-xl cursor-pointer transition border border-slate-800 text-xs group shadow-sm"
                  >
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span className="group-hover:text-emerald-400 transition">{inv.invoiceNumber}</span>
                      <span className="text-emerald-400 font-extrabold">₹{inv.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-slate-400 truncate font-medium">{inv.clientName}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{inv.invoiceDate}</div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* A4 INVOICE SHEET */}
        <main className="flex-1 w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl p-[14mm] box-border print:shadow-none print:w-full print:m-0 print:p-0 flex flex-col justify-between border border-slate-700/50">
          
          <div>
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-sm"></div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Paraspara Tech Solutions LLP</h1>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Vijayawada, Andhra Pradesh, India<br />
                  <span className="text-slate-500">contact@parasparatech.com | www.parasparatech.com</span>
                </p>
              </div>
              
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-900 tracking-widest">INVOICE</h2>
                
                <div className="mt-2 flex items-center justify-end gap-2 text-xs font-semibold text-slate-700">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">Invoice No:</span>
                  <input 
                    type="text" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="font-bold text-slate-900 w-32 text-right bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:border-emerald-600 outline-none print:bg-transparent print:border-none"
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-end gap-2 text-xs font-semibold text-slate-700">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">Date:</span>
                  <input 
                    type="date" 
                    value={invoiceDate} 
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:border-emerald-600 outline-none text-right print:bg-transparent print:border-none"
                  />
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 print:bg-white print:border-slate-300">
              <div>
                <h3 className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-2.5">Billed To</h3>
                
                <input 
                  type="text" 
                  placeholder="Client / Company Name" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full font-bold text-slate-900 p-2 bg-white border border-slate-200 rounded-xl mb-2 text-xs focus:border-emerald-600 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm"
                />

                <input 
                  type="email" 
                  placeholder="client@company.com" 
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-xs text-slate-700 p-2 bg-white border border-slate-200 rounded-xl mb-2 focus:border-emerald-600 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm"
                />

                <textarea 
                  placeholder="Client Billing Address" 
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={2}
                  className="w-full text-xs text-slate-700 p-2 bg-white border border-slate-200 rounded-xl resize-none focus:border-emerald-600 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm leading-relaxed"
                />
              </div>
              
              <div className="flex flex-col justify-between items-end">
                <div className="w-full max-w-[180px]">
                  <h3 className="text-[10px] font-black uppercase text-emerald-700 tracking-widest mb-2.5 text-right">Payment Terms</h3>
                  <div className="text-xs text-right text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 print:border-none print:bg-transparent print:p-0 shadow-sm">
                    <span className="text-slate-400 block mb-1 font-medium">Due Date:</span>
                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      className="font-bold text-slate-900 bg-transparent text-right outline-none w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[11px] text-slate-900 uppercase tracking-wider font-extrabold bg-slate-100/60 print:bg-transparent">
                    <th className="py-3 pl-3 font-black">Description</th>
                    <th className="py-3 w-20 text-center font-black">Qty</th>
                    <th className="py-3 w-36 text-right font-black">Unit Price (₹)</th>
                    <th className="py-3 w-36 text-right pr-3 font-black">Amount (₹)</th>
                    <th className="w-10 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-900 font-medium">
                  {items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition">
                      <td className="py-3.5 pl-3 pr-3">
                        <input 
                          type="text" 
                          placeholder="Service description" 
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm"
                        />
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-semibold text-slate-900 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm"
                        />
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <input 
                          type="number" 
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-semibold text-slate-900 outline-none print:border-none print:bg-transparent print:p-0 shadow-sm"
                        />
                      </td>
                      <td className="py-3.5 pr-3 text-right font-black text-slate-900">
                        ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="text-center no-print">
                        <button 
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1.5 transition rounded-lg hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <button 
                onClick={addItem}
                className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 no-print flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition shadow-sm border border-emerald-200"
              >
                + Add Line Item
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4 border-t-2 border-slate-200">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-3">
                  <span>Total Due:</span>
                  <span className="text-emerald-700">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between font-semibold">
            <span>Computer-generated commercial invoice. No physical signature required.</span>
            <span className="text-slate-700">Paraspara Tech Solutions LLP</span>
          </div>

        </main>
      </div>
    </div>
  );
}