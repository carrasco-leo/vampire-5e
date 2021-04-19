//
// base-item-sheet.ts — Vampire 5e
// ~/src/items
//

export abstract class BaseItemSheet<
	Data extends object = ItemSheet.Data<Item>,
	Type extends Item = Data extends ItemSheet.Data<infer T> ? T : Item,
	Options extends BaseEntitySheet.Options = BaseEntitySheet.Options,
> extends ItemSheet<Data, Type, Options> {
	/**
	 * Returns a function to render the inner content.
	 */
	get innerRenderFn(): (data: any) => string {
		return null;
	}

	/** @override */
	async _renderInner(data: any, options?: Application.RenderOptions): Promise<JQuery<HTMLElement>> {
		if (!this.innerRenderFn) {
			return super._renderInner(data, options);
		}

		const html = $(this.innerRenderFn(data));

		// FormApplication::_renderInner
		this.form = html[0] instanceof HTMLFormElement ? html[0] : html.find('form')[0];

		return html;
	}
}
