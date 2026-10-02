#!/usr/bin/env python3
"""Extract Radical Red trainer AI flags for the calculator trainer labels."""

from __future__ import annotations

import json
import re
import struct
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ROM = Path(r"C:\Users\Shadow\Documents\My Games\ROMS\Radical Red.gba")
OUTPUT = ROOT / "src" / "js" / "data" / "trainer_ai_flags.js"
TRAINER_TABLE_POINTER = 0x0800FC00
TRAINER_SIZE = 0x28
AI_FLAG_NAMES = (
    (0x1, "CHECK_BAD_MOVE"),
    (0x2, "SEMI_SMART"),
    (0x4, "CHECK_GOOD_MOVE"),
)


GBA_TEXT = {
    0x00: " ",
    0xAB: "!",
    0xAC: "?",
    0xAD: ".",
    0xAE: "-",
    0xB8: ",",
    0xBA: "/",
}
for index, char in enumerate("0123456789"):
    GBA_TEXT[0xA1 + index] = char
for index, char in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ"):
    GBA_TEXT[0xBB + index] = char
for index, char in enumerate("abcdefghijklmnopqrstuvwxyz"):
    GBA_TEXT[0xD5 + index] = char


CLASS_WORDS = set(
    """
    ACE TRAINER BUG CATCHER LASS YOUNGSTER CAMPER PICNICKER PICKNICKER SUPER
    NERD MANIAC GENTLEMAN CHANNELER BEAUTY BIRD KEEPER BIKER CUE BALL TAMER
    JUGGLER SCIENTIST BURGLAR BLACK BELT ROCKET LEFT RIGHT TESTER APPRENTICE
    SAILOR HIKER COACH CREATOR GATEKEEPER AROMA LADY CRUSH GIRL SWIMMER TUBER
    ROCKER PROFESSOR FISHERMAN POKE DRAGON TWINS RANGER KIN GANG BOSS DUMASS
    """.split()
)
SPECIAL_NAME_PHRASES = (
    ("LT SURGE", "LT SURGE"),
    ("JOJO FAN", "JOJO FAN"),
    ("RAY TYRA", "RAY TYRA"),
    ("JOY MEG", "JOY MEG"),
    ("MIK KIA", "MIK KIA"),
)
LITERAL_TRAINER_NAMES = ("GRUNT", "GUARD", "GHOST", "KID", "CREATOR", "SPIRIT")


def gba_offset(address: int) -> int:
    if not 0x08000000 <= address < 0x0A000000:
        raise ValueError(f"not a GBA ROM address: {address:#x}")
    return address - 0x08000000


def read_u32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<I", data, offset)[0]


def decode_gba_text(raw: bytes) -> str:
    chars: list[str] = []
    for byte in raw:
        if byte == 0xFF:
            break
        chars.append(GBA_TEXT.get(byte, ""))
    return re.sub(r"\s+", " ", "".join(chars)).strip()


def key(text: str) -> str:
    return re.sub(r"[^A-Z0-9]+", " ", text.upper()).strip()


def load_setdexes() -> dict[str, dict]:
    script = r"""
const fs = require("fs");
const vm = require("vm");
const out = {};
for (const mode of ["normal", "hardcore"]) {
	const code = fs.readFileSync(`src/js/data/sets/${mode}.js`, "utf8");
	const ctx = {};
	vm.runInNewContext(code, ctx, {filename: mode});
	out[mode] = ctx.SETDEX_SV;
}
console.log(JSON.stringify(out));
"""
    output = subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True)
    return json.loads(output)


def load_app_teams() -> dict[str, dict]:
    teams: dict[str, dict] = {}
    for mode, setdex in load_setdexes().items():
        for pokemon_sets in setdex.values():
            for set_name, set_data in pokemon_sets.items():
                if set_name == "Blank Set" or set_data.get("isCustomSet"):
                    continue
                team = teams.setdefault(set_name, {"levels": [], "modes": set()})
                team["levels"].append(int(set_data.get("level") or 0))
                team["modes"].add(mode)
    return teams


def load_rom_trainers(rom: bytes) -> list[dict]:
    table = gba_offset(read_u32(rom, gba_offset(TRAINER_TABLE_POINTER)))
    trainers: list[dict] = []
    for trainer_id in range(1, 743):
        offset = table + trainer_id * TRAINER_SIZE
        party_size = rom[offset + 0x20]
        party_pointer = read_u32(rom, offset + 0x24)
        if not (1 <= party_size <= 6 and 0x08000000 <= party_pointer < 0x0A000000):
            continue
        party_offset = gba_offset(party_pointer)
        mon_size = 16 if rom[offset] & 0x1 else 8
        levels = [
            struct.unpack_from("<H", rom, party_offset + index * mon_size + 0x2)[0]
            for index in range(party_size)
        ]
        name = decode_gba_text(rom[offset + 0x04 : offset + 0x10])
        trainers.append(
            {
                "trainerId": trainer_id,
                "trainerName": name,
                "trainerKey": key(name),
                "trainerClassId": rom[offset + 0x01],
                "partySize": party_size,
                "minLevel": min(levels),
                "maxLevel": max(levels),
                "doubleBattle": bool(rom[offset + 0x18]),
                "aiFlags": read_u32(rom, offset + 0x1C),
            }
        )
    return trainers


