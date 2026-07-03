'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

/* Inner component for the 3D rotating globe */ const Globe = () => {
 const sphereRef = useRef<any>(null);

 useFrame(() => {
 if (sphereRef.current) {
 sphereRef.current.rotation.y += 0.002;
 }
 });

 return (
 <Sphere ref={sphereRef} visible args={[1, 100, 200]} scale={2}>
 <MeshDistortMaterial 
 color="#0ea5e9" 
 attach="material" 
 distort={0.3} 
 speed={1.5} 
 roughness={0.2}
 metalness={0.8}
 wireframe={true}
 />
 </Sphere>
 );
};

export const AICommandBridge = () => {
 const [liveMetrics, setLiveMetrics] = useState({
 activeEmployees: 12450,
 anomaliesDetected: 0,
 systemLoad: 'Optimized',
 payrollStatus: 'Processing',
 });
 
 const [logs, setLogs] = useState<string[]>(['System initialized.', 'AI Engine linked.']);

 useEffect(() => {
 /* Initialize WebSocket Connection to the NestJS Gateway */ const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/command-bridge', {
 transports: ['websocket'],
 });

 socket.on('connect', () => {
 setLogs((prev) => ['WebSocket Connected to Master Engine', ...prev].slice(0, 5));
 });

 socket.on('metrics-update', (data) => {
 setLiveMetrics(data);
 });

 socket.on('system-log', (log) => {
 setLogs((prev) => [log, ...prev].slice(0, 5));
 });

 return () => {
 socket.disconnect();
 };
 }, []);

 return (
 <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans">
 {/* 3D Canvas Background */}
 <div className="absolute inset-0 z-0">
 <Canvas>
 <ambientLight intensity={0.5} />
 <directionalLight position={[10, 10, 5]} intensity={1} />
 <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
 <Globe />
 <OrbitControls enableZoom={false} autoRotate={false} />
 </Canvas>
 </div>

 {/* UI Overlay */}
 <div className="relative z-10 p-8 h-screen flex flex-col justify-between pointer-events-none">
 {/* Header */}
 <header className="flex justify-between items-center">
 <motion.div 
 initial={{ opacity: 0, x: -50 }}
 animate={{ opacity: 1, x: 0 }}
 className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl pointer-events-auto"
 >
 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
 AI Command Bridge
 </h1>
 <p className="text-gray-500 text-sm mt-1">Global Workforce Executive Overview</p>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, x: 50 }}
 animate={{ opacity: 1, x: 0 }}
 className="flex gap-4 pointer-events-auto"
 >
 <div className="backdrop-blur-md bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-center">
 <p className="text-xs text-gray-500 uppercase tracking-wider">System Status</p>
 <p className="text-lg font-semibold text-green-400 flex items-center gap-2 justify-center mt-1">
 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
 {liveMetrics.systemLoad}
 </p>
 </div>
 <div className="backdrop-blur-md bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-center">
 <p className="text-xs text-gray-500 uppercase tracking-wider">Active Nodes</p>
 <p className="text-lg font-semibold text-white mt-1">9 Business Units</p>
 </div>
 </motion.div>
 </header>

 {/* Bottom Panels */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto">
 {/* Metrics Panel */}
 <motion.div 
 initial={{ opacity: 0, y: 50 }}
 animate={{ opacity: 1, y: 0 }}
 className="backdrop-blur-xl bg-black/40 border border-white/10 p-6 rounded-2xl"
 >
 <h2 className="text-lg font-medium text-gray-600 mb-4 flex items-center gap-2">
 <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
 </svg>
 Live Workforce Metrics
 </h2>
 <div className="space-y-4">
 <div className="flex justify-between items-center pb-2 border-b border-white/5">
 <span className="text-gray-500 text-sm">Active Employees</span>
 <span className="text-xl font-bold text-navy">{liveMetrics.activeEmployees.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center pb-2 border-b border-white/5">
 <span className="text-gray-500 text-sm">Payroll Status</span>
 <span className="text-sm font-medium text-blue-400">{liveMetrics.payrollStatus}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-500 text-sm">Anomalies Detected</span>
 <span className={`text-xl font-bold ${liveMetrics.anomaliesDetected > 0 ? 'text-red-500' : 'text-green-500'}`}>
 {liveMetrics.anomaliesDetected}
 </span>
 </div>
 </div>
 </motion.div>

 {/* Quick Actions */}
 <motion.div 
 initial={{ opacity: 0, y: 50 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="backdrop-blur-xl bg-black/40 border border-white/10 p-6 rounded-2xl flex flex-col justify-center gap-3"
 >
 <button className="w-full bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/50 text-cyan-300 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]">
 Force Payroll Sync
 </button>
 <button className="w-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-300 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">
 Run Forensic Audit
 </button>
 </motion.div>

 {/* Terminal Logs */}
 <motion.div 
 initial={{ opacity: 0, y: 50 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="backdrop-blur-xl bg-black/60 border border-white/10 p-6 rounded-2xl font-mono text-xs overflow-hidden"
 >
 <h2 className="text-sm font-medium text-gray-500 mb-3 border-b border-white/10 pb-2">System Terminal</h2>
 <div className="space-y-2 text-green-400">
 {logs.map((log, idx) => (
 <div key={idx} className="opacity-80 flex gap-2">
 <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
 <span>{log}</span>
 </div>
 ))}
 <div className="animate-pulse">_</div>
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 );
};
