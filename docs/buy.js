/**
 * 購入ボタン（TouchRotator・Profilink の buy.js と同じ作り）。
 *
 * 店の設定はこの先頭にまとめてある（日本語と英語のページで共通。直すのはここ 1 か所）。価格 ID が空のあいだは購入ボタンを隠し、
 * 「まもなく販売を開始します」と出す。準備が途中のサイトに、押しても動かない
 * ボタンが出ることはない。
 */
// ▼▼▼ 要設定（オーナー）: Paddle の準備ができたら、この 2 つを入れる ▼▼▼
// どちらかが空のあいだは購入ボタンを隠し、「まもなく販売を開始します」と出す。
//
// Paddle の client-side token（live_…）。ページに載せて公開するもので、秘密ではない。
// TouchRotator・Profilink と同じ Paddle アカウントで売るなら、Profilink の buy.js と同じ値。
const PADDLE_TOKEN = "live_caa95e53994f8145b0400f7618d";
// Windowfit（98 円・買い切り）の価格 ID（pri_…）。Paddle で Windowfit の商品と価格を作ったら入れる。
const PADDLE_PRICE = "pri_01m81n321b93dwxnnpxxbe7yha";
// ▲▲▲ 要設定ここまで ▲▲▲
// ページの言語（<html lang>）。英語のページでは購入画面と購入後のページも英語にする。
const LANG = document.documentElement.lang === "en" ? "en" : "ja";
const THANKS_URL = LANG === "en" ? "https://windowfit.tsubomi.jp/en/thanks.html" : "https://windowfit.tsubomi.jp/thanks.html";

const configured = PADDLE_TOKEN !== "" && PADDLE_PRICE !== "" && typeof Paddle !== "undefined";

if (configured) {
  Paddle.Initialize({
    token: PADDLE_TOKEN,
    // Paddle は購入完了後の URL に取引番号を付けないので、完了の知らせを受けてから
    // こちらで移動する（購入後のページは取引番号でキーを受け取る）。
    eventCallback(event) {
      if (event.name !== "checkout.completed") return;
      const transaction = event.data && event.data.transaction_id;
      if (!transaction) return;
      location.href = `${THANKS_URL}?_ptxn=${encodeURIComponent(transaction)}`;
    },
  });
}

// クーポン付きのリンク（https://windowfit.tsubomi.jp/?coupon=コード）から来た人は、
// 購入画面に最初からそのコードが入った状態にする。100% 割引のコードなら 0 円で、
// 普通の購入と同じようにキーの画面とメールが届く。
const COUPON = (new URLSearchParams(location.search).get("coupon") || "").trim();

document.querySelectorAll("[data-buy]").forEach((button) => {
  button.hidden = !configured;
  if (COUPON) button.textContent = LANG === "en" ? "Redeem your coupon" : "クーポンを使って受け取る";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const checkout = {
      items: [{ priceId: PADDLE_PRICE, quantity: 1 }],
      settings: { locale: LANG },
      // 購入後のメールの言語。Paddle が取引に残し、キーを渡す仕組み（worker）が読む。
      customData: { lang: LANG },
    };
    if (COUPON) checkout.discountCode = COUPON;
    Paddle.Checkout.open(checkout);
  });
});

// クーポン付きのリンクで来た人は、価格の欄まで自動で移動する。
if (COUPON && configured) {
  const price = document.getElementById("price");
  if (price) price.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-not-yet]").forEach((note) => {
  note.hidden = configured;
});
