# srt-tts-bot

> Thailand Train Tracking Bot.

This is my learning Node app (sorry for the bad coding). The automatic train tracking that grab [Thailand Train Tracking Site](http://tts.railway.co.th/) and notified train delay on Twitter using Node.js and PostgreSQL.

## Demo

* This Demo is only work with East line for now (because of Heroku limit). 
* [Demo-Bot](https://twitter.com/srt_bot_th)

## Local Install

	1. Install node.
	2. $git clone https://github.com/dogrocker/srt-tts-bot.git
	3. $cd srt-tts-bot
	4. $npm install
	5. Define config vars to process.env.
	6. $node bot.js

## Deploy to Heroku

	1. Follow step to deploy app to Heroku.
	2. Follow step to create PostgreSQL Heroku addons.
	3. Define config vars to Heroku env.
	4. $heroku config:add TZ="Asia/Bangkok"
	5. $heroku ps:scale worker=1
	6. $heroku logs -t
	
## Roadmap

- [ ] Make the code to notified 24 hrs train tracking.
- [ ] Make the code more easy to read.

## Author

* Kanin Peanviriyakulkit (@DogRocker)

## Contributing

All are welcome! :)

## Images

* Mongkol Srisawat

## License

This work licensed under the [GPL v.2 license](https://github.com/dogrocker/srt-tts-bot/blob/master/LICENSE).

[![forthebadge](http://forthebadge.com/images/badges/built-by-codebabes.svg)](http://forthebadge.com)