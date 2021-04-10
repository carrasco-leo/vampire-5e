//
// context-menu.ts — Vampire 5e
// ~/src/hooks
//

import type { V5eActor } from '../actors/actor';
import type { OpposedCardMessage, RollCardMessage, RollResult } from '../system/core';

export function contextMenu() {
	Hooks.on('getChatLogEntryContext', (html: JQuery<HTMLElement>, options: any[]) => {
		const canApplyWillpowerReroll = (li) => {
			const message = game.messages.get(li.attr('data-message-id'));

			if (message.data.speaker.actor && message.data.flags.rollResult) {
				const actor = game.actors.get(message.data.speaker.actor);
				const result: RollResult = message.data.flags.rollResult as any;
				const disabled: boolean = message.data.flags.disableReroll as any;

				return (
					actor.permission === ENTITY_PERMISSIONS.OWNER
					&& actor.data.data.willpower.value > 0
					&& result.baseDice.length > 0
					&& !disabled
				);
			}

			return false;
		}
		const canApplyOpposeTest = (li: JQuery<HTMLLIElement>): boolean => {
			const message = game.messages.get(li.attr('data-message-id'));
			const { actor } = ChatMessage.getSpeaker();

			return actor && message.data.flags.opposedTest && !message.data.flags.disableOppose;
		}

		options.push(
			{
				name: game.i18n.localize('CHATOPT.UseWillpowerReroll'),
				icon: '<i class="fas fa-dice"></i>',
				condition: canApplyWillpowerReroll,
				callback: (li) => {
					const message = game.messages.get(li.attr('data-message-id'));
					const actor = game.actors.get<V5eActor>(message.data.speaker.actor);

					actor.useWillpowerReroll(message);
				}
			},
			{
				name: game.i18n.localize('CHATOPT.OpposeTest'),
				icon: '<i class="fas fa-exchange-alt"></i>',
				condition: canApplyOpposeTest,
				callback: async (li: JQuery<HTMLLIElement>) => {
					const message = game.messages.get<OpposedCardMessage>(li.attr('data-message-id'));
					const rollMessage = game.messages.get<RollCardMessage>(<any>message.data.flags.startMessageId);
					const { actor: id } = ChatMessage.getSpeaker();
					const actor = game.actors.get<V5eActor>(id);

					const opposedFlags: any = message.data.flags;
					const rollFlags: any = rollMessage?.data.flags || {};

					const setup = await actor.setupRoll({
						primary: ['disciplines', 'attributes'],
						secondary: ['disciplines', 'attributes', 'skills'],
						primaryValue: opposedFlags.opposedTest[0],
						secondaryValue: opposedFlags.opposedTest[1],
						difficulty: rollFlags.rollResult?.total || 0,
						hunger: true,
					});

					await actor.simpleRoll(setup, (msg) => {
						/** @todo handle result */
					});
				},
			},
		);
	});
}
