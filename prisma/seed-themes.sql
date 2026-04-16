-- Copiez / Collez ceci dans votre interface SQL (Supabase ou pgAdmin) pour ajouter 5 nouveaux thèmes super-optimisés.

INSERT INTO "ThemeTemplate" (id, name, description, type, category, data, is_premium, is_global, active, price, "allowed_roles", created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Cosmétiques Prémium (Rose)', 'Un thème parfait pour la beauté, le skincare et les cosmétiques, avec des tons doux et professionnels.', 'store', 'cosmetics', '{"theme": "pink", "brandColor": "#ec4899", "layout": "luxury", "fontHeading": "Playfair Display", "fontBody": "Inter", "heroStyle": "split"}', false, true, true, 0, ARRAY['all'], now(), now()),
  
  (gen_random_uuid(), 'Électronique Minimaliste', 'Pour la vente de gadgets, smartphones et électronique. Design épuré inspiré par Apple.', 'store', 'electronics', '{"theme": "zinc", "brandColor": "#000000", "layout": "minimal", "fontHeading": "Inter", "fontBody": "Inter", "heroStyle": "center"}', true, true, true, 4900, ARRAY['all'], now(), now()),
  
  (gen_random_uuid(), 'Prêt-à-porter (Streetwear)', 'Thème agressif, sombre et dynamique, pensé pour la mode urbaine et les sneakers.', 'store', 'fashion', '{"theme": "dark", "brandColor": "#f97316", "layout": "grid", "fontHeading": "Oswald", "fontBody": "Roboto", "heroStyle": "fullscreen"}', false, true, true, 0, ARRAY['all'], now(), now()),
  
  (gen_random_uuid(), 'Parfumerie de Luxe', 'Design très haut de gamme, utilisant l''or et le noir pour maximiser la perception de valeur.', 'sale_page', 'beauty', '{"theme": "luxury", "brandColor": "#d4af37", "layout": "luxury", "fontHeading": "Playfair Display", "fontBody": "Inter", "heroStyle": "split"}', true, true, true, 9900, ARRAY['all'], now(), now()),
  
  (gen_random_uuid(), 'Landing Page Gadget (Monoproduit)', 'Une page de vente agressive ultra-optimisée pour la conversion avec compte à rebours.', 'sale_page', 'gadget', '{"theme": "blue", "brandColor": "#2563eb", "layout": "funnel", "fontHeading": "Montserrat", "fontBody": "Open Sans", "featuresLayout": "zigzag"}', false, true, true, 0, ARRAY['all'], now(), now());
