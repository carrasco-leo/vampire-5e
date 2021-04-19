//
// item-sheet.ts — Vampire 5e
// ~/src/items
//

import type { V5eItem } from './item';
import type { V5eItemSheetData } from './item-data';
import { BaseItemSheet } from './base-item-sheet';

export class V5eItemSheet<T extends object> extends BaseItemSheet<T, V5eItem> {
	/** @override */
	static get defaultOptions(): BaseEntitySheet.Options {
		const options = super.defaultOptions;
		return mergeObject(options, {
			classes: ['vampire-5e', 'sheet', 'item-sheet'],
			width: 480,
			height: 480,
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description',
				},
			],
		});
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);

		html.find('input[type="checkbox"][data-toggle]')
			.each((index, element: HTMLInputElement) => {
				const id = element.dataset.toggle;
				const value = getProperty(this.item.data, id);

				element.checked = !!value;
			})

		html.on('click', 'input[type="checkbox"][data-toggle]', (event) => {
			event.stopPropagation();
			event.preventDefault();

			const target = (event.target as Element).closest('input[type="checkbox"][data-toggle]') as HTMLInputElement;
			const id = target.dataset.toggle;

			const value = (target.checked) ? JSON.parse(target.dataset.toggleValue) : null;
			this.item.update({ [id]: value });
		});
	}
}
