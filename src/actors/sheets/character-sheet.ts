//
// character-sheet.ts — Vampire 5e
// ~/src/actors/sheets
//

import { V5eActorSheet } from './actor-sheet';

import CharacterSheetPug from '../../templates/actors/character-sheet.pug';
import LimitedCharacterSheetPug from '../../templates/actors/limited-character-sheet.pug';

export class V5eCharacterSheet extends V5eActorSheet {
	/** @override */
	static get defaultOptions() {
		const options = super.defaultOptions;
		return mergeObject(options, {
			classes: options.classes.concat(['character-sheet']),
			width: 720,
			height: 680,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'stats',
				},
			],
			scrollY: [
				'.stats-tab',
				'.disciplines-tab',
				'.features-tab',
				'.description-tab',
			],
		});
	}

	/** @override */
	get pug() {
		if (this.actor.limited && !game.user.isGM) {
			return LimitedCharacterSheetPug;
		}
		return CharacterSheetPug;
	}

	/** @override */
	_getHeaderButtons() {
		const buttons = super._getHeaderButtons();

		if (this.actor.owner) {
			buttons.unshift({
				label: game.i18n.localize('BUTTON.Roll'),
				class: 'custom-roll',
				icon: 'fas fa-dice',
				onclick: async (event) => await this.actor.customRoll(),
			});
		}

		return buttons;
	}

	/** @override */
	getData() {
		return Promise.resolve(super.getData())
			.then((data) => {
				return mergeObject(data, {
					powers: this.actor.data.powers,
					features: this.actor.data.features,
				});
			})
	}
}
