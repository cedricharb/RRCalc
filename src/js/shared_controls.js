if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex) { // eslint-disable-line no-extend-native
		var k;
		if (this == null) {
			throw new TypeError('"this" equals null or n is undefined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

function startsWith(string, target) {
	return (string || '').slice(0, target.length) === target;
}

function endsWith(string, target) {
	return (string || '').slice(-target.length) === target;
}

var LEGACY_STATS_RBY = ["hp", "at", "df", "sl", "sp"];
var LEGACY_STATS_GSC = ["hp", "at", "df", "sa", "sd", "sp"];
var LEGACY_STATS = [[], LEGACY_STATS_RBY, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC, LEGACY_STATS_GSC];
var HIDDEN_POWER_REGEX = /Hidden Power (\w*)/;

var CALC_STATUS = {
	'Healthy': '',
	'Paralyzed': 'par',
	'Poisoned': 'psn',
	'Badly Poisoned': 'tox',
	'Burned': 'brn',
	'Asleep': 'slp',
	'Frostbitten': 'frz'
};

function legacyStatToStat(st) {
	switch (st) {
	case 'hp':
		return "hp";
	case 'at':
		return "atk";
	case 'df':
		return "def";
	case 'sa':
		return "spa";
	case 'sd':
		return "spd";
	case 'sp':
		return "spe";
	case 'sl':
		return "spc";
	}
}

// input field validation
var bounds = {
	"level": [0, 250],
	"base": [1, 255],
	"evs": [0, 252],
	"ivs": [0, 31],
	"dvs": [0, 15],
	"move-bp": [0, 65535]
};
for (var bounded in bounds) {
	attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
}
function attachValidation(clazz, min, max) {
	$("." + clazz).keyup(function () {
		validate($(this), min, max);
	});
}
function validate(obj, min, max) {
	obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

$("input:radio[name='format']").change(function () {
	var gameType = $("input:radio[name='format']:checked").val();
	if (gameType === 'Singles') {
		$("input:checkbox[name='ruin']:checked").prop("checked", false);
	}
	$(".format-specific." + gameType.toLowerCase()).each(function () {
		if ($(this).hasClass("gen-specific") && !$(this).hasClass("g" + gen)) {
			return;
		}
		$(this).show();
	});
	$(".format-specific").not("." + gameType.toLowerCase()).hide();
});

var defaultLevel = 100;
$("input:radio[name='defaultLevel']").change(function () {
	defaultLevel = $("input:radio[name='defaultLevel']:checked").val();
	$("#levelL1").val(defaultLevel);
	$("#levelR1").val(defaultLevel);
	$("#levelL1").trigger("change");
	$("#levelR1").trigger("change");
});

// auto-calc stats and current HP on change
$(".level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});
$(".nature").bind("keyup change", function () {
	calcStats($(this).closest(".poke-info"));
});
$(".hp .base, .hp .evs, .hp .ivs").bind("keyup change", function () {
	calcHP($(this).closest(".poke-info"));
});
$(".at .base, .at .evs, .at .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'at');
});
$(".df .base, .df .evs, .df .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'df');
});
$(".sa .base, .sa .evs, .sa .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sa');
});
$(".sd .base, .sd .evs, .sd .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sd');
});
$(".sp .base, .sp .evs, .sp .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), 'sp');
});
$(".sl .base").keyup(function () {
	calcStat($(this).closest(".poke-info"), 'sl');
});
$(".at .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'at');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".df .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'df');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sa .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sa');
	poke.find(".sd .dvs").val($(this).val());
	calcStat(poke, 'sd');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sp .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sp');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sl .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, 'sl');
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});

function getForcedTeraType(pokemonName) {
	if (startsWith(pokemonName, "Ogerpon-Cornerstone")) {
		return "Rock";
	} else if (startsWith(pokemonName, "Ogerpon-Hearthflame")) {
		return "Fire";
	} else if (pokemonName === "Ogerpon" || startsWith(pokemonName, "Ogerpon-Teal")) {
		return "Grass";
	} else if (startsWith(pokemonName, "Ogerpon-Wellspring")) {
		return "Water";
	} else if (startsWith(pokemonName, "Terapagos")) {
		return "Stellar";
	}
	return null;
}

function getHPDVs(poke) {
	return (~~poke.find(".at .dvs").val() % 2) * 8 +
(~~poke.find(".df .dvs").val() % 2) * 4 +
(~~poke.find(".sp .dvs").val() % 2) * 2 +
(~~poke.find(gen === 1 ? ".sl .dvs" : ".sa .dvs").val() % 2);
}

function calcStats(poke) {
	for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
		calcStat(poke, LEGACY_STATS[gen][i]);
	}
}

function calcCurrentHP(poke, max, percent, skipDraw) {
	var current = Math.round(Number(percent) * Number(max) / 100);
	poke.find(".current-hp").val(current);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return current;
}
function calcPercentHP(poke, max, current, skipDraw) {
	var percent = Math.round(100 * Number(current) / Number(max));
	if (percent === 0 && current > 0) {
		percent = 1;
	} else if (percent === 100 & current < max) {
		percent = 99;
	}

	poke.find(".percent-hp").val(percent);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return percent;
}
function drawHealthBar(poke, max, current) {
	var fillPercent = 100 * current / max;
	var fillColor = fillPercent > 50 ? "green" : fillPercent > 20 ? "yellow" : "red";

	var healthbar = poke.find(".hpbar");
	healthbar.addClass("hp-" + fillColor);
	var unwantedColors = ["green", "yellow", "red"];
	unwantedColors.splice(unwantedColors.indexOf(fillColor), 1);
	for (var i = 0; i < unwantedColors.length; i++) {
		healthbar.removeClass("hp-" + unwantedColors[i]);
	}
	healthbar.css("background", "linear-gradient(to right, " + fillColor + " " + fillPercent + "%, white 0%");
}
// TODO: these HP inputs should really be input type=number with min=0, step=1, constrained by max=maxHP or 100
$(".current-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, max);
	var current = $(this).val();
	calcPercentHP($(this).parent(), max, current);
});
$(".percent-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, 100);
	var percent = $(this).val();
	calcCurrentHP($(this).parent(), max, percent);
});

$(".ability").bind("keyup change", function () {
	var moveHits =
		$(this).val() === 'Skill Link' ? 5 :
			$(this).closest(".poke-info").find(".item").val() === 'Loaded Dice' ? 4 : 3;
	$(this).closest(".poke-info").find(".move-hits").val(moveHits);

	var ability = $(this).closest(".poke-info").find(".ability").val();

	var TOGGLE_ABILITIES = ['Flash Fire', 'Intimidate', 'Minus', 'Plus', 'Slow Start', 'Unburden', 'Stakeout', 'Teraform Zero', 'Bull Rush', 'Quill Rush', 'Illusion'];

	if (TOGGLE_ABILITIES.indexOf(ability) >= 0) {
		$(this).closest(".poke-info").find(".abilityToggle").show();
	} else {
		$(this).closest(".poke-info").find(".abilityToggle").hide();
	}
	var boostedStat = $(this).closest(".poke-info").find(".boostedStat");

	if (ability === "Protosynthesis" || ability === "Quark Drive") {
		boostedStat.show();
		autosetQP($(this).closest(".poke-info"));
	} else {
		boostedStat.hide();
	}

	if (ability === "Supreme Overlord") {
		$(this).closest(".poke-info").find(".alliesFainted").show();
	} else {
		$(this).closest(".poke-info").find(".alliesFainted").val('0');
		$(this).closest(".poke-info").find(".alliesFainted").hide();

	}
});

function autosetQP(pokemon) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";

	var item = pokemon.find(".item").val();
	var ability = pokemon.find(".ability").val();
	var boostedStat = pokemon.find(".boostedStat").val();

	if (!boostedStat || boostedStat === "auto") {
		if (
			(item === "Booster Energy") ||
			(ability === "Protosynthesis" && currentWeather === "Sun") ||
			(ability === "Quark Drive" && currentTerrain === "Electric")
		) {
			pokemon.find(".boostedStat").val("auto");
		} else {
			pokemon.find(".boostedStat").val("");
		}
	}
}

$("#p1 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 0, $("#p1 .item").val());
	autosetTerrain($(this).val(), 0);
	autosetQP($(this).closest(".poke-info"));
});

$("input[name='weather']").change(function () {
	var allPokemon = $('.poke-info');
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualWeather = "";
var lastAutoWeather = ["", ""];
function autosetWeather(ability, i, item) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	if (lastAutoWeather.indexOf(currentWeather) === -1) {
		lastManualWeather = currentWeather;
		lastAutoWeather[1 - i] = "";
	}
	switch (ability) {
	case "Drought":
	case "Orichalcum Pulse":
		lastAutoWeather[i] = "Sun";
		$("#sun").prop("checked", true);
		break;
	case "Drizzle":
		lastAutoWeather[i] = "Rain";
		$("#rain").prop("checked", true);
		break;
	case "Sand Stream":
		lastAutoWeather[i] = "Sand";
		$("#sand").prop("checked", true);
		break;
	case "Snow Warning":
		if (gen >= 9) {
			lastAutoWeather[i] = "Snow";
			$("#snow").prop("checked", true);
		} else {
			lastAutoWeather[i] = "Hail";
			$("#hail").prop("checked", true);
		}
		break;
	case "Desolate Land":
		lastAutoWeather[i] = "Harsh Sunshine";
		$("#harsh-sunshine").prop("checked", true);
		break;
	case "Primordial Sea":
		lastAutoWeather[i] = "Heavy Rain";
		$("#heavy-rain").prop("checked", true);
		break;
	case "Delta Stream":
		lastAutoWeather[i] = "Strong Winds";
		$("#strong-winds").prop("checked", true);
		break;
	case "Forecast":
		switch (item) {
		case "Damp Rock":
			lastAutoWeather[i] = "Rain";
			$("#rain").prop("checked", true);
			break;
		case "Heat Rock":
			lastAutoWeather[i] = "Sun";
			$("#sun").prop("checked", true);
			break;
		case "Icy Rock":
			lastAutoWeather[i] = "Hail";
			$("#hail").prop("checked", true);
			break;
		case "Smooth Rock":
			lastAutoWeather[i] = "Sand";
			$("#sand").prop("checked", true);
			break;
		}
		break;
	default:
		lastAutoWeather[i] = "";
		var newWeather = lastAutoWeather[1 - i] !== "" ? lastAutoWeather[1 - i] : "";
		$("input:radio[name='weather'][value='" + newWeather + "']").prop("checked", true);
		break;
	}
}

$("input[name='terrain']").change(function () {
	var allPokemon = $('.poke-info');
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualTerrain = "";
var lastAutoTerrain = ["", ""];
function autosetTerrain(ability, i) {
	var currentTerrain = $("input:checkbox[name='terrain']:checked").val() || "No terrain";
	if (lastAutoTerrain.indexOf(currentTerrain) === -1) {
		lastManualTerrain = currentTerrain;
		lastAutoTerrain[1 - i] = "";
	}
	// terrain input uses checkbox instead of radio, need to uncheck all first
	$("input:checkbox[name='terrain']:checked").prop("checked", false);
	switch (ability) {
	case "Electric Surge":
	case "Hadron Engine":
		lastAutoTerrain[i] = "Electric";
		$("#electric").prop("checked", true);
		break;
	case "Grassy Surge":
		lastAutoTerrain[i] = "Grassy";
		$("#grassy").prop("checked", true);
		break;
	case "Misty Surge":
		lastAutoTerrain[i] = "Misty";
		$("#misty").prop("checked", true);
		break;
	case "Psychic Surge":
		lastAutoTerrain[i] = "Psychic";
		$("#psychic").prop("checked", true);
		break;
	default:
		lastAutoTerrain[i] = "";
		var newTerrain = lastAutoTerrain[1 - i] !== "" ? lastAutoTerrain[1 - i] : lastManualTerrain;
		if ("No terrain" !== newTerrain) {
			$("input:checkbox[name='terrain'][value='" + newTerrain + "']").prop("checked", true);
		}
		break;
	}
}

$("#p1 .item").bind("keyup change", function () {
	autosetStatus("#p1", $(this).val());
	autosetWeather($("#p1 .ability").val(), 0, $(this).val());
});

var lastManualStatus = {"#p1": "Healthy"};
var lastAutoStatus = {"#p1": "Healthy"};
function autosetStatus(p, item) {
	var currentStatus = $(p + " .status").val();
	if (currentStatus !== lastAutoStatus[p]) {
		lastManualStatus[p] = currentStatus;
	}
	if (item === "Flame Orb") {
		lastAutoStatus[p] = "Burned";
		$(p + " .status").val("Burned");
		$(p + " .status").change();
	} else if (item === "Toxic Orb") {
		lastAutoStatus[p] = "Badly Poisoned";
		$(p + " .status").val("Badly Poisoned");
		$(p + " .status").change();
	} else {
		lastAutoStatus[p] = "Healthy";
		if (currentStatus !== lastManualStatus[p]) {
			$(p + " .status").val(lastManualStatus[p]);
			$(p + " .status").change();
		}
	}
}

$(".status").bind("keyup change", function () {
	if ($(this).val() === 'Badly Poisoned') {
		$(this).parent().children(".toxic-counter").show();
	} else {
		$(this).parent().children(".toxic-counter").hide();
	}
});

$(".teraType").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	var checked = pokeObj.find(".teraToggle").prop("checked");
	stellarButtonsVisibility(pokeObj, $(this).val() === "Stellar" && checked);
});

var lockerMove = "";
// auto-update move details on select
$(".move-selector").change(function () {
	var moveName = $(this).val();
	var move = moves[moveName] || moves['(No Move)'];
	var moveGroupObj = $(this).parent();
	moveGroupObj.children(".move-bp").val(moveName === 'Present' ? 40 : move.bp);
	var m = moveName.match(HIDDEN_POWER_REGEX);
	if (m) {
		var pokeObj = $(this).closest(".poke-info");
		var pokemon = createPokemon(pokeObj);
		var actual = calc.Stats.getHiddenPower(GENERATION, pokemon.ivs);
		if (actual.type !== m[1]) {
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (hpIVs && gen < 7) {
				for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
					var legacyStat = LEGACY_STATS[gen][i];
					var stat = legacyStatToStat(legacyStat);
					pokeObj.find("." + legacyStat + " .ivs").val(hpIVs[stat] !== undefined ? hpIVs[stat] : 31);
					pokeObj.find("." + legacyStat + " .dvs").val(hpIVs[stat] !== undefined ? calc.Stats.IVToDV(hpIVs[stat]) : 15);
				}
				if (gen < 3) {
					var hpDV = calc.Stats.getHPDV({
						atk: pokeObj.find(".at .ivs").val(),
						def: pokeObj.find(".df .ivs").val(),
						spe: pokeObj.find(".sp .ivs").val(),
						spc: pokeObj.find(".sa .ivs").val()
					});
					pokeObj.find(".hp .ivs").val(calc.Stats.DVToIV(hpDV));
					pokeObj.find(".hp .dvs").val(hpDV);
				}
				pokeObj.change();
				moveGroupObj.children(".move-bp").val(gen >= 6 ? 60 : 70);
			}
		} else {
			moveGroupObj.children(".move-bp").val(actual.power);
		}
	} else if (gen >= 2 && gen <= 6 && HIDDEN_POWER_REGEX.test($(this).attr('data-prev'))) {
		// If this selector was previously Hidden Power but now isn't, reset all IVs/DVs to max.
		var pokeObj = $(this).closest(".poke-info");
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			pokeObj.find("." + legacyStat + " .ivs").val(31);
			pokeObj.find("." + legacyStat + " .dvs").val(15);
		}
	}
	$(this).attr('data-prev', moveName);
	moveGroupObj.children(".move-type").val(move.type);
	moveGroupObj.children(".move-cat").val(move.category);
	moveGroupObj.children(".move-crit").prop("checked", move.willCrit === true);

	var stat = move.category === 'Special' ? 'spa' : 'atk';
	var dropsStats =
		move.self && move.self.boosts && move.self.boosts[stat] && move.self.boosts[stat] < 0;
	if (Array.isArray(move.multihit) || (!isNaN(move.multihit) && move.multiaccuracy)) {
		moveGroupObj.children(".stat-drops").hide();
		moveGroupObj.children(".move-hits").empty();
		if (!isNaN(move.multihit)) {
			for (var i = 1; i <= move.multihit; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		} else {
			for (var i = move.multihit[0]; i <= move.multihit[1]; i++) {
				moveGroupObj.children(".move-hits").append("<option value=" + i + ">" + i + " hits</option>");
			}
		}
		moveGroupObj.children(".move-hits").show();
		var pokemon = $(this).closest(".poke-info");
		var moveHits =
			pokemon.find(".ability").val() === 'Skill Link' ? 5 :
				pokemon.find(".item").val() === 'Loaded Dice' ? 4 : 3;
		moveGroupObj.children(".move-hits").val(moveHits);
	} else if (dropsStats) {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").show();
	} else {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").hide();
	}
	moveGroupObj.children(".move-z").prop("checked", false);
});

