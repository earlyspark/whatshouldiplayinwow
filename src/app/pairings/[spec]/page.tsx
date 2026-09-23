import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parsePairingParams, specIdFromSlug, specSlug } from "@/lib/pairings-params";
import { pairingsMetadata, specHeading, toParamReader } from "@/lib/pairings-share";
import PairingsView from "../PairingsView";

export const dynamic = "force-dynamic";

interface SpecPairingsPageProps {
  params: Promise<{ spec: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function resolveSelection({ params, searchParams }: SpecPairingsPageProps) {
  const specId = specIdFromSlug((await params).spec);
  if (!specId) notFound();
  return parsePairingParams(toParamReader(await searchParams), specId);
}

export async function generateMetadata(props: SpecPairingsPageProps): Promise<Metadata> {
  return pairingsMetadata(await resolveSelection(props));
}

export default async function SpecPairingsPage(props: SpecPairingsPageProps) {
  const selection = await resolveSelection(props);
  const specId = selection.specId!;
  return <PairingsView heading={specHeading(specId)} path={`/pairings/${specSlug(specId)}`} specId={specId} />;
}
