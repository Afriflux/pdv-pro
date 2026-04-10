'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  name: string
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  className?: string
  iconLeft?: React.ReactNode
}

export function PasswordInput({
  id,
  name,
  placeholder = '••••••••',
  required = true,
  minLength,
  autoComplete,
  className = '',
  iconLeft,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      {iconLeft && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {iconLeft}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete || 'current-password'}
        className={`${className} ${iconLeft ? 'pl-11' : ''} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        tabIndex={-1}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-500 hover:text-emerald-400 transition-colors focus:outline-none z-10"
      >
        {show ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
