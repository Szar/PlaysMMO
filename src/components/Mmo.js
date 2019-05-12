import Phaser from 'phaser';
import io from 'socket.io-client';
import {
	skin_files,
	map_files,
	skin_animations,
	font
} from './Assets'
var config = require('../../config');

var socket

var players = {},
	default_speed = 100,
	speed = default_speed,
	frameRate = 7,
	p = {},
	g,
	start_range = 0,
	start = {
		x: getRandomInt(-start_range-600, start_range-600),
		y: getRandomInt(-start_range+300, start_range+300)
	},
	captured_auth = null,
	uname = "Player",
	skins = {},
	blocks,
	d = 0,
	sprite_width = 34,
	sprite_height = 56,
	text_margin = sprite_height * 0.75,
	font_size = 9,
	water = [],
	chat_timeout = 6000,
	chat_ts = null,
	chat_style = { 
		font: "10px Arial", 
		fill: '#000000', 
		backgroundColor: 'rgba(255,255,255,0.9)',
		wordWrap: { width: 100, useAdvancedWrap: true } }




function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}



function normPoint(x, y) {
	return [x / (window.innerWidth / 2), y / (window.innerHeight / 2)]
}

function decodePoint(x, y) {
	return [x + (window.innerWidth / 2), y + (window.innerHeight / 2)]
}

function encodePoint(x, y) {
	return [x - (window.innerWidth / 2), y - (window.innerHeight / 2)]
}

function generateMap(n_blocks) {
	var mapTiles = [];

	for (var y = 0; y <= n_blocks; y++) {
		mapTiles.push([])
		for (var x = 0; x <= n_blocks; x++) {
			var tile = (y == n_blocks / 2 && x == n_blocks / 2) ? 3 : (y == 0 || x == 0 || y == n_blocks || x == n_blocks) ? 8 : 2;
			mapTiles[y].push(tile)
		}
	}

	return mapTiles;
}

