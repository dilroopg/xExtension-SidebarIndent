<?php

/**
 * Translations for Sidebar Feed Indent.
 *
 * PATH MATTERS: FreshRSS loads extension strings from
 * <ext>/i18n/<lang>/<namespace>.php and flattens them to
 * `<namespace>.<key>`. So the namespace folder must be `ext` and the file
 * `i18n/en/ext.php`, with NO nested 'ext' key inside. A file at i18n/en.php is
 * never read, and an extra 'ext' level makes every _t('ext.x.y') render its raw
 * key on the page.
 *
 * Keys are therefore declared flat, as the suffix after `ext.sidebar_indent.`.
 */
return [
	'sidebar_indent' => [
		'title' => 'Sidebar feed indent',
		'field' => 'Indent',
		'help' => 'Left padding added to feed names in the sidebar. 0 leaves them as they are.',
		'reset' => 'Reset to default',
		'preview' => 'Preview',
		'preview_help' => 'How the sidebar looks at the value set above.',
		'sample_category' => 'A category',
		'sample_feed_a' => 'A feed in it',
		'sample_feed_b' => 'Another feed',
		'sample_feed_c' => 'Indented feed',
		'scope_note' => 'Applies to feed rows only. Category rows, tags and the main stream are untouched.',
		'about_title' => 'About',
		'about_css' => 'One CSS rule, applied in the browser on every page that shows the sidebar.',
		'about_writes' => 'Writes nothing to your feeds, categories or articles.',
		'about_disable' => 'Disabled, the rule is never loaded and the sidebar is exactly as it was.',
		'saved' => 'Indent saved: %d px.',
		'bad_action' => 'Nothing was changed.',
		'missing_value' => 'No value was submitted.',
		'not_a_number' => 'The indent must be a whole number.',
		'save_failed' => 'Could not save the setting.',
	],
];
