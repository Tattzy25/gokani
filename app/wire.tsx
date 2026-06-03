"use client"

import { useSearchParams } from "next/navigation"

export function useWire() {
  const p = useSearchParams()
  return {
    customerId: p.get("cid") ?? "",
    version: p.get("v") ?? "",
    sourceId: p.get("sid") ?? "",
    triggerWord: p.get("tw") ?? "",
    coverImage: p.get("ci") ?? "",
  }
}
