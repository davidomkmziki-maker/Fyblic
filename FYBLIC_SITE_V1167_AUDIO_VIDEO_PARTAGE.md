# Fyblic Site V1167 — son unique lors de l’ouverture d’une vidéo partagée

- Ferme les lecteurs audio/video en arrière-plan avant d'ouvrir un lien de vidéo partagé depuis une app externe ou depuis un message.
- Confirme le lecteur autorisé au parent après lecture dans la Centrale vidéo; les autres frames sont mises en pause sans détruire leur état.
- Pendant le démarrage d'un lien partagé, une vidéo déjà lancée ou en cours de démarrage n'est pas relancée par les callbacks concurrents.
- Supprime les trois démarrages différés de la même vidéo dans le chemin autoplay d'un lien partagé (conserve le chemin historique pour les autres vidéos).
- Application Android V207, worker Railway V1159, SQL et circuit TUS du site V1166 : inchangés.

## Vérifications après Netlify
1. Ouvrir un lien de vidéo partagée depuis WhatsApp ou autre application; le son ne doit plus doubler.
2. Revenir en arrière et rejouer la vidéo; pause/lecture manuelle normale.
3. Tester une vidéo dans l'accueil et un scroll en Centrale vidéo : comportement conservé.
4. Tester une photo partagée et une publication via le site : changements non ciblés.

Cette correction a été contrôlée statiquement et en tests simulés, pas encore en production.
