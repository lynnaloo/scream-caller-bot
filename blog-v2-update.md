## Update: I rebuilt the creepy bot without the spreadsheet

A few years ago I accidentally made [a bot](https://github.com/lynnaloo/scream-caller-bot) that talks like the caller from *Scream*. Back then it ran on Azure Bot Service and QnA Maker, which meant the whole "brain" was a giant spreadsheet of questions and answers I typed out by hand. (The original story is here at the bottom of this blog)

![Scream mirror](https://media.giphy.com/media/3o7aTvjpZypM4rKH4s/giphy.gif) 

QnA Maker has since been retired, and honestly the spreadsheet was always the boring part. So I rebuilt him (it?)!

The new version runs on a small, cheap LLM (Claude Haiku) instead. No knowledge base, no training. The entire personality is one system prompt that tells the model to *be* Ghostface, seeded with real lines from the movie and my old answer file. He picks up with
a quiet "Hello?", warms up, asks if you like scary movies, and eventually wants to play a game.

The fun part: he improvises now, so he can actually react to what you say. The kinda bad part: he improvises now. So I hand him a bank of the canonical lines and tell him to stick to the script. Answer "Jason" for the killer in Friday the 13th and he will still set you straight about Mrs. Voorhees.

It is a plain web chat now, and his replies stream in so it looks like he is typing at you. I kept the old mask and the original knowledge base files in the repo, partly as the source
of his voice and partly for old times' sake.

Next up: giving him an actual phone number. Try not to say "who's there?"