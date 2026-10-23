# Screen-reader checklist

Automated tests check that roles, names and live-region text are *in the DOM*. Only a screen
reader shows what's actually *announced*. This is a 30–45 minute pass with NVDA on Windows.
Record results in the table at the bottom, and copy anything surprising into
[decisions.md](decisions.md).

## Setup

1. Install [NVDA](https://www.nvaccess.org/download/) (free). Start it with Ctrl+Alt+N.
2. Run the docs: `npm run dev`, then open `http://localhost:3000` in Chrome or Firefox.
3. Turn on NVDA's speech viewer so you can read what it said: NVDA menu (Insert+N) → Tools →
   Speech viewer.
4. Use the keyboard only. Close the speech viewer's focus by clicking back into the browser.

Keys you'll need. NVDA's modifier is Insert (or Caps Lock, if you set it).

| Keys | Does |
| --- | --- |
| Tab / Shift+Tab | Next / previous focusable element |
| Insert+Space | Switch between browse mode and focus mode |
| H / Shift+H | Next / previous heading (browse mode) |
| D | Next landmark (browse mode) |
| Insert+Tab | Re-announce the focused element |
| Ctrl | Stop speech |

## Checks

Each check lists what to do and what you should hear. Wording varies a little between NVDA
versions and browsers; what matters is the role, the name, the state, and that nothing is
missing or announced twice.

### Site

| # | Do | Expect |
| --- | --- | --- |
| S1 | Load any component page, press Tab once | "Skip to content, link" |
| S2 | Press Enter, then Tab | Focus lands in the page content, not the sidebar |
| S3 | Browse mode, press D repeatedly | Banner, "Docs" navigation, main |
| S4 | In the sidebar, Tab to the current page's link | "…link, current page" |

### Input (`/components/input`)

| # | Do | Expect |
| --- | --- | --- |
| I1 | Tab to Email | "Email, edit, required, Used only for sign-in." |
| I2 | Tab to Username (starts with an error) | "Username, edit, invalid entry, That username is taken. Letters and numbers only." Error before hint. |
| I3 | Tab to the search field with the hidden label | "Search, …edit" even though no label is visible |
| I4 | Tab to Workspace ID | "read only" is announced |

### Select (`/components/select`)

| # | Do | Expect |
| --- | --- | --- |
| SE1 | Tab to Plan | "Plan, combo box, Choose a plan, required, You can change this later." |
| SE2 | Open it (Alt+Down) and arrow through | "Enterprise (contact us)" announced as unavailable or dimmed |
| SE3 | Tab to Time zone | "invalid entry" and the error text |

### Dialog (`/components/dialog`)

| # | Do | Expect |
| --- | --- | --- |
| D1 | Activate Edit profile | "Edit profile, dialog, Changes are visible to everyone in your workspace." then the Name field |
| D2 | Tab through the dialog several times | Never leaves the dialog; never reads page content behind it |
| D3 | Press Escape | Dialog closes; "Edit profile, button" is announced again |
| D4 | Activate Delete project | "Delete this project?, alert dialog, …" and focus on "Keep project, button" |
| D5 | In browse mode inside a dialog, press H / arrows | Only dialog content is reachable |

### Menu (`/components/menu`)

| # | Do | Expect |
| --- | --- | --- |
| M1 | Tab to Actions | "Actions, menu button, collapsed" (or "button, has popup, collapsed") |
| M2 | Press Enter | "Actions, menu" then "Rename, Ctrl E, menu item, 1 of 5" or similar |
| M3 | Arrow down to Archive | Skipped. Note whether NVDA still counts it in "x of 5"; it's in the menu but disabled. |
| M4 | Press Escape | Menu closes, "Actions, menu button, collapsed" |
| M5 | Open, arrow to Duplicate, press Enter | Menu closes; focus is back on Actions; "Last action: Duplicate" is read (live region) |

### Tabs (`/components/tabs`)

| # | Do | Expect |
| --- | --- | --- |
| T1 | Tab into the Project tabs | "Project, tab list, Overview, tab, selected, 1 of 4" |
| T2 | Right arrow | "Activity, tab, selected, 2 of 4" |
| T3 | Tab | Focus moves to the panel: "Activity, property page" (or "tab panel") and its text |
| T4 | Range tabs (manual): Right arrow, then Enter | "Week, tab, not selected" on arrow; "selected" after Enter |
| T5 | Account settings tabs | Announced as vertical; Up and Down work |

### Tooltip (`/components/tooltip`)

| # | Do | Expect |
| --- | --- | --- |
| TT1 | Tab to "Hover or focus me" | "Hover or focus me, button, Saves a copy to your workspace" |
| TT2 | Tab to the icon-only search button | "Search, button", from the tooltip as its name |
| TT3 | Press Escape | Tooltip hides; NVDA doesn't announce a focus change |

### Toast (`/components/toast`)

| # | Do | Expect |
| --- | --- | --- |
| TO1 | Activate Success | "Project published. It's live for everyone in the workspace." read without moving focus |
| TO2 | Activate Danger | Announced immediately, interrupting other speech (assertive) |
| TO3 | Activate Neutral twice quickly | Announced both times, not swallowed as a duplicate |
| TO4 | Activate With action, then Tab to the toast | Its Undo button and "Dismiss: 3 files moved to trash, button" are reachable |
| TO5 | Open "From a dialog", activate Show toast | Announced while the dialog is open (the layer moves into the modal) |

## Results

Fill in after the pass. Status: ✅ as expected, ⚠️ works but reads oddly, ❌ broken.

| Check | NVDA + browser | Status | What was announced, if different |
| --- | --- | --- | --- |
| S1 | | | |
| … | | | |

Anything marked ⚠️ or ❌ becomes an issue, and a sentence in
[decisions.md](decisions.md) under "What isn't proven yet". Update that section once the pass is
done.
