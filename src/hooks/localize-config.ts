//
// localize-config.ts — Vampire 5e
// ~/src/hooks
//

import type { Dict } from '../system/core';
import { Translatable } from '../system/core';

export function localizeConfig() {
	Hooks.on('setup', () => {
		Translatable.translate.forEach(({ target, propertyKey }) => {
			const value = target[propertyKey];

			if (typeof value === 'string') {
				target[propertyKey] = game.i18n.localize(value);
			} else if (Array.isArray(value)) {
				value.forEach((key, index, array) => {
					array[index] = game.i18n.localize(key);
				});
			} else if (value && value.constructor === Object) {
				for (const key in value) {
					value[key] = game.i18n.localize(value[key]);
				}
			}
		});
	});
}
