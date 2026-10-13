// Protège un texte avant de l'insérer dans du HTML : < > & " ' deviennent des entités.
// Tout texte venu de content/ passe par ici, pour qu'un caractère spécial ne casse jamais la page.
export const echapper = (texte: string) =>
  texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
