# Configuration des Tâches Planifiées (Crons) pour Yayyam sur Netlify

L'hébergement étant sur Netlify, les configurations définies dans le fichier `vercel.json` pour les crons ne s'appliquent pas automatiquement. Il est nécessaire d'utiliser un service de déclenchement externe pour simuler ces tâches automatiques via requêtes HTTP.

## Solution Recommendée : cron-job.org (Gratuit et Simple)
Créez un compte sur [cron-job.org](https://cron-job.org) et configurez les requêtes suivantes avec la méthode `GET` vers l'URL de production de votre application (`https://votre-app.com`) :

| Fonctionnalité | Schedule | URL Endpoint |
| --- | --- | --- |
| **Scores & Statistiques (Minuit)** | `0 0 * * *` | `/api/cron/scores` |
| **Fonds & Retraits (Toutes les h)** | `0 * * * *` | `/api/cron/funds` |
| **Rappels COD (Toutes les h)** | `0 * * * *` | `/api/cron/reminders` |
| **Expirations Promos (Toutes les h)** | `0 * * * *` | `/api/cron/promotions` |
| **Rapports Domaines / Checks (10m)** | `*/10 * * * *` | `/api/cron/domains` |
| **Anti-Churn (1 fois/jour)** | `0 10 * * *` | `/api/cron/anti-churn` |

> **⚠️ AUTHENTIFICATION REQUISE**  
> Pour la route `/api/cron/anti-churn` (et toute autre route de cron sécurisée), n'oubliez pas d'indiquer le secret via Header HTTP dans la configuration :
> **Header Name:** `Authorization`  
> **Header Value:** `Bearer VOTRE_CRON_SECRET`  
> *(La valeur `VOTRE_CRON_SECRET` doit correspondre à la variable d'environnement déclarée dans Netlify sous `CRON_SECRET`)*

---

### Alternative Technologique
Vous pouvez par la suite utiliser **Supabase Edge Functions** couplées aux **pg_cron / schedulers** de Supabase pour un traitement tout intégré si vos besoins évoluent au-delà des requêtes HTTP.
