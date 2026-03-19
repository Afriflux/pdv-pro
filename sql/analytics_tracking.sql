-- Fonction pour incrémenter les vues d'une SalePage
CREATE OR REPLACE FUNCTION record_page_visit(p_page_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO "PageAnalytics" (page_id, visits, date)
    VALUES (p_page_id, 1, CURRENT_DATE)
    ON CONFLICT (page_id, date) 
    DO UPDATE SET visits = "PageAnalytics".visits + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les ventes d'une SalePage (appelée lors de la confirmation d'une commande)
CREATE OR REPLACE FUNCTION record_page_purchase(p_page_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO "PageAnalytics" (page_id, purchases, date)
    VALUES (p_page_id, 1, CURRENT_DATE)
    ON CONFLICT (page_id, date) 
    DO UPDATE SET purchases = "PageAnalytics".purchases + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les clics sur un ShortLink
CREATE OR REPLACE FUNCTION record_link_click(p_link_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO "ClickAnalytics" (short_link_id, created_at)
    VALUES (p_link_id, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
