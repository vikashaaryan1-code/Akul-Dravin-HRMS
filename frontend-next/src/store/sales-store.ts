'use client';

import { create } from 'zustand';
import { salesDealRecords, salesLeadRecords } from '@/services/platform-data';
import type { SalesDealRecord, SalesLeadRecord, SalesPipelineStageCode } from '@/types/platform';

type SalesState = {
  leads: SalesLeadRecord[];
  deals: SalesDealRecord[];
  setSnapshot: (payload: { leads: SalesLeadRecord[]; deals: SalesDealRecord[] }) => void;
  moveLeadToStage: (leadId: string, stage: SalesPipelineStageCode) => void;
  updateLeadScore: (leadId: string, score: number) => void;
};

const toLeadStatus = (stage: SalesPipelineStageCode): SalesLeadRecord['status'] => {
  if (stage === 'closed-won') {
    return 'converted';
  }

  if (stage === 'closed-lost') {
    return 'lost';
  }

  if (stage === 'new-lead') {
    return 'open';
  }

  return 'nurturing';
};

const initialLeads = salesLeadRecords.map((lead) => ({ ...lead }));
const initialDeals = salesDealRecords.map((deal) => ({ ...deal }));

export const useSalesStore = create<SalesState>((set) => ({
  leads: initialLeads,
  deals: initialDeals,
  setSnapshot: ({ leads, deals }) =>
    set(() => ({
      leads: leads.length > 0 ? leads : initialLeads,
      deals: deals.length > 0 ? deals : initialDeals,
    })),
  moveLeadToStage: (leadId, stage) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              pipelineStage: stage,
              status: toLeadStatus(stage),
              lastActivity: new Date().toISOString(),
            }
          : lead,
      ),
      deals: state.deals.map((deal) =>
        deal.leadId !== leadId
          ? deal
          : {
              ...deal,
              stage,
              status: stage === 'closed-won' ? 'closed-won' : stage === 'closed-lost' ? 'closed-lost' : 'open',
              probability: stage === 'closed-won' ? 100 : stage === 'closed-lost' ? 0 : deal.probability,
            },
      ),
    })),
  updateLeadScore: (leadId, score) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              score: Math.max(0, Math.min(100, score)),
            }
          : lead,
      ),
    })),
}));
