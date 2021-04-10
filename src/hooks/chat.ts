//
// chat.ts — Vampire 5e
// ~/src/hooks
//

export function chat() {
	Hooks.on('renderChatLog', (log, html, data) => {
		html.on('click', '.toggle-card-content', (event) => {
			const target = (event.target as Element).closest('.toggle-card-content');
			target.classList.toggle('active');
		});
	});

	Hooks.on('renderChatMessage', async (app, html, msg) => {
		if (html.hasClass('blind') && !game.user.isGM) {
			html.html('').css('display', 'none');
		}
	});
}
