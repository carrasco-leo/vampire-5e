//
// rolls.ts — Vampire 5e
// ~/src/system
//

import type { RollData, CardOptions, RollMode, RollResult, OpposedOptions } from './core';
import { V5E } from './config';
import type { V5eActor } from '../actors/actor';

import RollCardPug from '../templates/chat/roll-card.pug';
import OpposedCardPug from '../templates/chat/opposed-card.pug';

export class V5eRolls {
	static parse(actor: V5eActor, pools: string[]) {
		let rollPool = 0;
		const title = pools.map((expr) => {
			let match;
			expr = expr || '';

			if ((match = expr.match(/^a:(.+?)$/))) {
				rollPool += actor.data.data.stats[match[1]] || 0;
				return V5E.Attributes[match[1]];
			} else if ((match = expr.match(/^s:(.+?)$/))) {
				rollPool += actor.data.data.skills[match[1]] || 0;
				return V5E.Skills[match[1]];
			} else if ((match = expr.match(/^d:(.+?)$/))) {
				rollPool += actor.data.data.disciplines[match[1]] || 0;
				return V5E.Disciplines[match[1]];
			} else {
				return null;
			}
		});

		return { rollPool, title: title.filter((value) => value).join(' + ') }
	}

	/**
	 * Evaluate a roll and state all informations of the result
	 */
	static evaluate(rollData: RollData): RollResult {
		const result: RollResult = {
			rollData,
			baseDice: (rollData.baseRoll.terms[0] as DiceTerm).results,
			hungerDice: [],
			hunger: rollData.hunger !== null,
			difficulty: rollData.difficulty,
			modifier: rollData.modifier,
			total: 0,
			critical: false,
			messyCritical: false,
			bestialFailure: false,
		}

		if (result.hunger) {
			result.hungerDice = (rollData.hungerRoll.terms[0] as DiceTerm).results;
		}

		let criticalCount = 0;

		result.baseDice.forEach((die) => {
			result.total += +(die.result >= 6);
			criticalCount += +(die.result >= 10);
		});

		result.hungerDice.forEach((die) => {
			result.total += +(die.result >= 6);
			criticalCount += +(die.result >= 10);
			result.messyCritical = result.messyCritical || die.result >= 10;
			result.bestialFailure = result.bestialFailure || die.result <= 1;
		});

		// 2 criticals add 2 success for a total of 4 successes
		result.total += Math.floor(criticalCount / 2) * 2;
		result.critical = criticalCount >= 2;

		return result;
	}

	static async rollDice(rollData: RollData, rollMode: RollMode): Promise<RollData> {
		if (rollData.roll) {
			return rollData;
		}

		const pool = Math.max(1, rollData.pool + (rollData.modifier || 0));
		const hunger = Math.min(pool, rollData.hunger || 0);
		const base = pool - hunger;

		const rolls = [new Roll(`${base}d10cs>=6`)];
		if (typeof rollData.hunger === 'number') {
			rolls.push(new Roll(`${hunger}d10cs>=6`));
		}

		rollData.roll = new DicePool({ rolls });
		rollData.roll.evaluate();

		await this.showDiceSoNice(rollData.roll, rollMode);

		rollData.baseRoll = rollData.roll.rolls[0] as Roll;
		rollData.hungerRoll = rollData.roll.rolls[1] as Roll || null;

		return rollData;
	}

	static async showDiceSoNice(roll: DicePool, rollMode: RollMode) {
		if (!game.modules.get('dice-so-nice') || !game.modules.get('dice-so-nice').active) {
			return;
		}

		let whisper = null;
		let blind = rollMode === 'blindroll';

		if (rollMode === 'blindroll' || rollMode === 'gmroll') {
			whisper = game.users.filter((user) => user.isGM).map((user) => user.data._id);
		} else if (rollMode === 'selfroll') {
			whisper = [];
		}

		await (<any>game.dice3d).showForRoll(roll, game.usr, true, whisper, blind);
	}

	static async renderCard(result: RollResult, cardOptions: CardOptions) {
		const cardData = {
			title: cardOptions.title,
			result,
			hideData: game.user.isGM,
		}

		/** @todo use custom renderTemplate to render pug from a fileName */
		const template = cardOptions.template || RollCardPug;
		const html = (typeof template !== 'string')
			? template(cardData)
			: await renderTemplate(template, cardData);

		const options: any = cardOptions;
		options.content = html;
		options.rollMode = options.rollMode || game.settings.get('core', 'rollMode');

		options['flags.title'] = cardOptions.title;
		options['flags.rollResult'] = result;
		options['flags.rollMode'] = cardOptions.rollMode;
		options['flags.applyFn'] = cardOptions.applyFn || [];

		if (options.rollMode === 'selfroll') {
			options.whisper = [game.user];
		} else if (['gmroll', 'blindroll'].includes(options.rollMode)) {
			options.whisper = ChatMessage.getWhisperRecipients('GM');
			options.blind = options.rollMode === 'blindroll';
		}

		return ChatMessage.create(options);
	}

	static async renderOpposedCard(
		cardOptions: OpposedOptions,
		options: DeepPartial<ChatMessage.CreateData> = {},
	) {
		const template = cardOptions.template || OpposedCardPug;
		const { title } = V5eRolls.parse(cardOptions.actor, cardOptions.opposedTest);

		const cardData = {
			opposedTest: cardOptions.title || title,
			hideData: game.user.isGM,
		}

		const html = (typeof template !== 'string')
			? template(cardData)
			: await renderTemplate(template, cardData);
		options.content = html;

		if (!options.speaker) {
			options.speaker = ChatMessage.getSpeaker({
				actor: cardOptions.actor,
				token: cardOptions.actor.token,
				alias: cardOptions.actor.name,
			});
		}

		cardOptions.rollMode = cardOptions.rollMode || game.settings.get('core', 'rollMode');

		options['flags.opposedTest'] = cardOptions.opposedTest;
		options['flags.startMessageId'] = cardOptions.startMessageId;
		options['flags.rollMode'] = cardOptions.rollMode;

		if (cardOptions.rollMode === 'selfroll') {
			options.whisper = [game.user];
		} else if (['gmroll', 'blindroll'].includes(cardOptions.rollMode)) {
			options.whisper = ChatMessage.getWhisperRecipients('GM');
			options.blind = cardOptions.rollMode === 'blindroll';
		}

		return ChatMessage.create(options);
	}
}
