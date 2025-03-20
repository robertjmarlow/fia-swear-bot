# fia-swear-bot

A Discord bot that implements the FIA's new [anti-swearing rules for drivers](https://www.nytimes.com/athletic/6157464/2025/02/25/fia-f1-swearing-penalties-explained/) but for users in Discord channels.

# Prereqs

1. Clone this repo.
1. Create a file called `.env` at the root of the repo. This needs to be filled in with enviornment variables.
    ```
    token=
    clientId=
    guildId=
    badWordList=
    badWordMultiplier=
    dbHost=
    dbPort=
    ```

:warning: **The versions of Redis in the various install methods could be different. This may make the [AOF](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) between the install methods incompatible with one another when switching between different installation methods.**

# Build + Run with Docker

Docker is recommended to build and run this.

One-time setup steps:

1. Install [Docker](https://www.docker.com/)

Build and run the image with:

```sh
docker compose up --build -d
```

# Build + Run with Node and Redis

This also works, but takes more steps.

One-time setup steps:

1. Install [nvm](https://github.com/nvm-sh/nvm)
1. Tell nvm to use the correct version of node:
    ```sh
    nvm use
    ```
1. Install the [TypeScript](https://www.typescriptlang.org/) compiler globally:
    ```sh
    npm install -g tsc
    ```
1. Install [yarn](https://yarnpkg.com/):
    ```sh
    corepack enable
    yarn install
    ```
1. Install [Redis](https://redis.io/), either through [its downloads page](https://redis.io/downloads/#stack) or [via Homebrew](https://formulae.brew.sh/formula/redis):
    ```sh
    brew install redis
    ```

Build and run:

1. Make some minor modifications to the `redis.conf`:
    ```diff
    diff --git a/redis.conf b/redis.conf
    index 7c3e1cc..2c0dac0 100644
    --- a/redis.conf
    +++ b/redis.conf
    @@ -1,3 +1,3 @@
    -dir /usr/local/etc/redis/db
    +dir ./db
    appendonly yes
    appendfilename "db.aof"
    ```
1. Start Redis with the specified `redis.conf`:
    ```sh
    redis-server ./redis.conf
    ```
1. In another command line, start the bot:
    ```sh
    yarn build-and-run
    ```
