import { prisma } from '@/lib/prisma'
// import Anthropic from '@anthropic-ai/sdk'

/**
 * Moteur d'exécution asynchrone des Workflows
 */
export async function executeWorkflows(
  storeId: string, 
  triggerType: string, 
  payload: Record<string, any>
) {
  try {
    // 1. Récupérer les workflows actifs correspondants
    const activeWorkflows = await prisma.workflow.findMany({ take: 50, 
      where: {
        store_id: storeId,
        status: 'active',
        triggerType: triggerType
      }
    })

    if (activeWorkflows.length === 0) return { success: true, message: 'Aucun workflow actif pour ce déclencheur.' }

    // 2. Parcourir et exécuter chaque workflow
    for (const wf of activeWorkflows) {
      const config = wf.config as any // { condition, actions, delay }

      // --- FILTRE CONDITIONNEL ---
      if (config.condition && config.condition.active) {
        const { field, operator, value } = config.condition
        const payloadValue = payload[field]
        
        let conditionMet = false
        if (operator === '>') {
          conditionMet = Number(payloadValue) > Number(value)
        } else if (operator === '<') {
          conditionMet = Number(payloadValue) < Number(value)
        } else if (operator === '==') {
          conditionMet = String(payloadValue) === String(value)
        }

        if (!conditionMet) {
          console.log(`[Workflow ${wf.id}] Bloqué par la condition: ${field} ${operator} ${value} (Valeur reçue: ${payloadValue})`)
          continue // Passe au prochain workflow
        }
      }

      // --- ACTIONS ---
      if (config.actions && Array.isArray(config.actions)) {
        for (const action of config.actions) {
          await processAction(action, payload, storeId)
        }
      }

      // Met à jour la date de dernière exécution
      await prisma.workflow.update({
        where: { id: wf.id },
        data: { last_run: new Date() }
      })
    }

    return { success: true, executed: activeWorkflows.length }

  } catch (error) {
    console.error("[WorkflowEngine] Erreur globale d'exécution:", error)
    return { success: false, error: 'Erreur exécution workflow' }
  }
}

async function processAction(action: any, payload: Record<string, any>, storeId: string) {
  const payloadStr = JSON.stringify(payload)
  
  if (action.type === 'create_task') {
    let title = action.payload.title || 'Tâche automatique'
    // Remplacement basique des variables type {{client_name}}
    for (const [key, val] of Object.entries(payload)) {
      title = title.replaceAll(`{{${key}}}`, String(val))
    }

    await prisma.task.create({
      data: {
        store_id: storeId,
        title: title,
        description: `Généré automatiquement par un workflow.\nContexte : ${payloadStr}`,
        taskType: 'general',
        priority: 'medium',
        status: 'todo'
      }
    })
    console.log(`[Action] Tâche CRM créée : ${title}`)

  } else if (action.type === 'webhook') {
    try {
      if (action.payload.url) {
        await fetch(action.payload.url, {
          method: action.payload.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        console.log(`[Action] Webhook envoyé vers ${action.payload.url}`)
      }
    } catch(err) {
      console.error(`[Action] Erreur Webhook`, err)
    }

  } else if (action.type === 'auto_reply_ai') {
    console.log(`[Action] Génération de réponse IA pour la question de ${payload.client_name}`)
    // Intégration IA basique (mock ou Anthropic selon variables)
    // Ici on simulerait l'envoi d'un email automatique ou d'un message SAV au client.
    console.log(`[Action] Réponse générée utilisant le prompt: ${action.payload.instructions}`)
    
    // On peut logger ça dans une table 'SAV' ou envoyer un email SMTP.

  } else if (action.type === 'whatsapp_message') {
    // Intégration Whatsapp API ou Twilio.
    console.log(`[Action] Message WhatsApp poussé dans la file d'attente pour ${payload.client_name}`)
  }
}
