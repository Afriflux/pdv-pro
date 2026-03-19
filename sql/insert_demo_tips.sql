-- Insertion de quelques astuces et nouveautés pour PDV Pro
INSERT INTO "Tip" (id, type, title, content, cta_label, cta_url, target_plan, pinned, active, created_at)
VALUES 
  (
    gen_random_uuid(), 
    'guide', 
    'Comment doubler vos ventes avec WhatsApp ?', 
    'Le saviez-vous ? 80% des clients en Afrique de l''Ouest préfèrent conclure leur achat sur WhatsApp. Utilisez notre nouvelle intégration pour envoyer des liens directs.', 
    'Voir le guide', 
    '/dashboard/marketing', 
    NULL, 
    true, 
    true, 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'news', 
    'Nouveau : Le service de livraison Flash est arrivé !', 
    'Nous avons noué un partenariat pour livrer vos colis en moins de 2h à Dakar et Abidjan. Activez l''option dans vos réglages.', 
    'Activer Flash', 
    '/dashboard/settings', 
    'pro', 
    false, 
    true, 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'alert', 
    'Attention : Mettez à jour vos tarifs pour les fêtes', 
    'La période des fêtes approche. C''est le moment idéal pour créer des codes promos et booster votre visibilité.', 
    'Créer une promo', 
    '/dashboard/promotions', 
    NULL, 
    false, 
    true, 
    NOW()
  );
