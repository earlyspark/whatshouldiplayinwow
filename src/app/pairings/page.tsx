import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { pairingPath, parsePairingParams } from "@/lib/pairings-params";
import { pairingsMetadata, toParamReader } from "@/lib/pairings-share";
import PairingsView from "./PairingsView";

export const dynamic = "force-dynamic";

interface PairingsPageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: PairingsPageProps): Promise<Metadata> {
  return pairingsMetadata(parsePairingParams(toParamReader(await searchParams)));
}

export default async function PairingsPage({ searchParams }: PairingsPageProps) {
  const selection = parsePairingParams(toParamReader(await searchParams));
  // Links shared before each spec had its own page carried the spec in the query.
  if (selection.specId) permanentRedirect(pairingPath(selection));

  return <PairingsView heading="Best spec pairings" path="/pairings" />;
}
