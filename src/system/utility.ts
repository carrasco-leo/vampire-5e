//
// utility.ts — Vampire 5e
// ~/src/system
//

import type { RollMode, ResourceStates } from './core';

export interface SetupOptions {
	actor?: Actor;
	item?: Item;
	rollMode?: RollMode;
	speaker?: ChatMessage.SpeakerData;
}

export class V5eUtility {
	static baseCardSetup(options: SetupOptions): DeepPartial<ChatMessage.CreateData> {
		options.rollMode = options.rollMode || game.settings.get('core', 'rollMode');

		const cardOptions: DeepPartial<ChatMessage.CreateData> = {
			user: game.user._id,
			flags: {},
			speaker: {},
		}

		if (options.actor) {
			const actor = options.actor;
			cardOptions.speaker.alias = actor.data.token.name;
			cardOptions.speaker.actor = actor.data._id;
			cardOptions.flags.img = actor.data.token.randomImg ? actor.data.img : actor.data.token.img;

			if (actor.token) {
				cardOptions.speaker.alias = actor.token.data.name;
				cardOptions.speaker.token = actor.token.data._id;
				cardOptions.speaker.scene = (<Canvas>canvas).scene._id;
				cardOptions.flags.img = actor.token.data.img;
			} else {
				const speaker = ChatMessage.getSpeaker();
				if (speaker.actor === actor.data._id) {
					cardOptions.speaker.alias = speaker.alias;
					cardOptions.speaker.token = speaker.token;
					cardOptions.speaker.scene = speaker.scene;

					if (speaker.token) {
						cardOptions.flags.img = (<Canvas>canvas).tokens.get(speaker.token).data.img;
					}
				}
			}
		}

		if (options.item) {
			cardOptions.flags.img = options.item.img;
		}

		if (options.speaker) {
			cardOptions.speaker = options.speaker;

			if (options.speaker.token) {
				cardOptions.flags.img = (<Canvas>canvas).tokens.get(options.speaker.token).data.img;
			}
		}

		if (options.rollMode === 'selfroll') {
			cardOptions.whisper = [game.user];
		} else if (['gmroll', 'blindroll'].includes(options.rollMode)) {
			cardOptions.whisper = ChatMessage.getWhisperRecipients('GM');
			cardOptions.blind = options.rollMode === 'blindroll';
		}

		return cardOptions;
	}

	/**
	 * Apply a damage on a resource-states
	 * @todo use enum instead of 1|2
	 */
	static damageResource(data: ResourceStates, state: 1|2): boolean {
		const expr = data.expr.split('').sort();
		if (expr[0] !== '0') {
			state = 2;
		}

		if (+expr[0] > state - 1) {
			return false;
		}

		expr[0] = ''+state;
		data.expr = expr.sort().join('');
		data.value = expr.reduce((total, x) => total + (x === '0' ? 1 : 0), 0);

		return true;
	}
}
