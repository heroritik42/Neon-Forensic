import React, { useState } from "react";
import {
  Database,
  Table,
  Play,
  Download,
  AlertCircle,
  FileCode,
  Search,
  CheckCircle2,
} from "lucide-react";
import { SQLiteDatabaseArtifact } from "../types/forensics";

interface SqliteViewProps {
  databases: SQLiteDatabaseArtifact[];
}

export const SqliteView: React.FC<SqliteViewProps> = ({ databases }) => {
  const [selectedDb, setSelectedDb] = useState<SQLiteDatabaseArtifact>(databases[0] || null);
  const [selectedTable, setSelectedTable] = useState(
    databases[0]?.tables[0]?.tableName || ""
  );
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM sms LIMIT 50;");
  const [queryError, setQueryError] = useState<string | null>(null);

  const currentTableObj = selectedDb?.tables.find((t) => t.tableName === selectedTable) || selectedDb?.tables[0];

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setSqlQuery(`SELECT * FROM ${tableName} LIMIT 50;`);
    setQueryError(null);
  };

  const handleDbChange = (db: SQLiteDatabaseArtifact) => {
    setSelectedDb(db);
    const firstTable = db.tables[0]?.tableName || "";
    setSelectedTable(firstTable);
    setSqlQuery(`SELECT * FROM ${firstTable} LIMIT 50;`);
    setQueryError(null);
  };

  const handleExportCsv = () => {
    if (!currentTableObj) return;
    const headers = currentTableObj.columns.map((c) => c.name).join(",");
    const rows = currentTableObj.sampleRows.map((row) =>
      currentTableObj.columns.map((col) => JSON.stringify(row[col.name] ?? "")).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedDb.dbName}_${currentTableObj.tableName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-mono-forensic text-xs">
      {/* DB Selection & Metadata Header */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Database:</span>
              <div className="flex items-center gap-1.5">
                {databases.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => handleDbChange(db)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedDb?.id === db.id
                        ? "bg-cyan-600 text-slate-950 font-bold"
                        : "bg-slate-900 text-slate-300 border border-slate-850 hover:border-cyan-500/40"
                    }`}
                  >
                    {db.dbName}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Path: {selectedDb?.path} | SHA-256: {selectedDb?.sha256.slice(0, 24)}...
            </div>
          </div>
        </div>

        {/* WAL Journal Badge (Section 12) */}
        {currentTableObj && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
              Journal Mode: <span className="text-cyan-400 font-bold">{currentTableObj.journalMode}</span>
            </span>
            {currentTableObj.walDetected && (
              <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                WAL Journal Merged
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main SQLite View: Tables + SQL Console + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Tables & Schema (3 cols) */}
        <div className="lg:col-span-3 rounded-xl bg-[#090d16] border border-slate-800 p-3 space-y-3">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            Database Tables ({selectedDb?.tables.length})
          </div>

          <div className="space-y-1">
            {selectedDb?.tables.map((tbl) => (
              <button
                key={tbl.tableName}
                onClick={() => handleTableChange(tbl.tableName)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                  selectedTable === tbl.tableName
                    ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <span>{tbl.tableName}</span>
                <span className="text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded">
                  {tbl.rowCount} rows
                </span>
              </button>
            ))}
          </div>

          {currentTableObj && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-slate-400 font-bold text-[10px] uppercase">
                Schema Definition:
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {currentTableObj.columns.map((col) => (
                  <div key={col.name} className="p-1.5 rounded bg-slate-950 flex justify-between text-[11px]">
                    <span className="text-slate-200 font-semibold">{col.name}</span>
                    <span className="text-slate-500">
                      {col.type} {col.isPrimary && <span className="text-amber-400">(PK)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: SQL Console & Result Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Query Editor Box */}
          <div className="rounded-xl bg-[#090d16] border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Read-Only Forensic SQL Query Runner
              </span>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 text-cyan-400 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Export Table as CSV
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-cyan-300 focus:outline-none focus:border-cyan-500 text-xs"
              />
              <button
                onClick={() => setQueryError(null)}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                Run
              </button>
            </div>
            {queryError && (
              <div className="text-rose-400 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {queryError}
              </div>
            )}
          </div>

          {/* Table Data View */}
          <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
              <span>Table Data: {currentTableObj?.tableName}</span>
              <span className="text-[10px] text-slate-500">
                Showing {currentTableObj?.sampleRows.length || 0} records
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              {currentTableObj && currentTableObj.sampleRows.length > 0 ? (
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      {currentTableObj.columns.map((c) => (
                        <th key={c.name} className="px-3 py-2 font-bold whitespace-nowrap">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {currentTableObj.sampleRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        {currentTableObj.columns.map((col) => (
                          <td key={col.name} className="px-3 py-2 max-w-xs truncate whitespace-nowrap">
                            {String(row[col.name] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No records found in table
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
