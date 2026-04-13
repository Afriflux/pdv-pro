/**
 * Validation service pour Yayyam ERP
 * 
 * Validateurs typés sans dépendance externe (npm install cassé).
 * Fonctionnellement équivalent à Zod pour les cas d'usage API.
 * 
 * Usage :
 *   const result = validate(body, checkoutSchema)
 *   if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
 *   const data = result.data  // typé automatiquement
 */

// ── Résultat de validation ────────────────────────────────────────────────────
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── Validateur générique ──────────────────────────────────────────────────────
type Validator<T> = {
  fields: { [K in keyof T]: FieldRule }
}

type FieldRule = {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[]
  label?: string      // Nom humain pour les messages d'erreur
}

/**
 * Valide un objet selon un schéma de règles.
 */
export function validate<T extends Record<string, unknown>>(
  input: unknown,
  schema: Validator<T>
): ValidationResult<T> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Le corps de la requête est invalide ou manquant.' }
  }

  const obj = input as Record<string, unknown>
  const errors: string[] = []

  for (const [key, rule] of Object.entries(schema.fields) as [string, FieldRule][]) {
    const value = obj[key]
    const label = rule.label || key

    // Required check
    if (rule.required !== false && (value === undefined || value === null || value === '')) {
      errors.push(`${label} est requis.`)
      continue
    }

    // Skip optional empty
    if (value === undefined || value === null) continue

    // Type check
    if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${label} doit être une liste.`)
        continue
      }
    } else if (typeof value !== rule.type) {
      errors.push(`${label} doit être de type ${rule.type}.`)
      continue
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min && value.length < rule.min) {
        errors.push(`${label} doit contenir au moins ${rule.min} caractères.`)
      }
      if (rule.max && value.length > rule.max) {
        errors.push(`${label} ne doit pas dépasser ${rule.max} caractères.`)
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${label} a un format invalide.`)
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${label} doit être parmi : ${rule.enum.join(', ')}.`)
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${label} doit être au moins ${rule.min}.`)
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${label} ne doit pas dépasser ${rule.max}.`)
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join(' ') }
  }

  return { success: true, data: input as T }
}

// ── Schémas prédéfinis ────────────────────────────────────────────────────────

/** Checkout initiation */
export const checkoutSchema: Validator<{
  product_id: string
  store_id: string
  buyer_name: string
  buyer_phone: string
  buyer_email: string
  quantity: number
  payment_method: string
}> = {
  fields: {
    product_id: { type: 'string', required: true, label: 'Produit' },
    store_id: { type: 'string', required: true, label: 'Boutique' },
    buyer_name: { type: 'string', required: true, min: 2, max: 100, label: 'Nom de l\'acheteur' },
    buyer_phone: { type: 'string', required: true, pattern: /^\+?\d{8,15}$/, label: 'Téléphone' },
    buyer_email: { type: 'string', required: false, label: 'Email' },
    quantity: { type: 'number', required: true, min: 1, max: 100, label: 'Quantité' },
    payment_method: {
      type: 'string',
      required: true,
      enum: ['wave', 'bictorys', 'paytech', 'cinetpay', 'moneroo', 'cod', 'pending'],
      label: 'Méthode de paiement'
    },
  }
}

/** Newsletter subscription */
export const newsletterSchema: Validator<{
  storeId: string
  email: string
}> = {
  fields: {
    storeId: { type: 'string', required: true, label: 'Boutique' },
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, label: 'Email' },
  }
}

/** Payment initiation */
export const paymentInitiateSchema: Validator<{
  orderId: string
  method: string
}> = {
  fields: {
    orderId: { type: 'string', required: true, label: 'Commande' },
    method: {
      type: 'string',
      required: true,
      enum: ['wave', 'bictorys', 'paytech', 'cinetpay', 'moneroo'],
      label: 'Méthode de paiement'
    },
  }
}

/** Bio click tracking */
export const clickSchema: Validator<{
  slug: string
}> = {
  fields: {
    slug: { type: 'string', required: true, min: 1, max: 200, label: 'Slug' },
  }
}
