'use client';
import { useState } from 'react';
import { FileText, Download, CreditCard, Mail, FileSignature } from 'lucide-react';

export default function DocumentsPage() {
  const [docType, setDocType] = useState('');
  const [loading, setLoading] = useState(false);

  const generateDocument = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = Object.fromEntries(new FormData(e.target));
    
    try {
      const res = await fetch(`http://localhost:4200/api/v1/documents/${docType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docType}_${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      alert('Error generating document');
    } finally {
      setLoading(false);
      setDocType('');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Document Generator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { type: 'offer-letter', icon: FileText, label: 'Offer Letter', color: 'cyan' },
          { type: 'id-card', icon: CreditCard, label: 'ID Card', color: 'blue' },
          { type: 'visiting-card', icon: Mail, label: 'Visiting Card', color: 'purple' },
          { type: 'agreement', icon: FileSignature, label: 'Agreement', color: 'green' },
        ].map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => setDocType(type)}
            className={`p-6 bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 rounded-xl hover:shadow-lg transition-all`}
          >
            <Icon className={`w-12 h-12 text-${color}-600 mb-3`} />
            <h3 className="font-semibold text-gray-800">{label}</h3>
          </button>
        ))}
      </div>

      {docType && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Generate {docType.replace('-', ' ').toUpperCase()}</h2>
          <form onSubmit={generateDocument} className="space-y-4">
            
            {docType === 'offer-letter' && (
              <>
                <input name="candidateName" placeholder="Candidate Name *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="position" placeholder="Position *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="ctc" type="number" placeholder="CTC (Annual) *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="joiningDate" type="date" placeholder="Joining Date *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="companyName" placeholder="Company Name *" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {docType === 'id-card' && (
              <>
                <input name="employeeId" placeholder="Employee ID *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="employeeName" placeholder="Employee Name *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="position" placeholder="Position *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="department" placeholder="Department *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="validUntil" type="date" placeholder="Valid Until *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="companyName" placeholder="Company Name *" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {docType === 'visiting-card' && (
              <>
                <input name="employeeName" placeholder="Employee Name *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="position" placeholder="Position *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="email" type="email" placeholder="Email *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="phone" placeholder="Phone *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="companyName" placeholder="Company Name *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="website" placeholder="Website" className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {docType === 'agreement' && (
              <>
                <input name="partyA" placeholder="Party A (Company) *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="partyB" placeholder="Party B (Employee/Vendor) *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="agreementType" placeholder="Agreement Type (e.g., Employment Agreement) *" required className="w-full px-4 py-2 border rounded-lg" />
                <textarea name="terms" placeholder="Terms (comma separated) *" required rows="4" className="w-full px-4 py-2 border rounded-lg"></textarea>
                <input name="effectiveDate" type="date" placeholder="Effective Date *" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="expiryDate" type="date" placeholder="Expiry Date" className="w-full px-4 py-2 border rounded-lg" />
                <input name="companyName" placeholder="Company Name *" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg hover:shadow-lg disabled:opacity-50">
                {loading ? 'Generating...' : <><Download className="inline mr-2" size={18} />Generate PDF</>}
              </button>
              <button type="button" onClick={() => setDocType('')} className="flex-1 bg-gray-200 py-3 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
