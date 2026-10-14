# FYBLIC SITE V1165 — Reprise TUS et annulation réelle (14 octobre 2026)

**Périmètre : site Web uniquement.** APK V207, assets de partage, bases SQL, schémas et fichiers médias existants inchangés. Pas de migration SQL nécessaire pour ce correctif front-end.

## Défauts vérifiés dans V1164

1. Après rechargement, la surveillance repartait sur une valeur locale fixe de **45 %**, sans confirmation de l'offset réel TUS.
2. L'objet `FYBLIC_ACTIVE_PUBLICATION_V1067R1` était réécrit par le module de publication sans `children`, empêchant le suivi correct des travaux existants.
3. Le X de la barre d'accueil masquait la progression sans interrompre la transmission, et la modale du formulaire ne proposait pas de X.
4. Le navigateur ne traitait que **3 reprises PATCH**, contre **12** dans l'application Android V207.
5. La gestion des erreurs HEAD/PATCH ne distinguait pas assez explicitement un refus HTTP, une erreur réseau et un défaut d'exposition CORS des en-têtes `Upload-Offset`.
6. Le bouton Publier, après un rechargement, risquait d'attribuer un nouvel identifiant au lieu de réutiliser la même tâche distante.

## Corrections

- 0 % est affiché au début, jusqu'à la confirmation de vrais octets transmis.
- Comparaison `Upload-Offset` / taille totale ; aucun PATCH à un offset deviné ; reprise jusqu'à 12 essais, avec HEAD de réconciliation après erreur PATCH.
- POST `/complete` peut être relancé après vérification du travail existant. Après actualisation, si HEAD confirme que tous les octets sont déjà reçus, le navigateur tente **uniquement** la finalisation, sans réenvoyer le média.
- Plan de reprise conservant les ID et fingerprint de chaque élément, limité à 48 h. Pour les médias jusqu'à 32 Mio au total, copie facultative IndexedDB pour reprise automatique ; sinon resélection manuelle des **mêmes médias** depuis Publication pour retrouver le même postId.
- X dans la barre d'accueil et dans la fenêtre de publication : arrêt de XHR en cours, demande d'annulation au worker pour tâches encore `uploading`. Pas d'appel de suppression directe à Supabase. Les médias déjà `primary_ready` / publiés ne sont pas ciblés par le client.
- Distinction `paused` (fichier absent, transfert interrompu) / `failed` / `published` ; pas de faux 45 % après actualisation.
- Versions des ressources et Service Worker actualisées pour réduire les risques de cache périmé.

## Vérification réseau indispensable en production

Un navigateur impose **CORS**, contrairement à l'application Android native. Le serveur TUS / Supabase doit répondre aux prévols `OPTIONS` (lorsqu'applicables) et autoriser `HEAD`, `PATCH`, `Tus-Resumable`, `Upload-Offset`, `Content-Type`, `Authorization` et `apikey`. `Access-Control-Expose-Headers` doit exposer `Upload-Offset` pour que JavaScript puisse lire la position. Le `HEAD` doit répondre avec l'offset, le `PATCH` avec l'offset confirmé ; la finalisation passe par `/api/v2/publications/{id}/complete`.

Ces en-têtes ne peuvent pas être réparés depuis le JavaScript du site. Le ZIP **ne contient pas le code du worker Railway**. Son endpoint `/cancel` et ses éventuelles politiques de purge des uploads partiels n'ont pas pu être audités. Ne pas exécuter de nettoyage SQL manuel ou de suppression des objets Supabase en se basant uniquement sur un 1 % / 45 %.

Pour diagnostiquer une erreur après déploiement : depuis un navigateur, ouvrir Outils développeur > Réseau, filtrer `HEAD`, `PATCH`, `OPTIONS`, `/api/v2/publications` et `/complete`, et noter **code HTTP, méthode, réponse et présence des en-têtes**. Ne pas partager de jetons Authorization/API secrets.

## Commandes Termux — dépôt du site existant

```bash
termux-setup-storage
pkg install unzip git -y
cd ~/fyblic-site   # Remplacer par le VRAI chemin de votre dépôt Git du site
unzip -oq "$HOME/storage/downloads/FYBLIC_SITE_V1165_TUS_REPRISE_ANNULATION.zip" -d .
git add -A
git commit -m "Fyblic site V1165 reprise TUS, X annulation et progression réelle"
git push
```

L'archive est construite à **racine du site** (`index.html`, `core/`, `modules/`, `netlify/`, etc.), sans dossier enveloppe. Ne pas déployer ce ZIP dans le dépôt Android.

## Essais hors production réalisés

Tests JavaScript simulés (sans authentifiants ni service réel) : petite photo publiée et finalisée ; HEAD/CORS refusé sans PATCH aveugle ; reprise avec le même ID après resélection ; X interrompt PATCH et empêche `/complete` ; rechargement avec 100 % des octets déjà reçus finalisé sans retransfert ; rechargement sans fichier indique 0 % et « interrompu » plutôt que 45 %. Syntaxe JavaScript vérifiée avec Node.js 22.

**Limite :** la correction du refus réseau exact et la réussite réelle des publications doivent être contrôlées une fois le site déployé, en examinant le worker et le réseau du navigateur.
