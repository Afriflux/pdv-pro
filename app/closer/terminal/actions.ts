"use server"

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export type LeadStatusType = 'new' | 'contacted' | 'qualified' | 'won' | 'lost'

export async function getTerminalLeads() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error("Non autorisé")
    }

    // Récupérer les leads "new" (non assignés) OU les leads assignés à ce closer
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { status: 'new', closer_id: null }, // Leads disponibles
          { closer_id: user.id }              // Leads de ce closer
        ]
      },
      include: {
        Product: {
          select: { name: true, price: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return { success: true, leads }
  } catch (error: any) {
    console.error("[getTerminalLeads Error]", error)
    return { success: false, error: error.message }
  }
}

export async function claimLead(leadId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Non autorisé")

    const lead = await prisma.lead.update({
      where: { id: leadId, closer_id: null }, // Security: ensure it's not claimed
      data: {
        closer_id: user.id,
        status: 'contacted', // Once claimed, we consider it "En Négociation / Actif"
        claimed_at: new Date()
      }
    })

    return { success: true, lead }
  } catch (error: any) {
    console.error("[claimLead Error]", error)
    return { success: false, error: "Lead déjà réservé ou erreur système." }
  }
}

export async function updateLeadStatus(leadId: string, newStatus: LeadStatusType) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Non autorisé")

    const data: any = { status: newStatus }
    
    if (newStatus === 'won' || newStatus === 'lost') {
      data.closed_at = new Date()
      
      if (newStatus === 'won') {
        const leadInfo = await prisma.lead.findUnique({
          where: { id: leadId },
          include: { 
            Store: { select: { closer_active: true, closer_margin: true } },
            Product: { select: { price: true, closer_active: true, closer_margin: true } }
          }
        })
        
        let commission = 0
        if (leadInfo?.Product) {
           let margin = leadInfo.Store.closer_margin
           
           // Override produit
           if (leadInfo.Product.closer_active !== null) {
              if (leadInfo.Product.closer_active) {
                margin = leadInfo.Product.closer_margin ?? margin
              } else {
                margin = 0
              }
           } else if (!leadInfo.Store.closer_active) {
              margin = 0 
           }
           
           commission = leadInfo.Product.price * margin
        }
        data.commission_amount = commission
      }
    }

    const lead = await prisma.lead.update({
      where: { id: leadId, closer_id: user.id }, // Security: only closer can update their lead
      data
    })

    return { success: true, lead }
  } catch (error: any) {
    console.error("[updateLeadStatus Error]", error)
    return { success: false, error: error.message }
  }
}
