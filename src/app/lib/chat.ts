import {
  get,
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update,
  type Database,
  type Unsubscribe,
} from "firebase/database";
import { createNotification } from "./notifications";

export interface ChatRecord {
  id: string;
  participants: Record<string, true>;
  lastMessage: string;
  updatedAt: number;
}

export interface MessageRecord {
  id: string;
  text: string;
  senderId: string;
  createdAt: number;
}

function normalizeUserIdPair(userId1: string, userId2: string): [string, string] {
  return [userId1.trim(), userId2.trim()].sort((a, b) => a.localeCompare(b)) as [string, string];
}

export function buildChatId(userId1: string, userId2: string): string {
  const [firstId, secondId] = normalizeUserIdPair(userId1, userId2);
  return `${firstId}__${secondId}`;
}

export function normalizeChat(chatId: string, value: unknown): ChatRecord {
  const source = (value || {}) as Record<string, unknown>;
  const participants = (source.participants || {}) as Record<string, true>;

  return {
    id: chatId,
    participants,
    lastMessage: typeof source.lastMessage === "string" ? source.lastMessage : "",
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : 0,
  };
}

export function normalizeMessage(messageId: string, value: unknown): MessageRecord {
  const source = (value || {}) as Record<string, unknown>;

  return {
    id: messageId,
    text: typeof source.text === "string" ? source.text : "",
    senderId: typeof source.senderId === "string" ? source.senderId : "",
    createdAt: typeof source.createdAt === "number" ? source.createdAt : 0,
  };
}

export async function createChat(database: Database, userId1: string, userId2: string): Promise<string> {
  const firstId = userId1.trim();
  const secondId = userId2.trim();

  if (!firstId || !secondId || firstId === secondId) {
    throw new Error("A valid recipient is required.");
  }

  const chatId = buildChatId(firstId, secondId);
  const chatRef = ref(database, `chats/${chatId}`);
  await update(chatRef, {
    [`participants/${firstId}`]: true,
    [`participants/${secondId}`]: true,
    updatedAt: Date.now(),
  });

  return chatId;
}

export async function sendMessage(database: Database, chatId: string, senderId: string, text: string): Promise<void> {
  const trimmedText = text.trim();

  if (!chatId || !senderId || !trimmedText) {
    throw new Error("Chat ID, sender ID, and message text are required.");
  }

  const messagesRef = ref(database, `messages/${chatId}`);
  const newMessageRef = push(messagesRef);
  const createdAt = Date.now();

  await set(newMessageRef, {
    text: trimmedText,
    senderId,
    createdAt,
    serverCreatedAt: serverTimestamp(),
  });

  await update(ref(database, `chats/${chatId}`), {
    lastMessage: trimmedText,
    updatedAt: createdAt,
  });

  const chatSnapshot = await get(ref(database, `chats/${chatId}`));
  const chatData = (chatSnapshot.val() || {}) as Record<string, unknown>;
  const participants = (chatData.participants || {}) as Record<string, true>;
  const recipientUserId = Object.keys(participants).find((participantId) => participantId !== senderId) || "";

  if (recipientUserId) {
    const senderSnapshot = await get(ref(database, `users/${senderId}`));
    const senderData = (senderSnapshot.val() || {}) as Record<string, unknown>;
    const actorName =
      (typeof senderData.displayName === "string" && senderData.displayName.trim()) ||
      (typeof senderData.email === "string" && senderData.email.trim()) ||
      "Someone";

    await createNotification(database, {
      recipientUserId,
      type: "message",
      actorId: senderId,
      actorName,
      href: `/chat?chatId=${encodeURIComponent(chatId)}`,
      entityId: chatId,
      entityTitle: "New message",
      previewText: trimmedText,
      chatId,
    });
  }
}

export function subscribeToChats(
  database: Database,
  userId: string,
  callback: (chats: ChatRecord[]) => void,
): Unsubscribe {
  return onValue(ref(database, "chats"), (snapshot) => {
    const data = (snapshot.val() || {}) as Record<string, unknown>;
    const chats = Object.entries(data)
      .map(([chatId, value]) => normalizeChat(chatId, value))
      .filter((chat) => chat.participants[userId] === true)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    callback(chats);
  });
}

export function subscribeToMessages(
  database: Database,
  chatId: string,
  callback: (messages: MessageRecord[]) => void,
): Unsubscribe {
  return onValue(ref(database, `messages/${chatId}`), (snapshot) => {
    const data = (snapshot.val() || {}) as Record<string, unknown>;
    const messages = Object.entries(data)
      .map(([messageId, value]) => normalizeMessage(messageId, value))
      .filter((message) => message.text.trim().length > 0)
      .sort((a, b) => a.createdAt - b.createdAt);

    callback(messages);
  });
}
