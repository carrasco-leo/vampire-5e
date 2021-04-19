//
// coterie-sheet.ts — Vampire 5e
// ~/src/actors/sheets
//

import { V5eActorSheet } from '../actor-sheet';
import type { V5eCoterieSheetData } from '../actor-data';

import CoterieSheetPug from '../../templates/actors/coterie-sheet.pug';
import LimitedCoterieSheetPug from '../../templates/actors/limited-coterie-sheet.pug';

export class V5eCoterieSheet extends V5eActorSheet<V5eCoterieSheetData> {
	/** @override */
	static get defaultOptions() {
		const options = super.defaultOptions;
		return mergeObject(options, {
			classes: options.classes.concat(['coterie-sheet']),
			width: 580,
			height: 640,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'features',
				},
			],
		});
	}

	/** @override */
	get innerRenderFn(): (data: any) => string {
		if (this.actor.limited && !game.user.isGM) {
			return LimitedCoterieSheetPug;
		}
		return CoterieSheetPug;
	}

	/** @override */
	getData() {
		return Promise.resolve(super.getData())
			.then((data) => {
				return mergeObject(data, {
					features: this.actor.data.features,
				});
			})
	}
}
