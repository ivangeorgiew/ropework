# Ropework

Work in progress.

## Tips

The `onCatch` function should default to `() => RETHROW`.

If we want to handle on case by case basis, `onCatch` can be `({ error }) => error`.<br> And then we write
`const result = triedFunc(); if (result instanceof Error) ...`

In the other cases it depends and you should write custom code for the `onCatch`
