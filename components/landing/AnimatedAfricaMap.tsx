'use client'

import React from 'react'

export function AnimatedAfricaMap() {
  return (
    <div className="relative w-full aspect-[16/9] max-h-[600px] overflow-hidden rounded-[2rem] mx-auto mt-10 group">
      {/* L'image ChatGPT directement affichée */}
      <img
        src="/landing/africa_map.jpg"
        alt="Carte Afrique – Zones UEMOA et CEMAC desservies par Yayyam"
        className="w-full h-full object-cover transition-transform duration-[20s] ease-in-out group-hover:scale-105"
        draggable={false}
      />
      
      {/* Vignette subtile sur les bords */}
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none rounded-[2rem]" />
    </div>
  )
}
