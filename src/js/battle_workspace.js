/* global $, calc, gen, notation, createPokemon, getTrainerRosterEntries, getCustomSetEntries, getSetSelectorInput, getRosterSpriteUrl, handleTrainerSpriteError, getHardcoreTrainerCanonicalName, TRAINER_AI_FLAGS */

(function () {
	var state = null;
	var DEFAULT_FIELD_TURNS = {
		weather: 5,
		terrain: 5,
		trickRoom: 5,
		gravity: 5,
		reflect: 5,
		lightScreen: 5,
		auroraVeil: 5,
		tailwind: 4
	};
	var ROM_AI_FLAGS = {
		CHECK_BAD_MOVE: 0x1,
		SEMI_SMART: 0x2,
		CHECK_GOOD_MOVE: 0x4
	};
	var STAT_IDS = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"];
	var STAT_LABELS = {
		atk: "Atk",
		def: "Def",
		spa: "SpA",
		spd: "SpD",
		spe: "Spe",
		accuracy: "Acc",
		evasion: "Eva"
	};
	var GUARANTEED_STAT_MOVES = {
		"belly drum": {self: {atk: 12}},
		"bulk up": {self: {atk: 1, def: 1}},
		"calm mind": {self: {spa: 1, spd: 1}},
		"coil": {self: {atk: 1, def: 1, accuracy: 1}},
		"cosmic power": {self: {def: 1, spd: 1}},
		"dragon dance": {self: {atk: 1, spe: 1}},
		"growth": {self: {atk: 1, spa: 1}},
		"hone claws": {self: {atk: 1, accuracy: 1}},
		"iron defense": {self: {def: 2}},
		"nasty plot": {self: {spa: 2}},
		"no retreat": {self: {atk: 1, def: 1, spa: 1, spd: 1, spe: 1}},
		"quiver dance": {self: {spa: 1, spd: 1, spe: 1}},
		"rock polish": {self: {spe: 2}},
		"shell smash": {self: {atk: 2, spa: 2, spe: 2, def: -1, spd: -1}},
		"shift gear": {self: {atk: 1, spe: 2}},
		"swords dance": {self: {atk: 2}},
		"work up": {self: {atk: 1, spa: 1}},
		"agility": {self: {spe: 2}},
		"acid armor": {self: {def: 2}},
		"amnesia": {self: {spd: 2}},
		"barrier": {self: {def: 2}},
		"defense curl": {self: {def: 1}},
		"double team": {self: {evasion: 1}},
		"minimize": {self: {evasion: 2}},
		"sharpen": {self: {atk: 1}},
		"withdraw": {self: {def: 1}},
		"growl": {target: {atk: -1}},
		"tail whip": {target: {def: -1}},
		"leer": {target: {def: -1}},
		"charm": {target: {atk: -2}},
		"cotton spore": {target: {spe: -2}},
		"fake tears": {target: {spd: -2}},
		"feather dance": {target: {atk: -2}},
		"metal sound": {target: {spd: -2}},
		"scary face": {target: {spe: -2}},
		"screech": {target: {def: -2}},
		"string shot": {target: {spe: -2}},
		"sweet scent": {target: {evasion: -2}},
		"tickle": {target: {atk: -1, def: -1}},
		"parting shot": {target: {atk: -1, spa: -1}}
	};
	var SECONDARY_STAT_HINTS = {
		"focus blast": "10% chance to lower target SpD by 1",
		"shadow ball": "20% chance to lower target SpD by 1",
		"psychic": "10% chance to lower target SpD by 1",
		"earth power": "10% chance to lower target SpD by 1",
		"energy ball": "10% chance to lower target SpD by 1",
		"flash cannon": "10% chance to lower target SpD by 1",
		"crunch": "20% chance to lower target Def by 1",
		"iron tail": "30% chance to lower target Def by 1",
		"rock smash": "50% chance to lower target Def by 1",
		"icy wind": "lowers target Spe by 1",
		"mud shot": "lowers target Spe by 1",
		"rock tomb": "lowers target Spe by 1",
		"charge beam": "70% chance to raise user's SpA by 1",
		"meteor mash": "20% chance to raise user's Atk by 1"
	};
	var FLINCH_IMMUNE_ABILITIES = {
		"Inner Focus": true,
		"Shield Dust": true
	};
	var TYPE_ABSORB_ABILITIES = {
		Fire: {"Flash Fire": true},
		Electric: {"Volt Absorb": true, "Lightning Rod": true, "Motor Drive": true},
		Water: {"Water Absorb": true, "Dry Skin": true, "Storm Drain": true},
		Grass: {"Sap Sipper": true}
	};
	var STAT_DROP_IMMUNE_ABILITIES = {
		"Clear Body": true,
		"White Smoke": true,
		"Full Metal Body": true
	};
	var INTIMIDATE_IMMUNE_ABILITIES = {
		"Hyper Cutter": true,
		"Inner Focus": true,
		"Own Tempo": true,
		"Oblivious": true,
		"Scrappy": true
	};
	var WEATHER_ENTRY_ABILITIES = {
		"Drizzle": "Rain",
		"Drought": "Sun",
		"Sand Stream": "Sand",
		"Snow Warning": "Snow",
		"Desolate Land": "Harsh Sunshine",
		"Primordial Sea": "Heavy Rain",
		"Delta Stream": "Strong Winds",
		"Orichalcum Pulse": "Sun"
	};
	var TERRAIN_ENTRY_ABILITIES = {
		"Electric Surge": "Electric",
		"Hadron Engine": "Electric",
		"Grassy Surge": "Grassy",
		"Misty Surge": "Misty",
		"Psychic Surge": "Psychic"
	};
	var CFRU_SWITCH = {
		KO_FOE: 31,
		RESIST_ALL_MOVES: 17,
		REVENGE_KILL: 8,
		WALLS_FOE: 2,
		CAN_2HKO: 2,
		OUTSPEEDS: 14,
		WEAK_TO_MOVE: 1,
		FAINTS_FROM_FOE: 39,
		FAINTS_FROM_FOE_BUT_OUTSPEEDS: 15,
		SCORE_MAX: 70,
		FLAG_KO_FOE: 1,
		FLAG_RESIST_ALL_MOVES: 2,
		FLAG_REVENGE_KILL: 4,
		FLAG_WALLS_FOE: 8,
		FLAG_CAN_2HKO: 16,
		FLAG_CAN_REMOVE_HAZARDS: 32,
		FLAG_OUTSPEEDS: 64,
		FLAG_FAINTS_FROM_FOE: 128
	};

	function clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function formatPercent(value) {
		return Math.round(value * 10) / 10 + "%";
	}

	function formatSigned(value) {
		return (value >= 0 ? "+" : "") + value;
	}

	function formatHpPercent(damage, hp) {
		if (!hp) return "0%";
		return formatPercent(100 * damage / hp);
	}

	function displayDamageHits(damage) {
		if (typeof damage === "number") return String(damage);
		if (!damage || !damage.length) return "0";
		if (damage.length > 2) return damage.join(", ");
		if (typeof damage[0] === "number" && typeof damage[1] === "number") {
			return "1st hit: " + damage[0] + "; 2nd hit: " + damage[1];
		}
		return "1st hit: " + damage[0].join(", ") + "; 2nd hit: " + damage[1].join(", ");
	}

	function averageDamage(damage) {
		if (typeof damage === "number") return damage;
		if (!damage || !damage.length) return 0;
		if (typeof damage[0] === "number") {
			var total = 0;
			for (var i = 0; i < damage.length; i++) total += damage[i];
			return Math.round(total / damage.length);
		}
		return averageDamage(damage[0]) + averageDamage(damage[1]);
	}

	function maxDamage(damage) {
		if (typeof damage === "number") return damage;
		if (!damage || !damage.length) return 0;
		if (typeof damage[0] === "number") return Math.max.apply(Math, damage);
		return maxDamage(damage[0]) + maxDamage(damage[1]);
	}

	function minDamage(damage) {
		if (typeof damage === "number") return damage;
		if (!damage || !damage.length) return 0;
		if (typeof damage[0] === "number") return Math.min.apply(Math, damage);
		return minDamage(damage[0]) + minDamage(damage[1]);
	}

	function damageRollChanceToKO(damage, hp) {
		if (typeof damage === "number") return damage >= hp ? 1 : 0;
		if (!damage || !damage.length) return 0;
		if (typeof damage[0] !== "number") {
			return damageRollChanceToKO([averageDamage(damage)], hp);
		}
		var hits = 0;
		for (var i = 0; i < damage.length; i++) {
			if (damage[i] >= hp) hits++;
		}
		return hits / damage.length;
	}

	function getMovePriority(move) {
		if (!move) return 0;
		if (move.priority !== undefined) return move.priority;
		var data = window.moves && window.moves[move.name];
		return data && data.priority ? data.priority : 0;
	}

	function getMonLabel(mon) {
		if (!mon) return "";
		return mon.nickname || mon.name || mon.pokemonName || mon.fullSetName || "Pokemon";
	}

	function moveId(name) {
		return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
	}

	function getBlankBoosts() {
		var boosts = {};
		for (var i = 0; i < STAT_IDS.length; i++) boosts[STAT_IDS[i]] = 0;
		return boosts;
	}

	function normalizeBoosts(boosts) {
		var normalized = getBlankBoosts();
		boosts = boosts || {};
		for (var i = 0; i < STAT_IDS.length; i++) {
			normalized[STAT_IDS[i]] = clamp(Number(boosts[STAT_IDS[i]]) || 0, -6, 6);
		}
		return normalized;
	}

	function formatBoostValue(value) {
		value = Number(value) || 0;
		return value > 0 ? "+" + value : String(value);
	}

	function formatBoostSummary(boosts) {
		boosts = normalizeBoosts(boosts);
		var parts = [];
		for (var i = 0; i < STAT_IDS.length; i++) {
			var stat = STAT_IDS[i];
			if (boosts[stat]) parts.push(STAT_LABELS[stat] + " " + formatBoostValue(boosts[stat]));
		}
		return parts.length ? parts.join(", ") : "No stat changes";
	}

	function getBoostedStatValue(pokemon, stat) {
		var stage = pokemon.boosts && pokemon.boosts[stat] ? pokemon.boosts[stat] : 0;
		var base = pokemon.rawStats && pokemon.rawStats[stat] ? pokemon.rawStats[stat] : pokemon.stats[stat];
		if (!stage) return pokemon.stats[stat];
		if (stage > 0) return Math.floor(base * (2 + stage) / 2);
		return Math.floor(base * 2 / (2 - stage));
	}

	function getEffectiveSpeed(pokemon, sideState) {
		var speed = getBoostedStatValue(pokemon, "spe");
		if (sideState && sideState.tailwind) speed *= 2;
		return speed;
	}

	function getMoveStatEffect(move) {
		if (!move) return null;
		var mapped = GUARANTEED_STAT_MOVES[moveId(move.name)];
		if (mapped) return mapped;
		if (move.dropsStats) {
			var stat = move.category === "Special" ? "spa" : "atk";
			var effect = {self: {}};
			effect.self[stat] = -move.dropsStats;
			return effect;
		}
		return null;
	}

	function getMoveStatHint(move) {
		if (!move) return "";
		var effect = getMoveStatEffect(move);
		var pieces = [];
		if (effect && effect.self) pieces.push("Self: " + formatBoostSummary(effect.self));
		if (effect && effect.target) pieces.push("Target: " + formatBoostSummary(effect.target));
		if (SECONDARY_STAT_HINTS[moveId(move.name)]) pieces.push(SECONDARY_STAT_HINTS[moveId(move.name)]);
		if (!pieces.length && move.secondaries) pieces.push("Has a secondary effect");
		return pieces.join("; ");
	}

	function getSpecialMoveHint(move) {
		if (!move) return "";
		var id = moveId(move.name);
		if (id === "fake out") return "AI: strong on first active turn, heavily punished after";
		if (id === "sucker punch") return "AI: prefers this if your selected action is an attacking move";
		if (id === "u turn" || id === "volt switch" || id === "flip turn" || id === "parting shot") return "AI: pivot move, favored when switching is attractive";
		if (id === "protect" || id === "detect" || id === "spiky shield" || id === "baneful bunker" || id === "kings shield") return "AI: scouting/stalling move, situational";
		return "";
	}

	function applyBoostDelta(mon, deltas) {
		if (!mon || !deltas) return "";
		mon.boosts = normalizeBoosts(mon.boosts);
		var changes = [];
		for (var i = 0; i < STAT_IDS.length; i++) {
			var stat = STAT_IDS[i];
			var delta = Number(deltas[stat]) || 0;
			if (!delta) continue;
			var before = mon.boosts[stat];
			mon.boosts[stat] = clamp(before + delta, -6, 6);
			if (mon.boosts[stat] !== before) {
				changes.push(STAT_LABELS[stat] + " " + formatBoostValue(mon.boosts[stat]));
			}
		}
		return changes.join(", ");
	}

	function resetBoosts(mon) {
		if (mon) mon.boosts = getBlankBoosts();
	}

	function isClearAmulet(mon) {
		return !!(mon && mon.item === "Clear Amulet");
	}

	function statDropBlockedByAbility(mon, stat, sourceAbility) {
		if (!mon) return false;
		if (isClearAmulet(mon)) return true;
		if (STAT_DROP_IMMUNE_ABILITIES[mon.ability]) return true;
		if (sourceAbility === "Intimidate") {
			if (stat === "atk" && INTIMIDATE_IMMUNE_ABILITIES[mon.ability]) return true;
			if (mon.ability === "Guard Dog") return true;
		}
		return false;
	}

	function applyReactiveStatAbility(mon, sourceAbility, logs) {
		if (!mon) return;
		var changes = "";
		if (mon.ability === "Defiant") {
			changes = applyBoostDelta(mon, {atk: 2});
			if (changes) logs.push(mon.name + "'s Defiant activated: " + changes + ".");
		} else if (mon.ability === "Competitive") {
			changes = applyBoostDelta(mon, {spa: 2});
			if (changes) logs.push(mon.name + "'s Competitive activated: " + changes + ".");
		} else if (mon.ability === "Rattled" && sourceAbility === "Intimidate") {
			changes = applyBoostDelta(mon, {spe: 1});
			if (changes) logs.push(mon.name + "'s Rattled activated: " + changes + ".");
		} else if (mon.ability === "Guard Dog" && sourceAbility === "Intimidate") {
			changes = applyBoostDelta(mon, {atk: 1});
			if (changes) logs.push(mon.name + "'s Guard Dog activated: " + changes + ".");
		}
	}

	function applyAbilityStatDrop(source, target, stat, amount, abilityName, logs) {
		if (!source || !target || !amount) return;
		if (target.ability === "Mirror Armor") {
			if (statDropBlockedByAbility(source, stat, abilityName)) {
				logs.push(target.name + "'s Mirror Armor reflected " + abilityName + ", but " + source.name + " blocked the stat drop.");
				return;
			}
			var reflected = applyBoostDelta(source, stat === "atk" ? {atk: amount} : stat === "def" ? {def: amount} : stat === "spa" ? {spa: amount} : stat === "spd" ? {spd: amount} : {spe: amount});
			if (reflected) {
				logs.push(target.name + "'s Mirror Armor reflected " + abilityName + ": " + source.name + " is now " + reflected + ".");
				applyReactiveStatAbility(source, abilityName, logs);
			}
			return;
		}
		if (statDropBlockedByAbility(target, stat, abilityName)) {
			logs.push(target.name + " blocked " + abilityName + ".");
			applyReactiveStatAbility(target, abilityName, logs);
			return;
		}
		var delta = {};
		delta[stat] = target.ability === "Contrary" ? -amount : amount;
		var changes = applyBoostDelta(target, delta);
		if (changes) {
			logs.push(source.name + "'s " + abilityName + " activated: " + target.name + " is now " + changes + ".");
			if (amount < 0 && target.ability !== "Contrary") applyReactiveStatAbility(target, abilityName, logs);
		}
	}

	function setEntryWeather(snapshot, abilityName, logs) {
		var weather = WEATHER_ENTRY_ABILITIES[abilityName];
		if (!weather) return;
		snapshot.field.weather = weather;
		snapshot.field.weatherTurns = DEFAULT_FIELD_TURNS.weather;
		logs.push(abilityName + " set " + weather + " for " + snapshot.field.weatherTurns + " turns.");
	}

	function setEntryTerrain(snapshot, abilityName, logs) {
		var terrain = TERRAIN_ENTRY_ABILITIES[abilityName];
		if (!terrain) return;
		snapshot.field.terrain = terrain;
		snapshot.field.terrainTurns = DEFAULT_FIELD_TURNS.terrain;
		logs.push(abilityName + " set " + terrain + " Terrain for " + snapshot.field.terrainTurns + " turns.");
	}

	function applyEntryAbilityEffectsForSide(snapshot, side, logs) {
		var source = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		var target = side === "player" ? activeOpponent(snapshot) : activePlayer(snapshot);
		if (!source || source.fainted || source.hp <= 0) return;
		logs = logs || snapshot.log;
		if (source.ability === "Intimidate" && target && !target.fainted && target.hp > 0) {
			applyAbilityStatDrop(source, target, "atk", -1, "Intimidate", logs);
		}
		if (source.ability === "Download" && target && !target.fainted && target.hp > 0) {
			var targetPokemon = pokemonFromBattleMon(target);
			var stat = getBoostedStatValue(targetPokemon, "def") < getBoostedStatValue(targetPokemon, "spd") ? "atk" : "spa";
			var downloadChanges = applyBoostDelta(source, stat === "atk" ? {atk: 1} : {spa: 1});
			if (downloadChanges) logs.push(source.name + "'s Download activated: " + downloadChanges + ".");
		}
		if (source.ability === "Intrepid Sword") {
			var swordChanges = applyBoostDelta(source, {atk: 1});
			if (swordChanges) logs.push(source.name + "'s Intrepid Sword activated: " + swordChanges + ".");
		}
		if (source.ability === "Dauntless Shield") {
			var shieldChanges = applyBoostDelta(source, {def: 1});
			if (shieldChanges) logs.push(source.name + "'s Dauntless Shield activated: " + shieldChanges + ".");
		}
		setEntryWeather(snapshot, source.ability, logs);
		setEntryTerrain(snapshot, source.ability, logs);
	}

	function applyEndOfTurnAbilityEffects(snapshot) {
		var sides = [activePlayer(snapshot), activeOpponent(snapshot)];
		for (var i = 0; i < sides.length; i++) {
			var mon = sides[i];
			if (!mon || mon.fainted || mon.hp <= 0) continue;
			if (mon.ability === "Speed Boost") {
				var speedChanges = applyBoostDelta(mon, {spe: 1});
				if (speedChanges) snapshot.log.push(mon.name + "'s Speed Boost activated: " + speedChanges + ".");
			}
		}
	}

	function isFirstActiveTurn(mon) {
		return !mon || !mon.turnsActive || mon.turnsActive <= 1;
	}

	function hasProtectionMove(pokemon) {
		if (!pokemon || !pokemon.moves) return false;
		for (var i = 0; i < pokemon.moves.length; i++) {
			var id = moveId(pokemon.moves[i] && pokemon.moves[i].name);
			if (id === "protect" || id === "detect" || id === "spiky shield" || id === "baneful bunker" || id === "kings shield" || id === "mat block") return true;
		}
		return false;
	}

	function advanceActiveTurnCounts(base, next, playerSwitched, opponentSwitched) {
		var nextPlayer = activePlayer(next);
		var nextOpponent = activeOpponent(next);
		if (playerSwitched) {
			nextPlayer.turnsActive = 1;
		} else if (nextPlayer.hp > 0 && next.playerActiveIndex === base.playerActiveIndex) {
			nextPlayer.turnsActive = Math.max(1, activePlayer(base).turnsActive || 1) + 1;
		}
		if (opponentSwitched) {
			nextOpponent.turnsActive = 1;
		} else if (nextOpponent.hp > 0 && next.opponentActiveIndex === base.opponentActiveIndex) {
			nextOpponent.turnsActive = Math.max(1, activeOpponent(base).turnsActive || 1) + 1;
		}
		if (nextPlayer.hp <= 0) nextPlayer.turnsActive = 0;
		if (nextOpponent.hp <= 0) nextOpponent.turnsActive = 0;
	}

	function getBlankFieldState() {
		return {
			weather: "",
			weatherTurns: 0,
			terrain: "",
			terrainTurns: 0,
			trickRoom: false,
			trickRoomTurns: 0,
			gravity: false,
			gravityTurns: 0,
			player: {
				stealthRock: false,
				spikes: 0,
				reflect: false,
				reflectTurns: 0,
				lightScreen: false,
				lightScreenTurns: 0,
				auroraVeil: false,
				auroraVeilTurns: 0,
				tailwind: false,
				tailwindTurns: 0
			},
			opponent: {
				stealthRock: false,
				spikes: 0,
				reflect: false,
				reflectTurns: 0,
				lightScreen: false,
				lightScreenTurns: 0,
				auroraVeil: false,
				auroraVeilTurns: 0,
				tailwind: false,
				tailwindTurns: 0
			}
		};
	}

	function flagsFromRawAIFlags(aiFlags) {
		aiFlags = Number(aiFlags) || 0;
		return {
			checkBadMove: !!(aiFlags & ROM_AI_FLAGS.CHECK_BAD_MOVE),
			semiSmart: !!(aiFlags & ROM_AI_FLAGS.SEMI_SMART),
			checkGoodMove: !!(aiFlags & ROM_AI_FLAGS.CHECK_GOOD_MOVE)
		};
	}

	function getSetNameFromFullSet(fullSetName) {
		var text = fullSetName || "";
		var start = text.indexOf("(");
		var end = text.lastIndexOf(")");
		if (start !== -1 && end > start) return text.substring(start + 1, end);
		return text;
	}

	function getTrainerAIFlagMetadata(opponentSet) {
		var flags = window.TRAINER_AI_FLAGS || {};
		var setName = getSetNameFromFullSet(opponentSet);
		var keys = [opponentSet, setName];
		if (typeof getHardcoreTrainerCanonicalName === "function") {
			keys.push(getHardcoreTrainerCanonicalName(setName));
			keys.push(getHardcoreTrainerCanonicalName(opponentSet));
		}
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key && flags[key]) {
				var meta = clone(flags[key]);
				meta.lookupKey = key;
				return meta;
			}
		}
		return null;
	}

	function describeTrainerAIFlagMetadata(meta) {
		if (!meta) return "No ROM trainer flag match found; using editable defaults.";
		var source = meta.lookupSource === "variant-alias" ? "variant alias" :
			meta.lookupSource === "level-size-fallback" ? "ROM level/party-size fallback" :
				meta.lookupSource === "name-level-ambiguous" ? "ambiguous ROM name/level match" :
					"ROM name/level match";
		var names = meta.flagNames && meta.flagNames.length ? meta.flagNames.join(", ") : "none";
		return "Loaded " + names + " from trainer #" + meta.trainerId + " " + meta.trainerName + " (" + source + ", key: " + meta.lookupKey + ").";
	}

	function getBlankAIState(opponentTeam, trainerMeta) {
		var memory = {};
		opponentTeam = opponentTeam || [];
		for (var i = 0; i < opponentTeam.length; i++) {
			memory[opponentTeam[i].index] = false;
		}
		var flags = trainerMeta && trainerMeta.aiFlags !== undefined ? flagsFromRawAIFlags(trainerMeta.aiFlags) : {
			checkBadMove: true,
			semiSmart: true,
			checkGoodMove: true
		};
		return {
			flags: flags,
			trainer: trainerMeta || null,
			fightingStyle: "damager",
			switchingCooldown: 0,
			typeAbsorbCooldown: 0,
			wishCounter: 0,
			trapped: false,
			skyDrop: false,
			predictionMatchedLastTurn: true,
			lastPlayerMoveName: "",
			previousPredictedPlayerMoveName: "",
			playerLockedMove: false,
			playerSemiInvulnerable: false,
			typeAbsorbMemory: memory
		};
	}

	function normalizeAIState(snapshot) {
		var ai = snapshot.ai || {};
		var defaults = getBlankAIState(snapshot.opponentTeam);
		ai.flags = ai.flags || {};
		ai.flags.checkBadMove = ai.flags.checkBadMove !== false;
		ai.flags.semiSmart = ai.flags.semiSmart !== false && (ai.flags.semiSmart === true || defaults.flags.semiSmart);
		ai.flags.checkGoodMove = ai.flags.checkGoodMove !== false && (ai.flags.checkGoodMove === true || defaults.flags.checkGoodMove);
		ai.trainer = ai.trainer || defaults.trainer || null;
		ai.fightingStyle = ai.fightingStyle || defaults.fightingStyle;
		ai.switchingCooldown = clamp(Number(ai.switchingCooldown) || 0, 0, 9);
		ai.typeAbsorbCooldown = clamp(Number(ai.typeAbsorbCooldown) || 0, 0, 9);
		ai.wishCounter = clamp(Number(ai.wishCounter) || 0, 0, 5);
		ai.trapped = !!ai.trapped;
		ai.skyDrop = !!ai.skyDrop;
		ai.predictionMatchedLastTurn = ai.predictionMatchedLastTurn !== false;
		ai.lastPlayerMoveName = ai.lastPlayerMoveName || "";
		ai.previousPredictedPlayerMoveName = ai.previousPredictedPlayerMoveName || "";
		ai.playerLockedMove = !!ai.playerLockedMove;
		ai.playerSemiInvulnerable = !!ai.playerSemiInvulnerable;
		ai.typeAbsorbMemory = ai.typeAbsorbMemory || {};
		for (var i = 0; i < snapshot.opponentTeam.length; i++) {
			var index = snapshot.opponentTeam[i].index;
			ai.typeAbsorbMemory[index] = !!ai.typeAbsorbMemory[index];
		}
		snapshot.ai = ai;
		return ai;
	}

	function isSmartAI(ai) {
		return !!(ai && ai.flags && (ai.flags.semiSmart || ai.flags.checkGoodMove));
	}

	function isDamagerAI(ai) {
		return !ai || ai.fightingStyle === "damager" || ai.fightingStyle === "sweeper";
	}

	function sideFromState(sideState) {
		return new calc.Side({
			isSR: !!sideState.stealthRock,
			spikes: Number(sideState.spikes) || 0,
			isReflect: !!sideState.reflect,
			isLightScreen: !!sideState.lightScreen,
			isAuroraVeil: !!sideState.auroraVeil,
			isTailwind: !!sideState.tailwind
		});
	}

	function fieldFromState(snapshot, opponentAttacking) {
		var fieldState = snapshot.field || getBlankFieldState();
		var field = new calc.Field({
			gameType: "Singles",
			weather: fieldState.weather || undefined,
			terrain: fieldState.terrain || undefined,
			isGravity: !!fieldState.gravity,
			attackerSide: sideFromState(fieldState.player),
			defenderSide: sideFromState(fieldState.opponent)
		});
		return opponentAttacking ? field.swap() : field;
	}

	function getPositiveNumber(selector) {
		return Math.max(0, Number($(selector).val()) || 0);
	}

	function setTimedValue(container, key, nextActive, oldActive, nextTurns, defaultTurns) {
		container[key] = !!nextActive;
		if (!nextActive) {
			container[key + "Turns"] = 0;
		} else if (!oldActive && nextTurns <= 0) {
			container[key + "Turns"] = defaultTurns;
		} else {
			container[key + "Turns"] = nextTurns;
		}
	}

	function setTimedSelectValue(container, key, nextValue, oldValue, nextTurns, defaultTurns) {
		container[key] = nextValue;
		if (!nextValue) {
			container[key + "Turns"] = 0;
		} else if (oldValue !== nextValue) {
			container[key + "Turns"] = defaultTurns;
		} else {
			container[key + "Turns"] = nextTurns;
		}
	}

	function decrementTimer(container, key, label, log) {
		var turnKey = key + "Turns";
		if (!container[key] || !container[turnKey]) return;
		container[turnKey] = Math.max(0, Number(container[turnKey]) - 1);
		if (container[turnKey] === 0) {
			container[key] = typeof container[key] === "boolean" ? false : "";
			log.push(label + " ended.");
		}
	}

	function decrementTimedFieldEffects(snapshot) {
		var field = snapshot.field;
		decrementTimer(field, "weather", "Weather", snapshot.log);
		decrementTimer(field, "terrain", "Terrain", snapshot.log);
		decrementTimer(field, "trickRoom", "Trick Room", snapshot.log);
		decrementTimer(field, "gravity", "Gravity", snapshot.log);
		decrementTimer(field.player, "reflect", "Your Reflect", snapshot.log);
		decrementTimer(field.player, "lightScreen", "Your Light Screen", snapshot.log);
		decrementTimer(field.player, "auroraVeil", "Your Aurora Veil", snapshot.log);
		decrementTimer(field.player, "tailwind", "Your Tailwind", snapshot.log);
		decrementTimer(field.opponent, "reflect", "Opponent Reflect", snapshot.log);
		decrementTimer(field.opponent, "lightScreen", "Opponent Light Screen", snapshot.log);
		decrementTimer(field.opponent, "auroraVeil", "Opponent Aurora Veil", snapshot.log);
		decrementTimer(field.opponent, "tailwind", "Opponent Tailwind", snapshot.log);
	}

	function updateAIStateAfterTurn(base, next, playerAction, opponentAction) {
		var ai = normalizeAIState(next);
		var didOpponentSwitch = !!(opponentAction && opponentAction.type === "switch");
		var predictedMoveName = base.prediction && base.prediction.aiPredictedPlayerMoveName ? base.prediction.aiPredictedPlayerMoveName : "";
		if (playerAction && playerAction.type === "move") {
			var playerPokemon = pokemonFromBattleMon(activePlayer(base));
			var actualMove = playerPokemon.moves[playerAction.index];
			var actualMoveName = actualMove && actualMove.name ? actualMove.name : "";
			ai.lastPlayerMoveName = actualMoveName;
			ai.previousPredictedPlayerMoveName = predictedMoveName;
			if (predictedMoveName) {
				ai.predictionMatchedLastTurn = moveId(predictedMoveName) === moveId(actualMoveName);
				if (!ai.predictionMatchedLastTurn) {
					next.log.push("AI prediction memory: expected " + predictedMoveName + ", saw " + actualMoveName + ".");
				}
			}
		} else if (playerAction && playerAction.type === "switch") {
			ai.lastPlayerMoveName = "";
			ai.previousPredictedPlayerMoveName = predictedMoveName;
			ai.predictionMatchedLastTurn = true;
		}
		if (didOpponentSwitch) {
			ai.switchingCooldown = Math.max(ai.switchingCooldown, 1);
			if (base.prediction && base.prediction.hardSwitch && base.prediction.hardSwitch.trigger === "FindMonThatAbsorbsOpponentsMove") {
				ai.typeAbsorbCooldown = Math.max(ai.typeAbsorbCooldown, 2);
				ai.typeAbsorbMemory[opponentAction.index] = true;
				ai.typeAbsorbMemory[base.opponentActiveIndex] = true;
			}
		} else {
			ai.switchingCooldown = Math.max(0, ai.switchingCooldown - 1);
			ai.typeAbsorbCooldown = Math.max(0, ai.typeAbsorbCooldown - 1);
		}
		if (ai.wishCounter) ai.wishCounter = Math.max(0, ai.wishCounter - 1);
	}

	function createBattlePokemon(fullSetName, side, index, currentPokemon) {
		var pokemon = currentPokemon || createPokemon(fullSetName);
		var name = pokemon.name || fullSetName.substring(0, fullSetName.indexOf(" ("));
		var hp = pokemon.curHP ? pokemon.curHP() : pokemon.maxHP();
		var max = pokemon.maxHP ? pokemon.maxHP() : hp;
		return {
			fullSetName: fullSetName,
			side: side,
			index: index,
			name: name,
			ability: pokemon.ability || "",
			item: pokemon.item || "",
			hp: hp,
			maxHp: max,
			turnsActive: currentPokemon ? 1 : 0,
			boosts: normalizeBoosts(pokemon.boosts),
			status: pokemon.status || "",
			fainted: hp <= 0,
			sprite: getRosterSpriteUrl(name)
		};
	}

	function getCurrentSet(side) {
		return getSetSelectorInput($(side + " .set-selector")).val();
	}

	function uniqueEntries(entries, fallbackSetName) {
		var seen = {};
		var result = [];
		for (var i = 0; i < entries.length; i++) {
			var id = entries[i].fullSetName;
			if (!id || seen[id]) continue;
			seen[id] = true;
			result.push(entries[i]);
		}
		if (!result.length && fallbackSetName) {
			result.push({fullSetName: fallbackSetName});
		}
		return result;
	}

	function buildInitialSnapshot() {
		var playerSet = getCurrentSet("#p1");
		var opponentSet = getCurrentSet("#p2");
		var playerEntries = uniqueEntries(getCustomSetEntries(), playerSet);
		var opponentEntries = uniqueEntries(getTrainerRosterEntries(opponentSet), opponentSet);
		var playerTeam = [];
		var opponentTeam = [];
		var playerActiveIndex = 0;
		var opponentActiveIndex = 0;
		var currentPlayer = createPokemon($("#p1"));
		var currentOpponent = createPokemon($("#p2"));

		for (var i = 0; i < playerEntries.length; i++) {
			var playerCurrent = playerEntries[i].fullSetName === playerSet ? currentPlayer : null;
			if (playerCurrent) playerActiveIndex = i;
			playerTeam.push(createBattlePokemon(playerEntries[i].fullSetName, "player", i, playerCurrent));
		}
		for (var j = 0; j < opponentEntries.length; j++) {
			var opponentCurrent = opponentEntries[j].fullSetName === opponentSet ? currentOpponent : null;
			if (opponentCurrent) opponentActiveIndex = j;
			opponentTeam.push(createBattlePokemon(opponentEntries[j].fullSetName, "opponent", j, opponentCurrent));
		}
		if (playerTeam[playerActiveIndex]) playerTeam[playerActiveIndex].turnsActive = Math.max(1, playerTeam[playerActiveIndex].turnsActive || 0);
		if (opponentTeam[opponentActiveIndex]) opponentTeam[opponentActiveIndex].turnsActive = Math.max(1, opponentTeam[opponentActiveIndex].turnsActive || 0);
		var trainerAIFlags = getTrainerAIFlagMetadata(opponentSet);

		var snapshot = {
			turn: 1,
			playerTeam: playerTeam,
			opponentTeam: opponentTeam,
			playerActiveIndex: playerActiveIndex,
			opponentActiveIndex: opponentActiveIndex,
			ai: getBlankAIState(opponentTeam, trainerAIFlags),
			field: getBlankFieldState(),
			selectedPlayerAction: null,
			selectedOpponentAction: null,
			prediction: null,
			log: ["Battle workspace opened."]
		};
		applyEntryAbilityEffectsForSide(snapshot, "player", snapshot.log);
		applyEntryAbilityEffectsForSide(snapshot, "opponent", snapshot.log);
		return snapshot;
	}

	function currentSnapshot() {
		return state.snapshots[state.currentIndex];
	}

	function pokemonFromBattleMon(mon) {
		var pokemon = createPokemon(mon.fullSetName);
		pokemon.originalCurHP = clamp(mon.hp, 0, pokemon.maxHP());
		pokemon.status = mon.status || "";
		pokemon.boosts = normalizeBoosts(mon.boosts);
		return pokemon;
	}

	function activePlayer(snapshot) {
		return snapshot.playerTeam[snapshot.playerActiveIndex];
	}

	function activeOpponent(snapshot) {
		return snapshot.opponentTeam[snapshot.opponentActiveIndex];
	}

	function calculateMove(attackerMon, defenderMon, moveIndex, snapshot, opponentAttacking) {
		var attacker = pokemonFromBattleMon(attackerMon);
		var defender = pokemonFromBattleMon(defenderMon);
		var move = attacker.moves[moveIndex];
		if (!move || move.name === "(No Move)") return null;
		return calc.calculate(gen, attacker, defender, move, fieldFromState(snapshot, opponentAttacking));
	}

	function safeCalculateMove(attackerMon, defenderMon, moveIndex, snapshot, opponentAttacking) {
		try {
			return calculateMove(attackerMon, defenderMon, moveIndex, snapshot, opponentAttacking);
		} catch (error) {
			return null;
		}
	}

	function getKoText(result) {
		if (!result || typeof result.kochance !== "function") return "";
		try {
			var ko = result.kochance(false);
			return ko && ko.text ? ko.text : "";
		} catch (error) {
			return "";
		}
	}

	function getFullDesc(result) {
		if (!result || typeof result.fullDesc !== "function") return "";
		try {
			return result.fullDesc(notation, false);
		} catch (error) {
			return "";
		}
	}

	function describeRawCalculation(result, defenderMon) {
		var raw = result.rawDesc || {};
		var move = result.move;
		var attacker = result.attacker;
		var defender = result.defender;
		var details = [];
		var attackStat = move.category === "Physical" ? "Atk " + getBoostedStatValue(attacker, "atk") : move.category === "Special" ? "SpA " + getBoostedStatValue(attacker, "spa") : "";
		var defenseStat = move.category === "Physical" ? "Def " + getBoostedStatValue(defender, "def") : move.category === "Special" ? "SpD " + getBoostedStatValue(defender, "spd") : "";
		var movePower = raw.moveBP || move.bp || 0;

		details.push("Move: " + move.type + " " + move.category + (movePower ? ", BP " + movePower : ""));
		if (attackStat || defenseStat) details.push("Stats: " + attackStat + (attackStat && defenseStat ? " into " : "") + defenseStat);
		details.push("HP checked: " + defenderMon.hp + "/" + defenderMon.maxHp + " current HP, " + defender.maxHP() + " max HP for percent range");
		if (raw.attackerAbility) details.push("Attacker ability: " + raw.attackerAbility);
		if (raw.attackerItem) details.push("Attacker item: " + raw.attackerItem);
		if (raw.defenderAbility) details.push("Defender ability: " + raw.defenderAbility);
		if (raw.defenderItem) details.push("Defender item: " + raw.defenderItem);
		if (raw.weather) details.push("Weather: " + raw.weather);
		if (raw.terrain) details.push("Terrain: " + raw.terrain);
		if (raw.isReflect) details.push("Reflect is active");
		if (raw.isLightScreen) details.push("Light Screen is active");
		if (raw.isAuroraVeil) details.push("Aurora Veil is active");
		if (raw.isBurned) details.push("Burn modifier is active");
		if (raw.isCritical) details.push("Critical hit is selected");
		if (raw.attackBoost) details.push("Attack boost: " + raw.attackBoost);
		if (raw.defenseBoost) details.push("Defense boost: " + raw.defenseBoost);
		if (raw.hits) details.push("Hits: " + raw.hits);
		return details;
	}

	function summarizeMoveResult(result, defenderMon) {
		var min = minDamage(result.damage);
		var max = maxDamage(result.damage);
		var avg = averageDamage(result.damage);
		return {
			min: min,
			max: max,
			avg: avg,
			minPct: defenderMon.maxHp ? 100 * min / defenderMon.maxHp : 0,
			maxPct: defenderMon.maxHp ? 100 * max / defenderMon.maxHp : 0,
			avgPct: defenderMon.maxHp ? 100 * avg / defenderMon.maxHp : 0,
			koChance: damageRollChanceToKO(result.damage, defenderMon.hp),
			rolls: displayDamageHits(result.damage),
			fullDesc: getFullDesc(result),
			koText: getKoText(result),
			calcDetails: describeRawCalculation(result, defenderMon)
		};
	}

	function getMoveButtonDamageText(side, moveIndex, snapshot) {
		var attacker = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		var defender = side === "player" ? activeOpponent(snapshot) : activePlayer(snapshot);
		var result = safeCalculateMove(attacker, defender, moveIndex, snapshot, side === "opponent");
		if (!result) return "";
		var summary = summarizeMoveResult(result, defender);
		var ko = summary.koChance > 0 ? ", " + formatPercent(100 * summary.koChance) + " KO" : "";
		return summary.min + "-" + summary.max + " (" + formatPercent(summary.minPct) + "-" + formatPercent(summary.maxPct) + ")" + ko;
	}

	function playerActionThreat(snapshot, playerAction) {
		if (!playerAction || playerAction.type !== "move") return {willMove: false};
		var result = calculateMove(activePlayer(snapshot), activeOpponent(snapshot), playerAction.index, snapshot, false);
		if (!result) return {willMove: false};
		return {
			willMove: true,
			result: result,
			move: result.move,
			min: minDamage(result.damage),
			max: maxDamage(result.damage),
			avg: averageDamage(result.damage),
			koChance: damageRollChanceToKO(result.damage, activeOpponent(snapshot).hp)
		};
	}

	function findMoveIndexByName(pokemon, moveName) {
		if (!pokemon || !pokemon.moves || !moveName) return -1;
		var id = moveId(moveName);
		for (var i = 0; i < pokemon.moves.length; i++) {
			if (moveId(pokemon.moves[i] && pokemon.moves[i].name) === id) return i;
		}
		return -1;
	}

	function getAIPredictedPlayerAction(snapshot, selectedPlayerAction) {
		if (!selectedPlayerAction || selectedPlayerAction.type !== "move") return selectedPlayerAction;
		var ai = normalizeAIState(snapshot);
		var playerActive = activePlayer(snapshot);
		var opponentActive = activeOpponent(snapshot);
		if (ai.lastPlayerMoveName && playerActive && opponentActive && playerActive.turnsActive > 1 && opponentActive.turnsActive > 1) {
			var lastMoveIndex = findMoveIndexByName(pokemonFromBattleMon(playerActive), ai.lastPlayerMoveName);
			if (lastMoveIndex !== -1) return {side: "player", type: "move", index: lastMoveIndex, inferredFromLastMove: true};
		}
		return selectedPlayerAction;
	}

	function wouldOpponentMoveFirst(player, opponent, playerMove, opponentMove, fieldState) {
		var playerPriority = getMovePriority(playerMove);
		var opponentPriority = getMovePriority(opponentMove);
		if (playerPriority !== opponentPriority) return opponentPriority > playerPriority;
		var playerSpeed = getEffectiveSpeed(player, fieldState && fieldState.player);
		var opponentSpeed = getEffectiveSpeed(opponent, fieldState && fieldState.opponent);
		if (fieldState && fieldState.trickRoom) return opponentSpeed < playerSpeed;
		return opponentSpeed > playerSpeed;
	}

	function getTurnOrderInfo(snapshot) {
		var playerPokemon = pokemonFromBattleMon(activePlayer(snapshot));
		var opponentPokemon = pokemonFromBattleMon(activeOpponent(snapshot));
		var playerAction = snapshot.selectedPlayerAction;
		var opponentAction = snapshot.selectedOpponentAction || choosePredictedOpponentAction(snapshot);
		var playerMove = playerAction && playerAction.type === "move" ? playerPokemon.moves[playerAction.index] : null;
		var opponentMove = opponentAction && opponentAction.type === "move" ? opponentPokemon.moves[opponentAction.index] : null;
		var playerPriority = playerMove ? getMovePriority(playerMove) : playerAction && playerAction.type === "switch" ? 6 : 0;
		var opponentPriority = opponentMove ? getMovePriority(opponentMove) : opponentAction && opponentAction.type === "switch" ? 6 : 0;
		var playerSpeed = getEffectiveSpeed(playerPokemon, snapshot.field.player);
		var opponentSpeed = getEffectiveSpeed(opponentPokemon, snapshot.field.opponent);
		var winner = "Tie";
		var reason = "";

		if (!playerAction) {
			winner = "Choose your action";
			reason = "Move order updates after you pick a move or switch.";
		} else if (playerPriority !== opponentPriority) {
			winner = playerPriority > opponentPriority ? "You move first" : "Opponent moves first";
			reason = "priority " + playerPriority + " vs " + opponentPriority;
		} else if (playerSpeed === opponentSpeed) {
			winner = "Speed tie";
			reason = "same priority and effective Speed";
		} else if (snapshot.field.trickRoom) {
			winner = playerSpeed < opponentSpeed ? "You move first" : "Opponent moves first";
			reason = "Trick Room: lower effective Speed moves first";
		} else {
			winner = playerSpeed > opponentSpeed ? "You move first" : "Opponent moves first";
			reason = "higher effective Speed moves first";
		}

		return {
			winner: winner,
			reason: reason,
			playerSpeed: playerSpeed,
			opponentSpeed: opponentSpeed,
			playerPriority: playerPriority,
			opponentPriority: opponentPriority,
			opponentAction: opponentAction
		};
	}

	function scoreOpponentMove(snapshot, moveIndex, playerThreat) {
		var opponentMon = activeOpponent(snapshot);
		var playerMon = activePlayer(snapshot);
		var result = safeCalculateMove(opponentMon, playerMon, moveIndex, snapshot, true);
		if (!result) return null;
		var opponentPokemon = result.attacker;
		var playerPokemon = result.defender;
		var move = result.move;
		var score = 100;
		var notes = [];
		var factors = [{label: "Base AI score", delta: 100, detail: "starting point for every legal move"}];
		var summary = summarizeMoveResult(result, playerMon);
		var avg = summary.avg;
		var max = summary.max;
		var min = summary.min;
		var koChance = summary.koChance;
		var damagePct = summary.avgPct;

		function add(delta, label, detail) {
			score += delta;
			factors.push({label: label, delta: delta, detail: detail || ""});
		}

		if (move.category === "Status") {
			add(-12, "Status move tax", "status moves need a reason to beat direct damage");
			if (playerThreat.koChance > 0.5) add(-25, "Under KO threat", "trainer is less likely to set up or status while likely to faint");
			if (/(swords dance|dragon dance|nasty plot|calm mind|shell smash|bulk up|quiver dance|agility|rock polish)/i.test(move.name)) {
				add(opponentMon.hp > opponentMon.maxHp / 2 ? 20 : -15, "Setup heuristic", "setup is favored at healthy HP and punished when low");
				notes.push("setup heuristic");
			}
			if (/(recover|roost|moonlight|synthesis|soft-boiled|slack off|shore up)/i.test(move.name)) {
				add(opponentMon.hp < opponentMon.maxHp / 2 ? 26 : -20, "Recovery heuristic", "recovery is favored below half HP");
				notes.push("recovery heuristic");
			}
			if (/(toxic|will-o-wisp|thunder wave|spore|sleep powder|stun spore|glare)/i.test(move.name)) {
				add(playerMon.status ? -30 : 12, "Status heuristic", "status is punished if the target already has a status");
				notes.push("status heuristic");
			}
		} else {
			add(Math.round(damagePct / 3), "Damage pressure", "average damage is " + formatPercent(damagePct) + " of your max HP");
			if (min >= playerMon.hp) {
				add(55, "Guaranteed KO", "minimum roll KOs your current HP");
				notes.push("guaranteed KO");
			} else if (max >= playerMon.hp) {
				add(Math.round(35 * koChance), "Possible KO", formatPercent(100 * koChance) + " of damage rolls KO");
				notes.push("possible KO");
			}
			if (max <= 0) {
				score = 0;
				factors.push({label: "No damage", delta: -100, detail: "move cannot affect the target in this state"});
				notes.push("no damage");
			}
		}

		if (playerThreat.willMove && !wouldOpponentMoveFirst(playerPokemon, opponentPokemon, playerThreat.move, move, snapshot.field)) {
			if (playerThreat.min >= opponentMon.hp) {
				add(-45, "Gets KOed first", "your selected move KOs before this move can happen");
				notes.push("gets KOed first");
			} else if (playerThreat.max >= opponentMon.hp) {
				add(-Math.round(25 * playerThreat.koChance), "May be KOed first", "your selected move can KO before this move");
				notes.push("may be KOed first");
			}
		}

		if (getMovePriority(move) > 0 && koChance > 0) {
			add(15, "Priority KO pressure", "priority can bypass speed order when it threatens a KO");
			notes.push("priority KO pressure");
		}
		applySpecialMoveScoring(snapshot, move, result, playerThreat, add);

		return {
			index: moveIndex,
			move: move.name,
			score: Math.max(0, Math.round(score)),
			damage: result.damage,
			min: min,
			max: max,
			avg: avg,
			minPct: summary.minPct,
			maxPct: summary.maxPct,
			avgPct: summary.avgPct,
			koChance: koChance,
			rolls: summary.rolls,
			fullDesc: summary.fullDesc,
			koText: summary.koText,
			calcDetails: summary.calcDetails,
			factors: factors,
			notes: notes
		};
	}

	function applySpecialMoveScoring(snapshot, move, result, playerThreat, add) {
		var id = moveId(move.name);
		var opponentMon = activeOpponent(snapshot);
		var playerMon = activePlayer(snapshot);
		var playerPokemon = result.defender;
		var switchTargets = null;
		var bestSwitch = null;

		if (id === "fake out") {
			if (isFirstActiveTurn(opponentMon)) {
				add(38, "Fake Out first active turn", "Fake Out is legal and valuable for guaranteed chip plus flinch pressure");
			} else {
				add(-120, "Fake Out already spent", "Fake Out only works on the user's first active turn");
			}
			if (FLINCH_IMMUNE_ABILITIES[playerPokemon.ability]) {
				add(-45, "Flinch immunity", playerMon.name + " has " + playerPokemon.ability);
			}
			if (playerPokemon.item === "Covert Cloak") {
				add(-35, "Covert Cloak", "target ignores Fake Out's flinch effect");
			}
			if (result.damage && maxDamage(result.damage) > 0 && playerMon.hp === playerMon.maxHp) {
				add(10, "Breaks full-HP safety", "chip can break Sash/Sturdy-style ranges");
			}
			return;
		}

		if (id === "sucker punch") {
			if (playerThreat.willMove && playerThreat.move && playerThreat.move.category !== "Status") {
				add(28, "Sucker Punch into attack", "your selected action is an attacking move");
			} else if (playerThreat.willMove) {
				add(-55, "Sucker Punch into status", "your selected move is not an attack");
			} else {
				add(-35, "Sucker Punch into switch", "your selected action does not attack");
			}
			return;
		}

		if (id === "u turn" || id === "volt switch" || id === "flip turn" || id === "parting shot") {
			switchTargets = predictSwitchIns(snapshot, null);
			bestSwitch = switchTargets.length ? switchTargets[0] : null;
			if (bestSwitch && bestSwitch.score >= 110) {
				add(22, "Pivot into strong bench option", bestSwitch.name + " is a strong follow-up switch");
			}
			if (playerThreat.willMove && playerThreat.max >= opponentMon.hp) {
				add(-35, "Pivot may fail under KO threat", "your selected move can KO before the pivot matters");
			}
			if (id === "volt switch" && maxDamage(result.damage) <= 0) {
				add(-70, "Volt Switch blocked", "move appears unable to affect the target");
			}
			return;
		}

		if (id === "protect" || id === "detect" || id === "spiky shield" || id === "baneful bunker" || id === "kings shield") {
			add(playerThreat.willMove ? 12 : -25, "Protection scouting", playerThreat.willMove ? "can scout or stall your selected action" : "low value if you are switching");
			if (snapshot.field.weather || snapshot.field.terrain) {
				add(8, "Stalls timed field effect", "protect can spend a weather or terrain turn");
			}
			if (playerThreat.willMove && playerThreat.min >= opponentMon.hp) {
				add(40, "Protects from guaranteed KO", "your selected move would KO this turn");
			}
		}
	}

	function normalizeBestScores(scoredMoves) {
		var best = -1;
		var candidates = [];
		for (var i = 0; i < scoredMoves.length; i++) {
			if (scoredMoves[i].score > best) {
				best = scoredMoves[i].score;
				candidates = [scoredMoves[i]];
			} else if (scoredMoves[i].score === best) {
				candidates.push(scoredMoves[i]);
			}
		}
		for (var j = 0; j < scoredMoves.length; j++) {
			scoredMoves[j].chance = candidates.indexOf(scoredMoves[j]) !== -1 ? 100 / candidates.length : 0;
			scoredMoves[j].isBest = candidates.indexOf(scoredMoves[j]) !== -1;
		}
		scoredMoves.bestScore = best;
		scoredMoves.bestCount = candidates.length;
		return scoredMoves;
	}

	function predictOpponentMoves(snapshot, playerAction) {
		var playerThreat = playerActionThreat(snapshot, playerAction);
		var scoredMoves = [];
		var opponent = pokemonFromBattleMon(activeOpponent(snapshot));
		for (var i = 0; i < opponent.moves.length; i++) {
			var scored = scoreOpponentMove(snapshot, i, playerThreat);
			if (scored) scoredMoves.push(scored);
		}
		scoredMoves.sort(function (left, right) {
			return right.score - left.score;
		});
		return normalizeBestScores(scoredMoves);
	}

	function isDamagingMove(move) {
		return !!move && move.name !== "(No Move)" && move.category !== "Status";
	}

	function calcMoveBetweenPokemon(attacker, defender, move, field) {
		try {
			return calc.calculate(gen, attacker, defender, move, field);
		} catch (error) {
			return null;
		}
	}

	function flagLabels(flags) {
		var labels = [];
		if (flags & CFRU_SWITCH.FLAG_KO_FOE) labels.push("KOs foe");
		if (flags & CFRU_SWITCH.FLAG_RESIST_ALL_MOVES) labels.push("resists/immune to all moves");
		if (flags & CFRU_SWITCH.FLAG_REVENGE_KILL) labels.push("revenge priority");
		if (flags & CFRU_SWITCH.FLAG_WALLS_FOE) labels.push("walls foe");
		if (flags & CFRU_SWITCH.FLAG_CAN_2HKO) labels.push("2HKOs foe");
		if (flags & CFRU_SWITCH.FLAG_OUTSPEEDS) labels.push("outspeeds");
		if (flags & CFRU_SWITCH.FLAG_FAINTS_FROM_FOE) labels.push("faints from foe");
		return labels.length ? labels.join(", ") : "no CFRU switch flags";
	}

	function scoreSwitchIn(snapshot, benchMon, playerAction) {
		if (!benchMon || benchMon.fainted || benchMon.hp <= 0) return null;
		var active = activePlayer(snapshot);
		var opponentActive = activeOpponent(snapshot);
		var candidate = pokemonFromBattleMon(benchMon);
		var player = pokemonFromBattleMon(active);
		var opponentField = fieldFromState(snapshot, true);
		var playerField = fieldFromState(snapshot, false);
		var selectedIncoming = 0;
		var bestThreat = 0;
		var bestIncoming = 0;
		var bestIncomingMove = "";
		var playerNormalPressure = 0;
		var playerHasPhysical = false;
		var playerHasSpecial = false;
		var playerDamagingMoves = 0;
		var faintsFromMove = false;
		var isWeakToMove = false;
		var score = 0;
		var flags = 0;
		var factors = [{label: "CFRU switch score", delta: 0, detail: "Radical Red/CFRU starts switch candidates at 0 and adds flag weights"}];

		function add(delta, label, detail) {
			score += delta;
			factors.push({label: label, delta: delta, detail: detail || ""});
		}

		if (playerAction && playerAction.type === "move") {
			var selected = calcMoveBetweenPokemon(player, candidate, player.moves[playerAction.index], playerField);
			selectedIncoming = selected ? maxDamage(selected.damage) : 0;
		}

		if (getEffectiveSpeed(candidate, snapshot.field.opponent) >= getEffectiveSpeed(player, snapshot.field.player)) {
			add(CFRU_SWITCH.OUTSPEEDS, "Outspeeds", "CFRU +14 when the candidate's Speed is at least the foe's");
			flags |= CFRU_SWITCH.FLAG_OUTSPEEDS;
		}

		for (var j = 0; j < candidate.moves.length; j++) {
			if (!isDamagingMove(candidate.moves[j])) continue;
			var threat = calcMoveBetweenPokemon(candidate, player, candidate.moves[j], opponentField);
			if (!threat) continue;
			var threatMax = maxDamage(threat.damage);
			bestThreat = Math.max(bestThreat, threatMax);
			if (threatMax >= active.hp && !(flags & CFRU_SWITCH.FLAG_KO_FOE)) {
				add(CFRU_SWITCH.KO_FOE, "Can KO foe", "CFRU +31 when any candidate move can KO your active");
				flags |= CFRU_SWITCH.FLAG_KO_FOE;
			}
		}
		if (flags & CFRU_SWITCH.FLAG_KO_FOE) {
			for (var p = 0; p < candidate.moves.length; p++) {
				if (!isDamagingMove(candidate.moves[p]) || getMovePriority(candidate.moves[p]) <= 0) continue;
				var priorityThreat = calcMoveBetweenPokemon(candidate, player, candidate.moves[p], opponentField);
				if (priorityThreat && maxDamage(priorityThreat.damage) >= active.hp) {
					add(CFRU_SWITCH.REVENGE_KILL, "Revenge priority", "CFRU +8 for a priority move that KOs");
					flags |= CFRU_SWITCH.FLAG_REVENGE_KILL;
					if (!(flags & CFRU_SWITCH.FLAG_OUTSPEEDS)) {
						add(CFRU_SWITCH.OUTSPEEDS, "Priority acts like outspeeding", "CFRU also applies the outspeed flag for a priority revenge KO");
						flags |= CFRU_SWITCH.FLAG_OUTSPEEDS;
					}
					break;
				}
			}
		} else if (bestThreat >= active.hp / 2) {
			add(CFRU_SWITCH.CAN_2HKO, "Can 2HKO foe", "CFRU +2 when the candidate cannot KO but can deal at least half");
			flags |= CFRU_SWITCH.FLAG_CAN_2HKO;
		}

		for (var k = 0; k < player.moves.length; k++) {
			if (!isDamagingMove(player.moves[k])) continue;
			playerDamagingMoves++;
			if (player.moves[k].category === "Physical") playerHasPhysical = true;
			if (player.moves[k].category === "Special") playerHasSpecial = true;
			var incoming = calcMoveBetweenPokemon(player, candidate, player.moves[k], playerField);
			if (!incoming) continue;
			var incomingMax = maxDamage(incoming.damage);
			if (incomingMax > bestIncoming) {
				bestIncoming = incomingMax;
				bestIncomingMove = player.moves[k].name;
			}
			if (incomingMax >= benchMon.hp) faintsFromMove = true;
			else if (incomingMax >= benchMon.hp / 2) isWeakToMove = true;
			else if (incomingMax >= benchMon.hp / 3) playerNormalPressure++;
		}

		if (faintsFromMove) {
			if (!(flags & CFRU_SWITCH.FLAG_OUTSPEEDS)) {
				flags |= CFRU_SWITCH.FLAG_FAINTS_FROM_FOE;
				if (score >= CFRU_SWITCH.FAINTS_FROM_FOE) add(-CFRU_SWITCH.FAINTS_FROM_FOE, "Faints from foe", "CFRU -39 when the candidate can be KOed and does not outspeed");
				else {
					factors.push({label: "Faints from foe", delta: -score, detail: "CFRU floors the score at 0 when the -39 penalty would go below 0"});
					score = 0;
				}
			} else if (!(flags & CFRU_SWITCH.FLAG_KO_FOE)) {
				if (score >= CFRU_SWITCH.FAINTS_FROM_FOE_BUT_OUTSPEEDS) add(-CFRU_SWITCH.FAINTS_FROM_FOE_BUT_OUTSPEEDS, "Faints but outspeeds", "CFRU -15 when it outspeeds but cannot KO");
				else {
					factors.push({label: "Faints but outspeeds", delta: -score, detail: "CFRU floors the score at 0 when the -15 penalty would go below 0"});
					score = 0;
				}
			} else {
				isWeakToMove = true;
			}
		}

		if (isWeakToMove) {
			if (score >= CFRU_SWITCH.WEAK_TO_MOVE) add(-CFRU_SWITCH.WEAK_TO_MOVE, "Weak to a foe move", "CFRU -1 when a foe move can 2HKO or hit super effectively");
			else score = 0;
		} else if (!playerNormalPressure && playerDamagingMoves) {
			add(CFRU_SWITCH.RESIST_ALL_MOVES, "Resists all damaging moves", "CFRU +17 when no foe move reaches normal pressure");
			flags |= CFRU_SWITCH.FLAG_RESIST_ALL_MOVES;
		} else {
			var playerAtk = getBoostedStatValue(player, "atk");
			var playerSpa = getBoostedStatValue(player, "spa");
			var candidateDef = getBoostedStatValue(candidate, "def");
			var candidateSpd = getBoostedStatValue(candidate, "spd");
			var cantWall = (playerHasPhysical && candidateDef <= playerAtk) || (playerHasSpecial && candidateSpd <= playerSpa);
			if (!cantWall) {
				add(CFRU_SWITCH.WALLS_FOE, "Walls foe", "CFRU +2 when defenses beat the foe's relevant offenses");
				flags |= CFRU_SWITCH.FLAG_WALLS_FOE;
			}
		}

		factors.push({label: "Flags", delta: 0, detail: flagLabels(flags)});
		if (bestIncomingMove) factors.push({label: "Largest incoming range", delta: 0, detail: bestIncomingMove + " can deal up to " + bestIncoming});
		if (selectedIncoming) factors.push({label: "Selected move on switch", delta: 0, detail: "your selected move can deal up to " + selectedIncoming});

		return {
			index: benchMon.index,
			name: benchMon.name,
			hp: benchMon.hp,
			maxHp: benchMon.maxHp,
			score: Math.max(0, score),
			flags: flags,
			incomingDamage: selectedIncoming || bestIncoming,
			incomingPct: benchMon.maxHp ? 100 * (selectedIncoming || bestIncoming) / benchMon.maxHp : 0,
			bestIncomingDamage: bestIncoming,
			threatDamage: bestThreat,
			threatPct: active.maxHp ? 100 * bestThreat / active.maxHp : 0,
			factors: factors
		};
	}

	function predictSwitchIns(snapshot, playerAction) {
		var scores = [];
		for (var i = 0; i < snapshot.opponentTeam.length; i++) {
			if (i === snapshot.opponentActiveIndex) continue;
			var scored = scoreSwitchIn(snapshot, snapshot.opponentTeam[i], playerAction);
			if (!scored) continue;
			scores.push(scored);
		}
		scores.sort(function (left, right) {
			return right.score - left.score;
		});
		assignCfruSwitchTargetChances(scores, 100);
		return scores;
	}

	function assignCfruSwitchTargetChances(switchIns, overallChance) {
		var bestScore = switchIns.length ? switchIns[0].score : 0;
		var top = [];
		var nonFaintingTop = [];
		for (var i = 0; i < switchIns.length; i++) {
			switchIns[i].isBest = switchIns[i].score === bestScore;
			switchIns[i].conditionalChance = 0;
			switchIns[i].chance = 0;
			if (switchIns[i].isBest) {
				top.push(switchIns[i]);
				if (!(switchIns[i].flags & CFRU_SWITCH.FLAG_FAINTS_FROM_FOE)) nonFaintingTop.push(switchIns[i]);
			}
		}
		if (!top.length) return [];
		top = nonFaintingTop.length ? nonFaintingTop : top;

		if (top.length === 1) {
			top[0].conditionalChance = 100;
			top[0].chance = overallChance;
			return top;
		}

		for (var k = 0; k < top.length; k++) {
			top[k].conditionalChance = k <= 1 ? 100 / Math.pow(2, top.length - 1) : 100 / Math.pow(2, top.length - k);
			top[k].chance = overallChance * top[k].conditionalChance / 100;
		}
		return top;
	}

	function assignForcedSwitchTargetChances(switchIns, targetIndexes, overallChance) {
		var targets = [];
		var lookup = {};
		for (var i = 0; i < targetIndexes.length; i++) lookup[targetIndexes[i]] = true;
		for (var j = 0; j < switchIns.length; j++) {
			switchIns[j].isBest = !!lookup[switchIns[j].index];
			switchIns[j].conditionalChance = 0;
			switchIns[j].chance = 0;
			if (switchIns[j].isBest) targets.push(switchIns[j]);
		}
		if (!targets.length) return assignCfruSwitchTargetChances(switchIns, overallChance);
		for (var k = 0; k < targets.length; k++) {
			targets[k].conditionalChance = 100 / targets.length;
			targets[k].chance = overallChance * targets[k].conditionalChance / 100;
		}
		return targets;
	}

	function cfruSwitchTargetNote(bestTargets, bestScore) {
		if (!bestTargets.length) return "No healthy switch target.";
		if (bestTargets.length === 1) return "If switching, " + bestTargets[0].name + " is the unique best switch target and is treated as guaranteed.";
		return "If switching, " + bestTargets.length + " targets tie at CFRU switch score " + Math.round(bestScore) + "; the ROM resolves non-fainting ties with sequential 50% coin flips.";
	}

	function forcedSwitchTargetNote(targets, trigger) {
		if (!targets.length) return "No healthy switch target.";
		if (targets.length === 1) return trigger + " forces " + targets[0].name + " as the switch target.";
		return trigger + " has " + targets.length + " forced targets; split evenly in the workspace.";
	}

	function switchTargetIsSafe(target) {
		return !!target && !(target.flags & CFRU_SWITCH.FLAG_FAINTS_FROM_FOE);
	}

	function switchTargetCanAnswer(target) {
		if (!target) return false;
		if (target.flags & (CFRU_SWITCH.FLAG_RESIST_ALL_MOVES | CFRU_SWITCH.FLAG_WALLS_FOE)) return true;
		return (target.flags & (CFRU_SWITCH.FLAG_KO_FOE | CFRU_SWITCH.FLAG_OUTSPEEDS)) === (CFRU_SWITCH.FLAG_KO_FOE | CFRU_SWITCH.FLAG_OUTSPEEDS);
	}

	function abilityAbsorbsMove(ability, moveType) {
		return !!(TYPE_ABSORB_ABILITIES[moveType] && TYPE_ABSORB_ABILITIES[moveType][ability]);
	}

	function strongestAbsorbTarget(snapshot, playerThreat, switchIns) {
		if (!playerThreat.willMove || !playerThreat.move || !TYPE_ABSORB_ABILITIES[playerThreat.move.type]) return null;
		if (abilityAbsorbsMove(activeOpponent(snapshot).ability, playerThreat.move.type)) return null;
		for (var i = 0; i < switchIns.length; i++) {
			var mon = snapshot.opponentTeam[switchIns[i].index];
			if (mon && abilityAbsorbsMove(mon.ability, playerThreat.move.type)) return switchIns[i];
		}
		return null;
	}

	function wishPassTarget(snapshot, switchIns) {
		for (var i = 0; i < switchIns.length; i++) {
			var mon = snapshot.opponentTeam[switchIns[i].index];
			if (mon && mon.hp > 0 && mon.hp < mon.maxHp / 2 && switchTargetIsSafe(switchIns[i])) return switchIns[i];
		}
		return null;
	}

	function lockedMoveTarget(snapshot, playerThreat, switchIns) {
		if (!playerThreat.willMove || !playerThreat.move || playerThreat.move.category === "Status") return null;
		for (var i = 0; i < switchIns.length; i++) {
			if (switchIns[i].incomingDamage === 0 || switchIns[i].incomingDamage <= Math.max(1, switchIns[i].maxHp / 4)) {
				return switchIns[i];
			}
		}
		return null;
	}

	function setGate(gate, chance, trigger, detail, target) {
		gate.chance = clamp(chance, 0, 100);
		gate.trigger = trigger;
		if (detail) gate.factors.push({label: trigger, delta: 0, detail: detail});
		if (target) gate.targetIndexes = [target.index];
		return gate;
	}

	function evaluateCfruShouldSwitch(snapshot, playerAction, moves, playerThreat, switchIns) {
		var result = {
			chance: 0,
			trigger: "No ROM switch rule triggered",
			confidence: "decoded",
			factors: [],
			targetIndexes: null
		};
		var ai = normalizeAIState(snapshot);
		var opponentMon = activeOpponent(snapshot);
		var bestTarget = switchIns[0];
		var bestAttack = moves.length ? moves[0] : null;
		var opponentPokemon = pokemonFromBattleMon(opponentMon);
		var playerPokemon = pokemonFromBattleMon(activePlayer(snapshot));
		var predictedOpponentMove = bestAttack ? opponentPokemon.moves[bestAttack.index] : null;
		var playerMove = playerThreat && playerThreat.move ? playerThreat.move : null;
		var opponentMovesFirst = predictedOpponentMove && playerMove ? wouldOpponentMoveFirst(playerPokemon, opponentPokemon, playerMove, predictedOpponentMove, snapshot.field) : false;
		var activeHpPct = opponentMon.maxHp ? 100 * opponentMon.hp / opponentMon.maxHp : 0;
		var onlyBadMoves = moves.length > 0 && moves[0].score <= 0;
		var physicalMoves = 0;
		var specialMoves = 0;

		function add(label, detail) {
			result.factors.push({label: label, delta: 0, detail: detail || ""});
		}

		if (!bestTarget || !playerAction) return result;
		if (ai.trapped || ai.skyDrop) {
			result.trigger = "Cannot switch";
			add("Cannot switch", ai.trapped ? "active opponent is marked trapped" : "active opponent is marked in Sky Drop");
			return result;
		}
		add("Best switch target", bestTarget.name + " score " + Math.round(bestTarget.score) + " (" + flagLabels(bestTarget.flags) + ")");

		var absorbTarget = strongestAbsorbTarget(snapshot, playerThreat, switchIns);
		if (absorbTarget && !ai.typeAbsorbCooldown && ai.predictionMatchedLastTurn) {
			var usedBefore = !!ai.typeAbsorbMemory[absorbTarget.index];
			var absorbChance = usedBefore ? (ai.switchingCooldown ? 25 : 75) : 100;
			return setGate(result, absorbChance, "FindMonThatAbsorbsOpponentsMove", absorbTarget.name + " can absorb the predicted " + playerThreat.move.type + " move" + (usedBefore ? "; prior absorb memory applies the ROM random gate" : ""), absorbTarget);
		}
		if (absorbTarget && ai.typeAbsorbCooldown) add("Type absorb cooldown", "ROM blocks repeat type-absorb switches while the cooldown is active");
		if (absorbTarget && !ai.predictionMatchedLastTurn) add("Prediction memory", "ROM skips type-absorb switching after the same prior prediction was wrong");

		var wishTarget = ai.wishCounter ? wishPassTarget(snapshot, switchIns) : null;
		if (wishTarget) {
			if (opponentMon.hp < opponentMon.maxHp / 2 && (!playerThreat.willMove || playerThreat.max < opponentMon.hp || hasProtectionMove(pokemonFromBattleMon(opponentMon)))) {
				add("Wish stays active", "active opponent is below half and can likely keep the Wish for itself");
			} else {
				return setGate(result, 100, "PassOnWish", "Wish is pending and " + wishTarget.name + " is below half HP and safe enough to receive it", wishTarget);
			}
		}

		var lockedTarget = (ai.playerLockedMove || ai.playerSemiInvulnerable) ? lockedMoveTarget(snapshot, playerThreat, switchIns) : null;
		if (lockedTarget) {
			return setGate(result, 100, ai.playerSemiInvulnerable ? "SemiInvulnerableTroll" : "CanStopLockedMove", lockedTarget.name + " takes little or no damage from the locked predicted move", lockedTarget);
		}

		if (playerThreat.willMove && playerThreat.min >= opponentMon.hp && !opponentMovesFirst && activeHpPct > 20 && switchTargetIsSafe(bestTarget) && switchTargetCanAnswer(bestTarget)) {
			if (!isSmartAI(ai) || ai.switchingCooldown) {
				add("Avoid-death gate blocked", !isSmartAI(ai) ? "ROM only uses this path for smart AI" : "switching cooldown is active");
				return result;
			}
			result.chance = 100;
			result.trigger = "ShouldSwitchToAvoidDeath";
			add("Guaranteed incoming KO", "your selected move KOs before the active opponent can move");
			return result;
		}

		if (playerThreat.willMove && playerThreat.max >= opponentMon.hp && !opponentMovesFirst && activeHpPct > 20 && switchTargetIsSafe(bestTarget) && switchTargetCanAnswer(bestTarget)) {
			if (!isSmartAI(ai) || ai.switchingCooldown) {
				add("Avoid-death gate blocked", !isSmartAI(ai) ? "ROM only uses this path for smart AI" : "switching cooldown is active");
				return result;
			}
			result.chance = 100 * playerThreat.koChance;
			result.trigger = "ShouldSwitchToAvoidDeath roll-dependent";
			add("Possible incoming KO", formatPercent(100 * playerThreat.koChance) + " of rolls KO before the active opponent can move");
			return result;
		}

		for (var i = 0; i < opponentPokemon.moves.length; i++) {
			if (!isDamagingMove(opponentPokemon.moves[i])) continue;
			if (opponentPokemon.moves[i].category === "Physical") physicalMoves++;
			if (opponentPokemon.moves[i].category === "Special") specialMoves++;
		}
		if (opponentMon.boosts && ((opponentMon.boosts.atk <= -3 && physicalMoves && !specialMoves) || (opponentMon.boosts.spa <= -3 && specialMoves && !physicalMoves) || (opponentMon.boosts.atk <= -3 && opponentMon.boosts.spa <= -3 && physicalMoves && specialMoves) || opponentMon.boosts.accuracy <= -3) && switchTargetCanAnswer(bestTarget)) {
			if (ai.switchingCooldown || !isDamagerAI(ai)) {
				add("Offensive-stat gate blocked", ai.switchingCooldown ? "switching cooldown is active" : "fighting style is not a damager/sweeper class");
				return result;
			}
			result.chance = 100;
			result.trigger = "ShouldSwitchWhenOffensiveStatsAreLow";
			add("Offensive stat drop", "CFRU switches damagers at -3 relevant offense or accuracy when a safe answer exists");
			return result;
		}

		if (onlyBadMoves && switchTargetIsSafe(bestTarget) && (bestTarget.flags & (CFRU_SWITCH.FLAG_OUTSPEEDS | CFRU_SWITCH.FLAG_WALLS_FOE | CFRU_SWITCH.FLAG_RESIST_ALL_MOVES))) {
			if (ai.switchingCooldown) {
				add("Only-bad-moves gate blocked", "switching cooldown is active");
				return result;
			}
			result.chance = 100;
			result.trigger = "ShouldSwitchIfOnlyBadMovesLeft";
			add("Only bad moves left", "all attacking options scored at 0, while the switch target can move first or take hits");
			return result;
		}

		if (bestTarget.score >= CFRU_SWITCH.SCORE_MAX && switchTargetIsSafe(bestTarget)) {
			if (ai.switchingCooldown || !isSmartAI(ai) || !isDamagerAI(ai)) {
				add("Save-sweeper gate blocked", ai.switchingCooldown ? "switching cooldown is active" : "smart damager/sweeper AI state is required");
				return result;
			}
			result.chance = 50;
			result.trigger = "ShouldSaveSweeperForLater-style best-resist rule";
			add("Perfect switch score", "tracked AI state satisfies the smart damager/sweeper preconditions; ROM still has a random save-sweeper gate");
		}

		return result;
	}

	function predictHardSwitches(snapshot, playerAction, moves, playerThreat) {
		var switchIns = predictSwitchIns(snapshot, playerAction);
		var gate = evaluateCfruShouldSwitch(snapshot, playerAction, moves, playerThreat, switchIns);
		var result = {
			chance: gate.chance,
			score: switchIns.length ? switchIns[0].score : 0,
			attackScore: moves.length ? moves[0].score : 1,
			targets: switchIns,
			factors: gate.factors,
			trigger: gate.trigger,
			confidence: gate.confidence,
			targetChoiceNote: "No healthy switch target."
		};
		if (!switchIns.length || !playerAction) return result;

		var bestTargetScore = switchIns.length ? switchIns[0].score : 0;
		var bestTargets = gate.targetIndexes ?
			assignForcedSwitchTargetChances(switchIns, gate.targetIndexes, result.chance) :
			assignCfruSwitchTargetChances(switchIns, result.chance);
		result.targetChoiceNote = gate.targetIndexes ? forcedSwitchTargetNote(bestTargets, gate.trigger) : cfruSwitchTargetNote(bestTargets, bestTargetScore);
		return result;
	}

	function updatePrediction() {
		var snapshot = currentSnapshot();
		if (!snapshot || !snapshot.selectedPlayerAction) {
			snapshot.prediction = null;
			renderPrediction();
			return;
		}
		var aiPredictedPlayerAction = getAIPredictedPlayerAction(snapshot, snapshot.selectedPlayerAction);
		var moves = predictOpponentMoves(snapshot, aiPredictedPlayerAction);
		var playerThreat = playerActionThreat(snapshot, aiPredictedPlayerAction);
		var hardSwitch = predictHardSwitches(snapshot, aiPredictedPlayerAction, moves, playerThreat);
		var attackChance = 100 - hardSwitch.chance;
		var moveChoiceNote = moves.bestCount > 1 ?
			("If the trainer attacks, " + moves.bestCount + " moves tie at score " + moves.bestScore + " and are split randomly.") :
			("If the trainer attacks, the unique highest score " + moves.bestScore + " is treated as guaranteed.");
		for (var i = 0; i < moves.length; i++) {
			moves[i].conditionalChance = moves[i].chance;
			moves[i].chance = moves[i].chance * attackChance / 100;
		}
		var switchIns = playerThreat.koChance > 0 ? predictSwitchIns(snapshot, aiPredictedPlayerAction) : [];
		var selectedThreat = playerActionThreat(snapshot, snapshot.selectedPlayerAction);
		snapshot.prediction = {
			moves: moves,
			hardSwitch: hardSwitch,
			switchIns: switchIns,
			playerKoChance: playerThreat.koChance || 0,
			moveChoiceNote: moveChoiceNote,
			aiPredictedPlayerMoveName: playerThreat && playerThreat.move ? playerThreat.move.name : "",
			selectedPlayerMoveName: selectedThreat && selectedThreat.move ? selectedThreat.move.name : "",
			aiPredictedFromLastMove: !!(aiPredictedPlayerAction && aiPredictedPlayerAction.inferredFromLastMove)
		};
		renderPrediction();
	}

	function renderMiniMon(mon, side, activeIndex, isActive) {
		var hpPct = mon.maxHp ? clamp(100 * mon.hp / mon.maxHp, 0, 100) : 0;
		var active = isActive ? " battle-mon-active" : "";
		var fainted = mon.fainted || mon.hp <= 0 ? " battle-mon-fainted" : "";
		return '<button type="button" class="battle-mini-mon' + active + fainted + '" data-side="' + side + '" data-index="' + mon.index + '">' +
			'<img src="' + mon.sprite + '" alt="' + escapeHtml(mon.name) + '" onerror="window.handleTrainerSpriteError(this)">' +
			'<span>' + escapeHtml(getMonLabel(mon)) + '<small>' + escapeHtml(mon.ability || "No ability") + '</small></span>' +
			'<b style="width:' + hpPct + '%"></b>' +
			'</button>';
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function renderTeamLists() {
		var snapshot = currentSnapshot();
		var playerHtml = "";
		var opponentHtml = "";
		var deadHtml = "";
		for (var i = 0; i < snapshot.playerTeam.length; i++) {
			playerHtml += renderMiniMon(snapshot.playerTeam[i], "player", snapshot.playerActiveIndex, i === snapshot.playerActiveIndex);
		}
		for (var j = 0; j < snapshot.opponentTeam.length; j++) {
			if (snapshot.opponentTeam[j].fainted || snapshot.opponentTeam[j].hp <= 0) {
				deadHtml += renderMiniMon(snapshot.opponentTeam[j], "opponent", snapshot.opponentActiveIndex, false);
			} else {
				opponentHtml += renderMiniMon(snapshot.opponentTeam[j], "opponent", snapshot.opponentActiveIndex, j === snapshot.opponentActiveIndex);
			}
		}
		$("#battle-player-box").html(playerHtml);
		$("#battle-opponent-box").html(opponentHtml);
		$("#battle-dead-box").html(deadHtml || '<div class="battle-empty">No fainted opponents</div>');
	}

	function actionButtonClass(action, side, type, index) {
		if (!action || action.side !== side || action.type !== type) return "";
		return Number(action.index) === Number(index) ? " battle-action-selected" : "";
	}

	function renderBoostControls(mon, side) {
		mon.boosts = normalizeBoosts(mon.boosts);
		var html = '<div class="battle-stat-panel"><div class="battle-stat-summary">' + escapeHtml(formatBoostSummary(mon.boosts)) + '</div>';
		for (var i = 0; i < STAT_IDS.length; i++) {
			var stat = STAT_IDS[i];
			html += '<label>' + STAT_LABELS[stat] +
				'<input type="number" min="-6" max="6" class="battle-boost-input" data-side="' + side + '" data-stat="' + stat + '" value="' + mon.boosts[stat] + '">' +
				'</label>';
		}
		return html + '</div>';
	}

	function renderTurnOrder() {
		var snapshot = currentSnapshot();
		var info = getTurnOrderInfo(snapshot);
		var html = '<h3>Move Order</h3>' +
			'<div class="battle-order-row">' +
				'<span>Your Speed</span><b>' + info.playerSpeed + '</b><small>priority ' + info.playerPriority + '</small>' +
			'</div>' +
			'<div class="battle-order-row">' +
				'<span>Opponent Speed</span><b>' + info.opponentSpeed + '</b><small>priority ' + info.opponentPriority + '</small>' +
			'</div>' +
			'<div class="battle-order-result">' + escapeHtml(info.winner) + '<small>' + escapeHtml(info.reason) + '</small></div>';
		$("#battle-turn-order").html(html);
	}

	function renderActiveCard(side) {
		var snapshot = currentSnapshot();
		var mon = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		var pokemon = pokemonFromBattleMon(mon);
		var speed = getEffectiveSpeed(pokemon, snapshot.field[side]);
		var action = side === "player" ? snapshot.selectedPlayerAction : snapshot.selectedOpponentAction;
		var hpPct = mon.maxHp ? clamp(100 * mon.hp / mon.maxHp, 0, 100) : 0;
		var html = '<div class="battle-active-head">' +
			'<img src="' + mon.sprite + '" alt="' + escapeHtml(mon.name) + '" onerror="window.handleTrainerSpriteError(this)">' +
			'<div><h3>' + escapeHtml(mon.name) + '</h3><p>' + mon.hp + ' / ' + mon.maxHp + ' HP</p><p>Ability: ' + escapeHtml(mon.ability || pokemon.ability || "None") + '</p><p>Current Speed: ' + speed + '</p><p>Turns Active: ' + Math.max(0, mon.turnsActive || 0) + '</p></div>' +
			'</div>' +
			'<div class="battle-hpbar"><span style="width:' + hpPct + '%"></span></div>' +
			'<div class="battle-hp-edit">' +
			'<label>HP <input class="battle-hp-input" data-side="' + side + '" value="' + mon.hp + '"></label>' +
			'<button type="button" class="battle-faint-button" data-side="' + side + '">Faint</button>' +
			'</div>' +
			renderBoostControls(mon, side) +
			'<div class="battle-moves">';
		for (var i = 0; i < pokemon.moves.length; i++) {
			var move = pokemon.moves[i];
			if (!move || move.name === "(No Move)") continue;
			var damageText = getMoveButtonDamageText(side, i, snapshot);
			var statHint = getMoveStatHint(move);
			var specialHint = getSpecialMoveHint(move);
			html += '<button type="button" class="battle-action-button' + actionButtonClass(action, side, "move", i) +
				'" data-side="' + side + '" data-action="move" data-index="' + i + '">' +
				'<span>' + escapeHtml(move.name) + '</span>' +
				(damageText ? '<small>' + escapeHtml(damageText) + '</small>' : '') +
				(statHint ? '<small>' + escapeHtml(statHint) + '</small>' : '') +
				(specialHint ? '<small>' + escapeHtml(specialHint) + '</small>' : '') +
				'</button>';
		}
		html += '</div><div class="battle-switches">';
		var team = side === "player" ? snapshot.playerTeam : snapshot.opponentTeam;
		for (var j = 0; j < team.length; j++) {
			if (team[j].fainted || team[j].hp <= 0 || team[j].index === mon.index) continue;
			html += '<button type="button" class="battle-action-button battle-switch-button' + actionButtonClass(action, side, "switch", j) +
				'" data-side="' + side + '" data-action="switch" data-index="' + j + '">Switch: ' +
				escapeHtml(team[j].name) + '</button>';
		}
		html += '</div>';
		$("#battle-" + side + "-active").html(html);
	}

	function renderTimeline() {
		var html = "";
		for (var i = 0; i < state.snapshots.length; i++) {
			html += '<button type="button" class="battle-turn-button' + (i === state.currentIndex ? ' battle-turn-active' : '') +
				'" data-index="' + i + '">' + state.snapshots[i].turn + '</button>';
		}
		$("#battle-turns").html(html);
		$("#battle-clear-future").prop("disabled", state.currentIndex >= state.snapshots.length - 1);
	}

	function renderConditions() {
		var snapshot = currentSnapshot();
		var field = snapshot.field;
		$("#battle-weather").val(field.weather || "");
		$("#battle-weather-turns").val(field.weatherTurns || 0);
		$("#battle-terrain").val(field.terrain || "");
		$("#battle-terrain-turns").val(field.terrainTurns || 0);
		$("#battle-trick-room").prop("checked", !!field.trickRoom);
		$("#battle-trick-room-turns").val(field.trickRoomTurns || 0);
		$("#battle-gravity").prop("checked", !!field.gravity);
		$("#battle-gravity-turns").val(field.gravityTurns || 0);
		var sides = ["player", "opponent"];
		for (var i = 0; i < sides.length; i++) {
			var side = sides[i];
			$("#battle-" + side + "-sr").prop("checked", !!field[side].stealthRock);
			$("#battle-" + side + "-spikes").val(field[side].spikes);
			$("#battle-" + side + "-reflect").prop("checked", !!field[side].reflect);
			$("#battle-" + side + "-reflect-turns").val(field[side].reflectTurns || 0);
			$("#battle-" + side + "-screen").prop("checked", !!field[side].lightScreen);
			$("#battle-" + side + "-screen-turns").val(field[side].lightScreenTurns || 0);
			$("#battle-" + side + "-veil").prop("checked", !!field[side].auroraVeil);
			$("#battle-" + side + "-veil-turns").val(field[side].auroraVeilTurns || 0);
			$("#battle-" + side + "-tailwind").prop("checked", !!field[side].tailwind);
			$("#battle-" + side + "-tailwind-turns").val(field[side].tailwindTurns || 0);
		}
	}

	function renderAIControls() {
		var snapshot = currentSnapshot();
		var ai = normalizeAIState(snapshot);
		$("#battle-ai-bad").prop("checked", !!ai.flags.checkBadMove);
		$("#battle-ai-semi").prop("checked", !!ai.flags.semiSmart);
		$("#battle-ai-good").prop("checked", !!ai.flags.checkGoodMove);
		$("#battle-ai-style").val(ai.fightingStyle);
		$("#battle-ai-switch-cooldown").val(ai.switchingCooldown);
		$("#battle-ai-type-cooldown").val(ai.typeAbsorbCooldown);
		$("#battle-ai-wish-counter").val(ai.wishCounter);
		$("#battle-ai-trapped").prop("checked", !!ai.trapped);
		$("#battle-ai-skydrop").prop("checked", !!ai.skyDrop);
		$("#battle-ai-prediction-trusted").prop("checked", !!ai.predictionMatchedLastTurn);
		$("#battle-ai-player-locked").prop("checked", !!ai.playerLockedMove);
		$("#battle-ai-player-semi").prop("checked", !!ai.playerSemiInvulnerable);
		$("#battle-ai-source").text(describeTrainerAIFlagMetadata(ai.trainer));

		var html = "";
		for (var i = 0; i < snapshot.opponentTeam.length; i++) {
			var mon = snapshot.opponentTeam[i];
			html += '<label><input type="checkbox" class="battle-ai-absorb-memory" data-index="' + mon.index + '"' + (ai.typeAbsorbMemory[mon.index] ? " checked" : "") + '> ' + escapeHtml(mon.name) + '</label>';
		}
		$("#battle-ai-absorb-memory").html(html);
	}

	function renderPrediction() {
		var snapshot = currentSnapshot();
		var prediction = snapshot.prediction;
		if (!prediction) {
			$("#battle-prediction").html('<div class="battle-empty">Pick one of your moves or switches to predict the opponent response.</div>');
			return;
		}
		var html = '<h3>Prediction</h3>';
		if (prediction.aiPredictedPlayerMoveName && prediction.selectedPlayerMoveName && moveId(prediction.aiPredictedPlayerMoveName) !== moveId(prediction.selectedPlayerMoveName)) {
			html += '<p class="battle-note">AI move prediction is currently ' + escapeHtml(prediction.aiPredictedPlayerMoveName) + ' from observed history, while your selected action is ' + escapeHtml(prediction.selectedPlayerMoveName) + '. This matters for type-absorb hard switches.</p>';
		} else if (prediction.aiPredictedFromLastMove && prediction.aiPredictedPlayerMoveName) {
			html += '<p class="battle-note">AI move prediction is carrying forward the last observed player move: ' + escapeHtml(prediction.aiPredictedPlayerMoveName) + '.</p>';
		}
		html += '<div class="battle-prediction-section"><h4>Trainer action</h4>';
		html += '<div class="battle-prediction-row battle-prediction-summary">' +
			'<span>Attack</span>' +
			'<b>' + formatPercent(100 - prediction.hardSwitch.chance) + '</b>' +
			'<small>best attack score ' + prediction.hardSwitch.attackScore + '</small>' +
			'</div>';
		html += '<div class="battle-prediction-row battle-prediction-summary">' +
			'<span>Hard switch</span>' +
			'<b>' + formatPercent(prediction.hardSwitch.chance) + '</b>' +
			'<small>CFRU score ' + prediction.hardSwitch.score + '</small>' +
			'</div>';
		html += '<p class="battle-note">Switch gate: ' + escapeHtml(prediction.hardSwitch.trigger || "No ROM switch rule triggered") + (prediction.hardSwitch.confidence === "partial" ? " (partial state match)" : "") + '</p>';
		if (prediction.hardSwitch.factors.length) {
			html += '<details class="battle-prediction-details"><summary>Why hard switch is ' + formatPercent(prediction.hardSwitch.chance) + '</summary>';
			html += renderScoreFactors(prediction.hardSwitch.factors);
			html += '</details>';
		}
		html += '<p class="battle-note">Switching is checked before move choice. If that check does not trigger, the trainer picks a highest-scored legal move; only tied top scores are random.</p>';
		html += '</div>';
		html += '<div class="battle-prediction-section"><h4>Opponent move if attacking</h4>';
		html += '<p class="battle-note">' + escapeHtml(prediction.moveChoiceNote) + '</p>';
		for (var i = 0; i < prediction.moves.length; i++) {
			var move = prediction.moves[i];
			html += '<div class="battle-prediction-row">' +
				'<span>' + escapeHtml(move.move) + '</span>' +
				'<b>' + formatPercent(move.chance) + '</b>' +
				'<small>' + formatPercent(move.conditionalChance) + ' if attacking, score ' + move.score + '</small>' +
				'</div>';
			html += '<details class="battle-prediction-details">' +
				'<summary>' + escapeHtml(move.min + '-' + move.max + ' dmg (' + formatPercent(move.minPct) + '-' + formatPercent(move.maxPct) + '), ' + formatPercent(100 * move.koChance) + ' KO') + '</summary>' +
				'<div class="battle-calc-desc">' + escapeHtml(move.fullDesc || "") + '</div>' +
				'<div class="battle-calc-rolls">Rolls: ' + escapeHtml(move.rolls) + '</div>' +
				renderCalcDetails(move.calcDetails) +
				renderScoreFactors(move.factors) +
				'</details>';
		}
		html += '</div>';
		if (prediction.hardSwitch.targets.length) {
			html += '<div class="battle-prediction-section"><h4>Hard switch targets</h4>';
			html += '<p class="battle-note">' + escapeHtml(prediction.hardSwitch.targetChoiceNote) + '</p>';
			for (var h = 0; h < prediction.hardSwitch.targets.length; h++) {
				var target = prediction.hardSwitch.targets[h];
				html += '<div class="battle-prediction-row">' +
					'<span>' + escapeHtml(target.name) + '</span>' +
					'<b>' + formatPercent(target.chance) + '</b>' +
					'<small>' + formatPercent(target.conditionalChance) + ' if switching, CFRU score ' + Math.round(target.score) + (target.isBest ? ', best' : '') + '</small>' +
					'</div>';
				html += '<details class="battle-prediction-details">' +
					'<summary>takes up to ' + target.incomingDamage + ' (' + formatPercent(target.incomingPct) + '), threatens up to ' + target.threatDamage + ' (' + formatPercent(target.threatPct) + ')</summary>' +
					renderScoreFactors(target.factors) +
					'</details>';
			}
			html += '</div>';
		}
		if (prediction.switchIns.length) {
			html += '<div class="battle-prediction-section"><h4>If your move KOs (' + formatPercent(100 * prediction.playerKoChance) + ')</h4>';
			for (var j = 0; j < prediction.switchIns.length; j++) {
				var switchIn = prediction.switchIns[j];
				html += '<div class="battle-prediction-row">' +
					'<span>' + escapeHtml(switchIn.name) + '</span>' +
					'<b>' + formatPercent(switchIn.chance) + '</b>' +
					'<small>CFRU score ' + Math.round(switchIn.score) + '</small>' +
					'</div>';
			}
			html += '</div>';
		}
		html += '<p class="battle-note">Switch-in scores use the decoded RR 4.1/CFRU constants. The AI state panel now feeds the ROM switch gates for flags, fighting style, Wish, cooldowns, type-absorb memory, trapping, prediction trust, and locked-move checks.</p>';
		$("#battle-prediction").html(html);
	}

	function renderCalcDetails(details) {
		if (!details || !details.length) return "";
		var html = '<ul class="battle-calc-details">';
		for (var i = 0; i < details.length; i++) {
			html += '<li>' + escapeHtml(details[i]) + '</li>';
		}
		return html + '</ul>';
	}

	function renderScoreFactors(factors) {
		if (!factors || !factors.length) return "";
		var html = '<ul class="battle-score-factors">';
		for (var i = 0; i < factors.length; i++) {
			html += '<li><b>' + formatSigned(factors[i].delta) + '</b> ' + escapeHtml(factors[i].label);
			if (factors[i].detail) html += '<span>' + escapeHtml(factors[i].detail) + '</span>';
			html += '</li>';
		}
		return html + '</ul>';
	}

	function renderLog() {
		var snapshot = currentSnapshot();
		var html = "";
		for (var i = 0; i < snapshot.log.length; i++) {
			html += '<li>' + escapeHtml(snapshot.log[i]) + '</li>';
		}
		$("#battle-log").html(html);
	}

	function renderBattle() {
		if (!state) return;
		renderTeamLists();
		renderActiveCard("player");
		renderActiveCard("opponent");
		renderTimeline();
		renderConditions();
		renderAIControls();
		renderTurnOrder();
		renderPrediction();
		renderLog();
		$("#battle-turn-label").text("Turn " + currentSnapshot().turn);
	}

	function selectAction(side, type, index) {
		var snapshot = currentSnapshot();
		var action = {side: side, type: type, index: Number(index)};
		if (side === "player") {
			snapshot.selectedPlayerAction = action;
			updatePrediction();
		} else {
			snapshot.selectedOpponentAction = action;
		}
		renderBattle();
	}

	function updateHp(side, value) {
		var snapshot = currentSnapshot();
		var mon = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		mon.hp = clamp(Number(value) || 0, 0, mon.maxHp);
		mon.fainted = mon.hp <= 0;
		updatePrediction();
		renderBattle();
	}

	function updateBoost(side, stat, value) {
		var snapshot = currentSnapshot();
		var mon = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		if (!mon || STAT_IDS.indexOf(stat) === -1) return;
		mon.boosts = normalizeBoosts(mon.boosts);
		mon.boosts[stat] = clamp(Number(value) || 0, -6, 6);
		updatePrediction();
		renderBattle();
	}

	function setActive(side, index) {
		var snapshot = currentSnapshot();
		var team = side === "player" ? snapshot.playerTeam : snapshot.opponentTeam;
		var mon = team[index];
		if (!mon || mon.fainted || mon.hp <= 0) return;
		if ((side === "player" && Number(index) === snapshot.playerActiveIndex) || (side === "opponent" && Number(index) === snapshot.opponentActiveIndex)) return;
		if (side === "player") {
			activePlayer(snapshot).turnsActive = 0;
			resetBoosts(activePlayer(snapshot));
			snapshot.playerActiveIndex = Number(index);
		} else {
			activeOpponent(snapshot).turnsActive = 0;
			resetBoosts(activeOpponent(snapshot));
			snapshot.opponentActiveIndex = Number(index);
		}
		mon.turnsActive = 1;
		resetBoosts(mon);
		snapshot.log.push((side === "player" ? "Player" : "Opponent") + " active Pokemon set to " + mon.name + ".");
		applyEntryAbilityEffectsForSide(snapshot, side, snapshot.log);
		updatePrediction();
		renderBattle();
	}

	function faintActive(side) {
		var snapshot = currentSnapshot();
		var mon = side === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		mon.hp = 0;
		mon.fainted = true;
		snapshot.log.push(mon.name + " fainted.");
		updatePrediction();
		renderBattle();
	}

	function choosePredictedOpponentAction(snapshot) {
		if (snapshot.selectedOpponentAction) return snapshot.selectedOpponentAction;
		if (!snapshot.prediction) updatePrediction();
		if (!snapshot.prediction) return null;
		if (snapshot.prediction.hardSwitch && snapshot.prediction.hardSwitch.targets.length) {
			var topSwitch = snapshot.prediction.hardSwitch.targets[0];
			for (var i = 1; i < snapshot.prediction.hardSwitch.targets.length; i++) {
				if (snapshot.prediction.hardSwitch.targets[i].chance > topSwitch.chance) topSwitch = snapshot.prediction.hardSwitch.targets[i];
			}
			var topMoveChance = snapshot.prediction.moves.length ? snapshot.prediction.moves[0].chance : 0;
			if (topSwitch.chance > topMoveChance) {
				return {side: "opponent", type: "switch", index: topSwitch.index};
			}
		}
		if (!snapshot.prediction.moves.length) return null;
		return {side: "opponent", type: "move", index: snapshot.prediction.moves[0].index};
	}

	function applyMoveDamage(snapshot, attackerSide, moveIndex) {
		var attacker = attackerSide === "player" ? activePlayer(snapshot) : activeOpponent(snapshot);
		var defender = attackerSide === "player" ? activeOpponent(snapshot) : activePlayer(snapshot);
		var result = calculateMove(attacker, defender, moveIndex, snapshot, attackerSide === "opponent");
		if (!result) return null;
		var damage = averageDamage(result.damage);
		defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
		defender.fainted = defender.hp <= 0;
		var statEffect = getMoveStatEffect(result.move);
		var statLogs = [];
		if (statEffect && statEffect.self) {
			var selfChanges = applyBoostDelta(attacker, statEffect.self);
			if (selfChanges) statLogs.push(attacker.name + " is now " + selfChanges + ".");
		}
		if (statEffect && statEffect.target && !defender.fainted) {
			var targetChanges = applyBoostDelta(defender, statEffect.target);
			if (targetChanges) statLogs.push(defender.name + " is now " + targetChanges + ".");
		}
		return {
			move: result.move.name,
			damage: damage,
			defender: defender.name,
			fainted: defender.fainted,
			statLogs: statLogs
		};
	}

	function applyTurn() {
		var base = currentSnapshot();
		var next = clone(base);
		next.turn = base.turn + 1;
		next.log = base.log.slice();
		next.selectedPlayerAction = null;
		next.selectedOpponentAction = null;
		next.prediction = null;

		var playerAction = base.selectedPlayerAction;
		var opponentAction = choosePredictedOpponentAction(base);
		if (!playerAction) {
			alert("Choose your move or switch before applying the turn.");
			return;
		}

		if (playerAction.type === "switch") {
			resetBoosts(activePlayer(next));
			activePlayer(next).turnsActive = 0;
			next.playerActiveIndex = playerAction.index;
			activePlayer(next).turnsActive = 1;
			next.log.push("Player switched to " + activePlayer(next).name + ".");
		}
		if (opponentAction && opponentAction.type === "switch") {
			resetBoosts(activeOpponent(next));
			activeOpponent(next).turnsActive = 0;
			next.opponentActiveIndex = opponentAction.index;
			activeOpponent(next).turnsActive = 1;
			next.log.push("Opponent switched to " + activeOpponent(next).name + ".");
		}
		if (playerAction.type === "switch") applyEntryAbilityEffectsForSide(next, "player", next.log);
		if (opponentAction && opponentAction.type === "switch") applyEntryAbilityEffectsForSide(next, "opponent", next.log);

		if (playerAction.type === "move" || (opponentAction && opponentAction.type === "move")) {
			var playerMon = pokemonFromBattleMon(activePlayer(base));
			var opponentMon = pokemonFromBattleMon(activeOpponent(base));
			var playerMove = playerAction.type === "move" ? playerMon.moves[playerAction.index] : null;
			var opponentMove = opponentAction && opponentAction.type === "move" ? opponentMon.moves[opponentAction.index] : null;
			var opponentFirst = opponentMove && (!playerMove || wouldOpponentMoveFirst(playerMon, opponentMon, playerMove, opponentMove, base.field));
			var order = opponentFirst ? ["opponent", "player"] : ["player", "opponent"];
			for (var i = 0; i < order.length; i++) {
				if (order[i] === "player" && playerAction.type === "move" && activePlayer(next).hp > 0 && activeOpponent(next).hp > 0) {
					var playerResult = applyMoveDamage(next, "player", playerAction.index);
					if (playerResult) next.log.push("Player used " + playerResult.move + " for about " + playerResult.damage + " damage.");
					if (playerResult && playerResult.statLogs) next.log = next.log.concat(playerResult.statLogs);
				}
				if (order[i] === "opponent" && opponentAction && opponentAction.type === "move" && activePlayer(next).hp > 0 && activeOpponent(next).hp > 0) {
					var opponentResult = applyMoveDamage(next, "opponent", opponentAction.index);
					if (opponentResult) next.log.push("Opponent used " + opponentResult.move + " for about " + opponentResult.damage + " damage.");
					if (opponentResult && opponentResult.statLogs) next.log = next.log.concat(opponentResult.statLogs);
				}
			}
		}

		advanceActiveTurnCounts(base, next, playerAction.type === "switch", !!(opponentAction && opponentAction.type === "switch"));
		applyEndOfTurnAbilityEffects(next);
		updateAIStateAfterTurn(base, next, playerAction, opponentAction);
		decrementTimedFieldEffects(next);
		state.snapshots.splice(state.currentIndex + 1, 0, next);
		state.currentIndex++;
		renderBattle();
	}

	function clearFuture() {
		if (!state) return;
		state.snapshots = state.snapshots.slice(0, state.currentIndex + 1);
		renderBattle();
	}

	function updateFieldFromControls() {
		var snapshot = currentSnapshot();
		var field = snapshot.field;
		var oldWeather = field.weather;
		var oldTerrain = field.terrain;
		var oldTrickRoom = !!field.trickRoom;
		var oldGravity = !!field.gravity;
		setTimedSelectValue(field, "weather", $("#battle-weather").val(), oldWeather, getPositiveNumber("#battle-weather-turns"), DEFAULT_FIELD_TURNS.weather);
		setTimedSelectValue(field, "terrain", $("#battle-terrain").val(), oldTerrain, getPositiveNumber("#battle-terrain-turns"), DEFAULT_FIELD_TURNS.terrain);
		setTimedValue(field, "trickRoom", $("#battle-trick-room").prop("checked"), oldTrickRoom, getPositiveNumber("#battle-trick-room-turns"), DEFAULT_FIELD_TURNS.trickRoom);
		setTimedValue(field, "gravity", $("#battle-gravity").prop("checked"), oldGravity, getPositiveNumber("#battle-gravity-turns"), DEFAULT_FIELD_TURNS.gravity);
		var sides = ["player", "opponent"];
		for (var i = 0; i < sides.length; i++) {
			var side = sides[i];
			var sideState = field[side];
			var oldReflect = !!sideState.reflect;
			var oldLightScreen = !!sideState.lightScreen;
			var oldAuroraVeil = !!sideState.auroraVeil;
			var oldTailwind = !!sideState.tailwind;
			sideState.stealthRock = $("#battle-" + side + "-sr").prop("checked");
			sideState.spikes = Number($("#battle-" + side + "-spikes").val()) || 0;
			setTimedValue(sideState, "reflect", $("#battle-" + side + "-reflect").prop("checked"), oldReflect, getPositiveNumber("#battle-" + side + "-reflect-turns"), DEFAULT_FIELD_TURNS.reflect);
			setTimedValue(sideState, "lightScreen", $("#battle-" + side + "-screen").prop("checked"), oldLightScreen, getPositiveNumber("#battle-" + side + "-screen-turns"), DEFAULT_FIELD_TURNS.lightScreen);
			setTimedValue(sideState, "auroraVeil", $("#battle-" + side + "-veil").prop("checked"), oldAuroraVeil, getPositiveNumber("#battle-" + side + "-veil-turns"), DEFAULT_FIELD_TURNS.auroraVeil);
			setTimedValue(sideState, "tailwind", $("#battle-" + side + "-tailwind").prop("checked"), oldTailwind, getPositiveNumber("#battle-" + side + "-tailwind-turns"), DEFAULT_FIELD_TURNS.tailwind);
		}
		updatePrediction();
		renderBattle();
	}

	function updateAIFromControls() {
		var snapshot = currentSnapshot();
		var ai = normalizeAIState(snapshot);
		ai.flags.checkBadMove = $("#battle-ai-bad").prop("checked");
		ai.flags.semiSmart = $("#battle-ai-semi").prop("checked");
		ai.flags.checkGoodMove = $("#battle-ai-good").prop("checked");
		ai.fightingStyle = $("#battle-ai-style").val() || "damager";
		ai.switchingCooldown = clamp(Number($("#battle-ai-switch-cooldown").val()) || 0, 0, 9);
		ai.typeAbsorbCooldown = clamp(Number($("#battle-ai-type-cooldown").val()) || 0, 0, 9);
		ai.wishCounter = clamp(Number($("#battle-ai-wish-counter").val()) || 0, 0, 5);
		ai.trapped = $("#battle-ai-trapped").prop("checked");
		ai.skyDrop = $("#battle-ai-skydrop").prop("checked");
		ai.predictionMatchedLastTurn = $("#battle-ai-prediction-trusted").prop("checked");
		ai.playerLockedMove = $("#battle-ai-player-locked").prop("checked");
		ai.playerSemiInvulnerable = $("#battle-ai-player-semi").prop("checked");
		$(".battle-ai-absorb-memory").each(function () {
			ai.typeAbsorbMemory[$(this).attr("data-index")] = $(this).prop("checked");
		});
		updatePrediction();
		renderBattle();
	}

	function updateFieldFromControlsAfterClick() {
		setTimeout(updateFieldFromControls, 0);
	}

	function updateAIFromControlsAfterClick() {
		setTimeout(updateAIFromControls, 0);
	}

	function isAIControlElement(element) {
		return !!(element && element.matches && element.matches("#battle-ai-bad, #battle-ai-semi, #battle-ai-good, #battle-ai-style, #battle-ai-switch-cooldown, #battle-ai-type-cooldown, #battle-ai-wish-counter, #battle-ai-trapped, #battle-ai-skydrop, #battle-ai-prediction-trusted, #battle-ai-player-locked, #battle-ai-player-semi, .battle-ai-absorb-memory"));
	}

	function bindNativeAIEvents() {
		if (window.battleAIStateNativeEventsBound) return;
		window.battleAIStateNativeEventsBound = true;
		document.addEventListener("change", function (event) {
			if (isAIControlElement(event.target)) updateAIFromControls();
		});
		document.addEventListener("input", function (event) {
			if (isAIControlElement(event.target)) updateAIFromControls();
		});
		document.addEventListener("click", function (event) {
			if (isAIControlElement(event.target)) updateAIFromControlsAfterClick();
		});
	}

	function openBattleWorkspace() {
		state = {
			currentIndex: 0,
			snapshots: [buildInitialSnapshot()]
		};
		$(".wrapper > :not(#battle-workspace)").hide();
		$("#battle-workspace").show();
		renderBattle();
	}

	function closeBattleWorkspace() {
		$("#battle-workspace").hide();
		$(".wrapper > :not(#battle-workspace)").show();
	}

	function makeConditionControls(side, label) {
		return '<div class="battle-condition-side"><h4>' + label + '</h4>' +
			'<label><input type="checkbox" id="battle-' + side + '-sr"> Stealth Rock</label>' +
			'<label>Spikes <select id="battle-' + side + '-spikes"><option>0</option><option>1</option><option>2</option><option>3</option></select></label>' +
			'<label><input type="checkbox" id="battle-' + side + '-reflect"> Reflect <input type="number" min="0" max="8" class="battle-turn-input" id="battle-' + side + '-reflect-turns" aria-label="' + label + ' Reflect turns"></label>' +
			'<label><input type="checkbox" id="battle-' + side + '-screen"> Light Screen <input type="number" min="0" max="8" class="battle-turn-input" id="battle-' + side + '-screen-turns" aria-label="' + label + ' Light Screen turns"></label>' +
			'<label><input type="checkbox" id="battle-' + side + '-veil"> Aurora Veil <input type="number" min="0" max="8" class="battle-turn-input" id="battle-' + side + '-veil-turns" aria-label="' + label + ' Aurora Veil turns"></label>' +
			'<label><input type="checkbox" id="battle-' + side + '-tailwind"> Tailwind <input type="number" min="0" max="8" class="battle-turn-input" id="battle-' + side + '-tailwind-turns" aria-label="' + label + ' Tailwind turns"></label>' +
			'</div>';
	}

	function injectBattleWorkspace() {
		if ($("#battle-workspace").length) return;
		var html =
			'<section id="battle-workspace" class="battle-workspace" style="display:none">' +
				'<div class="battle-topbar">' +
					'<button type="button" class="trainer-nav-button" id="battle-back">Back to Calc</button>' +
					'<h2 id="battle-turn-label">Turn 1</h2>' +
					'<div id="battle-turns" class="battle-turns"></div>' +
					'<button type="button" class="trainer-nav-button" id="battle-clear-future">Clear Future</button>' +
				'</div>' +
				'<div class="battle-layout">' +
					'<aside class="battle-sidebox"><h3>Your Team</h3><div id="battle-player-box" class="battle-mini-list"></div></aside>' +
					'<main class="battle-main">' +
						'<div class="battle-active-grid">' +
							'<section><h2>Your Active</h2><div id="battle-player-active" class="battle-active-card"></div></section>' +
							'<section><h2>Opponent Active</h2><div id="battle-opponent-active" class="battle-active-card"></div></section>' +
						'</div>' +
						'<section class="battle-conditions"><h3>Battle Conditions</h3>' +
							'<div class="battle-condition-row">' +
								'<label>Weather <select id="battle-weather"><option value="">Clear</option><option>Sun</option><option>Rain</option><option>Sand</option><option>Hail</option><option>Snow</option><option>Harsh Sunshine</option><option>Heavy Rain</option><option>Strong Winds</option></select> <input type="number" min="0" max="8" class="battle-turn-input" id="battle-weather-turns" aria-label="Weather turns"></label>' +
								'<label>Terrain <select id="battle-terrain"><option value="">None</option><option>Electric</option><option>Grassy</option><option>Misty</option><option>Psychic</option></select> <input type="number" min="0" max="8" class="battle-turn-input" id="battle-terrain-turns" aria-label="Terrain turns"></label>' +
								'<label><input type="checkbox" id="battle-trick-room"> Trick Room <input type="number" min="0" max="8" class="battle-turn-input" id="battle-trick-room-turns" aria-label="Trick Room turns"></label>' +
								'<label><input type="checkbox" id="battle-gravity"> Gravity <input type="number" min="0" max="8" class="battle-turn-input" id="battle-gravity-turns" aria-label="Gravity turns"></label>' +
							'</div>' +
							'<div class="battle-condition-grid">' + makeConditionControls("player", "Your Side") + makeConditionControls("opponent", "Opponent Side") + '</div>' +
						'</section>' +
						'<section class="battle-conditions"><h3>Opponent AI State</h3>' +
							'<p class="battle-note" id="battle-ai-source"></p>' +
							'<div class="battle-condition-row">' +
								'<label><input type="checkbox" id="battle-ai-bad"> Check bad moves</label>' +
								'<label><input type="checkbox" id="battle-ai-semi"> Semi-smart</label>' +
								'<label><input type="checkbox" id="battle-ai-good"> Check good moves</label>' +
								'<label>Style <select id="battle-ai-style"><option value="damager">Damager</option><option value="sweeper">Sweeper</option><option value="stall">Stall</option><option value="support">Support</option><option value="balanced">Balanced</option></select></label>' +
							'</div>' +
							'<div class="battle-condition-row">' +
								'<label>Switch cooldown <input type="number" min="0" max="9" class="battle-ai-input" id="battle-ai-switch-cooldown"></label>' +
								'<label>Type absorb cooldown <input type="number" min="0" max="9" class="battle-ai-input" id="battle-ai-type-cooldown"></label>' +
								'<label>Wish counter <input type="number" min="0" max="5" class="battle-ai-input" id="battle-ai-wish-counter"></label>' +
								'<label><input type="checkbox" id="battle-ai-trapped"> Trapped</label>' +
								'<label><input type="checkbox" id="battle-ai-skydrop"> Sky Drop lock</label>' +
							'</div>' +
							'<div class="battle-condition-row">' +
								'<label><input type="checkbox" id="battle-ai-prediction-trusted"> Last prediction matched</label>' +
								'<label><input type="checkbox" id="battle-ai-player-locked"> Player locked into selected move</label>' +
								'<label><input type="checkbox" id="battle-ai-player-semi"> Player semi-invulnerable/locked move</label>' +
							'</div>' +
							'<div class="battle-condition-side"><h4>Prior Type-Absorb Switches</h4><div id="battle-ai-absorb-memory" class="battle-ai-memory"></div></div>' +
						'</section>' +
						'<section id="battle-turn-order" class="battle-turn-order"></section>' +
						'<section id="battle-prediction" class="battle-prediction"></section>' +
						'<section class="battle-history"><h3>Turn Log</h3><ol id="battle-log"></ol><button type="button" class="trainer-nav-button" id="battle-apply-turn">Apply Turn</button></section>' +
					'</main>' +
					'<aside class="battle-sidebox"><h3>Opponent Team</h3><div id="battle-opponent-box" class="battle-mini-list"></div><h3>Dead</h3><div id="battle-dead-box" class="battle-mini-list"></div></aside>' +
				'</div>' +
			'</section>';
		$(".wrapper").append(html);
	}

	function injectBattleButton() {
		if ($("#open-battle-workspace").length) return;
		var $nav = $("#p2 .trainer-poks-nav");
		if (!$nav.length) return;
		$nav.append('<button type="button" class="trainer-nav-button" id="open-battle-workspace">Battle</button>');
	}

	function bindEvents() {
		bindNativeAIEvents();
		$(document).on("click", "#open-battle-workspace", openBattleWorkspace);
		$(document).on("click", "#battle-back", closeBattleWorkspace);
		$(document).on("click", "#battle-clear-future", clearFuture);
		$(document).on("click", "#battle-apply-turn", applyTurn);
		$(document).on("click", ".battle-turn-button", function () {
			state.currentIndex = Number($(this).attr("data-index"));
			renderBattle();
		});
		$(document).on("click", ".battle-mini-mon", function () {
			setActive($(this).attr("data-side"), Number($(this).attr("data-index")));
		});
		$(document).on("click", ".battle-action-button", function () {
			selectAction($(this).attr("data-side"), $(this).attr("data-action"), $(this).attr("data-index"));
		});
		$(document).on("change keyup", ".battle-hp-input", function () {
			updateHp($(this).attr("data-side"), $(this).val());
		});
		$(document).on("change keyup", ".battle-boost-input", function () {
			updateBoost($(this).attr("data-side"), $(this).attr("data-stat"), $(this).val());
		});
		$(document).on("click", ".battle-faint-button", function () {
			faintActive($(this).attr("data-side"));
		});
		$(document).on("change keyup", "#battle-weather, #battle-terrain, #battle-workspace .battle-turn-input, #battle-player-sr, #battle-player-reflect, #battle-player-screen, #battle-player-veil, #battle-player-tailwind, #battle-opponent-sr, #battle-opponent-reflect, #battle-opponent-screen, #battle-opponent-veil, #battle-opponent-tailwind, #battle-player-spikes, #battle-opponent-spikes, #battle-trick-room, #battle-gravity", updateFieldFromControls);
		$(document).on("click", "#battle-player-sr, #battle-player-reflect, #battle-player-screen, #battle-player-veil, #battle-player-tailwind, #battle-opponent-sr, #battle-opponent-reflect, #battle-opponent-screen, #battle-opponent-veil, #battle-opponent-tailwind, #battle-trick-room, #battle-gravity", updateFieldFromControlsAfterClick);
		$(document).on("change keyup", "#battle-ai-bad, #battle-ai-semi, #battle-ai-good, #battle-ai-style, #battle-ai-switch-cooldown, #battle-ai-type-cooldown, #battle-ai-wish-counter, #battle-ai-trapped, #battle-ai-skydrop, #battle-ai-prediction-trusted, #battle-ai-player-locked, #battle-ai-player-semi, .battle-ai-absorb-memory", updateAIFromControls);
		$(document).on("click", "#battle-ai-bad, #battle-ai-semi, #battle-ai-good, #battle-ai-trapped, #battle-ai-skydrop, #battle-ai-prediction-trusted, #battle-ai-player-locked, #battle-ai-player-semi, .battle-ai-absorb-memory", updateAIFromControlsAfterClick);
	}

	$(document).ready(function () {
		injectBattleWorkspace();
		injectBattleButton();
		bindEvents();
	});
})();
