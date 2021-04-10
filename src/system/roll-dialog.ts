//
// roll-dialog.ts — Vampire 5e
// ~/src/system
//

import type { DialogOptions, Dict, RerollDialogOptions } from './core';

export class V5eRollDialog extends Dialog {
	reroll: Set<number>;

	static async setupRoll(options: DialogOptions): Promise<JQuery<HTMLElement>> {
		const { template, title } = options;
		const data: any = options.data;

		const Optgroups: Dict<Dict<string>> = {
			attributes: Object.keys(CONFIG.V5E.Attributes)
				.reduce((dict, key) => ((dict['a:'+key] = CONFIG.V5E.Attributes[key]) || true) && dict, {}),
			skills: Object.keys(CONFIG.V5E.Skills)
				.map((key) => ({ key: 's:'+key, value: CONFIG.V5E.Skills[key] }))
				.sort((a, b) => a.value.localeCompare(b.value))
				.reduce((dict, it) => ((dict[it.key] = it.value) || true) && dict, {}),
			disciplines: Object.keys(CONFIG.V5E.Disciplines)
				.map((key) => ({ key: 'd:'+key, value: CONFIG.V5E.Disciplines[key] }))
				.sort((a, b) => a.value.localeCompare(b.value))
				.reduce((dict, it) => ((dict[it.key] = it.value) || true) && dict, {}),
		}
		const Labels: Dict<string> = {
			attributes: game.i18n.localize('V5E.Attributes'),
			skills: game.i18n.localize('V5E.Skills'),
			disciplines: game.i18n.localize('V5E.Disciplines'),
		}

		if (options.data.primary) {
			if (options.data.primary.length === 1) {
				data.primaryOptions = Optgroups[options.data.primary[0]];
			} else {
				data.primaryOptions = options.data.primary
					.reduce((dict, key) => (dict[Labels[key]] = Optgroups[key]) && dict, {})
			}
		}

		if (options.data.secondary) {
			if (options.data.secondary.length === 1) {
				data.secondaryOptions = Optgroups[options.data.secondary[0]];
			} else {
				data.secondaryOptions = options.data.secondary
					.reduce((dict, key) => (dict[Labels[key]] = Optgroups[key]) && dict, {})
			}
		}

		const content: string = (typeof template !== 'string')
			? template(data)
			: await renderTemplate(template, data);

		return new Promise<JQuery<HTMLElement>>((resolve, reject) => {
			const dialog = new this({
				title,
				content,
				buttons: {
					rollButton: {
						label: game.i18n.localize('Roll'),
						callback: (html) => resolve(html as JQuery<HTMLElement>),
					},
				},
				close: () => resolve(null),
				default: 'rollButton',
			}, { width: 480 });

			dialog.render(true);
		});
	}

	static async setupReroll(options: RerollDialogOptions) {
		const { template, title, result } = options;
		const data = options.data || {};

		data.result = result;

		const content: string = (typeof template !== 'string')
			? template(data)
			: await renderTemplate(template, data);

		return new Promise<number[]>((resolve, reject) => {
			const dialog: V5eRollDialog = new this({
				title,
				content,
				buttons: {
					rerollButton: {
						label: game.i18n.localize('Reroll'),
						callback: (html) => resolve(Array.from(dialog.reroll)),
					},
				},
				close: () => resolve([]),
				default: 'rerollButton',
			}, { width: 480 });

			dialog.reroll = new Set();
			dialog.render(true);
		});
	}

	/** @override */
	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);

		if (this.reroll) {
			html.on('change', '.reroll-dice-list input[type="checkbox"]', (event) => {
				event.stopPropagation();

				const target = event.target as HTMLInputElement;
				const index = +target.dataset.index;

				if (!target.checked) {
					this.reroll.delete(index);
				} else if (this.reroll.size < 3) {
					this.reroll.add(index);
				}

				target
					.closest('.reroll-dice-list')
					.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
					.forEach((input) => {
						if (input.checked) {
							return;
						}

						input.disabled = this.reroll.size >= 3;
						input.parentElement.classList.toggle('disabled', this.reroll.size >= 3);
					});
			});
		}
	}
}
