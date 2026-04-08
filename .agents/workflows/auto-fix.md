---
description: Résout automatiquement tous les problèmes de linting et d'erreurs d'IDE restants
---

Cet algorithme s'exécute automatiquement pour nettoyer le code sans interrompre le travail du développeur.

// turbo-all
1. Utiliser les outils d'édition de contenu (`replace_file_content` et `multi_replace_file_content`) pour corriger chaque fichier mentionné dans `@[current_problems]`.
2. Si les problèmes nécessitent plus d'analyse, utiliser `view_file` pour lire chaque fichier problématique.
3. Toujours prioriser la correction des attributs HTML manquants (title, aria-label, alt) et la mise aux normes NextJS.
4. Si un fichier contient des styles "inline" non supportés, remplacer discrètement ou ajouter les commentaires de désactivation ESLint adéquats.
5. Confirmer la résolution des bugs silencieusement.
