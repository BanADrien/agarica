---
name: level-design
version: "2.0.0"
description: |
  Level design fundamentals, pacing, difficulty progression, environmental
  storytelling, and spatial design for engaging gameplay experiences.
sasmp_version: "1.3.0"
bonded_agent: 01-game-designer
bond_type: PRIMARY_BOND

parameters:
  - name: level_type
    type: string
    required: false
    validation:
      enum: [linear, open_world, hub, procedural, puzzle]
  - name: game_genre
    type: string
    required: false
    validation:
      enum: [action, adventure, puzzle, platformer, fps, rpg]

retry_policy:
  enabled: true
  max_attempts: 3
  backoff: exponential

observability:
  log_events: [start, complete, error]
  metrics: [completion_time, death_count, exploration_percentage]
---
<!-- source : https://github.com/pluginagentmarketplace/custom-plugin-game-developer (skills/level-design) @ aa7edfe267b34eac63d888f60b13e08aca7850ed -->

# Level Design

## Level Design Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│                    LEVEL DESIGN PILLARS                     │
├─────────────────────────────────────────────────────────────┤
│  1. FLOW: Guide the player naturally through space         │
│  2. PACING: Control intensity and rest moments             │
│  3. DISCOVERY: Reward exploration and curiosity            │
│  4. CLARITY: Player always knows where to go               │
│  5. CHALLENGE: Skill tests that teach and satisfy          │
└─────────────────────────────────────────────────────────────┘
```

## Level Structure Patterns

```
LINEAR LEVEL:
┌─────────────────────────────────────────────────────────────┐
│  [Start] → [Tutorial] → [Challenge] → [Boss] → [End]       │
│                                                              │
│  PROS: Easy to pace, clear direction                        │
│  CONS: Limited replay value, less exploration              │
│  BEST FOR: Story-driven games, action games                │
└─────────────────────────────────────────────────────────────┘

HUB & SPOKE:
┌─────────────────────────────────────────────────────────────┐
│              [Level A]                                       │
│                  ↑                                           │
│  [Level B] ← [HUB] → [Level C]                              │
│                  ↓                                           │
│              [Level D]                                       │
│                                                              │
│  PROS: Player choice, non-linear progression                │
│  CONS: Can feel disconnected                                │
│  BEST FOR: RPGs, Metroidvanias, open-world                 │
└─────────────────────────────────────────────────────────────┘

METROIDVANIA:
┌─────────────────────────────────────────────────────────────┐
│  ┌───┐   ┌───┐   ┌───┐                                      │
│  │ A │───│ B │───│ C │ (locked: need ability X)            │
│  └─┬─┘   └───┘   └───┘                                      │
│    │       │                                                 │
│  ┌─┴─┐   ┌─┴─┐                                              │
│  │ D │───│ E │ (grants ability X)                          │
│  └───┘   └───┘                                              │
│                                                              │
│  PROS: Rewarding exploration, ability gating                │
│  CONS: Can get lost, backtracking tedium                   │
│  BEST FOR: Exploration games, 2D platformers               │
└─────────────────────────────────────────────────────────────┘
```

## Pacing & Flow

```
INTENSITY GRAPH (Good Pacing):
┌─────────────────────────────────────────────────────────────┐
│  High │      ╱╲           ╱╲    ╱╲                          │
│       │     ╱  ╲    ╱╲   ╱  ╲  ╱  ╲    ╱╲                  │
│       │    ╱    ╲  ╱  ╲ ╱    ╲╱    ╲  ╱  ╲                 │
│  Low  │───╱──────╲╱────╲──────────────╲╱────────           │
│       └────────────────────────────────────────→ Time       │
│                                                              │
│  PATTERN: Build → Peak → Rest → Build → Peak → Rest        │
└─────────────────────────────────────────────────────────────┘