function buildMap(game) {
	var tileTypes = ['water', 'sand', 'grass', 'stone', 'wood', 'watersand', 'grasssand', 'sandstone', 'bush1', 'bush2', 'mushroom', 'wall', 'window'];
	var tiles = [
		[-1, -1, -1, -1, -1, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 3, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 0, 0, 0, 3, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, -1, -1, -1, -1, -1],
		
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 4, 4, 4, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 2, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8],
		[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		[6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
		[5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];

	var blocks_size = 1920,
		
		tilewidth = 64,
		tileheight = 32,

		map_width = window.innerWidth,
		map_height = window.innerHeight,
		blocks_size_ratio = tiles[0].length/tiles.length,
		tileWidthHalf = tilewidth / 2,
		tileHeightHalf = tileheight / 2,
		mapwidth = map_width / tilewidth,
		mapheight = map_height / tileheight,
		n_blocks = Math.floor(blocks_size / tilewidth),
		//n_blocks_h = 
		centerX = (window.innerWidth / 2),
		centerY = ((window.innerHeight / 2) - ((n_blocks * tileheight) / 2)) + tileheight,
		i = 0

	generateMap(n_blocks)

	for (var y = 0; y < tiles.length; y++) {
		for (var x = 0; x < tiles[y].length; x++) {
			var tile_type = tileTypes[tiles[y][x]];

			if(tiles[y][x]!==null && tiles[y][x]>=0){
				var group = game.ground;
				if (blocks_size > window.innerWidth) {
					var tx = (x - y) * tileWidthHalf - ((blocks_size - window.innerWidth) / tilewidth);
				} else {
					var tx = (x - y) * tileWidthHalf;
				}
				//console.log(blocks_size_ratio)
				if (blocks_size/blocks_size_ratio > window.innerHeight) {
					var ty = ((x + y) * tileHeightHalf - ((blocks_size/blocks_size_ratio - window.innerHeight) / tileheight));
				} else {
					var ty = (x + y) * tileHeightHalf;
				}
				if (tile_type == 'bush1' || tile_type == 'water' || tile_type == 'bush2' || (y == 0 || x == 0 || y == n_blocks/blocks_size_ratio || x == n_blocks)) {
					group = game.blocks
				}
				if (tile_type == 'bush1') {
					ty = ty - 7;
				}


				var tile = group.create(centerX + tx, centerY + ty, 'tileset', tile_type);
				tile.depth = -9999;
				if (tile_type == 'bush1') {
					tile.setSize(64, 32).setOffset(0, 13)
					if (y == n_blocks/blocks_size_ratio || x == n_blocks) {
						var dc = encodePoint(0,tile.y - tileheight);
						tile.depth = dc[1];
					}

				}
				if (tiles[y][x] === 0) {
					tile.prev_y = tile.y
					water.push(tile);
				}
			}
			
			i++;
		}
	}

}



function move_player(d, pdata) {
	var sprite = pdata["player"],
		text =  pdata["text"],
		chat_bubble =   pdata["chat_bubble"]
	var move_coords = decodePoint(d.direction.cx, d.direction.cy)
	var is_moving = d.direction.y
	d.direction.x = move_coords[0]
	d.direction.y = move_coords[1]
	if (d.direction.d == "se" || d.direction.d == "ne") {
		sprite.flipX = true;
	} else {
		sprite.flipX = false;
	}

	if (is_moving !== 0) {
		if (d.direction.d == "se" || d.direction.d == "sw") {
			sprite.anims.play(d.skin + 'walk', true);
		} else {
			sprite.anims.play(d.skin + 'back_walk', true);
		}
	} else {
		if (d.direction.d == "se" || d.direction.d == "sw") {
			sprite.anims.play(d.skin + 'stand', true);
		} else {
			sprite.anims.play(d.skin + 'back_stand', true);
		}
	}

	sprite.setPosition(d.direction.x, d.direction.y);
	text.setPosition(d.direction.x - (text.width / 2), d.direction.y - text_margin);
	chat_bubble.setPosition(d.direction.x - (chat_bubble.width / 2),d.direction.y - sprite_height - chat_bubble.height);
	var dc = encodePoint(0,sprite.y);
	sprite.depth = dc[1];
	text.depth =  dc[1]

}


function preload() {
	this.load.atlas('tileset', map_files["map_png"], map_files["map_json"]);
	for (let i = 0; i < skin_files.length; i++) {
		this.load.spritesheet(skin_files[i]["name"],
			skin_files[i]["file"], {
				frameWidth: sprite_width,
				frameHeight: sprite_height
			});
		skins[skin_files[i]["name"]] = {}

	}
	g = this
	
	//game.input.enabled = false
	this.load.bitmapFont('font', font["font_png"], font["font_xml"]);
}
function wordWrap(str, maxWidth) {
	function testWhite(x) {
		return new RegExp(/^\s$/).test(x.charAt(0));
	};
    var newLineStr = "\n", done = false, res = '';
    do {                    
        var found = false;
        // Inserts new line at first whitespace of the line
        for (let i = maxWidth - 1; i >= 0; i--) {
            if (testWhite(str.charAt(i))) {
                res = res + [str.slice(0, i), newLineStr].join('');
                str = str.slice(i + 1);
                found = true;
                break;
            }
        }
        // Inserts new line at maxWidth position, the word is too long to wrap
        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }

        if (str.length < maxWidth)
            done = true;
    } while (!done);

    return res + str;
}
function create() {
	
	this.skin = skin_files[0]["name"]
	this.direction = {
		prev_x: 0,
		prev_y: 0,
		cx: 0,
		cy: 0,
		x: 0,
		y: 0,
		d: 'sw'
	}
	var player_coords_encoded = encodePoint(start.x, start.y)
	socket.emit('newplayer', {
		start: start,
		skin: this.skin,
		direction: this.direction
	});

	this.physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
	
	var player_coords = decodePoint(start.x, start.y)
	this.player = this.physics.add.sprite(player_coords[0], player_coords[1], this.skin)
		.setSize(20, 15)
		.setOffset((sprite_width - 20) / 2, sprite_height - 15)
	this.player.smoothed = false;
	this.player.setBounce(1);
	this.text = this.add.bitmapText(player_coords[0], player_coords[1], 'font', uname, font_size);


	/*
	WIP BITMAP TEXT CHAT
	this.graphics = this.add.graphics({ x: player_coords[0], y: player_coords[1], fillStyle: { color: 0xff00ff, alpha: 1 } });
	this.chat_bubble = this.add.bitmapText(player_coords[0], player_coords[1], 'font',  "Lorem ipsum dolor sit amet, consectetur adipiscing elit", font_size);
	this.chat_bubble_bounds = this.chat_bubble.getTextBounds(true);
	*/

	this.chat_bubble = this.add.text(this.player.x,this.player.y, "Lorem ipsum dolor sit amet, consectetur adipiscing elit", chat_style);
	this.chat_bubble.setPosition(this.player.x - (this.chat_bubble.width / 2), this.player.y - sprite_height - this.chat_bubble.height);
	this.chat_bubble.setPadding(8, 5);
	this.chat_bubble.setLineSpacing(-1);
	this.chat_bubble.setVisible(false);

	

	for (let i = 0; i < skin_files.length; i++) {
		for (let j = 0; j < skin_animations.length; j++) {
			this.anims.create({
				key: skin_files[i]["name"] + skin_animations[j]["name"],
				frames: !skin_animations[j]["animated"] ? [{
					key: skin_files[i]["name"],
					frame: skin_animations[j]["frames"][0]
				}] : this.anims.generateFrameNumbers(skin_files[i]["name"], {
					start: skin_animations[j]["frames"][0],
					end: skin_animations[j]["frames"][1]
				}),

				frameRate: frameRate,
			});
		}

	}

	this.player.anims.play(this.skin + 'stand', true);
	if (captured_auth != null) {
		socket.emit('updateplayer', captured_auth);
	}

	this.blocks = this.physics.add.staticGroup();
	this.ground = this.physics.add.staticGroup();

	buildMap(this);

	this.physics.add.collider(this.player, this.blocks);
	//this.physics.enable(this.player, Phaser.Physics.ARCADE);
	
	//this.physics.enable([this.player, this.blocks], Phaser.Physics.ARCADE);


	this.cameras.main.startFollow(this.player);
	//this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
	//this.input.keyboard.removeKeyCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
	
	
}

function update() {
	var cursors = this.input.keyboard.createCursorKeys();
	if (this.shift.isDown) {
		speed = 600
	} else {
		speed = default_speed
	}

	/*if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
		var pl = this.player,
			duration = 200,
			grav = 5000
		//this.player.body.velocity.y = this.direction.y * speed * 0.5;
		pl.body.gravity.set(0, -grav);
		setTimeout(function() {
			pl.body.gravity.set(0, grav);
			setTimeout(function() {
				pl.body.gravity.set(0, 0);
			}, duration);
		}, duration);


	}*/


	if (this.direction.d == "se" || this.direction.d == "ne") {
		this.player.flipX = true;
	} else {
		this.player.flipX = false;
	}

	if (cursors.left.isDown) {
		this.direction.x = -1
		this.direction.y = -1
		this.direction.d = "nw"

	} else if (cursors.right.isDown) {
		this.direction.x = 1
		this.direction.y = 1

		this.direction.d = "se"

	} else if (cursors.up.isDown) {
		this.direction.x = 1
		this.direction.y = -1
		this.direction.d = "ne"

	} else if (cursors.down.isDown) {

		this.direction.x = -1
		this.direction.y = 1
		this.direction.d = "sw"
	} else {
		this.direction.x = 0
		this.direction.y = 0
		this.player.body.velocity.y = 0;
		this.player.body.velocity.x = 0;
	}
	if (this.direction.d == "se" || this.direction.d == "ne") {
		this.player.flipX = true;
	} else {
		this.player.flipX = false;
	}


	if (this.direction.y !== 0) {
		if (this.direction.d == "se" || this.direction.d == "sw") {
			this.player.anims.play(this.skin + 'walk', true);
		} else {
			this.player.anims.play(this.skin + 'back_walk', true);
		}
		this.x += this.direction.x * speed;
		this.y += this.direction.y * speed;
		this.player.body.velocity.x = this.direction.x * speed
		this.player.body.velocity.y = this.direction.y * speed * 0.5;
	} else {
		if (this.direction.d == "se" || this.direction.d == "sw") {
			this.player.anims.play(this.skin + 'stand', true);
		} else {
			this.player.anims.play(this.skin + 'back_stand', true);
		}
		var u = p
		var move_coords = encodePoint(this.player.x, this.player.y)
		u.direction = this.direction
		u.direction.y = 0
		u.direction.cx = move_coords[0]
		u.direction.cy = move_coords[1]
		socket.emit('move', u);
	}

	if (this.direction.prev_x != this.player.x || this.direction.prev_y != this.player.y) {
		this.direction.prev_x = this.player.x
		this.direction.prev_y = this.player.y
		this.text.setPosition(this.direction.prev_x - (this.text.width / 2), this.direction.prev_y - text_margin);
		this.chat_bubble.setPosition(this.direction.prev_x- (this.chat_bubble.width / 2), this.direction.prev_y - sprite_height - this.chat_bubble.height);
		//this.chat_bubble.x = this.direction.prev_x - (this.text.width / 2)
		//this.chat_bubble.y = this.direction.prev_y - text_margin
		var u = p

		var move_coords = encodePoint(this.player.x, this.player.y)
		u.direction = this.direction
		u.direction.cx = move_coords[0]
		u.direction.cy = move_coords[1]
		socket.emit('move', u);
		var dc = encodePoint(0,this.player.y);
		this.player.depth = dc[1];
		this.text.depth = dc[1];
		this.chat_bubble.depth =  dc[1];
	}

	water.forEach(function (w) {
		w.z = (-2 * Math.sin((g.time.now + (w.x * 7)) * 0.004)) + (-1 * Math.sin((g.time.now + (w.y * 8)) * 0.005));
		w.alpha = Phaser.Math.Clamp(1 + (w.z * 0.1), 0.98, 1);
		
		w.y = w.prev_y+(3*w.z * 0.1)
		
	});

}


class PhaserGame extends Phaser.Game {
	constructor() {
		const config = {
			type: Phaser.AUTO,
			parent: 'game-container',
			width: window.innerWidth,
			height: window.innerHeight,
			zoom: 1,
			pixelArt: true,
			antialias: false,
			physics: {
				default: 'arcade',
				arcade: {
					//debug: true,
				}
			},
			scene: {
				preload: preload,
				create: create,
				update: update
			}
		};
		super(config);
	}

	
	newUser(data) {
		if (p["uid"] != data["uid"]) {
			players[data["uid"]] = {
				player: g.physics.add.sprite(data.direction.prev_x, data.direction.prev_y, skin_files[0]["name"]),
				text: g.add.bitmapText(data.direction.prev_x, data.direction.prev_y, 'font', data["twitch_name"], font_size),
				chat_bubble: g.add.text(data.direction.prev_x,data.direction.prev_y, "Lorem ipsum dolor sit amet, consectetur adipiscing elit", chat_style),
				chat_ts: null
			}
			players[data["uid"]]["chat_bubble"].setPadding(8, 5);
			players[data["uid"]]["chat_bubble"].setLineSpacing(-1);
			players[data["uid"]]["chat_bubble"].setVisible(false);
			try {
				move_player(data, players[data["uid"]])
			} catch (err) {
				console.log(err)
			}
		}


	}
	moveUser(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			move_player(data, players[data["uid"]])
		}
	}
	updateUser(data) {
		//console.log("updateUser")
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			//console.log(data["twitch_name"]);
			players[data["uid"]]["text"].setText(data["twitch_name"]);
			players[data["uid"]]["text"].setPosition(players[data["uid"]]["player"].x - (players[data["uid"]]["text"].width / 2), players[data["uid"]]["text"].y);
		}
	}

	updateSkin(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			players[data["uid"]]["skin"] = data["skin"]
			players[data["uid"]]["player"].setTexture(players[data["uid"]]["skin"], 0);
		}

	}
	chatMessage(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			players[data["uid"]]["chat_bubble"].setText(data.message);
			players[data["uid"]]["chat_bubble"].setPosition(players[data["uid"]]["player"].x - (players[data["uid"]]["chat_bubble"].width / 2),players[data["uid"]]["player"].y - sprite_height - players[data["uid"]]["chat_bubble"].height);
			players[data["uid"]]["chat_bubble"].setVisible(true);
			clearTimeout(players[data["uid"]]["chat_ts"]);
			setTimeout(function(){
				players[data["uid"]]["chat_bubble"].setVisible(false);
			}, chat_timeout)
		}

	}
}

