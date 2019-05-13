export const assets = {
	"fonts": [{
		'name': 'gem',
		'file': require("./assets/fonts/gem.png"),
		'xml': require("./assets/fonts/gem.xml")
	}, ],
	"map": {
		"file": require("./assets/tilesets/tileset.png"),
		"json": require("./assets/tilesets/tileset.json")
	},
	"skins": {
		"files": [{
				"name": "sonic",
				"file": require("./assets/sprites/skin_sonic.png"),
				"title": "Sonic",
			},
			{
				"name": "flamedramon",
				"file": require("./assets/sprites/skin_flamedramon.png"),
				"title": "Flamedramon",
			},
			{
				"name": "gabumon",
				"file": require("./assets/sprites/skin_gabumon.png"),
				"title": "Gabumon",
			},
			{
				"name": "kuwagamon",
				"file": require("./assets/sprites/skin_kuwagamon.png"),
				"title": "Kuwagamon",
			},
		],
		"animations": [{
				"name": "stand",
				"animated": false,
				"frames": [3]
			},
			{
				"name": "walk",
				"animated": true,
				"frames": [4, 5]
			},
			{
				"name": "back_stand",
				"animated": false,
				"frames": [0]
			},
			{
				"name": "back_walk",
				"animated": true,
				"frames": [1, 2]
			}
		]
	}

};