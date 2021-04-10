//
// register-hooks.ts — Vampire 5e
// ~/src/hooks
//

import { localizeConfig } from './localize-config';
import { contextMenu } from './context-menu';
import { chat } from './chat';

export function registerHooks() {
	localizeConfig();
	contextMenu();
	chat();
}
