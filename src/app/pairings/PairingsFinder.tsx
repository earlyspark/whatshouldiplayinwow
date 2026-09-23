"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import WowheadTooltips from "@/components/WowheadTooltips";
import ShareActions from "./ShareActions";
import type { PairingMode } from "@/data/pairings-config";
import { classById, classes, raceById, races, type Faction } from "@/data/forever";
import { specById, specRoles, specsForClass, type Role } from "@/data/specs";
import { rankPartners, type PairingModeResult, type PairingRow } from "@/lib/pairings";
import { matchesRoleFilter, pairingSearchString, parsePairingParams, roleFilters, type PairingSelection, type RoleFilter } from "@/lib/pairings-params";
import { trackEvent } from "@/lib/gtag";
import { wowheadRacialUrl, wowheadSpellUrl } from "@/lib/wowhead-tooltips";

const modeLabels: Record<PairingMode, string> = { pve: "PvE", pvp: "PvP" };
const modeContexts: Record<PairingMode, string> = { pve: "Leveling and dungeons", pvp: "World PvP and battlegrounds" };
const roleLabels: Record<Role, string> = { tank: "Tank", healer: "Healer", melee: "Melee DPS", ranged: "Ranged DPS" };
const filterLabels: Record<RoleFilter, string> = { all: "All roles", tank: "Tank", healer: "Healer", dps: "DPS" };
const factionLabels: Record<Faction, string> = { alliance: "Alliance", horde: "Horde" };

const selectClass = "focus-ring mt-1 block w-full min-h-11 cursor-pointer border border-[var(--control-line)] bg-[var(--raised)] px-3 py-2 text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-40";
const chipClass = (active: boolean) =>
  `focus-ring min-h-10 cursor-pointer border px-3 py-1.5 t-small transition ${active ? "border-[var(--bronze)] bg-[rgba(200,150,74,.12)] text-[var(--bone)] forced-colors:outline forced-colors:outline-2 forced-colors:outline-offset-2" : "border-[var(--control-line)] text-[var(--dim)] hover:border-[var(--bronze)] hover:text-[var(--bone)]"}`;
const NEW_TAB_NOTE_ID = "pairings-new-tab-note";
const RACE_NOTE_ID = "pairings-race-note";
// Narrow screens show the creator card inside the results, after enough rows to show the list has started.
const INLINE_CREATOR_AFTER = 3;
const abilityLinkClass = "focus-ring underline decoration-[var(--bronze-dim)] underline-offset-4 hover:decoration-[var(--bronze)]";
const rolePhrases: Record<Role, string> = { tank: "as the tank", healer: "as the healer", melee: "as melee damage", ranged: "as ranged damage" };

function FitBar({ result, mode, emphasized }: { result: PairingModeResult; mode: PairingMode; emphasized: boolean }) {
  return (
    <span className="block min-w-0">
      <span className="block h-1.5 bg-[var(--line)]" aria-hidden="true">
        <span className={`block h-full ${emphasized ? "bg-[var(--bronze)]" : "bg-[var(--sage)]"}`} style={{ width: `${result.score}%` }} />
      </span>
      <span className={`t-small mt-1 block ${emphasized ? "text-[var(--bone)]" : "text-[var(--dim)]"}`}>
        <span className="sr-only">{modeLabels[mode]} fit: </span>{result.tier}
      </span>
    </span>
  );
}

function raceSummary(result: PairingModeResult) {
  if (result.races.length === 1) return raceById[result.races[0].raceId].name;
  return result.races.map((race) => `${factionLabels[race.faction]} ${raceById[race.raceId].name}`).join(" · ");
}

