# Profile study

Isolated route: `/prototypes/profile`. No account APIs or production imports from this directory.

- Passport: identity-led split layout with an account summary and visible forms.
- Console: compact identity header and keyboard-accessible settings tabs.
- Ledger: flat account worksheet with inline editing and square controls.

Uses the existing Ember tokens, system fonts, dot mountain asset, controls and credit countdown. Operate mode: visual variance 6, motion 2, density 5. The industrial influence is structural; the established orange palette wins over the skill's suggested red palette. Design Taste's marketing-only rules do not determine settings-page behavior.

Sample names, member date, provider connections and credit balances are illustrative. Saves, connection and verification are local simulations, reset on switching direction/account scenario or reloading. No emails, OAuth flows or generation requests are triggered. The theme switch uses the application's existing preference.

Picker: 1/2/3 or left/right arrows. R resets sample data. Shortcuts ignore forms and settings tabs. The URL `?v=1`, `?v=2` or `?v=3` selects a direction. Keyboard arrow keys within Console's tabs switch account sections instead.

Production profile remains unchanged until a direction is selected.
