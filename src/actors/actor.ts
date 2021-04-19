//
// actor.ts — Vampire 5e
// ~/src/actors
//

import type { V5eActorData, V5eActorPreparedData } from './actor-data';

import type {
	TemplateOrPug,
	CardOptions,
	DialogOptions,
	RollData,
	Resource,
	ResourceHumanity,
	ResourceStates,
	Dict,
	RollResult,
	RollMode,
} from '../system/core';
import type { V5eItem } from '../items/item';
import type { V5eItemData } from '../items/item-data';
import { V5eRollDialog } from '../system/roll-dialog';
import { V5eRolls } from '../system/rolls';
import { V5eUtility } from '../system/utility';

import SetupV5eRollDialog from '../templates/dialogs/setup-roll.pug';
import RidingTheWaveChatPug from '../templates/chat/riding-the-wave.pug';
import CustomSetupDialogPug from '../templates/dialogs/custom-setup-roll.pug';
import RerollDialogPug from '../templates/dialogs/setup-reroll.pug';

export interface SetupData {
	rollData: RollData;
	cardOptions: CardOptions;
}

export interface V5eRollOptions {
	pool?: number;
	modifier?: number;
	difficulty?: number;
	hunger?: boolean;
	primary?: Array<'attributes'|'skills'|'disciplines'>;
	secondary?: Array<'attributes'|'skills'|'disciplines'>;
	primaryValue?: string;
	secondaryValue?: string;

	title?: string;
	setupTitle?: string;
	setupTemplate?: TemplateOrPug;
	skipSetup?: boolean;
	applyFn?: string[];
}

