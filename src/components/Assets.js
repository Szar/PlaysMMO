export const map_files = {
	"map_json": require("../../assets/tilesets/tileset.json"),
	"map_png": require("../../assets/tilesets/tileset.png")
}

export const skin_files = [{
		"name": "sonic",
		"file": require("../../assets/sprites/skin_sonic.png"),
		"title": "Sonic",
	},
	{
		"name": "flamedramon",
		"file": require("../../assets/sprites/skin_flamedramon.png"),
		"title": "Flamedramon",
	},
	{
		"name": "gabumon",
		"file": require("../../assets/sprites/skin_gabumon.png"),
		"title": "Gabumon",
	},
	{
		"name": "kuwagamon",
		"file": require("../../assets/sprites/skin_kuwagamon.png"),
		"title": "Kuwagamon",
	},
]

export const skin_animations = [
	{
		"name":"stand",
		"animated": false,
		"frames": [3]
	},
	{
		"name":"walk",
		"animated": true,
		"frames": [4,5]
	},
	{
		"name":"back_stand",
		"animated": false,
		"frames": [0]
	},
	{
		"name":"back_walk",
		"animated": true,
		"frames": [1,2]
	}
]

export const font = {
	"font_xml": require("../../assets/fonts/gem.xml"),
	"font_png": require("../../assets/fonts/gem.png")
}