function ModeDetail({ row, mode }: { row: PairingRow; mode: PairingMode }) {
  const result = row[mode];
  return (
    <div className="min-w-0">
      <h3 className="t-label text-[var(--bronze)]">{modeLabels[mode]} · {result.tier}</h3>
      <p className="t-small mt-1 text-[var(--dim)]">{modeContexts[mode]}, {rolePhrases[result.partnerRole]}</p>
      <ul className="mt-3 space-y-2">
        {result.reasons.map((reason) => (
          <li key={reason.ability?.capability ?? "role"} className="t-small">
            {reason.ability && (
              <><a href={wowheadSpellUrl(reason.ability.spellId)} target="_blank" rel="noopener noreferrer" aria-describedby={NEW_TAB_NOTE_ID} className={abilityLinkClass}>{reason.ability.name}</a>{" "}</>
            )}
            {reason.text}
          </li>
        ))}
      </ul>
      {result.gaps.length > 0 && (
        <p className="t-small mt-3 text-[var(--dim)]">Neither of you brings {joinList(result.gaps)}.</p>
      )}
      <p className="t-small mt-3 text-[var(--dim)]">{result.races.length === 1 ? "Suggested race:" : "Suggested races:"}</p>
      <ul className="mt-1 space-y-1">
        {result.races.map((suggestion) => {
          const race = raceById[suggestion.raceId];
          const racialUrl = suggestion.racial ? wowheadRacialUrl(race.id, suggestion.racial, row.spec.classId) : null;
          return (
            <li key={suggestion.faction} className="t-small text-[var(--dim)]">
              {result.races.length > 1 && <>{factionLabels[suggestion.faction]}: </>}
              <span className="text-[var(--bone)]">{race.name}</span>
              {suggestion.racial && (
                <>
                  {" "}for{" "}
                  {racialUrl
                    ? <a href={racialUrl} target="_blank" rel="noopener noreferrer" aria-describedby={NEW_TAB_NOTE_ID} className={abilityLinkClass}>{suggestion.racial}</a>
                    : suggestion.racial}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Explains why the race list is shorter than the full roster, e.g. no Tauren or Skyborne Priests.
function raceListNote({ classId, faction }: PairingSelection) {
  const side = faction ? `${factionLabels[faction]} ` : "";
  if (classId) return `Only valid ${side}races for this class are listed.`;
  return faction ? `Only ${side}races are listed.` : null;
}

function joinList(items: string[]) {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
}

export default function PairingsFinder({ intro, sidebar, inlineCreatorCard }: { intro: ReactNode; sidebar: ReactNode; inlineCreatorCard: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selection = parsePairingParams(searchParams);
  const [expanded, setExpanded] = useState<string | null>(null);

  const classSelectRef = useRef<HTMLSelectElement>(null);
  const hasSelection = Boolean(selection.classId || selection.raceId || selection.faction || selection.sort !== "pve" || selection.role !== "all");

  const reset = () => {
    setExpanded(null);
    router.replace(pathname, { scroll: false });
    trackEvent("pairing_reset");
    classSelectRef.current?.focus();
  };

  const update = (next: Partial<PairingSelection>) => {
    router.replace(`${pathname}${pairingSearchString({ ...selection, ...next })}`, { scroll: false });
  };

  const rows = useMemo(
    () => (selection.specId ? rankPartners(selection.specId, selection.faction, selection.sort) : []),
    [selection.specId, selection.faction, selection.sort],
  );
  const visibleRows = rows.filter((row) => matchesRoleFilter(specRoles(row.spec), selection.role));
  const raceOptions = races.filter((race) =>
    (!selection.classId || race.classes.includes(selection.classId)) && (!selection.faction || race.faction === selection.faction));
  const raceNote = raceListNote(selection);
  const mySpec = selection.specId ? specById[selection.specId] : null;
  const myLabel = mySpec
    ? `${selection.raceId ? `${raceById[selection.raceId].name} ` : ""}${mySpec.name} ${classById[mySpec.classId].name}`
    : null;
  const roleNoun = selection.role === "all" ? "" : `${selection.role === "dps" ? "DPS" : filterLabels[selection.role].toLowerCase()} `;
  const status = mySpec
    ? `${visibleRows.length} ${roleNoun}${visibleRows.length === 1 ? "pairing" : "pairings"}, sorted by ${modeLabels[selection.sort]} fit`
    : "";

  const renderRow = (row: PairingRow) => {
    const open = expanded === row.spec.id;
    const detailId = `pairing-detail-${row.spec.id}`;
    return (
      <li key={row.spec.id} className="border-t border-[var(--line)]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => {
            setExpanded(open ? null : row.spec.id);
            if (!open) trackEvent("pairing_expand", { spec_id: selection.specId!, teammate_spec_id: row.spec.id });
          }}
          className="focus-ring grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] items-center gap-3 py-4 text-left transition hover:bg-[rgba(255,255,255,.02)] sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:gap-6"
        >
          <span className="min-w-0">
            <span className="block font-semibold">{row.spec.name} {row.className}</span>
            <span className="t-small block text-[var(--dim)]">
              {roleLabels[row[selection.sort].partnerRole]} · {raceSummary(row[selection.sort])}
              <span className="ml-2 text-[var(--bronze)]" aria-hidden="true">{open ? "−" : "+"}</span>
            </span>
          </span>
          <FitBar result={row.pve} mode="pve" emphasized={selection.sort === "pve"} />
          <FitBar result={row.pvp} mode="pvp" emphasized={selection.sort === "pvp"} />
        </button>
        <div id={detailId} hidden={!open} className="inset mb-4 grid gap-6 p-5 xl:grid-cols-2">
          {open && (
            <>
              <ModeDetail row={row} mode="pve" />
              <ModeDetail row={row} mode="pvp" />
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <WowheadTooltips refreshKey={`${selection.specId}-${selection.faction}-${selection.sort}-${selection.role}-${expanded}`} />
      <p id={NEW_TAB_NOTE_ID} hidden>Opens Wowhead in a new tab</p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</p>

      <div className="result-layout">
        <div className="min-w-0 space-y-5">
          {intro}
          <section className="surface p-5" aria-labelledby="pairings-you">
            <div className="flex items-center justify-between gap-4">
              <h2 id="pairings-you" className="t-label text-[var(--dim)]">Your character</h2>
              <button
                type="button"
                onClick={reset}
                disabled={!hasSelection}
                aria-label="Reset and clear all selections"
                title="Reset"
                className="focus-ring -my-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[var(--control-line)] text-[var(--dim)] transition hover:border-[var(--bronze)] hover:text-[var(--bone)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="t-small block">
                Class
                <select
                  ref={classSelectRef}
                  className={selectClass}
                  value={selection.classId ?? ""}
                  onChange={(event) => {
                    const classId = (event.target.value || null) as PairingSelection["classId"];
                    const keepRace = classId && selection.raceId && raceById[selection.raceId].classes.includes(classId);
                    setExpanded(null);
                    update({ classId, specId: null, raceId: keepRace ? selection.raceId : null });
                  }}
                >
                  <option value="">Choose a class</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="t-small block">
                Specialization
                <select
                  className={selectClass}
                  value={selection.specId ?? ""}
                  disabled={!selection.classId}
                  onChange={(event) => {
                    const specId = (event.target.value || null) as PairingSelection["specId"];
                    setExpanded(null);
                    update({ specId });
                    if (specId) trackEvent("pairing_select", { spec_id: specId, faction: selection.faction ?? "either" });
                  }}
                >
                  <option value="">{selection.classId ? "Choose a spec" : "Choose a class first"}</option>
                  {selection.classId && specsForClass(selection.classId).map((spec) => <option key={spec.id} value={spec.id}>{spec.name}</option>)}
                </select>
              </label>
              <label className="t-small block">
                Race <span className="text-[var(--dim)]">(optional)</span>
                <select
                  className={selectClass}
                  aria-describedby={raceNote ? RACE_NOTE_ID : undefined}
                  value={selection.raceId ?? ""}
                  onChange={(event) => {
                    const raceId = (event.target.value || null) as PairingSelection["raceId"];
                    update({ raceId, faction: raceId ? raceById[raceId].faction : null });
                  }}
                >
                  <option value="">Any race</option>
                  {raceOptions.map((race) => <option key={race.id} value={race.id}>{race.name} ({factionLabels[race.faction]})</option>)}
                </select>
                {raceNote && <span id={RACE_NOTE_ID} className="t-small mt-1 block text-[var(--dim)]">{raceNote}</span>}
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span id="pairings-faction-label" className="t-small text-[var(--dim)]">Faction</span>
              {selection.raceId ? (
                <span className="t-small">{factionLabels[selection.faction!]}, set by your race</span>
              ) : (
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="pairings-faction-label">
                  {([null, "alliance", "horde"] as (Faction | null)[]).map((faction) => (
                    <button key={faction ?? "any"} type="button" aria-pressed={selection.faction === faction} className={chipClass(selection.faction === faction)} onClick={() => update({ faction })}>
                      {faction ? factionLabels[faction] : "Either"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {!mySpec ? (
            <>
              <p className="t-body text-[var(--dim)]">Choose your class and specialization to see which specs pair best with yours in PvE and PvP.</p>
              <div className="pairings-inline">{inlineCreatorCard}</div>
            </>
          ) : (
            <section aria-labelledby="pairings-results">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <h2 id="pairings-results" className="t-section">How specs pair with your {myLabel}</h2>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pairings by role">
                  {roleFilters.map((role) => (
                    <button key={role} type="button" aria-pressed={selection.role === role} className={chipClass(selection.role === role)} onClick={() => update({ role })}>
                      {filterLabels[role]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 border-t border-[var(--line)]">
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem] sm:gap-6">
                  <span className="t-label text-[var(--dim)]">Pairing</span>
                  {(["pve", "pvp"] as PairingMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => update({ sort: mode })}
                      aria-label={`Sort by ${modeLabels[mode]} fit`}
                      aria-pressed={selection.sort === mode}
                      className={`focus-ring t-label min-h-8 cursor-pointer text-left ${selection.sort === mode ? "text-[var(--bronze)]" : "text-[var(--dim)] hover:text-[var(--bone)]"}`}
                    >
                      {modeLabels[mode]} {selection.sort === mode ? "↓" : ""}
                    </button>
                  ))}
                </div>
                <ol>{visibleRows.slice(0, INLINE_CREATOR_AFTER).map(renderRow)}</ol>
                <div className="pairings-inline border-t border-[var(--line)] py-6">{inlineCreatorCard}</div>
                {visibleRows.length > INLINE_CREATOR_AFTER && (
                  <ol start={INLINE_CREATOR_AFTER + 1}>{visibleRows.slice(INLINE_CREATOR_AFTER).map(renderRow)}</ol>
                )}
              </div>
              <p className="t-small mt-6 text-[var(--dim)]">Some tooltips may still show older values.</p>

              <section className="surface mt-10 p-6 sm:p-8" aria-labelledby="pairings-share-title">
                <h2 id="pairings-share-title" className="t-section">Share the results with your friends</h2>
                <p className="t-body mt-3 text-[var(--dim)]">Send this link to whoever you&apos;re playing with so they can see how your specs pair.</p>
                <div className="mt-6"><ShareActions onRespec={reset} /></div>
              </section>
            </section>
          )}
        </div>
        <div className="pairings-sidebar">{sidebar}</div>
      </div>
    </div>
  );
}
