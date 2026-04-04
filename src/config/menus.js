/* #138: プレイヤー設定価格 or デフォルト価格を返す */
export function getMenuPrice(menu, menuPrices) {
  return menuPrices?.[menu.id] ?? menu.price;
}

export const DEFAULT_MENUS = [
  { id: 1, name: "マルゲリータ",   price: 1200, cost: 480, tops: ["🧀", "🌿", "🧀", "🌿", "🧀"], sc: "#D4392B",
    recipe: { sauce: "tomato", cheese: { mozzarella: 3 }, toppings: { basil: 3 } } },
  { id: 2, name: "サラミピッツァ", price: 1300, cost: 520, tops: ["🧀", "🔴", "🫒", "🧀", "🔴"], sc: "#D4392B",
    recipe: { sauce: "tomato", cheese: { mozzarella: 2 }, toppings: { salami: 4, olive: 2 } } },
];
