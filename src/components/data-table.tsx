"use client";

import { useMemo, useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TvetRecord } from "@/lib/schema";

const columns: ColumnDef<TvetRecord>[] = [
  { accessorKey: "respondent_id", header: "ID anonim" },
  { accessorKey: "graduation_year", header: "Kohort" },
  { accessorKey: "institution_type", header: "Institusi" },
  { accessorKey: "programme", header: "Program" },
  { accessorKey: "state", header: "Negeri" },
  { accessorKey: "employment_status", header: "Status pekerjaan" },
  { accessorKey: "job_match", header: "Padanan kerja" },
  { accessorKey: "monthly_income_rm", header: "Pendapatan (RM)" },
];

export function RespondentTable({ records }: { records: TvetRecord[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const data = useMemo(() => records, [records]);
  const table = useReactTable({
    data, columns, state: { sorting, globalFilter }, onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } },
  });
  return (
    <div>
      <label className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span className="sr-only">Cari rekod anonim</span>
        <input className="w-full bg-transparent outline-none" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Cari ID, program, negeri atau status..." />
      </label>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-navy text-white">
            {table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} className="px-4 py-3 font-semibold"><button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}</button></th>)}</tr>)}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => <tr key={row.id} className="border-t border-slate-100 even:bg-slate-50/70">{row.getVisibleCells().map((cell) => <td key={cell.id} className="max-w-[260px] px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext()) || <span className="text-slate-400">Tidak berkenaan</span>}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>{table.getFilteredRowModel().rows.length} rekod anonim</span>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border p-2 disabled:opacity-30" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
          <span>Halaman {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}</span>
          <button className="rounded-lg border p-2 disabled:opacity-30" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Halaman seterusnya"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
