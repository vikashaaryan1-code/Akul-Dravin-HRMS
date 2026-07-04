import React from 'react';
import { LetterTemplate } from '@/components/brand/LetterTemplate';
import { CertificateTemplate } from '@/components/brand/CertificateTemplate';
import { IdCardTemplate } from '@/components/brand/IdCardTemplate';
import { VisitingCardTemplate } from '@/components/brand/VisitingCardTemplate';
import { AkulDravinLogo } from '@/components/brand/AkulDravinLogo';

export default function BrandStationeryPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-16 px-4 font-display text-white">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-8">
             <AkulDravinLogo width={80} height={80} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-gold">
            Brand Stationery & Assets
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Preview of the premium Akul Dravin HRMS AI 3D Glass brand identity assets.
          </p>
        </div>

        {/* Logo Variations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">1. Brand Identity</h2>
          <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 flex justify-center">
             <AkulDravinLogo width={120} height={120} />
          </div>
        </div>

        {/* Business Card */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">2. Business Card</h2>
          <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 flex justify-center overflow-x-auto">
             <VisitingCardTemplate />
          </div>
        </div>

        {/* ID Card */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">3. Employee ID Card</h2>
          <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 flex justify-center overflow-x-auto">
             <IdCardTemplate />
          </div>
        </div>

        {/* Certificate */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">4. Certificate of Appreciation</h2>
          <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 flex justify-center overflow-x-auto">
             <CertificateTemplate />
          </div>
        </div>

        {/* Letterhead */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">5. Official Letterhead</h2>
          <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 flex justify-center overflow-x-auto">
             <LetterTemplate />
          </div>
        </div>

      </div>
    </div>
  );
}
