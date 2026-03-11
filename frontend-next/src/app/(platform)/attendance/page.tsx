'use client';

import { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, TrendingUp } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchFirstEmployee();
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchRecords();
      checkTodayStatus();
    }
  }, [employeeId]);

  const fetchFirstEmployee = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    }
  };

  const fetchRecords = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(`${API_BASE}/attendance?employeeId=${employeeId}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      setRecords([]);
    }
  };

  const checkTodayStatus = async () => {
    if (!employeeId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/attendance?employeeId=${employeeId}&startDate=${today}&endDate=${today}`);
      const data = await res.json();
      const records = Array.isArray(data) ? data : [];
      if (records.length > 0 && records[0].checkIn && !records[0].checkOut) {
        setCheckedIn(true);
      }
    } catch (error) {
      console.error('Failed to check today status:', error);
    }
  };

  const getLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'Current Location' }),
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const handleCheckIn = async () => {
    console.log('Check-in clicked, employeeId:', employeeId);
    if (!employeeId) {
      console.error('No employee ID available');
      alert('No employee ID found. Please refresh the page.');
      return;
    }
    const loc = await getLocation();
    console.log('Location:', loc);
    try {
      const payload = { employeeId, location: loc };
      console.log('Sending check-in request:', payload);
      const res = await fetch(`${API_BASE}/attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('Check-in response status:', res.status);
      const data = await res.json();
      console.log('Check-in response data:', data);
      if (res.ok) {
        setCheckedIn(true);
        fetchRecords();
        alert('Checked in successfully!');
      } else {
        alert(`Check-in failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Check console for details.');
    }
  };

  const handleCheckOut = async () => {
    console.log('Check-out clicked, employeeId:', employeeId);
    if (!employeeId) {
      console.error('No employee ID available');
      alert('No employee ID found. Please refresh the page.');
      return;
    }
    const loc = await getLocation();
    console.log('Location:', loc);
    try {
      const payload = { employeeId, location: loc };
      console.log('Sending check-out request:', payload);
      const res = await fetch(`${API_BASE}/attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('Check-out response status:', res.status);
      const data = await res.json();
      console.log('Check-out response data:', data);
      if (res.ok) {
        setCheckedIn(false);
        fetchRecords();
        alert('Checked out successfully!');
      } else {
        alert(`Check-out failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Check-out failed. Check console for details.');
    }
  };

  const stats = {
    thisMonth: records.length,
    avgHours: records.length > 0 ? (records.reduce((sum: number, r: any) => sum + (r.totalHours || 0), 0) / records.length).toFixed(1) : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-ink">Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-aqua to-aqua/80 text-white rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
          <div className="flex items-center gap-4 mb-6">
            <Clock className="w-16 h-16" />
            <div>
              <p className="text-sm opacity-90">Current Time</p>
              <p className="text-2xl font-bold">{currentTime}</p>
            </div>
          </div>
          {!checkedIn ? (
            <button onClick={handleCheckIn} className="w-full py-3 bg-white text-aqua rounded-lg font-semibold">Check In</button>
          ) : (
            <button onClick={handleCheckOut} className="w-full py-3 bg-white text-ember rounded-lg font-semibold">Check Out</button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">This Month</p>
                <p className="text-3xl font-bold text-ink">{stats.thisMonth}</p>
              </div>
              <Calendar className="w-12 h-12 text-aqua/20" />
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink/60">Avg Hours/Day</p>
                <p className="text-3xl font-bold text-ink">{stats.avgHours}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-ink/10">
          <h2 className="text-lg font-semibold text-ink">Attendance History</h2>
        </div>
        <table className="w-full">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink/60 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-ink/60">No attendance records found</td>
              </tr>
            ) : (
              records.map((rec: any) => (
                <tr key={rec.id}>
                  <td className="px-6 py-4 text-sm text-ink">{new Date(rec.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-ink">{rec.checkIn || '-'}</td>
                  <td className="px-6 py-4 text-sm text-ink">{rec.checkOut || '-'}</td>
                  <td className="px-6 py-4 text-sm text-ink">{rec.totalHours?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{rec.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