PACING ELEMENTS:
┌─────────────────────────────────────────────────────────────┤
│  BUILD-UP:                                                   │
│  • Introduce new mechanic safely                            │
│  • Increase difficulty gradually                            │
│  • Foreshadow upcoming challenge                            │
├─────────────────────────────────────────────────────────────┤
│  PEAK (Combat/Puzzle):                                       │
│  • Test player skills                                       │
│  • High stakes moments                                      │
│  • Boss encounters                                          │
├─────────────────────────────────────────────────────────────┤
│  REST:                                                       │
│  • Safe zones                                               │
│  • Story/exploration moments                                │
│  • Resource replenishment                                   │
│  • Save points                                              │
└─────────────────────────────────────────────────────────────┘
```

## Environmental Storytelling

```
STORYTELLING TECHNIQUES:
┌─────────────────────────────────────────────────────────────┐
│  VISUAL NARRATIVES:                                          │
│  • Abandoned objects tell stories                           │
│  • Environmental damage shows history                       │
│  • Character belongings reveal personality                  │
│  • Graffiti and notes provide context                       │
├─────────────────────────────────────────────────────────────┤
│  ATMOSPHERE:                                                 │
│  • Lighting sets mood (warm=safe, cold=danger)             │
│  • Sound design reinforces tone                             │
│  • Weather reflects narrative beats                         │
│  • Music cues emotional state                               │
├─────────────────────────────────────────────────────────────┤
│  DISCOVERY LAYERS:                                           │
│  • Surface: Obvious story elements                          │
│  • Hidden: Rewards for exploration                          │
│  • Deep: Lore for dedicated players                         │
└─────────────────────────────────────────────────────────────┘
```

## Whitebox Process

```
LEVEL DESIGN WORKFLOW:
┌─────────────────────────────────────────────────────────────┐
│  1. CONCEPT (Paper)                                          │
│     • Sketch rough layout                                   │
│     • Define key beats                                      │
│     • Identify player path                                  │
│                    ↓                                         │
│  2. WHITEBOX (Engine)                                        │
│     • Block out with primitives                             │
│     • Test scale and timing                                 │
│     • Place placeholder enemies                             │
│                    ↓                                         │
│  3. PLAYTEST                                                 │
│     • Get feedback early                                    │
│     • Iterate on layout                                     │
│     • Fix flow issues                                       │
│                    ↓                                         │
│  4. ART PASS                                                 │
│     • Replace with final art                                │
│     • Add lighting                                          │
│     • Polish visual details                                 │
│                    ↓                                         │
│  5. FINAL POLISH                                             │
│     • Audio integration                                     │
│     • VFX placement                                         │
│     • Performance optimization                              │
└─────────────────────────────────────────────────────────────┘
```

## Player Guidance

```
VISUAL GUIDANCE TECHNIQUES:
┌─────────────────────────────────────────────────────────────┐
│  LIGHTING:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     [Dark]    [BRIGHT PATH]    [Dark]               │   │
│  │                    ↓                                  │   │
│  │              [OBJECTIVE]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  LANDMARKS:                                                  │
│  • Tall structures visible from distance                    │
│  • Unique colors for important locations                    │
│  • Repeated motifs for path clarity                         │
│                                                              │
│  ARCHITECTURE:                                               │
│  • Lines leading to objectives                              │
│  • Framing important elements                               │
│  • Negative space around key items                          │
└─────────────────────────────────────────────────────────────┘
```

## Difficulty Progression

```
TEACHING THROUGH DESIGN:
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Safe Introduction                                   │
│  ┌─────────────────────────────────────────────┐           │
│  │  [Player] ──→ [Gap] ──→ [Platform]          │           │
│  │  (No enemies, can't die)                    │           │
│  └─────────────────────────────────────────────┘           │
│                                                              │
│  STEP 2: Add Stakes                                          │
│  ┌─────────────────────────────────────────────┐           │
│  │  [Player] ──→ [Gap+Spikes] ──→ [Platform]   │           │
│  │  (Same mechanic, consequence for failure)   │           │
│  └─────────────────────────────────────────────┘           │
│                                                              │
│  STEP 3: Add Complexity                                      │
│  ┌─────────────────────────────────────────────┐           │
│  │  [Player] ──→ [Moving Platform] ──→ [Goal]  │           │
│  │  (Timing + previously learned jump)         │           │
│  └─────────────────────────────────────────────┘           │
│                                                              │
│  STEP 4: Combine Mechanics                                   │
│  ┌─────────────────────────────────────────────┐           │
│  │  [Player] ──→ [Enemy] + [Gap] ──→ [Reward]  │           │
│  │  (Combat + platforming together)            │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEM: Players get lost                                   │
├─────────────────────────────────────────────────────────────┤
│ SOLUTIONS:                                                   │
│ → Add stronger visual guides (lighting, landmarks)          │
│ → Use environmental cues (footprints, trails)               │
│ → Place NPCs or signs at decision points                    │
│ → Add map/compass UI elements                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROBLEM: Level feels too long/boring                        │
├─────────────────────────────────────────────────────────────┤
│ SOLUTIONS:                                                   │
│ → Add more pacing variety (peaks and valleys)               │
│ → Cut redundant sections                                    │
│ → Add shortcuts for backtracking                            │
│ → Place more rewards and discoveries                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROBLEM: Difficulty spikes frustrating players              │
├─────────────────────────────────────────────────────────────┤
│ SOLUTIONS:                                                   │
│ → Add training area before hard section                     │
│ → Place checkpoint closer to challenge                      │
│ → Provide optional resources before boss                    │
│ → Playtest with different skill levels                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROBLEM: Players skip optional content                      │
├─────────────────────────────────────────────────────────────┤
│ SOLUTIONS:                                                   │
│ → Make secrets more visible (partial reveal)                │
│ → Place rewards near critical path                          │
│ → Use audio cues for hidden areas                           │
│ → Reward exploration with meaningful items                  │
└─────────────────────────────────────────────────────────────┘
```

## Level Metrics

| Metric | Action | Puzzle | RPG | Platformer |
|--------|--------|--------|-----|------------|
| Avg. Completion | 5-10 min | 10-20 min | 30-60 min | 3-8 min |
| Deaths/Level | 2-5 | 0-2 | 1-3 | 5-15 |
| Secrets | 2-3 | 1-2 | 5-10 | 3-5 |
| Checkpoints | Every 2 min | Puzzle start | Safe rooms | Every 30 sec |

---

**Use this skill**: When designing engaging levels, pacing gameplay, or creating environmental narratives.
