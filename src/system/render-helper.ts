//
// render-helpers.ts — Vampire 5e
// ~/src/system
//

export function tr(id: string, params?: any) {
	return (params) ? game.i18n.format(id, params) : game.i18n.localize(id);
}

export function editor(options: any) {
	const target = options.target;
	if (!target) throw new Error('You must defined the name of a target field.');
	const owner = !!options.owner;
	const content = TextEditor.enrichHTML(options.content || '', { secrets: owner, entities: true } as any);
	let html = `<div class="editor-content" data-edit="${target}">${content}</div>`;
	const button = !!options.button;
	const editable = !!options.editable;
	if (button && editable) html += '<a class="editor-edit"><i class="fas fa-edit"></i></a>';
	return `<div class="editor">${html}</div>`;
}
