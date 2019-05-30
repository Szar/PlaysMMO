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
			"name": "default",
			"file": require("./assets/sprites/skin_default.png"),
			"title": "Default",
		},{
			"name": "sonic",
			"file": require("./assets/sprites/skin_sonic.png"),
			"title": "Sonic",
		},{
			"name": "wolfgang",
			"file": require("./assets/sprites/skin_wolfgang.png"),
			"title": "Wolfgang",
		},{
			"name": "tarou",
			"file": require("./assets/sprites/skin_tarou.png"),
			"title": "Tarou",
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
		{
			"name": "guest",
			"file": require("./assets/sprites/skin_guest.png"),
			"title": "Guest",
		}
	],
		"animations": [{
				"name": "stand",
				"animated": false,
				"frames": [7]
			},
			{
				"name": "walk",
				"animated": true,
				"frames": [8, 9]
			},
			{
				"name": "jump",
				"animated": true,
				"frames": [10, 13], 
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
			,
			{
				"name": "back_jump",
				"animated": true,
				"frames": [3, 6]
			}
			
		]
	}

};