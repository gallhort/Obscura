# Maison Obscura

Site fictif de démonstration (portfolio) pour un restaurant gastronomique **dans le noir**, à Paris. Marque, adresse et contenus sont inventés.

## Concept

Le site reproduit l'expérience du restaurant : la page est plongée dans l'obscurité et on la découvre **à la lumière d'une lampe**. Le curseur (ou le doigt sur mobile) est une torche qui révèle le contenu autour de lui. Un bouton « Allumer la lumière » bascule vers un mode clair lisible.

Pages : accueil, menu dégustation (5 services), l'expérience, réservation (formulaire avec validation), contact.

## Choix de design

- **Palette** : noir profond `#07060a`, halos ambrés `#ffb347`, blanc chaud `#f6ead6`. Le mode clair (crème `#f7efe1`, ambre foncé `#8a4a00`) garde des contrastes AA.
- **Typographie** : Cormorant Garamond (titres, serif éditorial) + Inter (texte). Deux familles, `font-display: swap`.
- **Torche** : un voile noir fixe, percé d'un dégradé radial (`--tx`, `--ty`, `--tr`) piloté en JS. Elle s'allume progressivement, vacille comme une flamme et se promène seule tant qu'on ne l'a pas saisie. Au clavier, elle suit le focus. Le voile est purement visuel (`aria-hidden`, `pointer-events: none`) : le contenu reste intégralement accessible aux lecteurs d'écran.
- **Animations** : « mise au point » du contenu au défilement (IntersectionObserver, flou → net), halos qui respirent, goutte du scroll-cue. Tout est désactivé par `prefers-reduced-motion` (la torche suit alors simplement le pointeur, sans vacillement).
- **Ambiance sonore** : synthétisée avec la Web Audio API (souffle de salle, nappe grave, tintements de verre). **Désactivée par défaut**, aucun fichier audio.
- **Visuels** : tout est en SVG/CSS (icônes de plats, plan du quartier, favicon). Seule l'image Open Graph (`og.png`, 1200×630) est un raster.
- **CSS moderne** : variables, grid, `clamp()`, `color-mix()`, container queries (cartes de plats).
- **Formulaires** : validation front (date ouverte du mardi au samedi, e-mail, téléphone FR, consentement…), messages d'erreur liés par `aria-describedby`, résumé d'erreurs avec liens vers les champs, estimation du prix en direct. Rien n'est envoyé : c'est une démonstration.

## Structure

```
index.html  menu.html  experience.html  reservation.html  contact.html
assets/
  css/styles.css     tokens, composants, torche, animations
  js/main.js         torche, mode clair, navigation, révélations, son
  js/forms.js        validation réservation et contact
  img/favicon.svg    favicon
  img/og.png         image de partage
```

## Lancer

Aucune build : ouvrez `index.html` en double-cliquant, ou copiez le dossier dans `htdocs` (XAMPP) et visitez `http://localhost/obscura/`. Les polices viennent de Google Fonts ; hors ligne, des polices serif/sans système prennent le relais.

## Accessibilité et performance

Lien d'évitement, `aria-current`, focus visible, navigation clavier complète (menu mobile fermé par Échap), contrastes AA vérifiés dans les deux modes, hiérarchie de titres, `<details>` pour la FAQ. Pas d'image lourde, aucune dépendance, JS en `defer`, seules les propriétés du voile sont mises à jour à chaque frame, et la boucle s'arrête en mode clair ou onglet masqué.