$(".item").change(function () {
	var itemName = $(this).val();
	var $metronomeControl = $(this).closest('.poke-info').find('.metronome');
	if (itemName === "Metronome") {
		$metronomeControl.show();
	} else {
		$metronomeControl.hide();
	}
	var moveHits =
		$(this).closest(".poke-info").find(".ability").val() === 'Skill Link' ? 5 :
			itemName === 'Loaded Dice' ? 4 : 3;
	$(this).closest(".poke-info").find(".move-hits").val(moveHits);
	autosetQP($(this).closest(".poke-info"));
});

function smogonAnalysis(pokemonName) {
	var generation = ["rb", "gs", "rs", "dp", "bw", "xy", "sm", "ss", "sv"][gen - 1];
	return "https://smogon.com/dex/" + generation + "/pokemon/" + pokemonName.toLowerCase() + "/";
}

function parseSetSelection(fullSetName) {
	if (!fullSetName) return null;
	var open = fullSetName.indexOf(" (");
	var close = fullSetName.lastIndexOf(")");
	if (open === -1 || close === -1 || close <= open) return null;
	return {
		pokemonName: fullSetName.substring(0, open),
		setName: fullSetName.substring(open + 2, close),
		fullSetName: fullSetName
	};
}

function getRosterOrder(set) {
	if (!set || set.index === undefined || set.index === null || isNaN(set.index)) return null;
	return Number(set.index);
}

function getRosterStorageKey() {
	return "rr-last-opposing-set:" + (window.location.pathname || "");
}

var ROSTER_SPEED_RULES = {
	"F": {className: "mon-speed-F", label: "Faster"},
	"T": {className: "mon-speed-T", label: "Speed tie"},
	"S": {className: "mon-speed-S", label: "Slower"},
	"none": {className: "mon-speed-none", label: "Speed unknown"}
};
var ROSTER_DAMAGE_RULES = {
	"W": {className: "mon-dmg-W", label: "Hard counter"},
	"WMO": {className: "mon-dmg-WMO", label: "Walls safely"},
	"1": {className: "mon-dmg-1", label: "Always OHKOs"},
	"2": {className: "mon-dmg-2", label: "Possible OHKO"},
	"3": {className: "mon-dmg-3", label: "Can be OHKOed"},
	"4": {className: "mon-dmg-4", label: "Always gets OHKOed"},
	"13": {className: "mon-dmg-13", label: "Always OHKOs but can be OHKOed"},
	"14": {className: "mon-dmg-14", label: "Mutual OHKO"},
	"23": {className: "mon-dmg-23", label: "Mutual possible OHKO"},
	"24": {className: "mon-dmg-24", label: "Can OHKO but always gets OHKOed"},
	"none": {className: "mon-dmg-none", label: "Neutral matchup"}
};
var ROSTER_SPEED_CLASSES = getRosterRuleClasses(ROSTER_SPEED_RULES);
var ROSTER_DAMAGE_CLASSES = getRosterRuleClasses(ROSTER_DAMAGE_RULES);
var ROSTER_PLAYER_CACHE = {};
var HARDCORE_TRAINER_ORDER = [
	"RIVAL - ROUTE 22",
	"BRENDAN - VIRIDIAN FOREST",
	"LASS ANNE - VIRIDIAN FOREST",
	"ACE NELLE - VIRIDIAN FOREST",
	"CATCHER SAMMY - VIRIDIAN FOREST",
	"FALKNER - PEWTER CITY",
	"BROCK - PEWTER CITY",
	"LASS SALLY - ROUTE 3",
	"SUPER NERD MIGUEL - MT. MOON",
	"ARCHER - MT. MOON",
	"RIVAL - CERULEAN CITY",
	"CATCHER CALE - NUGGET BRIDGE",
	"LASS ALI - NUGGET BRIDGE",
	"YOUNGSTER TIMMY - NUGGET BRIDGE",
	"LASS RELLI - NUGGET BRIDGE",
	"CAMPER ETHAN - NUGGET BRIDGE",
	"GRUNT - NUGGET BRIDGE",
	"BUGSY - ROUTE 25",
	"MISTY - CERULEAN CITY",
	"GRUNT - DIG HOUSE",
	"CAMPER JEFF - ROUTE 6",
	"ANN & BROOKS - S.S. ANNE",
	"EDMOND & TREVOR - S.S. ANNE",
	"BRENDAN - S.S. ANNE",
	"WHITNEY - ROUTE 11",
	"GENTLEMAN TUCKER - VERMILLION CITY GYM",
	"LT. SURGE - VERMILLION CITY",
	"PICNICKER ALICIA - ROUTE 9",
	"PICNICKER CAITLIN - ROUTE 9",
	"PICNICKER DANA - ROCK TUNNEL",
	"MANIAC HERMAN - ROUTE 10",
	"MORTY - LAVENDER TOWN",
	"SUPER NERD AIDAN - ROUTE 8",
	"ACE MARY - CELADON CITY GYM",
	"ERIKA - CELADON CITY",
	"GUARD - GAME CORNER",
	"LEFT GUARD - ROCKET HIDEOUT",
	"RIGHT GUARD - ROCKET HIDEOUT",
	"GIOVANNI - ROCKET HIDEOUT",
	"CHANNELER RUTH - POKEMON TOWER",
	"GHOST - POKEMON TOWER",
	"GRUNT 1 - POKEMON TOWER",
	"GRUNT 2 - POKEMON TOWER",
	"GRUNT 3 - POKEMON TOWER",
	"RIVAL - SILPH CO.",
	"ARIANA & ARCHER - SILPH CO.",
	"GIOVANNI - SILPH CO.",
	"ACE COLE - ROUTE 8",
	"BEAUTY SAM - CELADON CITY HOTEL",
	"BEAUTY SHELLY - CELADON CITY HOTEL",
	"CHUCK - SAFFRON CITY",
	"SABRINA - SAFFRON CITY",
	"DUMASS KID - SAFFRON CITY",
	"ROCKER LUCA - ROUTE 12",
	"CAMPER JUSTIN - ROUTE 12",
	"FISHERMAN ANDREW - ROUTE 12",
	"BIRD KE. SEBASTIAN - ROUTE 13",
	"PICNICKER SUSIE - ROUTE 13",
	"PICNICKER ALMA - ROUTE 13",
	"LOLA & SHEILA - ROUTE 13",
	"BIRD KEEPER PERRY - ROUTE 13",
	"BIKER JARED - ROUTE 13",
	"BIRD KEEPER ROBERT - ROUTE 13",
	"ACE HALEY - ROUTE 15",
	"BIKER LAO - ROUTE 16",
	"CUE BALL KOJI - ROUTE 16",
	"CUE BALL LUKE - ROUTE 16",
	"BIKER RUBEN - ROUTE 16",
	"CUE BALL CAMRON - ROUTE 16",
	"BIKER HIDEO - ROUTE 16",
	"BIKER WILLIAM - ROUTE 18",
	"BIRD KEEPER JACOB - ROUTE 18",
	"TAMER RAMIRO - ROUTE 18",
	"ACE WILTON - ROUTE 18",
	"BRENDAN - SAFARI ZONE",
	"BROCK (REMATCH) - PEWTER CITY",
	"MISTY (REMATCH) - CERULEAN CITY",
	"LT. SURGE (REMATCH) - VERMILLION CITY",
	"ERIKA (REMATCH) - CELADON CITY",
	"JUGGLER KAYDEN - FUCHSIA CITY GYM",
	"KOGA - FUCHSIA CITY",
	"DUMASS JOJO FAN - POWER PLANT",
	"PRYCE - SEAFOAM ISLANDS",
	"MAY - CINNABAR ISLAND",
	"JASMINE - CINNABAR ISLAND LAB",
	"SCIENTIST TED - POKEMON MANSION",
	"BURGLAR LEWIS - POKEMON MANSION",
	"ACE DEREK - CINNABAR ISLAND GYM",
	"ACE LUCY - CINNABAR ISLAND GYM",
	"ACE ZAC - CINNABAR ISLAND GYM",
	"BLAINE - CINNABAR ISLAND",
	"GRUNT 1 - CERULEAN CAVE",
	"GRUNT 2 - CERULEAN CAVE",
	"ARCHER - CERULEAN CAVE",
	"ARIANA - CERULEAN CAVE",
	"GIOVANNI - CERULEAN CAVE",
	"BLACK BELT KETCHUP - CERULEAN CAVE",
	"CLAIR - VIRIDIAN CITY",
	"BURGLAR MAX - POKEMON MANSION 4F",
	"BURGLAR ANSON - POKEMON MANSION 4F",
	"RIVAL 4 - ROUTE 22",
	"BRENDAN - ROUTE 23",
	"ACE NAOMI - VICTORY ROAD",
	"ACE ROLANDO - VICTORY ROAD",
	"ACE GEORGE - VICTORY ROAD",
	"ACE CAROLINE - VICTORY ROAD",
	"ACE COLBY - VICTORY ROAD",
	"ACE ALEXA - VICTORY ROAD",
	"RAY & TYRA - VICTORY ROAD",
	"DUMASS CREATOR - INDIGO PLATEAU",
	"LORELEI - ELITE FOUR",
	"BRUNO - ELITE FOUR",
	"AGATHA - ELITE FOUR",
	"LANCE - ELITE FOUR",
	"RIVAL - CHAMPION"
];
var HARDCORE_TRAINER_ORDER_INDEX;
var TRAINER_TEAM_META_CACHE;

function isHardcoreTrainerOrderingEnabled() {
	var pathname = (window.location.pathname || "").toLowerCase();
	return !!setdex && ($("#hardcore").prop("checked") || pathname.indexOf("hardcore") !== -1);
}

function getHardcoreTrainerOrderIndex() {
	if (HARDCORE_TRAINER_ORDER_INDEX) return HARDCORE_TRAINER_ORDER_INDEX;
	HARDCORE_TRAINER_ORDER_INDEX = {};
	for (var i = 0; i < HARDCORE_TRAINER_ORDER.length; i++) {
		if (!Object.prototype.hasOwnProperty.call(HARDCORE_TRAINER_ORDER_INDEX, HARDCORE_TRAINER_ORDER[i])) {
			HARDCORE_TRAINER_ORDER_INDEX[HARDCORE_TRAINER_ORDER[i]] = i;
		}
	}
	return HARDCORE_TRAINER_ORDER_INDEX;
}

function normalizeHardcoreTrainerLabel(label) {
	return (label || "")
		.replace(/\s+/g, " ")
		.replace(/^\s+|\s+$/g, "")
		.toUpperCase()
		.replace(/^ACE TRAINER /, "ACE ")
		.replace(/^BUG CATCHER /, "CATCHER ")
		.replace(/^PICKNICKER /, "PICNICKER ")
		.replace("FUSCHIA", "FUCHSIA")
		.replace(/S\.S\.?\s+ANNE/g, "S.S. ANNE")
		.replace(/SS\s+ANNE/g, "S.S. ANNE")
		.replace(/MT\.?\s+MOON/g, "MT. MOON")
		.replace(/SILPH CO\.?/g, "SILPH CO.");
}

