//
// actor-data.ts — Vampire 5e
// ~/src/actors
//

import type { V5eActor } from './actor';
import type { V5eItemData } from '../items/item-data';
import type { Resource, ResourceHumanity, ResourceStates, Dict } from '../system/core';

export interface V5eCharacterSheetData extends ActorSheet.Data<V5eActor> {
	powers: Dict<Item[]>;
	features: Dict<Item[]>;
}

export interface V5eCoterieSheetData extends ActorSheet.Data<V5eActor> {
	features: Dict<Item[]>;
}

export interface V5eActorData {
	health: ResourceStates;
	willpower: ResourceStates;
	humanity: ResourceHumanity;
	hunger: Resource;
	bloodPotency: number;
	stats: Dict<number>;
	skills: Dict<number>;
	disciplines: Dict<number>;
	description: string;
	gmnotes: string;
}

export interface V5eActorPreparedData extends Actor.Data<V5eActorData, V5eItemData> {
	allSpecialities: Item[];
	specialities: Dict<Item[]>;
	powers: Dict<Item[]>;
	features: Dict<Item[]>;
}
