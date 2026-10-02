# Radical Red Enemy AI Extraction

ROM inspected: `C:\Users\Shadow\Documents\My Games\ROMS\Radical Red.gba`

- Size: `33554432` bytes
- Header: `POKEMON FIRE`, game code `BPRE`
- MD5: `8529f3a45d32bce4da637976fcf269d4`
- SHA1: `964f951a0fdaf209e4ea1344883ef0d557bb3a80`

## Active Battle AI Hooks

The original FireRed battle AI code is patched with Thumb jump stubs into expanded
ROM. These are the important hooks found near the vanilla AI core:

| Original routine area | Radical Red hook site | Expanded-ROM target | Meaning |
| --- | --- | --- | --- |
| `BattleAI_SetupAIData` | `0x080C6D0C` | `0x090C7989` | Sets up scores, target, move limitations, and AI flags. |
| `BattleAI_DoAIProcessing` | `0x080C7038` | `0x090C6F3D` | Runs the active scoring routines for each move. |

This matches the Complete FireRed Upgrade style AI architecture: the active move
AI is C-style scoring code, not the original FireRed bytecode interpreter.

## Active AI Flags

The active AI keeps the same broad bitmask idea, but the meaningful normal
move-choice layers are:

| Bit | Script | Purpose |
| --- | --- | --- |
| `0` | `AIScript_Negatives` / `AI_SCRIPT_CHECK_BAD_MOVE` | Penalizes impossible, immune, redundant, unsafe, or bad-value moves. |
| `1` | `AIScript_SemiSmart` / `AI_SCRIPT_SEMI_SMART` | Adds mid-level tactical rules and move prediction awareness. |
| `2` | `AIScript_Positives` / `AI_SCRIPT_CHECK_GOOD_MOVE` | Rewards strong plays, KOs, setup opportunities, prediction-based choices, and advanced tactics. |
| `29` | `AI_Roaming` | Flee behavior for roaming encounters. |
| `30` | `AI_Safari` | Safari flee/watch behavior. |
| `31` | `AI_FirstBattle` | Scripted first-battle flee behavior. |

Other old FireRed script bits such as `SetupFirstTurn`, `Risky`,
`PreferStrongestMove`, and `DoubleBattle` are not the active normal layers in
the hooked CFRU-style table.

## Move Selection Algorithm

The core algorithm is score-based:

```text
setup_ai_data(defaultScoreMoves):
    clear AI state

    for each move slot:
        score[slot] = 100 if defaultScoreMoves contains that slot bit else 0

    if double battle:
        choose a random living opposing target side
    else:
        target = opposing battler

    moveLimitations = CheckMoveLimitations(...)

    for each move slot:
        if move is disabled, out of PP, blocked by choice/taunt/etc:
            score[slot] = 0
        simulated_rng[slot] = AIRandom() % 100

    ai_flags = GetAIFlags()
```

`GetAIFlags()` handles battle type and difficulty:

- Safari: `AI_SCRIPT_SAFARI`
- Roamer: `AI_SCRIPT_ROAMING | WildMonIsSmart(activeBattler)`
- Oak tutorial: `AI_SCRIPT_FIRST_BATTLE`
- Frontier / e-reader / trainer tower / raids: generally
  `CHECK_BAD_MOVE | CHECK_GOOD_MOVE`
- Shadow Warrior / FRLG legendary: `CHECK_BAD_MOVE | SEMI_SMART`
- Normal trainer: trainer table `aiFlags`, with difficulty adjustments where
  compiled in
- Generic wild battle: wild smartness flags may be added

For single battles, it evaluates enabled script bits from low to high:

```text
choose_move_or_action():
    temporarily mega-evolve battlers that are predicted/able to mega evolve
    populate cached attacker data
    populate cached defender data for target

    flags = ai_flags
    logic_id = 0

    while flags != 0:
        if flags bit 0 is set:
            BattleAI_DoAIProcessing(logic_id)
        flags >>= 1
        logic_id += 1

    restore temporary mega evolution state
```

`BattleAI_DoAIProcessing()` is the scoring loop:

```text
for each move slot:
    if move has no PP:
        considered_move = NONE
    else:
        considered_move = move in slot

    if considered_move exists and score[slot] > 0:
        if a scoring routine exists for current logic_id:
            score[slot] = scoring_routine(
                attacker,
                target,
                considered_move,
                current score[slot],
                cached AIScript data
            )
    else:
        score[slot] = 0
```

After all enabled scoring layers run:

```text
if script requested flee:
    return AI_CHOICE_FLEE

if script requested watch:
    return AI_CHOICE_WATCH

best_score = max(score[0..3] among real moves)
candidates = all real move slots with score == best_score
return random candidate
```

That last line matters: if multiple moves tie for best score, the opponent picks
randomly among the tied moves.

## Double Battle Targeting

In doubles, the AI repeats the scoring process once per possible living target:

```text
for each living battler that is not the attacker:
    reset AI data
    set gBankTarget to this battler
    run enabled scoring layers
    store best move and best score for that target

choose target using best target scores plus tie-breakers
return the move chosen for the selected target
```

Target tie-breakers favor, in rough order:

- A move that KOs a target.
- A target that can KO the AI back.
- Mega evolved or Dynamaxed dangerous targets.
- Higher total damage, when the AI mode allows that.
- Avoiding useless status moves into a target the partner will already KO.
- Avoiding friendly-fire unless the move is scored high enough.

## Switches And Items

Before move selection, the opponent can choose to switch or use an item. The active
hooked switch/item path:

```text
AI_TrySwitchOrUseItem():
    update mega potential
    temporarily mega-evolve battlers for evaluation
    CalculateAIPredictions()

    if trainer battle:
        if ShouldSwitch() and not marked good-to-pivot:
            choose most suitable party member
            return switch action
        else if AI item use is allowed and ShouldAIUseItem():
            return item action

    otherwise choose a move
```

`CalculateAIPredictions()` caches strongest moves, doubles KO moves, move
predictions, Dynamax decisions, and switching data once per turn.

The ROM's active switch gate was found through the switch/item wrapper at
`0x090C802C`. That wrapper calls `0x090D824C` for the `ShouldSwitch()`-style
yes/no gate and then `0x090D8168` / `0x090D80CC` for switch-target lookup.

The target lookup matches CFRU's `CalcMostSuitableMonToSwitchInto()` scoring.
Candidates start at `0`; the meaningful single-battle score weights are:

| Flag | Weight | Meaning |
| --- | ---: | --- |
| `KO_FOE` | `+31` | Candidate can KO the current foe. |
| `RESIST_ALL_MOVES` | `+17` | Foe has no move that reaches normal pressure. |
| `OUTSPEEDS` | `+14` | Candidate's Speed is at least the foe's. |
| `REVENGE_KILL` | `+8` | Priority/revenge condition after already being able to KO. |
| `WALLS_FOE` | `+2` | Candidate's relevant defenses wall the foe. |
| `CAN_2HKO` | `+2` | Candidate cannot KO but can deal at least half. |
| `WEAK_TO_MOVE` | `-1` | A foe move can 2HKO / hits dangerously. |
| `FAINTS_FROM_FOE` | `-39` | Candidate can be KOed and does not outspeed. |
| `FAINTS_FROM_FOE_BUT_OUTSPEEDS` | `-15` | Candidate outspeeds but can be KOed and cannot KO. |

The maximum normal single-foe score is `70`
(`31 + 17 + 8 + 14`). A unique highest switch score is deterministic. Equal
non-fainting top scores are not split with a uniform list shuffle; the ROM scans
party order and replaces the current best on a 50% roll for each later equal
candidate.

The battle workspace now tracks the ROM state that materially changes the
switch gate: AI flags, fighting style, switching cooldown, type-absorb cooldown,
Wish counter, trapped / Sky Drop blockers, prior type-absorb memory per party
slot, prediction trust after a wrong previous prediction, and whether the player
is locked into the selected move or using a semi-invulnerable locked move.

## Practical Meaning

Enemy trainers do not run a full minimax simulator. They start legal moves around
`100`, run one or more tactical scoring passes, then choose randomly among the
highest-scored legal moves. Smart trainers mainly differ by having more scoring
passes enabled.

