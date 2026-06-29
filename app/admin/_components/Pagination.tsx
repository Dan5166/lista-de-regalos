"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Props {
  total: number;
  page: number;
  perPage: number;
}

export function Pagination({ total, page, perPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-6 pb-2">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        ← Anterior
      </button>
      <span className="text-sm text-gray-500">
        Página {page} de {totalPages}
        <span className="text-gray-400 ml-2">· {total} en total</span>
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        Siguiente →
      </button>
    </div>
  );
}
