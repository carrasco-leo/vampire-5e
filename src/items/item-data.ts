//
// item-data.ts — Vampire 5e
// ~/src/items
//

export interface V5eSpecialityItemData {
	description: string;
	gmnotes: string;
	skill: string|null;
}

export interface V5ePowerItemData {
	description: string;
	gmnotes: string;
	system: string;
	discipline: string;
	rollTest: string[]|null;
	opposedTest: string[]|null;
	level: number;
	rouses: number;
	duration: string;
	amalgam: { id: string; level: number; }|null;
}

export interface V5eFeatureItemData {
	description: string;
	gmnotes: string;
	value: number;
	type: string;
}

export interface V5eClanItemData {
	description: string;
	gmnotes: string;
	disciplines: string[];
	bane: string;
}

export type V5eItemData = Item.Data<V5eSpecialityItemData & V5ePowerItemData & V5eFeatureItemData & V5eClanItemData>;

export interface V5eItemPreparedData extends V5eItemData {
}

export interface V5eItemSheetData {
}