function getHardcoreTrainerCanonicalName(setName) {
	var trimmed = (setName || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
	if (!trimmed) return "";

	if (trimmed.indexOf("Gary - Route 22 [") === 0) return "RIVAL - ROUTE 22";
	if (trimmed.indexOf("Rival 4 [") === 0 && trimmed.indexOf(" - Route 22") !== -1) return "RIVAL 4 - ROUTE 22";
	if (trimmed.indexOf("Gary - Nugget Bridge [") === 0) return "RIVAL - CERULEAN CITY";
	if (trimmed.indexOf("Rival [") === 0 && trimmed.indexOf(" - Silph Co") !== -1) return "RIVAL - SILPH CO.";
	if (trimmed.indexOf("Rival Champion [") === 0) return "RIVAL - CHAMPION";

	if (trimmed === "Brendan - Victory Road") return "BRENDAN - ROUTE 23";
	if (trimmed === "Brendan 2 - S.S Anne") return "BRENDAN - S.S. ANNE";

	if (trimmed === "Brock - Pewter Gym") return "BROCK - PEWTER CITY";
	if (trimmed === "Brock Rematch - Pewter City") return "BROCK (REMATCH) - PEWTER CITY";
	if (trimmed === "Misty - Cerulean Gym") return "MISTY - CERULEAN CITY";
	if (trimmed === "Misty Rematch - Cerulean City" || trimmed === "Misty Post Game - Cerulean City") {
		return "MISTY (REMATCH) - CERULEAN CITY";
	}
	if (trimmed === " Lt. Surge - Vermillion Gym" || trimmed === "Lt. Surge - Vermillion Gym") {
		return "LT. SURGE - VERMILLION CITY";
	}
	if (trimmed === "Lt. Surge - Vermillion City") return "LT. SURGE (REMATCH) - VERMILLION CITY";
	if (trimmed === "Gentleman Tucker - Vermillion Gym") return "GENTLEMAN TUCKER - VERMILLION CITY GYM";
	if (trimmed === "Pokenerd Herman - Route 10") return "MANIAC HERMAN - ROUTE 10";
	if (trimmed === "Pokenerd Aiden - Route 8") return "SUPER NERD AIDAN - ROUTE 8";
	if (trimmed === "Ace Trainer Mary") return "ACE MARY - CELADON CITY GYM";
	if (trimmed === "Erika Rematch - Celadon Gym") return "ERIKA (REMATCH) - CELADON CITY";
	if (trimmed === "Juggler Kayden - Fuschia Gym") return "JUGGLER KAYDEN - FUCHSIA CITY GYM";
	if (trimmed === "Koga - Fuschia City") return "KOGA - FUCHSIA CITY";
	if (trimmed === "Jasmine - Cinnabar Island") return "JASMINE - CINNABAR ISLAND LAB";
	if (trimmed === "Burglar Lewis - Cinnabar Mansion") return "BURGLAR LEWIS - POKEMON MANSION";
	if (trimmed === "Ace Trainer Derek - Cinnabar Gym") return "ACE DEREK - CINNABAR ISLAND GYM";
	if (trimmed === "Ace Trainer Lucy - Cinnabar Gym") return "ACE LUCY - CINNABAR ISLAND GYM";
	if (trimmed === "Ace Trainer Zac - Cinnabar Gym") return "ACE ZAC - CINNABAR ISLAND GYM";
	if (trimmed === "Blaine - Cinnabar Gym") return "BLAINE - CINNABAR ISLAND";
	if (trimmed === "Clair - Viridian Gym") return "CLAIR - VIRIDIAN CITY";

	if (trimmed === "Team Rocket Grunt - Game Corner") return "GUARD - GAME CORNER";
	if (trimmed === "Left Rocket Grunt - Hideout") return "LEFT GUARD - ROCKET HIDEOUT";
	if (trimmed === "Right Rocket Grunt - Hideout") return "RIGHT GUARD - ROCKET HIDEOUT";
	if (trimmed === "Pokemon Tower") return "GHOST - POKEMON TOWER";
	if (trimmed === "Rocket Grunt 1 - Lavender Tower") return "GRUNT 1 - POKEMON TOWER";
	if (trimmed === "Rocket Grunt 2 - Lavender Tower") return "GRUNT 2 - POKEMON TOWER";
	if (trimmed === "Rocket Grunt 3 - Lavender Tower") return "GRUNT 3 - POKEMON TOWER";
	if (trimmed === "Nugget Grunt - Nugget Bridge") return "GRUNT - NUGGET BRIDGE";
	if (trimmed === "Dig Grunt - Cerulean City") return "GRUNT - DIG HOUSE";
	if (trimmed === "Pokemon Trainer Sam - Celadon Hotel") return "BEAUTY SAM - CELADON CITY HOTEL";
	if (trimmed === "Pokemon Trainer Shelly - Celadon Hotel") return "BEAUTY SHELLY - CELADON CITY HOTEL";
	if (trimmed === "Dumbass Kid - Saffron City") return "DUMASS KID - SAFFRON CITY";
	if (trimmed === "Rocket Luca - Route 12") return "ROCKER LUCA - ROUTE 12";
	if (trimmed === "Pokemon Trainer Hailey - Route 15") return "ACE HALEY - ROUTE 15";
	if (trimmed === "Cue Ball Camron Route 16") return "CUE BALL CAMRON - ROUTE 16";
	if (trimmed === "Dragon Tamer Ramiro - Route 18") return "TAMER RAMIRO - ROUTE 18";
	if (trimmed === "Cool Couple Ray and Tyra - Victory Road") return "RAY & TYRA - VICTORY ROAD";
	if (trimmed === "Lass Reli - Nugget Bridge") return "LASS RELLI - NUGGET BRIDGE";
	if (trimmed === "Bird Keeper Sebastian - Route 13") return "BIRD KE. SEBASTIAN - ROUTE 13";
	if (trimmed === "Falkner Post Game - Pewter City") return "FALKNER - PEWTER CITY";
	if (trimmed === "Whitney Rematch - Two Island") return "WHITNEY - ROUTE 11";
	if (trimmed === "Morty Rematch - Two Island") return "MORTY - LAVENDER TOWN";
	if (trimmed === "Pryce Post Game - Seafoam Islands") return "PRYCE - SEAFOAM ISLANDS";
	if (trimmed === "Clair Post Game - Viridian City") return "CLAIR - VIRIDIAN CITY";

	if (trimmed.indexOf("Bugsy - Pre Surge - Route 25") === 0 || trimmed.indexOf("Bugsy - Post Surge - Route 25") === 0) {
		return "BUGSY - ROUTE 25";
	}
	if (trimmed.indexOf("Bugsy Post Game - One Island") === 0) return "BUGSY - ROUTE 25";
	if (trimmed.indexOf("Lorelei Hail") === 0 || trimmed.indexOf("Lorelei Rain") === 0) return "LORELEI - ELITE FOUR";
	if (trimmed.indexOf("Bruno ") === 0) return "BRUNO - ELITE FOUR";
	if (trimmed.indexOf("Pryce 1 - Seafoam Islands") === 0 || trimmed.indexOf("Pryce 2 - Seafoam Islands") === 0) {
		return "PRYCE - SEAFOAM ISLANDS";
	}
	if (trimmed.indexOf("Ariana - Silph Co") === 0 || trimmed.indexOf("Archer - Silph Co") === 0) {
		return "ARIANA & ARCHER - SILPH CO.";
	}
	if (trimmed.indexOf("Lass Anne - S.S Anne") === 0 || trimmed.indexOf("Gentleman Brroks - S.S Anne") === 0) {
		return "ANN & BROOKS - S.S. ANNE";
	}
	if (trimmed.indexOf("Sailor Edmon - S.S Anne") === 0 || trimmed.indexOf("Sailor Trevor - S.S Anne") === 0) {
		return "EDMOND & TREVOR - S.S. ANNE";
	}
	if (trimmed.indexOf("Beauty Lola - Route 13") === 0 || trimmed.indexOf("Beauty Sheila - Route 13") === 0) {
		return "LOLA & SHEILA - ROUTE 13";
	}
	if (trimmed.indexOf("Team Rocket Grunt 1 - Cerulean Cave") === 0) return "GRUNT 1 - CERULEAN CAVE";
	if (trimmed.indexOf("Team Rocket Grunt 2 - Cerulean Cave") === 0) return "GRUNT 2 - CERULEAN CAVE";
	if (trimmed.indexOf("Apprentice Ketchup 1 - Cerulean Cave") === 0 || trimmed.indexOf("Apprentice Ketchup 2 - Cerulean Cave") === 0) {
		return "BLACK BELT KETCHUP - CERULEAN CAVE";
	}

	return normalizeHardcoreTrainerLabel(trimmed);
}

function getHardcoreTrainerVariantRank(setName) {
	var trimmed = (setName || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
	if (!trimmed) return 0;

	if (trimmed.indexOf("[Bulbasaur]") !== -1) return 0;
	if (trimmed.indexOf("[Charmander]") !== -1) return 1;
	if (trimmed.indexOf("[Squirtle]") !== -1) return 2;

	if (trimmed.indexOf("Pre Surge") !== -1) return 0;
	if (trimmed.indexOf("Post Surge") !== -1) return 1;
	if (trimmed.indexOf("Post Game") !== -1) return 2;
	if (trimmed.indexOf("Hail") !== -1) return 0;
	if (trimmed.indexOf("Rain") !== -1) return 1;

	if (trimmed.indexOf("Lass Anne - S.S Anne") === 0) return 0;
	if (trimmed.indexOf("Gentleman Brroks - S.S Anne") === 0) return 1;
	if (trimmed.indexOf("Sailor Edmon - S.S Anne") === 0) return 0;
	if (trimmed.indexOf("Sailor Trevor - S.S Anne") === 0) return 1;
	if (trimmed.indexOf("Ariana - Silph Co") === 0) return 0;
	if (trimmed.indexOf("Archer - Silph Co") === 0) return 1;
	if (trimmed.indexOf("Beauty Lola - Route 13") === 0) return 0;
	if (trimmed.indexOf("Beauty Sheila - Route 13") === 0) return 1;

	if (trimmed.indexOf("Bruno 1") === 0) return 0;
	if (trimmed.indexOf("Bruno 2") === 0) return 1;
	if (trimmed.indexOf("Pryce 1 - Seafoam Islands") === 0) return 0;
	if (trimmed.indexOf("Pryce 2 - Seafoam Islands") === 0) return 1;
	if (trimmed.indexOf("Apprentice Ketchup 1 - Cerulean Cave") === 0) return 0;
	if (trimmed.indexOf("Apprentice Ketchup 2 - Cerulean Cave") === 0) return 1;

	return 0;
}

function getTrainerTeamMetaCache() {
	if (TRAINER_TEAM_META_CACHE && TRAINER_TEAM_META_CACHE.setdex === setdex) {
		return TRAINER_TEAM_META_CACHE.meta;
	}
	var meta = {};
	if (!setdex) {
		TRAINER_TEAM_META_CACHE = {setdex: setdex, meta: meta};
		return meta;
	}
	for (var pokemonName in setdex) {
		if (!Object.prototype.hasOwnProperty.call(setdex, pokemonName)) continue;
		for (var setName in setdex[pokemonName]) {
			if (!Object.prototype.hasOwnProperty.call(setdex[pokemonName], setName)) continue;
			var set = setdex[pokemonName][setName];
			if (setName === "Blank Set" || set.isCustomSet) continue;
			if (!meta[setName]) meta[setName] = {teamIndex: null};
			if (set.teamIndex !== undefined && set.teamIndex !== null && !isNaN(set.teamIndex)) {
				var teamIndex = Number(set.teamIndex);
				if (meta[setName].teamIndex === null || teamIndex < meta[setName].teamIndex) {
					meta[setName].teamIndex = teamIndex;
				}
			}
		}
	}
	TRAINER_TEAM_META_CACHE = {setdex: setdex, meta: meta};
	return meta;
}

var DEFAULT_TRAINER_ORDER_INDEX = {
	"ARIANA & ARCHER - SILPH CO.": 42,
	"ANN & BROOKS - S.S. ANNE": 23,
	"EDMOND & TREVOR - S.S. ANNE": 24,
	"Brendan 2 - S.S Anne": 25,
	"LOLA & SHEILA - ROUTE 13": 53,
	"Ace Trainer Naomi - Victory Road": 96,
	"Channeler Rachel Post Game - Cape Brink": 149,
	"Biker Ruben - Route 16": 61,
	"Koga - Fuschia City": 73,
	"Ace Trainer Runan  Post Game - Lavender Tower": 122,
	"Clair - Viridian Gym": 89,
	"Lance": 109,
	"Brock Rematch - Pewter City": 69,
	"Picnicker Susie - Route 13": 51,
	"Ace Trainer Symes Post Game - Lavender Tower": 124,
	"Picnicker Alma - Route 13": 52,
	"Lass Ali - Nugget Bridge": 15,
	"Bugsy - Post Surge - Route 25": 20,
	"Ace Trainer Derek - Cinnabar Gym": 80,
	"Bugsy Post Game - One Island": 141,
	"Brock - Pewter Gym": 8,
	"Bird Keeper Robert - Route 13": 56,
	"Fisherman Andrew - Route 12": 49,
	"Pryce 1 - Seafoam Islands": 75,
	"Pryce 2 - Seafoam Islands": 75,
	"Blaine - Cinnabar Gym": 83,
	"Biker Hideo - Route 16": 63,
	"Lass Anne - Viridian Forest": 5,
	"Biker 3 Post Game - Three Island": 152,
	"Rival 4 [Bulbasaur] - Route 22": 93,
	"Rival 4 [Charmander] - Route 22": 92,
	"Rival [Squirtle] - Silph Co": 41,
	"Rival [Bulbasaur] - Silph Co": 40,
	"Lorelei Hail": 104,
	"Lt. Surge - Vermillion City": 71,
	" Lt. Surge - Vermillion Gym": 27,
	"Erika Rematch - Celadon Gym": 72,
	"Super Nerd Miguel - Mt Moon": 9,
	"Red - Treasure Beach": 127,
	"Rival [Charmander] - Silph Co": 39,
	"Ace Trainer Andrew Post Game - Two Island": 148,
	"Ace Trainer George - Victory Road": 98,
	"Beauty Sheila - Route 13": 53,
	"Ace Trainer Zac - Cinnabar Gym": 82,
	"Chuck - Saffron City": 44,
	"Sabrina - Saffron City": 45,
	"Bug Catcher Cale - Nugget Bridge": 14,
	"Cue Ball Camron Route 16": 62,
	"Pryce Post Game - Seafoam Islands": 121,
	"Biker Jared - Route 13": 55,
	"Biker 4 Post Game - Three Island": 153,
	"Morty - Lavender Town": 29,
	"Brendan - Viridian Forest": 4,
	"Ace Trainer Lucy - Cinnabar Gym": 81,
	"Ace Trainer Samantha Post Game - Lavender Tower": 123,
	"Bird Keeper Sebastian - Route 13": 50,
	"Gary - Nugget Bridge [Charmander]": 12,
	"Beauty Lola - Route 13": 53,
	"Agatha": 108,
	"Lass Reli - Nugget Bridge": 114,
	"Misty - Cerulean Gym": 21,
	"Camper Justin - Route 12": 48,
	"Bird Keeper Jacob - Route 18": 65,
	"Sailor Trevor - S.S Anne": 24,
	"Ace Trainer Rolando - Victory Road": 97,
	"Rival 4 [Squirtle] - Route 22": 94,
	"Lass Anne - S.S Anne": 23,
	"Gentleman Brroks - S.S Anne": 23,
	"Partner Lance - Cerulean Cave": 117,
	"Rival Champion [Charmander]": 111,
	"Rival Champion [Squirtle]": 112,
	"Rival Champion [Bulbasaur]": 113,
	"Cue Ball Koji - Route 16": 59,
	"Ace Trainer Wilton - Route 18": 67,
	"Bird Keeper Perry - Route 13": 54,
	"Whitney - Route 11": 26,
	"Cue Ball Luke - Route 16": 60,
	"Biker Lao - Route 16": 58,
	"Biker 1 Post Game - Three Island": 150,
	"Youngster Timmy - Nugget Bridge": 16,
	"Erika - Celadon City": 30,
	"Falkner Post Game - Pewter City": 119,
	"Giovanni - Silph Co": 43,
	"Whitney Rematch - Two Island": 147,
	"Misty Rematch - Cerulean City": 70,
	"Falkner - Pewter City": 7,
	"Biker 2 Post Game - Three Island": 151,
	"Nugget Grunt - Nugget Bridge": 18,
	"Morty Rematch - Two Island": 125,
	"Archer - Silph Co": 42,
	"Archer - Mt Moon": 10,
	"Dig Grunt - Cerulean City": 22,
	"Dragon Tamer Ramiro - Route 18": 66,
	"Bruno 2": 106,
	"Clair Post Game - Saffron City": 120,
	"Camper Liam - Viridian Gym": 89,
	"Rocket Luca - Route 12": 47,
	"Giovanni - Rocket Hideout": 34,
	"Bruno 1": 105,
	"Lorelei Rain": 103,
	"Gary - Nugget Bridge [Bulbasaur]": 13,
	"Gary - Nugget Bridge [Squirtle]": 11,
	"Bugsy - Pre Surge - Route 25": 19,
	"Picnicker Caitlin - Route 9": 28,
	"Sailor Edmon - S.S Anne": 24,
	"Camper Ethan - Nugget Bridge": 17,
	"Biker William - Route 18": 64,
	"Pokemon Tower": 38
};

var DEFAULT_DOUBLE_TRAINER_GROUPS = {
	"ANN & BROOKS - S.S. ANNE": {
		"Gentleman Brroks - S.S Anne": "left",
		"Lass Anne - S.S Anne": "right"
	},
	"EDMOND & TREVOR - S.S. ANNE": {
		"Sailor Edmon - S.S Anne": "left",
		"Sailor Trevor - S.S Anne": "right"
	},
	"ARIANA & ARCHER - SILPH CO.": {
		"Archer - Silph Co": "right"
	},
	"LOLA & SHEILA - ROUTE 13": {
		"Beauty Lola - Route 13": "left",
		"Beauty Sheila - Route 13": "right"
	}
};

function getDefaultDoubleTrainerGroup(setName) {
	if (isHardcoreTrainerOrderingEnabled() || !setName) return null;
	if (Object.prototype.hasOwnProperty.call(DEFAULT_DOUBLE_TRAINER_GROUPS, setName)) {
		return {
			name: setName,
			members: DEFAULT_DOUBLE_TRAINER_GROUPS[setName]
		};
	}
	for (var groupName in DEFAULT_DOUBLE_TRAINER_GROUPS) {
		if (!Object.prototype.hasOwnProperty.call(DEFAULT_DOUBLE_TRAINER_GROUPS, groupName)) continue;
		if (Object.prototype.hasOwnProperty.call(DEFAULT_DOUBLE_TRAINER_GROUPS[groupName], setName)) {
			return {
				name: groupName,
				members: DEFAULT_DOUBLE_TRAINER_GROUPS[groupName]
			};
		}
	}
	return null;
}

function getDisplayedTrainerTeamName(setName) {
	var group = getDefaultDoubleTrainerGroup(setName);
	return group ? group.name : setName;
}

function compareTrainerTeamNamesByMeta(left, right) {
	var meta = getTrainerTeamMetaCache();
	var leftMeta = meta[left] || {};
	var rightMeta = meta[right] || {};
	var leftHasTeamIndex = leftMeta.teamIndex !== null && leftMeta.teamIndex !== undefined;
	var rightHasTeamIndex = rightMeta.teamIndex !== null && rightMeta.teamIndex !== undefined;
	if (leftHasTeamIndex && rightHasTeamIndex && leftMeta.teamIndex !== rightMeta.teamIndex) {
		return leftMeta.teamIndex - rightMeta.teamIndex;
	}
	if (leftHasTeamIndex !== rightHasTeamIndex) {
		return leftHasTeamIndex ? -1 : 1;
	}
	if (!isHardcoreTrainerOrderingEnabled()) {
		var leftDefaultIndex = DEFAULT_TRAINER_ORDER_INDEX[left];
		var rightDefaultIndex = DEFAULT_TRAINER_ORDER_INDEX[right];
		var leftHasDefaultIndex = leftDefaultIndex !== undefined;
		var rightHasDefaultIndex = rightDefaultIndex !== undefined;
		if (leftHasDefaultIndex && rightHasDefaultIndex && leftDefaultIndex !== rightDefaultIndex) {
			return leftDefaultIndex - rightDefaultIndex;
		}
		if (leftHasDefaultIndex !== rightHasDefaultIndex) {
			return leftHasDefaultIndex ? -1 : 1;
		}
	}
	return null;
}

function sortTrainerTeamNames(names) {
	names.sort(function (left, right) {
		var metaComparison = compareTrainerTeamNamesByMeta(left, right);
		if (metaComparison !== null) return metaComparison;
		if (!isHardcoreTrainerOrderingEnabled()) return left.localeCompare(right);

		var orderIndex = getHardcoreTrainerOrderIndex();
		var leftCanonical = getHardcoreTrainerCanonicalName(left);
		var rightCanonical = getHardcoreTrainerCanonicalName(right);
		var leftKnown = Object.prototype.hasOwnProperty.call(orderIndex, leftCanonical);
		var rightKnown = Object.prototype.hasOwnProperty.call(orderIndex, rightCanonical);
		if (leftKnown && rightKnown && orderIndex[leftCanonical] !== orderIndex[rightCanonical]) {
			return orderIndex[leftCanonical] - orderIndex[rightCanonical];
		}
		if (leftKnown !== rightKnown) return leftKnown ? -1 : 1;
		if (leftCanonical !== rightCanonical) return leftCanonical.localeCompare(rightCanonical);

		var leftVariant = getHardcoreTrainerVariantRank(left);
		var rightVariant = getHardcoreTrainerVariantRank(right);
		if (leftVariant !== rightVariant) return leftVariant - rightVariant;

		return normalizeHardcoreTrainerLabel(left).localeCompare(normalizeHardcoreTrainerLabel(right));
	});
	return names;
}

function sortSetNamesForPokemon(setNames) {
	setNames.sort(function (left, right) {
		var metaComparison = compareTrainerTeamNamesByMeta(left, right);
		if (metaComparison !== null) return metaComparison;
		return left.localeCompare(right);
	});
	return setNames;
}

function matchesSetSearchText(text, term) {
	return text.indexOf(term) === 0 ||
		text.indexOf("-" + term) >= 0 ||
		text.indexOf(" " + term) >= 0 ||
		text.indexOf("[" + term) >= 0 ||
		text.indexOf("(" + term) >= 0;
}

function normalizeRosterSpriteName(pokemonName) {
	var normalized = (pokemonName || "")
		.replace("-Paldea", "Paldea")
		.replace("-Sevii", "")
		.replace("-Primal", "")
		.replace("-Origin", "");
	if (normalized === "Zygarde-10%") normalized = "Zygarde-10%25";
	if (normalized.indexOf("Arceus") !== -1) normalized = "Arceus";
	if (normalized.indexOf("Pikachu") !== -1) normalized = "Pikachu";
	return normalized;
}

function getRosterSpriteUrl(pokemonName) {
	return "https://raw.githubusercontent.com/May8th1995/sprites/master/" +
		encodeURIComponent(normalizeRosterSpriteName(pokemonName)) + ".png";
}

function escapeAttribute(value) {
	return (value || "")
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;");
}

function handleTrainerSpriteError(img) {
	if (!img || img.getAttribute("data-fallback-applied")) return;
	img.setAttribute("data-fallback-applied", "true");
	img.src = "./img/pokemon-question.svg";
	img.className += " trainer-pok-missing";
}

window.handleTrainerSpriteError = handleTrainerSpriteError;

function sortRosterEntries(entries) {
	entries.sort(function (left, right) {
		if (left.order !== null && right.order !== null && left.order !== right.order) {
			return left.order - right.order;
		}
		if (left.order !== null) return -1;
		if (right.order !== null) return 1;
		return left.fullSetName.localeCompare(right.fullSetName);
	});
	return entries;
}

function getEntriesForSetName(targetSetName) {
	if (!setdex || !targetSetName || targetSetName === "Blank Set") return [];
	var group = getDefaultDoubleTrainerGroup(targetSetName);
	var targetSetNames = group ? Object.keys(group.members) : [targetSetName];
	var entries = [];
	for (var pokemonName in setdex) {
		if (!Object.prototype.hasOwnProperty.call(setdex, pokemonName)) continue;
		for (var setName in setdex[pokemonName]) {
			if (!Object.prototype.hasOwnProperty.call(setdex[pokemonName], setName)) continue;
			if (targetSetNames.indexOf(setName) === -1) continue;
			var entry = {
				pokemonName: pokemonName,
				setName: setName,
				fullSetName: pokemonName + " (" + setName + ")",
				order: getRosterOrder(setdex[pokemonName][setName]),
				trainerSide: setdex[pokemonName][setName].trainerSide || (group ? group.members[setName] || null : null)
			};
			entries.push(entry);
		}
	}
	return sortRosterEntries(entries);
}

function getTrainerRosterEntries(fullSetName) {
	if ($("#randoms").prop("checked")) return [];
	var selected = parseSetSelection(fullSetName);
	if (!selected) return [];
	return getEntriesForSetName(getDisplayedTrainerTeamName(selected.setName));
}

function getTrainerTeamNames() {
	if ($("#randoms").prop("checked") || !setdex) return [];
	var seen = {};
	var names = [];
	for (var pokemonName in setdex) {
		if (!Object.prototype.hasOwnProperty.call(setdex, pokemonName)) continue;
		for (var setName in setdex[pokemonName]) {
			if (!Object.prototype.hasOwnProperty.call(setdex[pokemonName], setName)) continue;
			var displaySetName = getDisplayedTrainerTeamName(setName);
			if (setName === "Blank Set" || setdex[pokemonName][setName].isCustomSet || seen[displaySetName]) continue;
			seen[displaySetName] = true;
			names.push(displaySetName);
		}
	}
	return sortTrainerTeamNames(names);
}

function getTrainerTeamSelection(teamName) {
	var entries = getEntriesForSetName(teamName);
	return entries.length ? entries[0].fullSetName : null;
}

function getCustomSetEntries() {
	if (!setdex) return [];
	var entries = [];
	for (var pokemonName in setdex) {
		if (!Object.prototype.hasOwnProperty.call(setdex, pokemonName)) continue;
		for (var setName in setdex[pokemonName]) {
			if (!Object.prototype.hasOwnProperty.call(setdex[pokemonName], setName)) continue;
			if (!setdex[pokemonName][setName].isCustomSet) continue;
			entries.push({
				pokemonName: pokemonName,
				setName: setName,
				fullSetName: pokemonName + " (" + setName + ")",
				order: getRosterOrder(setdex[pokemonName][setName])
			});
		}
	}
	return sortRosterEntries(entries);
}

function buildRosterSprites(entries, clickClass, activeSetName) {
	var html = "";
	for (var i = 0; i < entries.length; i++) {
		var isActive = entries[i].fullSetName === activeSetName;
		html += '<img class="trainer-pok ' + clickClass + (isActive ? ' trainer-pok-active' : '') + '"' +
			' src="' + getRosterSpriteUrl(entries[i].pokemonName) + '"' +
			' data-id="' + escapeAttribute(entries[i].fullSetName) + '"' +
			' data-base-title="' + escapeAttribute(entries[i].fullSetName) + '"' +
			' alt="' + escapeAttribute(entries[i].pokemonName) + '"' +
			' title="' + escapeAttribute(entries[i].fullSetName) + '"' +
			' onerror="window.handleTrainerSpriteError(this)">';
	}
	return html;
}

function hasSplitTrainerRoster(entries) {
	for (var i = 0; i < entries.length; i++) {
		if (entries[i].trainerSide === "left" || entries[i].trainerSide === "right") return true;
	}
	return false;
}

function renderRoster($container, entries, clickClass, activeSetName) {
	var $wrapper = $container.closest(".trainer-poks");
	if (!$container.length || !$wrapper.length) return;
	if (hasSplitTrainerRoster(entries)) {
		var leftEntries = [];
		var rightEntries = [];
		for (var i = 0; i < entries.length; i++) {
			if (entries[i].trainerSide === "right") {
				rightEntries.push(entries[i]);
			} else {
				leftEntries.push(entries[i]);
			}
		}
		$container
			.addClass("trainer-pok-list-split")
			.html(
				'<div class="trainer-pok-side trainer-pok-side-left">' +
					buildRosterSprites(leftEntries, clickClass, activeSetName) +
				'</div>' +
				'<div class="trainer-pok-side trainer-pok-side-right">' +
					buildRosterSprites(rightEntries, clickClass, activeSetName) +
				'</div>'
			);
	} else {
		$container
			.removeClass("trainer-pok-list-split")
			.html(buildRosterSprites(entries, clickClass, activeSetName));
	}
	$wrapper.toggle(entries.length > 0);
}

function formatTrainerTeamDisplayText(text) {
	return (text || "")
		.toLowerCase()
		.replace(/(^|[\s\-/([&.])([a-z])/g, function (match, prefix, character) {
			return prefix + character.toUpperCase();
		});
}

function getTrainerTeamDisplayParts(teamName) {
	if (!teamName) {
		return {name: "", variant: ""};
	}
	var match = teamName.match(/^(.*?)(?:\s+\[([^\]]+)\])?$/);
	var name = match ? match[1] : teamName;
	var variant = match && match[2] ? match[2] : "";
	return {
		name: formatTrainerTeamDisplayText(name),
		variant: formatTrainerTeamDisplayText(variant)
	};
}

function updateTrainerRosterHeader(selected) {
	var $wrapper = $("#p2 .trainer-pok-list-opposing").closest(".trainer-poks");
	if (!$wrapper.length) return;
	var teamName = selected && selected.setName !== "Blank Set" ? getDisplayedTrainerTeamName(selected.setName) : "";
	var teamNames = getTrainerTeamNames();
	var displayParts = getTrainerTeamDisplayParts(teamName);
	var currentIndex = teamName ? teamNames.indexOf(teamName) : -1;
	$wrapper.find(".trainer-poks-subtitle")
		.text(displayParts.name)
		.css("display", teamName ? "block" : "none");
	$wrapper.find(".trainer-poks-variant")
		.text(displayParts.variant)
		.css("display", displayParts.variant ? "inline-flex" : "none");
	$wrapper.find(".trainer-poks-nameplate").css("display", teamName ? "block" : "none");
	$wrapper.find(".trainer-poks-counter")
		.text(currentIndex !== -1 ? ("Team " + (currentIndex + 1) + " of " + teamNames.length) : "")
		.css("display", currentIndex !== -1 ? "block" : "none");
	$wrapper.find(".trainer-nav-button").prop("disabled", !teamName || teamNames.length < 2);
}

function getDamageRangeProfile(result) {
	var range = result.range();
	return {
		min: range[0],
		max: range[1]
	};
}

function getBestMoveProfile(results, attacker) {
	var best = {min: 0, max: 0};
	if (!results || !attacker || !attacker.moves) return best;
	for (var i = 0; i < results.length; i++) {
		var move = attacker.moves[i];
		if (!move) continue;
		var profile = getDamageRangeProfile(results[i]);
		if (profile.max > best.max || (profile.max === best.max && profile.min > best.min)) {
			best = profile;
		}
	}
	return best;
}

function getRosterRuleClasses(rules) {
	var classes = [];
	for (var code in rules) {
		if (Object.prototype.hasOwnProperty.call(rules, code)) {
			classes.push(rules[code].className);
		}
	}
	return classes.join(" ");
}

function getRosterRule(rules, code) {
	return rules[code] || rules.none;
}

function getRosterSpeedCode(playerPokemon, opponentPokemon) {
	if (!playerPokemon || !opponentPokemon) return "none";
	if (playerPokemon.stats.spe > opponentPokemon.stats.spe) return "F";
	if (playerPokemon.stats.spe === opponentPokemon.stats.spe) return "T";
	return "S";
}

function getRosterDamageCode(playerBest, opponentBest, playerPokemon, opponentPokemon) {
	if (!playerPokemon || !opponentPokemon) return "none";
	var playerHp = playerPokemon.curHP();
	var opponentHp = opponentPokemon.curHP();
	var alwaysOhko = playerBest.min >= opponentHp;
	var maybeOhko = !alwaysOhko && playerBest.max >= opponentHp;
	var alwaysGetsOhko = opponentBest.min >= playerHp;
	var maybeGetsOhko = !alwaysGetsOhko && opponentBest.max >= playerHp;
	var hardCounter = opponentBest.max <= Math.floor(playerHp / 4) && maybeOhko;
	var wall = opponentBest.max <= Math.floor(playerHp / 4) && playerBest.max > opponentBest.max;

	if (alwaysOhko && alwaysGetsOhko) return "14";
	if (alwaysOhko && maybeGetsOhko) return "13";
	if (maybeOhko && alwaysGetsOhko) return "24";
	if (maybeOhko && maybeGetsOhko) return "23";
	if (hardCounter) return "W";
	if (wall) return "WMO";
	if (alwaysOhko) return "1";
	if (maybeOhko) return "2";
	if (alwaysGetsOhko) return "4";
	if (maybeGetsOhko) return "3";
	return "none";
}

function getRosterColorSummary(speedCode, damageCode) {
	return getRosterRule(ROSTER_SPEED_RULES, speedCode).label + " - " +
		getRosterRule(ROSTER_DAMAGE_RULES, damageCode).label;
}

function cacheRosterPlayerPokemon(fullSetName, pokemon) {
	if (!fullSetName || !pokemon) return;
	ROSTER_PLAYER_CACHE[fullSetName] = {
		gen: gen,
		pokemon: pokemon.clone()
	};
}

function getCachedRosterPlayerPokemon(fullSetName) {
	var cached = ROSTER_PLAYER_CACHE[fullSetName];
	if (!cached || cached.gen !== gen || !cached.pokemon) return null;
	return cached.pokemon.clone();
}

function getRosterPlayerPokemon(setName, activePlayerSet) {
	if (setName && activePlayerSet && setName === activePlayerSet) {
		var activePokemon = createPokemon($("#p1"));
		cacheRosterPlayerPokemon(activePlayerSet, activePokemon);
		return activePokemon;
	}
	var cachedPokemon = getCachedRosterPlayerPokemon(setName);
	if (cachedPokemon) return cachedPokemon;
	return createPokemon(setName);
}

function updateRosterColorCoding() {
	var $icons = $("#p1 .player-pok-list .trainer-pok");
	if (!$icons.length || $("#randoms").prop("checked")) return;
	var activePlayerSet = getSetSelectorInput($("#p1 .set-selector.player")).val();
	var opponentSet = getSetSelectorInput($("#p2 .set-selector.opposing")).val();
	if (!opponentSet) return;
	if (typeof window.calculateAllMoves !== "function") return;
	var playerFieldBase = createField();
	var opponentFieldBase = playerFieldBase.clone().swap();
	$icons.each(function () {
		var $icon = $(this);
		var setName = $icon.attr("data-id");
		if (!setName) return;
		var playerPokemon = getRosterPlayerPokemon(setName, activePlayerSet);
		var opponentPokemon = createPokemon($("#p2"));
		var results = window.calculateAllMoves(gen, playerPokemon, playerFieldBase.clone(), opponentPokemon, opponentFieldBase.clone());
		var playerBest = getBestMoveProfile(results[0], playerPokemon);
		var opponentBest = getBestMoveProfile(results[1], opponentPokemon);
		var speedCode = getRosterSpeedCode(playerPokemon, opponentPokemon);
		var damageCode = getRosterDamageCode(playerBest, opponentBest, playerPokemon, opponentPokemon);
		var speedRule = getRosterRule(ROSTER_SPEED_RULES, speedCode);
		var damageRule = getRosterRule(ROSTER_DAMAGE_RULES, damageCode);
		$icon.removeClass(ROSTER_SPEED_CLASSES + " " + ROSTER_DAMAGE_CLASSES);
		$icon.addClass(speedRule.className + " " + damageRule.className);
		var baseTitle = $icon.attr("data-base-title") || setName;
		$icon.attr("title", baseTitle + " vs " + opponentSet + " - " + getRosterColorSummary(speedCode, damageCode));
	});
}

function getSetSelectorInput($input) {
	if (!$input || !$input.length) return $();
	var $resolved = $input.filter("input.select2-offscreen");
	if (!$resolved.length) $resolved = $input.filter("input");
	if (!$resolved.length) $resolved = $input.find("input.select2-offscreen");
	if (!$resolved.length) $resolved = $input.find("input");
	return $resolved.first();
}

function getSetOptionById(setName) {
	var options = getSetOptions();
	for (var i = 0; i < options.length; i++) {
		if (options[i].id === setName) return options[i];
	}
	return null;
}

function selectRosterSet($input, setName) {
	var $resolved = getSetSelectorInput($input);
	if (!$resolved.length || !setName) return;
	var option = getSetOptionById(setName);
	if ($resolved.data("select2") && option) {
		$resolved.select2("data", option);
	}
	$resolved.val(setName);
	$resolved.change();
	$resolved.closest(".poke-info").find(".select2-chosen").first().text(option ? option.text : setName);
}

function selectTrainerTeamByOffset(offset) {
	var $input = $("#p2 .set-selector.opposing");
	var selected = parseSetSelection(getSetSelectorInput($input).val());
	if (!selected) return;
	var teamNames = getTrainerTeamNames();
	var currentIndex = teamNames.indexOf(getDisplayedTrainerTeamName(selected.setName));
	if (currentIndex === -1 || teamNames.length < 2) return;
	var nextIndex = (currentIndex + offset + teamNames.length) % teamNames.length;
	var nextSet = getTrainerTeamSelection(teamNames[nextIndex]);
	if (nextSet) selectRosterSet($input, nextSet);
}

function rememberOpposingSet(fullSetName) {
	if ($("#randoms").prop("checked") || !fullSetName) return;
	try {
		window.localStorage.setItem(getRosterStorageKey(), fullSetName);
	} catch (error) {}
}

function restoreRememberedOpposingSet() {
	if ($("#randoms").prop("checked")) return;
	var remembered = "";
	try {
		remembered = window.localStorage.getItem(getRosterStorageKey()) || "";
	} catch (error) {}
	if (!remembered || !getSetOptionById(remembered)) return;
	selectRosterSet($("#p2 .set-selector.opposing"), remembered);
}

function updateRosterSprites() {
	var activePlayerSet = getSetSelectorInput($("#p1 .set-selector.player")).val();
	var activeOpponentSet = getSetSelectorInput($("#p2 .set-selector.opposing")).val();
	renderRoster($("#p1 .player-pok-list"), getCustomSetEntries(), "left-side", activePlayerSet);
	renderRoster($("#p2 .trainer-pok-list-opposing"), getTrainerRosterEntries(activeOpponentSet), "right-side", activeOpponentSet);
	updateTrainerRosterHeader(parseSetSelection(activeOpponentSet));
	if (typeof updateRosterColorCoding === "function") {
		updateRosterColorCoding();
	}
}

$(document).on("click", ".left-side", function () {
	selectRosterSet($("#p1 .set-selector.player"), $(this).attr("data-id"));
});

$(document).on("click", ".right-side", function () {
	selectRosterSet($("#p2 .set-selector.opposing"), $(this).attr("data-id"));
});

$("#previous-trainer").click(function () {
	selectTrainerTeamByOffset(-1);
});

$("#next-trainer").click(function () {
	selectTrainerTeamByOffset(1);
});

// auto-update set details on select
$(".set-selector").change(function () {
	var fullSetName = $(this).val();
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));
	var pokemon = pokedex[pokemonName];
	if (pokemon) {
		var pokeObj = $(this).closest(".poke-info");
		if ($(this).hasClass("opposing")) rememberOpposingSet(fullSetName);
		var isAutoTera =
		(startsWith(pokemonName, "Ogerpon") && endsWith(pokemonName, "Tera")) ||
		pokemonName === 'Terapagos-Stellar';
		if (stickyMoves.getSelectedSide() === pokeObj.prop("id")) {
			stickyMoves.clearStickyMove();
		}
		pokeObj.find(".teraToggle").prop("checked", isAutoTera);
		stellarButtonsVisibility(pokeObj, 0);
		pokeObj.find(".boostedStat").val("");
		pokeObj.find(".analysis").attr("href", smogonAnalysis(pokemonName));
		pokeObj.find(".type1").val(pokemon.types[0]);
		pokeObj.find(".type2").val(pokemon.types[1]);
		pokeObj.find(".hp .base").val(pokemon.bs.hp);
		var i;
		for (i = 0; i < LEGACY_STATS[gen].length; i++) {
			pokeObj.find("." + LEGACY_STATS[gen][i] + " .base").val(pokemon.bs[LEGACY_STATS[gen][i]]);
		}
		pokeObj.find(".boost").val(0);
		pokeObj.find(".percent-hp").val(100);
		pokeObj.find(".status").val("Healthy");
		$(".status").change();
		var moveObj;
		var abilityObj = pokeObj.find(".ability");
		var itemObj = pokeObj.find(".item");
		var randset = $("#randoms").prop("checked") ? randdex[pokemonName] : undefined;
		var regSets = pokemonName in setdex && setName in setdex[pokemonName];

		if (randset) {
			var listItems = randdex[pokemonName].items ? randdex[pokemonName].items : [];
			var listAbilities = randdex[pokemonName].abilities ? randdex[pokemonName].abilities : [];
			if (gen >= 3) $(this).closest('.poke-info').find(".ability-pool").show();
			$(this).closest('.poke-info').find(".extraSetAbilities").text(listAbilities.join(', '));
			if (gen >= 2) $(this).closest('.poke-info').find(".item-pool").show();
			$(this).closest('.poke-info').find(".extraSetItems").text(listItems.join(', '));
			if (gen >= 9 || gen === 7 || gen === 6 || gen === 5 || gen === 4 || gen === 3) {
				$(this).closest('.poke-info').find(".role-pool").show();
				if (gen >= 9) $(this).closest('.poke-info').find(".tera-type-pool").show();
			}
			var listRoles = randdex[pokemonName].roles ? Object.keys(randdex[pokemonName].roles) : [];
			$(this).closest('.poke-info').find(".extraSetRoles").text(listRoles.join(', '));
			var listTeraTypes = [];
			if (randdex[pokemonName].roles && gen >= 9) {
				for (var roleName in randdex[pokemonName].roles) {
					var role = randdex[pokemonName].roles[roleName];
					for (var q = 0; q < role.teraTypes.length; q++) {
						if (listTeraTypes.indexOf(role.teraTypes[q]) === -1) {
							listTeraTypes.push(role.teraTypes[q]);
						}
					}
				}
			}
			pokeObj.find(".teraType").val(listTeraTypes[0] || getForcedTeraType(pokemonName) || pokemon.types[0]);
			$(this).closest('.poke-info').find(".extraSetTeraTypes").text(listTeraTypes.join(', '));
		} else {
			$(this).closest('.poke-info').find(".ability-pool").hide();
			$(this).closest('.poke-info').find(".item-pool").hide();
			$(this).closest('.poke-info').find(".role-pool").hide();
			$(this).closest('.poke-info').find(".tera-type-pool").hide();
		}
		if (regSets || randset) {
			var set = regSets ? correctHiddenPower(setdex[pokemonName][setName]) : randset;
			if (regSets) {
				pokeObj.find(".teraType").val(set.teraType || getForcedTeraType(pokemonName) || pokemon.types[0]);
			}
			pokeObj.find(".level").val(set.level === undefined ? 100 : set.level);
			pokeObj.find(".hp .evs").val((set.evs && set.evs.hp !== undefined) ? set.evs.hp : 0);
			pokeObj.find(".hp .ivs").val((set.ivs && set.ivs.hp !== undefined) ? set.ivs.hp : 31);
			pokeObj.find(".hp .dvs").val((set.dvs && set.dvs.hp !== undefined) ? set.dvs.hp : 15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(
					(set.evs && set.evs[LEGACY_STATS[gen][i]] !== undefined) ?
						set.evs[LEGACY_STATS[gen][i]] : ($("#randoms").prop("checked") ? 84 : 0));
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(
					(set.ivs && set.ivs[LEGACY_STATS[gen][i]] !== undefined) ? set.ivs[LEGACY_STATS[gen][i]] : 31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .dvs").val(
					(set.dvs && set.dvs[LEGACY_STATS[gen][i]] !== undefined) ? set.dvs[LEGACY_STATS[gen][i]] : 15);
			}
			setSelectValueIfValid(pokeObj.find(".nature"), set.nature, "Hardy");
			var abilityFallback = (typeof pokemon.abilities !== "undefined") ? pokemon.abilities[0] : "";
			if ($("#randoms").prop("checked")) {
				setSelectValueIfValid(abilityObj, randset.abilities && randset.abilities[0], abilityFallback);
				setSelectValueIfValid(itemObj, randset.items && randset.items[0], "");
			} else {
				setSelectValueIfValid(abilityObj, set.ability, abilityFallback);
				setSelectValueIfValid(itemObj, set.item, "");
			}
			var setMoves = set.moves;
			if (randset) {
				if (gen < 9 && gen !== 7 && gen !== 6 && gen !== 5 && gen !== 4 && gen !== 3) {
					setMoves = randset.moves;
				} else {
					setMoves = [];
					for (var role in randset.roles) {
						for (var q = 0; q < randset.roles[role].moves.length; q++) {
							var moveName = randset.roles[role].moves[q];
							if (setMoves.indexOf(moveName) === -1) setMoves.push(moveName);
						}
					}
				}
			}
			var moves = selectMovesFromRandomOptions(setMoves);
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				setSelectValueIfValid(moveObj, moves[i], "(No Move)");
				moveObj.change();
			}
			if (randset) {
				$(this).closest('.poke-info').find(".move-pool").show();
				$(this).closest('.poke-info').find(".extraSetMoves").html(formatMovePool(setMoves));
			}
		} else {
			pokeObj.find(".teraType").val(getForcedTeraType(pokemonName) || pokemon.types[0]);
			pokeObj.find(".level").val(defaultLevel);
			pokeObj.find(".hp .evs").val(0);
			pokeObj.find(".hp .ivs").val(31);
			pokeObj.find(".hp .dvs").val(15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(0);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .dvs").val(15);
			}
			pokeObj.find(".nature").val("Hardy");
			setSelectValueIfValid(abilityObj, pokemon.abilities[0], "");
			if (startsWith(pokemonName, "Ogerpon-") && !startsWith(pokemonName, "Ogerpon-Teal")) {
				itemObj.val(pokemonName.split("-")[1] + " Mask");
			} else {
				itemObj.val("");
			}
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr('data-prev', moveObj.val());
				moveObj.val("(No Move)");
				moveObj.change();
			}
			if ($("#randoms").prop("checked")) {
				$(this).closest('.poke-info').find(".move-pool").hide();
			}
		}
		if (typeof getSelectedTiers === "function") { // doesn't exist when in 1vs1 mode
			var format = getSelectedTiers()[0];
			var is50lvl = startsWith(format, "VGC") || startsWith(format, "Battle Spot");
			//var isDoubles = format === 'Doubles' || has50lvl; *TODO*
			if (format === "LC") pokeObj.find(".level").val(5);
			if (is50lvl) pokeObj.find(".level").val(50);
			//if (isDoubles) field.gameType = 'Doubles'; *TODO*
		}
		var formeObj = $(this).siblings().find(".forme").parent();
		itemObj.prop("disabled", false);
		var baseForme;
		if (pokemon.baseSpecies && pokemon.baseSpecies !== pokemon.name) {
			baseForme = pokedex[pokemon.baseSpecies];
		}
		if (pokemon.otherFormes) {
			showFormes(formeObj, pokemonName, pokemon, pokemonName);
		} else if (baseForme && baseForme.otherFormes) {
			showFormes(formeObj, pokemonName, baseForme, pokemon.baseSpecies);
		} else {
			formeObj.hide();
		}
		calcHP(pokeObj);
		calcStats(pokeObj);
		abilityObj.change();
		itemObj.change();
		if (pokemon.gender === "N") {
			pokeObj.find(".gender").parent().hide();
			pokeObj.find(".gender").val("");
		} else pokeObj.find(".gender").parent().show();
	}
	updateRosterSprites();
});

