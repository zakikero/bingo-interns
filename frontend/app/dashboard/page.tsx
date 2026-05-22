import Leaderboard from "@/components/board/Leaderboard";

export default function DashboardPage() {
  return (
    <main className="dashboard-view">
      <header className="dashboard-header">
        <p className="eyebrow">FIKA BINGO</p>
      </header>
      <Leaderboard autoRefreshMs={300000} />
    </main>
  );
}
