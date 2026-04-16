'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface GeoContextType {
  currentCountry: string
  setCurrentCountry: (countryCode: string) => void
  isLoading: boolean
}

const GeoContext = createContext<GeoContextType | undefined>(undefined)

export const COUNTRIES = [
  { code: 'ALL', name: 'Monde Entier', emoji: '🌍' },
  { code: 'SN', name: 'Sénégal', emoji: '🇸🇳' },
  { code: 'CI', name: 'Côte d\'Ivoire', emoji: '🇨🇮' },
  { code: 'BJ', name: 'Bénin', emoji: '🇧🇯' },
  { code: 'TG', name: 'Togo', emoji: '🇹🇬' },
  { code: 'ML', name: 'Mali', emoji: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', emoji: '🇧🇫' },
  { code: 'GN', name: 'Guinée', emoji: '🇬🇳' },
  { code: 'CM', name: 'Cameroun', emoji: '🇨🇲' },
  { code: 'FR', name: 'France', emoji: '🇫🇷' }
]

export const GeoProvider = ({ children, initialCountry = 'ALL' }: { children: ReactNode, initialCountry?: string }) => {
  const [currentCountry, setCountryState] = useState<string>(initialCountry)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Check local storage
    const saved = localStorage.getItem('yayyam_geo_country')
    if (saved) {
      setCountryState(saved)
      setIsLoading(false)
    } else {
      // 2. Fetch from Edge / API (if no initialCountry was provided by header)
      fetch('/api/geo')
        .then(res => res.json())
        .then(data => {
          if (data.country) {
            setCountryState(data.country)
            localStorage.setItem('yayyam_geo_country', data.country)
          }
        })
        .catch(() => console.error('Erreur detection pays'))
        .finally(() => setIsLoading(false))
    }
  }, [])

  const setCurrentCountry = (countryCode: string) => {
    setCountryState(countryCode)
    if (countryCode === 'ALL') {
      localStorage.removeItem('yayyam_geo_country')
    } else {
      localStorage.setItem('yayyam_geo_country', countryCode)
    }
  }

  return (
    <GeoContext.Provider value={{ currentCountry, setCurrentCountry, isLoading }}>
      {children}
    </GeoContext.Provider>
  )
}

export const useGeo = (): GeoContextType => {
  const context = useContext(GeoContext)
  if (!context) {
    throw new Error('useGeo doit être utilisé dans un GeoProvider')
  }
  return context
}
