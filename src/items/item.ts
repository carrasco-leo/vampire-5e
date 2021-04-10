//
// item.ts — Vampire 5e
// ~/src/items
//

import type { V5eActor } from '../actors/actor';
import { V5eRolls } from '../system/rolls';
import { V5eUtility } from '../system/utility';

import ChatItemPug from '../templates/chat/item.pug';

export type V5eItemData = Item.Data<{
	description: string;
	gmnotes: string;

	skill: string;

	discipline: string;
	rollTest: string[]|null;
	opposedTest: string[]|null;
	level: number;
	rouses: number;
	duration: string;
	amalgam: { id: string; level: number; }|null;

	type: string;
	value: number;
}>;

export interface V5eItemPreparedData extends V5eItemData {
}

export class V5eItem extends Item<V5eItemData, V5eItemPreparedData> {
	get actor() { return super.actor as V5eActor<this>; }

	get rollable(): boolean {
		const data = this.data.data;

		return !!(
			this.type === 'speciality'
			|| this.type === 'power' && (data.rollTest || data.opposedTest)
		);
	}

	async roll(): Promise<void> {
		if (this.type === 'speciality') {
			return this._rollSpeciality();
		} else if (this.type === 'power') {
			return this._rollPower();
		} else if (this.type === 'feature') {
			return this._rollFeature();
		}
	}

	/**
	 * Post the item's description in the chat
	 */
	async toChat(): Promise<ChatMessage> {
		const chatOptions = V5eUtility.baseCardSetup({
			actor: this.actor,
			item: this,
		});

		chatOptions.content = ChatItemPug(duplicate(this.data))

		return ChatMessage.create(chatOptions);
	}

	protected async _rollSpeciality(): Promise<void> {
		const data = this.data.data;
		if (!data.skill) {
			return;
		}

		const setup = await this.actor.setupRoll({
			setupTitle: `${game.i18n.localize(CONFIG.V5E.SkillsKey[data.skill] + 'Test')} (${this.name})`,
			primary: ['attributes'],
			secondaryValue: 's:'+data.skill,
			modifier: 1,
		});

		await this.actor.simpleRoll(setup);
	}

	protected async _rollPower(): Promise<void> {
		const data = this.data.data;
		const actorData = this.actor.data.data;

		/** @todo rouse tests */
		const rouses = await this.actor.multipleRouseTests(data.rouses, {
			discipline: data.level,
		});

		if (!rouses) {
			return;
		}

		// post power after rouses as it can be canceled there
		this.toChat();

		const oppose = (msg?: ChatMessage) => {
			if (data.opposedTest) {
				return V5eRolls.renderOpposedCard({
					actor: this.actor,
					opposedTest: data.opposedTest,
					startMessageId: msg?.id,
				}, { 'flags.img': this.img } as any);
			}
		}

		if (data.rollTest) {
			const setup = await this.actor.setupRoll({
				setupTitle: this.name,
				primary: ['attributes', 'disciplines'],
				primaryValue: data.rollTest[0],
				secondary: ['attributes', 'skills', 'disciplines'],
				secondaryValue: data.rollTest[1],
				modifier: Math.floor(actorData.bloodPotency / 2),
				hunger: true,
			});

			await this.actor.simpleRoll(setup, (msg) => oppose(msg));
		} else if (data.opposedTest) {
			oppose();
		}
	}

	protected async _rollFeature() {
		const data = this.data.data;
		const actorData = this.actor.data.data;

		const setup = await this.actor.setupRoll({
			setupTitle: this.name,
			primary: ['attributes', 'skills', 'disciplines'],
			hunger: true,
		});

		if (setup) {
			setup.cardOptions.title = `${this.name} + ${setup.cardOptions.title}`;
			setup.rollData.pool += data.value;
		}

		await this.actor.simpleRoll(setup);
	}
}
