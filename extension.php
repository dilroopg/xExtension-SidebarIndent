<?php
declare(strict_types=1);

/**
 * Sidebar Feed Indent
 *
 * Adds a small left indent to feed rows in the sidebar, so feed names sit
 * further from the edge and closer to the unread count on the right.
 *
 * The whole feature is one CSS rule on one custom property. Nothing is written
 * to feeds, categories or articles; the only stored state is a single integer.
 */
class SidebarIndentExtension extends Minz_Extension
{
	/** Indent used when nothing has been saved yet. */
	public const DEFAULT_INDENT = 12;

	/** Hard cap, so a bad value cannot push feed names off the sidebar. */
	public const MAX_INDENT = 60;

	/** user configuration key */
	private const CONF_KEY = 'sidebar_indent_px';

	/** stylesheet registered on every page that renders the sidebar */
	private const CSS = 'sidebar-indent.css';

	/** script: publishes the saved value, and drives the settings slider */
	private const JS = 'sidebar-indent.js';

	/**
	 * Registers the stylesheet and the script for every page.
	 *
	 * This is the one extension type where global registration is correct
	 * rather than lazy: the indent has to be present on the sidebar itself, not
	 * only on the settings page, so there is no cheaper place to put it. With
	 * the extension off, neither file is requested at all.
	 *
	 * The stylesheet goes in from init() because a stylesheet has to be in
	 * <head>, and because a custom property read at first paint is what keeps
	 * the sidebar from reflowing after load.
	 */
	public function init(): void
	{
		parent::init();

		$this->registerTranslates();
		$this->registerHook(Minz_HookType::JsVars, [$this, 'jsVars']);

		Minz_View::appendStyle($this->getFileUrl(self::CSS));
		Minz_View::appendScript($this->getFileUrl(self::JS, 'js', true));
	}

	/**
	 * Hand the saved indent to the page.
	 *
	 * A CSS custom property set from here means the sidebar is correct on first
	 * paint. Doing it from a script that reads the setting over HTTP would show
	 * the indent popping in after the sidebar renders.
	 *
	 * @param array<string,mixed> $vars
	 * @return array<string,mixed>
	 */
	public function jsVars(array $vars): array
	{
		$vars['sidebarIndent'] = [
			'px' => $this->indent(),
		];
		return $vars;
	}

	/** The saved indent, clamped to the allowed range. */
	public function indent(): int
	{
		$n = $this->getUserConfigurationInt(self::CONF_KEY, self::DEFAULT_INDENT) ?? self::DEFAULT_INDENT;
		return max(0, min(self::MAX_INDENT, $n));
	}

	/**
	 * Settings page.
	 *
	 * Per-page work runs on every request; only the POST half is delegated, so
	 * a plain GET still renders the form and the current value.
	 */
	public function handleConfigureAction(): void
	{
		$this->registerTranslates();

		if (Minz_Request::isPost()) {
			$this->handleConfigurePost();
		}
	}

	/**
	 * Save the posted indent.
	 *
	 * An absent field is refused rather than read as "empty": the server cannot
	 * tell a blank field from a field the form never rendered, and treating the
	 * two the same is how a broken form silently resets a setting.
	 */
	private function handleConfigurePost(): void
	{
		if (Minz_Request::paramStringNull('act') !== 'save_indent') {
			Minz_Request::bad(_t('ext.sidebar_indent.bad_action'), $this->selfUrl());
			return;
		}

		$posted = Minz_Request::paramStringNull(self::CONF_KEY);
		if ($posted === null) {
			Minz_Request::bad(_t('ext.sidebar_indent.missing_value'), $this->selfUrl());
			return;
		}

		if (!ctype_digit($posted)) {
			Minz_Request::bad(_t('ext.sidebar_indent.not_a_number'), $this->selfUrl());
			return;
		}

		$n = min(self::MAX_INDENT, (int)$posted);
		$this->setUserConfigurationValue(self::CONF_KEY, $n);

		Minz_Request::good(_t('ext.sidebar_indent.saved', $n), $this->selfUrl());
	}

	/** The extension's own settings route. */
	private function selfUrl(): array
	{
		return [
			'c' => 'extension',
			'a' => 'configure',
			'params' => ['e' => $this->getName()],
		];
	}
}