def trainer_name_candidates(set_name: str) -> list[str]:
    base = re.split(r"\s+-\s+", set_name, 1)[0]
    base = re.sub(r"\[[^\]]+\]", "", base).replace("(REMATCH)", "").strip()
    cleaned = (
        base.replace("BIRD KE. ", "BIRD KEEPER ")
        .replace("BIRD KE ", "BIRD KEEPER ")
        .replace("Brroks", "Brooks")
        .replace("RELLI", "RELI")
        .replace("Relli", "Reli")
    )
    label = key(cleaned)
    for phrase, candidate in SPECIAL_NAME_PHRASES:
        if phrase in label:
            return [candidate]
    if label.startswith("RIVAL"):
        return ["BRENDAN", "MAY", "BLUE", "GREEN", "RED"]

    names: list[str] = []
    for part in re.split(r"\s+AND\s+|\s*&\s*", cleaned):
        part_key = key(part)
        tokens = [token for token in part_key.split() if token not in CLASS_WORDS and not token.isdigit()]
        if tokens:
            names.append(" ".join(tokens))
            continue
        for literal in LITERAL_TRAINER_NAMES:
            if literal in part_key.split():
                names.append(literal)
                break
    return list(dict.fromkeys(names))


def choose_trainer(set_name: str, levels: list[int], by_name: dict[str, list[dict]]) -> tuple[dict | None, str]:
    candidates: list[dict] = []
    for name in trainer_name_candidates(set_name):
        candidates.extend(by_name.get(name, []))
    if not candidates:
        return None, "unmatched"

    team_size = len(levels)
    min_level = min(levels)
    max_level = max(levels)
    scored = []
    for trainer in candidates:
        score = (
            abs(trainer["maxLevel"] - max_level) * 3
            + abs(trainer["partySize"] - team_size) * 4
            + abs(trainer["minLevel"] - min_level)
        )
        scored.append((score, trainer))
    scored.sort(key=lambda item: (item[0], item[1]["trainerId"]))
    best_score = scored[0][0]
    best = [trainer for score, trainer in scored if score == best_score]
    if len({trainer["aiFlags"] for trainer in best}) > 1:
        return best[0], "name-level-ambiguous"
    return best[0], "name-level"


def choose_level_fallback(levels: list[int], trainers: list[dict]) -> tuple[dict | None, str]:
    team_size = len(levels)
    max_level = max(levels)
    matches = [
        trainer for trainer in trainers
        if trainer["partySize"] == team_size and trainer["maxLevel"] == max_level
    ]
    if matches and len({trainer["aiFlags"] for trainer in matches}) == 1:
        return matches[0], "level-size-fallback"
    return None, "unmatched"


def flag_names(ai_flags: int) -> list[str]:
    return [name for bit, name in AI_FLAG_NAMES if ai_flags & bit]


def add_aliases(entries: dict[str, dict]) -> None:
    grouped: dict[str, list[dict]] = {}
    for set_name, entry in entries.items():
        alias = re.sub(r"\s+\[[^\]]+\]$", "", set_name)
        if alias != set_name:
            grouped.setdefault(alias, []).append(entry)
    for alias, values in grouped.items():
        if alias not in entries and len({value["aiFlags"] for value in values}) == 1:
            entries[alias] = dict(values[0], lookupSource="variant-alias")


def build_entries(rom_path: Path) -> tuple[dict[str, dict], dict]:
    rom = rom_path.read_bytes()
    trainers = load_rom_trainers(rom)
    by_name: dict[str, list[dict]] = {}
    for trainer in trainers:
        by_name.setdefault(trainer["trainerKey"], []).append(trainer)

    entries: dict[str, dict] = {}
    unmatched: list[str] = []
    for set_name, team in load_app_teams().items():
        trainer, source = choose_trainer(set_name, team["levels"], by_name)
        if not trainer:
            trainer, source = choose_level_fallback(team["levels"], trainers)
            if not trainer:
                unmatched.append(set_name)
                continue
        ai_flags = trainer["aiFlags"]
        entries[set_name] = {
            "aiFlags": ai_flags,
            "flagNames": flag_names(ai_flags),
            "trainerId": trainer["trainerId"],
            "trainerName": trainer["trainerName"],
            "trainerClassId": trainer["trainerClassId"],
            "partySize": trainer["partySize"],
            "minLevel": trainer["minLevel"],
            "maxLevel": trainer["maxLevel"],
            "doubleBattle": trainer["doubleBattle"],
            "lookupSource": source,
        }
    add_aliases(entries)
    stats = {
        "rom": str(rom_path),
        "trainerTablePointer": f"{read_u32(rom, gba_offset(TRAINER_TABLE_POINTER)):#x}",
        "mapped": len(entries),
        "unmatched": sorted(unmatched),
    }
    return entries, stats


def emit_js(entries: dict[str, dict], stats: dict) -> str:
    payload = json.dumps(dict(sorted(entries.items())), indent=2, ensure_ascii=False)
    stats_json = json.dumps(stats, indent=2, ensure_ascii=False)
    return (
        "/* eslint-disable */\n"
        "// Generated by tools/extract_trainer_ai_flags.py from the local Radical Red ROM.\n"
        "(function () {\n"
        f"\tvar TRAINER_AI_FLAG_EXTRACT = {stats_json};\n"
        f"\tvar TRAINER_AI_FLAGS = {payload};\n"
        "\twindow.TRAINER_AI_FLAG_EXTRACT = TRAINER_AI_FLAG_EXTRACT;\n"
        "\twindow.TRAINER_AI_FLAGS = TRAINER_AI_FLAGS;\n"
        "}());\n"
    )


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--rom", type=Path, default=DEFAULT_ROM)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    entries, stats = build_entries(args.rom)
    args.output.write_text(emit_js(entries, stats), encoding="utf-8")
    print(f"wrote {args.output}")
    print(f"mapped {stats['mapped']} labels; unmatched {len(stats['unmatched'])}")


if __name__ == "__main__":
    main()