export class V5eActor<I extends V5eItem = V5eItem>
	extends Actor<Actor.Data<V5eActorData, V5eItemData>, I, V5eActorPreparedData>
{
	/** @override */
	static async create(
		data: DeepPartial<V5eActor['_data']>|ReadonlyArray<DeepPartial<V5eActor['_data']>>,
		options?: Entity.CreateOptions,
	) {
		if (data instanceof Array) {
			return super.create(data, options);
		} else if (data.items) {
			return super.create(data, options);
		}

		data.token = data.token || {};
		data.items = [];

		if (data.type === 'character') {
			mergeObject(data.token, {
				actorLink: true,
			}, { overwrite: false });
		}

		return super.create(data, options);
	}

	/** @override */
	async createEmbeddedEntity(
		embeddedName: any,
		item: any,
		options?: any,
	): Promise<any> {
		const actorData = this.data.data;
		const itemData = expandObject(item).data || {};

		if (embeddedName === 'OwnedItem') {
			if (this.data.type !== 'character' && item.type !== 'feature') {
				return;
			}

			if (item.type === 'discipline') {
				if (!actorData.disciplines[itemData.id]) {
					await this.update({ ['data.disciplines.' + itemData.id]: 0 });
				}

				return;
			}

			if (item.type === 'clan') {
				const disciplines = itemData.disciplines.reduce((dict, id) => {
					dict['data.disciplines.' + id] = this.data.data.disciplines[id] || 0;
					return dict;
				}, {});

				await this.update({
					'data.details.clan': item.name,
					'data.details.bane': itemData.bane,
					...disciplines,
				});

				return;
			}

			if (item.type === 'power') {
				if (typeof actorData.disciplines[itemData.discipline] !== 'number') {
					ui.notifications.warn(game.i18n.format('V5E.PreventPowerDiscipline', {
						name: CONFIG.V5E.Disciplines[itemData.discipline],
					}));

					return;
				}

				if (itemData.level > actorData.disciplines[itemData.discipline]) {
					ui.notifications.warn(game.i18n.format('V5E.PreventPowerLevel', {
						min: itemData.level,
						current: actorData.disciplines[itemData.discipline],
					}));

					return;
				}

				if (
					itemData.amalgam && (
						typeof actorData.disciplines[itemData.amalgam.id] !== 'number'
						|| itemData.amalgam.level > actorData.disciplines[itemData.amalgam.id]
					)
				) {
					ui.notifications.warn(game.i18n.format('V5E.PreventPowerAmalgam', {
						name: CONFIG.V5E.Disciplines[itemData.amalgam.id],
						level: itemData.amalgam.level,
					}));

					return;
				}
			}
		}

		return super.createEmbeddedEntity(embeddedName, item, options);
	}

	/** @override */
	prepareData() {
		super.prepareData();

		if (this.data.type == 'character') {
			this._prepareCharacter();
		} else if (this.data.type === 'coterie') {
			this._prepareCoterie();
		}
	}

	protected _prepareCharacter() {
		const data = this.data.data;
		const specialities: Dict<Item[]> = {};
		const allSpecialities: Item[] = [];
		const powers: Dict<Item[]> = {};
		const features: Dict<Item[]> = {
			background: [],
			merit: [],
			flaw: [],
		};

		for (const key in CONFIG.V5E.Disciplines) {
			if (typeof data.disciplines[key] === 'number') {
				powers[key] = [];
			} else {
				delete data.disciplines[key];
			}
		}

		this.items.forEach((value) => {
			const itemData = value.data.data;

			if (value.type === 'speciality') {
				if (!specialities[itemData.skill]) {
					specialities[itemData.skill] = [];
				}

				specialities[itemData.skill].push(value);
				allSpecialities.push(value);
			} else if (value.type === 'power') {
				if (itemData.discipline in data.disciplines) {
					powers[itemData.discipline].push(value);
				}
			} else if (value.type === 'feature') {
				if (!(itemData.type in features)) {
					features[itemData.type] = [];
				}

				features[itemData.type].push(value);
			}
		});

		for (const key in specialities) {
			specialities[key].sort((a, b) => a.name.localeCompare(b.name));
		}

		mergeObject(this.data, {
			specialities,
			allSpecialities,
			powers,
			features,
		});
	}

	protected _prepareCoterie() {
		const features: Dict<Item[]> = {
			background: [],
			merit: [],
			flaw: [],
		};

		this.items.forEach((value) => {
			const itemData = value.data.data;

			if (value.type === 'feature') {
				if (!(itemData.type in features)) {
					features[itemData.type] = [];
				}

				features[itemData.type].push(value);
			}
		});

		mergeObject(this.data, {
			features,
		});
	}

	async setupRoll(options: V5eRollOptions = {}): Promise<{ rollData: RollData; cardOptions: CardOptions; }> {
		const rollData: RollData = {
			pool: +options.pool || 1,
			modifier: +options.modifier || 0,
			difficulty: +options.difficulty || 0,
			hunger: (options.hunger) ? this.data.data.hunger.value : null,
		}

		const cardOptions = this.setupCardOptions(null, options.title);
		cardOptions.applyFn = options.applyFn || [];

		const dialogOptions: DialogOptions = {
			title: options.setupTitle || options.title || game.i18n.localize('V5E.RollTest'),
			template: options.setupTemplate || SetupV5eRollDialog,
			data: {
				pool: rollData.pool,
				primary: options.primary,
				primaryValue: options.primaryValue,
				secondary: options.secondary,
				secondaryValue: options.secondaryValue,
				modifier: rollData.modifier,
				difficulty: rollData.difficulty,
				rollMode: cardOptions.rollMode,
			},
		}

		if (options.skipSetup) {
			return { rollData, cardOptions };
		}

		const html = await V5eRollDialog.setupRoll(dialogOptions);
		if (!html) {
			return null;
		}

		const form = html.find('form').get(0);

		const pool = form.elements.namedItem('pool') as HTMLInputElement;
		if (pool) {
			rollData.pool = +pool.value;
		}

		const modifier = form.elements.namedItem('modifier') as HTMLInputElement;
		if (modifier) {
			rollData.modifier = +modifier.value;
		}

		const difficulty = form.elements.namedItem('difficulty') as HTMLInputElement;
		if (difficulty) {
			rollData.difficulty = +difficulty.value;
		}

		if (options.primary) {
			const primary = form.elements.namedItem('primary') as HTMLSelectElement;
			const secondary = form.elements.namedItem('secondary') as HTMLSelectElement;

			const values = [primary.value, secondary?.value || options.secondaryValue];
			const { rollPool, title } = V5eRolls.parse(this, values);
			cardOptions.title = options.title || title;
			rollData.pool = rollPool;
		}

		return { rollData, cardOptions }
	}

	setupCardOptions(template: TemplateOrPug, title: string): CardOptions {
		const cardOptions: CardOptions = V5eUtility.baseCardSetup({ actor: this }) as any;
		cardOptions.title = title;
		cardOptions.template = template;

		return cardOptions
	}

	async simpleRoll(setup: SetupData, afterMessage: (msg: ChatMessage, result: RollResult) => void = () => {}) {
		if (!setup) {
			return null;
		}

		const { rollData, cardOptions } = setup;

		await V5eRolls.rollDice(rollData, cardOptions.rollMode);
		const result = V5eRolls.evaluate(rollData);

		V5eRolls.renderCard(result, cardOptions).then((msg) => afterMessage(msg, result));

		return { result, cardOptions }
	}

	async removeDiscipline(id: string) {
		const items = this.data.powers[id].map((item) => item.id);
		await this.update({ ['data.disciplines.' + id]: null });
		await this.deleteOwnedItem(items);
	}

	async rouseTest(options: { title?: string; modifier?: number; discipline?: number; } = {}) {
		const hunger = this.data.data.hunger;
		const title = options.title || game.i18n.localize('V5E.RouseTest');

		// Can only make a rouse at max Hunger only if forced to
		if (hunger.value >= hunger.max) {
			const yes = await Dialog.confirm({
				title,
				content: game.i18n.format('V5E.RouseAtMaxHunger', { hunger: hunger.value }),
				defaultYes: false,
			});

			if (!yes) {
				return;
			}
		}

		const rollOptions: V5eRollOptions = {
			title,
			pool: 1,
			modifier: +options.modifier || 0,
			difficulty: 1,
			skipSetup: true,
			applyFn: ['applyRouseResult'],
		};

		if (options.discipline) {
			const maxLevel = Math.ceil(this.data.data.bloodPotency / 2);
			if (options.discipline <= maxLevel) {
				options.modifier++;
			}
		}

		const setup = await this.setupRoll(rollOptions);
		this.simpleRoll(setup, (msg, result) => this.applyRouseResult(msg, null, result));
	}

	async multipleRouseTests(n: number, options: { title?: string; modifier?: number; discipline?: number; } = {}) {
		if (n === 0) {
			return [];
		}
		// if n is neg, we ask the number of rouse tests to do
		else if (n < 0) {
			n = await new Promise((resolve, reject) => {
				const dialog = new Dialog({
					title: game.i18n.localize('VTM5e.RouseTest'),
					content: `<form><div class="form-group"><label>${game.i18n.localize('VTM5e.RouseCount')}</label><input type="number" name="testRouses" min="0" value="0" /></div></form>`,
					buttons: {
						submitButton: {
							label: game.i18n.localize('Submit'),
							callback: (html: JQuery<HTMLElement>) => {
								const value = +html.find('[name="testRouses"]').val() || 0;

								return resolve(value);
							},
						},
					},
					close: () => resolve(null),
					default: 'submitButton',
				});

				dialog.render(true);
			});

			if (n === null) {
				return null;
			} else if (n <= 0) {
				return [];
			}
		}

		// check if actor is able to make all the tests
		const hunger = this.data.data.hunger;
		if (hunger.max - hunger.value < n) {
			ui.notifications.warn(game.i18n.format('V5E.PreventMultipleRouses', { n, hunger: hunger.value }));

			return null;
		}

		return Promise.all(Array.from({ length: n }, () => this.rouseTest(options)));
	}

	async applyRouseResult(msg: ChatMessage, previous: RollResult, next: RollResult) {
		const hunger = duplicate(this.data.data.hunger);

		if (previous && previous.total < previous.difficulty) {
			hunger.value = Math.max(0, hunger.value - 1);
		}

		if (next.total < next.difficulty) {
			// test failed, check if hunger is full or not
			// if failed, make a frenzy test
			if (hunger.value < hunger.max) {
				hunger.value++;
			} else {
				await this.frenzyTest({
					title: game.i18n.localize('V5E.HungerFrenzyTest'),
					difficulty: 4,
				});
			}
		}

		return this.update({ 'data.hunger': hunger })
	}

	async frenzyTest(options: V5eRollOptions = {}) {
		options.title = options.title || game.i18n.localize('V5E.FrenzyTest')
		const rtwTitle = game.i18n.localize('V5E.RidingTheWave');
		const data = this.data.data;

		// Riding the Wave?
		const ridingTheWave = await Dialog.confirm({
			title: rtwTitle,
			content: game.i18n.localize('V5E.RidingTheWave?'),
			defaultYes: false,
		});

		if (ridingTheWave) {
			const cardOptions = this.setupCardOptions(RidingTheWaveChatPug, rtwTitle);
			V5eRolls.renderCard(null, cardOptions);

			return null;
		}

		options.pool = data.willpower.value + Math.floor(data.humanity.value / 3);
		options.applyFn = (options.applyFn || []).concat(['applyFrenzyResult']);
		const setup = await this.setupRoll(options);

		this.simpleRoll(setup, (msg, result) => this.applyFrenzyResult(msg, null, result));
	}

	async applyFrenzyResult(msg: ChatMessage, previous: RollResult, next: RollResult) {
		const text = (next.total < next.difficulty) ? 'V5E.FailedFrenzy'
			: (next.critical) ? 'V5E.CriticalSuccessFrenzy'
			: 'V5E.SuccessFrenzy';

		const options = V5eUtility.baseCardSetup({
			actor: this,
			speaker: msg.data.speaker,
		});
		options.content = game.i18n.localize(text);

		ChatMessage.create(options);
	}

	async remorseTest() {
		const humanity = this.data.data.humanity;
		if (humanity.stains === 0) {
			return;
		}

		const options: V5eRollOptions = {
			title: game.i18n.localize('V5E.RemorseTest'),
			pool: humanity.max - humanity.value - humanity.stains,
			difficulty: 1,
			skipSetup: true,
			applyFn: ['applyRemorseResult'],
		};

		const setup = await this.setupRoll(options);
		this.simpleRoll(setup, (msg, result) => this.applyRemorseResult(msg, null, result));
	}

	async applyRemorseResult(msg: ChatMessage, previous: RollResult, next: RollResult) {
		const humanity = duplicate(this.data.data.humanity);
		humanity.stains = 0;

		// if we need to cancel previous roll
		if (previous && previous.total < previous.difficulty) {
			humanity.value = Math.min(humanity.max, humanity.value + 1);
		}

		if (next.total < next.difficulty) {
			humanity.value = Math.max(0, humanity.value - 1);

			const options = V5eUtility.baseCardSetup({
				actor: this,
				speaker: msg.data.speaker,
			});
			options.content = game.i18n.localize('V5E.RemorseLoseHumanity');

			ChatMessage.create(options);
		}

		return this.update({ 'data.humanity': humanity });
	}

	async customRoll(options: V5eRollOptions = {}) {
		options.title = options.title || game.i18n.localize('V5E.CustomRoll');
		options.setupTemplate = options.setupTemplate || CustomSetupDialogPug;

		const setup = await this.setupRoll(options)
		this.simpleRoll(setup);
	}

	async useWillpowerReroll(msg: ChatMessage) {
		const willpower = duplicate(this.data.data.willpower) as ResourceStates;
		const flags = msg.data.flags as any;

		if (willpower.value <= 0) {
			return;
		}

		const result = flags.rollResult as RollResult;
		const indexes = await V5eRollDialog.setupReroll({
			title: game.i18n.localize('V5E.RerollDialogTitle'),
			template: RerollDialogPug,
			result,
		});

		if (indexes.length === 0) {
			return;
		}

		const rollMode = flags.rollMode as RollMode;
		const { baseRoll } = await V5eRolls.rollDice({
			pool: indexes.length,
			modifier: 0,
			difficulty: 0,
			hunger: null,
		}, rollMode);

		const rerolls = (baseRoll.terms as DiceTerm[])[0].results;
		const data = duplicate(result.rollData) as RollData;

		// replace dice
		const results = (data.baseRoll.terms as DiceTerm[])[0].results;
		indexes.forEach((index) => results[index] = rerolls.pop());

		const newResult = V5eRolls.evaluate(data);
		const newTitle = game.i18n.format('V5E.RerollTestTitle', { title: flags.title });

		const cardOptions: any = this.setupCardOptions(null, newTitle);
		cardOptions.speaker = msg.data.speaker;
		cardOptions.flags.disableReroll = true;
		cardOptions.rollMode = flags.rollMode;
		cardOptions.user = msg.data.user;
		cardOptions.flags.img = flags.img;

		V5eUtility.damageResource(willpower, 1);
		this.update({
			'data.willpower.value': willpower.value,
			'data.willpower.expr': willpower.expr,
		});
		msg.update({ 'flags.disableReroll': true });

		V5eRolls.renderCard(newResult, cardOptions).then(async (msg) => {
			const applyFn: string[] = flags.applyFn || [];
			for (const fn of applyFn) {
				await this[fn](msg, result, newResult);
			}
		});
	}
}
