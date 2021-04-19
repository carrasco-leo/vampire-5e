//
// speciality-sheet.ts — Vampire 5e
// ~/src/items/sheets
//

import { V5eItemSheet } from '../item-sheet';

import SpecialitySheetPug from '../../templates/items/speciality-sheet.pug';

export class V5eSpecialityItemSheet extends V5eItemSheet<{}> {
	/** @override */
	get innerRenderFn(): (data: any) => string { return SpecialitySheetPug; }
}
