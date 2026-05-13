'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { provinces, ProvinceData } from '@/lib/data';

const EARTH_RADIUS = 5;

// Chuyển đổi Vĩ độ / Kinh độ thành tọa độ Vector3
function latLongToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Khối cầu Trái Đất (Không thêm mây, sao, hay khí quyển)
function EarthGlobe() {
  const colorMap = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial map={colorMap} roughness={0.7} metalness={0} />
    </mesh>
  );
}

// Nhãn Bản đồ Hành chính (Chỉ chữ, viền đen)
function AdminLabel({ data, onSelect, active }: { data: ProvinceData; onSelect: (id: string) => void; active: boolean }) {
  const position = useMemo(() => latLongToVector3(data.coordinates[0], data.coordinates[1], EARTH_RADIUS), [data.coordinates]);

  return (
    <group position={position}>
      <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
        <div 
          onPointerDown={(e) => { e.stopPropagation(); onSelect(data.id); }}
          className={`cursor-pointer whitespace-nowrap font-sans transition-colors duration-200 ${
            active ? 'text-[#ff3333] z-50 font-black scale-110' : 'text-white font-bold hover:text-[#ffff00]'
          }`}
          style={{ 
            // Đổ bóng viền đen ôm sát chữ, tạo hiệu ứng giống in ấn bản đồ
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 2px 4px rgba(0,0,0,0.8)', 
            fontSize: '11px',
            userSelect: 'none'
          }}
        >
          {data.name}
        </div>
      </Html>
    </group>
  );
}

// BỘ ĐIỀU KHIỂN CAMERA - NHẢ QUYỀN TỰ DO CHO USER
function CameraController({ selectedId }: { selectedId: string | null }) {
  const controlsRef = useRef<any>(null);
  const isAutoFlying = useRef(false);
  const targetPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (selectedId) {
      const p = provinces.find(x => x.id === selectedId);
      if (p) {
        // Tọa độ bay đến (cách mặt đất 1.15 lần bán kính để chừa khoảng cách zoom)
        targetPos.current.copy(latLongToVector3(p.coordinates[0], p.coordinates[1], EARTH_RADIUS * 1.15));
        isAutoFlying.current = true;
      }
    }
  }, [selectedId]);

  useFrame((state) => {
    if (isAutoFlying.current) {
      // Lerp giúp camera lướt đi êm ái
      state.camera.position.lerp(targetPos.current, 0.05);
      
      // Khi đã tới gần mục tiêu, tự động tắt chế độ bay
      if (state.camera.position.distanceTo(targetPos.current) < 0.05) {
        isAutoFlying.current = false;
      }
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      enableZoom={true} 
      
      // GIẢM ĐỘ NHẠY XUỐNG 1/2
      zoomSpeed={0.5} 
      rotateSpeed={0.5} 
      
      // Cho phép cuộn sát xuống chạm mặt đất (+0.01)
      minDistance={EARTH_RADIUS + 0.01} 
      maxDistance={EARTH_RADIUS * 3.5} 
      enableDamping={true}
      dampingFactor={0.05}
      // NÚT CHẶN: Vừa thao tác chuột là ngắt ngay tiến trình tự bay!
      onStart={() => { isAutoFlying.current = false; }}
    />
  );
}

export default function Map3D({ selectedId, onSelectProvince }: { selectedId: string | null; onSelectProvince: (id: string) => void }) {
  return (
    <div className="w-full h-full bg-[#0a1128] relative">
      <Canvas>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2.5} />
        
        <CameraController selectedId={selectedId} />
        
        <group onPointerMissed={() => onSelectProvince('')}>
          <EarthGlobe />
          
          {/* Lặp qua danh sách 34 địa danh */}
          {provinces.map((prov) => (
            <AdminLabel key={prov.id} data={prov} onSelect={onSelectProvince} active={selectedId === prov.id} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}