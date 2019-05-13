var config = require('./Config')

export const getRandomInt = function(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const decodePoint = function(x, y) {
	return {
		x: x + (config.game.width / 2),
		y: y + (config.game.height / 2)
	}
}

export const encodePoint = function(x, y) {
	return {
		x: x - (config.game.width / 2),
		y: y - (config.game.height / 2)
	}
}

function wordWrap(str, maxWidth) {
	function testWhite(x) {
		return new RegExp(/^\s$/).test(x.charAt(0));
	};
	var newLineStr = "\n",
		done = false,
		res = '';
	do {
		var found = false;
		for (let i = maxWidth - 1; i >= 0; i--) {
			if (testWhite(str.charAt(i))) {
				res = res + [str.slice(0, i), newLineStr].join('');
				str = str.slice(i + 1);
				found = true;
				break;
			}
		}
		if (!found) {
			res += [str.slice(0, maxWidth), newLineStr].join('');
			str = str.slice(maxWidth);
		}

		if (str.length < maxWidth)
			done = true;
	} while (!done);

	return res + str;
}