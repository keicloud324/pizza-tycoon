/* ─── 画像パス定数 ─── */

const EMOTE = "/image/kenney_emotes-pack/PNG/Vector/Style 4";
const FOOD  = "/image/kenney_food-kit/Previews";
const UI    = "/image/kenney_ui-pack/PNG";
const SE    = "/image/kenney_ui-pack/Sounds";

/* ── Emotes（お客の吹き出し用） ── */
export const EMO = {
  question:     `${EMOTE}/emote_question.png`,
  dots:         `${EMOTE}/emote_dots3.png`,
  exclamation:  `${EMOTE}/emote_exclamation.png`,
  anger:        `${EMOTE}/emote_anger.png`,
  faceHappy:    `${EMOTE}/emote_faceHappy.png`,
  faceSad:      `${EMOTE}/emote_faceSad.png`,
  faceAngry:    `${EMOTE}/emote_faceAngry.png`,
  heart:        `${EMOTE}/emote_heart.png`,
  stars:        `${EMOTE}/emote_stars.png`,
  cash:         `${EMOTE}/emote_cash.png`,
  music:        `${EMOTE}/emote_music.png`,
  idea:         `${EMOTE}/emote_idea.png`,
  cloud:        `${EMOTE}/emote_cloud.png`,
  laugh:        `${EMOTE}/emote_laugh.png`,
};

/* ── 食材画像 ── */
const SVG = "/image"; // 自作SVGアイコン
export const FD = {
  tomato:       `${FOOD}/tomato.png`,
  tomatoSlice:  `${FOOD}/tomato-slice.png`,
  cherryTomato: `${SVG}/cherry-tomato.svg`,
  cheese:       `${FOOD}/cheese.png`,
  cheeseCut:    `${FOOD}/cheese-cut.png`,
  mushroom:     `${FOOD}/mushroom.png`,
  mushroomHalf: `${FOOD}/mushroom-half.png`,
  sausage:      `${FOOD}/meat-sausage.png`,
  sausageHalf:  `${FOOD}/sausage-half.png`,
  fish:         `${FOOD}/fish.png`,
  oil:          `${FOOD}/bottle-oil.png`,
  honey:        `${FOOD}/honey.png`,
  loaf:         `${FOOD}/loaf-round.png`,
  bag:          `${FOOD}/bag.png`,
  basil:        `${SVG}/basil.svg`,
  olive:        `${SVG}/olive.svg`,
  pizza:        `${FOOD}/pizza.png`,
  cuttingBoard: `${FOOD}/cutting-board.png`,
  knife:        `${FOOD}/cooking-knife.png`,
  spoon:        `${FOOD}/cooking-spoon.png`,
  plate:        `${FOOD}/plate.png`,
};

/* ── 食材ID → 画像マッピング ── */
export const FOOD_IMG = {
  tomato:      FD.tomato,
  basil_i:     FD.basil,
  mozz_block:  FD.cheese,
  flour_bag:   FD.loaf,
  salami_log:  FD.sausage,
  shrimp_pack: null, // エビは絵文字🦐のまま
  olive_jar:   FD.olive,
};

/* ── 食材ID → カット後画像マッピング ── */
export const FOOD_CUT_IMG = {
  mozz_block:  FD.cheeseCut,
  salami_log:  FD.sausage,
  shrimp_pack: FD.fish,
  olive_jar:   FD.oil,
};

/* ── トッピングID → 画像マッピング（調理画面用） ── */
export const TOPPING_IMG = {
  basil:    FD.basil,
  salami:   FD.sausage,
  olive:    FD.olive,
  mushroom: FD.mushroomHalf,
  shrimp:   null, // エビは絵文字🦐のまま
  tomato_s: FD.cherryTomato,
  anchovy:  null, // 絵文字のまま
  honey:    FD.honey,
};

/* ── UI画像 ── */
export const UI_IMG = {
  starFull:    `${UI}/Yellow/Default/star.png`,
  starEmpty:   `${UI}/Grey/Default/star_outline.png`,
  checkOn:     `${UI}/Green/Default/check_round_color.png`,
  checkOff:    `${UI}/Grey/Default/check_round_grey.png`,
};

/* ── SE (Kenney) ── */
export const SFX = {
  click:   `${SE}/click-a.ogg`,
  select:  `${SE}/click-b.ogg`,
  tap:     `${SE}/tap-a.ogg`,
  toggle:  `${SE}/switch-a.ogg`,
};

/* ── SE (効果音ラボ) #143 ── */
const SFX_LAB = "/se";
export const SFX2 = {
  ovenIn:    `${SFX_LAB}/ガスコンロ点火.mp3`,
  knifecut:  `${SFX_LAB}/包丁で切る1.mp3`,
  knifeFast: `${SFX_LAB}/包丁で切る3.mp3`,
  serve:     `${SFX_LAB}/コーヒーのソーサーを置く.mp3`,
  cashCount: `${SFX_LAB}/金額表示.mp3`,
  fanfare:   `${SFX_LAB}/ラッパのファンファーレ.mp3`,
  tada:      `${SFX_LAB}/ジャジャーン.mp3`,
  // #143: 追加SE
  levelUp:   `/audio/ミニファンファーレ.mp3`,
  trophy:    `${SFX_LAB}/ラッパのファンファーレ.mp3`,
  fail:      `${SFX_LAB}/ジャジャーン.mp3`, // 失敗SE（curse-melody未配置のため代用）
};

/* ── お客のstate別emote画像マッピング ── */
export const CUST_EMOTE = {
  approach:         null,
  waiting_outside:  EMO.dots,
  seat:             null,
  order:            EMO.dots,
  wait:             EMO.exclamation,
  wait_angry:       EMO.anger,       // patience < 30%
  eat:              EMO.music,
  eat_low:          null,
  pay:              EMO.cash,
  leave_happy:      EMO.stars,
  leave_sad:        EMO.faceAngry,
  gone:             null,
  // reactions on serve
  serve_high:       EMO.faceHappy,
  serve_mid:        EMO.heart,
  serve_low:        null,            // 無言で退店
};
