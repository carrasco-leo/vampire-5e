//
// main.ts — Vampire 5e
// ~/src
//

import { V5E } from './system/config';
import { registerHooks } from './hooks/register-hooks';
import { templatePath } from './system/core';
import { V5eCharacterSheet } from './actors/sheets/character-sheet';
import { V5eActor } from './actors/actor';
import { V5eCoterieSheet } from './actors/sheets/coterie-sheet';
import { V5eItem } from './items/item';
import { V5eSpecialityItemSheet } from './items/sheets/speciality-sheet';
import { V5ePowerItemSheet } from './items/sheets/power-sheet';
import { V5eFeatureItemSheet } from './items/sheets/feature-sheet';
import { V5eClanItemSheet } from './items/sheets/clan-sheet';

export {}

Hooks.once('init', () => {
	Actors.unregisterSheet('core', ActorSheet);
	Items.unregisterSheet('core', ItemSheet);

	Actors.registerSheet('vampire-5e', V5eCharacterSheet, {
		types: ['character'],
		makeDefault: true,
	});

	Actors.registerSheet('vampire-5e', V5eCoterieSheet, {
		types: ['coterie'],
		makeDefault: true,
	});

	Items.registerSheet('vampire-5e', V5eSpecialityItemSheet, {
		types: ['speciality'],
		makeDefault: true,
	});

	Items.registerSheet('vampire-5e', V5ePowerItemSheet, {
		types: ['power'],
		makeDefault: true,
	});

	Items.registerSheet('vampire-5e', V5eFeatureItemSheet, {
		types: ['feature'],
		makeDefault: true,
	});

	Items.registerSheet('vampire-5e', V5eClanItemSheet, {
		types: ['clan'],
		makeDefault: true,
	});

	CONFIG.V5E = V5E;
	CONFIG.Actor.entityClass = V5eActor;
	CONFIG.Item.entityClass = V5eItem;
	CONFIG.ChatMessage.template = templatePath('chat/chat-message');

	game.v5e = {
	}
});

registerHooks();
