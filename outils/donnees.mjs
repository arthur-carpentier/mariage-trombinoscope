// Gestion des données du trombinoscope.
//
//   node outils/donnees.mjs extraire   déchiffre data/invites.js vers prive/donnees.json (liste complète, à éditer)
//   node outils/donnees.mjs publier    régénère data/invites.js depuis prive/donnees.json
//
// Le code est passé par la variable d'environnement CODE :
//   CODE="…" node outils/donnees.mjs publier
//
// data/invites.js contient deux parties :
//   PUBLIC_DATA  : en clair, seulement les invités qui ont validé et ce que le site public affiche ;
//   PRIVATE_DATA : la liste complète, chiffrée (AES-GCM, clé dérivée du code par PBKDF2).
// prive/ est exclu du dépôt (.gitignore) : la liste complète n'y est jamais publiée en clair.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const SOURCE = "prive/donnees.json", CIBLE = "data/invites.js", ITERATIONS = 250000;
const code = process.env.CODE;
if (!code) { console.error("Variable CODE manquante."); process.exit(1); }

const b64 = buf => Buffer.from(buf).toString("base64");
const unb64 = s => new Uint8Array(Buffer.from(s, "base64"));
async function cle(sel) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sel, iterations: ITERATIONS, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function chiffrer(texte) {
  const sel = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await cle(sel), new TextEncoder().encode(texte));
  return [b64(sel), b64(iv), b64(ct)].join(".");
}
async function dechiffrer(paquet) {
  const [sel, iv, ct] = paquet.split(".").map(unb64);
  const clair = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await cle(sel), ct);
  return new TextDecoder().decode(clair);
}

// version publique : invités validés, sans invitations ni accompagnants à confirmer
function versionPublique(d) {
  const ok = new Set(d.invites.filter(g => g.valide).map(g => `${g.nom}|${g.prenom}`));
  const valide = ref => ref && ok.has(ref.join("|"));
  const garder = ["id", "nom", "prenom", "groupe", "cote", "lien", "pronom", "valide", "plusOneOf", "naissance", "photo"];
  const invites = d.invites.filter(g => g.valide).map(g => {
    const x = Object.fromEntries(garder.filter(k => g[k] !== undefined).map(k => [k, g[k]]));
    return { ...x, ev: {} };
  });
  // arbre : on ne garde que les personnes validées (et la structure qui les relie)
  const elaguer = u => {
    const kids = (u.kids || []).map(elaguer).filter(Boolean);
    const p = valide(u.p) ? u.p : undefined, sp = valide(u.sp) ? u.sp : undefined;
    if (!p && !sp && !kids.length) return null;
    const { link, label, ...reste } = u;
    return { ...reste, p, sp, kids };
  };
  const tree = d.tree.map(t => ({ ...t, unit: elaguer(t.unit) })).filter(t => t.unit);
  return {
    invites, tree,
    godlinks: d.godlinks.filter(([a, b]) => valide(a) && valide(b)),
    temoins: Object.fromEntries(Object.entries(d.temoins).map(([k, v]) => [k, v.filter(valide)])),
    horsArbre: [],
  };
}

const commande = process.argv[2];
if (commande === "publier") {
  const d = JSON.parse(readFileSync(SOURCE, "utf8"));
  const pub = versionPublique(d), prive = await chiffrer(JSON.stringify(d));
  writeFileSync(CIBLE, `// Généré par outils/donnees.mjs à partir de prive/donnees.json : ne pas modifier à la main.
// PUBLIC_DATA : invités qui ont validé (site public). PRIVATE_DATA : liste complète chiffrée.
const PUBLIC_DATA = ${JSON.stringify(pub)};
const PRIVATE_DATA = "${prive}";
`);
  console.log(`${CIBLE} : ${pub.invites.length} invités publics, ${d.invites.length} dans la liste chiffrée.`);
} else if (commande === "extraire") {
  const src = readFileSync(CIBLE, "utf8"), paquet = src.match(/PRIVATE_DATA = "([^"]+)"/)[1];
  let clair;
  try { clair = await dechiffrer(paquet); } catch (e) { console.error("Code incorrect."); process.exit(1); }
  mkdirSync("prive", { recursive: true });
  writeFileSync(SOURCE, JSON.stringify(JSON.parse(clair), null, 1));
  console.log(`${SOURCE} écrit.`);
} else {
  console.error("Commande : publier ou extraire");
  process.exit(1);
}
