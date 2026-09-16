# What Should I Play?

A 12-question quiz that suggests a race and class for *World of Warcraft: Forever*. It asks how you like to play, and gives you one main pick plus two alternatives you can share with friends.

![The quiz landing page](docs/screenshots/home.png)

## What you get

After the last question you land on a result page with its own shareable link:

- **Your main pick**, such as *Tauren Shaman*, with a short explanation for the race and the class based on the answers
- **The race's racial abilities**, so you can see what the race actually does for you
- **Two alternatives**: one keeps your class with a different race, the other suggests a different class
- A retake prompt if the game data has changed since you took the quiz

<img src="docs/screenshots/result.png" alt="A result page recommending Tauren Shaman, with racials and two alternatives" width="600">

## The questions

The quiz covers:

1. When you started playing WoW
2. Which faction you lean toward
3. What you're most excited to do in Forever (questing, dungeons, raids, PvP, crafting, exploration, community)
4. What you like to contribute to a group
5. How you like to fight
6. How you react when a fight gets unpredictable
7. How you feel about pets and summoned companions
8. The kinds of adventures you enjoy (solo, duo, small or large groups, open world)
9. Which character fantasy pulls you in
10. What you do first when a plan falls apart
11. Which starting-zone atmosphere appeals to you
12. What annoys you the most

Some questions take a single answer. Others ask you to **rank** up to three picks (two for character fantasy).

## How scoring works

The scoring is deterministic. There's no randomness and no AI involved, so the same answers and the same game data always give the same result.

### 1. Every valid combination is scored

The quiz scores all 56 race and class combinations available in Forever and never suggests a pairing you can't create.

### 2. Each answer gives points to classes and races

Each answer adds 0 to 3 points to the classes and races it fits. For example, *Keep allies alive* favors Priest, Paladin and Shaman, while *Ranged weapons & a companion* favors Hunter and Warlock. Your answer to "What annoys you the most?" can also **subtract** points (up to −3) from classes that are known for that frustration, such as downtime between fights or juggling lots of buttons.

### 3. Questions carry different weight

Some questions say more about class and others say more about race. Each question has a separate class weight and race weight:

| Question | Class weight | Race weight |
| --- | :---: | :---: |
| How you react when a fight gets unpredictable | 3 | — |
| Starting-zone atmosphere | — | 3 |
| Character fantasy | 2.5 | — |
| Faction | — | 2.5 |
| What annoys you | 2.2 | 0.6 |
| What you do when a plan falls apart | — | 2.2 |
| Group contribution | 2 | — |
| Fighting style | 2 | — |
| Adventures you enjoy | 1.7 | 0.3 |
| Pets and companions | 1.5 | — |
| What you're excited about | 1.2 | 1.2 |
| When you started playing | — | 0.5 |

### 4. Your first ranked pick counts most

For ranked questions, one question's worth of points is split across your picks:

| Picks | 1st | 2nd | 3rd |
| --- | :---: | :---: | :---: |
| 1 | 100% | | |
| 2 | 62.5% | 37.5% | |
| 3 | 55.6% | 33.3% | 11.1% |

If one option is a clear favorite, pick only that one and it gets the full weight.

### 5. Class fit matters more than race fit

For each combination, the class total and race total are each scaled against the highest score possible. The final score is:

```text
score = 65% × class fit + 35% × race fit
```

Your race is still part of the result, but your class has more effect on how the game feels day to day.

### A few special rules

- **Faction is just a preference.** Choosing Alliance or Horde gives that faction's races a large boost, but a strong enough match on the other side can still win.
- **Community players get more say in atmosphere.** Ranking *Community & the vibes* doesn't favor either faction. Instead, it makes your starting-zone atmosphere answer count more: ×1.5 when ranked first, ×1.3 second, ×1.15 third.
- **Ties are broken by your top priorities.** If two combinations have the same score, the quiz first compares how well each one matches your first-ranked picks, then how well each class fits your answer about unpredictable fights.

### Picking the alternatives

The alternatives aren't just the 2nd- and 3rd-highest scores, since those would often be near-duplicates of your main pick. Instead you get:

- **The highest-scoring combination with the same class and a different race**, to show what changing only your race would do
- **The highest-scoring combination with a different class**, if you want a different playstyle

## How the data is kept up to date

The race and class list, which combinations are allowed, and each race's racials are checked by hand against:

- Blizzard's [*What's Next* panel recap](https://worldofwarcraft.blizzard.com/en-us/news/24303862/world-of-warcraft-forever-whats-next-panel-recap)
- Blizzard's [*Deep Dive* panel recap](https://worldofwarcraft.blizzard.com/en-us/news/24303313/world-of-warcraft-forever-deep-dive-panel-recap)
- Wowhead's [racials and class-race combinations guide](https://www.wowhead.com/forever/guide/new-race-class-combinations)

Each review gets a data version and a "checked on" date, shown on the site's [How this works](https://www.whatshouldiplayinwowforever.com/methodology) page.

**Shared results don't change.** Each result saves your answers and the data version it was scored with, so a link you shared keeps showing the same pick. If the data has changed since then, the result page says so and offers a retake with the current data.

The recommendations are about what you might enjoy playing, not a prediction of the best build on launch day.

## Built with

Next.js, React, Tailwind CSS and Upstash Redis, hosted on Vercel.

## License

See [LICENSE](LICENSE).
