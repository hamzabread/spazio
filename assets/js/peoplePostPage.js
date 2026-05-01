/**
 * People profile posts: move optional `.sc-people-sidebar-only` from the bio column
 * into `.sc-people-sidebar-slot`, then normalize paragraph spacing in `.sc-people-bio`.
 *
 * Ghost/Lexical often outputs an empty `<p></p>` between real paragraphs (so `p + p`
 * never matches) or a single `<p>` with `<br><br>` instead of two block paragraphs.
 */

const DOUBLE_BR = /<br\s*\/?>(?:\s*\n\s*)?<br\s*\/?>/gi;

function paragraphIsEmpty(p) {
	const clone = p.cloneNode(true);
	clone.querySelectorAll('br').forEach((br) => br.remove());
	return clone.textContent.replace(/\u00a0/g, ' ').trim() === '';
}

function removeEmptyParagraphs(root) {
	let removed = true;
	while (removed) {
		removed = false;
		root.querySelectorAll('p').forEach((p) => {
			if (paragraphIsEmpty(p)) {
				p.remove();
				removed = true;
			}
		});
	}
}

function splitParagraphsOnDoubleBreak(root) {
	const paragraphs = Array.from(root.querySelectorAll('p'));
	for (const p of paragraphs) {
		if (!p.isConnected) continue;
		const html = p.innerHTML;
		DOUBLE_BR.lastIndex = 0;
		if (!DOUBLE_BR.test(html)) continue;
		DOUBLE_BR.lastIndex = 0;
		const parts = html.split(DOUBLE_BR).map((s) => s.trim()).filter(Boolean);
		if (parts.length < 2) continue;
		const frag = document.createDocumentFragment();
		for (const part of parts) {
			const np = document.createElement('p');
			np.innerHTML = part;
			frag.appendChild(np);
		}
		p.replaceWith(frag);
	}
}

function normalizePeopleBioParagraphs(bio) {
	removeEmptyParagraphs(bio);
	splitParagraphsOnDoubleBreak(bio);
	removeEmptyParagraphs(bio);
}

export function initPeoplePostPage() {
	const page = document.querySelector('.sc-people-page');
	if (!page) return;

	const bio = page.querySelector('.sc-people-bio');
	if (!bio) return;

	const slot = page.querySelector('.sc-people-sidebar-slot');
	const aside = bio.querySelector('.sc-people-sidebar-only');
	if (slot && aside) {
		slot.appendChild(aside);
	}

	normalizePeopleBioParagraphs(bio);
}
