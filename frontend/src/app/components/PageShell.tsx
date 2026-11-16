import type { ReactNode } from "react";
import Header from "./header";

/**
 * 公開ページ共通の枠。
 * 背景の青空を地にして、その上に各ブロックを縦に並べるための
 * ヘッダーと余白リズムだけを提供する。コンテンツ自体の地は持たず、
 * 空が透ける余白でブロック間を区切る。
 */
export default function PageShell({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  // 補助の列と並べたとき、幅を中身に合わせると本文の中の折り返せない長い要素（リンクのカードやコードなど）に引っ張られて補助の列に重なるため、列の幅に合わせる
  const main = (
    <main
      id="main-content"
      className="w-full max-w-4xl mx-auto px-4 pt-(--content-top-gap) pb-28 space-y-14 sm:space-y-24"
    >
      {children}
    </main>
  );
  if (!aside) {
    return (
      <div className="min-h-screen font-sans">
        <Header />
        {main}
      </div>
    );
  }
  // 広い画面では本文を中央に置いたまま右の余白に補助の列を置き、画面が狭まると左の余白から先に詰めて、それでも足りなくなってから本文を縮める
  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--container-4xl))_minmax(min-content,1fr)]">
        <div />
        {main}
        <div className="lg:pt-(--content-top-gap) lg:pr-4">{aside}</div>
      </div>
    </div>
  );
}
