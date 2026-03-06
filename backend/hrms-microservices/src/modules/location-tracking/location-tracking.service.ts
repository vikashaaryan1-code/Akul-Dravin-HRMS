import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationTrackingService {
  private readonly snapshot = [
    {
      id: 'LOC-401',
      employeeName: 'Ananya Rao',
      locationLabel: 'Bengaluru HQ',
      zoneType: 'office',
      status: 'inside-geofence',
      lastPingAt: '2026-03-05T13:11:00.000Z',
    },
    {
      id: 'LOC-402',
      employeeName: 'Meera Joshi',
      locationLabel: 'Pune - Client Site',
      zoneType: 'field',
      status: 'field-visit',
      lastPingAt: '2026-03-05T13:09:00.000Z',
    },
    {
      id: 'LOC-403',
      employeeName: 'Raghav Menon',
      locationLabel: 'Mumbai - Home Office',
      zoneType: 'wfh',
      status: 'wfh-active',
      lastPingAt: '2026-03-05T13:08:00.000Z',
    },
    {
      id: 'LOC-404',
      employeeName: 'Neha Kapoor',
      locationLabel: 'Delhi HQ',
      zoneType: 'office',
      status: 'inside-geofence',
      lastPingAt: '2026-03-05T13:07:00.000Z',
    },
  ];

  private readonly history = [
    { name: 'Office', value: 62 },
    { name: 'WFH', value: 24 },
    { name: 'Field', value: 14 },
  ];

  current() {
    return this.snapshot;
  }

  historyDistribution() {
    return this.history;
  }
}
