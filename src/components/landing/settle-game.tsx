"use client";

import { Fragment, useState } from "react";

/* A tiny two-player (same-device) tic-tac-toe — the "settle who pays" easter egg.
   Hand-drawn X/O strokes animate in via CSS (.landing .mark *); the winning line
   strikes through. Pure state, no AI. */

type Cell = "" | "X" | "O";
type Line = readonly [number, number, number];
const WINS: readonly Line[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const center = (i: number): [number, number] => [25 + (i % 3) * 50, 25 + Math.floor(i / 3) * 50];
const sym = (p: "X" | "O") => (p === "X" ? "✕" : "◯");

function winner(b: Cell[]): Line | null {
  for (const w of WINS) if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return w;
  return null;
}

export function SettleGame() {
  const [board, setBoard] = useState<Cell[]>(() => Array<Cell>(9).fill(""));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [win, setWin] = useState<Line | null>(null);
  const [result, setResult] = useState<"X" | "O" | "draw" | null>(null);
  const over = result !== null;

  function play(i: number) {
    if (over || board[i]) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const w = winner(next);
    if (w) {
      setWin(w);
      setResult(turn);
    } else if (next.every(Boolean)) {
      setResult("draw");
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }
  }

  function reset() {
    setBoard(Array<Cell>(9).fill(""));
    setTurn("X");
    setWin(null);
    setResult(null);
  }

  const status =
    result === "draw"
      ? "Draw — split it 🤝"
      : result
        ? `${sym(result)} wins — ${sym(result === "X" ? "O" : "X")} feeds the pot 🪙`
        : `${sym(turn)} your move`;

  let strike: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (win) {
    const a = center(win[0]);
    const b = center(win[2]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const ex = (dx / L) * 16;
    const ey = (dy / L) * 16;
    strike = { x1: a[0] - ex, y1: a[1] - ey, x2: b[0] + ex, y2: b[1] + ey };
  }

  return (
    <div className="play">
      <span className="play-cap" aria-hidden>
        can’t agree who pays? ↓
      </span>
      <div className="ttt" role="group" aria-label="Tic-tac-toe — two players, same device">
        <span className="tape" aria-hidden />
        <div className="ttt-top">
          <span className="ttt-title">🎲 Settle it</span>
          <div className="ttt-turns" aria-hidden>
            <span className={`who x${!over && turn === "X" ? " active" : ""}`}>✕</span>
            <span className={`who o${!over && turn === "O" ? " active" : ""}`}>◯</span>
          </div>
        </div>
        <div className="ttt-stake">loser feeds the pot 🪙</div>
        <svg className="ttt-board" viewBox="0 0 150 150" aria-label="game board">
          <g id="tttGridLines">
            <path d="M50 10 V140" pathLength={1} />
            <path d="M100 10 V140" pathLength={1} />
            <path d="M10 50 H140" pathLength={1} />
            <path d="M10 100 H140" pathLength={1} />
          </g>
          <g>
            {board.map((c, i) => {
              if (!c) return null;
              const [cx, cy] = center(i);
              return (
                <g key={i} className={`mark ${c === "X" ? "x" : "o"}`}>
                  {c === "X" ? (
                    <>
                      <line x1={cx - 15} y1={cy - 15} x2={cx + 15} y2={cy + 15} pathLength={1} />
                      <line x1={cx + 15} y1={cy - 15} x2={cx - 15} y2={cy + 15} pathLength={1} />
                    </>
                  ) : (
                    <circle cx={cx} cy={cy} r={15} pathLength={1} />
                  )}
                </g>
              );
            })}
          </g>
          <g id="tttStrike">{strike && <line {...strike} pathLength={1} />}</g>
          <g>
            {board.map((c, i) => {
              const [cx, cy] = center(i);
              return (
                <rect
                  key={i}
                  className="hit"
                  x={cx - 25}
                  y={cy - 25}
                  width={50}
                  height={50}
                  style={{ pointerEvents: over || c ? "none" : "all" }}
                  onClick={() => play(i)}
                />
              );
            })}
          </g>
        </svg>
        <div className="ttt-foot">
          <span>{status}</span>
          <button className="ttt-reset" type="button" onClick={reset}>
            ↺ Reset
          </button>
        </div>
      </div>
    </div>
  );
}
