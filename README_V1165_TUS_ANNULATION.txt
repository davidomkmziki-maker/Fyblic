FYBLIC SITE V1165 — CORRECTION TRANSFERT TUS + X ANNULER
Date : 14 octobre 2026
Source : FYBLIC_SITE_V1164_PUBLICATION_WEB_CORRIGEE.zip
Application V207 : INCHANGEE

Fichiers fonctionnels corrigés :
- core/publication-engine-v1082.js
  * HEAD TUS initial réessayé avec limites et indication d'erreur réelle
  * PATCH en morceaux : 12 reprises maximum après réconciliation HEAD
  * Renouvellement de session pour réponses 401/403
  * Aucune reprise avec un offset inconnu
  * Progression d'envoi fondée sur les octets confirmés par Upload-Offset
  * Mécanisme cancelGroup : arrêt XHR, arrêt des temporisations, annulation des jobs enfants par /api/v2/publications/:id/cancel
  * Aucun appel de suppression de post déjà publié
  * Réouverture sans fichier local : ne jamais prétendre à 45 % ; demande de réinitialisation propre de l'envoi
  * Quand tous les octets sont déjà arrivés et connus, tentative de finalisation /complete
- core/publication-background-ui-v2.js
  * X n'est plus 'masquer'. Le bouton stoppe l'envoi et demande l'annulation côté Railway.
  * Erreur persistante si annulation non confirmée ; X peut être retenté.
- modules/publish.html
  * Progression initiale 0 % tant qu'aucun octet n'est confirmé.
  * Rafraîchissement du cache moteur et traitement d'annulation sans erreur trompeuse.
- index.html, service-worker.js
  * Scripts de version V1165, mise à jour cache PWA.

Vérifications synthétiques faites avec un faux serveur HTTP, sans accès au compte réel :
- HEAD initial 503 deux fois puis succès : publication 1 photo terminée ; OK
- Annulation pendant le PATCH : PATCH interrompu, route cancel appelée, pas de /complete ; OK
- Refus serveur de cancel : affichage d'erreur, aucune suppression prétendue ; OK
- Groupe de 2 médias : deux demandes cancel, pas de /complete ; OK
- Vérification syntaxique JS des fichiers modifiés : OK.

LIMITATIONS IMPORTANTES :
1. Le worker Railway n'est PAS inclus dans les ZIP fournis. Ce site demande
   l'annulation par l'API préexistante /api/v2/publications/:id/cancel ; seul
   le worker peut confirmer/supprimer physiquement les médias déjà stockés.
2. La suppression physique des uploads TUS incomplets n'est donc PAS prouvée
   par ces tests : elle dépend de l'implémentation de /cancel côté Railway.
3. Il faut vérifier une publication photo sur le vrai site et consulter les
   requêtes HEAD/PATCH si le navigateur renvoie encore CORS/401/403.
4. Une actualisation efface le File du navigateur ; la reprise des octets
   n'est pas possible sans le sélectionner à nouveau, même si le job existe.
5. Aucune modification du schéma Supabase/worker ; pas de purge 48 heures ajoutée.

Le ZIP est organisé à la racine du SITE pour déploiement direct dans le
répertoire de travail de votre dépôt GIT ou sur Netlify.
