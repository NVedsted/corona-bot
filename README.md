# Corona/COVID-19 Bot
A bot that emulates the spread of COVID-19 on your Discord server.

You'll have to set the environment variable `BOT_TOKEN` to a Discord bot token of yours.
You can then start it by running `npm start`.

## How It Works
When the bot joins your guild, it makes a role for the virus.
It will initially infect a few people, and then the infection can be spread through messages.
You can modify the chance of infection, infection count, name, and so on quite easily in `app.ts`.
