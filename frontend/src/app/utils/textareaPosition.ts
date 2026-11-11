export function lineStartOffset(text: string, line: number): number {
  let offset = 0;
  for (let i = 1; i < line; i++) {
    const lineEnd = text.indexOf("\n", offset);
    if (lineEnd === -1) return text.length;
    offset = lineEnd + 1;
  }
  return offset;
}

const MIRRORED_STYLES = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "tabSize",
  "textIndent",
  "textTransform",
  "wordSpacing",
] as const;

/**
 * textarea の中で指定した位置の文字が、textarea の上端から何 px 下にあるかを返す。
 * textarea は中の文字の位置を取得できず、折り返しがあると行の高さからも計算できないため、
 * 同じ幅と文字の設定を持つ見えない要素に手前までの文章を写して測る。
 */
export function caretTop(
  textarea: HTMLTextAreaElement,
  offset: number,
): number {
  const style = getComputedStyle(textarea);
  const mirror = document.createElement("div");
  for (const property of MIRRORED_STYLES) {
    mirror.style[property] = style[property];
  }
  mirror.style.position = "absolute";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.textContent = textarea.value.slice(0, offset);
  const caret = document.createElement("span");
  caret.textContent = "​";
  mirror.append(caret);
  document.body.append(mirror);
  const top = caret.offsetTop;
  mirror.remove();
  return top;
}
