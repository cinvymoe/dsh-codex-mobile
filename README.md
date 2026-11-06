# dsh-codex-mobile

Mobile (≤1023px) layout fixes for the Codex UI shell of the DeepSeek Harness web GUI.

`@michengai/dsh-codex-ui` only adapts three surfaces below 768px: its settings
modal, the new-conversation cards, and the composer placeholder hint. Everything
else keeps desktop geometry, so at 390px the session header title collapses to
0 width, the composer statistics and model label truncate mid-word, message
timestamps fall outside the viewport, the right sidebar sits on a zero-width
grid column, and the sidebar pushes the main column instead of overlaying it.

This plugin supplies those missing rules. Every rule is scoped to
`@media (max-width: 1023px)` and prefixed with `html.dsh-codex-mobile`, so it
never affects desktop layout.

## What it changes

| Surface | Problem at 390px | Fix |
| --- | --- | --- |
| Session header | Title cluster gets 65px, crumbs 0px; the corner button lands on an implicit third row | Two-row grid: full-width crumbs, then tabs, task pill, team chip and corner on one 28px status line whose cells share one centre |
| Composer statistics | Each pill is clipped ("3 轮 96 步 · 9…") | The dock wraps; pills keep their full text |
| Composer controls | The row mixes four shapes and sizes — 28px and 34px pills, 8px chips, four different gaps — and the submit button is lifted 2px by a transform | One 48px row of 32px controls at 6px radius and 6px gaps: flat add chip, flat mode and model chips, the submit button pinned to the right edge as the only filled control; the effort badge is dropped so the model name keeps its width |
| Composer text | The host raises the composer card to max(16px, content size) under a coarse pointer, so a 15px setting still paints 16px in the field and the placeholder, a size larger than the transcript above it; the skin's flex placeholder also ties the host's two-line clamp on the start screen | The card, the field and the placeholder take the configured reading size and its line height together; the field is a contenteditable div, so iOS does not zoom on focus and the 16px floor is not needed; the start-screen hint keeps its two-line clamp |
| Message footer | Timestamp renders at x=-11 / -59 | Wrapped, right-aligned footer |
| Right sidebar | Panel renders at x=-390 because the column is 0 wide | Full-screen fixed overlay |
| Settings rows | Label column squeezed to three characters per line | Label above a full-width control |
| Settings navigation | Codex UI pins the nav rail to 56px and hides every label, so eleven sections show as unlabeled squares — and four of them (skills, plugin market, side cards, Codex UI) have no icon at all, leaving blank blocks | The rail becomes a horizontally scrolling strip of labelled chips across the top; the content column recovers the full width, and iconless sections get a neutral placeholder square |
| Settings content | Card and segmented-control grids keep their desktop track widths, so archive cards, theme rows and the three-way theme switch overflow the content column. The skin also stretches every class token containing "card" to the column width, which catches the parts inside a card as well, so card titles collapse to zero width and the side-card switch loses its track | Every panel shell, card grid and segmented control is capped at the content width, the Codex UI theme rows wrap the label above a full-width control, and only the card itself takes the column width while its parts keep their own sizing |
| Session header top bar | The utilities row spends 66px on an "open in VS Code" split button, and the title row starts under the host's own drawer opener | The VS Code split button is dropped, and the drawer opener floats instead of holding a corner, so the title starts at the card's own inset |
| Header utility buttons | The utilities cell keeps a session-log menu (download and feedback only) and a bottom-panel toggle for a panel that is off, and both compete for the same row as the tab strip | The whole utilities cell is hidden below 1023px; the corner cell keeps the right-bar opener as the one remaining header control |
| Session tabs | The tab label is 26px tall with a 9px bottom padding that hangs the active underline outside the box, and the host pulls it up with a -10px vertical margin so it stands 10px taller than the controls beside it | The tab and its overflow trigger become centred 28px boxes with the underline inside and the vertical margin cleared, so every cell on the status line shares one height |
| Sidebar | The host's drawer is a translucent glass sheet, so the home hero reads through it and the workspace headings lose their background | The host drawer keeps its own off-canvas behaviour, mask and opener, and this plugin repaints it as an opaque sheet at 72 z-index so it sits above the mask it would otherwise hide behind |
| Document height | Android Edge/Chrome resolve the `html/body/#root` `height:100%` chain against the large initial containing block, so the shell outgrows the area left by the address bar: the conversation scrolls past the composer into blank space and the composer is not pinned to the bottom | Root pinned to the measured visual viewport (`--dcm-viewport-height`), document scroll and overscroll disabled; the message scroller keeps its own scroll |
| Soft keyboard | Android keeps the layout viewport at full height while the keyboard covers the lower half, so the composer reserves its seat behind the keyboard and leaves a blank band above it | The same `--dcm-viewport-height` variable follows `visualViewport` resize, so the shell shrinks to the visible area and the composer sits directly above the keyboard |
| Bottom browser toolbar | Edge and Samsung Internet keep a toolbar below the page and pan the visual viewport down by its height, so `visualViewport.height` alone ends that far above the keyboard and the shell stops short of it by the same amount — the blank band reported on Edge but not on other browsers | `--dcm-viewport-height` publishes `visualViewport.offsetTop + height` capped at `innerHeight`, which is where the visible band actually ends, so the shell reaches the keyboard with the toolbar present |
| Side gutters | The host keeps its 24px desktop side inset on every phone layout, so a 390px screen spends a tenth of its width on margins and the text column loses about 20% of its usable width | The transcript, the composer, the home hero and every full-page panel drop to a 16px side inset below 1023px |
| Queue and todo docks | The queue dock and the todo panel size themselves from the side clearance plus four dock insets, so a queued message renders narrower than the composer card below it and reads as a separate column | Both docks take the card's own 32px inset with no extra dock padding, so every block above the composer shares one left and right edge |
| Agent teams chip | The chip that opens the team card ships as a bordered pill with a 22px avatar and a 12px label, so it reads as a different kind of control than the tab beside it and lands between the tab strip and the overflow trigger by no DOM order the host allows | The chip is painted as a second tab — 28px, transparent, no border, no avatar, 13px label — placed between the tab strip and the overflow trigger by an added grid track, and it takes the tab's active colour plus underline while the team workspace is mounted |
| Right panel | The right panel opens as a fixed overlay over the whole frame, so it covers the session header and with it every control that led there: the team chip cannot show that the team workspace is on screen, and the only way back to the conversation is the panel's own close button | The panel starts below the measured header and ends at the viewport bottom, so the header keeps its row and its chip stays visible and usable |
| Mobile font sizes | The font-size row writes `ui-theme` in the shared `settings.yaml`, so a size chosen on the phone also resizes the desktop GUI | On mobile widths the plugin stores the three roles in this browser's `localStorage` and applies them as `!important` rules, leaving the shared document untouched; the stepper rows are rewritten to show the stored values and their arrow taps are intercepted before the host can write |
| Keyboard on navigation | The host refocuses the composer whenever `sessionId` changes — on the session switch, and again about two seconds later when a drawer tab reloads the list — so browsing the drawer raises the soft keyboard over the page the user asked for | Composer focus is suppressed while the drawer is open (it is unreachable behind the drawer anyway) and for 700ms after a drawer tap; tapping the composer yourself still focuses it |
| Drawer icon buttons | The sidebar header clips its search trigger and two action icons into 28x32 and 16x32 boxes, so the painted glyph and the tap area disagree and the project-settings button is 16px wide | The five drawer icon buttons paint a centred 32px box, and the search slot and actions row grow to match instead of cropping them |
| Goal pill | The dock is sized from the composer side clearance plus four dock insets, so it lands narrower than the composer card and its left edge sits inside the card's; the objective is also stacked onto a second row, which makes an 80px block out of a status line | The dock takes the composer card's own inset, the objective row is dropped (its text is already in the transcript), and the pill keeps one 36px row of label and buttons aligned to the card's edges |
| Session header rows | The title, the tab strip, the utilities and the corner share one row of auto-width tracks, so the tabs leave a card-width gap and the mode label, the task pill and the team chip wrap onto a fourth ragged line. The card is also a 26% glass sheet, so the transcript scrolling under it reads through the chips, and the task ring renders at 32px, taller than the text it runs beside | The title keeps its own row and the tabs, task pill, team chip and corner share a 28px status line with the pill in the flexible column. The mode label is dropped as a duplicate of the composer's permission chip, the ring drops to 16px, the pill's chevron is dropped, and the card paints the theme's surface colour so nothing shows through |
| Drawer opener | The host pins a 28px drawer button into the frame's top-left corner, where it holds a fixed band of every page for one small control | The seat becomes a 44px floating ball the thumb can drag anywhere; its spot is stored per device, clamped to the viewport, and a drag never counts as the tap that opens the drawer |
| Drawer foot | The drawer splits its leftover height between the workspace list and the account area, so the account menu lands halfway down with a blank block underneath, and the sidebar root asks for `height:100%` inside a padded column so it also scrolls 26px past the viewport | The workspace list takes all the leftover height, the account area stays at its own size against the bottom edge, and the root sizes itself from its parent |
| Drawer rows | The lan-access mobile stylesheet turns the "more" section into a row, so the four entries it reveals pack into an 84px column beside the trigger and each title ellipsizes to two characters; two plugins also hide the host nav glyph and paint a `::before` stand-in, which shifts those rows 24px right of the rest of the list | The revealed entries stack under the trigger like every other row, and the stand-in is dropped so all rows share one icon column and one row width |
| Command menu rows | The command list behind the composer's plus button is laid out at 34px per row, but the lan-access mobile stylesheet flattens every button inside the composer card to a 28px minimum, so each row shrinks below a fingertip and the last rows fall out of the visible viewport | Command rows keep a 32px floor inside the composer card; the list keeps its own scroll viewport |
| Right-bar controls | The right-bar panel header keeps three 28px window controls and a 20px shell picker, and they are the only ways to leave the panel on a phone | Those four controls paint a 32px box |
| Tap targets | Compact buttons are 28px tall and the icon-only variants drop to a 22px square, while the skills source row is a 17px line beside a 36x20 switch, the Superagent buttons are 28px, the home workspace and mode chips are 28px, and the archive star is a 10px glyph in a 16px button — all below a fingertip | Short buttons keep a 32px height, icon-only ones paint a 32px square, the source row and its switch reach 32px, the Superagent buttons and links reach 32px, the home chips reach 32px, and the star gets a 32px box |
| New-conversation hero | The hero centres its stack vertically in the full page height, which reads as a composition on a desktop but leaves the start screen's single headline floating in the middle of the phone, with 278px of nothing between it and the workspace row | With no workspace chosen the stack sits at the top under a viewport-scaled margin; once the suggestions render the stack is a real block again and the host's centring stands |
| Hero workspace row | The branch picker is a column of two 28px rows pinned to the right edge, so the branch sits above the row's centre line and the worktree toggle below it while the workspace and mode chips centre themselves, and the squeezed mode chip ellipsizes 「标准模式」 at 56px | The picker lays out as a row, every control takes one 32px box on one baseline, the chips stop shrinking so their labels stay whole, and the branch pair wraps to its own right-aligned line below 390px instead of losing a label |
| Drawer tooltip | The host paints its tooltip in a portal above the drawer, so a focused or hovered collapse button parks a bubble over the first row of the list; the tooltip also follows the focus, so the label that appears while the drawer opens stays on screen after it closes and floats over the page the user went to | No portal tooltip is painted while the drawer is open, and collapsing it releases the focus from the floating opener, which is the only reason the tooltip had to stay |

