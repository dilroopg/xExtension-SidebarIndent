/**
 * Sidebar Feed Indent
 *
 * Three jobs:
 *   1. publish the saved indent as a CSS variable, on every page
 *   2. put a small, collapsible indent slider inline in the sidebar, directly
 *      under the "Important feeds" row
 *   3. drive the slider on the extension's settings page
 *
 * How the payload arrives (verified against FreshRSS 1.30.1, do not guess):
 * the page head carries an inline <script id="jsonVars"> whose JSON has
 * `extensions.<Key>`. FreshRSS's own main.js parses it into a BARE GLOBAL named
 * `context` — not `window.context` — then dispatches
 * `freshrss:globalContextLoaded` on `document`.
 *
 * Reading window.context silently leaves the indent at 0 with no error, which
 * is indistinguishable from "the setting didn't save". Hence the payload is
 * looked up two ways, and a missing payload only means no indent.
 */
(function () {
	'use strict';

	var PAYLOAD_KEY = 'sidebarIndent';
	var VAR_NAME = '--sidebar-indent-px';
	var MAX_PX = 60;
	var STORE_KEY = 'frss-sidebar-indent-open';

	function clamp(n) {
		n = parseInt(n, 10);
		if (isNaN(n) || n < 0) { return 0; }
		return Math.min(MAX_PX, n);
	}

	function applyIndent(px) {
		document.documentElement.style.setProperty(VAR_NAME, clamp(px) + 'px');
	}

	// ---- find the payload -------------------------------------------------
	function readIndent() {
		// `context` is declared with `var` in main.js, so it is a global.
		var ctx = (typeof context !== 'undefined') ? context : window.context;
		if (ctx && ctx.extensions && ctx.extensions[PAYLOAD_KEY]
			&& typeof ctx.extensions[PAYLOAD_KEY].px !== 'undefined') {
			return ctx.extensions[PAYLOAD_KEY].px;
		}
		// The tag is removed by main.js once parsed, so this only works before
		// that — but it is the one source present on every page regardless of
		// script order.
		var el = document.getElementById('jsonVars');
		if (el) {
			try {
				var j = JSON.parse(el.textContent);
				var p = j && j.extensions && j.extensions[PAYLOAD_KEY];
				if (p && typeof p.px !== 'undefined') { return p.px; }
			} catch (e) { /* not ready, or already consumed */ }
		}
		return null;
	}

	function boot() {
		var px = readIndent();
		if (px === null) { return false; }
		applyIndent(px);
		return true;
	}

	// ---- Job 1: every page ------------------------------------------------
	// main.js dispatches this on `document` (the event does not bubble, so a
	// window-level listener would never fire).
	document.addEventListener('freshrss:globalContextLoaded', boot);

	if (!boot()) {
		// Bounded: failing to indent is cosmetic, an endless poll is worse.
		var tries = 0;
		var timer = setInterval(function () {
			tries++;
			if (boot() || tries > 60) { clearInterval(timer); }
		}, 50);
	}

	// ---- Job 2: the inline sidebar control -------------------------------
	function csrfToken() {
		var ctx = (typeof context !== 'undefined') ? context : window.context;
		if (ctx && ctx.csrf) { return ctx.csrf; }
		var m = document.querySelector('input[name="_csrf"]');
		return m ? m.value : '';
	}

	/**
	 * Built with createElement rather than innerHTML: no markup string is ever
	 * parsed, and the row carries the same .tree-folder.category classes as its
	 * neighbours so the theme styles it as part of the tree rather than as a
	 * stray box bolted on.
	 */
	function buildControl(px) {
		var li = document.createElement('li');
		li.className = 'tree-folder category sidebar-indent-toggle';
		li.id = 'sidebar-indent-toggle';

		var row = document.createElement('a');
		row.className = 'tree-folder-title';
		row.href = '#sidebar-indent-panel';
		row.setAttribute('role', 'button');
		row.setAttribute('aria-controls', 'sidebar-indent-panel');

		var caret = document.createElement('button');
		caret.className = 'dropdown-toggle';
		caret.type = 'button';
		caret.tabIndex = -1;
		row.appendChild(caret);

		var label = document.createElement('span');
		label.className = 'title';
		label.textContent = 'Feed indent';
		row.appendChild(label);

		li.appendChild(row);

		var panel = document.createElement('ul');
		panel.className = 'tree-folder-items sidebar-indent-panel';
		panel.id = 'sidebar-indent-panel';

		var item = document.createElement('li');
		item.className = 'item';

		var slider = document.createElement('input');
		slider.type = 'range';
		slider.id = 'sidebar-indent-slider';
		slider.min = '0';
		slider.max = String(MAX_PX);
		slider.step = '1';
		slider.value = String(px);
		slider.setAttribute('aria-label', 'Feed name indent in pixels');
		item.appendChild(slider);

		var save = document.createElement('button');
		save.type = 'button';
		save.className = 'btn sidebar-indent-save';
		save.textContent = 'Save';
		item.appendChild(save);

		panel.appendChild(item);
		li.appendChild(panel);

		// ---- behaviour ----
		var open = false;

		function setOpen(state, persist) {
			open = state;
			row.setAttribute('aria-expanded', state ? 'true' : 'false');
			panel.classList.toggle('active', state);
			caret.textContent = state ? '▾' : '▸';
			// The value is a ::after on .title reading this attribute, exactly
			// as core renders a category's unread count.
			label.setAttribute('data-value', String(clamp(slider.value)));
			if (persist) {
				try { localStorage.setItem(STORE_KEY, state ? '1' : '0'); } catch (e) { /* private mode */ }
			}
		}

		// Collapsed unless the user last left it open. localStorage can throw in
		// private mode, so it is wrapped and any failure means collapsed.
		var wasOpen = '0';
		try { wasOpen = localStorage.getItem(STORE_KEY) || '0'; } catch (e) { /* ignore */ }
		setOpen(wasOpen === '1', false);

		// Capture phase + stopPropagation: the theme's own handler on
		// .tree-folder-title would otherwise collapse the row, and core's
		// KeepFolderState-style listeners would re-assert their own state over
		// ours. toggling a class we declare is what neither can override.
		row.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			setOpen(!open, true);
		}, true);

		slider.addEventListener('input', function () {
			// Live: the sidebar itself moves as the slider moves.
			label.setAttribute('data-value', String(clamp(slider.value)));
			applyIndent(slider.value);
		});

		save.addEventListener('click', function () {
			var v = clamp(slider.value);
			save.disabled = true;
			save.textContent = 'Saving…';

			var body = new URLSearchParams();
			body.set('act', 'save_indent');
			body.set('sidebar_indent_px', String(v));
			body.set('_csrf', csrfToken());

			fetch('./?c=extension&a=configure&e=' + encodeURIComponent('Sidebar Feed Indent'), {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body.toString()
			}).then(function (r) {
				if (!r.ok) { throw new Error('HTTP ' + r.status); }
				save.textContent = 'Saved';
				setTimeout(function () { save.disabled = false; save.textContent = 'Save'; }, 1200);
			}).catch(function () {
				save.disabled = false;
				save.textContent = 'Retry';
			});
		});

		return li;
	}

	function injectControl() {
		if (document.getElementById('sidebar-indent-toggle')) { return true; }

		var aside = document.getElementById('aside_feed');
		if (!aside) { return false; }

		// Anchor on the class list, not the visible text: "Important feeds" is a
		// translated string and a renamed label must not move the control.
		var important = aside.querySelector('li.tree-folder.category.important');
		if (!important || !important.parentNode) { return false; }

		var px = readIndent();
		if (px === null) { return false; }

		important.parentNode.insertBefore(buildControl(px), important.nextSibling);
		return true;
	}

	document.addEventListener('freshrss:globalContextLoaded', injectControl);
	if (!injectControl()) {
		// The sidebar can arrive after the context. Poll briefly, then stop.
		var n = 0;
		var iv = setInterval(function () {
			n++;
			if (injectControl() || n > 60) { clearInterval(iv); }
		}, 100);
	}

	// ---- Job 3: settings page slider -------------------------------------
	function initSettingsPage() {
		var slider = document.getElementById('sidebar_indent_px');
		if (!slider) { return; }   // not the settings page

		var readout = document.getElementById('sidebar_indent_readout');
		var reset = document.getElementById('sidebar_indent_reset');

		function paint() {
			var px = clamp(slider.value);
			if (readout) { readout.textContent = px + ' px'; }
			// Same variable the real sidebar uses, so the preview cannot
			// disagree with the rule.
			applyIndent(px);
		}

		slider.addEventListener('input', paint);
		slider.addEventListener('change', paint);

		if (reset) {
			reset.addEventListener('click', function (e) {
				e.preventDefault();
				slider.value = slider.getAttribute('data-default') || '0';
				paint();
			});
		}

		// The slider's value attribute is the saved indent, so the live
		// variable is already correct; paint once so the readout matches.
		paint();
	}

	document.addEventListener('freshrss:globalContextLoaded', initSettingsPage);
	initSettingsPage();
})();