The strongest practical predictors are:

- The trainer's `aiFlags`: `CHECK_BAD_MOVE`, `SEMI_SMART`, and/or
  `CHECK_GOOD_MOVE`.
- Whether switching or item use triggers before move choice.
- Whether a move can KO, especially with priority.
- Type effectiveness, ability immunities, and move accuracy.
- Predicted player moves and predicted switches.
- Current/temporary Mega Evolution and Dynamax assumptions.
- Status/setup/recovery/weather/terrain rules in the active scoring functions.
- Doubles partner-target coordination.
- Tie randomness when several moves land on the same final score.

One important switch nuance is that the move you choose in the calculator is not
always the same as the move the AI predicts. `FindMonThatAbsorbsOpponentsMove`
uses `IsValidMovePrediction`, and the ROM also blocks a repeat type-absorb
switch when both active Pokemon have already spent a turn in battle, the current
prediction matches the previous prediction, and the player did something else
last turn. In the Battle workspace, the AI prediction therefore carries forward
the player's last observed move once both active Pokemon have been in for a
turn, instead of always treating the clicked move as the AI's prediction.

## App Flag Extraction

The calculator now loads `src/js/data/trainer_ai_flags.js`, generated from the
local `Radical Red.gba` with:

```text
python tools/extract_trainer_ai_flags.py
```

The extractor reads the `gTrainers` pointer at `0x0800FC00`, decodes trainer
records of size `0x28`, and pulls `aiFlags` from offset `0x1C`. App trainer
labels are matched to ROM trainers by decoded trainer name, level range, and
party size. When the selected Battle-page trainer has a match, its checkboxes
for `CHECK_BAD_MOVE`, `SEMI_SMART`, and `CHECK_GOOD_MOVE` are initialized from
the ROM instead of using the old all-smart default.

## Legacy FireRed AI Block

The original FireRed enemy move-choice AI script table is still present at ROM
offset `0x1D9BF4` (`0x081D9BF4` as a GBA pointer).

The legacy script block spans:

```text
0x1D9BF4..0x1DBCEE
```

This block is the FireRed battle AI script table and bytecode script data.
Compared against a local FireRed BPRE ROM, the Radical Red block is byte-for-byte
identical after normalizing internal GBA pointers. The only difference is
relocation:

```text
vanilla FireRed table: 0x081D9C64
Radical Red table:    0x081D9BF4
delta:                -0x70
```

Because the AI core is hooked into expanded ROM, this legacy block should be
treated as leftover/reference data, not the active next-move algorithm.

The leftover FireRed table has 32 entries. The meaningful old entries are:

| Bit | Script | Purpose |
| --- | --- | --- |
| `0` | `AI_CheckBadMove` | Penalizes unusable, immune, redundant, or strategically poor moves. |
| `1` | `AI_CheckViability` | Applies move-effect heuristics. |
| `2` | `AI_TryToFaint` | Rewards moves that can KO. |
| `3` | `AI_SetupFirstTurn` | Encourages first-turn setup/status moves. |
| `4` | `AI_Risky` | Encourages riskier choices. |
| `5` | `AI_PreferStrongestMove` | Rewards the most powerful damaging move. |
| `6` | `AI_PreferBatonPass` | Rewards Baton Pass style choices. |
| `7` | `AI_DoubleBattle` | Old double-battle heuristics. |
| `8` | `AI_HPAware` | Old HP-aware adjustments. |
| `9` | `AI_Unknown` | Sunny Day first-turn preference. |
| `29` | `AI_Roaming` | Flee behavior for roaming encounters. |
| `30` | `AI_Safari` | Safari flee/watch behavior. |
| `31` | `AI_FirstBattle` | Scripted first-battle flee behavior. |

Entries `10..28` are returns.

## Verification Notes

The local legacy-script comparison used:

- Radical Red table: `0x1D9BF4`
- FireRed table: `0x1D9C64`
- Compared length: `0x20FA`
- Raw byte differences: `1578`, all caused by relocated internal pointers.
- Normalized differences: `0`

Normalized comparison means every 4-byte GBA pointer that targets the AI block was
converted to a relative offset before comparing.
