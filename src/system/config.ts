//
// config.ts — Vampire 5e
// ~/src/system
//

import type { Dict } from './core';
import { Translatable } from './core';

export class V5E {
	@Translatable()
	static PhysicalAttributes: Dict<string> = {
		strength: 'V5E.Strength',
		dexterity: 'V5E.Dexterity',
		stamina: 'V5E.Stamina',
	};

	@Translatable()
	static SocialAttributes: Dict<string> = {
		charisma: 'V5E.Charisma',
		manipulation: 'V5E.Manipulation',
		composure: 'V5E.Composure',
	};

	@Translatable()
	static MentalAttributes: Dict<string> = {
		intelligence: 'V5E.Intelligence',
		wits: 'V5E.Wits',
		resolve: 'V5E.Resolve',
	};

	@Translatable()
	static Attributes: Dict<string> = {
		...V5E.PhysicalAttributes,
		...V5E.SocialAttributes,
		...V5E.MentalAttributes,
	};

	@Translatable()
	static PhysicalSkills: Dict<string> = {
		athletics: 'V5E.Athletics',
		brawl: 'V5E.Brawl',
		craft: 'V5E.Craft',
		drive: 'V5E.Drive',
		firearms: 'V5E.Firearms',
		larceny: 'V5E.Larceny',
		melee: 'V5E.Melee',
		stealth: 'V5E.Stealth',
		survival: 'V5E.Survival',
	};

	@Translatable()
	static SocialSkills: Dict<string> = {
		'animal-ken': 'V5E.AnimalKen',
		etiquette: 'V5E.Etiquette',
		insight: 'V5E.Insight',
		intimidation: 'V5E.Intimidation',
		leadership: 'V5E.Leadership',
		performance: 'V5E.Performance',
		persuasion: 'V5E.Persuasion',
		streetwise: 'V5E.Streetwise',
		subterfuge: 'V5E.Subterfuge',
	};

	@Translatable()
	static MentalSkills: Dict<string> = {
		academics: 'V5E.Academics',
		awareness: 'V5E.Awareness',
		finance: 'V5E.Finance',
		investigation: 'V5E.Investigation',
		medicine: 'V5E.Medicine',
		occult: 'V5E.Occult',
		politics: 'V5E.Politics',
		science: 'V5E.Science',
		technology: 'V5E.Technology',
	};

	@Translatable()
	static Skills: Dict<string> = {
		...V5E.PhysicalSkills,
		...V5E.SocialSkills,
		...V5E.MentalSkills,
	};

	@Translatable()
	static Disciplines: Dict<string> = {
		obfuscate: 'V5E.Obfuscate',
		potence: 'V5E.Potence',
		animalism: 'V5E.Animalism',
		protean: 'V5E.Protean',
		auspex: 'V5E.Auspex',
		celerity: 'V5E.Celerity',
		dominate: 'V5E.Dominate',
		presence: 'V5E.Presence',
		fortitude: 'V5E.Fortitude',
		bloodSorcery: 'V5E.BloodSorcery',
	};

	@Translatable()
	static Difficulties: Dict<string> = {
		0: 'V5E.Difficulty0',
		1: 'V5E.Difficulty1',
		2: 'V5E.Difficulty2',
		3: 'V5E.Difficulty3',
		4: 'V5E.Difficulty4',
		5: 'V5E.Difficulty5',
		6: 'V5E.Difficulty6',
		7: 'V5E.Difficulty7',
	};

	@Translatable()
	static Features: Dict<string> = {
		background: 'V5E.Background',
		merit: 'V5E.Merit',
		flaw: 'V5E.Flaw',
	};

	static SkillsKey: Dict<string> = { ...V5E.Skills };
}
