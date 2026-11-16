"use client";

import { useEffect, useRef, useState } from "react";
import { FiList } from "react-icons/fi";

type Props = {
  articleBodyId: string;
};

type Heading = {
  id: string;
  text: string;
  level: number;
};

const HEADING_SELECTOR = "h1, h2, h3, h4";
const NARROW_LIST_ID = "table-of-contents";
const MIN_HEADINGS = 2;
// 見出しへ移動したときに止まる位置まで見出しが上がってきたら、その見出しを読んでいるとみなす
const READING_LINE_TOLERANCE = 8;

function headingId(text: string, used: Set<string>) {
  const base = text.trim().replace(/\s+/g, "-") || "section";
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

// 見出しの id がページの他の要素と重なると、id で探したときに見出しではなくその要素が見つかるため、ページにある id と目次自身が後から置く id を使用済みにしておく
function giveHeadingIds(articleBody: HTMLElement): Heading[] {
  const headings = [
    ...articleBody.querySelectorAll<HTMLElement>(HEADING_SELECTOR),
  ];
  const used = new Set(
    [...document.querySelectorAll("[id]")]
      .filter((element) => !headings.includes(element as HTMLElement))
      .map((element) => element.id),
  );
  used.add(NARROW_LIST_ID);
  return headings.map((element) => {
    const text = element.textContent ?? "";
    element.id ||= headingId(text, used);
    used.add(element.id);
    return { id: element.id, text, level: Number(element.tagName[1]) };
  });
}

// 閉じたトグルの中の見出しは表示されていないため、開いてから移動する
function showHeading(id: string, behavior: ScrollBehavior) {
  const element = document.getElementById(id);
  if (!element) return;
  for (
    let toggle = element.closest("details");
    toggle;
    toggle = toggle.parentElement?.closest("details") ?? null
  ) {
    toggle.open = true;
  }
  element.scrollIntoView({ behavior, block: "start" });
}

function linkedHeadingId() {
  const fragment = location.hash.slice(1);
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

function headingBeingRead(headings: Heading[], jumpedTo: string | undefined) {
  let current: string | undefined;
  for (const { id } of headings) {
    const element = document.getElementById(id);
    if (!element) continue;
    const rect = element.getBoundingClientRect();
    // 閉じたトグルの中の見出しは大きさを持たないため、読んでいる位置の判定から外す
    if (rect.width === 0 && rect.height === 0) continue;
    const stopLine = parseFloat(getComputedStyle(element).scrollMarginTop);
    if (rect.top > stopLine + READING_LINE_TOLERANCE) break;
    current = id;
  }
  // 記事の終わり近くの見出しはそれ以上スクロールできず読んでいる位置まで上がらないため、目次で選んだ見出しが画面にある間はそれを読んでいるとみなす
  const jumped = jumpedTo && document.getElementById(jumpedTo);
  if (!jumped) return current;
  const { top } = jumped.getBoundingClientRect();
  const jumpedIndex = headings.findIndex((heading) => heading.id === jumpedTo);
  const currentIndex = headings.findIndex((heading) => heading.id === current);
  return top >= 0 && top < window.innerHeight && currentIndex < jumpedIndex
    ? jumpedTo
    : current;
}

export function TableOfContents({ articleBodyId }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [readingId, setReadingId] = useState<string>();
  const narrowList = useRef<HTMLDivElement>(null);
  const jumpedTo = useRef<string>(undefined);

  useEffect(() => {
    const articleBody = document.getElementById(articleBodyId);
    if (!articleBody) return;
    const found = giveHeadingIds(articleBody);
    const startFrame = requestAnimationFrame(() => {
      setHeadings(found);
      // 見出しの id は読み込み後に付けるため、URL で指定された見出しへはブラウザが移動できず、ここで移動させる
      const linked = linkedHeadingId();
      if (linked) {
        jumpedTo.current = linked;
        showHeading(linked, "instant");
      }
      setReadingId(headingBeingRead(found, jumpedTo.current));
    });
    let followFrame = 0;
    const follow = () => {
      cancelAnimationFrame(followFrame);
      followFrame = requestAnimationFrame(() =>
        setReadingId(headingBeingRead(found, jumpedTo.current)),
      );
    };
    window.addEventListener("scroll", follow, { passive: true });
    return () => {
      cancelAnimationFrame(startFrame);
      cancelAnimationFrame(followFrame);
      window.removeEventListener("scroll", follow);
    };
  }, [articleBodyId]);

  if (headings.length < MIN_HEADINGS) return null;

  const topLevel = Math.min(...headings.map((heading) => heading.level));
  const jump = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    narrowList.current?.hidePopover();
    jumpedTo.current = id;
    showHeading(id, "smooth");
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  };
  const list = (
    <ul className="space-y-1 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          style={{ paddingLeft: `${(heading.level - topLevel) * 0.75}rem` }}
        >
          <a
            href={`#${encodeURIComponent(heading.id)}`}
            onClick={(event) => jump(event, heading.id)}
            aria-current={heading.id === readingId ? "location" : undefined}
            className="block py-0.5 text-gray-600 no-underline hover:text-link-color aria-[current]:font-semibold aria-[current]:text-link-color"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  // 目次と目次のボタンは、スクロールする前の本文のカードと上端が揃うよう、ヘッダーの高さと本文の上の余白の分だけ下げる
  return (
    <div className="contents [--narrow-button-height:2.25rem]">
      <nav
        aria-label="目次"
        className="sticky top-[calc(var(--header-height)+var(--content-top-gap))] ml-2 hidden max-h-[calc(100vh-var(--header-height)-2*var(--content-top-gap))] w-56 overflow-y-auto p-5 backdrop-blur sky-surface lg:block"
      >
        <p className="mb-2 text-sm font-bold text-gray-900">目次</p>
        {list}
      </nav>
      <button
        type="button"
        popoverTarget={NARROW_LIST_ID}
        className="fixed top-[calc(var(--header-height)+var(--content-top-gap))] right-4 z-20 flex h-(--narrow-button-height) items-center gap-1 rounded border border-gray-400/60 bg-surface/90 px-3 text-sm text-gray-900 shadow backdrop-blur lg:hidden"
      >
        <FiList aria-hidden="true" />
        目次
      </button>
      <div
        ref={narrowList}
        id={NARROW_LIST_ID}
        popover="auto"
        aria-label="目次"
        className="fixed inset-auto top-[calc(var(--header-height)+var(--content-top-gap)+var(--narrow-button-height)+0.5rem)] right-4 m-0 max-h-[60vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-5 shadow-lg backdrop-blur sky-surface"
      >
        {list}
      </div>
    </div>
  );
}