function formatMovePool(moves) {
	var formatted = [];
	for (var i = 0; i < moves.length; i++) {
		formatted.push(isKnownDamagingMove(moves[i]) ? moves[i] : '<i>' + moves[i] + '</i>');
	}
	return formatted.join(', ');
}

function isKnownDamagingMove(move) {
	var m = GENERATION.moves.get(calc.toID(move));
	return m && m.basePower;
}

function selectMovesFromRandomOptions(moves) {
	var selected = [];

	var nonDamaging = [];
	for (var i = 0; i < moves.length; i++) {
		if (isKnownDamagingMove(moves[i])) {
			selected.push(moves[i]);
			if (selected.length >= 4) break;
		} else {
			nonDamaging.push(moves[i]);
		}
	}

	while (selected.length < 4 && nonDamaging.length) {
		selected.push(nonDamaging.pop());
	}

	return selected;
}

function showFormes(formeObj, pokemonName, pokemon, baseFormeName) {
	var formes = pokemon.otherFormes.slice();
	formes.unshift(baseFormeName);

	var defaultForme = formes.indexOf(pokemonName);
	if (defaultForme < 0) defaultForme = 0;

	var formeOptions = getSelectOptions(formes, false, defaultForme);
	formeObj.children("select").find("option").remove().end().append(formeOptions).change();
	formeObj.show();
}

