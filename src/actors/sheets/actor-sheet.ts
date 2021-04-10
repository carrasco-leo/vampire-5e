//
// actor-sheet.ts — Vampire 5e
// ~/src/actors/sheets
//

import type { LocalsObject } from 'pug';

import type { V5eActor, V5eRollOptions, V5eActorData } from '../actor';
import type { Dict, ResourceStates, ResourceHumanity } from '../../system/core';

export interface V5eActorSheetData extends ActorSheet.Data<V5eActor> {
	powers: Dict<Item[]>;
	features: Dict<Item[]>;
}

export abstract class V5eActorSheet extends ActorSheet<V5eActorSheetData, V5eActor> {
	/** @override */
	static get defaultOptions(): BaseEntitySheet.Options {
		const options = super.defaultOptions;
		return mergeObject(options, {
			classes: ['vampire-5e', 'sheet', 'actor-sheet'],
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

	/** @override */
	activateListeners(html: JQuery<HTMLElement>): void {
		super.activateListeners(html);

		this._setupHtml(html);

		if (!this.actor.owner) {
			return;
		}

		this._resourceListeners(html);
		this._rollListeners(html);
		this._itemListeners(html);
	}

	protected _setupHtml(html: JQuery<HTMLElement>) {
		html.find('[data-resource]').each((index, element) => {
			const id = element.dataset.resource;
			const value: number = getProperty(this.actor.data, id) || 0;
			const boxes = $(element).find('.v5e-box');

			boxes.slice(0, value).attr('data-state', '0');
			boxes.slice(value).removeAttr('data-state');
		});

		// kind the same as [data-resource] except it tracks damages too
		// that can be either superficial (/) or aggravated (X)
		html.find('[data-resource-states]').each((index, element) => {
			const id = element.dataset.resourceStates;
			const resource: ResourceStates = getProperty(this.actor.data, id);
			const boxes = $(element).find('.v5e-box');
			boxes.removeAttr('data-state');

			if (resource.expr.length < resource.max) {
				resource.expr += '0'.repeat(resource.max - resource.expr.length);
			} else if (resource.expr.length > resource.max) {
				resource.expr = resource.expr.slice(0, resource.max);
			}

			for (let i = 0; i < resource.max; i++) {
				boxes[i].dataset.state = resource.expr[i];
			}
		});

		// humanity is similar to [data-resource] with stain that are superficial
		// damages placed on the right side
		html.find('[data-resource-humanity]').each((index, element) => {
			const id = element.dataset.resourceHumanity;
			const resource: ResourceHumanity = getProperty(this.actor.data, id);
			const boxes = $(element).find('.v5e-box');

			boxes.removeAttr('data-state');
			boxes.slice(0, resource.value).attr('data-state', '0');
			boxes.slice(resource.max - resource.stains).attr('data-state', '1');
		});

		// same as [data-resource] but for items
		html.find('[data-item-resource]').each((index, tracker) => {
			const itemId = tracker.closest<HTMLElement>('[data-id]').dataset.id;
			const item = this.actor.getOwnedItem(itemId);

			if (!item) {
				return;
			}

			const id = tracker.dataset.itemResource;
			const value: number = getProperty(item.data, id) || 0;
			const boxes = $(tracker).find('.v5e-box');

			boxes.slice(0, value).attr('data-state', '0');
			boxes.slice(value).removeAttr('data-state');
		});

		html.on('click', '.item-entry .item', (event) => {
			const target = (event.target as Element).closest<HTMLElement>('.item-entry');
			target.classList.toggle('item-expanded');
		});
	}

	/**
	 * Set trackers boxes and listen those boxes to update the value
	 */
	protected _resourceListeners(html: JQuery<HTMLElement>): void {
		// update tracker based on the clicked box index
		// if the clicked box is the current value, reduce value by one
		// else set the value to the index
		html.on('click', '[data-resource] .v5e-box', (event) => {
			const target = (event.target as Element).closest('.v5e-box') as HTMLElement;
			const tracker = target.closest('[data-resource]') as HTMLElement;

			const id = tracker.dataset.resource;
			const value: number = getProperty(this.actor.data, id) || 0;
			const index = $(tracker).find('.v5e-box').index(target);

			const nextValue = (value === index + 1) ? value - 1 : index + 1;
			this.actor.update({ [id]: nextValue });
		});

		// diff with [data-resource] as click cycle a box state
		// to set the max value the user must use ctrl+click as it shouldn't
		// often be modified
		html.on('click', '[data-resource-states] .v5e-box', (event) => {
			const target = (event.target as Element).closest('.v5e-box') as HTMLElement;
			const tracker = target.closest('[data-resource-states]') as HTMLElement;

			const id = tracker.dataset.resourceStates;
			const resource: ResourceStates = duplicate(getProperty(this.actor.data, id));
			const index = $(tracker).find('.v5e-box').index(target);
			const state = +target.dataset.state;

			if (event.ctrlKey) {
				return this._adjustResourceTracker(id, resource, index);
			} else if (index >= resource.max) {
				return;
			}

			const splits = resource.expr.split('');
			splits[index] = ''+((state + 1) % 3);

			resource.expr = splits.join('');
			resource.value = splits
				.reduce((x, y) => x + (y !== '0' ? 0 : 1), 0);

			this.actor.update({ [id]: resource });
		});

		// Add a damage (state 1&2) or heal (state 0)
		html.on('click', '[data-resource-actions] [data-state]', (event) => {
			const target = (event.target as Element).closest('[data-state]') as HTMLElement;
			const tracker = target.closest('[data-resource-actions]') as HTMLElement;

			const id = tracker.dataset.resourceActions;
			const resource: ResourceStates = duplicate(getProperty(this.actor.data, id));
			let state = +target.dataset.state;

			if (state === 0) {
				resource.value = resource.max;
				resource.expr = '0'.repeat(resource.max);
			} else {
				const states = resource.expr.split('').sort();
				if (states[0] === '2') {
					// tracker is full, mb prompt the information
					return;
				} else if (states[0] !== '0' && state === 1) {
					state++;
				}

				states[0] = ''+state;

				resource.expr = states.sort().join('');
				resource.value = states
					.reduce((x, y) => x + (y !== '0' ? 0 : 1), 0);
			}

			this.actor.update({ [id]: resource });
		});

		html.on('click', '[data-resource-humanity] .v5e-box', (event) => {
			const target = (event.target as Element).closest('.v5e-box') as HTMLElement;
			const tracker = target.closest('[data-resource-humanity]') as HTMLElement;

			const id = tracker.dataset.resourceHumanity;
			const resource: ResourceHumanity = duplicate(getProperty(this.actor.data, id));
			const index = $(tracker).find('.v5e-box').index(target);

			resource.max = 10;
			const stainsIndex = resource.max - resource.stains;

			if (index >= stainsIndex) {
				resource.stains--;
			} else if (index === resource.value - 1) {
				resource.value--;
			} else {
				resource.value = index + 1;
			}

			this.actor.update({ [id]: resource });
		});

		html.on('click', '[data-resource-humanity] .humanity-stain', (event) => {
			const tracker = (event.target as Element).closest('[data-resource-humanity]') as HTMLElement;

			const id = tracker.dataset.resourceHumanity;
			const resource: ResourceHumanity = duplicate(getProperty(this.actor.data, id));

			resource.max = 10;
			resource.stains++;
			const value: any = { [id]: resource };

			// case when value+stains over fill the tracker, add aggravated
			// damage on willpower
			if (resource.value + resource.stains > resource.max) {
				resource.stains--;

				/** @todo send a chat message to inform the damages */

				const willpower: ResourceStates = duplicate(getProperty(this.actor.data, 'data.willpower'));

				const states = willpower.expr.split('').sort();
				states[0] = '2';

				/** @todo externalize tracker operations */
				willpower.expr = states.sort().join('');
				willpower.value = states
					.reduce((x, y) => x + (y !== '0' ? 0 : 1), 0);
				value['data.willpower'] = willpower;
			}

			this.actor.update(value);
		});

		// update tracker for item based on the clicked box index
		// if the clicked box is the current value, reduce value by one
		// else set the value to the index
		html.on('click', '[data-item-resource] .v5e-box', (event) => {
			const target = (event.target as Element).closest<HTMLElement>('.v5e-box');
			const tracker = target.closest<HTMLElement>('[data-item-resource]');

			const itemId = target.closest<HTMLElement>('[data-id]').dataset.id;
			const item = this.actor.getOwnedItem(itemId);

			if (!item) {
				return;
			}

			const id = tracker.dataset.itemResource;
			const value: number = getProperty(item.data, id) || 0;
			const index = $(tracker).find('.v5e-box').index(target);

			const nextValue = (value === index + 1) ? value - 1 : index + 1;
			item.update({ [id]: nextValue });
		});
	}

	/**
	 * Adjust the max value of a resource
	 */
	protected async _adjustResourceTracker(id: string, resource: ResourceStates, index: number): Promise<void> {
		const nextMax = index + 1;
		if (resource.max === nextMax) {
			resource.expr = resource.expr.slice(0, -1);
			resource.max--;
		} else if (resource.max > nextMax) {
			resource.expr.slice(0, nextMax);
			resource.max = nextMax;
		} else {
			resource.expr += '0'.repeat(nextMax - resource.max);
			resource.max = nextMax;
		}

		if (resource.bars) {
			const bars = Math.ceil(resource.max / 10);
			if (bars < resource.bars) {
				resource.bars = bars;
			} else if (resource.max === resource.bars * 10) {
				const yes = await Dialog.confirm({
					title: game.i18n.localize('V5E.ResourceStatesIncreaseSize'),
					content: '<p>'+game.i18n.localize('V5E.ResourceStatesIncreaseSize?')+'</p>',
					defaultYes: false,
				});

				if (yes) {
					resource.bars = bars + 1;
				}
			}
		}

		resource.value = resource.expr
			.split('')
			.reduce((x, y) => x + (y !== '0' ? 0 : 1), 0);

		await this.actor.update({ [id]: resource });
	}

	/**
	 * Setup and run rolls and their effects
	 */
	protected _rollListeners(html: JQuery<HTMLElement>): void {
		html.on('click', '.custom-roll', (event) => {
			const target = (event.target as Element).closest('.custom-roll') as HTMLElement;
			const options: V5eRollOptions = { ...target.dataset };

			this.actor.setupRoll(options)
				.then((setup) => this.actor.simpleRoll(setup))
		});

		html.on('click', '.attribute-roll', (event) => {
			const target = (event.target as Element).closest('.attribute-roll') as HTMLElement;
			const options: V5eRollOptions = { ...target.dataset };
			options.hunger = true;

			options.primary = ['attributes'];
			options.secondary = ['attributes'];

			this.actor.setupRoll(options)
				.then((setup) => this.actor.simpleRoll(setup))
		});

		html.on('click', '.skill-roll', (event) => {
			const target = (event.target as Element).closest('.skill-roll') as HTMLElement;
			const options: V5eRollOptions = { ...target.dataset };
			options.hunger = true;

			options.primary = ['attributes'];
			// options.secondary = ['skills'];

			this.actor.setupRoll(options)
				.then((setup) => this.actor.simpleRoll(setup))
		});

		html.on('click', '.rouse-roll', (event) => {
			const target = (event.target as Element).closest('.rouse-roll') as HTMLElement;

			this.actor.rouseTest({ ...target.dataset });
		});

		html.on('click', '.frenzy-roll', (event) => {
			const target = (event.target as Element).closest('.frenzy-roll') as HTMLElement;

			this.actor.frenzyTest({ ...target.dataset });
		});

		html.on('click', '.remorse-roll', (event) => {
			this.actor.remorseTest();
		});
	}

	/**
	 * Listen to action on items
	 */
	protected _itemListeners(html: JQuery<HTMLElement>): void {
		html.on('click', '.add-item', (event) => {
			const target = (event.target as Element).closest('.add-item') as HTMLElement;
			const data: Item.Data<any> = duplicate<any>(target.dataset);

			data.name = `New ${data.name || data.type.capitalize()}`;
			this.actor.createOwnedItem(data);
		});

		html.on('click', '.delete-item', (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			Dialog.confirm({
				title: game.i18n.localize('V5E.DeleteItem'),
				content: '<p>'+game.i18n.localize('V5E.DeleteItem?')+'</p>',
				yes: () => this.actor.deleteOwnedItem(id),
				defaultYes: false,
			});
		});

		html.on('click', '.edit-item', (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			const item = this.actor.getOwnedItem(id);
			item.sheet.render(true);
		});

		html.on('click', '.roll-item', (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			const item = this.actor.getOwnedItem(id);
			item.roll();
		});

		html.on('click', '.post-item', (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			const item = this.actor.getOwnedItem(id);
			item.toChat();
		});

		// special case for discipline as they're not real items
		html.on('click', '.roll-discipline', async (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			const options: V5eRollOptions = {
				setupTitle: game.i18n.localize('V5E.DisciplineTest'),
				primary: ['disciplines'],
				secondary: ['disciplines', 'attributes', 'skills'],
				primaryValue: 'd:'+id,
				secondaryValue: 'a:strength',
				hunger: true,
			};

			const setup = await this.actor.setupRoll(options);
			this.actor.simpleRoll(setup);
		});

		html.on('click', '.delete-discipline', (event) => {
			const target = (event.target as Element).closest('[data-id]') as HTMLElement;
			const id = target.dataset.id;

			const name = CONFIG.V5E.Disciplines[id];

			Dialog.confirm({
				title: game.i18n.localize('V5E.DeleteDiscipline'),
				content: game.i18n.format('V5E.DeleteDiscipline?', { name }),
				yes: () => this.actor.removeDiscipline(id),
				defaultYes: false,
			});
		});
	}
}
