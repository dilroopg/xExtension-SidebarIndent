# Changelog

Newest first. These version numbers match the [releases page](https://github.com/hardlysleeping/xExtension-SidebarIndent/releases).

**1.0.0** — first release.

Adds a small left indent to feed names in the sidebar, controlled by a slider that
lives in the sidebar itself, directly under the **Important feeds** row. The row
starts collapsed, so it is one line until opened; the slider moves the indent live
and **Save** stores it. A second slider and a preview sit on the extension's
settings page.

Browser-side only: one CSS custom property and one rule on `#aside_feed`. Nothing
is written to feeds, categories or articles.

Three things this release gets right that the first attempt did not, worth knowing
if you are reading the source:

- **The row is structurally a core category row** — `display: block`, an
  inline-block caret and `.title`, and the value as a `data-value` `::after` on
  `.title`. A flex row painted its own background across the neighbouring rows'
  unread counts, which read as a bar over them.
- **The payload is read from the bare global `context`**, and from the inline
  `#jsonVars` tag as a fallback. FreshRSS 1.30.1 does not set `window.context`, and
  reading it fails silently — the indent just stays at 0.
- **The control anchors on the Important row's class list**, not its visible text,
  so a translated or renamed label cannot move it.
