//
// item-sheet.ts — Vampire 5e
// ~/src/items
//

import type { LocalsObject } from 'pug';

import type { V5eItem } from './item';

export class V5eItemSheet<Data extends object = {}> extends ItemSheet<Data, V5eItem> {
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

	/**
	 * Returns a function to render the inner content
	 */
	get pug(): (locals?: LocalsObject) => string {
		return null;
	}

	/** @override */
	async _renderInner(data: any, options?: Application.RenderOptions): Promise<JQuery<HTMLElement>> {
		if (!this.pug) {
			return super._renderInner(data, options);
		}

		const html = $(this.pug(data));

		// FormApplication::_renderInner
		this.form = html[0] instanceof HTMLFormElement ? html[0] : html.find('form')[0];

		return html;
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
