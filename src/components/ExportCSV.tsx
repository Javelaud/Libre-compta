"use client";

type Props = {
  data: Record<string, string | number>[];
  filename: string;
  label?: string;
};

export default function ExportCSV({ data, filename, label = "Exporter CSV" }: Props) {
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(";"),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (typeof val === "number") return String(val).replace(".", ",");
            return `"${String(val ?? "").replace(/"/g, '""')}"`;
          })
          .join(";")
      ),
    ];

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card text-foreground hover:bg-primary-lighter transition-colors disabled:opacity-50"
    >
      <DownloadIcon className="w-4 h-4" />
      {label}
    </button>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
