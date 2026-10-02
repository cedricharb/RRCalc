/* global RR_SAVE_DATA, SETDEX, RANDDEX, SETDEX_RBY, SETDEX_GSC, SETDEX_ADV, SETDEX_DPP, SETDEX_BW, SETDEX_XY, SETDEX_SM, SETDEX_SS, SETDEX_SV, GEN1RANDOMBATTLE, GEN2RANDOMBATTLE, GEN3RANDOMBATTLE, GEN4RANDOMBATTLE, GEN5RANDOMBATTLE, GEN6RANDOMBATTLE, GEN7RANDOMBATTLE, GEN8RANDOMBATTLE, GEN9RANDOMBATTLE, setdex, randdex, addSets, allPokemon, loadDefaultLists, selectRosterSet, updateRosterSprites, DataView, Uint8Array, localStorage, calc */
(function () {
	var SECTION_SIZE = 0x1000;
	var SECTION_DATA_SIZE = 3968;
	var SECTION_ID_OFFSET = 0x0FF4;
	var SIGNATURE_OFFSET = 0x0FF8;
	var SAVE_INDEX_OFFSET = 0x0FFC;
	var SAVE_SIGNATURE = 0x08012025;
	var TRAINER_ID_OFFSET = 0x000A;
	var RANDOM_FLAGS_OFFSET = 0x0F2C;
	var RANDOM_ABILITIES_FLAG = 0x04;
	var RESTRICTED_FLAG_OFFSET = 0x0DC3;
	var RESTRICTED_FLAG = 0x40;
	var PARTY_OFFSET = 0x0038;
	var PARTY_ENTRY_SIZE = 100;
	var COMPRESSED_BOX_ENTRY_SIZE = 58;
	var BOX_COUNT = 25;
	var BOXES_TO_IMPORT = 23;
	var BOX_SIZE = 30;
	var STORAGE_BOXES_OFFSET = 4;
	var ORIGINAL_STORAGE_BOXES = 19;
	var PARASITE_SIZE = 0x2EA4;
	var PARASITE_SECTION_0_SIZE = 0x00CC;
	var PARASITE_SECTION_4_SIZE = 0x0258;
	var PARASITE_SECTION_13_SIZE = 0x0BA0;
	var PARASITE_BOX_20_OFFSET = 0x19D0;
	var SAVEBLOCK1_BOX_23_OFFSET = 0x1F08;

	var NATURES = [
		"Hardy", "Lonely", "Brave", "Adamant", "Naughty",
		"Bold", "Docile", "Relaxed", "Impish", "Lax",
		"Timid", "Hasty", "Serious", "Jolly", "Naive",
		"Modest", "Mild", "Quiet", "Bashful", "Rash",
		"Calm", "Gentle", "Sassy", "Careful", "Quirky"
	];

	var ABILITIES_RESTRICTED = [
		0x01, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A,
		0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12,
		0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x1A, 0x1B,
		0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x25,
		0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2E,
		0x2F, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
		0x37, 0x38, 0x39, 0x3A, 0x3C, 0x3D, 0x3E, 0x3F,
		0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47,
		0x48, 0x49, 0x4B, 0x4D, 0x4E, 0x4F, 0x51, 0x52,
		0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5B,
		0x5C, 0x5D, 0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63,
		0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B,
		0x6C, 0x6D, 0x6E, 0x70, 0x71, 0x72, 0x73, 0x74,
		0x77, 0x79, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E, 0x7F,
		0x80, 0x81, 0x82, 0x84, 0x85, 0x87, 0x88, 0x89,
		0x8A, 0x8B, 0x8C, 0x8D, 0x90, 0x91, 0x92, 0x93,
		0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0x9E,
		0xA0, 0xA1, 0xA2, 0xA3, 0xA6, 0xA7, 0xA9, 0xAB,
		0xAF, 0xB1, 0xB2, 0xB3, 0xB9, 0xBA, 0xBB, 0xBC,
		0xBD, 0xBE, 0xC0, 0xC1, 0xC2, 0xC3, 0xC4, 0xC6,
		0xC7, 0xC8, 0xC9, 0xCA, 0xCB, 0xCC, 0xCE, 0xD0,
		0xD1, 0xD2, 0xD7, 0xD8, 0xD9, 0xDA, 0xDC, 0xDD,
		0xDE, 0xDF, 0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5,
		0xE6, 0xE7, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE,
		0xEF, 0xF0, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6,
		0xF8, 0xF9, 0xFB, 0x4A, 0xFE, 0xFF, 0xFD
	];

	var ABILITIES_NORMAL = [
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
		0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10,
		0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
		0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F, 0x20, 0x21,
		0x22, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A,
		0x2B, 0x2C, 0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32,
		0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A,
		0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x43,
		0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4B, 0x4D,
		0x4E, 0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55,
		0x56, 0x57, 0x58, 0x59, 0x5A, 0x5B, 0x5C, 0x5D,
		0x5E, 0x5F, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65,
		0x66, 0x67, 0x68, 0x69, 0x6A, 0x6B, 0x6C, 0x6D,
		0x6E, 0x6F, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75,
		0x76, 0x77, 0x79, 0x7A, 0x7B, 0x7C, 0x7D, 0x7E,
		0x7F, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86,
		0x87, 0x88, 0x89, 0x8A, 0x8B, 0x8C, 0x8D, 0x8E,
		0x8F, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96,
		0x97, 0x98, 0x99, 0x9A, 0x9D, 0x9E, 0xA0, 0xA1,
		0xA2, 0xA3, 0xA6, 0xA7, 0xA9, 0xAB, 0xAC, 0xAD,
		0xAF, 0xB0, 0xB1, 0xB2, 0xB3, 0xB5, 0xB6, 0xB7,
		0xB8, 0xB9, 0xBA, 0xBB, 0xBC, 0xBD, 0xBE, 0xBF,
		0xC0, 0xC1, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7,
		0xC8, 0xC9, 0xCA, 0xCB, 0xCC, 0xCE, 0xCF, 0xD0,
		0xD1, 0xD2, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9,
		0xDA, 0xDC, 0xDD, 0xDE, 0xDF, 0xE0, 0xE1, 0xE2,
		0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE9, 0xEA, 0xEB,
		0xEC, 0xED, 0xEE, 0xEF, 0xF0, 0xF1, 0xF2, 0xF3,
		0xF4, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFB, 0xFC,
		0x4A, 0xFE, 0xFF, 0xFD
	];

	var RR_ABILITY_IDS = {"Stench": 1, "Drizzle": 2, "Speed Boost": 3, "Battle Armor": 4, "Shell Armor": 4, "Sturdy": 5, "Damp": 6, "Limber": 7, "Sand Veil": 8, "Static": 9, "Volt Absorb": 10, "Water Absorb": 11, "Oblivious": 12, "Cloud Nine": 13, "Air Lock": 13, "Compound Eyes": 14, "Insomnia": 15, "Vital Spirit": 15, "Wind Rider": 16, "Immunity": 17, "Flash Fire": 18, "Shield Dust": 19, "Frozen Mist": 19, "Own Tempo": 20, "Suction Cups": 21, "Intimidate": 22, "Shadow Tag": 23, "Quick Draw": 24, "Wonder Guard": 25, "Levitate": 26, "Effect Spore": 27, "Synchronize": 28, "Clear Body": 29, "White Smoke": 29, "Full Metal Body": 29, "Natural Cure": 30, "Lightning Rod": 31, "Serene Grace": 32, "Swift Swim": 33, "Chlorophyll": 34, "Gulp Missile": 35, "Trace": 36, "Huge Power": 37, "Pure Power": 37, "Dragon's Maw": 38, "Inner Focus": 39, "Magma Armor": 40, "Water Veil": 41, "Magnet Pull": 42, "Soundproof": 43, "Rain Dish": 44, "Sand Stream": 45, "Pressure": 46, "Thick Fat": 47, "Early Bird": 48, "Flame Body": 49, "Run Away": 50, "Bad Company": 51, "Hyper Cutter": 52, "Pickup": 53, "Truant": 54, "Hustle": 55, "Cute Charm": 56, "Plus": 57, "Minus": 58, "Forecast": 59, "Sticky Hold": 60, "Shed Skin": 61, "Guts": 62, "Marvel Scale": 63, "Liquid Ooze": 64, "Overgrow": 65, "Blaze": 66, "Torrent": 67, "Swarm": 68, "Rock Head": 69, "Drought": 70, "Arena Trap": 71, "Purifying Salt": 72, "As One": 77, "Neutralize Gas": 74, "Neutralizing Gas": 74, "Fatal Precision": 75, "Hunger Switch": 76, "Sweet Veil": 78, "Skill Link": 79, "Motor Drive": 80, "Multiscale": 81, "Blubber Defense": 81, "Shadow Shield": 81, "Tera Shell": 81, "Technician": 82, "Scrappy": 83, "Super Luck": 84, "Sniper": 85, "Regenerator": 86, "Prankster": 87, "Adaptability": 88, "Illuminate": 89, "Magic Bounce": 90, "Reckless": 91, "Sheer Force": 92, "Iron Fist": 93, "Rivalry": 94, "Sand Force": 95, "Solar Power": 96, "Heatproof": 97, "Dry Skin": 98, "Tinted Lens": 99, "Solid Rock": 100, "Filter": 100, "Prism Armor": 100, "Stalwart": 101, "Propeller Tail": 101, "Infiltrator": 102, "Download": 103, "Poison Heal": 104, "Ice Body": 105, "Bull Rush": 106, "Quill Rush": 106, "Hydration": 107, "SupremeOverlord": 108, "Supreme Overlord": 108, "Anger Shell": 109, "Good as Gold": 110, "Snow Warning": 111, "Quick Feet": 112, "Sap Sipper": 113, "Overcoat": 114, "Magic Guard": 115, "Bulletproof": 116, "Gale Wings": 117, "Moxie": 118, "Chilling Neigh": 118, "Aftermath": 119, "Cursed Body": 120, "Gooey": 121, "Tangling Hair": 121, "Mummy": 122, "Lingering Aroma": 122, "Iron Barbs": 123, "Rough Skin": 123, "Sand Rush": 124, "Analytic": 125, "No Guard": 126, "Mega Launcher": 127, "Tough Claws": 128, "Strong Jaw": 129, "Victory Star": 130, "Storm Drain": 131, "Dark Aura": 132, "Fairy Aura": 133, "Seed Sower": 134, "Refrigerate": 135, "Pixilate": 136, "Aerilate": 137, "Feline Prowess": 138, "Unburden": 139, "Simple": 140, "Unaware": 141, "Defiant": 142, "Competitive": 143, "Defeatist": 144, "Slow Start": 145, "Toxic Boost": 146, "Flare Boost": 147, "Fur Coat": 148, "Wonder Skin": 149, "Protean": 150, "Libero": 150, "Parental Bond": 151, "Mold Breaker": 152, "Turboblaze": 152, "Teravolt": 152, "Hadron Engine": 153, "OrichalcumPulse": 154, "Orichalcum Pulse": 154, "Zen Mode": 155, "Battle Bond": 156, "Beast Boost": 157, "Corrosion": 158, "Disguise": 159, "Emergency Exit": 160, "Wimp Out": 160, "Fluffy": 161, "Steely Spirit": 162, "Perish Body": 163, "Wandering Soul": 164, "Power Construct": 165, "Tablets of Ruin": 166, "ORAORAORAORA!": 167, "ORAORAORAORA": 167, "Schooling": 168, "Beads of Ruin": 169, "Shields Down": 170, "Slush Rush": 171, "Soul-Heart": 172, "Stamina": 173, "Zero To Hero": 174, "Zero to Hero": 174, "ThermalExchange": 175, "Thermal Exchange": 175, "Triage": 176, "Water Bubble": 177, "Cash Splash": 177, "WaterCompaction": 178, "Water Compaction": 178, "Parasitic Waste": 179, "Multitype": 180, "Electric Surge": 181, "Grassy Surge": 182, "Misty Surge": 183, "Psychic Surge": 184, "Surge Surfer": 185, "Grass Pelt": 186, "Anger Point": 187, "Earth Eater": 188, "Toxic Chain": 189, "Frisk": 190, "Contrary": 191, "Unnerve": 192, "Weak Armor": 193, "Heavy Metal": 194, "Quark Drive": 195, "Steadfast": 196, "Imposter": 197, "Justified": 198, "Unseen Fist": 199, "Merciless": 200, "Aroma Veil": 201, "Toxic Debris": 202, "Leaf Guard": 203, "Electromrphosis": 204, "Electromorphosis": 204, "Flower Gift": 205, "Bad Dreams": 206, "Grim Neigh": 207, "Transistor": 208, "Poison Touch": 209, "Magician": 210, "Stance Change": 211, "Primordial Sea": 212, "Desolate Land": 213, "Delta Stream": 214, "Gorilla Tactics": 215, "Berserk": 216, "Primal Armor": 217, "Liquid Voice": 218, "Phoenix Down": 219, "Innards Out": 220, "Dazzling": 221, "Queenly Majesty": 221, "Armor Tail": 221, "Gluttony": 222, "Mountaineer": 223, "Friend Guard": 224, "Harvest": 225, "Telepathy": 226, "Illusion": 227, "Cheek Pouch": 228, "Protosynthesis": 229, "Stakeout": 230, "Comatose": 231, "Dancer": 232, "Bone Zone": 233, "Receiver": 234, "Alchemic Power": 234, "Self Sufficient": 235, "Neuroforce": 236, "Galvanize": 237, "Intrepid Sword": 238, "Valiant Shield": 239, "Striker": 240, "Cotton Down": 241, "Sword Of Ruin": 242, "Sword of Ruin": 242, "Sharpness": 243, "Vessel Of Ruin": 244, "Vessel of Ruin": 244, "Steam Engine": 245, "Punk Rock": 246, "Sand Spit": 247, "Ice Scales": 248, "Ripen": 249, "Ice Face": 250, "Rocky Payload": 251, "Blazing Soul": 252, "Screen Cleaner": 253, "Well-Baked Body": 254, "Sage Power": 255};

	var RR_ABILITY_NAMES = {};
	for (var abilityName in RR_ABILITY_IDS) {
		if (!Object.prototype.hasOwnProperty.call(RR_ABILITY_IDS, abilityName)) continue;
		var abilityId = RR_ABILITY_IDS[abilityName];
		if (!RR_ABILITY_NAMES[abilityId]) RR_ABILITY_NAMES[abilityId] = abilityName;
	}
	RR_ABILITY_NAMES[73] = "As One";
	RR_ABILITY_NAMES[77] = "As One";

	var TEXT_TABLE = {
		0x80: "0", 0x81: "1", 0x82: "2", 0x83: "3", 0x84: "4", 0x85: "5", 0x86: "6", 0x87: "7", 0x88: "8", 0x89: "9",
		0x8A: "!", 0x8B: "?", 0x8C: ".", 0x8D: "-", 0x8E: ".", 0x8F: "...", 0x94: "M", 0x95: "F", 0x96: "$", 0x97: ",",
		0xB8: ",", 0xBA: "/", 0xBB: "A", 0xBC: "B", 0xBD: "C", 0xBE: "D", 0xBF: "E", 0xC0: "F", 0xC1: "G", 0xC2: "H",
		0xC3: "I", 0xC4: "J", 0xC5: "K", 0xC6: "L", 0xC7: "M", 0xC8: "N", 0xC9: "O", 0xCA: "P", 0xCB: "Q", 0xCC: "R",
		0xCD: "S", 0xCE: "T", 0xCF: "U", 0xD0: "V", 0xD1: "W", 0xD2: "X", 0xD3: "Y", 0xD4: "Z", 0xD5: "a", 0xD6: "b",
		0xD7: "c", 0xD8: "d", 0xD9: "e", 0xDA: "f", 0xDB: "g", 0xDC: "h", 0xDD: "i", 0xDE: "j", 0xDF: "k", 0xE0: "l",
		0xE1: "m", 0xE2: "n", 0xE3: "o", 0xE4: "p", 0xE5: "q", 0xE6: "r", 0xE7: "s", 0xE8: "t", 0xE9: "u", 0xEA: "v",
		0xEB: "w", 0xEC: "x", 0xED: "y", 0xEE: "z", 0xF0: ":"
	};

	function readU16(view, offset) {
		return view.getUint16(offset, true);
	}

	function readU32(view, offset) {
		return view.getUint32(offset, true);
	}

	function readText(view, offset, length) {
		var text = "";
		for (var i = 0; i < length; i++) {
			var value = view.getUint8(offset + i);
			if (value === 0xFF) break;
			text += TEXT_TABLE[value] || "";
		}
		return text.trim();
	}

	function getSaveSections(view) {
		var sections = {};
		var maxSlots = Math.floor(view.byteLength / (SECTION_SIZE * 14));
		for (var slot = 0; slot < maxSlots; slot++) {
			for (var i = 0; i < 14; i++) {
				var offset = (slot * 14 + i) * SECTION_SIZE;
				if (offset + SECTION_SIZE > view.byteLength) continue;
				var id = readU16(view, offset + SECTION_ID_OFFSET);
				var signature = readU32(view, offset + SIGNATURE_OFFSET);
				var counter = readU32(view, offset + SAVE_INDEX_OFFSET);
				if (signature !== SAVE_SIGNATURE || id > 13) continue;
				if (!sections[id] || counter > sections[id].counter) {
					sections[id] = {offset: offset, counter: counter};
				}
			}
		}
		return sections;
	}

	function copySectorData(view, section) {
		var data = new Uint8Array(SECTION_DATA_SIZE);
		for (var i = 0; i < SECTION_DATA_SIZE; i++) {
			data[i] = view.getUint8(section.offset + i);
		}
		return data;
	}

	function readStorage(view, sections) {
		var storage = new Uint8Array(SECTION_DATA_SIZE * 9);
		for (var id = 5; id <= 13; id++) {
			if (!sections[id]) throw new Error("Missing storage section " + id + ".");
			storage.set(copySectorData(view, sections[id]), (id - 5) * SECTION_DATA_SIZE);
		}
		return new DataView(storage.buffer);
	}

	function readSaveBlock1(view, sections) {
		var chunkSizes = [SECTION_DATA_SIZE, SECTION_DATA_SIZE, SECTION_DATA_SIZE, 0x0D98];
		var saveBlock = new Uint8Array(chunkSizes[0] + chunkSizes[1] + chunkSizes[2] + chunkSizes[3]);
		var cursor = 0;
		for (var id = 1; id <= 4; id++) {
			if (!sections[id]) throw new Error("Missing save section " + id + ".");
			for (var i = 0; i < chunkSizes[id - 1]; i++) {
				saveBlock[cursor + i] = view.getUint8(sections[id].offset + i);
			}
			cursor += chunkSizes[id - 1];
		}
		return new DataView(saveBlock.buffer);
	}

	function readParasite(view, sections) {
		if (!sections[0]) throw new Error("Missing save section 0.");
		if (!sections[4]) throw new Error("Missing save section 4.");
		if (!sections[13]) throw new Error("Missing storage section 13.");
		var parasite = new Uint8Array(PARASITE_SIZE);
		var cursor = 0;
		copyTo(parasite, cursor, view, sections[0].offset + SECTION_DATA_SIZE - PARASITE_SECTION_0_SIZE, PARASITE_SECTION_0_SIZE);
		cursor += PARASITE_SECTION_0_SIZE;
		copyTo(parasite, cursor, view, sections[4].offset + SECTION_DATA_SIZE - PARASITE_SECTION_4_SIZE, PARASITE_SECTION_4_SIZE);
		cursor += PARASITE_SECTION_4_SIZE;
		copyTo(parasite, cursor, view, sections[13].offset + 0x0450, PARASITE_SECTION_13_SIZE);
		cursor += PARASITE_SECTION_13_SIZE;
		copyTo(parasite, cursor, view, 30 * SECTION_SIZE, SECTION_DATA_SIZE);
		cursor += SECTION_DATA_SIZE;
		copyTo(parasite, cursor, view, 31 * SECTION_SIZE, SECTION_DATA_SIZE);
		return new DataView(parasite.buffer);
	}

	function copyTo(target, targetOffset, sourceView, sourceOffset, length) {
		if (sourceOffset + length > sourceView.byteLength) return;
		for (var i = 0; i < length; i++) {
			target[targetOffset + i] = sourceView.getUint8(sourceOffset + i);
		}
	}

	function getSpecies(id) {
		return RR_SAVE_DATA.species[id - 1] || "";
	}

	function getMove(id) {
		return id ? (RR_SAVE_DATA.moves[id - 1] || "") : "";
	}

	function getItem(id) {
		return id ? (RR_SAVE_DATA.items[id - 1] || "") : "";
	}

	function getSaveOptions(view, sections) {
		var options = {trainerId: 0, randomAbilities: false, restricted: false};
		if (!sections[0]) return options;
		options.trainerId = readU32(view, sections[0].offset + TRAINER_ID_OFFSET);
		options.randomAbilities = (view.getUint8(sections[0].offset + RANDOM_FLAGS_OFFSET) & RANDOM_ABILITIES_FLAG) > 0;
		if (sections[4]) {
			options.restricted = (view.getUint8(sections[4].offset + RESTRICTED_FLAG_OFFSET) & RESTRICTED_FLAG) > 0;
		}
		return options;
	}

	function canonicalizeAbilityName(ability, abilityId, species) {
		if (!ability) return "";
		if (ability === "As One") {
			if (abilityId === 77 || species === "Calyrex-Ice") return "As One (Glastrier)";
			if (abilityId === 73 || species === "Calyrex-Shadow") return "As One (Spectrier)";
		}
		var canonicalNames = {
			"Bone Zone ": "Bone Zone",
			Electromrphosis: "Electromorphosis",
			"Neutralize Gas": "Neutralizing Gas",
			"ORAORAORAORA!": "ORAORAORAORA",
			OrichalcumPulse: "Orichalcum Pulse",
			SupremeOverlord: "Supreme Overlord",
			"Sword Of Ruin": "Sword of Ruin",
			ThermalExchange: "Thermal Exchange",
			"Vessel Of Ruin": "Vessel of Ruin",
			WaterCompaction: "Water Compaction",
			"Zero To Hero": "Zero to Hero"
		};
		return canonicalNames[ability] || ability.trim();
	}

	function randomizeAbilityId(trainerId, restricted, abilityId, speciesId) {
		if (!abilityId) return 0;
		trainerId = Math.max(1, trainerId);
		var abilityTable = restricted ? ABILITIES_RESTRICTED : ABILITIES_NORMAL;
		var abilityCount = abilityTable.length;
		var secretIdLowerByte = ((trainerId >> 0x10) & 0xFFFF) % 0xFF;
		var newAbilityIndex = (trainerId & 0xFFFF) % abilityCount;
		newAbilityIndex = (newAbilityIndex + speciesId + abilityId) & 0xFFFF;
		if (newAbilityIndex > abilityCount) {
			newAbilityIndex = (newAbilityIndex - abilityCount + 2) & 0xFFFF;
		}
		newAbilityIndex = (newAbilityIndex ^ secretIdLowerByte & 0xFFFF) % abilityCount;
		return abilityTable[newAbilityIndex];
	}

	function getAbility(species, speciesId, pid, ivData, saveOptions) {
		var abilities = RR_SAVE_DATA.abilities[species] || [];
		var slot = ((ivData >>> 31) & 1) ? 2 : (pid % 2 === 0 ? 0 : 1);
		var ability = abilities[slot] || abilities[0] || "";
		var abilityId = RR_ABILITY_IDS[ability];
		if (!saveOptions || !saveOptions.randomAbilities || abilityId === undefined) {
			return canonicalizeAbilityName(ability, abilityId, species);
		}
		var randomizedAbilityId = randomizeAbilityId(
			saveOptions.trainerId,
			saveOptions.restricted,
			abilityId,
			speciesId
		);
		return canonicalizeAbilityName(RR_ABILITY_NAMES[randomizedAbilityId] || ability, randomizedAbilityId, species);
	}

	function getExperienceTables() {
		var tables = [];
		for (var curve = 0; curve < 6; curve++) {
			tables[curve] = [0];
			for (var level = 1; level <= 100; level++) {
				var n = level;
				var exp;
				if (curve === 0) exp = Math.floor(n * n * n * (100 - n) / 50); // Erratic
				else if (curve === 1) exp = Math.floor(4 * n * n * n / 5); // Fast
				else if (curve === 2) exp = n * n * n; // Medium Fast
				else if (curve === 3) exp = Math.floor(6 * n * n * n / 5 - 15 * n * n + 100 * n - 140); // Medium Slow
				else if (curve === 4) exp = Math.floor(5 * n * n * n / 4); // Slow
				else if (n <= 15) exp = Math.floor(n * n * n * ((n + 1) / 3 + 24) / 50); // Fluctuating
				else if (n <= 36) exp = Math.floor(n * n * n * (n + 14) / 50);
				else exp = Math.floor(n * n * n * (n / 2 + 32) / 50);
				tables[curve][level] = Math.max(0, exp);
			}
		}
		return tables;
	}

	var EXPERIENCE_TABLES = getExperienceTables();

	function estimateLevel(exp) {
		var bestLevel = 1;
		var bestDistance = Infinity;
		for (var curve = 0; curve < EXPERIENCE_TABLES.length; curve++) {
			var table = EXPERIENCE_TABLES[curve];
			for (var level = 1; level <= 100; level++) {
				if (table[level] > exp) break;
				var distance = exp - table[level];
				if (distance < bestDistance) {
					bestDistance = distance;
					bestLevel = level;
				}
			}
		}
		return bestLevel;
	}

	function parseSavedPokemon(view, offset, options) {
		var pid = readU32(view, offset);
		if (!pid) return null;
		var speciesId = readU16(view, offset + 32);
		var species = getSpecies(speciesId);
		if (!species || species === "Bad.Egg") return null;
		var ivData = readU32(view, offset + 72);
		var exp = readU32(view, offset + 36);
		var mon = {
			source: options.source,
			index: options.index,
			species: species,
			nickname: readText(view, offset + 8, 10),
			item: getItem(readU16(view, offset + 34)),
			level: options.hasPartyStats ? view.getUint8(offset + 84) : estimateLevel(exp),
			nature: NATURES[pid % 25],
			ability: getAbility(species, speciesId, pid, ivData, options.saveOptions),
			evs: {
				hp: view.getUint8(offset + 56),
				at: view.getUint8(offset + 57),
				df: view.getUint8(offset + 58),
				sp: view.getUint8(offset + 59),
				sa: view.getUint8(offset + 60),
				sd: view.getUint8(offset + 61)
			},
			ivs: {
				hp: ivData & 31,
				at: (ivData >>> 5) & 31,
				df: (ivData >>> 10) & 31,
				sp: (ivData >>> 15) & 31,
				sa: (ivData >>> 20) & 31,
				sd: (ivData >>> 25) & 31
			},
			moves: [
				getMove(readU16(view, offset + 44)),
				getMove(readU16(view, offset + 46)),
				getMove(readU16(view, offset + 48)),
				getMove(readU16(view, offset + 50))
			]
		};
		return mon;
	}

	function readPackedMoveBits(view, offset) {
		return view.getUint8(offset) +
			view.getUint8(offset + 1) * 0x100 +
			view.getUint8(offset + 2) * 0x10000 +
			view.getUint8(offset + 3) * 0x1000000 +
			view.getUint8(offset + 4) * 0x100000000;
	}

	function parseCompressedPokemon(view, offset, options) {
		var pid = readU32(view, offset);
		if (!pid) return null;
		var speciesId = readU16(view, offset + 28);
		var species = getSpecies(speciesId);
		if (!species || species === "Bad.Egg") return null;
		var ivData = readU32(view, offset + 54);
		var exp = readU32(view, offset + 32);
		var moveBits = readPackedMoveBits(view, offset + 39);
		var mon = {
			source: options.source,
			index: options.index,
			species: species,
			nickname: readText(view, offset + 8, 10),
			item: getItem(readU16(view, offset + 30)),
			level: estimateLevel(exp),
			nature: NATURES[pid % 25],
			ability: getAbility(species, speciesId, pid, ivData, options.saveOptions),
			evs: {
				hp: view.getUint8(offset + 44),
				at: view.getUint8(offset + 45),
				df: view.getUint8(offset + 46),
				sp: view.getUint8(offset + 47),
				sa: view.getUint8(offset + 48),
				sd: view.getUint8(offset + 49)
			},
			ivs: {
				hp: ivData & 31,
				at: (ivData >>> 5) & 31,
				df: (ivData >>> 10) & 31,
				sp: (ivData >>> 15) & 31,
				sa: (ivData >>> 20) & 31,
				sd: (ivData >>> 25) & 31
			},
			moves: [
				getMove(moveBits % 1024),
				getMove(Math.floor(moveBits / 1024) % 1024),
				getMove(Math.floor(moveBits / 1048576) % 1024),
				getMove(Math.floor(moveBits / 1073741824) % 1024)
			]
		};
		return mon;
	}

	function parseParty(view, section, saveOptions) {
		var count = view.getUint8(section.offset + 0x34);
		var party = [];
		for (var i = 0; i < Math.min(count, 6); i++) {
			var mon = parseSavedPokemon(view, section.offset + PARTY_OFFSET + i * PARTY_ENTRY_SIZE, {
				hasPartyStats: true,
				source: "Party",
				index: i + 1,
				saveOptions: saveOptions
			});
			if (mon) party.push(mon);
		}
		return party;
	}

	function parseBoxes(view, sections, saveOptions) {
		var storage = readStorage(view, sections);
		var parasite = readParasite(view, sections);
		var saveBlock1 = readSaveBlock1(view, sections);
		var boxes = [];
		for (var box = 0; box < Math.min(BOXES_TO_IMPORT, BOX_COUNT); box++) {
			var boxView = storage;
			var boxOffset = STORAGE_BOXES_OFFSET + box * BOX_SIZE * COMPRESSED_BOX_ENTRY_SIZE;
			if (box >= ORIGINAL_STORAGE_BOXES && box < 22) {
				boxView = parasite;
				boxOffset = PARASITE_BOX_20_OFFSET + (box - ORIGINAL_STORAGE_BOXES) * BOX_SIZE * COMPRESSED_BOX_ENTRY_SIZE;
			} else if (box === 22) {
				boxView = saveBlock1;
				boxOffset = SAVEBLOCK1_BOX_23_OFFSET;
			}
			for (var slot = 0; slot < BOX_SIZE; slot++) {
				var offset = boxOffset + slot * COMPRESSED_BOX_ENTRY_SIZE;
				var mon = parseCompressedPokemon(boxView, offset, {
					hasPartyStats: false,
					source: "Box " + (box + 1),
					index: slot + 1,
					saveOptions: saveOptions
				});
				if (mon) boxes.push(mon);
			}
		}
		return boxes;
	}

	function statLine(label, stats) {
		return label + ": " +
			stats.hp + " HP / " + stats.at + " Atk / " + stats.df + " Def / " +
			stats.sa + " SpA / " + stats.sd + " SpD / " + stats.sp + " Spe";
	}

	function toShowdown(mon) {
		var lines = [];
		lines.push(mon.species + (mon.item ? " @ " + mon.item : ""));
		if (mon.ability) lines.push("Ability: " + mon.ability);
		lines.push("Level: " + mon.level);
		lines.push(statLine("EVs", mon.evs));
		lines.push(mon.nature + " Nature");
		lines.push(statLine("IVs", mon.ivs));
		for (var i = 0; i < mon.moves.length; i++) {
			if (mon.moves[i]) lines.push("- " + mon.moves[i]);
		}
		return lines.join("\n");
	}

	function parseSave(arrayBuffer) {
		var view = new DataView(arrayBuffer.slice(0, 128 * 1024));
		var sections = getSaveSections(view);
		if (!sections[1]) throw new Error("No valid Radical Red save block found.");
		var saveOptions = getSaveOptions(view, sections);
		return parseParty(view, sections[1], saveOptions).concat(parseBoxes(view, sections, saveOptions));
	}

	function setStatus(message) {
		$("#save-import-status").text(message || "");
	}

	function clearImportedSetsFromDex(dex) {
		if (!dex) return;
		for (var pokemonName in dex) {
			if (!Object.prototype.hasOwnProperty.call(dex, pokemonName)) continue;
			for (var setName in dex[pokemonName]) {
				if (!Object.prototype.hasOwnProperty.call(dex[pokemonName], setName)) continue;
				if (dex[pokemonName][setName].isCustomSet) delete dex[pokemonName][setName];
			}
			if (!Object.keys(dex[pokemonName]).length) delete dex[pokemonName];
		}
	}

	function clearStoredImportedSetsFromDex(dex, storedSets) {
		if (!dex || !storedSets) return;
		for (var pokemonName in storedSets) {
			if (!Object.prototype.hasOwnProperty.call(storedSets, pokemonName)) continue;
			if (!dex[pokemonName]) continue;
			for (var setName in storedSets[pokemonName]) {
				if (!Object.prototype.hasOwnProperty.call(storedSets[pokemonName], setName)) continue;
				if (dex[pokemonName][setName]) delete dex[pokemonName][setName];
			}
			if (!Object.keys(dex[pokemonName]).length) delete dex[pokemonName];
		}
	}

	function clearImportedSetsFromDexes(dexes) {
		if (!dexes) return;
		for (var i = 0; i < dexes.length; i++) {
			clearImportedSetsFromDex(dexes[i]);
		}
	}

	function clearStoredImportedSetsFromDexes(dexes, storedSets) {
		if (!dexes) return;
		for (var i = 0; i < dexes.length; i++) {
			clearStoredImportedSetsFromDex(dexes[i], storedSets);
		}
	}

	function getImportedSetDexes() {
		return [
			typeof SETDEX_RBY === "undefined" ? null : SETDEX_RBY,
			typeof SETDEX_GSC === "undefined" ? null : SETDEX_GSC,
			typeof SETDEX_ADV === "undefined" ? null : SETDEX_ADV,
			typeof SETDEX_DPP === "undefined" ? null : SETDEX_DPP,
			typeof SETDEX_BW === "undefined" ? null : SETDEX_BW,
			typeof SETDEX_XY === "undefined" ? null : SETDEX_XY,
			typeof SETDEX_SM === "undefined" ? null : SETDEX_SM,
			typeof SETDEX_SS === "undefined" ? null : SETDEX_SS,
			typeof SETDEX_SV === "undefined" ? null : SETDEX_SV,
			typeof GEN1RANDOMBATTLE === "undefined" ? null : GEN1RANDOMBATTLE,
			typeof GEN2RANDOMBATTLE === "undefined" ? null : GEN2RANDOMBATTLE,
			typeof GEN3RANDOMBATTLE === "undefined" ? null : GEN3RANDOMBATTLE,
			typeof GEN4RANDOMBATTLE === "undefined" ? null : GEN4RANDOMBATTLE,
			typeof GEN5RANDOMBATTLE === "undefined" ? null : GEN5RANDOMBATTLE,
			typeof GEN6RANDOMBATTLE === "undefined" ? null : GEN6RANDOMBATTLE,
			typeof GEN7RANDOMBATTLE === "undefined" ? null : GEN7RANDOMBATTLE,
			typeof GEN8RANDOMBATTLE === "undefined" ? null : GEN8RANDOMBATTLE,
			typeof GEN9RANDOMBATTLE === "undefined" ? null : GEN9RANDOMBATTLE,
			typeof setdex === "undefined" ? null : setdex,
			typeof randdex === "undefined" ? null : randdex
		];
	}

	function clearImportedSets() {
		var storedSets = localStorage.customsets ? JSON.parse(localStorage.customsets) : null;
		clearStoredImportedSetsFromDexes(typeof SETDEX === "undefined" ? null : SETDEX, storedSets);
		clearStoredImportedSetsFromDexes(typeof RANDDEX === "undefined" ? null : RANDDEX, storedSets);
		clearStoredImportedSetsFromDexes(getImportedSetDexes(), storedSets);
		localStorage.removeItem("customsets");
		clearImportedSetsFromDexes(typeof SETDEX === "undefined" ? null : SETDEX);
		clearImportedSetsFromDexes(typeof RANDDEX === "undefined" ? null : RANDDEX);
		clearImportedSetsFromDexes(getImportedSetDexes());
		$(allPokemon("#importedSets")).prop("checked", false);
		$(allPokemon("#importedSetsOptions")).hide();
		loadDefaultLists();
	}

	function importSaveFile(file) {
		var reader = new FileReader();
		reader.onload = function (event) {
			try {
				var mons = parseSave(event.target.result);
				if (!mons.length) throw new Error("No Pokemon found in party or boxes 1-23.");
				var text = mons.map(toShowdown).join("\n\n");
				clearImportedSets();
				$(".import-team-text").val(text);
				$(".import-name-text").val("Custom Set");
				addSets(text, "Custom Set", true);
				$(allPokemon("#importedSetsOptions")).css("display", "inline");
				loadDefaultLists();
				selectRosterSet($("#p1 .set-selector.player"), mons[0].species + " (" + mons[0].species + ")");
				if (typeof updateRosterSprites === "function") updateRosterSprites();
				setStatus("Imported " + mons.length + " Pokemon from party and boxes 1-23.");
			} catch (error) {
				setStatus(error.message);
				alert(error.message);
			}
		};
		reader.onerror = function () {
			setStatus("Could not read save file.");
			alert("Could not read save file.");
		};
		reader.readAsArrayBuffer(file);
	}

	$(document).on("click", "#save-import-button", function () {
		$("#save-import-file").click();
	});

	$(document).on("change", "#save-import-file", function () {
		if (!this.files || !this.files[0]) return;
		setStatus("Reading " + this.files[0].name + "...");
		importSaveFile(this.files[0]);
		this.value = "";
	});
})();
