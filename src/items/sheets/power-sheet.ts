//
// power-sheet.ts — Vampire 5e
// ~/src/items/sheets
//

import type { V5eItem } from '../item';
import { V5eItemSheet } from '../item-sheet';
import { V5eActor } from '../../actors/actor';

import PowerSheetPug from '../../templates/items/power-sheet.pug';

export interface V5ePowerSheetData extends ItemSheet.Data<V5eItem> {
	disciplines: string[];
}

export class V5ePowerItemSheet extends V5eItemSheet<V5ePowerSheetData> {
	/** @override */
	get innerRenderFn(): (data: any) => string { return PowerSheetPug; }

	/** @override */
	getData() {
		return Promise.resolve(super.getData())
			.then((data) => {
				const actor = (this.actor instanceof V5eActor) ? this.actor : null;

				return mergeObject(data, {
					disciplines: Object.keys(actor?.data.powers || CONFIG.V5E.Disciplines),
				});
			})
	}
}
