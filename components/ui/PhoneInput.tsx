'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

const PRIORITY_COUNTRIES: Country[] = [
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬' },
]

const OTHER_COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'CD', name: 'Rép. Dém. du Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
]

const ALL_COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES]

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  theme?: 'light' | 'dark'
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '77 000 00 00',
  required = false,
  className = '',
  theme = 'light'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(PRIORITY_COUNTRIES[0])
  const [localNumber, setLocalNumber] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const detectLocation = async () => {
      try {
        const res = await fetch('/api/detect-country')
        const data = await res.json()
        if (mounted && data?.country_code) {
          const found = ALL_COUNTRIES.find(c => c.code === data.country_code)
          if (found) {
            setSelectedCountry(found)
          }
        }
      } catch (err) {
        console.error("IP detect error:", err)
      }
    }

    if (!value) {
      detectLocation()
    }

    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (value) {
      const match = ALL_COUNTRIES.find(c => value.startsWith(c.dialCode))
      if (match) {
        if (match.code !== selectedCountry.code) {
          setSelectedCountry(match)
        }
        const num = value.slice(match.dialCode.length)
        if (num !== localNumber) {
          setLocalNumber(num)
        }
      } else {
        if (value !== localNumber) {
           setLocalNumber(value.replace(/^\+/, ''))
        }
      }
    } else {
      setLocalNumber('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const validateLocalNumber = (num: string) => {
    const digits = num.replace(/[^0-9]/g, '')
    if (digits.length > 0 && (digits.length < 6 || digits.length > 15)) {
      setError('Numéro invalide')
    } else {
      setError('')
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9 ]/g, '')
    setLocalNumber(val)
    validateLocalNumber(val)
    
    const digits = val.replace(/[^0-9]/g, '')
    if (digits) {
      onChange(selectedCountry.dialCode + digits)
    } else {
      onChange('')
    }
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearch('')
    
    const digits = localNumber.replace(/[^0-9]/g, '')
    if (digits) {
      onChange(country.dialCode + digits)
    }
  }

  const filteredPriority = PRIORITY_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dialCode.includes(search)
  )
  
  const filteredOther = OTHER_COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dialCode.includes(search)
  )

  return (
    <div className={`relative w-full group/input ${className}`} ref={dropdownRef}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[16px] blur opacity-0 group-focus-within/input:opacity-15 transition duration-500"></div>
      <div className={`relative flex transition-all ${
        theme === 'dark'
          ? 'bg-black/20 border border-white/10 rounded-xl focus-within:border-emerald-400/50 shadow-inner' 
          : 'bg-white/80 backdrop-blur-md border border-gray-200/60 rounded-[14px] focus-within:bg-white focus-within:border-[#0F7A60] hover:border-gray-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
      } ${error ? (theme === 'dark' ? 'border-red-400 focus-within:border-red-400' : 'border-red-400 focus-within:border-red-500 shadow-red-500/10') : ''}`}>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3.5 border-r transition-colors text-sm whitespace-nowrap ${
            theme === 'dark'
              ? 'border-white/10 hover:bg-white/5 rounded-l-xl'
              : 'border-gray-200/60 hover:bg-white rounded-l-[14px]'
          }`}
        >
          <span className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{selectedCountry.dialCode}</span>
          <ChevronDown size={14} className={theme === 'dark' ? 'text-white/40' : 'text-gray-400'} />
        </button>

        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          required={required}
          className={`flex-1 w-full px-4 py-3.5 bg-transparent focus:outline-none focus:ring-0 text-[15px] font-medium ${
            theme === 'dark' ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400'
          }`}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}

      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] border rounded-2xl shadow-xl z-[100] overflow-hidden ${
          theme === 'dark' ? 'bg-[#0a1a1f] border-white/10' : 'bg-white border-line'
        }`}>
          <div className={`p-3 border-b ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-line bg-gray-50/50'}`}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dust" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-400' 
                    : 'bg-white border-line text-ink focus:border-[#0F7A60]'
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredPriority.length > 0 && (
              <div className="mb-2">
                <p className={`px-3 py-2 text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-dust'}`}>
                  Afrique
                </p>
                {filteredPriority.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                      theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#0F7A60]/5'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className={`flex-1 text-sm font-bold ${theme === 'dark' ? 'text-white/90' : 'text-charcoal'}`}>{c.name}</span>
                    <span className={`text-sm font-mono font-medium ${theme === 'dark' ? 'text-white/40' : 'text-dust'}`}>{c.dialCode}</span>
                  </button>
                ))}
              </div>
            )}

            {filteredPriority.length > 0 && filteredOther.length > 0 && (
              <div className={`h-px my-2 mx-3 ${theme === 'dark' ? 'bg-white/10' : 'bg-line'}`}></div>
            )}

            {filteredOther.length > 0 && (
              <div>
                <p className={`px-3 py-2 text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-dust'}`}>
                  Reste du monde
                </p>
                {filteredOther.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                      theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#0F7A60]/5'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className={`flex-1 text-sm font-bold ${theme === 'dark' ? 'text-white/90' : 'text-charcoal'}`}>{c.name}</span>
                    <span className={`text-sm font-mono font-medium ${theme === 'dark' ? 'text-white/40' : 'text-dust'}`}>{c.dialCode}</span>
                  </button>
                ))}
              </div>
            )}
            
            {filteredPriority.length === 0 && filteredOther.length === 0 && (
              <p className="text-center text-sm font-medium text-dust py-6">Aucun pays trouvé</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
