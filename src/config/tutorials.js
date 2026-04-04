/* #145: Day1 チュートリアルポップアップ定義 */
export const TUTORIALS = {
  // ── マルシェ ──
  marche_welcome: {
    mode: "modal", phase: "marche", day: 1,
    title: "マルシェへようこそ！",
    icon: "🛒",
    body: "ここで今日使う食材を買います。\n\n💡 今日の予想来客数: 2〜3人\n\nまずはこれを買ってみよう:\n🍅 トマト ×9（ソース3食分）\n🧀 モッツァレラ ×1\n🌿 バジル ×1\n\n食材をタップしてカゴに入れてね！",
    btn: "OK!",
  },
  marche_done: {
    mode: "modal", phase: "marche", day: 1, trigger: "marche_complete",
    title: "いい買い物！",
    icon: "👍",
    body: "次は買った食材を仕込もう！",
    btn: "仕込みへ!",
  },

  // ── 仕込み ──
  prep_intro: {
    mode: "modal", phase: "prep", day: 1,
    title: "仕込みの時間だよ！",
    icon: "🔪",
    body: "買った食材をピザ用に準備しよう。\n\n💡 やること:\n・生地をこねる\n・トマトソースを作る\n・チーズをカットする\n\nまずは「生地＆ソース＆チーズ」を開いてみよう👇",
    btn: "OK!",
  },
  prep_dough_done: {
    mode: "hint", phase: "prep", day: 1, trigger: "first_dough",
    body: "🫓 生地3枚OK！今日は3枚のピザが作れるよ",
  },
  prep_sauce_done: {
    mode: "hint", phase: "prep", day: 1, trigger: "first_sauce",
    body: "🍅 ソースOK！ピザの土台ができたね",
  },
  prep_cut_open: {
    mode: "hint", phase: "prep", day: 1, trigger: "first_cut",
    body: "🔪 トッピングは事前にカットしておくと営業中がスムーズ！",
  },
  prep_zero_warn: {
    mode: "modal", phase: "prep", day: 1, trigger: "prep_zero",
    title: "まだ何も仕込んでないよ！",
    icon: "⚠️",
    body: "生地とソースがないとピザが作れません。\n仕込んでから営業を始めよう！",
    btn: "戻る",
  },

  // ── 営業 ──
  ops_welcome: {
    mode: "modal", phase: "ops", day: 1,
    title: "営業開始！",
    icon: "🏪",
    body: "お客さんが来たらピザを作って提供しよう！\n\n💡 流れ:\n① お客さんの注文をタップ\n② ソース → チーズ → トッピング を乗せる\n③ 窯に入れて焼く\n④ いい感じに焼けたら取り出してカット\n⑤ お客さんに提供！\n\n⏰ 営業時間: 11:00〜20:00\n最初のお客さんは10秒後に来るよ！",
    btn: "がんばる!",
  },
  ops_first_customer: {
    mode: "hint", phase: "ops", day: 1, trigger: "first_customer",
    body: "👋 お客さんが来たよ！注文をタップして調理を始めよう",
  },
  ops_cooking_intro: {
    mode: "modal", phase: "ops", day: 1, trigger: "first_cooking",
    title: "ピザを作ろう！",
    icon: "🍕",
    body: "ステップを順番にやっていこう:\n① ピザ生地をタップ → ソースを塗る\n② チーズを乗せる\n③ トッピングを選んで配置\n④ 窯に入れるボタンを押す\n⑤ いい香りがしたら取り出す\n⑥ カットして完成！",
    btn: "やってみる!",
  },
  ops_first_bake: {
    mode: "hint", phase: "ops", day: 1, trigger: "first_bake",
    body: "🔥 焼き加減に注目！テキストの変化を見て、いいタイミングで取り出そう。焼きすぎると焦げちゃうよ！",
  },
  ops_first_serve: {
    mode: "modal", phase: "ops", day: 1, trigger: "first_serve",
    title: "初めてのピザ、お疲れさま！",
    icon: "🎉",
    body: "お客さんの ★評価 を見てみよう。\n★が多いほど満足してくれたということ！\n\n💡 評価のポイント:\n・焼き加減（一番大事！）\n・トッピングの丁寧さ\n・待たせなかったか",
    btn: "OK!",
  },

  // ── 振り返り ──
  night_review: {
    mode: "modal", phase: "night", day: 1,
    title: "お疲れさま！今日の成績を振り返ろう。",
    icon: "🌙",
    body: "💡 チェックポイント:\n・売上: 今日いくら稼いだか\n・口コミ: お客さんの平均満足度\n・ランキング: 他のお店と比べた順位\n\n明日はもっと上手くできるはず！",
    btn: "明日もがんばる!",
  },
};

/* フェーズ開始時に自動表示するチュートリアル */
export const PHASE_TUTORIALS = {
  marche: "marche_welcome",
  prep: "prep_intro",
  ops: "ops_welcome",
  night: "night_review",
};
