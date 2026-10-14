# FYBLIC Site V1168 — Audio unique des vidéos et navigation depuis carte partagée

- La Centrale vidéo ne permet plus de jouer une vidéo non sélectionnée.
- Sur le premier évènement de scroll, toutes les pistes vidéo précédentes sont pausées et rendues muettes immédiatement (sans délai).
- Au changement effectif de publication, le lecteur de la carte précédente est détruit (src retirée puis DOM vidéo retiré), tout en conservant la carte et son poster pour un éventuel retour.
- Si l’on revient à l’ancienne vidéo, le site instancie un nouveau lecteur propre.
- Les résultats différés de chargement/lecture sont invalidés par un compteur de génération et ne peuvent relancer la vidéo précédente.
- Le son unique et la pause des autres onglets/frames restent actifs après la première vidéo partagée ; plus de limitation à 30 secondes ou au post initial.
- La préparation des lecteurs adjacents est désactivée dans le parcours ouvert par carte partagée, pour ne pas recréer le lecteur précédent.
- Les autres systèmes (publication TUS V1166, application Android V207, worker V1159, Supabase SQL) ne sont pas modifiés.

## Vérification Netlify
Ouvrir un lien vidéo partagé > écouter > swiper vers prochaine > revenir à la précédente > vérifier l’absence de son fantôme, puis relancer ; vérifier également ouverture vidéo depuis Accueil et lecture simple dans Centrale.

Les essais automatiques sont simulés et statiques. Un test réel sur fyblic.com reste nécessaire.
