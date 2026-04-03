import ReelsFeed from "../components/ReelsFeed";

export const dynamic = "force-dynamic";

export default function ReelsPage() {
  return (
    <div className="h-screen w-screen bg-black">
      <ReelsFeed />
    </div>
  );
}
