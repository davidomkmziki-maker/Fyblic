# FYBLIC SITE V1156 — VIDEO PREVIEW JSON

Le navigateur demande désormais au worker une réponse JSON contenant un JPEG data URL. Deux transports sont essayés (fetch puis XMLHttpRequest) avant d’afficher le fallback texte. APK non modifiée.


## V1156 — aperçu vidéo Web lisible
Le poster serveur reste immédiat; pour les vidéos que le navigateur ne décode pas, le worker prépare en arrière-plan un proxy MP4 H.264 temporaire et le site bascule dessus sans perdre le poster. Le retour vers Publication réhydrate le même aperçu au lieu de repartir sur un lecteur noir.
