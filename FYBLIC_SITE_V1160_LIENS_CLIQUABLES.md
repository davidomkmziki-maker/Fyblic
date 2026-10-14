# FYBLIC Site V1160 — liens cliquables

Base : site V1159 sans deuxième logo de partage.

- Liens URL http(s) dans les descriptions, légendes, titres et commentaires : rendu bleu, fin, ouvrable.
- Lien associé à un texte via `[texte](https://exemple.com)` ; bouton 🔗 sur les champs de description et de commentaires concernés.
- Lien ouvert dans un nouvel onglet (`rel=noopener noreferrer`), sans exécuter de HTML fourni par l’utilisateur.
- Les badges et mentions sont conservés : seules les portions de texte brut sont converties.
- Les anciens messages sont convertis au rendu ; aucune écriture Supabase et aucun SQL.
- Toutes les fonctions d'aperçu (vraies images / grand logo / lien r22), cartes adaptatives, App Links sont laissées intactes.

**À tester après déploiement** : commentaire avec URL, publication avec URL, `[Cliquer ici](https://...)`, mention @, modification de publication, lien en story et retour à l’application depuis un navigateur externe.
