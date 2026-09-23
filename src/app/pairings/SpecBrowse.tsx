import Link from "next/link";
import { classes } from "@/data/forever";
import { specsForClass, type SpecId } from "@/data/specs";
import { specSlug } from "@/lib/pairings-params";

export default function SpecBrowse({ currentSpecId }: { currentSpecId: SpecId | null }) {
  return (
    <nav className="surface mt-10 p-6 sm:p-8" aria-labelledby="pairings-browse">
      <h2 id="pairings-browse" className="t-section">Browse pairings by spec</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {classes.map((item) => (
          <div key={item.id}>
            <h3 className="t-label text-[var(--bronze)]">{item.name}</h3>
            <ul className="mt-2 space-y-1">
              {specsForClass(item.id).map((spec) => (
                <li key={spec.id} className="t-small">
                  {spec.id === currentSpecId
                    ? <span aria-current="page">{spec.name} {item.name}</span>
                    : <Link href={`/pairings/${specSlug(spec.id)}`} className="link-bronze focus-ring">{spec.name} {item.name}</Link>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
