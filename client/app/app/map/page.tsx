"use client"

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';
import { MetaMaskConnect } from '@/components/MetaMaskConnect';
import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import { Maximize, Minimize } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const worldRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      zoom: 4
    });

    let rotateInterval: NodeJS.Timeout | null = null;

    mapRef.current.on('load', async () => {
      setIsMapLoading(false);
      mapRef.current!.setFog({
        range: [-1, 2],
        'horizon-blend': 0.01,
        color: 'teal',
        'star-intensity': 0.2,
        'high-color': 'teal',
      });

      // 3D dünya efekti için pitch'i artır
      mapRef.current!.setPitch(60); // 60 derece eğim
      mapRef.current!.setBearing(120);

      // Dünya dönme animasyonu başlat
      if (worldRotateIntervalRef.current) {
        clearInterval(worldRotateIntervalRef.current);
      }
      worldRotateIntervalRef.current = setInterval(() => {
        if (mapRef.current) {
          const currentBearing = mapRef.current.getBearing();
          mapRef.current.setBearing(currentBearing + 0.02);
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
        el.style.border = '2px solid black';
        el.style.cursor = 'pointer';
        el.title = 'Profil Bilgilerini Gör';

        if (markerRef.current) {
          markerRef.current.remove();
        }
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat(userLocation)
          .addTo(mapRef.current!);
        // Haritayı kullanıcı konumuna odakla
        mapRef.current!.flyTo({ center: userLocation, zoom: 1.5 });

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
        mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 1500, zoom: 2.2});
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showWelcome]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {/* Loading Overlay */}
      {isMapLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'black',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Zoomies size={200} speed={1} color="cyan" />
        </div>
      )}
      <div ref={mapContainerRef} id="map" style={{ height: '104vh', width: '100%' }} />
      <div className="fixed top-0 left-0 right-0 p-4 bg-transparent">
       <div className='flex justify-between items-center'> <a href="/" className="flex items-center gap-2 font-bandal text-3xl">
          <Image src="/sufle.png" alt="Sufle" width={24} height={24} />
        </a>
        <MetaMaskConnect 
          onConnect={() => setIsWalletConnected(true)}
          onDisconnect={() => setIsWalletConnected(false)}
        />
      </div>
        {showWelcome && (
          <div className="flex justify-center mt-16">
            <span className="text-4xl font-bold text-white text-opacity-20 drop-shadow-lg transition-opacity font-bandal">
              {isWalletConnected ? 'tap anywhere to start' : 'connect wallet to continue'}
            </span>
          </div>
        )}      
      </div>
      {/* Fullscreen Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Toggle
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          pressed={isFullscreen}
          onPressedChange={toggleFullscreen}
          variant="outline"
          size="lg"
          className="bg-background border-border shadow-sm rounded-full h-12 w-12 flex items-center justify-center"
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5 text-foreground" />
          ) : (
            <Maximize className="h-5 w-5 text-foreground" />
          )}
        </Toggle>
      </div>
    </>
  );
};

export default Map;