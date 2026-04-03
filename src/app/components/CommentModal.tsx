"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

interface CommentEntry {
  id: string;
  userName: string;
  text: string;
  createdAt: number;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentEntry[];
  authorName: string;
  onSubmit: (text: string) => Promise<void>;
}

export default function CommentModal({ isOpen, onClose, comments, authorName, onSubmit }: CommentModalProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => a.createdAt - b.createdAt),
    [comments],
  );

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSubmit(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl bg-neutral-950 p-4 text-white"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Comments for {authorName}</h3>
              <button className="text-sm text-gray-300 hover:text-white" type="button" onClick={onClose}>
                Close
              </button>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto pb-3">
              {sortedComments.length === 0 ? (
                <p className="text-sm text-gray-400">Be the first to comment.</p>
              ) : (
                sortedComments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-white/10 bg-black/50 p-2">
                    <p className="text-sm font-semibold text-white">{comment.userName}</p>
                    <p className="text-sm text-gray-200">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write a comment..."
                className="w-full rounded-xl border border-white/20 bg-black/75 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