## Coexistence with `dsh-mobile-hanui`

The Host ships its own drawer, mask and drawer opener, so this plugin draws no
chrome of its own: it repaints the Host drawer and owns the focus and dismissal
rules. `dsh-mobile-hanui` predates that and still supplies its own drawer and
FAB for the stock shell. It marks `<html>` with `dsh-mobile-shell`, so the
frame-geometry rules and the dismissal and focus effects are scoped to
`:not(.dsh-mobile-shell)` and stay out of its way; the Codex-specific rules above
apply either way.

## Drawer dismissal

In standalone mode the drawer closes on navigation: a session row (recent chats
or a workspace folder), a new chat, one of the Codex navigation rows
(`dcu-sb-row`), or a menu item chosen from a drawer popup (settings, sign-in,
feedback). Tabs and segmented switches stay open — the workspace/recent-chats
tabs and the task/schedule switch only change which list the drawer shows.
Controls that own a popup also stay put while the popup is open — the account
menu, the "more" disclosure, search, the workspace settings gear, and the view
options — because collapsing the drawer unmounts the popup owner. A tap on the
Host mask and Escape also close it.

## Install

```sh
# from a Harness profile session, installing the published bundle
plugin_manager install_bundle(target="github:cinvymoe/dsh-codex-mobile")

# or from a local checkout
plugin_manager install_bundle(target="/path/to/dsh-codex-mobile")
```

Or add the bundle manually to the profile's `dsh.profile.bundles` list.

## Layout

- `src/index.js` — Host half; no Host-side behavior, so `apply()` is empty.
- `src/client.js` — Client half; registers the stylesheet, publishes the
  measured visual viewport height as `--dcm-viewport-height` and the measured
  header bottom as `--dcm-header-bottom`, and keeps the drawer dismissal,
  composer-focus and floating-ball rules on the `shell.overlay` slot.
- `cordis.patch.yml` — Bundle patch that inserts `codex-mobile` into the profile.
