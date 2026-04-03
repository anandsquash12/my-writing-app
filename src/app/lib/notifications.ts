import { push, ref, set, type Database } from "firebase/database";

export interface AppNotificationInput {
  recipientUserId: string;
  type: "message" | "like" | "comment" | "share" | "follow";
  actorId: string;
  actorName: string;
  href: string;
  entityId?: string;
  entityTitle?: string;
  previewText?: string;
  chatId?: string;
}

export async function createNotification(database: Database, input: AppNotificationInput): Promise<void> {
  if (!input.recipientUserId || !input.actorId || input.recipientUserId === input.actorId) {
    return;
  }

  const notificationRef = push(ref(database, `notifications/${input.recipientUserId}`));

  await set(notificationRef, {
    type: input.type,
    actorId: input.actorId,
    actorName: input.actorName,
    href: input.href,
    entityId: input.entityId || "",
    entityTitle: input.entityTitle || "",
    previewText: input.previewText || "",
    chatId: input.chatId || "",
    read: false,
    createdAt: Date.now(),
  });
}
