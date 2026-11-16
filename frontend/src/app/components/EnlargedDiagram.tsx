"use client";

import { useEffect, useRef, useState } from "react";
import type { PanzoomEventDetail, PanzoomObject } from "@panzoom/panzoom";
import { FiMinus, FiPlus, FiRotateCcw, FiX } from "react-icons/fi";

type Props = {
  svg: string;
  onClose: () => void;
};

const MAX_SCALE = 10;
const PIXELS_PER_LINE = 16;
// マウスのホイールは1目盛りの量が大きく、トラックパッドのピンチは細かい量が連続して届くため、1回の量に上限を設けてどちらでも扱いやすい速さにする
const WHEEL_ZOOM_RATE = 0.01;
const WHEEL_ZOOM_DELTA_LIMIT = 50;
const KEYBOARD_PAN_STEP = 80;
const KEYBOARD_PAN_DIRECTIONS: Record<string, [number, number]> = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

// 倍率は掛け算で効くため、つまみの位置を倍率の対数に比例させて、どの倍率でも同じ動かし方で同じだけ変わるようにする
function scaleAt(position: number) {
  return MAX_SCALE ** position;
}

function positionOf(scale: number) {
  return Math.log(scale) / Math.log(MAX_SCALE);
}

export function EnlargedDiagram({ svg, onClose }: Props) {
  const view = useRef<HTMLDialogElement>(null);
  const diagram = useRef<HTMLDivElement>(null);
  const [panzoom, setPanzoom] = useState<PanzoomObject>();
  const [scale, setScale] = useState(1);
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = view.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const element = diagram.current;
    const area = element?.parentElement;
    if (!element || !area) return;
    let cancelled = false;
    let created: PanzoomObject | undefined;
    // 図を見る画面ではホイールやトラックパッドのスクロールを移動に使い、拡大と縮小はピンチ（ブラウザには Ctrl 付きのホイールとして届く）と Ctrl や ⌘ を押しながらのホイールに分ける
    const handleWheel = (event: WheelEvent) => {
      if (!created) return;
      event.preventDefault();
      const scale = created.getScale();
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? PIXELS_PER_LINE : 1;
      if (event.ctrlKey || event.metaKey) {
        const delta = Math.max(
          -WHEEL_ZOOM_DELTA_LIMIT,
          Math.min(WHEEL_ZOOM_DELTA_LIMIT, event.deltaY * unit),
        );
        created.zoomToPoint(scale * Math.exp(-delta * WHEEL_ZOOM_RATE), event, {
          animate: false,
        });
        return;
      }
      created.pan(
        (-event.deltaX * unit) / scale,
        (-event.deltaY * unit) / scale,
        { relative: true, animate: false },
      );
    };
    const zoomInAtPoint = (event: MouseEvent) => {
      if (!created) return;
      created.zoomToPoint(created.getScale() * 2, event);
    };
    const followScale = (event: Event) =>
      setScale((event as CustomEvent<PanzoomEventDetail>).detail.scale);
    (async () => {
      const { default: Panzoom } = await import("@panzoom/panzoom");
      if (cancelled) return;
      created = Panzoom(element, {
        canvas: true,
        cursor: "grab",
        minScale: 1,
        maxScale: MAX_SCALE,
      });
      area.addEventListener("wheel", handleWheel, { passive: false });
      area.addEventListener("dblclick", zoomInAtPoint);
      element.addEventListener("panzoomchange", followScale);
      setPanzoom(created);
    })();
    return () => {
      cancelled = true;
      area.removeEventListener("wheel", handleWheel);
      area.removeEventListener("dblclick", zoomInAtPoint);
      element.removeEventListener("panzoomchange", followScale);
      created?.destroy();
    };
  }, []);

  const panByKey = (event: React.KeyboardEvent) => {
    const direction = KEYBOARD_PAN_DIRECTIONS[event.key];
    if (!direction || !panzoom) return;
    event.preventDefault();
    const scale = panzoom.getScale();
    panzoom.pan(
      (direction[0] * KEYBOARD_PAN_STEP) / scale,
      (direction[1] * KEYBOARD_PAN_STEP) / scale,
      { relative: true },
    );
  };

  return (
    <dialog
      ref={view}
      aria-label="拡大した図"
      className="m-auto h-[90vh] max-h-none w-[92vw] max-w-none overflow-hidden rounded bg-surface p-0 backdrop:bg-black/70"
      onClose={onClose}
      // 図を動かすドラッグが背景の上で終わってもクリックとして届くため、押し始めも背景だったときだけ閉じる
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === e.currentTarget) {
          view.current?.close();
        }
      }}
    >
      <div
        tabIndex={0}
        role="group"
        aria-label="図の表示範囲。矢印キーで移動する"
        className="h-full w-full overflow-hidden select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        onKeyDown={panByKey}
      >
        <div
          ref={diagram}
          className="h-full w-full p-4 [&_svg]:h-full [&_svg]:w-full [&_svg]:!max-w-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className="absolute top-2 right-2">
        <ToolButton label="閉じる" onClick={() => view.current?.close()}>
          <FiX />
        </ToolButton>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded border border-gray-400 bg-surface p-1 shadow">
        <ToolButton label="元の表示に戻す" onClick={() => panzoom?.reset()}>
          <FiRotateCcw />
        </ToolButton>
        <ToolButton label="縮小する" onClick={() => panzoom?.zoomOut()}>
          <FiMinus />
        </ToolButton>
        <input
          type="range"
          aria-label="倍率"
          min={0}
          max={1}
          step={0.01}
          value={positionOf(scale)}
          onChange={(e) =>
            panzoom?.zoom(scaleAt(Number(e.target.value)), { animate: false })
          }
          className="w-32 accent-accent sm:w-48"
        />
        <ToolButton label="拡大する" onClick={() => panzoom?.zoomIn()}>
          <FiPlus />
        </ToolButton>
      </div>
    </dialog>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded border border-gray-400 bg-surface text-gray-900 shadow hover:opacity-80"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
