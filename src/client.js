/**
 * Mobile layout fixes for @michengai/dsh-codex-ui on the DeepSeek Harness web GUI.
 *
 * The Codex UI shell only adapts three surfaces below 768px (its settings modal,
 * the new-conversation cards, and the composer placeholder hint). Everything
 * else keeps the desktop geometry, which at 390px collapses the session header
 * title to 0 width, truncates the composer statistics and model label, pushes
 * message timestamps off-screen, and leaves the right sidebar on a zero-width
 * grid column. This client half supplies those missing rules plus, when no other
 * mobile shell plugin owns the frame, the overlay geometry of the Host drawer.
 */
window.__ModuleLoader__.load({
  id: 'dsh-codex-mobile',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { jsx } = require('react/jsx-runtime')

    const MOBILE_MQ = '(max-width: 1023px)'
    const STYLE_ID = 'dsh-codex-mobile-css-v1'
    const HTML_CLASS = 'dsh-codex-mobile'
    const OTHER_SHELL_CLASS = 'dsh-mobile-shell'
    const INPUT_SELECTOR = '[data-composer-input]'
    const FOCUS_GUARD_MS = 700
    const VIEWPORT_VAR = '--dcm-viewport-height'
    const HEADER_BOTTOM_VAR = '--dcm-header-bottom'
    const FONT_STORE_KEY = 'dsh-codex-mobile:font-sizes-v1'
    const FONT_STYLE_ID = 'dsh-codex-mobile-font-v1'
    const FONT_VARIABLES = {
      text: '--dsh-content-font-size',
      code: '--dsh-code-font-size',
      terminal: '--dsh-terminal-font-size',
    }
    const FONT_ROLES = ['text', 'code', 'terminal']
    // Accepted px ranges, mirroring the theme service's own specs. A stored
    // value outside them is dropped rather than clamped, so a stale or hand-edited
    // entry cannot shrink the conversation below the readable minimum.
    const FONT_RANGES = { text: [10, 22], code: [10, 16], terminal: [10, 20] }
    const ORB_STORE_KEY = 'dsh-codex-mobile:orb-pos-v1'
    const ORB_SIZE = 44
    const ORB_MARGIN = 8
    // A drag has to travel this far before it stops counting as a tap, so a
    // shaky finger still opens the drawer instead of nudging the ball.
    const ORB_DRAG_SLOP = 6

    const CSS = `
@media ${MOBILE_MQ} {
  /* ---- viewport: the document must not outgrow the visible viewport ---- */
  /* Android Edge/Chrome resolve the html/body/#root 100% chain against the
     large initial containing block, so the shell stays taller than the area
     the URL bar leaves visible. The session then scrolls past the composer
     into blank space, and the composer never sits on the bottom edge. Pin the
     root to the dynamic viewport and stop document scrolling; the frame
     already scrolls its own message body. */
  /* --dcm-viewport-height is the visual viewport measured at runtime, so the
     shell follows the area the soft keyboard leaves visible instead of the
     layout viewport Android keeps at full height behind the keyboard. */
  html.${HTML_CLASS},
  html.${HTML_CLASS} body,
  html.${HTML_CLASS} #root {
    height: var(${VIEWPORT_VAR}, 100dvh) !important;
    max-height: var(${VIEWPORT_VAR}, 100dvh) !important;
  }
  html.${HTML_CLASS},
  html.${HTML_CLASS} body {
    overflow: hidden !important;
    overscroll-behavior: none !important;
  }

  /* ---- session header: two rows so the title stops collapsing to 0 ---- */
  /* The host stacks the title, the tab strip, the utilities and the corner into
     one row of auto-width tracks, so the tabs leave a gap the width of the
     card, the corner sits alone, and the mode label plus the task pill and the
     team chip wrap onto a fourth line with their own ragged gaps. Give the
     title its own row and put the tabs, the task pill, the team chip and the
     corner on one status line: the pill takes the flexible column so its text
     keeps the width the other three do not need. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] {
    display: grid !important;
    grid-template-columns: auto auto minmax(0, 1fr) auto !important;
    grid-template-areas:
      "crumbs crumbs crumbs crumbs"
      "tabs more pill corner" !important;
    align-items: center !important;
    column-gap: 8px !important;
    row-gap: 6px !important;
    height: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 12px !important;
    padding-right: 10px !important;
    /* The card is a 26% glass sheet, so the transcript scrolling underneath
       reads through it and lands between the title and the chips. A phone
       header is a status bar, not a lens: paint it in the layer colour the
       theme already defines for surfaces, which follows the theme in both
       light and dark. */
    background: var(--dsw-alias-bg-layer-1, #fff) !important;
  }
  /* The team chip belongs between the tab strip and the overflow trigger, but
     the host keeps it inside the title cluster while the trigger lives in the
     tab strip, so no DOM order can put them side by side. Widen the status line
     by one track when the chip exists and let the named cells place it. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"]:has([data-team-chat-entry]) {
    grid-template-columns: auto auto auto minmax(0, 1fr) auto !important;
    grid-template-areas:
      "crumbs crumbs crumbs crumbs crumbs"
      "tabs team more pill corner" !important;
  }
  /* The title row and cluster are nested inside an unnamed contents wrapper,
     so they must be flattened by descendant selector rather than by child. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="wSkVaW_titleRow"],
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="wSkVaW_titleCluster"] {
    display: contents !important;
  }
  /* The drawer opener floats over the transcript instead of holding a corner
     of the header, so the title row no longer has to clear it and starts at
     the card's own inset. */
  html.${HTML_CLASS} nav[class*="wSkVaW_crumbs"] {
    grid-area: crumbs !important;
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 0 !important;
    box-sizing: border-box !important;
  }
  /* The tab strip holds two things that must not share a cell: the view tabs
     and the overflow trigger. Flatten the strip so each child takes its own
     named area, and keep the tabs at their own width. */
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] {
    display: contents !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_viewTabs"] {
    grid-area: tabs !important;
    justify-self: start !important;
    min-width: 0 !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_viewsMoreAnchor"] {
    grid-area: more !important;
    justify-self: start !important;
  }
  /* The actions row is a flex box holding the mode label, the task pill and the
     team chip. Flatten it so each child lands in its own named cell instead of
     stacking inside one track. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="wSkVaW_headerActions"] {
    display: contents !important;
  }
  /* The mode label is the permission preset name, and it repeats what the
     composer's own permission chip already shows one row below the transcript.
     On a two-row header it would cost a whole line of title width, so drop it. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="SVAs4q_label"] {
    display: none !important;
  }
  /* The task pill ships as an inline-flex inside an anonymous block, so the
     wrapper takes the flexible cell and holds the pill against its leading edge,
     directly after the tabs. The pill keeps its own width but may shrink: at
     320px the count is what gives way, not the row. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] div:has(> [class*="QsffPG_trigger"]) {
    grid-area: pill !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    min-width: 0 !important;
    height: 28px !important;
  }
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_trigger"] {
    width: auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 28px !important;
    min-height: 28px !important;
    overflow: hidden !important;
  }
  /* The status dot renders at 32px, which is as tall as the row and reads as a
     badge rather than a progress ring. A 16px ring sits inside the 18px label
     line it runs beside, and it keeps a 16px height so the SVG cannot be
     stretched by the row's own minimum. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_triggerDot"] {
    width: 16px !important;
    height: 16px !important;
    min-height: 16px !important;
    max-height: 16px !important;
    flex: none !important;
    align-self: center !important;
  }
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_count"] {
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  /* The chevron opens the task menu, which is a desktop affordance; on this row
     its 12px plus gaps cost more than the count it squeezes. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_trigger"] > svg:last-child {
    display: none !important;
  }
  /* Under 380px the four cells on the status line cannot all keep their
     content, and the count is the part that says how much is running. Give
     the ring up first, then the count's side margins, so the sentence stays
     whole down to 360px. */
  @media (max-width: 380px) {
    html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_triggerDot"] {
      display: none !important;
    }
    html.${HTML_CLASS} header[class*="wSkVaW_header"] [class*="QsffPG_count"] {
      margin: 0 !important;
    }
  }
  /* The team chip opens the team card for this session. It shipped as a
     bordered pill with a 22px avatar and an 11px label, which read as a
     different kind of control than the tab it sits beside and made the status
     line look like two separate rows. Paint it as a second tab: same height,
     same type, same transparent background, no border and no avatar, with the
     label in the inactive tab colour because it is an entry point rather than
     the selected view. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [data-team-chat-entry] {
    grid-area: team !important;
    justify-self: start !important;
    align-self: center !important;
    box-sizing: border-box !important;
    height: 28px !important;
    min-height: 28px !important;
    max-height: 28px !important;
    padding: 0 8px !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--dsw-alias-label-tertiary) !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    line-height: 16px !important;
    display: inline-flex !important;
    align-items: center !important;
    white-space: nowrap !important;
    position: relative !important;
  }
  /* The chip is an entry point, so it has no selected state of its own: the
     host only swaps the right panel over to the team workspace. Read that
     workspace instead, and paint the chip the way the tab beside it paints
     itself when its view is the one on screen. */
  html.${HTML_CLASS}:has([data-agent-teams-workspace]) header[class*="wSkVaW_header"] [data-team-chat-entry] {
    color: var(--dsw-alias-state-business-primary) !important;
  }
  html.${HTML_CLASS}:has([data-agent-teams-workspace]) header[class*="wSkVaW_header"] [data-team-chat-entry]::after {
    content: "" !important;
    position: absolute !important;
    left: 8px !important;
    right: 8px !important;
    bottom: 0 !important;
    height: 2px !important;
    border-radius: 2px !important;
    background: var(--dsw-alias-state-business-primary) !important;
  }
  /* The avatar is what gave the chip its pill look; the label alone is what
     the tab beside it carries. */
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [data-team-chat-entry] img {
    display: none !important;
  }
  html.${HTML_CLASS} header[class*="wSkVaW_header"] [data-team-chat-entry] > span {
    font-size: 13px !important;
  }
  /* The host hangs this tab off a negative vertical margin and 9px of bottom
     padding, which makes its box 10px taller than the controls beside it and
     leaves the underline outside the row. Clear the vertical margin, keep the
     horizontal one so the label still sits where the host put it, and size the
     box to the status line so every cell on that row shares one height. */
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_tab"] {
    display: inline-flex !important;
    align-items: center !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    height: 28px !important;
    min-height: 28px !important;
    max-height: 28px !important;
    padding: 0 8px !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_tab"]:after {
    bottom: 0 !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_tabLabel"] {
    line-height: 20px !important;
  }
  /* The overflow trigger beside the tabs is 22px; give it the same box as the
     tab so the two sit on one line at one height. */
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_viewsMoreAnchor"] {
    display: inline-flex !important;
    align-items: center !important;
    height: 28px !important;
  }
  /* The host offsets this button by -3px, which leaves it 1.5px above the
     centre line the rest of the row shares. */
  html.${HTML_CLASS} div[class*="wSkVaW_tabs"] [class*="wSkVaW_viewsMoreAnchor"] button {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  /* ---- drawer opener: a floating ball the thumb can park anywhere ---- */
  /* The host pins this button into the frame's top-left corner, where it holds
     a fixed band of every page for one 28px control. Float it instead: the
     position comes from two custom properties the drag handler writes, so the
     ball can sit wherever the thumb left it and the pages keep their full width.
     The z-index stays under the host's drawer mask so the ball hides while the
     drawer is open, and touch-action keeps a drag from scrolling the transcript. */
  html.${HTML_CLASS} [class*="pI_x6G_leadingSeat"] {
    position: fixed !important;
    top: var(--dcm-orb-y, 60%) !important;
    left: var(--dcm-orb-x, calc(100vw - 52px)) !important;
    right: auto !important;
    bottom: auto !important;
    width: 44px !important;
    height: 44px !important;
    margin: 0 !important;
    display: block !important;
    z-index: 60 !important;
  }
  html.${HTML_CLASS} [class*="pI_x6G_leadingSeat"] > *,
  html.${HTML_CLASS} [class*="pI_x6G_leadingSeat"] [class*="IW6AQa_controls"] {
    width: 44px !important;
    height: 44px !important;
    gap: 0 !important;
  }
  html.${HTML_CLASS} [data-sidebar-opener] {
    width: 44px !important;
    min-width: 44px !important;
    height: 44px !important;
    min-height: 44px !important;
    padding: 0 !important;
    border-radius: 999px !important;
    /* The theme sets a superellipse corner shape globally, which turns a pill
       radius into a squircle instead of a circle. */
    corner-shape: round !important;
    border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12)) !important;
    background: var(--dsw-alias-bg-layer-1, #fff) !important;
    color: var(--dsw-alias-label-primary, #111) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: grab !important;
    touch-action: none !important;
    -webkit-user-select: none !important;
    user-select: none !important;
  }
  html.${HTML_CLASS} [data-sidebar-opener] svg {
    width: 18px !important;
    height: 18px !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_headerUtilities"] {
    grid-area: utilities !important;
    justify-self: end !important;
    margin-left: 0 !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_headerCorner"] {
    grid-area: corner !important;
    justify-self: end !important;
    margin: 0 !important;
  }
  /* The utilities row holds two icon buttons and the corner holds one; match
     them to the status line so the whole row reads as one band. */
  html.${HTML_CLASS} div[class*="wSkVaW_headerUtilities"] button,
  html.${HTML_CLASS} div[class*="wSkVaW_headerCorner"] button {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_headerActions"] {
    grid-area: actions !important;
    justify-self: start !important;
    min-width: 0 !important;
    max-width: 100% !important;
    flex-wrap: wrap !important;
    margin: 0 !important;
    overflow: visible !important;
  }
  html.${HTML_CLASS} div[class*="wSkVaW_headerLeading"] { display: none !important; }
  /* The utilities row spends 66px on an "open in VS Code" split button. An
     editor handoff cannot complete from a phone, and the row has three other
     controls competing for the same 390px. */
  html.${HTML_CLASS} div[class*="wSkVaW_headerUtilities"] [class*="OMoRSG_menuAnchor"] {
    display: none !important;
  }
  /* What is left in the utilities cell is the session-log menu and the
     bottom-panel toggle. The menu only offers a log download and a feedback
     form, and the bottom panel is off, so both are dead ends here. The corner
     cell keeps the right-bar opener, which is the one control in that row that
     still opens a surface. */
  html.${HTML_CLASS} div[class*="wSkVaW_headerUtilities"] {
    display: none !important;
  }

  /* ---- composer statistics: wrap instead of clipping each pill ---- */
  html.${HTML_CLASS} [class*="uV2eYG_dock"] {
    flex-wrap: wrap !important;
    gap: 4px 8px !important;
    justify-content: center !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_dock"] [class*="bOPqQW_pill"] { font-size: 12px !important; }
  html.${HTML_CLASS} [class*="uV2eYG_dock"] [class*="JObwrW_root"] { flex: none !important; }
  /* The tool row prints its diff counts at secondary-minus-2px and the running
     indicator at content-minus-2px, which land on 10px and 11px at the default
     content scale. */
  html.${HTML_CLASS} [class*="o3BgMG_diffStat"] { font-size: 12px !important; }
  html.${HTML_CLASS} [class*="EvIC1a_running"] { font-size: 12px !important; }

  /* ---- goal pill: one row, as wide as the composer card ---- */
  /* The host sizes this pill from the composer side clearance plus four dock
     insets, so it lands narrower than the composer card and its left edge sits
     inside the card's. It also stacks the objective onto a second row, which
     makes an 80px block out of what is really a status line. The objective text
     is already in the transcript above, so keep the pill to its label and its
     three buttons, and take the card's own inset instead of the host's wider
     one. */
  html.${HTML_CLASS} [class*="nLMEza_dock"] {
    width: calc(100% - 32px) !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} [class*="nLMEza_bar"] {
    height: auto !important;
    min-height: 36px !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    row-gap: 0 !important;
    column-gap: 6px !important;
    padding: 2px 6px 2px 10px !important;
  }
  html.${HTML_CLASS} [class*="nLMEza_objective"],
  html.${HTML_CLASS} [class*="nLMEza_error"] {
    display: none !important;
  }
  html.${HTML_CLASS} [class*="nLMEza_actions"] { gap: 4px !important; margin-left: auto !important; }
  /* The three goal buttons are 28px, below the fingertip minimum, and the pill
     has room: the objective still gets its full two lines at 32px. */
  html.${HTML_CLASS} [class*="nLMEza_iconBtn"] {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
  }
  /* ---- composer text: follow the configured reading size ---- */
  /* The host raises the composer card to max(16px, content size) under a coarse
     pointer, so a 15px setting still paints 16px text and the placeholder reads
     a size larger than the transcript it introduces. The field is a
     contenteditable div, not an input, so iOS does not zoom on focus and the
     floor is not needed here. Take the configured size for the card, the field
     and the placeholder together so all three stay on one line height. */
  html.${HTML_CLASS} [class*="uV2eYG_card"],
  html.${HTML_CLASS} [class*="uV2eYG_input"],
  html.${HTML_CLASS} [class*="uV2eYG_placeholder"] {
    font-size: var(--dsh-content-font-size, 14px) !important;
    line-height: calc(24px + var(--dsh-content-font-delta, 0px)) !important;
  }
  /* The codex-ui skin turns the placeholder into a flex row so it can park its
     own history hint on the right, and that rule ties the host's own
     display:-webkit-box on the hero placeholder, so the start screen loses its
     two-line clamp and cuts the hint after one line on a narrow phone. Restore
     the clamp for the start screen only; the session placeholder stays a
     single line by design. */
  html.${HTML_CLASS} [class*="uV2eYG_hero"] [data-composer-placeholder] {
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important;
    line-clamp: 2 !important;
    white-space: normal !important;
  }
  /* ---- composer controls: one row of equal 32px controls ---- */
  /* The row reads as unrelated pieces because the host mixes shapes and sizes:
     the add and submit buttons are pills at different diameters (28 and 34),
     the model and mode triggers are 8px rectangles, and the four containers
     use four different gaps. Normalize the geometry to one scale taken from
     the opencode web composer: a 48px row with 8px side padding, 32px
     controls, 6px radius, and one 6px gap everywhere. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] {
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 6px !important;
    height: 48px !important;
    padding: 0 8px !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_tools"],
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_trailing"] {
    align-items: center !important;
    gap: 6px !important;
  }
  /* Pin the tool cluster to its content so the mode chip never spills over the
     model chip. The model chip is the one control that absorbs the slack, so
     the gap before the submit button stays 6px instead of swallowing it. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_tools"],
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_modes"] {
    flex: 0 0 auto !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_trailing"] {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    flex-wrap: nowrap !important;
    justify-content: flex-start !important;
  }
  /* The model chip hugs its label. The host stretches it across the free width,
     which strands its chevron beside the submit button and leaves two different
     gaps in one row. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_standardControls"],
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_root"] {
    flex: 0 1 auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  /* An empty activity slot still separates the model chip from the submit
     button by two gaps instead of one, so the row's spacing stops matching. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_activity"]:has(> :only-child:empty) {
    display: none !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_primary"] { margin-left: auto !important; }
  /* Both icon buttons become the same 32px square with an 18px glyph. The host
     lifts the submit button 2px with a transform, which breaks the row's
     optical alignment, so the transform goes too. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_add"],
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_primary"] {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    padding: 0 !important;
    border-radius: 6px !important;
    display: grid !important;
    place-items: center !important;
    box-sizing: border-box !important;
    transform: none !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_add"] svg,
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_primary"] svg {
    width: 18px !important;
    height: 18px !important;
  }
  /* The add button ships as a filled pill with a hairline border while the
     submit button is a filled square, so the row reads as unrelated weights.
     Flatten the add button to the same treatment as the two text triggers. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_add"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: var(--dsw-alias-label-secondary, inherit) !important;
  }
  /* Both text triggers share the control height, radius and inset. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"],
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"] {
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 6px !important;
    border-radius: 6px !important;
    gap: 4px !important;
    box-sizing: border-box !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"] { gap: 2px !important; }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"] {
    width: auto !important;
    max-width: 100% !important;
  }
  /* The glyphs ride about 6px above the row's center line: the mode icon span
     and the model label are plain blocks whose content starts at the box top,
     while the plus and submit glyphs are centered. Center every glyph. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_triggerIcon"] {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 100% !important;
    padding: 0 !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_triggerLabel"] {
    white-space: nowrap !important;
    display: block !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    line-height: 28px !important;
    font-size: 13px !important;
    text-align: left !important;
  }
  /* The host swaps the model name for a bare data-store glyph as soon as the
     row measures wider than its box, which on a phone happens as soon as the
     provider suffix does not fit. The glyph carries no name a reader can act
     on, so keep the label and let it ellipsize instead. */
  html.${HTML_CLASS} [class*="uV2eYG_row"][data-model-compact] {
    --dsh-composer-model-icon-display: none !important;
    --dsh-composer-model-text-display: block !important;
  }
  /* Touch browsers keep :hover after a tap, so a tapped trigger stays painted
     as if the pointer were still over it. Keep the hover fill for pointer
     devices only. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"]:hover,
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"]:hover {
    background: transparent !important;
  }
  @media (hover: hover) {
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"]:hover:not(:disabled),
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"]:hover:not(:disabled) {
      background: var(--dsw-alias-interactive-bg-hover) !important;
    }
  }
  /* A tap still needs an acknowledgement, so the flat controls paint on press
     instead of on a hover state that never clears. */
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_add"]:active,
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"]:active,
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"]:active {
    background: var(--dsw-alias-interactive-bg-hover-solid, var(--dsw-alias-interactive-bg-hover)) !important;
  }
  html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="uV2eYG_primary"]:active {
    filter: brightness(0.92) !important;
  }
  /* Below 480px the row is too narrow for the chevrons and a readable model
     name. Both triggers already read as tappable from their icon and their
     press feedback, so both chevrons go and the width they held goes to the
     model name. The effort badge has no room of its own either: the host gives
     it flex-shrink 1000, so it collapses to one stray letter wedged between
     the name and the chevron. */
  @media (max-width: 480px) {
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_chevron"],
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_chevron"] { display: none !important; }
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="iWlSmW_trigger"] { padding-right: 2px !important; }
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_trigger"] { padding: 0 2px !important; }
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_triggerLabel"] { font-size: 12px !important; }
    html.${HTML_CLASS} [class*="uV2eYG_row"] [class*="_7KE1Ra_triggerEffort"] { display: none !important; }
  }

  /* ---- user message footer: wrap so the timestamp stays on screen ---- */
  html.${HTML_CLASS} [class*="userRow"] > [class*="actions"] {
    flex-wrap: wrap !important;
    justify-content: flex-end !important;
    align-items: center !important;
    height: auto !important;
    max-width: 100% !important;
    row-gap: 6px !important;
    overflow: visible !important;
  }

  /* ---- right sidebar: full-screen overlay instead of a 0-width column ---- */
  /* The panel covers the whole frame, including the session header, so every
     control that opened it disappears behind it: the team chip cannot show that
     the team workspace is the one on screen, and there is no way back to the
     conversation except the panel's own close button. Start the panel below
     the header and let the header keep its row, so the chip stays visible and
     stays a way in and out. The offset comes from the measured header, because
     the header grows a track when a team chip exists. */
  html.${HTML_CLASS} [class*="P3OORG_panel"][data-sidebar-right-open] {
    position: fixed !important;
    left: 0 !important;
    top: var(${HEADER_BOTTOM_VAR}, 0px) !important;
    right: 0 !important;
    bottom: auto !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: calc(var(${VIEWPORT_VAR}, 100dvh) - var(${HEADER_BOTTOM_VAR}, 0px)) !important;
    z-index: 70 !important;
    pointer-events: auto !important;
  }

  /* ---- settings rows: label above control instead of a squeezed column ---- */
  /* Every settings section package owns its own hashed prefix, but they all
     share the _rowText / _selector suffixes, so match on those. */
  html.${HTML_CLASS} [class*="VOzbGW_options"] div:has(> [class*="_rowText"]) {
    flex-wrap: wrap !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }
  html.${HTML_CLASS} [class*="VOzbGW_options"] [class*="_rowText"] {
    flex: 1 1 100% !important;
    padding-right: 0 !important;
  }
  html.${HTML_CLASS} [class*="VOzbGW_options"] span:has(> [class*="_selector"]) {
    width: 100% !important;
    display: flex !important;
  }
  html.${HTML_CLASS} [class*="VOzbGW_options"] [class*="_selector"] {
    flex: 1 1 auto !important;
    justify-content: space-between !important;
  }

  /* ---- settings navigation: a scrollable tab strip instead of a 56px icon rail ---- */
  /* At 390px the skin shrinks the rail to 56px and hides every label, and four
     categories (skills, marketplace, side cards, Codex UI) ship no icon at all,
     so the rail is a column of blank squares. A vertical rail wide enough for
     Chinese labels would eat 128px of a 390px screen and push the section
     content into overflow, so the navigation turns into one horizontal strip
     above the content and the labels come back. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] {
    --dcu-settings-nav-width: 100% !important;
    /* The skin pins this panel to a grid with a 56px first track, so a column
       flex container has to replace the grid rather than restyle its direction. */
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: none !important;
    grid-template-rows: none !important;
    grid-template-areas: none !important;
    gap: 0 !important;
    padding: 0 !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > nav {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    height: auto !important;
    flex: none !important;
    flex-direction: column !important;
    gap: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    border-right: none !important;
    border-bottom: 1px solid var(--dsw-alias-border-secondary, rgba(127, 127, 127, 0.2)) !important;
  }
  /* The rail's own "设置" heading only restated the dialog title in a 56px column. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > nav > [class*="navTitle"] {
    display: none !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] nav [class*="navList"] {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 6px !important;
    padding: 8px 12px !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    scrollbar-width: none !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] nav [class*="navList"]::-webkit-scrollbar {
    display: none !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] nav [class*="navCell"] {
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    flex: none !important;
    margin: 0 !important;
    padding: 0 10px !important;
    gap: 6px !important;
    border-radius: 8px !important;
    box-sizing: border-box !important;
    justify-content: flex-start !important;
    white-space: nowrap !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] nav [class*="navCell"] [class*="navLabel"] {
    display: block !important;
    flex: none !important;
    min-width: 0 !important;
    max-width: none !important;
    font-size: 13px !important;
    line-height: 20px !important;
    text-align: left !important;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }
  /* Four categories have no icon in the rail; an empty marker keeps their
     labels aligned with the ones that do. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] nav [class*="navCell"]:not(:has(svg))::before {
    content: "" !important;
    flex: none !important;
    width: 18px !important;
    height: 18px !important;
    border-radius: 5px !important;
    background: currentColor !important;
    opacity: 0.22 !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] {
    flex: 1 1 auto !important;
    width: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    overflow: auto !important;
  }
  /* Section packages size their cards by content and rely on a desktop-width
     column, so a card wider than the phone column paints past the dialog edge
     and its text is cut. Constrain the card containers to the column. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-shell"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-grid"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-card"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-example-row"],
  /* [class*="..."] would also match the card's own parts (cardIconChip,
     cardTitle, cardSwitch, cardMain), and stretching those collapses the
     title to zero width, so match the whole class token instead. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_grid"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_card"] {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  /* The skin also stretches every class token containing "card" to the full
     column width, so the parts inside a card inherit that width too and any
     sibling that should share the row is squeezed to zero. Only the card
     itself needs the column width; its parts keep their own sizing. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="card"] [class*="card"] {
    width: auto !important;
    max-width: 100% !important;
  }
  /* The skin stretches every class token containing "card" to the full
     column width, which also catches the card's own parts: the icon chip
     became a 280px bar, the switch track lost its 30px, and the title had no
     room left. Put the intrinsic sizes back on the parts. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardTop"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardMain"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardTitle"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardSwitch"] {
    width: auto !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardIconChip"] {
    width: 28px !important;
    height: 28px !important;
    flex: none !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardSwitchTrack"] {
    width: 30px !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class~="_2vuxea_cardSwitchThumb"] {
    width: 10px !important;
    height: 10px !important;
  }
  /* The theme picker puts a label and a segmented control on one row; at 390px
     the control is wider than what the label leaves, so its trailing tabs were
     painted outside the dialog. Stack them and let the control share the row. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-sub-row"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-row"] {
    flex-wrap: wrap !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-row-label"] {
    flex: 1 1 100% !important;
    min-width: 0 !important;
  }
  /* The segmented control is a direct child of the theme row, and the skin
     rehashes its class on every release, so select it by position rather than
     by its generated name. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-sub-row"] > [class*="control_"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-row"] > [class*="control_"] {
    flex: 1 1 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    grid-auto-columns: minmax(0, 1fr) !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="control_"] > [class*="tab"] {
    min-width: 0 !important;
    padding: 0 6px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-theme-sub-group"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-section-card"] {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  /* The skin's about list keeps a dependency name and its download count on
     one row beside an action cluster. At 320px the cluster takes 140px of a
     234px row, so the project name inside the copy column is squeezed to zero
     width and every dependency reads as blank. Give the actions their own row
     and the names keep the column. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-about-dependency"] {
    flex-wrap: wrap !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dcu-about-actions"] {
    flex: 1 1 100% !important;
    justify-content: flex-start !important;
  }
  /* The archive list spends a 66px action cluster beside each session title,
     which leaves the title 240px of a 346px row and pushes two thirds of them
     into an ellipsis. Let the title take up to three lines instead: at 390px
     almost every name fits in two, and the narrowest widths still show the
     whole title rather than a prefix. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsham_settingsTitleLink"] {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 3 !important;
    line-height: 17px !important;
    max-height: 51px !important;
    overflow-wrap: anywhere !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsham_settingsRow"] {
    align-items: start !important;
  }
  /* Two more sections keep a single row at any width: the schedule toolbar
     packs a filter select and a sort select side by side, and the marketplace
     tiles are pinned to a 220px minimum. Below 390px both paint past the edge. */
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-tabs"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-toolbar"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-filters"],
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="recentRow"] {
    flex-wrap: wrap !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-filters"] {
    width: 100% !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-sort-wrap"] {
    flex: 1 1 100% !important;
    min-width: 0 !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-menu-select-wrap"] {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="dsh-st-menu-select-label"] {
    min-width: 0 !important;
  }
  html.${HTML_CLASS} body > [role="presentation"]:has(> [data-shortcut-modal="settings"]) > [data-shortcut-modal="settings"] > [class*="options"] [class*="recentTile"] {
    flex: 1 1 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* ---- readability: raise 10px captions and widen 20-28px hit areas ---- */
  /* The host sets its status tags at 10px and its icon buttons at 20-28px.
     Both read fine on a desktop where the pointer is a pixel, but at arm's
     length on a phone the tag is unreadable and the buttons are narrower than
     a fingertip. Raise the caption and grow the buttons' hit area to 44px
     without moving anything on screen. */
  html.${HTML_CLASS} [class*="statusTag"] {
    font-size: 12px !important;
    height: 22px !important;
    padding: 0 8px !important;
    line-height: 22px !important;
  }
  /* The archive list drops its timestamp to 10px inside a 400px container query,
     which a phone always matches. */
  html.${HTML_CLASS} [class*="settingsMeta"] {
    font-size: 11px !important;
    line-height: 15px !important;
  }
  html.${HTML_CLASS} [class*="X_2TxG_iconButton"],
  html.${HTML_CLASS} [class*="_searchButton"] {
    width: 32px !important;
    height: 32px !important;
  }
  /* A pseudo-element extends the pointer target past the painted box, so the
     compact controls keep their visual size and the tap still lands. It only
     goes on controls whose row leaves 6px or more around them; the 20px ghost
     button that sits 4px from the primary button in a page intro would
     otherwise cover its neighbour and steal the tap. */
  html.${HTML_CLASS} [class*="X_2TxG_iconButton"],
  html.${HTML_CLASS} [class*="_switch_"] {
    position: relative !important;
  }
  html.${HTML_CLASS} [class*="X_2TxG_iconButton"]::after,
  html.${HTML_CLASS} [class*="_switch_"]::after {
    content: "" !important;
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
    width: 44px !important;
    height: 44px !important;
    transform: translate(-50%, -50%) !important;
  }

  /* The command menu behind the composer's plus button lists 17 entries at 34px
     each, but the lan-access mobile stylesheet flattens every button inside the
     composer card to a 28px minimum, so each row shrinks below a fingertip. Put
     the row height back; the list scrolls inside its own viewport either way. */
  html.${HTML_CLASS} [data-composer-card] [class*="_3e4SsG_item"] {
    min-height: 32px !important;
  }
  /* The right-bar panel keeps three 28px window controls and a 20px shell
     picker in its header, and those are the only ways to leave the panel on a
     phone. Give each one a 32px box. */
  html.${HTML_CLASS} [class*="P3OORG_iconButton"],
  html.${HTML_CLASS} [class*="_iconButton_3oazc_"],
  html.${HTML_CLASS} button[aria-label="选择 Shell"] {
    width: 32px !important;
    min-width: 32px !important;
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  /* ---- tap targets: a 28px row of icon buttons is a 22px box ---- */
  /* The compact button size is 28px tall and the icon-only variants drop to a
     22px square, which is a third of a fingertip. Give the short buttons their
     height back and let the icon-only ones paint a 32px square, so a tap lands
     inside the button it looks like. The text buttons only grow in height; their
     width already follows the label. */
  html.${HTML_CLASS} button[class*="_sm_"] {
    min-height: 32px !important;
  }
  /* Only the width floor goes on every compact button. Pinning the width would
     also catch a labelled button that happens to hold one icon element, because
     its text is not a child element, and squeeze its label onto two lines. */
  html.${HTML_CLASS} button[class*="_sm_"],
  html.${HTML_CLASS} button[class*="_sm_"][class*="-icon-action"],
  html.${HTML_CLASS} button[class*="_sm_"][class*="-row-icon"] {
    min-width: 32px !important;
    height: 32px !important;
  }
  html.${HTML_CLASS} [class*="_pill_rs966_1"][class*="_tab"] {
    min-height: 32px !important;
  }
  /* The skills page stacks a source row as one clickable line 17px tall and
     puts the on/off switch beside it at 36x20. Both are below a fingertip. */
  html.${HTML_CLASS} [class*="dssm-source-toggle"] {
    min-height: 32px !important;
  }
  /* The home workspace and mode chips are 28px tall, and they are the first
     controls a thumb reaches on the landing view. */
  html.${HTML_CLASS} [class*="pXSMma_workspace"],
  html.${HTML_CLASS} [class*="cubgiG_seat"] {
    height: 32px !important;
    min-height: 32px !important;
  }
  /* The background-task pill sits above the composer and is one of the
     smallest things a thumb reaches for on this screen. */
  html.${HTML_CLASS} [class*="QsffPG_trigger"] {
    min-height: 32px !important;
    height: 32px !important;
    box-sizing: border-box !important;
  }
  /* The Copilot source row carries one extra folder button, and the 8px gaps
     around it take five pixels from the count label beside it. Tighten the row
     gaps so the count stays whole on every source. */
  html.${HTML_CLASS} [class*="dssm-source-head"] {
    gap: 6px !important;
  }
  html.${HTML_CLASS} [class*="dssm-source-actions"] {
    gap: 4px !important;
  }
  /* The source switch paints a knob at a fixed offset inside a 36x20 pill, so
     stretching the pill drags the knob out of its track and the label beside it
     loses its width. Keep the painted size and extend the tap area instead. */
  html.${HTML_CLASS} [class*="dssm-enable-switch"] {
    position: relative !important;
  }
  html.${HTML_CLASS} [class*="dssm-enable-switch"]::after {
    content: "" !important;
    position: absolute !important;
    left: 50% !important;
    top: 50% !important;
    width: 44px !important;
    height: 44px !important;
    transform: translate(-50%, -50%) !important;
  }
  /* The Superagent panel's own buttons are 28px and its text links 20px. */
  html.${HTML_CLASS} [class*="dt-btn"] {
    min-height: 32px !important;
  }
  html.${HTML_CLASS} [class*="dt-textlink"] {
    min-height: 32px !important;
    display: inline-flex !important;
    align-items: center !important;
  }
  /* The archive list's star is a 10px glyph in a 16px button. */
  html.${HTML_CLASS} [class*="dsham_rowStar"] {
    width: 32px !important;
    height: 32px !important;
  }

  /* ---- drawer foot: pin the account menu to the bottom ---- */
  /* The drawer splits its leftover height between the workspace list and the
     account area, and each of them is a flex child with flex:1, so the account
     menu lands halfway down with a blank block underneath it. The list is the
     part that scrolls, so let it take all the leftover height and keep the
     account area at its own size against the bottom edge. */
  html.${HTML_CLASS} [class*="hHd-Xa_footArea"] {
    flex: 0 0 auto !important;
    margin-top: auto !important;
  }
  html.${HTML_CLASS} [class*="hHd-Xa_settingsArea"] {
    flex: 0 0 auto !important;
    overflow: visible !important;
  }
  /* The root asks for height:100% inside a column that already pads 24px top
     and bottom, so its content box is 26px taller than the space left for it and
     the drawer scrolls by that much. Size it from the parent instead. */
  html.${HTML_CLASS} [class*="hHd-Xa_root"] {
    height: auto !important;
    max-height: 100% !important;
    flex: 1 1 auto !important;
    min-height: 0 !important;
  }

  /* ---- drawer rows: one column, one icon column ---- */
  /* The lan-access mobile stylesheet turns the "more" section into a row, so the
     four entries it reveals pack into an 84px column beside the trigger and each
     title ellipsizes to a couple of characters. Stack them under the trigger
     like every other row. */
  html.${HTML_CLASS} [class*="dcu-sb-more-section"] {
    flex-direction: column !important;
  }
  /* Two plugins hide the host's own nav glyph and paint a ::before stand-in,
     which shifts those rows 24px right of the rest of the list. Drop the stand-in
     and show the host glyph again so all rows share one icon column. */
  html.${HTML_CLASS} [data-dssm-nav-icon]::before,
  html.${HTML_CLASS} [data-dsh-schedule-nav]::before {
    display: none !important;
  }
  html.${HTML_CLASS} [data-dssm-nav-icon] > [class*="dcu-sb-glyph"] svg,
  html.${HTML_CLASS} [data-dsh-schedule-nav] > [class*="dcu-sb-glyph"] svg {
    display: inline-flex !important;
  }

  /* ---- drawer icon buttons: paint a 32px box instead of clipping 28x32 ---- */
  /* The sidebar header packs a search trigger and two action icons into a row
     that clips each button to 28x32 or 16x32, and the clipping parent eats the
     corners of the painted box, so the visible glyph and the tap area disagree.
     A 32px box with no padding puts the whole button inside its own frame; the
     search slot and the actions row then grow to match instead of cropping it. */
  html.${HTML_CLASS} [class*="hHd-Xa_toggle"],
  html.${HTML_CLASS} [class*="bhn1Oq_iconButton"],
  html.${HTML_CLASS} [class*="bhn1Oq_searchButton"],
  html.${HTML_CLASS} [class*="YDXeBa_iconButton"] {
    min-width: 32px !important;
    width: 32px !important;
    min-height: 32px !important;
    height: 32px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  html.${HTML_CLASS} [class*="bhn1Oq_headerActions"] {
    gap: 4px !important;
    width: 68px !important;
    min-width: 68px !important;
    flex: none !important;
    overflow: visible !important;
  }
  html.${HTML_CLASS} [class*="bhn1Oq_searchSlot"] {
    width: 32px !important;
    min-width: 32px !important;
    height: 32px !important;
    overflow: visible !important;
  }
  html.${HTML_CLASS} [class*="bhn1Oq_search"] {
    height: 32px !important;
    overflow: visible !important;
  }
  /* The shortcut hint beside "新会话" is the only 11px text in the drawer. */
  html.${HTML_CLASS} [class*="dcu-sb-shortcut"] {
    font-size: 12px !important;
  }

  /* ---- side gutters: a 24px desktop inset on a 390px screen ---- */
  /* The host lays the transcript, the composer and every full-page panel out
     with a 24px side inset. That is a comfortable margin beside a 1160px
     column and a tenth of the screen beside a 390px one, so the text column
     loses about 20% of its width to whitespace. */
  html.${HTML_CLASS} [class*="EvIC1a_scroll"],
  html.${HTML_CLASS} [class*="uV2eYG_root"],
  html.${HTML_CLASS} [class*="pXSMma_root"],
  html.${HTML_CLASS} [class*="dssm-main-panel"],
  html.${HTML_CLASS} [class*="dt-page"] {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  /* The plugin page reads its inset from a custom property and then widens its
     own body by twice that inset, so padding alone would leave the body hanging
     outside the column. Change the property and let the page keep its own
     arithmetic. */
  html.${HTML_CLASS} [class*="X_2TxG_page"] {
    --plugin-page-inset: 16px !important;
  }
  /* The queue dock and the todo panel sit above the composer card and size
     themselves from the side clearance plus four dock insets, so they come out
     narrower than the card and the queued message reads as a different column.
     Give them the card's own inset and drop the extra dock padding. */
  html.${HTML_CLASS} [class*="_7yHdaG_dock"],
  html.${HTML_CLASS} [class*="lXshSW_root"] {
    width: calc(100% - 32px) !important;
    max-width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /* The desktop sidebar carries a 12px margin, which offsets a fixed drawer
     and pushes its right edge past the viewport. Full-bleed it, and cap it
     against the viewport so its horizontal padding cannot overflow 320px. */
  html.${HTML_CLASS} div:has(> [data-shell-overlay]) > [class*="_sidebarCol"] {
    margin: 0 !important;
    box-sizing: border-box !important;
    max-width: 100vw !important;
  }

}
/* Standalone mode: no other mobile shell plugin owns the frame geometry. */
@media ${MOBILE_MQ} {
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) {
    grid-template-columns: 0 minmax(0, 1fr) 0 !important;
    transition: none !important;
    transform: none !important;
  }
  /* A full-page plugin panel drops data-dsh-center-col from the center column,
     so grid auto-placement then parks it in the leading 0-width column while
     the right bar takes the only usable one and the panel renders into nothing.
     Place both columns by class instead of by that attribute. */
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) > [class*="_centerCol"] {
    grid-column: 2 !important;
    grid-row: 1 !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100vw !important;
    transform: none !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) > [class*="_rightbarCol"] {
    grid-column: 3 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) [data-shell-overlay] {
    grid-column: 1 / -1 !important;
    grid-row: 1 !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) > [class*="_sidebarCol"] {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: min(100%, 360px) !important;
    max-width: 100vw !important;
    transform: translateX(-105%) !important;
    transition: transform .24s ease !important;
    z-index: 72 !important;
    background: var(--dsw-alias-bg-layer-1, #fff) !important;
    box-shadow: 0 8px 40px rgba(0, 0, 0, .35) !important;
    display: flex !important;
    flex-direction: column !important;
    pointer-events: auto !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]):not([data-sidebar-collapsed]) > [class*="_sidebarCol"] {
    transform: translateX(0) !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) > [class*="_sidebarCol"] > * {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  html.${HTML_CLASS}:not(.${OTHER_SHELL_CLASS}) div:has(> [data-shell-overlay]) > [class*="_sidebarCol"] [data-slot="sidebar"] > [class*="_root"] {
    width: 100% !important;
  }
}
`

    function ensureStyle() {
      if (typeof document === 'undefined') return
      document.documentElement.classList.add(HTML_CLASS)
      const existing = document.getElementById(STYLE_ID)
      if (existing) existing.remove()
      const tag = document.createElement('style')
      tag.id = STYLE_ID
      tag.dataset.plugin = 'dsh-codex-mobile'
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function frameOf() {
      const overlay = document.querySelector('[data-shell-overlay]')
      return overlay ? overlay.parentElement : null
    }

    function ownsGeometry() {
      return document.documentElement.classList.contains(HTML_CLASS) &&
        !document.documentElement.classList.contains(OTHER_SHELL_CLASS)
    }

    // ---- mobile font sizes -------------------------------------------------
    // The theme service persists one size per role in the Host user-settings
    // document, which every browser and window of the deployment shares. A phone
    // needs larger text than a desktop at the same distance, so the sizes chosen
    // on a phone live in this browser's localStorage instead: the desktop keeps
    // whatever the settings document says, and the phone keeps its own.

    /** Read the sizes chosen on this device; null when unset or unusable. */
    function readMobileFontSizes() {
      try {
        const raw = window.localStorage.getItem(FONT_STORE_KEY)
        if (raw === null) return null
        const parsed = JSON.parse(raw)
        const sizes = {}
        for (const role of FONT_ROLES) {
          const value = Math.round(Number(parsed?.[role]))
          const [min, max] = FONT_RANGES[role]
          // Drop the whole record rather than clamp one role: a partial record
          // cannot say what the user meant for the roles it omits.
          if (!Number.isFinite(value) || value < min || value > max) return null
          sizes[role] = value
        }
        return sizes
      } catch (error) {
        return null
      }
    }

    function writeMobileFontSizes(sizes) {
      try {
        window.localStorage.setItem(FONT_STORE_KEY, JSON.stringify(sizes))
      } catch (error) {
        // Private mode and a full quota both refuse the write; the in-memory
        // value still applies for this page, so nothing else needs to fail.
      }
    }

    /** Sizes to start from: the stored ones, else what the Host is rendering now. */
    function currentMobileFontSizes() {
      const stored = readMobileFontSizes()
      if (stored !== null) return stored
      const sizes = {}
      for (const role of FONT_ROLES) {
        const [min, max] = FONT_RANGES[role]
        const parsed = Number.parseInt(window.getComputedStyle(document.body).getPropertyValue(FONT_VARIABLES[role]), 10)
        sizes[role] = Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : min
      }
      return sizes
    }

    /**
     * Publish the stored sizes on `body` for mobile widths only.
     *
     * The Host writes the same three custom properties as inline styles on
     * `body`, and an inline declaration outranks any ordinary rule. A sheet
     * declaration with `!important` outranks the inline style in turn, so the
     * override lives in a stylesheet scoped to the mobile media query instead of
     * in `body.style`.
     */
    function applyMobileFontSizes() {
      const existing = document.getElementById(FONT_STYLE_ID)
      if (existing) existing.remove()
      const sizes = readMobileFontSizes()
      if (sizes === null) return
      const tag = document.createElement('style')
      tag.id = FONT_STYLE_ID
      tag.dataset.plugin = 'dsh-codex-mobile'
      tag.textContent = `@media ${MOBILE_MQ} { html.${HTML_CLASS} body { ${FONT_ROLES.map(
        (role) => `${FONT_VARIABLES[role]}: ${sizes[role]}px !important;`,
      ).join(' ')} } }`
      document.head.appendChild(tag)
    }

    /** The three font-size rows of the settings panel, in text/code/terminal order. */
    function fontSizeRows() {
      return [...document.querySelectorAll('[class*="bVCLcG_row"]')].filter((row) =>
        row.querySelector('[class*="bVCLcG_stepper"]'),
      )
    }

    /**
     * The up and down buttons of one font-size row.
     *
     * `bVCLcG_arrows` is the container and `bVCLcG_arrow` is a button, so a
     * substring match returns the container first and shifts both buttons by one.
     */
    function stepArrows(row) {
      return [...row.querySelectorAll('[class*="bVCLcG_arrow"]')].filter(
        (element) => !element.className.includes('bVCLcG_arrows'),
      )
    }

    /**
     * Show the stored sizes in the settings rows.
     *
     * The rows render the theme service's own snapshot, which on this device is
     * no longer the value in effect, so the number and the stepper limits are
     * rewritten from the local record after every render.
     */
    function syncFontSizeRows() {
      if (!window.matchMedia(MOBILE_MQ).matches) return
      const sizes = currentMobileFontSizes()
      const rows = fontSizeRows()
      for (const [index, role] of FONT_ROLES.entries()) {
        const row = rows[index]
        if (row === undefined) continue
        const [min, max] = FONT_RANGES[role]
        const value = row.querySelector('[class*="bVCLcG_value"]')
        const text = String(sizes[role])
        if (value !== null && value.textContent !== text) value.textContent = text
        const arrows = stepArrows(row)
        if (arrows[0] !== undefined) arrows[0].disabled = sizes[role] >= max
        if (arrows[1] !== undefined) arrows[1].disabled = sizes[role] <= min
      }
    }

    /**
     * Route the settings panel's font-size stepper to the local record on mobile.
     *
     * The rows belong to the theme service, whose buttons write the shared
     * settings document. On a phone the press is taken first — before the row's
     * own handler runs — and applied to the local record instead, so the desktop
     * keeps its own size.
     */
    function installMobileFontSizes(ctx) {
      applyMobileFontSizes()
      let scheduled = false
      const schedule = () => {
        if (scheduled) return
        scheduled = true
        window.requestAnimationFrame(() => {
          scheduled = false
          syncFontSizeRows()
        })
      }
      const onClick = (event) => {
        if (!window.matchMedia(MOBILE_MQ).matches) return
        const target = event.target
        if (!(target instanceof Element)) return
        const arrow = target.closest('[class*="bVCLcG_arrow"]')
        const row = target.closest('[class*="bVCLcG_row"]')
        if (arrow === null || row === null) return
        const rows = fontSizeRows()
        const index = rows.indexOf(row)
        const role = FONT_ROLES[index]
        if (role === undefined) return
        const arrows = stepArrows(row)
        const delta = arrows.indexOf(arrow) === 0 ? 1 : -1
        const [min, max] = FONT_RANGES[role]
        const sizes = currentMobileFontSizes()
        const next = Math.max(min, Math.min(max, sizes[role] + delta))
        if (next === sizes[role]) return
        // The row's own handler would write the shared document, so the press
        // stops here rather than bubbling into it.
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        sizes[role] = next
        writeMobileFontSizes(sizes)
        applyMobileFontSizes()
        syncFontSizeRows()
      }
      document.addEventListener('click', onClick, true)
      // Expanding "more font settings" mounts the code and terminal rows after
      // the panel's first render, so the sync follows the panel's own updates.
      const observer = new MutationObserver(schedule)
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
      schedule()
      ctx.effect(() => () => {
        document.removeEventListener('click', onClick, true)
        observer.disconnect()
      }, 'dsh-codex-mobile: mobile font sizes')
    }

    function readOrbPosition() {
      try {
        const raw = localStorage.getItem(ORB_STORE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const x = Number(parsed?.x)
        const y = Number(parsed?.y)
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null
        return { x, y }
      } catch {
        return null
      }
    }

    function writeOrbPosition(position) {
      try {
        localStorage.setItem(ORB_STORE_KEY, JSON.stringify(position))
      } catch {
        // A private-mode or quota failure only costs the saved spot; the ball
        // still stays where the drag left it for this session.
      }
    }

    // The drawer opener is the host's button, so the plugin moves the seat that
    // holds it and stores the spot per device. Keeping the offset in px rather
    // than a corner means the ball stays put across orientation changes and
    // never covers the control the thumb is aiming for.
    function installMobileOrb(ctx) {
      const root = document.documentElement
      let last = null

      const clamp = (x, y) => {
        const maxX = Math.max(ORB_MARGIN, window.innerWidth - ORB_SIZE - ORB_MARGIN)
        const maxY = Math.max(ORB_MARGIN, window.innerHeight - ORB_SIZE - ORB_MARGIN)
        return {
          x: Math.min(Math.max(ORB_MARGIN, x), maxX),
          y: Math.min(Math.max(ORB_MARGIN, y), maxY),
        }
      }
      const place = (x, y) => {
        const spot = clamp(x, y)
        last = spot
        root.style.setProperty('--dcm-orb-x', `${Math.round(spot.x)}px`)
        root.style.setProperty('--dcm-orb-y', `${Math.round(spot.y)}px`)
      }

      const stored = readOrbPosition()
      if (stored) place(stored.x, stored.y)

      let drag = null
      let suppressClickUntil = 0

      const onPointerDown = (event) => {
        const opener = event.target instanceof Element ? event.target.closest('[data-sidebar-opener]') : null
        if (!opener) return
        const box = opener.getBoundingClientRect()
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: box.left, originY: box.top, moved: false }
        try {
          opener.setPointerCapture(event.pointerId)
        } catch {
          // Capture is an optimisation; without it the move handler still runs
          // because the listener sits on the document.
        }
      }

      const onPointerMove = (event) => {
        if (!drag || event.pointerId !== drag.id) return
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < ORB_DRAG_SLOP) return
        drag.moved = true
        event.preventDefault()
        place(drag.originX + dx, drag.originY + dy)
      }

      const onPointerUp = (event) => {
        if (!drag || event.pointerId !== drag.id) return
        const moved = drag.moved
        drag = null
        if (!moved) return
        suppressClickUntil = performance.now() + 400
        if (last) writeOrbPosition(last)
      }

      // The tap that ends a drag would otherwise open the drawer, so swallow
      // exactly that one click and let every later tap through.
      const onClickCapture = (event) => {
        if (performance.now() > suppressClickUntil) return
        const opener = event.target instanceof Element ? event.target.closest('[data-sidebar-opener]') : null
        if (!opener) return
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
      }

      const onResize = () => {
        if (!last) return
        place(last.x, last.y)
      }

      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('pointermove', onPointerMove, true)
      document.addEventListener('pointerup', onPointerUp, true)
      document.addEventListener('pointercancel', onPointerUp, true)
      document.addEventListener('click', onClickCapture, true)
      window.addEventListener('resize', onResize)
      window.addEventListener('orientationchange', onResize)

      ctx.effect(() => () => {
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('pointermove', onPointerMove, true)
        document.removeEventListener('pointerup', onPointerUp, true)
        document.removeEventListener('pointercancel', onPointerUp, true)
        document.removeEventListener('click', onClickCapture, true)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('orientationchange', onResize)
        root.style.removeProperty('--dcm-orb-x')
        root.style.removeProperty('--dcm-orb-y')
      }, 'dsh-codex-mobile: floating drawer opener')
    }

    // The right panel starts below the session header, and the header's height
    // depends on what the session has: a team chip adds a track, and a blank
    // header is 16px while a session header is 82px. Measure it and publish the
    // bottom edge so the panel's own rule needs no second copy of that logic.
    function installMobileHeaderHeight(ctx) {
      const root = document.documentElement

      const publish = () => {
        if (!window.matchMedia(MOBILE_MQ).matches) {
          root.style.removeProperty(HEADER_BOTTOM_VAR)
          return
        }
        const header = document.querySelector('header[class*="wSkVaW_header"]')
        if (!header) {
          root.style.removeProperty(HEADER_BOTTOM_VAR)
          return
        }
        const bottom = Math.round(header.getBoundingClientRect().bottom)
        root.style.setProperty(HEADER_BOTTOM_VAR, `${Math.max(0, bottom)}px`)
      }

      publish()
      // The header swaps between the blank variant and the session variant when
      // a session opens, and the team chip mounts on its own schedule, so watch
      // the tree instead of measuring once at load.
      const observer = new MutationObserver(publish)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-team-chat-entry'],
      })
      const mq = window.matchMedia(MOBILE_MQ)
      mq.addEventListener('change', publish)
      window.addEventListener('resize', publish)
      window.addEventListener('orientationchange', publish)

      ctx.effect(() => () => {
        observer.disconnect()
        mq.removeEventListener('change', publish)
        window.removeEventListener('resize', publish)
        window.removeEventListener('orientationchange', publish)
        root.style.removeProperty(HEADER_BOTTOM_VAR)
      }, 'dsh-codex-mobile: session header height')
    }

    function MobileChrome({ getLayout }) {
      const [state, setState] = React.useState({ mobile: false })

      // Publish the visible viewport height. Android keeps the layout viewport at
      // full height while the soft keyboard covers the lower part, so the shell
      // would reserve a composer seat behind the keyboard and leave the blank
      // band the user sees between the input and the keys.
      React.useEffect(() => {
        const root = document.documentElement
        // The visual viewport's offset and height are both layout-viewport
        // coordinates. Edge and Samsung Internet pan the visual viewport down by
        // the height of the browser toolbar they keep below it, so `height` alone
        // ends above the keyboard and the shell stops short of it by exactly that
        // pan. The visible band ends at offsetTop + height; the layout viewport is
        // the ceiling because no engine can show more than it.
        const publish = () => {
          const viewport = window.visualViewport
          const visibleBottom = viewport
            ? Math.round(viewport.offsetTop + viewport.height)
            : Math.round(window.innerHeight)
          const layoutHeight = Math.round(window.innerHeight) || visibleBottom
          const height = Math.max(0, Math.min(visibleBottom, layoutHeight))
          if (height <= 0) return
          root.style.setProperty(VIEWPORT_VAR, `${height}px`)
        }
        publish()
        // The keyboard slides in over a few hundred milliseconds and fires a
        // burst of resize events while the visual viewport is still moving, so
        // the last one can report a mid-animation height. Re-measure once after
        // the burst settles; publishing the same height again is a no-op.
        let settle = null
        const onViewportChange = () => {
          publish()
          if (settle !== null) window.clearTimeout(settle)
          settle = window.setTimeout(() => {
            settle = null
            publish()
          }, 320)
        }
        window.addEventListener('resize', onViewportChange)
        window.addEventListener('orientationchange', onViewportChange)
        const viewport = window.visualViewport
        if (viewport) {
          viewport.addEventListener('resize', onViewportChange)
          viewport.addEventListener('scroll', onViewportChange)
        }
        return () => {
          if (settle !== null) window.clearTimeout(settle)
          window.removeEventListener('resize', onViewportChange)
          window.removeEventListener('orientationchange', onViewportChange)
          if (viewport) {
            viewport.removeEventListener('resize', onViewportChange)
            viewport.removeEventListener('scroll', onViewportChange)
          }
          root.style.removeProperty(VIEWPORT_VAR)
        }
      }, [])

      // The drawer is the host's now, so this component only publishes the
      // viewport height and owns the focus and dismissal rules; it renders
      // nothing of its own. Track whether the drawer is open for the focus
      // guard, which must stay quiet while the drawer covers the composer.
      React.useEffect(() => {
        const read = () => {
          const frame = frameOf()
          drawerOpenRef.current = frame ? !frame.hasAttribute('data-sidebar-collapsed') : false
          setState({ mobile: window.matchMedia(MOBILE_MQ).matches })
        }
        read()
        const mq = window.matchMedia(MOBILE_MQ)
        mq.addEventListener('change', read)
        const observer = new MutationObserver(read)
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sidebar-collapsed'] })
        return () => {
          mq.removeEventListener('change', read)
          observer.disconnect()
        }
      }, [])

      const toggleSidebar = React.useCallback(() => {
        const layout = getLayout()
        if (layout && typeof layout.toggleSidebar === 'function') layout.toggleSidebar()
      }, [getLayout])

      // Deadline of the current drawer-navigation focus guard. The shell focuses
      // the composer whenever the session changes, so opening a session from the
      // drawer raises the soft keyboard on top of the page the user asked for.
      const suppressFocusUntil = React.useRef(0)
      // The shell can refocus the composer well after the drawer tap that caused
      // the session change, so the guard also holds while the drawer covers it:
      // the composer is not reachable behind the drawer anyway.
      const drawerOpenRef = React.useRef(false)

      React.useEffect(() => {
        if (!state.mobile || !ownsGeometry()) return
        const guarded = (element) =>
          element instanceof HTMLElement &&
          element.matches(INPUT_SELECTOR) &&
          (drawerOpenRef.current || performance.now() < suppressFocusUntil.current)
        // Skip the shell's own focus() call: focusing is what raises the soft
        // keyboard, and blurring afterwards still flashes it on Android.
        const nativeFocus = HTMLElement.prototype.focus
        HTMLElement.prototype.focus = function focus(...args) {
          if (guarded(this)) return
          return nativeFocus.apply(this, args)
        }
        const onFocusIn = (event) => {
          const target = event.target
          if (!guarded(target)) return
          suppressFocusUntil.current = 0
          target.blur()
        }
        document.addEventListener('focusin', onFocusIn, true)
        return () => {
          HTMLElement.prototype.focus = nativeFocus
          document.removeEventListener('focusin', onFocusIn, true)
        }
      }, [state.mobile])

      // Navigation from the drawer must dismiss it; the frame keeps the open
      // state otherwise and the drawer would cover the session it just opened.
      React.useEffect(() => {
        if (!state.mobile || !ownsGeometry()) return
        const dismiss = (delay) => {
          window.setTimeout(() => {
            const current = frameOf()
            if (current && !current.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
          }, delay)
        }
        const onDocumentClick = (event) => {
          const frame = frameOf()
          if (!frame || frame.hasAttribute('data-sidebar-collapsed')) return
          const target = event.target
          if (!(target instanceof Element)) return
          // Choosing anything in the drawer is a navigation gesture, not a
          // request to write: arm the focus guard so the composer the shell
          // focuses after the session change cannot raise the soft keyboard.
          if (!target.closest('input, textarea, select') && target.closest('[class*="_sidebarCol"]')) {
            suppressFocusUntil.current = performance.now() + FOCUS_GUARD_MS
          }
          // A menu item chosen from a drawer popup (settings, sign-in, feedback)
          // opens a panel that the drawer would cover, so the drawer steps aside.
          // The popup portals to the body, so it is matched before the sidebar
          // containment check below.
          if (target.closest('[role="menuitem"]')) {
            dismiss(180)
            return
          }
          if (target.closest('[data-shell-overlay]')) return
          const sidebar = frame.querySelector('[class*="_sidebarCol"]')
          if (!sidebar || !sidebar.contains(target)) return
          // Tabs and segmented switches only change which list the drawer shows,
          // so the drawer stays open for them.
          if (target.closest('[role="tab"], [class*="dsh-rc-tab"], [class*="_tab_"]')) return
          // Controls that open a popup or menu stay put: the popup's owner lives
          // in the drawer footer, so collapsing the drawer unmounts that owner
          // and takes the account menu or settings panel down with it.
          if (target.closest('input, textarea, select')) return
          if (target.closest('[aria-haspopup], [class*="_trigger"], [class*="more-trigger"], [class*="_settingsArea"], [class*="_footArea"], [class*="_rowActions"], [class*="_iconButton"], [class*="_sectionHeader"], [class*="_projectRow"]')) return
          // Everything else that navigates — a session, a new chat, or one of
          // the Codex navigation rows — should reveal the page it opens.
          const navigation = target.closest('[data-session-id], [data-conversation-id], [class*="_sessionRow"], [class*="_searchResultRow"], [class*="_newSession"], [class*="dcu-sb-row"], [class*="dsh-rc-row"]')
          if (!navigation) return
          dismiss(180)
        }
        document.addEventListener('click', onDocumentClick, true)
        return () => document.removeEventListener('click', onDocumentClick, true)
      }, [state.mobile, toggleSidebar])

      // Escape closes the drawer. The Host binds it only while another mobile
      // shell plugin owns the chrome, so the standalone frame needs this one.
      React.useEffect(() => {
        if (!state.mobile || !ownsGeometry()) return
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          const frame = frameOf()
          if (frame && !frame.hasAttribute('data-sidebar-collapsed')) toggleSidebar()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [state.mobile, toggleSidebar])
    }

    const inject = ['slots', 'layout']

    function apply(ctx) {
      ensureStyle()
      installMobileFontSizes(ctx)
      installMobileOrb(ctx)
      installMobileHeaderHeight(ctx)
      ctx.effect(
        () =>
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              { name: 'shell.overlay', id: 'dsh-codex-mobile-shell', order: 20, label: 'Codex mobile shell' },
              () => jsx(MobileChrome, { getLayout: () => ctx.layout }),
            ),
          ),
        'dsh-codex-mobile: shell.overlay',
      )
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
