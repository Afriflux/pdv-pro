import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp/sendWhatsApp'
import { sendTransactionalEmail } from '@/lib/brevo/brevo-service'

// Définitions des types
export type WorkflowTriggerType = 
  | 'Nouvelle Commande (Validée COD)'
  | 'Panier Abandonné'
  | 'Nouvelle Question Client'
  | string;

export interface WorkflowEventPayload {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  product_name?: string;
  order_id?: string;
  order_total?: number;
  customer_city?: string;
  telegram_link?: string; // Si généré par ailleurs
  store_name?: string;
  [key: string]: any;
}

export async function executeWorkflows(storeId: string, triggerType: WorkflowTriggerType, payload: WorkflowEventPayload) {
  try {
    // 1. Récupérer tous les workflows actifs pour cet événement
    const workflows = await prisma.workflow.findMany({
      where: { 
        store_id: storeId, 
        triggerType: triggerType,
        status: 'active'
      }
    });

    if (!workflows || workflows.length === 0) return;

    for (const wf of workflows) {
      const config = wf.config as any;
      if (!config) continue;

      // 2. Traiter le filtre / Condition optionnelle
      if (config.condition?.active) {
        let passes = false;
        const op = config.condition.operator;
        const val = config.condition.value;
        const fieldVal = payload[config.condition.field as keyof WorkflowEventPayload];

        if (fieldVal !== undefined && fieldVal !== null) {
          if (op === '>' && Number(fieldVal) > Number(val)) passes = true;
          if (op === '<' && Number(fieldVal) < Number(val)) passes = true;
          if (op === '==' && String(fieldVal).trim().toLowerCase() === String(val).trim().toLowerCase()) passes = true;
        }

        if (!passes) {
          console.log(`[Workflow Engine] Condition non remplie pour le workflow ${wf.id} (${config.condition.field} ${op} ${val} vs ${fieldVal})`);
          continue; // On arrête ce workflow
        }
      }

      // 3. Traiter le délai optionnel
      if (config.delay?.active) {
        // Dans une V1 synchrone, on ne peut pas vraiment bloquer la requête HTTP pendant des heures.
        // On devrait insérer la tâche dans une table "ScheduledTask" ou utiliser un CRON.
        // Pour l'instant, on log et on passe à l'action suivante (ou on l'exécute quand même pour la démo).
        console.log(`[Workflow Engine] Délai demandé de ${config.delay.amount} ${config.delay.unit} pour le workflow ${wf.id} - Bypass en synchrone V1`);
      }

      // 4. Exécuter les Actions
      const actions = config.actions || [];
      for (const action of actions) {
        const { type, payload: actionPayload } = action;
        if (!actionPayload) continue;

        // Variables Replacement Engine
        let finalMessage = actionPayload.message || '';
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            finalMessage = finalMessage.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
          }
        });

        // Suppression des balises non résolues
        finalMessage = finalMessage.replace(/{{.*?}}/g, '');

        try {
          switch (type) {
            case 'whatsapp_message':
              if (payload.client_phone) {
                // Utiliser le service d'envoi WhatsApp intégré
                await sendWhatsApp({ to: String(payload.client_phone), body: finalMessage });
                console.log(`[Workflow Engine] WhatsApp envoyé avec succès pour ${payload.client_phone}`);
              } else {
                console.warn(`[Workflow Engine] Numéro WhatsApp manquant pour l'action ${wf.id}`);
              }
              break;

            case 'email_customer':
              if (payload.client_email) {
                await sendTransactionalEmail({
                  to: [{ email: String(payload.client_email), name: payload.client_name || 'Client' }],
                  subject: `Message de ${payload.store_name || 'PDV Pro'}`,
                  htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><p>${finalMessage.replace(/\n/g, '<br>')}</p></div>`,
                  sender: { name: payload.store_name || 'PDV Pro', email: 'no-reply@pdvpro.sn' } // Envoi depuis l'alias par défaut
                });
                console.log(`[Workflow Engine] Email envoyé avec succès à ${payload.client_email}`);
              }
              break;

            case 'webhook':
              if (actionPayload.url) {
                const method = actionPayload.method || 'POST';
                await fetch(actionPayload.url, {
                  method,
                  headers: { 'Content-Type': 'application/json' },
                  body: method === 'POST' ? JSON.stringify(payload) : undefined
                });
                console.log(`[Workflow Engine] Webhook ${method} déclenché : ${actionPayload.url}`);
              }
              break;

             case 'push_notification':
              // Notification push locale au vendeur (Simulée)
              console.log(`[Workflow Engine] Push interne généré: ${finalMessage}`);
              break;

            case 'telegram_group':
            case 'telegram_vip':
              // Logique de Telegram, si on a un chatId ou bot, on appelle l'API Telegram.
              // Le lien VIP Gateway est généré en amont par GatewayBot (géré dans le cron ou route).
              console.log(`[Workflow Engine] Action Telegram déclenchée: ${finalMessage}`);
              break;

            case 'create_task':
              if (actionPayload.title) {
                try {
                  // Deduction simple du type : si ça vient d'une question c'est un SAV, sinon un appel/relance
                  const deducedType = triggerType === 'Nouvelle Question Client' ? 'issue' : 'call';
                  
                  await prisma.task.create({
                    data: {
                      store_id: storeId,
                      title: finalMessage, // On utilise finalMessage qui peut contenir des variables
                      priority: actionPayload.priority || 'medium',
                      status: 'todo',
                      // Super-Pouvoir CRM : Injection du contexte automatiquement !
                      description: `Tâche générée automatiquement par le Workflow "${wf.title || 'Automatique'}".\nDéclencheur : ${triggerType}`,
                      taskType: actionPayload.taskType || deducedType,
                      client_name: payload.client_name || null,
                      client_phone: payload.client_phone || null,
                      order_id: payload.order_id || null
                    }
                  });
                  console.log(`[Workflow Engine] Tâche CRM Créée: ${finalMessage} pour le workflow ${wf.id}`);
                } catch (taskErr) {
                  console.error(`[Workflow Engine] Erreur lors de la création de la tâche:`, taskErr);
                }
              }
              break;

            default:
              console.warn(`[Workflow Engine] Type d'action non supporté: ${type}`);
          }
        } catch (actionErr) {
          console.error(`[Workflow Engine] Erreur lors de l'exécution de l'action ${type} du workflow ${wf.id}:`, actionErr);
        }
      }

      // Update du compteur/heure de last_run en asynchrone pour ne pas ralentir le reste
      prisma.workflow.update({
        where: { id: wf.id },
        data: { 
          // last_run: new Date() (Si on l'ajoute plus tard au schema)
        }
      }).catch(e => console.error(`[Workflow Engine] Erreur update stats workflow:`, e));

    }
  } catch (error) {
    console.error(`[Workflow Engine FATAL ERROR]:`, error);
  }
}
