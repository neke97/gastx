/** Íconos (emoji) para categorías. */

/** Set de emojis para elegir al crear/editar una categoría. */
export const CATEGORY_EMOJIS = [
  "🍔", "🛒", "🍕", "☕", "🍺", "🚌", "🚗", "⛽", "🚕", "✈️",
  "🏠", "🔌", "💡", "🚿", "🧹", "🏥", "💊", "🩺", "🎉", "🎬",
  "🎮", "🎵", "🛍️", "👕", "🎓", "📚", "💼", "🏋️", "🐶", "🎁",
  "📱", "🌐", "📶", "💳", "🧾", "🏦", "💰", "💵", "➕", "📦",
];

/** Mapa de los nombres viejos (lucide) del seed inicial a emoji. */
const LEGACY_ICON_MAP: Record<string, string> = {
  wallet: "💰",
  "plus-circle": "➕",
  utensils: "🍔",
  bus: "🚌",
  home: "🏠",
  plug: "🔌",
  "heart-pulse": "🏥",
  "party-popper": "🎉",
  "shopping-bag": "🛍️",
  "graduation-cap": "🎓",
  ellipsis: "📦",
};

/** Devuelve el emoji a mostrar: mapea nombres viejos, o usa el emoji tal cual. */
export function categoryIcon(icon: string | null | undefined): string {
  if (!icon) return "📦";
  return LEGACY_ICON_MAP[icon] ?? icon;
}
