//
// base-actor-sheet.ts — Vampire 5e
// ~/src/actors
//

export abstract class BaseActorSheet<
	Data extends object = ActorSheet.Data<Actor>,
	Type extends Actor = Data extends ActorSheet.Data<infer T> ? T : Actor,
	Options extends BaseEntitySheet.Options = BaseEntitySheet.Options,
> extends ActorSheet<Data, Type, Options> {
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
