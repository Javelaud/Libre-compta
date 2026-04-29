import Sidebar from "@/components/layout/Sidebar";
import AssistantWidget from "@/components/AssistantWidget";
import { YearProvider } from "@/contexts/YearContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YearProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-background">
          <div className="p-8">{children}</div>
        </main>
        <AssistantWidget />
      </div>
    </YearProvider>
  );
}
