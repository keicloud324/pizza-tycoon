export const F = {
  d: `"Playfair Display","Georgia",serif`,
  b: `"DotGothic16","Courier New",monospace`,
  h: `"Caveat",cursive`,
};

export const V = {
  terra: "#C0542F", terraDk: "#8B3A1F",
  oil: "#B8860B", oilLt: "#DAA520",
  basil: "#3A7D44", basilDk: "#2A5E32",
  esp: "#3C1F0E", mozz: "#FDF6EC",
  flour: "#F5E6D0",
  walnut: "#5C3A21", walnutDk: "#3D2314",
  oak: "#A07840", birch: "#D4A76A",
  tomato: "#D4392B",
  night: "#1A1030", dusk: "#2A1845",
  moon: "#E8D0FF", grape: "#9B59B6",
};

export const FS = {
  micro: 10,
  caption: 12,
  body: 14,
  heading: 17,
  button: 14,
};

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
