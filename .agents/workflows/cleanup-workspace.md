---
description: Nettoie l'espace de travail en libérant la mémoire et en réorganisant les processus obsolètes
---

Ce workflow permet de garder l'environnement de travail léger et performant.

// turbo-all
1. Identifier les fichiers et dossiers temporaires ou non utilisés via le terminal si nécessaire.
2. Arrêter les processus Node.js "zombies" ou les processus de build en arrière-plan inactifs.
3. Rappeler au développeur de fermer les onglets IDE non pertinents à la tâche en cours pour libérer de la mémoire RAM, car le contrôle direct de l'interface VSCode depuis l'agent est restreint.
4. Si demandé, lancer un nettoyage des caches (`npm run clean` ou suppression du dossier `.next/cache` et des `node_modules/.cache`).