function stellarButtonsVisibility(pokeObj, vis) {
	var fullSetName = pokeObj.find("input.set-selector").val();
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var moveObjs = [
		pokeObj.find(".move1"),
		pokeObj.find(".move2"),
		pokeObj.find(".move3"),
		pokeObj.find(".move4")
	];
	if (vis && !startsWith(pokemonName, 'Terapagos')) {
		for (var i = 0; i < moveObjs.length; i++) {
			var moveObj = moveObjs[i];
			moveObj.find(".move-stellar").prop("checked", true);
			moveObj.find(".stellar-btn").show();
		}
		return;
	}
	for (var i = 0; i < moveObjs.length; i++) {
		var moveObj = moveObjs[i];
		moveObj.find(".move-stellar").prop("checked", false);
		moveObj.find(".stellar-btn").hide();
	}
}

function setSelectValueIfValid(select, value, fallback) {
	select.val(!value ? fallback : select.children("option[value='" + value + "']").length ? value : fallback);
}

$(".teraToggle").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	stellarButtonsVisibility(pokeObj, pokeObj.find(".teraType").val() === "Stellar" && this.checked);
	var forme = $(this).parent().siblings().find(".forme");
	var curForme = forme.val();
	if (forme.is(":hidden")) return;
	var container = $(this).closest(".info-group").siblings();
	// Ogerpon mechs
	if (!startsWith(curForme, "Ogerpon")) return;
	if (
		curForme !== "Ogerpon" && !endsWith(curForme, "Tera") &&
		container.find(".item").val() !== curForme.split("-")[1] + " Mask"
	) return;
	if (this.checked) {
		var newForme = curForme === "Ogerpon" ? "Ogerpon-Teal-Tera" : curForme + "-Tera";
		forme.val(newForme);
		container.find(".ability").val("Embody Aspect (" + newForme.split("-")[1] + ")");
		return;
	}
	if (!endsWith(curForme, "Tera")) return;
	var newForme = curForme === "Ogerpon-Teal-Tera" ? "Ogerpon" : curForme.slice(0, -5);
	forme.val(newForme);
	container.find(".ability").val(pokedex[newForme].abilities[0]);
});

