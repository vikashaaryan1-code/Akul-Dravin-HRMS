'use client'; 
import React, { useState, useEffect, useRef } from 'react';
import { ThreeDGlassCard } from '../ui/ThreeDGlassCard';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring } from '@react-three/drei';
import * as THREE from 'three';

// 3D Holographic Ring Component
const HolographicRing = ({ riskScore }: { riskScore: number }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.5;
      ringRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
      ringRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.2) * 0.2;
    }
  });

  const color = riskScore > 75 ? '#ef4444' : riskScore > 50 ? '#eab308' : '#22c55e';
  const arcLength = (riskScore / 100) * Math.PI * 2;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group>
        {/* Background Track */}
        <Ring args={[2.5, 3, 64]} rotation={[0, 0, 0]}>
          <meshBasicMaterial color="#ffffff" opacity={0.05} transparent side={THREE.DoubleSide} />
        </Ring>
        
        {/* Active Value Ring */}
        <Ring ref={ringRef} args={[2.5, 3, 64, 1, 0, arcLength]} rotation={[0, 0, 0]}>
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={2} 
            transparent 
            opacity={0.8}
            side={THREE.DoubleSide} 
          />
        </Ring>
        
        {/* Inner Glow */}
        <pointLight color={color} intensity={10} distance={5} />
      </group>
    </Float>
  );
};

export const AttritionRiskWidget = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch Live Data from Backend
    const fetchRiskData = async () => {
      try {
        const response = await fetch('/api/v1/analytics/workforce/attrition-risk');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Failed to load attrition risk");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRiskData();
  }, []);

  if (loading) {
    return (
      <ThreeDGlassCard className="p-6 h-full flex flex-col justify-center items-center bg-black/20">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"/>
        <p className="text-white/50 text-sm">Analyzing behavioral patterns...</p>
      </ThreeDGlassCard>
    );
  }

  if (!data) return null;

  return (
    <ThreeDGlassCard className="p-6 h-full border-t-4 border-t-red-500">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-navy">Attrition Risk Radar</h3>
          <p className="text-xs text-white/50">Target: High-Risk Engineering Segment</p>
        </div>
        <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30 animate-pulse">
          {data.riskLevel} RISK
        </div>
      </div>
      
      <div className="flex items-center gap-8 mb-8">
        {/* 3D Holographic Rendering Canvas */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 8] }}>
              <ambientLight intensity={0.5} />
              <HolographicRing riskScore={data.riskScore} />
            </Canvas>
          </div>
          
          <div className="absolute z-10 text-center pointer-events-none">
            <span className="text-3xl font-bold text-navy drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              {data.probabilityToLeave}%
            </span>
            <p className="text-[10px] text-red-400 font-medium">PROBABILITY</p>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs text-white/40 uppercase mb-1">Timeframe Risk</p>
            <p className="text-white text-sm font-medium">
              Expected exit within <span className="text-red-400 font-bold">{data.timeframeMonths} months</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase mb-1">AI Recommendation</p>
            <p className="text-white text-sm">{data.retentionStrategies[0]}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-navy mb-3">Identified Risk Factors</h4>
        <div className="space-y-3">
          {data.riskFactors.map((factor: any, i: number) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/80">{factor.factor}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${factor.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {factor.severity}
                </span>
              </div>
              <p className="text-xs text-white/40">{factor.evidence}</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${factor.severity === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-yellow-500 shadow-[0_0_8px_#eab308]'}`} 
                  style={{ width: factor.severity === 'HIGH' ? '85%' : '50%' }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ThreeDGlassCard>
  );
};