var game

const MmoGame = function(game) {
	var t = this,
		c = {}
	this.init = function(s) {

		socket = s
		game = new PhaserGame();
		/*game.onBlur.add(function() {

			game.input.keyboard.enabled = false;
		
		});
		
		game.onFocus.add(function() {
		
			game.input.keyboard.enabled = true;
		
		});*/
		socket.on("connected", function(data) {
			p = {
				"uid": data["uid"]
			}
			for (let i = 0; i < data["players"].length; i++) {
				players[data["uid"]] = data["players"][i]
				game.newUser(players[data["uid"]])
			}

		});

		socket.on("newplayer", function(data) {
			console.log("New Player!")
			players[data["uid"]] = data
			game.newUser(data)

		});
		socket.on('updateself', function(data) {
			uname = data["twitch_name"]
			g.text.setText(uname);
			g.text.setPosition(g.player.x - (g.text.width / 2), g.text.y);
		});

		socket.on('updateplayer', game.updateUser);
		socket.on('updatename', game.updateUser);

		socket.on('updateskin', game.updateSkin);

		socket.on('move', game.moveUser);
		socket.on('remove', function(data) {
			if (p["uid"] != data["uid"] && players.hasOwnProperty(data["uid"])) {
				players[data["uid"]]["player"].setActive(false);
				players[data["uid"]]["player"].setVisible(false);
				players[data["uid"]]["text"].setActive(false);
				players[data["uid"]]["text"].setVisible(false);
				players[data["uid"]]["chat_bubble"].setActive(false);
				players[data["uid"]]["chat_bubble"].setVisible(false);
			}
		});

		socket.on('disconnect', function(data) {
			// Add connection sprite, change to red/disconnected 
		});

		socket.on('sendChat', game.chatMessage);



	}
	this.setPlayer = function(auth) {
		//console.log("setting name...")
		socket.emit('updateplayer', auth);
		captured_auth = auth
	}
	this.getSkins = function() {
		return skin_files;
	}
	this.setSkin = function(skin) {
		g.skin = skin;
		g.player.setTexture(g.skin, 0);
		socket.emit('updateskin', g.skin);
	}
	this.sendChat = function(t) {
		g.t = t;
		//g.player.setTexture(g.skin, 0);
		g.chat_bubble.setText(t);
		g.chat_bubble.setPosition(g.player.x - (g.chat_bubble.width / 2),g.player.y - sprite_height - g.chat_bubble.height);
		g.chat_bubble.setVisible(true);
		clearTimeout(chat_ts);
		setTimeout(function(){
			g.chat_bubble.setVisible(false);
		}, chat_timeout)

		socket.emit('sendChat', t);
	}


}

export const Mmo = new MmoGame(game);
