"use client"

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  Connection,
  addEdge,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';

// GeoJSON tipi
interface IssGeoJson {
  type: 'FeatureCollection';
  features: [
    {
      type: 'Feature';
      geometry: {
        type: 'Point';
        coordinates: [number, number];
      };
      properties: {};
    }
  ];
}

// Resource type definition (copied from mindmap)
interface Resource {
  title: string;
  description: string;
  url: string;
}

// Modal (RightDrawer) component (copied and adapted from mindmap)
interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const RightDrawer: React.FC<RightDrawerProps> = ({ open, onClose, title, description, children }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn('fixed inset-0 bg-black/40 z-50 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out border-l border-gray-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-indigo-700">{title}</h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 70px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const worldRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Kullanıcıdan konum al
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.longitude,
            position.coords.latitude
          ]);
        },
        (error) => {
          console.error('Konum alınamadı:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidG9sZ2F6b3JsdSIsImEiOiJjbWFyeTBxbHYwZnJlMmtxcmNpaWczNGVuIn0.1WxEzE4dGzm7alEKtOvjZw';

    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      zoom: 1.5
    });

    let rotateInterval: NodeJS.Timeout | null = null;

    mapRef.current.on('load', async () => {
      mapRef.current!.setFog({
        range: [-1, 2],
        'horizon-blend': 0.01,
        color: '#5271ff',
        'star-intensity': 0.2,
        'high-color': '#5271ff',
      });

      // 3D dünya efekti için pitch'i artır
      mapRef.current!.setPitch(60); // 60 derece eğim

      // Dünya dönme animasyonu başlat
      if (worldRotateIntervalRef.current) {
        clearInterval(worldRotateIntervalRef.current);
      }
      worldRotateIntervalRef.current = setInterval(() => {
        if (mapRef.current) {
          const currentBearing = mapRef.current.getBearing();
          mapRef.current.setBearing(currentBearing + 0.2);
        }
      }, 30);

      if (userLocation) {
        if (rotateInterval) {
          clearInterval(rotateInterval);
        }
        // Marker oluştur ve referansa ata
        const el = document.createElement('div');
        el.style.backgroundImage = "url('https://media.licdn.com/dms/image/v2/D4D03AQGQ4zBTR3gFWQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1702392151111?e=1752710400&v=beta&t=HMcTxPU0567KbSp8MOvFUuTuNTvlxp9Y3249Ty5ynj4')";
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.backgroundSize = 'cover';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #5271ff';

        if (markerRef.current) {
          markerRef.current.remove();
        }
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat(userLocation)
          .addTo(mapRef.current!);
        // Haritayı kullanıcı konumuna odakla
        mapRef.current!.flyTo({ center: userLocation, zoom: 3 });

        // Marker'ı userLocation etrafında döndür (tur attır) yerine düz hareket ettir
        let currentLng = userLocation[0];
        const lat = userLocation[1];
        const moveStep = 0.0005; // küçük bir adım, hız ayarı
        if (markerAnimationRef.current) {
          clearInterval(markerAnimationRef.current);
        }
        markerAnimationRef.current = setInterval(() => {
          if (markerRef.current) {
            currentLng += moveStep;
            markerRef.current.setLngLat([currentLng, lat]);
          }
        }, 50);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      if (markerAnimationRef.current) {
        clearInterval(markerAnimationRef.current);
      }
      if (worldRotateIntervalRef.current) {
        clearInterval(worldRotateIntervalRef.current);
      }
    };
  }, [userLocation]);

  // Kullanıcı herhangi bir yere tıklarsa: Welcome yazısı kaybolsun, dünya normale dönsün, animasyon dursun
  useEffect(() => {
    if (!showWelcome) return;
    const handleClick = () => {
      setShowWelcome(false);
      // Dünya dönme animasyonunu durdur
      if (worldRotateIntervalRef.current) {
        clearInterval(worldRotateIntervalRef.current);
      }
      // Haritayı normale döndür (pitch:0, bearing:0)
      if (mapRef.current) {
        mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 1500 });
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showWelcome]);

  return (
    <>
      <div ref={mapContainerRef} id="map" style={{ height: '100vh', width: '100%' }} />
      <div className="fixed top-0 left-0 right-0 p-4 bg-transparent">
      <a href="/" className="flex items-center gap-2">
            <Image src="/sufle.png" alt="Sufle" width={24} height={24} />
            <span className="text-white font-semibold">Sufle</span>
          </a>
        {showWelcome && (
          <div className="flex justify-center mt-32 animate-pulse">
            <span className="text-5xl font-bold text-white text-opacity-20 drop-shadow-lg transition-opacity">Welcome to Sufle</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Map;