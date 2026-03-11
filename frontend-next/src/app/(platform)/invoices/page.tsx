'use client';
import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4200/api/v1/invoices').then(r => r.json()).then(setInvoices);
    fetch('http://localhost:4200/api/v1/invoices/stats').then(r => r.json()).then(setStats);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    const amount = parseFloat(data.amount) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    data.totalAmount = amount + taxAmount;
    const url = editing ? `http://localhost:4200/api/v1/invoices/${editing.id}` : 'http://localhost:4200/api/v1/invoices';
    await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowModal(false);
    setEditing(null);
    fetch('http://localhost:4200/api/v1/invoices').then(r => r.json()).then(setInvoices);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
        <button onClick={() => { setShowModal(true); setEditing(null); }} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Create Invoice</button>
      </div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[{ l: 'Total', v: stats.total, c: 'cyan' }, { l: 'Pending', v: stats.pending, c: 'orange' }, { l: 'Paid', v: stats.paid, c: 'green' }].map((s, i) => (
          <div key={i} className={`bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-${s.c}-100 shadow-sm`}><p className="text-gray-600 text-sm">{s.l}</p><p className={`text-3xl font-bold text-${s.c}-600 mt-1`}>{s.v}</p></div>
        ))}
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{inv.clientId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.issueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800">₹{parseFloat(inv.totalAmount).toLocaleString()}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inv.status}</span></td>
                <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditing(inv); setShowModal(true); }} className="text-blue-600"><Edit2 size={18} /></button><button onClick={async () => { if (confirm('Delete?')) { await fetch(`http://localhost:4200/api/v1/invoices/${inv.id}`, { method: 'DELETE' }); fetch('http://localhost:4200/api/v1/invoices').then(r => r.json()).then(setInvoices); }}} className="text-red-600"><Trash2 size={18} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editing ? 'Edit' : 'Create'} Invoice</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="invoiceNumber" placeholder="Invoice # *" defaultValue={editing?.invoiceNumber} required className="px-4 py-2 border rounded-lg" />
                <input name="clientId" placeholder="Client ID *" defaultValue={editing?.clientId} required className="px-4 py-2 border rounded-lg" />
                <input name="issueDate" type="date" defaultValue={editing?.issueDate} required className="px-4 py-2 border rounded-lg" />
                <input name="dueDate" type="date" defaultValue={editing?.dueDate} required className="px-4 py-2 border rounded-lg" />
                <input name="amount" type="number" step="0.01" placeholder="Amount *" defaultValue={editing?.amount} required className="px-4 py-2 border rounded-lg" />
                <input name="taxAmount" type="number" step="0.01" placeholder="Tax" defaultValue={editing?.taxAmount || 0} className="px-4 py-2 border rounded-lg" />
                <select name="status" defaultValue={editing?.status || 'pending'} className="px-4 py-2 border rounded-lg"><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select>
              </div>
              <textarea name="notes" placeholder="Notes" defaultValue={editing?.notes} rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