$(".forme").change(function () {
	var altForme = pokedex[$(this).val()],
		container = $(this).closest(".info-group").siblings(),
		fullSetName = container.find(".select2-chosen").first().text(),
		pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
		setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));

	$(this).parent().siblings().find(".type1").val(altForme.types[0]);
	$(this).parent().siblings().find(".type2").val(altForme.types[1] ? altForme.types[1] : "");
	for (var i = 0; i < LEGACY_STATS[9].length; i++) {
		var baseStat = container.find("." + LEGACY_STATS[9][i]).find(".base");
		baseStat.val(altForme.bs[LEGACY_STATS[9][i]]);
		baseStat.keyup();
	}
	if (
		(startsWith($(this).val(), "Ogerpon") && endsWith($(this).val(), "Tera")) || $(this).val() === "Terapagos-Stellar"
	) {
		$(this).parent().siblings().find(".teraToggle").prop("checked", true);
	}
	var isRandoms = $("#randoms").prop("checked");
	var pokemonSets = isRandoms ? randdex[pokemonName] : setdex[pokemonName];
	var chosenSet = pokemonSets && pokemonSets[setName];
	var greninjaSet = $(this).val().indexOf("Greninja") !== -1;
	var isAltForme = $(this).val() !== pokemonName;
	if (isAltForme && abilities.indexOf(altForme.abilities[0]) !== -1 && !greninjaSet) {
		container.find(".ability").val(altForme.abilities[0]);
	} else if (greninjaSet) {
		$(this).parent().find(".ability");
	} else if (chosenSet) {
		if (!isRandoms) {
			container.find(".abilities").val(chosenSet.ability);
		} else {
			container.find(".ability").val(chosenSet.abilities[0]);
		}
	}
	var forcedTeraType = getForcedTeraType($(this).val());
	if (forcedTeraType) {
		$(this).parent().siblings().find(".teraType").val(forcedTeraType);
	}
	container.find(".ability").keyup();
	if (startsWith($(this).val(), "Ogerpon-") && !startsWith($(this).val(), "Ogerpon-Teal")) {
		container.find(".item").val($(this).val().split("-")[1] + " Mask").keyup();
	} else {
		container.find(".item").prop("disabled", false);
	}
});

function correctHiddenPower(pokemon) {
	// After Gen 7 bottlecaps means you can have a HP without perfect IVs
	// Level 100 is elided from sets so if its undefined its level 100
	if (gen >= 7 && (!pokemon.level || pokemon.level >= 100)) return pokemon;

	// Convert the legacy stats table to a useful one, and also figure out if all are maxed
	var ivs = {};
	var maxed = true;
	for (var i = 0; i <= LEGACY_STATS[9].length; i++) {
		var s = LEGACY_STATS[9][i];
		var iv = ivs[legacyStatToStat(s)] = (pokemon.ivs && pokemon.ivs[s]) || 31;
		if (iv !== 31) maxed = false;
	}

	var expected = calc.Stats.getHiddenPower(GENERATION, ivs);
	for (var i = 0; i < pokemon.moves.length; i++) {
		var m = pokemon.moves[i].match(HIDDEN_POWER_REGEX);
		if (!m) continue;
		// The Pokemon has Hidden Power and is not maxed but the types don't match we don't
		// want to attempt to reconcile the user's IVs so instead just correct the HP type
		if (!maxed && expected.type !== m[1]) {
			pokemon.moves[i] = "Hidden Power " + expected.type;
		} else {
			// Otherwise, use the default preset hidden power IVs that PS would use
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (!hpIVs) continue; // some impossible type was specified, ignore
			pokemon.ivs = pokemon.ivs || {hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31};
			pokemon.dvs = pokemon.dvs || {hp: 15, at: 15, df: 15, sa: 15, sd: 15, sp: 15};
			for (var stat in hpIVs) {
				pokemon.ivs[calc.Stats.shortForm(stat)] = hpIVs[stat];
				pokemon.dvs[calc.Stats.shortForm(stat)] = calc.Stats.IVToDV(hpIVs[stat]);
			}
			if (gen < 3) {
				pokemon.dvs.hp = calc.Stats.getHPDV({
					atk: pokemon.ivs.at || 31,
					def: pokemon.ivs.df || 31,
					spe: pokemon.ivs.sp || 31,
					spc: pokemon.ivs.sa || 31
				});
				pokemon.ivs.hp = calc.Stats.DVToIV(pokemon.dvs.hp);
			}
		}
	}
	return pokemon;
}

