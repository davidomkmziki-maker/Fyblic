# FYBLIC site V1172 — vues unifiées et statistiques

## Ordre obligatoire
1. Sauvegarder la base Supabase ; exécuter **FYBLIC_V221_COMPTEURS_UNIFIES.sql** dans le SQL Editor et vérifier qu'il se termine sans erreur.
2. Déployer **ce ZIP complet** à la racine du dépôt du **site** Netlify, à la place des fichiers existants. Ne pas le déposer dans le dépôt Android ni dans assetlinks.
3. Déployer le ZIP Android V221 sur son propre dépôt GitHub.

## Principe
- Vidéo Boutique : l'ouverture de « Voir l'annonce » et la lecture en Centrale contribuent à **un même compteur**, une seule fois par compte et par publication.
- Photo Boutique : la simple présence dans une liste ne compte pas. « Voir l'annonce » constitue l'évènement vérifié.
- Accueil : aucun 0 non vérifié n'est dessiné avant chargement ; un tiret indique une valeur en cours de lecture.
- Statistiques : agrégation groupée pour toutes les publications, vues uniques vidéo, vues photo Boutique, likes, commentaires, partages, favoris et republications.
- Attribution : premier canal (Centrale, Accueil, Boutique) et passages par canal sont enregistrés séparément du compteur unique. Ces passages ne doivent jamais être additionnés pour calculer les vues.
- Le journal V220 et la table `happyad_video_views` sont conservés. Le script réconcilie les historiques identifiables par compte.
- Sans connexion, un visiteur lit les compteurs publics mais ne crée **pas** de nouvelle vue liée à un compte.

## Contrôles dans l'application / site
1. Compte A ouvre une vidéo dans la Centrale : l'annonce vidéo et la Centrale montrent tous deux +1.
2. Compte A clique ensuite « Voir l'annonce » : les deux valeurs restent identiques, sans +1 supplémentaire.
3. Compte B clique directement « Voir l'annonce » : les deux affichent +1.
4. Compte B passe ensuite en Centrale : aucun deuxième +1.
5. Pour une annonce photo, défiler la liste n'ajoute rien ; ouvrir « Voir l'annonce » ajoute +1 uniquement la première fois pour ce compte.
6. Quitter et relancer : pas de 0 fictif dans l'accueil avant le total réel.
7. Comparer les totaux détaillés de statistiques au cumul des publications.

## Limites de vérification
Les sources Web ont été vérifiées par `node --check` et test du contrat RPC avec une réponse simulée. Sans accès à la base Supabase réelle ni SDK Android complet dans cet environnement, la migration SQL et la compilation APK ne sont pas validées de bout en bout. Les données historiques ne comportant aucun identifiant de spectateur ne peuvent pas être transformées honnêtement en « vues uniques par compte ».
