'use client';
import { useState, useEffect } from 'react';
import { Award, Plus } from 'lucide-react';

export default function CertificatesPage() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => { fetch('http://localhost:4200/api/v1/certificates').then(r => r.json()).then(setData); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:4200/api/v1/certificates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    setShow(false);
    fetch('http://localhost:4200/api/v1/certificates').then(r => r.json()).then(setData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Certificates</h1>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg"><Plus size={20} />Add Certificate</button>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <tr>{['Employee', 'Certificate', 'Issued By', 'Issue Date', 'Expiry Date'].map(h => <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-cyan-50/50">
                <td className="px-6 py-4 text-sm text-gray-800">{d.employeeId}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{d.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.issuedBy}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(d.issueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Add Certificate</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
              <input name="name" placeholder="Certificate Name *" required className="w-full px-4 py-2 border rounded-lg" />
              <input name="issuedBy" placeholder="Issued By *" required className="w-full px-4 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input name="issueDate" type="date" required className="px-4 py-2 border rounded-lg" />
                <input name="expiryDate" type="date" className="px-4 py-2 border rounded-lg" />
              </div>
              <input name="certificateUrl" placeholder="Certificate URL" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg">Create</button><button type="button" onClick={() => setShow(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
