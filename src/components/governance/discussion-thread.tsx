"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  useAddComment,
  useEditComment,
  useDeleteComment,
  type ProposalComment,
  type GovUser,
} from "@/lib/governance";
import { ApiError } from "@/lib/api";
import { Avatar } from "@/components/app/avatar";
import { cn } from "@/lib/utils";

type Sort = "newest" | "oldest";
const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

function errMsg(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

/* ── safe inline markdown → React nodes ──
   Splits on **bold**, *italic*, `code`, and @mentions. No HTML is ever injected;
   every segment is rendered as escaped React text. */
function renderMarkdown(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|@[\w-]+)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (!part) return <Fragment key={i} />;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span key={i} className="font-medium text-acid">
          {part}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function RelTime({ ts }: { ts: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.round(diff / 60000);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relative time is computed on mount to avoid Date.now() during render
    if (mins < 1) setLabel("just now");
    else if (mins < 60) setLabel(`${mins}m ago`);
    else if (mins < 1440) setLabel(`${Math.round(mins / 60)}h ago`);
    else setLabel(`${Math.round(mins / 1440)}d ago`);
  }, [ts]);
  return (
    <time dateTime={ts} className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
      {label || " "}
    </time>
  );
}

function Composer({
  onSubmit,
  pending,
  error,
  placeholder = "Add to the discussion…",
  submitLabel = "Comment",
  autoFocus = false,
  initialBody = "",
  onCancel,
  clearOnSubmit = true,
}: {
  onSubmit: (body: string) => void;
  pending?: boolean;
  error?: string | null;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  initialBody?: string;
  onCancel?: () => void;
  clearOnSubmit?: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const empty = body.trim().length === 0;

  function submit() {
    if (empty || pending) return;
    onSubmit(body.trim());
    if (clearOnSubmit) setBody("");
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          @mention · **bold** *italic* `code`
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={empty || pending}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition disabled:opacity-40"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  proposalId,
  me,
}: {
  comment: ProposalComment;
  proposalId: number;
  me: GovUser | null;
}) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);

  const editComment = useEditComment(proposalId);
  const deleteComment = useDeleteComment(proposalId);

  const deleted = comment.body === null;
  const isOwn = me != null && comment.authorId === me.id;
  const isAdmin = me?.role === "tenant";
  const canEdit = isOwn && !deleted;
  const canDelete = !deleted && (isOwn || isAdmin);
  const name = comment.author ?? "?";

  function handleDelete() {
    if (deleteComment.isPending) return;
    if (!window.confirm("Delete this comment?")) return;
    deleteComment.mutate(comment.id);
  }

  function handleEdit(body: string) {
    editComment.mutate(
      { commentId: comment.id, body },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} className="size-8 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold">{name}</span>
            <RelTime ts={comment.ts} />
            {comment.edited && !deleted && (
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                · edited
              </span>
            )}
          </div>

          {deleted ? (
            <p className="mt-1 text-sm italic text-muted-foreground">comment deleted</p>
          ) : editing ? (
            <div className="mt-2">
              <Composer
                autoFocus
                clearOnSubmit={false}
                initialBody={comment.body ?? ""}
                submitLabel="Save"
                placeholder="Edit your comment…"
                pending={editComment.isPending}
                error={editComment.error ? errMsg(editComment.error) : null}
                onCancel={() => setEditing(false)}
                onSubmit={handleEdit}
              />
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-pretty text-sm leading-relaxed">
              {renderMarkdown(comment.body ?? "")}
            </p>
          )}

          {!deleted && !editing && (canEdit || canDelete) && (
            <div className="mt-2 flex items-center gap-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteComment.isPending}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground transition hover:text-destructive disabled:opacity-40"
                >
                  Delete
                </button>
              )}
            </div>
          )}
          {deleteComment.error && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errMsg(deleteComment.error)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function DiscussionThread({
  proposalId,
  comments,
  me,
}: {
  proposalId: number;
  comments: ProposalComment[];
  me: GovUser | null;
}) {
  const addComment = useAddComment(proposalId);
  const [sort, setSort] = useState<Sort>("newest");

  const sorted = useMemo(() => {
    const rows = comments.slice();
    rows.sort((a, b) => {
      if (sort === "oldest") return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
      return a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0; // newest
    });
    return rows;
  }, [comments, sort]);

  const hasAny = sorted.length > 0;

  function handleAdd(body: string) {
    addComment.mutate({ body });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
          Discussion · {comments.length}
        </h2>
        <div className="flex gap-1" role="group" aria-label="Sort comments">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                sort === s.key
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {me ? (
        <Composer
          onSubmit={handleAdd}
          pending={addComment.isPending}
          error={addComment.error ? errMsg(addComment.error) : null}
        />
      ) : (
        <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          Sign in to join the discussion.
        </p>
      )}

      {!hasAny ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          💬 No discussion yet — start the conversation.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((c) => (
            <CommentCard key={c.id} comment={c} proposalId={proposalId} me={me} />
          ))}
        </div>
      )}
    </section>
  );
}
