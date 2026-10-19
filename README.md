# Sidebar Feed Indent

A FreshRSS extension that adds a small left indent to feed names in the sidebar,
so they sit a bit further from the window edge and closer to the unread count on
the right.

## Why this exists

FreshRSS renders feed rows flush against the left edge of the sidebar. With the
browser window maximised, or docked against the edge of the screen, the feed
names start right where the window does. That bothered me enough to make this.

The specific annoyance: the feed name is jammed against the edge, while its
unread count floats a whole column away on the right. Moving the name in a little
puts the two closer together and stops the sidebar reading as cramped.

So this is a cosmetic itch, and the fix is deliberately small: a slider, and one
CSS rule.

## What it does

- A slider in the sidebar, **directly under the "Important feeds" row**.
- It starts **collapsed** — one quiet line reading `Feed Indent` with the current
  value in a small circle on the right, like the other counts in the column. Click
  it to open the slider; click again to close it. Nothing is added to the sidebar
  until you open it.
- Dragging the slider moves the indent live, so you can see the result against
  your actual feeds rather than a mock-up. **Save** stores it.
- The row is deliberately quieter than the category rows around it: smaller type,
  bold, dimmed — it is a setting, not a feed container.
- The same slider also appears on the extension's settings page, along with a
  collapsed preview of the sidebar column you can look at before saving.

Category rows, tag rows, the pseudo-categories (Main stream, Important feeds,
Favourites) and the main stream itself are all untouched — only the feed rows
inside a category move.

## Install

1. Copy `xExtension-SidebarIndent/` into your FreshRSS `extensions/` directory.
2. In FreshRSS: **Configuration → Extensions**, enable **Sidebar Feed Indent**.
3. Open the sidebar and click `Feed Indent` under **Important feeds**.

## How it works

One integer, stored in the extension's own per-user configuration, published into
the page as a CSS custom property:

```
:root { --sidebar-indent-px: 12px; }

#aside_feed .tree-folder-items > .item.feed > .item-title {
    padding-left: var(--sidebar-indent-px);
}
```

Two details that matter:

- **The indent goes on `.item-title`, not on the row `<li>`.** The unread badge is
  an absolutely-positioned `::after` pinned to the right edge; padding the row
  itself would drag that badge along with the name. Padding the title moves only
  the name.
- **The selector is scoped to `#aside_feed`.** The subscription page, stats view
  and global view all reuse `.item.feed`, and they keep their existing layout.

The value is delivered through the `JsVars` hook, so the custom property is set
from the page head and the sidebar is correct on first paint. Reading the setting
over HTTP after load would render the sidebar flush and then jump.

The sidebar control is injected by JavaScript and anchors on the class list of the
**Important feeds** row (`li.tree-folder.category.important`), not on its visible
text — so a translated or renamed label cannot move it somewhere unexpected. It is
built with `createElement` rather than `innerHTML`, so no markup string is ever
parsed.

It is also built to **look like the rows it sits among**, which is not cosmetic
detail but the thing that took the most attempts. Core's category rows are
`display: block` with an inline-block caret and `.title`, and draw the count as a
`data-value` `::after` on `.title`. A flex row with a separate `<span>` for the
value stretches across the row and paints its own background — which lands on top
of the neighbouring rows' unread counts and reads as a bar over them. Matching
core's structure is what makes it disappear into the tree.

## Releases

See [CHANGELOG.md](CHANGELOG.md).

## Limits

Real, and worth stating plainly:

- **Browser-side only.** This is a stylesheet rule. A reader app on the GReader or
  Fever API sees no indent, because there is no indent in an API response. It is a
  display tweak, not a data change — the sidebar you fix here is the one in the
  browser.
- **It goes through core's markup.** The control is inserted into the sidebar by
  JavaScript, because an extension cannot edit FreshRSS's own templates. If a
  future FreshRSS changes the `#aside_feed` structure, the control can stop
  appearing. The indent itself keeps working, since that is pure CSS.
- **The settings-page preview is an approximation.** It draws the sidebar column's
  shape at your current value; it is not a screenshot of your actual feeds. The
  live slider in the sidebar is the accurate one.
- **It writes nothing to your data.** No feeds, no categories, no articles, no
  feed attributes. The only stored value is the indent number.

## Disabling

With the extension disabled, the stylesheet and the script are never requested, so
no control is injected and the sidebar is exactly as FreshRSS renders it. The saved
indent is kept, so re-enabling brings back the value you had.

## License

GPL-3.0. See `LICENSE`.
