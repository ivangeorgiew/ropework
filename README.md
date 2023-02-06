# Ropework

[Discussion with ChatGPT about defensive programming](https://imgur.com/a/NLc3vOp)

## Tips

If the function is going to be returning a value, then the onCatch function should
default to `() => RETHROW`.\

Else if the function is only with side-effects, the onCatch function should default
to `() => {}`\

In the other cases it depends and you should write custom code for the onCatch\
