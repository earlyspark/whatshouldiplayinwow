const listClass = "t-body mt-4 list-disc space-y-3 pl-6 text-[var(--dim)] marker:text-[var(--bronze)]";
const strong = "font-semibold text-[var(--bone)]";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h3 className="t-card">{title}</h3>
      {children}
    </div>
  );
}

export default function StatsInsights() {
  return (
    <section id="stats" aria-labelledby="stats-title" className="mt-16 scroll-mt-8">
      <h2 id="stats-title" className="t-section">Quiz results</h2>
      <p className="t-body mt-4 text-[var(--dim)]">Updated: November 2, 2026 from 10,043 completed quiz results.</p>
      <p className="t-body mt-3 text-[var(--dim)]">Here's the aggregate data from the quiz results. Note that there's selection bias, so take these metrics and interpretations with a grain of salt. It's just for fun.</p>

      <div className="mx-auto mt-8 aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-[var(--line)]">
        <iframe
          src="https://www.youtube-nocookie.com/embed/LqMgBmOOZQY"
          title="WoW Forever quiz stats video"
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <Group title="Who took the quiz">
        <ul className={listClass}>
          <li><span className={strong}>69% started playing between Vanilla and Wrath.</span> 13% started in Cata–Legion, 5% in BfA/Shadowlands, 5% in modern WoW, and <span className={strong}>8% have never played</span>.</li>
          <li>
            <span className={strong}>Why would veterans need a quiz to help choose?</span> Reasonable guesses:
            <ul className="mt-3 list-disc space-y-3 pl-6">
              <li><span className={strong}>Forever isn&apos;t the same as vanilla.</span> It has a new race (Skyborne), reworked racials and talents, and different class tuning. Old knowledge of &quot;what&apos;s good&quot; doesn&apos;t fully carry over.</li>
              <li><span className={strong}>Their lives changed.</span> &quot;Quiet progress at my own pace&quot; was picked in 71% of results and ranked 1st in 40%. The top annoyances were setup before the fun (43%) and downtime (37%). That might be due to returning adults with less playtime choosing differently than they did as teenagers.</li>
              <li><span className={strong}>They&apos;re genuinely torn.</span> 54% answered &quot;I could enjoy either&quot; on defined vs. flexible playstyle. People who already knew their main probably didn&apos;t take the quiz.</li>
              <li><span className={strong}>It&apos;s fun.</span> Asking &quot;what class am I?&quot; is a personality quiz even if you already have a main.</li>
            </ul>
          </li>
        </ul>
      </Group>

      <Group title="Faction">
        <ul className={listClass}>
          <li><span className={strong}>Horde 37%, Alliance 34%, no preference 29%.</span> Among results with a preference, it&apos;s 52/48 Horde, which is close to even.</li>
          <li><span className={strong}>More than a quarter don&apos;t care.</span> For them, faction will come down to friends, guilds and whichever race they end up liking.</li>
          <li><span className={strong}>The quiz&apos;s race recommendations also lean Horde</span> (5,333 Horde vs. 4,710 Alliance). In the latest quiz (v1.26–1.27) they&apos;re about even (440 vs. 457).</li>
        </ul>
      </Group>

      <Group title="What people are excited about">
        <ul className={listClass}>
          <li><span className={strong}>Questing &amp; leveling leads:</span> picked in 73% of results and ranked 1st in 42%, far ahead of dungeons (64% picked, 16% 1st) and raids (43%, 15% 1st).</li>
          <li><span className={strong}>Exploration, lore &amp; collecting (41%) is about as popular as raids.</span> PvP is 26%, and crafting &amp; the economy is 18% (only 2% ranked it 1st).</li>
          <li><span className={strong}>People want to play alone or in small groups:</span> solo 71%, small group 68%, open world 57%, duo 53%. A large, coordinated team is 26% (6% 1st).</li>
        </ul>
      </Group>

      <Group title="Recommended classes and races">
        <ul className={listClass}>
          <li><span className={strong}>All time:</span> Shaman 15%, Hunter 13%, Warlock 13%, Druid 13%, Priest 11%, Paladin 10%, Warrior 9%, Mage 9%, Rogue 8%.</li>
          <li><span className={strong}>Latest quiz (v1.26–1.27, 897 results):</span> Shaman 15%, Druid 14%, Mage 13%, Priest 12%, Hunter 12%, Paladin 10%, Warrior 9%, Rogue 9%, Warlock 6%. The shifts reflect scoring changes on my end, not player preference.</li>
          <li><span className={strong}>Races, all time:</span> Undead 17%, Troll 15%, Night Elf 14% lead. In the latest quiz, Night Elf leads at 16%.</li>
          <li><span className={strong}>About half of recommendations are hybrid classes</span> (Druid, Shaman, Paladin, Priest): 48% all time, 51% in the latest quiz. This follows from the answers: &quot;Adapt to whatever the group needs&quot; was picked in 58% of results.</li>
          <li><span className={strong}>Most common race/class recommendation:</span> Night Elf Druid, followed by Troll Shaman and Undead Paladin.</li>
        </ul>
      </Group>

      <Group title="Tanks and healers: few prefer it, many are willing">
        <ul className={listClass}>
          <li><span className={strong}>First choice:</span> &quot;Deal heavy damage&quot; was ranked 1st in 47% of results. Protect others was ranked 1st in 14%, keep allies alive in 16%, and adapt to whatever the group needs in 16%.</li>
          <li><span className={strong}>Few prefer tanking or healing, but many are willing</span>, and the &quot;adapt&quot; crowd could cover either.</li>
        </ul>
      </Group>

      <Group title="Did users like the recommendations? (👍/👎)">
        <ul className={listClass}>
          <li><span className={strong}>First recommendation:</span> 69% 👍 (220 👍 / 101 👎). <span className={strong}>Second</span> (same class, another race): 78% (131 / 38). <span className={strong}>Third</span> (a different class): 84% (171 / 33).</li>
          <li>On results where someone 👎&apos;d the first pick and also rated the third, 60% gave the third a 👍 (18 of 30). For the second pick, it was 48% (13 of 27). So when the top match misses, a different class is usually the better rescue than a different race.</li>
          <li><span className={strong}>The alternatives probably score higher partly because of who votes on them.</span> Someone who scrolls down to rate the second and third picks is more engaged, and they tend to rate alternatives they like.</li>
          <li><span className={strong}>Only about 3% of results got a rating</span> (321 on the first pick). People with strong opinions are more likely to vote.</li>
          <li><span className={strong}>By class</span>, first picks for Warrior (89%, 18 votes) and Druid (76%, 38 votes) rated best. Mage (53%), Priest (56%) and Shaman (59%) rated lowest. Shaman is both the most-recommended class and one of the least-liked first picks (I&apos;ll try to fix this in a future version).</li>
        </ul>
      </Group>

      <Group title="Predictions for WoW Forever">
        <p className="t-body mt-4 text-[var(--dim)]">These are guesses based on the data above.</p>
        <ul className={listClass}>
          <li><span className={strong}>Dungeon groups will wait on tanks and healers, but not for long.</span> Fewer people will queue as a tank or healer first, but a big share of hybrid players will switch when asked.</li>
          <li><span className={strong}>Raid guilds will have to recruit harder.</span> Only about a quarter picked large, coordinated content, and few ranked it first. Raiding will happen, but the share of raiding players will likely be smaller than nostalgia suggests.</li>
          <li><span className={strong}>Faction balance will be close.</span> It&apos;s a slight Horde lean with a big neutral group that will follow friends.</li>
          <li><span className={strong}>The auction house may be quieter.</span> Crafting and the economy were the least exciting option, so dedicated crafters and gold-makers could find less competition.</li>
          <li><span className={strong}>Hybrids will be everywhere.</span> With &quot;adapt&quot; as popular as it is, Druids, Shamans and Paladins will likely be a common sight, which also helps the tank and healer shortage.</li>
        </ul>
      </Group>
    </section>
  );
}