function createPokemon(pokeInfo) {
	if (typeof pokeInfo === "string") { // in this case, pokeInfo is the id of an individual setOptions value whose moveset's tier matches the selected tier(s)
		var name = pokeInfo.substring(0, pokeInfo.indexOf(" ("));
		var setName = pokeInfo.substring(pokeInfo.indexOf("(") + 1, pokeInfo.lastIndexOf(")"));
		var isRandoms = $("#randoms").prop("checked");
		var set = isRandoms ? randdex[name] : setdex[name][setName];

		var ivs = {};
		var evs = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			var stat = legacyStatToStat(legacyStat);

			ivs[stat] = (gen >= 3 && set.ivs && typeof set.ivs[legacyStat] !== "undefined") ? set.ivs[legacyStat] : 31;
			evs[stat] = (set.evs && typeof set.evs[legacyStat] !== "undefined") ? set.evs[legacyStat] : 0;
		}
		var moveNames = set.moves;
		if (isRandoms && (gen >= 9 || gen === 7 || gen === 6 || gen === 5 || gen === 4 || gen === 3)) {
			moveNames = [];
			for (var role in set.roles) {
				for (var q = 0; q < set.roles[role].moves.length; q++) {
					var moveName = set.roles[role].moves[q];
					if (moveNames.indexOf(moveName) === -1) moveNames.push(moveName);
				}
			}
		}

		var ability = set.ability;
		var item = set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || set.item.indexOf("ite") < 0) ? set.item : "";
		var pokemonMoves = [];
		for (var i = 0; i < 4; i++) {
			var moveName = moveNames[i];
			pokemonMoves.push(new calc.Move(gen, moves[moveName] ? moveName : "(No Move)", {ability: ability, item: item}));
		}

		if (isRandoms) {
			pokemonMoves = pokemonMoves.filter(function (move) {
				return move.category !== "Status";
			});
		}

		return new calc.Pokemon(gen, name, {
			level: set.level,
			ability: set.ability,
			abilityOn: true,
			item: item,
			nature: set.nature,
			ivs: ivs,
			evs: evs,
			moves: pokemonMoves
		});
	} else {
		var setName = pokeInfo.find("input.set-selector").val();
		var name;
		if (setName.indexOf("(") === -1) {
			name = setName;
		} else {
			var pokemonName = setName.substring(0, setName.indexOf(" ("));
			var species = pokedex[pokemonName];
			name = (species.otherFormes || (species.baseSpecies && species.baseSpecies !== pokemonName)) ? pokeInfo.find(".forme").val() : pokemonName;
		}

		var baseStats = {};
		var ivs = {};
		var evs = {};
		var boosts = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var stat = legacyStatToStat(LEGACY_STATS[gen][i]);
			baseStats[stat === 'spc' ? 'spa' : stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .base").val();
			ivs[stat] = gen > 2 ? ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .ivs").val() : ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .dvs").val() * 2 + 1;
			evs[stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .evs").val();
			boosts[stat] = ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .boost").val();
		}
		if (gen === 1) baseStats.spd = baseStats.spa;

		var ability = pokeInfo.find(".ability").val();
		var item = pokeInfo.find(".item").val();
		var isDynamaxed = pokeInfo.find(".max").prop("checked");
		var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
		var opts = {
			ability: ability,
			item: item,
			isDynamaxed: isDynamaxed,
			teraType: teraType,
		};
		pokeInfo.isDynamaxed = isDynamaxed;
		calcHP(pokeInfo);
		var curHP = ~~pokeInfo.find(".current-hp").val();
		// FIXME the Pokemon constructor expects non-dynamaxed HP
		if (isDynamaxed) curHP = Math.floor(curHP / 2);
		var types = [pokeInfo.find(".type1").val(), pokeInfo.find(".type2").val()];
		return new calc.Pokemon(gen, name, {
			level: ~~pokeInfo.find(".level").val(),
			ability: ability,
			abilityOn: pokeInfo.find(".abilityToggle").is(":checked"),
			item: item,
			gender: pokeInfo.find(".gender").is(":visible") ? getGender(pokeInfo.find(".gender").val()) : "N",
			nature: pokeInfo.find(".nature").val(),
			ivs: ivs,
			evs: evs,
			isDynamaxed: isDynamaxed,
			isSaltCure: pokeInfo.find(".saltcure").is(":checked"),
			alliesFainted: parseInt(pokeInfo.find(".alliesFainted").val()),
			boostedStat: pokeInfo.find(".boostedStat").val() || undefined,
			teraType: teraType,
			boosts: boosts,
			curHP: curHP,
			status: CALC_STATUS[pokeInfo.find(".status").val()],
			toxicCounter: status === 'Badly Poisoned' ? ~~pokeInfo.find(".toxic-counter").val() : 0,
			moves: [
				getMoveDetails(pokeInfo.find(".move1"), opts),
				getMoveDetails(pokeInfo.find(".move2"), opts),
				getMoveDetails(pokeInfo.find(".move3"), opts),
				getMoveDetails(pokeInfo.find(".move4"), opts),
			],
			overrides: {
				baseStats: baseStats,
				types: types
			}
		});
	}
}

function getGender(gender) {
	if (!gender || gender === 'genderless' || gender === 'N') return 'N';
	if (gender.toLowerCase() === 'male' || gender === 'M') return 'M';
	return 'F';
}

function getMoveDetails(moveInfo, opts) {
	var moveName = moveInfo.find("select.move-selector").val();
	var isZMove = gen > 6 && moveInfo.find("input.move-z").prop("checked");
	var isCrit = moveInfo.find(".move-crit").prop("checked");
	var isStellarFirstUse = moveInfo.find(".move-stellar").prop("checked");
	var hits = +moveInfo.find(".move-hits").val();
	var timesUsed = +moveInfo.find(".stat-drops").val();
	var timesUsedWithMetronome = moveInfo.find(".metronome").is(':visible') ? +moveInfo.find(".metronome").val() : 1;
	var overrides = {
		basePower: +moveInfo.find(".move-bp").val(),
		type: moveInfo.find(".move-type").val()
	};
	if (moveName === 'Tera Blast') {
		// custom logic for stellar type tera blast
		var isStellar = opts.teraType === 'Stellar';
		var statDrops = moveInfo.find('.stat-drops');
		var dropsStats = statDrops.is(':visible');
		if (isStellar !== dropsStats) {
			// update stat drop dropdown here
			if (isStellar) statDrops.show(); else statDrops.hide();
		}
		if (isStellar) overrides.self = {boosts: {atk: -1, spa: -1}};
	}
	if (gen >= 4) overrides.category = moveInfo.find(".move-cat").val();
	return new calc.Move(gen, moveName, {
		ability: opts.ability, item: opts.item, useZ: isZMove, species: opts.species, isCrit: isCrit, hits: hits,
		isStellarFirstUse: isStellarFirstUse, timesUsed: timesUsed, timesUsedWithMetronome: timesUsedWithMetronome,
		overrides: overrides, useMax: opts.useMax
	});
}

function createField() {
	var gameType = $("input:radio[name='format']:checked").val();
	var isBeadsOfRuin = $("#beads").prop("checked");
	var isTabletsOfRuin = $("#tablets").prop("checked");
	var isSwordOfRuin = $("#sword").prop("checked");
	var isVesselOfRuin = $("#vessel").prop("checked");
	var isMagicRoom = $("#magicroom").prop("checked");
	var isWonderRoom = $("#wonderroom").prop("checked");
	var isGravity = $("#gravity").prop("checked");
	var isSR = [$("#srL").prop("checked"), $("#srR").prop("checked")];
	var weather;
	var spikes;
	if (gen === 2) {
		spikes = [$("#gscSpikesL").prop("checked") ? 1 : 0, $("#gscSpikesR").prop("checked") ? 1 : 0];
		weather = $("input:radio[name='gscWeather']:checked").val();
	} else {
		weather = $("input:radio[name='weather']:checked").val();
		spikes = [~~$("input:radio[name='spikesL']:checked").val(), ~~$("input:radio[name='spikesR']:checked").val()];
	}
	var steelsurge = [$("#steelsurgeL").prop("checked"), $("#steelsurgeR").prop("checked")];
	var vinelash = [$("#vinelashL").prop("checked"), $("#vinelashR").prop("checked")];
	var wildfire = [$("#wildfireL").prop("checked"), $("#wildfireR").prop("checked")];
	var cannonade = [$("#cannonadeL").prop("checked"), $("#cannonadeR").prop("checked")];
	var volcalith = [$("#volcalithL").prop("checked"), $("#volcalithR").prop("checked")];
	var terrain = ($("input:checkbox[name='terrain']:checked").val()) ? $("input:checkbox[name='terrain']:checked").val() : "";
	var isReflect = [$("#reflectL").prop("checked"), $("#reflectR").prop("checked")];
	var isLightScreen = [$("#lightScreenL").prop("checked"), $("#lightScreenR").prop("checked")];
	var isProtected = [$("#protectL").prop("checked"), $("#protectR").prop("checked")];
	var isSeeded = [$("#leechSeedL").prop("checked"), $("#leechSeedR").prop("checked")];
	var isForesight = [$("#foresightL").prop("checked"), $("#foresightR").prop("checked")];
	var isHelpingHand = [$("#helpingHandL").prop("checked"), $("#helpingHandR").prop("checked")];
	var isTailwind = [$("#tailwindL").prop("checked"), $("#tailwindR").prop("checked")];
	var isFlowerGift = [$("#flowerGiftL").prop("checked"), $("#flowerGiftR").prop("checked")];
	var isFriendGuard = [$("#friendGuardL").prop("checked"), $("#friendGuardR").prop("checked")];
	var isAuroraVeil = [$("#auroraVeilL").prop("checked"), $("#auroraVeilR").prop("checked")];
	var isBattery = [$("#batteryL").prop("checked"), $("#batteryR").prop("checked")];
	var isPowerSpot = [$("#powerSpotL").prop("checked"), $("#powerSpotR").prop("checked")];
	// TODO: support switching in as well!
	var isSwitchingOut = [$("#switchingL").prop("checked"), $("#switchingR").prop("checked")];

	var createSide = function (i) {
		return new calc.Side({
			spikes: spikes[i], isSR: isSR[i], steelsurge: steelsurge[i],
			vinelash: vinelash[i], wildfire: wildfire[i], cannonade: cannonade[i], volcalith: volcalith[i],
			isReflect: isReflect[i], isLightScreen: isLightScreen[i],
			isProtected: isProtected[i], isSeeded: isSeeded[i], isForesight: isForesight[i],
			isTailwind: isTailwind[i], isHelpingHand: isHelpingHand[i], isFlowerGift: isFlowerGift[i], isFriendGuard: isFriendGuard[i],
			isAuroraVeil: isAuroraVeil[i], isBattery: isBattery[i], isPowerSpot: isPowerSpot[i], isSwitching: isSwitchingOut[i] ? 'out' : undefined
		});
	};
	return new calc.Field({
		gameType: gameType, weather: weather, terrain: terrain,
		isMagicRoom: isMagicRoom, isWonderRoom: isWonderRoom, isGravity: isGravity,
		isBeadsOfRuin: isBeadsOfRuin, isTabletsOfRuin: isTabletsOfRuin,
		isSwordOfRuin: isSwordOfRuin, isVesselOfRuin: isVesselOfRuin,
		attackerSide: createSide(0), defenderSide: createSide(1)
	});
}

function calcHP(poke) {
	var total = calcStat(poke, "hp");
	var $maxHP = poke.find(".max-hp");

	var prevMaxHP = Number($maxHP.attr('data-prev')) || total;
	var $currentHP = poke.find(".current-hp");
	var prevCurrentHP = $currentHP.attr('data-set') ? Math.min(Number($currentHP.val()), prevMaxHP) : prevMaxHP;
	// NOTE: poke.find(".percent-hp").val() is a rounded value!
	var prevPercentHP = 100 * prevCurrentHP / prevMaxHP;

	$maxHP.text(total);
	$maxHP.attr('data-prev', total);

	var newCurrentHP = calcCurrentHP(poke, total, prevPercentHP);
	calcPercentHP(poke, total, newCurrentHP);

	$currentHP.attr('data-set', true);
}

function calcStat(poke, StatID) {
	var stat = poke.find("." + StatID);
	var base = ~~stat.find(".base").val();
	var level = ~~poke.find(".level").val();
	var nature, ivs, evs;
	if (gen < 3) {
		ivs = ~~stat.find(".dvs").val() * 2;
		evs = 252;
	} else {
		ivs = ~~stat.find(".ivs").val();
		evs = ~~stat.find(".evs").val();
		if (StatID !== "hp") nature = poke.find(".nature").val();
	}
	// Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
	var total = calc.calcStat(gen, legacyStatToStat(StatID), base, ivs, evs, level, nature);
	if (gen > 7 && StatID === "hp" && poke.isDynamaxed && total !== 1) {
		total *= 2;
	}
	stat.find(".total").text(total);
	return total;
}

var GENERATION = {
	'1': 1, 'rb': 1, 'rby': 1,
	'2': 2, 'gs': 2, 'gsc': 2,
	'3': 3, 'rs': 3, 'rse': 3, 'frlg': 3, 'adv': 3,
	'4': 4, 'dp': 4, 'dpp': 4, 'hgss': 4,
	'5': 5, 'bw': 5, 'bw2': 5, 'b2w2': 5,
	'6': 6, 'xy': 6, 'oras': 6,
	'7': 7, 'sm': 7, 'usm': 7, 'usum': 7,
	'8': 8, 'ss': 8,
	'9': 9, 'sv': 9
};

