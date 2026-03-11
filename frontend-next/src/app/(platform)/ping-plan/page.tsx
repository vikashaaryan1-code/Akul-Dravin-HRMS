'use client';
import { useState, useEffect } from 'react';
import { Clock, MapPin, Coffee, LogOut, Activity } from 'lucide-react';

export default function PingPlanPage() {
  const [status, setStatus] = useState('offline');
  const [pings, setPings] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
    fetch('http://localhost:4200/api/v1/ping-plan/employee/emp123')
      .then(r => r.json())
      .then(d => setPings(Array.isArray(d) ? d : []));
  }, []);

  const handlePing = async (type) => {
    await fetch('http://localhost:4200/api/v1/ping-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: 'emp123',
        pingType: type,
        latitude: location.lat,
        longitude: location.lng,
        status: type === 'check_in' ? 'working' : type === 'break_start' ? 'break' : 'offline',
      }),
    });
    setStatus(type === 'check_in' ? 'working' : type === 'break_start' ? 'break' : 'offline');
    alert(`${type.replace('_', ' ').toUpperCase()} recorded!`);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Ping Plan - Employee Tracking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => handlePing('check_in')} className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:shadow-lg">
          <Clock className="w-12 h-12 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Check In</h3>
        </button>
        <button onClick={() => handlePing('break_start')} className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl hover:shadow-lg">
          <Coffee className="w-12 h-12 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Start Break</h3>
        </button>
        <button onClick={() => handlePing('break_end')} className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:shadow-lg">
          <Activity className="w-12 h-12 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-800">End Break</h3>
        </button>
        <button onClick={() => handlePing('check_out')} className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl hover:shadow-lg">
          <LogOut className="w-12 h-12 text-red-600 mb-3" />
          <h3 className="font-semibold text-gray-800">Check Out</h3>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Current Status</h2>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${status === 'working' ? 'bg-green-500' : status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
          <span className="text-lg font-medium capitalize">{status}</span>
          {location.lat && <span className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={16} />Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Today's Activity</h2>
        <div className="space-y-2">
          {pings.length > 0 ? pings.map((p, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{p.pingType?.replace('_', ' ')}</span>
              <span className="text-sm text-gray-500">{new Date(p.pingTime).toLocaleTimeString()}</span>
            </div>
          )) : <p className="text-gray-500">No activity yet today</p>}
        </div>
      </div>
    </div>
  );
}
