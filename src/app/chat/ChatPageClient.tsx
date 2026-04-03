"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { get, onValue, ref } from "firebase/database";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import UserAvatar from "../components/ui/UserAvatar";
import { ButtonSpinner, FeedSkeleton } from "../components/ui/Loading";
import { createChat, sendMessage, subscribeToChats, subscribeToMessages, type ChatRecord, type MessageRecord } from "../lib/chat";
import { withAvatarVersion } from "../lib/avatar";

interface ChatUserProfile {
  displayName: string;
  avatarURL: string;
  avatarUpdatedAt: number;
}

interface ProfileMap {
  [userId: string]: ChatUserProfile;
}

function formatMessageDate(value: number): string {
  if (!value) {
    return "Just now";
  }

  return new Date(value).toLocaleString();
}

export default function ChatPageClient() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get("chatId") || "";
  const [recipientId, setRecipientId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [chatList, setChatList] = useState<ChatRecord[]>([]);
  const [selectedChatId, setSelectedChatId] = useState(initialChatId);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [chatLoading, setChatLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setChatList([]);
      setChatLoading(false);
      return;
    }

    setChatLoading(true);
    const unsubscribe = subscribeToChats(db, user.uid, (chats) => {
      setChatList(chats);
      setChatLoading(false);

      setSelectedChatId((currentChatId) => currentChatId || chats[0]?.id || "");
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const unsubscribe = subscribeToMessages(db, selectedChatId, (nextMessages) => {
      setMessages(nextMessages);
      setMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  const otherParticipantIds = useMemo(() => {
    const allIds = new Set<string>();

    chatList.forEach((chat) => {
      Object.keys(chat.participants).forEach((participantId) => {
        if (participantId !== user?.uid) {
          allIds.add(participantId);
        }
      });
    });

    return Array.from(allIds);
  }, [chatList, user?.uid]);

  useEffect(() => {
    if (otherParticipantIds.length === 0) {
      return;
    }

    const unsubscribers = otherParticipantIds.map((participantId) =>
      onValue(ref(db, `users/${participantId}`), (snapshot) => {
        const data = (snapshot.val() || {}) as Record<string, unknown>;
        setProfiles((current) => ({
          ...current,
          [participantId]: {
            displayName: typeof data.displayName === "string" ? data.displayName : "",
            avatarURL: typeof data.avatarURL === "string" ? data.avatarURL : "",
            avatarUpdatedAt: typeof data.avatarUpdatedAt === "number" ? data.avatarUpdatedAt : 0,
          },
        }));
      }),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [otherParticipantIds]);

  const selectedChat = chatList.find((chat) => chat.id === selectedChatId) || null;
  const selectedRecipientId =
    selectedChat && user?.uid ? Object.keys(selectedChat.participants).find((participantId) => participantId !== user.uid) || "" : "";
  const selectedRecipientProfile = selectedRecipientId ? profiles[selectedRecipientId] : undefined;
  const selectedRecipientName = selectedRecipientProfile?.displayName || selectedRecipientId || "Conversation";
  const selectedRecipientAvatar = selectedRecipientProfile
    ? withAvatarVersion(selectedRecipientProfile.avatarURL, selectedRecipientProfile.avatarUpdatedAt)
    : "";

  const handleCreateChat = async () => {
    if (!user?.uid) {
      alert("Please log in to start chatting.");
      return;
    }

    const nextRecipientId = recipientId.trim();
    if (!nextRecipientId) {
      return;
    }

    try {
      setCreatingChat(true);
      const snapshot = await get(ref(db, `users/${nextRecipientId}`));

      if (!snapshot.exists()) {
        throw new Error("That user does not exist.");
      }

      const chatId = await createChat(db, user.uid, nextRecipientId);
      setSelectedChatId(chatId);
      setRecipientId("");
    } catch (error) {
      console.error("Create chat failed:", error);
      alert(error instanceof Error ? error.message : "Could not create chat.");
    } finally {
      setCreatingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user?.uid || !selectedChatId) {
      return;
    }

    try {
      setSendingMessage(true);
      await sendMessage(db, selectedChatId, user.uid, messageText);
      setMessageText("");
    } catch (error) {
      console.error("Send message failed:", error);
      alert(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return <FeedSkeleton />;
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
        Please <Link href="/login" className="font-medium text-neutral-900 underline">log in</Link> to use chat.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-4">
          <h1 className="text-xl font-semibold text-neutral-900">Messages</h1>
          <p className="mt-1 text-sm text-neutral-500">Start a direct chat with any user ID.</p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              placeholder="Enter recipient user ID"
              className="flex-1 rounded-2xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <button
              type="button"
              onClick={handleCreateChat}
              disabled={creatingChat || !recipientId.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creatingChat ? <ButtonSpinner /> : null}
              {creatingChat ? "Starting..." : "Start"}
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {chatLoading ? (
            <div className="p-4">
              <FeedSkeleton />
            </div>
          ) : chatList.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No chats yet.</p>
          ) : (
            chatList.map((chat) => {
              const otherUserId = Object.keys(chat.participants).find((participantId) => participantId !== user.uid) || "";
              const otherProfile = profiles[otherUserId];
              const otherName = otherProfile?.displayName || otherUserId || "User";
              const otherAvatar = otherProfile ? withAvatarVersion(otherProfile.avatarURL, otherProfile.avatarUpdatedAt) : "";

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-4 text-left transition hover:bg-neutral-50 ${
                    selectedChatId === chat.id ? "bg-neutral-50" : ""
                  }`}
                >
                  <UserAvatar name={otherName} src={otherAvatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{otherName}</p>
                    <p className="truncate text-xs text-neutral-500">{chat.lastMessage || "No messages yet"}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        {selectedChat ? (
          <>
            <div className="flex items-center gap-3 border-b border-neutral-100 p-4">
              <UserAvatar name={selectedRecipientName} src={selectedRecipientAvatar} size="md" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">{selectedRecipientName}</p>
                <p className="text-xs text-neutral-500">{selectedRecipientId}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/60 p-4">
              {messagesLoading ? (
                <FeedSkeleton />
              ) : messages.length === 0 ? (
                <p className="text-sm text-neutral-500">Send the first message.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === user.uid;

                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          isMine ? "bg-neutral-900 text-white" : "bg-white text-neutral-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        <p className={`mt-2 text-[11px] ${isMine ? "text-neutral-300" : "text-neutral-500"}`}>
                          {formatMessageDate(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-neutral-100 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  className="flex-1 rounded-2xl border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={sendingMessage || !messageText.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {sendingMessage ? <ButtonSpinner /> : null}
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-neutral-500">
            Choose a conversation or start one with a user ID.
          </div>
        )}
      </section>
    </div>
  );
}
