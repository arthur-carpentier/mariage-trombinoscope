# Trombinoscope du mariage d'Arthur et Mathilde

Site statique qui présente les invités du mariage : trombinoscope filtrable, arbre généalogique et diagramme de tous les invités. Il reprend la charte graphique de la liste de mariage (`mariage-arthur-mathilde`).

## Contenu

```
index.html        Page complète (styles et logique inclus)
data/invites.js   Liste des invités
CNAME             Domaine personnalisé pour GitHub Pages
```

La page charge D3 depuis cdnjs pour le diagramme, et les polices Funnel Display et Mulish depuis Google Fonts.

## Modifier la liste des invités

Tout se fait dans `data/invites.js`, une ligne par invité :

| Champ | Rôle |
|---|---|
| `nom`, `prenom` | Identité. Les initiales servent tant qu'il n'y a pas de photo. |
| `cote` | `Arthur` ou `Mathilde` |
| `lien` | `Famille proche`, `Famille éloignée`, `Ami proche`, `Copains`, `Travail`, `Autre` (les trois amis/travail sont regroupés en « Amis ») |
| `groupe` | Bande d'amis (ENSAT, EKIP, Travail…) |
| `ev` | Invitations : `mairie`, `eglise`, `vin`, `repas`, `brunch` |
| `plus1` | `true` si la personne peut venir accompagnée |
| `plusOneOf` | Pour un +1 nommé : `id` de la personne accompagnée. Il en reprend les invitations. |
| `evOverride` | Exception pour un +1, par exemple `{"repas": false}` |
| `naissance` | `AAAA-MM-JJ`. Un `X` dans l'année (`197X`) donne une fourchette d'âge. |
| `valide` | `true` quand la personne a confirmé sa venue. Sinon, elle apparaît grisée. |

Les liens de parenté, parrainages et témoins sont décrits dans `index.html` (constantes `TREE`, `GODLINKS`, `TEMOINS`, `FAMILLES_HORS_ARBRE`).

Pour un refus, il suffit de retirer la ligne de l'invité.

## Mise en ligne

1. GitHub, Settings, Pages : source « Deploy from a branch », branche de publication, dossier `/`.
2. Le fichier `CNAME` déclare `trombinoscope.mariage.carpentier-tauveron.fr`.
3. Chez OVH, dans la zone DNS de `carpentier-tauveron.fr`, ajouter un enregistrement `CNAME` : sous-domaine `trombinoscope.mariage`, cible `arthur-carpentier.github.io.`
4. Une fois le certificat émis par GitHub, cocher « Enforce HTTPS ».
