import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";
import { FeedSkeleton } from "../components/ui/Loading";

export default function ChatPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <ChatPageClient />
    </Suspense>
  );
}
