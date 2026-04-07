const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding real workflows...');

  await prisma.workflow.deleteMany({
    where: {
      store_id: null,
      user_id: null,
    }
  });

  const workflows = [
    {
      title: "Récupération Intense de Panier Abandonné",
      description: "Relance automatique par WhatsApp après 2 heures si un panier n'est pas finalisé, avec une offre promotionnelle intégrée.",
      status: "active",
      triggerType: "Panier Abandonné",
      is_premium: true,
      price: 5000,
      config: {
        delay: { active: true, amount: 2, unit: "hours" },
        condition: { active: false },
        actions: [
          {
            type: "whatsapp_message",
            payload: { message: "Hello {{client_name}} 👋,\n\nVous avez oublié \"{{product_name}}\" 🛒.\n🎁 Voici -10% immédiats pour vous décider (CODE : VIP10) :\n👉 {{checkout_link}}" }
          },
          {
            type: "create_task",
            payload: { title: "Appeler {{client_name}} si toujours pas de commande dans 24h", priority: "high" }
          }
        ]
      }
    },
    {
      title: "Accueil & Bienvenue Nouveaux Acheteurs",
      description: "Envoie un e-mail de bienvenue personnalisé dès qu'une nouvelle commande est passée, pour renforcer la confiance.",
      status: "active",
      triggerType: "Nouvelle Commande",
      is_premium: false,
      price: 0,
      config: {
        delay: { active: false },
        condition: { active: false },
        actions: [
          {
            type: "email_customer",
            payload: { message: "Objet : Bienvenue chez {{store_name}}, {{client_name}} ! 🎉\n\nNous sommes ravis de vous compter parmi nos membres. Voici le récapitulatif de votre commande de \"{{product_name}}\"." }
          },
          {
            type: "push_notification",
            payload: { message: "🎉 Vente Réussie : Nouvelle commande enregistrée pour {{product_name}} par {{client_name}} ! 💰" }
          }
        ]
      }
    },
    {
      title: "SAV Automatisé par IA (Niveau 1)",
      description: "Répond instantanément aux questions courantes (délais de livraison, retours) grâce à l'IA avant d'escalader au support humain.",
      status: "active",
      triggerType: "Nouvelle Question",
      is_premium: true,
      price: 15000,
      config: {
        delay: { active: false },
        condition: { active: false },
        actions: [
          {
            type: "auto_reply_ai",
            payload: { instructions: "Tu es l'assistant de notre boutique. Réponds toujours de façon courtoise et concise. Si la question concerne les délais, dis 48h." }
          }
        ]
      }
    },
    {
      title: "Synchronisation externe (Make/Zapier)",
      description: "Envoie toutes les informations de livraison et de commande vers un webhook externe pour automatiser la logistique.",
      status: "active",
      triggerType: "Commande Livrée",
      is_premium: true,
      price: 10000,
      config: {
        delay: { active: false },
        condition: { active: true, field: "order_total", operator: ">", value: "0" },
        actions: [
          {
            type: "webhook",
            payload: { url: "https://hook.make.com/your-custom-webhook-id", method: "POST" }
          },
          {
            type: "whatsapp_message",
            payload: { message: "Merci {{client_name}} ! 🎉\nVotre colis a été noté comme livré. N'hésitez pas à nous laisser un avis !" }
          }
        ]
      }
    },
    {
      title: "Alerte de Vente VIP (Télégram)",
      description: "Avertissez vos équipes immédiatement sur Telegram pour les grosses commandes.",
      status: "active",
      triggerType: "Nouvelle Commande",
      is_premium: false,
      price: 0,
      config: {
        delay: { active: false },
        condition: { active: true, field: "order_total", operator: ">", value: "20000" },
        actions: [
          {
            type: "telegram_group",
            payload: { message: "🚨 ALERTE GROSSE VENTE: {{client_name}} vient de passer une commande de plus de 20 000 FCFA pour {{product_name}} !" }
          },
          {
            type: "push_notification",
            payload: { message: "🚨 VIP Commande : Appeler {{client_name}} pour confirmer." }
          }
        ]
      }
    }
  ];

  for (const w of workflows) {
    await prisma.workflow.create({
      data: {
        title: w.title,
        description: w.description,
        status: w.status,
        triggerType: w.triggerType,
        is_premium: w.is_premium,
        price: w.price,
        config: w.config,
      }
    });
  }

  console.log('Workflows seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
