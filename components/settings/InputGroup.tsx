import React from 'react'

export interface InputGroupProps {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  required?: boolean
}

export function InputGroup({ label, value, onChange, placeholder, type = 'text', disabled = false, required = false }: InputGroupProps) {
  return (
    <div className="space-y-1.5 w-full group/input">
      <label className="block text-[12px] font-bold text-gray-700 transition-colors group-focus-within/input:text-[#0F7A60]">{label}</label>
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[16px] blur opacity-0 group-focus-within/input:opacity-15 transition duration-500"></div>
        <input 
          required={required}
          type={type}
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="relative w-full px-4 py-3.5 bg-white/80 backdrop-blur-md border border-gray-200/60 rounded-[14px] focus:bg-white focus:ring-0 focus:border-[#0F7A60] outline-none transition-all text-[15px] font-medium text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50/50 hover:border-gray-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)]" 
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
