# Trombinoscope du mariage d'Arthur et Mathilde

Site statique qui présente les invités du mariage : trombinoscope filtrable, arbre généalogique et diagramme de tous les invités. Il reprend la charte graphique de la liste de mariage (`mariage-arthur-mathilde`).

## Contenu

```
index.html           Page complète (styles et logique inclus)
data/invites.js      Données générées : version publique en clair, liste complète chiffrée
outils/donnees.mjs   Script pour extraire et republier les données
CNAME                Domaine personnalisé pour GitHub Pages
prive/               Liste complète en clair, jamais publiée (exclue par .gitignore)
```

La page charge D3 depuis cdnjs pour le diagramme, et les polices Funnel Display et Mulish depuis Google Fonts.

## Public et privé

Par défaut, le site montre seulement les invités qui ont validé, sans les invitations ni l'arbre généalogique. La liste complète n'est publiée que chiffrée dans `data/invites.js` (AES-GCM, clé dérivée par PBKDF2).

## Modifier la liste des invités

1. Récupérer la liste complète en clair :
   ```
   CODE="…" node outils/donnees.mjs extraire
   ```
2. Modifier `prive/donnees.json`.
3. Régénérer les données publiées :
   ```
   CODE="…" node outils/donnees.mjs publier
   ```
4. Committer `data/invites.js` (jamais `prive/`).

`prive/donnees.json` contient :

- `invites` : une entrée par invité ;
- `tree` : l'arbre généalogique (famille directe, familles élargies, famille belge) ;
- `godlinks` : parrains et marraines ;
- `temoins` : témoins de chaque marié ;
- `horsArbre` : liens de famille affichés seulement dans les fiches.

Champs d'un invité :

| Champ | Rôle |
|---|---|
| `nom`, `prenom` | Identité. Les initiales servent tant qu'il n'y a pas de photo. |
| `pronom` | `il` ou `elle`. Sert à accorder les termes (cousin, cousine, accompagnant…). |
| `cote` | `Arthur` ou `Mathilde` |
| `lien` | `Famille proche` (affiché « Famille directe »), `Famille éloignée` (« Famille élargie »), `Ami proche`, `Copains`, `Travail`, `Autre` (amis et travail sont regroupés en « Amis »), `Prestataire` (métier dans `groupe` ; visible seulement en privé, hors chiffres, arbre et diagramme) |
| `groupe` | Bande d'amis (ENSAT, EKIP, Travail, Vieux…) |
| `ev` | Invitations : `mairie`, `eglise`, `vin`, `repas`, `brunch` |
| `plus1` | `true` si la personne peut venir accompagnée |
| `plusOneOf` | Pour un accompagnant nommé : `id` de la personne accompagnée. Il en reprend les invitations. |
| `evOverride` | Exception pour un accompagnant, par exemple `{"repas": false}` |
| `naissance` | `AAAA-MM-JJ`, ou `AAAA` si seule l'année est connue. Un `X` dans l'année (`197X`) donne une fourchette d'âge. |
| `valide` | `true` quand la personne a confirmé sa venue. Sinon, elle n'apparaît pas sur le site public. |

Pour un refus, il suffit de retirer la ligne de l'invité.

## Photos

```
python3 outils/photo.py NOM Prénom image.jpg CX CY COTE [--couleurs[=FORCE]]
CODE="…" node outils/donnees.mjs publier
```

`CX`, `CY` : centre du visage dans l'image d'origine, en pixels ; `COTE` : côté du carré à garder. La photo est recadrée en carré sans être étirée, réduite à 256 px et rangée dans `prive/donnees.json`. La page l'affiche en rond. `--couleurs` corrige une dominante (photo trop rose ou trop rouge) ; `FORCE` va de 0 à 1 (0.85 par défaut), à baisser si la photo devient trop froide. Elle n'est publiée en clair que pour les invités qui ont validé.

## Mise en ligne

1. GitHub, Settings, Pages : source « Deploy from a branch », branche de publication, dossier `/`.
2. Le fichier `CNAME` déclare `trombinoscope.mariage.carpentier-tauveron.fr`.
3. Chez OVH, dans la zone DNS de `carpentier-tauveron.fr`, ajouter un enregistrement `CNAME` : sous-domaine `trombinoscope.mariage`, cible `arthur-carpentier.github.io.`
4. Une fois le certificat émis par GitHub, cocher « Enforce HTTPS ».
