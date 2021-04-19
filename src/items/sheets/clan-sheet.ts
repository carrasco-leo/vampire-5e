//
// clan-sheet.ts — Vampire 5e
// ~/src/items/sheets
//

import { V5eItemSheet } from '../item-sheet';

import ClanSheetPug from '../../templates/items/clan-sheet.pug';

export class V5eClanItemSheet extends V5eItemSheet<{}> {
	/** @override */
	get innerRenderFn(): (data: any) => string { return ClanSheetPug; }
}
