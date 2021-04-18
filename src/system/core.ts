//
// core.ts — Vampire 5e
// ~/src/system
//

import type { V5eActor } from '../actors/actor';

export type TemplateOrPug = string|((locals?: Dict<any>) => string);
export type RollMode = keyof typeof CONFIG.Dice.rollModes;

export interface Dict<T> {
	[key: string]: T;
	[key: number]: T;
}

export interface CardOptions {
	title: string;
	template: TemplateOrPug;
	rollMode: RollMode;
	flags: Record<string, unknown>;
	speaker: Partial<ChatMessage.SpeakerData>;
	applyFn?: string[];
}

export interface DialogOptions {
	title: string;
	template: TemplateOrPug;
	data: {
		primary: Array<'attributes'|'skills'|'disciplines'>;
		secondary: Array<'attributes'|'skills'|'disciplines'>;
		modifier: number;
		difficulty: number;
		rollMode: RollMode;
		[key: string]: unknown;
	}
}

export interface RerollDialogOptions {
	title: string;
	template: TemplateOrPug;
	result: RollResult;
	data?: any;
}

export interface RollData {
	pool: number;
	hunger: number;
	modifier: number;
	difficulty: number;
	roll?: DicePool;
	baseRoll?: Roll;
	hungerRoll?: Roll;
}

export interface RollResult {
	rollData: RollData;
	baseDice: DiceTerm.Result[];
	hungerDice: DiceTerm.Result[];
	hunger: boolean;
	difficulty: number;
	modifier: number;
	total: number;
	critical: boolean;
	messyCritical: boolean;
	bestialFailure: boolean;
}

export interface OpposedOptions {
	actor: V5eActor;
	opposedTest: string[];
	title?: string;
	template?: TemplateOrPug;
	rollMode?: RollMode;
	startMessageId?: string;
}

export interface Resource {
	value: number;
	max: number;
}

export interface ResourceStates extends Resource {
	expr: string;
}

export interface ResourceHumanity extends Resource {
	stains: number;
}

export function templatePath(file: string): string {
	if (!file.endsWith('.hbs')) {
		file += '.hbs';
	}

	return `systems/vampire-5e/templates/${file}`;
}

export function Translatable() {
	return function(target: any, propertyKey: string) {
		Translatable.translate.push({ target, propertyKey });
	}
}

Translatable.translate = [] as Array<{ target: any; propertyKey: string; }>;

export interface OpposedCardMessage extends ChatMessage {
	flags: any;
}

export interface RollCardMessage extends ChatMessage {
	flags: any;
}