var SETDEX = [
	{},
	typeof SETDEX_RBY === 'undefined' ? {} : SETDEX_RBY,
	typeof SETDEX_GSC === 'undefined' ? {} : SETDEX_GSC,
	typeof SETDEX_ADV === 'undefined' ? {} : SETDEX_ADV,
	typeof SETDEX_DPP === 'undefined' ? {} : SETDEX_DPP,
	typeof SETDEX_BW === 'undefined' ? {} : SETDEX_BW,
	typeof SETDEX_XY === 'undefined' ? {} : SETDEX_XY,
	typeof SETDEX_SM === 'undefined' ? {} : SETDEX_SM,
	typeof SETDEX_SS === 'undefined' ? {} : SETDEX_SS,
	typeof SETDEX_SV === 'undefined' ? {} : SETDEX_SV,
];
var RANDDEX = [
	{},
	typeof GEN1RANDOMBATTLE === 'undefined' ? {} : GEN1RANDOMBATTLE,
	typeof GEN2RANDOMBATTLE === 'undefined' ? {} : GEN2RANDOMBATTLE,
	typeof GEN3RANDOMBATTLE === 'undefined' ? {} : GEN3RANDOMBATTLE,
	typeof GEN4RANDOMBATTLE === 'undefined' ? {} : GEN4RANDOMBATTLE,
	typeof GEN5RANDOMBATTLE === 'undefined' ? {} : GEN5RANDOMBATTLE,
	typeof GEN6RANDOMBATTLE === 'undefined' ? {} : GEN6RANDOMBATTLE,
	typeof GEN7RANDOMBATTLE === 'undefined' ? {} : GEN7RANDOMBATTLE,
	typeof GEN8RANDOMBATTLE === 'undefined' ? {} : GEN8RANDOMBATTLE,
	typeof GEN9RANDOMBATTLE === 'undefined' ? {} : GEN9RANDOMBATTLE,
];
var gen, genWasChanged, notation, pokedex, setdex, randdex, typeChart, moves, abilities, items, calcHP, calcStat, GENERATION;

$(".gen").change(function () {
	/*eslint-disable */
	gen = ~~$(this).val() || 9;
	GENERATION = calc.Generations.get(gen);
	var params = new URLSearchParams(window.location.search);
	if (gen === 9) {
		params.delete('gen');
		params = '' + params;
		if (window.history && window.history.replaceState) {
			window.history.replaceState({}, document.title, window.location.pathname + (params.length ? '?' + params : ''));
		}
	} else {
		params.set('gen', gen);
		if (window.history && window.history.pushState) {
			params.sort();
			var path = window.location.pathname + '?' + params;
			window.history.pushState({}, document.title, path);
			gtag('config', 'UA-26211653-3', {'page_path': path});
		}
	}
	genWasChanged = true;
	/* eslint-enable */
	// declaring these variables with var here makes z moves not work; TODO
	pokedex = calc.SPECIES[gen];
	setdex = SETDEX[gen];
	randdex = RANDDEX[gen];
	typeChart = calc.TYPE_CHART[gen];
	moves = calc.MOVES[gen];
	items = calc.ITEMS[gen];
	abilities = calc.ABILITIES[gen];
	clearField();
	$("#importedSets").prop("checked", false);
	loadDefaultLists();
	$(".gen-specific.g" + gen).show();
	$(".gen-specific").not(".g" + gen).hide();
	var typeOptions = getSelectOptions(Object.keys(typeChart));
	$("select.type1, select.move-type").find("option").remove().end().append(typeOptions);
	$("select.teraType").find("option").remove().end().append(getSelectOptions(Object.keys(typeChart).slice(1)));
	$("select.type2").find("option").remove().end().append("<option value=\"\">(none)</option>" + typeOptions);
	var moveOptions = getSelectOptions(Object.keys(moves), true);
	$("select.move-selector").find("option").remove().end().append(moveOptions);
	var abilityOptions = getSelectOptions(abilities, true);
	$("select.ability").find("option").remove().end().append("<option value=\"\">(other)</option>" + abilityOptions);
	var itemOptions = getSelectOptions(items, true);
	$("select.item").find("option").remove().end().append("<option value=\"\">(none)</option>" + itemOptions);

	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
});

function getFirstValidSetOption() {
	var sets = getSetOptions();
	// NB: The first set is never valid, so we start searching after it.
	for (var i = 1; i < sets.length; i++) {
		if (sets[i].id && sets[i].id.indexOf('(Blank Set)') === -1) return sets[i];
	}
	return {text: 'Houndoom (Blank Set)', id: 'Houndoom (Blank Set)'};
}

$(".notation").change(function () {
	notation = $(this).val();
});

function clearField() {
	$("#singles-format").prop("checked", true);
	$("#clear").prop("checked", true);
	$("#gscClear").prop("checked", true);
	$("#gravity").prop("checked", false);
	$("#srL").prop("checked", false);
	$("#srR").prop("checked", false);
	$("#spikesL0").prop("checked", true);
	$("#spikesR0").prop("checked", true);
	$("#gscSpikesL").prop("checked", false);
	$("#gscSpikesR").prop("checked", false);
	$("#steelsurgeL").prop("checked", false);
	$("#steelsurgeR").prop("checked", false);
	$("#vinelashL").prop("checked", false);
	$("#vinelashR").prop("checked", false);
	$("#wildfireL").prop("checked", false);
	$("#wildfireR").prop("checked", false);
	$("#cannonadeL").prop("checked", false);
	$("#cannonadeR").prop("checked", false);
	$("#volcalithL").prop("checked", false);
	$("#volcalithR").prop("checked", false);
	$("#reflectL").prop("checked", false);
	$("#reflectR").prop("checked", false);
	$("#lightScreenL").prop("checked", false);
	$("#lightScreenR").prop("checked", false);
	$("#protectL").prop("checked", false);
	$("#protectR").prop("checked", false);
	$("#leechSeedL").prop("checked", false);
	$("#leechSeedR").prop("checked", false);
	$("#foresightL").prop("checked", false);
	$("#foresightR").prop("checked", false);
	$("#helpingHandL").prop("checked", false);
	$("#helpingHandR").prop("checked", false);
	$("#tailwindL").prop("checked", false);
	$("#tailwindR").prop("checked", false);
	$("#friendGuardL").prop("checked", false);
	$("#friendGuardR").prop("checked", false);
	$("#auroraVeilL").prop("checked", false);
	$("#auroraVeilR").prop("checked", false);
	$("#batteryL").prop("checked", false);
	$("#batteryR").prop("checked", false);
	$("#switchingL").prop("checked", false);
	$("#switchingR").prop("checked", false);
	$("input:checkbox[name='terrain']").prop("checked", false);
}

function getSetOptions(sets) {
	var setsHolder = sets;
	if (setsHolder === undefined) {
		setsHolder = pokedex;
	}
	var pokeNames = Object.keys(setsHolder);
	pokeNames.sort();
	var setOptions = [];
	for (var i = 0; i < pokeNames.length; i++) {
		var pokeName = pokeNames[i];
		setOptions.push({
			pokemon: pokeName,
			text: pokeName
		});
		if ($("#randoms").prop("checked")) {
			if (pokeName in randdex) {
				setOptions.push({
					pokemon: pokeName,
					set: 'Randoms Set',
					text: pokeName + " (Randoms)",
					id: pokeName + " (Randoms)"
				});
			}
		} else {
			if (pokeName in setdex) {
				var setNames = Object.keys(setdex[pokeName]);
				sortSetNamesForPokemon(setNames);
				for (var j = 0; j < setNames.length; j++) {
					var setName = setNames[j];
					var isCustom = setdex[pokeName][setName].isCustomSet;
					var defaultName = isCustom && setName === pokeName;
					setOptions.push({
						pokemon: pokeName,
						set: setName,
						text: defaultName ? pokeName : pokeName + " (" + setName + ")",
						id: pokeName + " (" + setName + ")",
						isCustom: isCustom,
						defaultName: defaultName,
						nickname: setdex[pokeName][setName].nickname || ""
					});
				}
			}
			setOptions.push({
				pokemon: pokeName,
				set: "Blank Set",
				text: pokeName + " (Blank Set)",
				id: pokeName + " (Blank Set)"
			});
		}
	}
	return setOptions;
}

function getSelectOptions(arr, sort, defaultOption) {
	if (sort) {
		arr.sort();
	}
	var r = '';
	for (var i = 0; i < arr.length; i++) {
		r += '<option value="' + arr[i] + '" ' + (defaultOption === i ? 'selected' : '') + '>' + arr[i] + '</option>';
	}
	return r;
}
var stickyMoves = (function () {
	var lastClicked = 'resultMoveL1';
	$(".result-move").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-move");
		} else {
			$('.locked-move').removeClass('locked-move');
		}
		lastClicked = this.id;
	});

	return {
		clearStickyMove: function () {
			lastClicked = null;
			$('.locked-move').removeClass('locked-move');
		},
		setSelectedMove: function (slot) {
			lastClicked = slot;
		},
		getSelectedSide: function () {
			if (lastClicked) {
				if (lastClicked.indexOf('resultMoveL') !== -1) {
					return 'p1';
				} else if (lastClicked.indexOf('resultMoveR') !== -1) {
					return 'p2';
				}
			}
			return null;
		}
	};
})();

function isPokeInfoGrounded(pokeInfo) {
	var teraType = pokeInfo.find(".teraToggle").is(":checked") ? pokeInfo.find(".teraType").val() : undefined;
	return $("#gravity").prop("checked") || (
		  teraType ? teraType !== "Flying" : pokeInfo.find(".type1").val() !== "Flying" &&
        teraType ? teraType !== "Flying" : pokeInfo.find(".type2").val() !== "Flying" &&
        pokeInfo.find(".ability").val() !== "Levitate" &&
        pokeInfo.find(".item").val() !== "Air Balloon"
	);
}

function getTerrainEffects() {
	var className = $(this).prop("className");
	className = className.substring(0, className.indexOf(" "));
	switch (className) {
	case "type1":
	case "type2":
	case "teraType":
	case "teraToggle":
	case "item":
		var id = $(this).closest(".poke-info").prop("id");
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#" + id).find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#" + id)));
		} else if (terrainValue === "Misty") {
			$("#" + id).find(".status").prop("disabled", isPokeInfoGrounded($("#" + id)));
		}
		break;
	case "ability":
		// with autoset, ability change may cause terrain change, need to consider both sides
		var terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if (terrainValue === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	default:
		$("input:checkbox[name='terrain']").not(this).prop("checked", false);
		if ($(this).prop("checked") && $(this).val() === "Electric") {
			// need to enable status because it may be disabled by Misty Terrain before.
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
			$("#p1").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else if ($(this).prop("checked") && $(this).val() === "Misty") {
			$("#p1").find(".status").prop("disabled", isPokeInfoGrounded($("#p1")));
			$("#p2").find(".status").prop("disabled", isPokeInfoGrounded($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	}
}

function loadDefaultLists() {
	$(".set-selector").select2({
		formatResult: function (object) {
			if ($("#randoms").prop("checked")) {
				return object.pokemon;
			} else {
				return object.set ? ("&nbsp;&nbsp;&nbsp;" + object.set) : ("<b>" + object.text + "</b>");
			}
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				var setName = option.set ? option.set.toUpperCase() : "";
				if (!query.term || query.term.toUpperCase().split(" ").every(function (term) {
					return matchesSetSearchText(pokeName, term) || (setName && matchesSetSearchText(setName, term));
				})) {
					if ($("#randoms").prop("checked")) {
						if (option.id) results.push(option);
					} else {
						results.push(option);
					}
				}
			}
			query.callback({
				results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
				more: results.length >= query.page * pageSize
			});
		},
		initSelection: function (element, callback) {
			callback(getFirstValidSetOption());
		}
	});
}

function allPokemon(selector) {
	var allSelector = "";
	for (var i = 0; i < $(".poke-info").length; i++) {
		if (i > 0) {
			allSelector += ", ";
		}
		allSelector += "#p" + (i + 1) + " " + selector;
	}
	return allSelector;
}

function loadCustomList(id) {
	$("#" + id + " .set-selector").select2({
		formatResult: function (set) {
			if (set.defaultName) return set.pokemon;
			return (set.nickname ? set.pokemon + " (" + set.nickname + ")" : set.id);
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				var setName = option.set ? option.set.toUpperCase() : option.set;
				if (option.isCustom && option.set && (!query.term || query.term.toUpperCase().split(" ").every(function (term) {
					return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0 || pokeName.indexOf(" " + term) >= 0 || setName.indexOf(term) === 0 || setName.indexOf("-" + term) >= 0 || setName.indexOf(" " + term) >= 0;
				}))) {
					results.push(option);
				}
			}
			query.callback({
				results: results.slice((query.page - 1) * pageSize, query.page * pageSize),
				more: results.length >= query.page * pageSize
			});
		},
		initSelection: function (element, callback) {
			var data = "";
			callback(data);
		}
	});
}

$(document).ready(function () {
	var params = new URLSearchParams(window.location.search);
	var g = GENERATION[params.get('gen')] || 9;
	$("#gen" + g).prop("checked", true);
	$("#gen" + g).change();
	$("#percentage").prop("checked", true);
	$("#percentage").change();
	$("#singles-format").prop("checked", true);
	$("#singles-format").change();
	$("#default-level-100").prop("checked", true);
	$("#default-level-100").change();
	loadDefaultLists();
	$(".move-selector").select2({
		dropdownAutoWidth: true,
		matcher: function (term, text) {
			// 2nd condition is for Hidden Power
			return text.toUpperCase().indexOf(term.toUpperCase()) === 0 || text.toUpperCase().indexOf(" " + term.toUpperCase()) >= 0;
		}
	});
	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
	restoreRememberedOpposingSet();
	$(".terrain-trigger").bind("change keyup", getTerrainEffects);
});

/* Click-to-copy function */
$("#mainResult").click(function () {
	navigator.clipboard.writeText($("#mainResult").text()).then(function () {
		document.getElementById('tooltipText').style.visibility = 'visible';
		setTimeout(function () {
			document.getElementById('tooltipText').style.visibility = 'hidden';
		}, 1500);
	});
});
