import { Injectable } from '@nestjs/common';

type MarketingCampaignRecord = {
  id: string;
  campaignName: string;
  channel: string;
  status: string;
  audienceSize: number;
  reach: number;
  conversions: number;
  spend: number;
};

type MarketingPerformanceRecord = {
  name: string;
  value: number;
};

@Injectable()
export class MarketingAutomationService {
  private readonly campaigns: MarketingCampaignRecord[] = [
    {
      id: 'MKT-1',
      campaignName: 'Q1 HR Automation Launch',
      channel: 'Email',
      status: 'Running',
      audienceSize: 18000,
      reach: 15240,
      conversions: 412,
      spend: 5400,
    },
    {
      id: 'MKT-2',
      campaignName: 'Payroll Intelligence Webinar',
      channel: 'WhatsApp',
      status: 'Running',
      audienceSize: 9200,
      reach: 7600,
      conversions: 286,
      spend: 2200,
    },
    {
      id: 'MKT-3',
      campaignName: 'BOS v2000 Product Tour',
      channel: 'SMS',
      status: 'Scheduled',
      audienceSize: 12000,
      reach: 0,
      conversions: 0,
      spend: 1800,
    },
    {
      id: 'MKT-4',
      campaignName: 'Finance Automation Nurture',
      channel: 'Email',
      status: 'Completed',
      audienceSize: 10500,
      reach: 9680,
      conversions: 238,
      spend: 3100,
    },
  ];

  private readonly performance: MarketingPerformanceRecord[] = [
    { name: 'Email', value: 54 },
    { name: 'WhatsApp', value: 28 },
    { name: 'SMS', value: 18 },
  ];

  getCampaigns(): MarketingCampaignRecord[] {
    return this.campaigns;
  }

  getPerformance(): MarketingPerformanceRecord[] {
    return this.performance;
  }
}
