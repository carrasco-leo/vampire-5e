//
// feature-sheet.ts — Vampire 5e
// ~/src/items/sheets
//

import { V5eItemSheet } from '../item-sheet';

import FeatureSheetPug from '../../templates/items/feature-sheet.pug';

export class V5eFeatureItemSheet extends V5eItemSheet {
	/** @override */
	get pug() { return FeatureSheetPug; }
}
