"""Ajoute la photo d'un invité dans prive/donnees.json.

    python3 outils/photo.py NOM Prénom image.jpg CX CY COTE

CX, CY : centre du carré à garder, en pixels de l'image d'origine (le visage).
COTE   : côté du carré, en pixels. Le carré est réduit s'il dépasse de l'image :
         la photo est recadrée, jamais étirée.
La photo est réduite à 256 px, compressée en JPEG et rangée dans le champ « photo »
de l'invité. Elle n'est publiée en clair que pour les invités qui ont validé ;
sinon, elle reste dans la liste chiffrée. La page l'affiche en rond.
"""
import base64, io, json, sys
from PIL import Image, ImageOps

SOURCE, TAILLE = "prive/donnees.json", 256

nom, prenom, chemin = sys.argv[1], sys.argv[2], sys.argv[3]
cx, cy, cote = (int(v) for v in sys.argv[4:7])

im = ImageOps.exif_transpose(Image.open(chemin)).convert("RGB")
w, h = im.size
cote = min(cote, w, h)
x0 = min(max(cx - cote // 2, 0), w - cote)
y0 = min(max(cy - cote // 2, 0), h - cote)
carre = im.crop((x0, y0, x0 + cote, y0 + cote)).resize((TAILLE, TAILLE), Image.LANCZOS)

tampon = io.BytesIO()
carre.save(tampon, "JPEG", quality=82, optimize=True)
uri = "data:image/jpeg;base64," + base64.b64encode(tampon.getvalue()).decode()

d = json.load(open(SOURCE, encoding="utf-8"))
g = next((x for x in d["invites"] if x["nom"] == nom and x["prenom"] == prenom), None)
if not g:
    sys.exit(f"Invité introuvable : {prenom} {nom}")
g["photo"] = uri
json.dump(d, open(SOURCE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{prenom} {nom} : carré {cote}px depuis ({x0}, {y0}), {len(tampon.getvalue()) // 1024} Ko")
