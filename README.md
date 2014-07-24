# Twitch Giveaways

Comfortable giveaways system for [Twitch.tv](http://twitch.tv) channels.

## Installation

- [Chrome extension](https://chrome.google.com/webstore/detail/twitch-giveaways/poohjpljfecljomfhhimjhddddlidhdd)

## Technologies used

[component(1)](https://github.com/component/component) - Opinionated, and non wasteful package manager & builder made for the front end world.

[Mithril](https://github.com/lhorie/mithril.js) - Really fast and simple virtual DOM diffing framework. More powerful than React, but 14 times smaller :)

[Gulp](https://github.com/gulpjs/gulp) - Streams oriented build system.

... and lots of small libraries defined in [component.json](https://github.com/darsain/twitch-giveaways/blob/master/component.json).

Thanks to the efficient component(1) ecosystem and Mithril framework, the whole production build with dependencies is only 70KB+. That is smaller than jQuery! :)

## Development environment

You need to have [nodejs](http://nodejs.org/) isntalled.

Gulp:

```
npm install -g gulp
```

Build dependencies:

```
npm install
```

## Gulp tasks

To run any of the tasks below, write `gulp taskname` into your console.

In general, you should be interested only in **build**, **serve**, and **watch** tasks.

### *default*

Runs **build** & **serve**, which in turn runs **watch**.

Default task can be run simply by:

```
gulp
```

*Don't run this task, as currently there is an issue with gulp-livereload. Run `gulp build` and than `gulp serve` manually.*

### assets

Copies static assets like images and manifest into `build/` directory.

### build

Builds the whole app and outputs into `build/` directory.

Available arguments:

- `-P --production` - Build a production version, which doesn't include fixtures, and minifies resources.

Example:

```
gulp build -P
gulp build -production
```

### bump

Bump the `manifest.json` version.

Available arguments:

- `-t --type=[name]` - Pick which semantic version should be bumped. Can be: **patch** (default), **minor**, **major**, or a direct version.

Example:

```
-> version: 1.0.0
gulp bump
-> version: 1.0.1
gulp bump -t patch
-> version: 1.0.2
gulp bump -t minor
-> version: 1.1.0
gulp bump -t 2.2.2
-> version: 2.2.2
```

### clean

Deletes the `build/` directory.

### icons

Builds the `icons.woff` font from `src/icon/` icons into `build/` directory.

### icons:serialize

When adding or removing icons from `src/icon/`, run this task to re-prefix their codepoints, and re-generate `src/styl/module/icons.styl` file to mirror the changes.

As this task changes the codepoints, you have to run `gulp icons` to re-generate `icons.woff`.

### package

Will package the production version of the app into a zip file.

### release

Will bump the `manifest.json` version and package the app into a zip file.

Accepts **bump** arguments.

### scripts

Builds scripts into `build/` directory.

### styles

Builds styles into `build/` directory.

### serve

Creates a static file server from the root directory, and starts **watch** task.

Available arguments:

- `-p --port=number` - Custom port number to run the server on. Default: `8080`

Example:

```
gulp serve -p 8080
```

The testing environment is than accessible on [http://localhost:8080/test/chat](http://localhost:8080/test/chat).

There needs to be a `/test/chat` path because that's how the app recognizes which channel it is being run for. In this case, the channel name is resolved as `test`.

### watch

Starts watching scripts, styles, and assets for changes, and builds what is necessary.

Also spins up a livereload server. You can [install the livereload extension](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions) which will reload the testing environment as changes happen.

Doesn't listen for `src/icon/` changes! When messing with icons, you need to run `gulp icons:serialize` & `gulp icons` manually.

## Testing environment

Located in `test/` and accessible via `http://localhost:8080/test/chat` when `gulp serve` is running, it's a replication of a popped out twitch chat with integrated commands to populate chat with dummy messages. Read about the commands in **Fixtures** section below.

If you want to use it in full, you need to disable the cross origin policy in your browser:

- Chrome: run the browser with `--disable-web-security` flag.

Nothing breaks without it, but app won't be able to request `api.twitch.tv` for users' avatars and following status.

## Fixtures

The testing environment is enhanced with fixture functions and commands accessible either from the console or chat textarea.

### fix

From the console, you can access the global `fix` object/function. This object exposes various properties and functions for populating chat with messages.

#### fix([messages], [users])

Write a set number of messages by a set number of random users.

- **messages** `Integer` Default: 100
- **users** `Integer|Array` Number of users, or array of user objects. When omitted, people from `fix.population` will be used.

#### fix.population `Array`

Array of random users that `fix()` & `fix.line()` accept as arguments, or pool from when arguments are omitted.

You can repopulate this array with `fix.repop()`.

On load, this array is populated with 100 random users.

#### fix.repop([count])

Repopulate the `fix.population` array with a set number of new unique users.

- **count** `Integer` Default: 100

Just a shorthand for:

```js
fix.population = fix.users(count);
```

#### fix.user([name], [badges], [chances])

Creates a random user object. This object is than accepted by `fix.line()`, or `fix.population`.

- **name** `String` Username.
- **badges** `Array` Array with badges. Example: `['admin', 'turbo', 'subscriber']`
- **chances** `Object` Object witch chances for badges. Example: `{group: 20, subscriber: 20, turbo: 20}`

Supported signatures:

```js
fix.user(name)
fix.user(name, badges)
fix.user(badges)
fix.user(name, chances)
fix.user(chances)
```

#### fix.users([count])

Returns an array of users generated by `fix.user()`. `fix()` accepts this array as 2nd argument.

#### fix.line([user], [message])

Posts a random or specified message by a random or specified user.

- **user** `Object` User object. When omitted, it'll get a random user from `fix.population`.
- **message** `String` When omitted, a random message will be generated.

Examples:

```js
fix.line(); // random message by random user
fix.line(fix.user('JohnDoe', ['admin']), 'Message by JohnDoe admin.');
fix.line(fix.popFind('JohnD'), 'Message by JohnDoe from fix.population.');
fix.line(fix.popUser(), 'Message by random user from fix.population.');
```

#### fix.popFind(needle)

Find the first user object in `fix.population` whose name contains `needle`.

#### fix.popUser()

Return a random user object from `fix.population`.

### Textarea commands

Textarea accepts some commands to ease the fixtures generation. When command doesn't exist, the message is posted as a random user from `fix.population`.

It also remembers commands. You can navigate the command history with up & down arrows.

#### fix [messages] [users]

Will write 100 messages from 100 random users.

Arguments:

- **message** - Number of messages. Default: 100
- **users** - Number of users the messages will be from. Default: 100

#### repop [count]

Repopulate `fix.population`.

- **count** - Default: 100

#### [username]:[message]

Will write a message from a specific user. If `username` matches part of any username in `fix.population`, than the user object from the population will be used.

Examples:

Write "my message" as "JohnDoe".

```
JohnDoe:my message
```

Write a random message as "JohnDoe".

```
JohnDoe:
```

When there already is a JohnDoe user in `fix.population`, you can write just part of the username:

```
JohnD:
```

#### clear

Will clear command history.