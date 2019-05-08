import React from "react"
import ReactDOM from "react-dom"
import App from "./components/App/App"
import Phaser, {
	Game,
	Scene
} from 'phaser';
import io from 'socket.io-client';
import mapImg from "../assets/sprites/maps/map_01.png";
import player01 from "../assets/sprites/players/01.png";
import player02 from "../assets/sprites/players/02.png";
import player03 from "../assets/sprites/players/03.png";
import mapJSON from "../assets/tilesets/tileset.json";
import mapPng from "../assets/tilesets/tileset.png";
import {
	encode
} from "iconv-lite";
var config = require('../config');

var socket
var style = {
	font: "8px Arial",
	fill: "#ffffff",
	wordWrap: true,
	wordWrapWidth: 32,
	align: "center",
	backgroundColor: "#000000"
};
var players = {},
	default_speed = 100,
	speed = default_speed,
	frameRate = 7,
	p = {},
	g,
	start_range = 30,
	start = {
		x: getRandomInt(-start_range, start_range),
		y: getRandomInt(-start_range, start_range)
	},
	text_margin = 25,
	captured_auth = null,
	uname = "Player",
	skins = {},
	blocks,
	d = 0,
	skin_id = 0;

var skin_files = [{
		"name": "player_01",
		"file": player01,
		"title": "Flamedramon",
	},
	{
		"name": "player_02",
		"file": player02,
		"title": "Gabumon",
	},
	{
		"name": "player_03",
		"file": player03,
		"title": "Kuwagamon",
	},
]

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
		[8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
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
		tileWidthHalf = tilewidth / 2,
		tileHeightHalf = tileheight / 2,
		mapwidth = map_width / tilewidth,
		mapheight = map_height / tileheight,
		n_blocks = Math.floor(blocks_size / tilewidth),
		centerX = (window.innerWidth / 2),
		centerY = ((window.innerHeight / 2) - ((n_blocks * tileheight) / 2)) + tileheight,
		i = 0;

	generateMap(n_blocks)

	for (var y = 0; y < tiles.length; y++) {
		for (var x = 0; x < tiles[y].length; x++) {
			var tile_type = tileTypes[tiles[y][x]];

			var group = game.ground;
			if (blocks_size > window.innerWidth) {
				var tx = (x - y) * tileWidthHalf - ((blocks_size - window.innerWidth) / tilewidth);
			} else {
				var tx = (x - y) * tileWidthHalf;
			}
			if (blocks_size > window.innerHeight) {
				var ty = ((x + y) * tileHeightHalf - ((blocks_size - window.innerHeight) / tileheight));
			} else {
				var ty = (x + y) * tileHeightHalf;
			}
			if (tile_type == 'bush1' || tile_type == 'water' || tile_type == 'bush2' || (y == 0 || x == 0 || y == n_blocks || x == n_blocks)) {
				group = game.blocks
			}
			if (tile_type == 'bush1') {
				ty = ty - 7;
			}


			var tile = group.create(centerX + tx, centerY + ty, 'tileset', tile_type);
			tile.depth = -100;
			if (tile_type == 'bush1') {
				tile.setSize(64, 32).setOffset(0, 13)
				if (y == n_blocks || x == n_blocks) {
					tile.depth = tile.y - tileheight;
				}

			}
			i++;
		}
	}

}

function move_player(d, sprite, text) {
	var move_coords = decodePoint(d.direction.cx, d.direction.cy)
	d.direction.x = move_coords[0]
	d.direction.y = move_coords[1]
	if (d.direction.d == "se" || d.direction.d == "ne") {
		sprite.flipX = true;
	} else {
		sprite.flipX = false;
	}

	if (d.direction.y !== 0) {
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
	sprite.depth = sprite.y;
	text.depth = sprite.y;

}


function preload() {
	this.load.atlas('tileset', mapPng, mapJSON);
	for (let i = 0; i < skin_files.length; i++) {
		this.load.spritesheet(skin_files[i]["name"],
			skin_files[i]["file"], {
				frameWidth: 34,
				frameHeight: 44
			});
		skins[skin_files[i]["name"]] = {}

	}
	g = this
	var decoded = decodePoint(start.x, start.y)
}

function create() {
	this.skin = skin_files[skin_id]["name"]
	socket.emit('newplayer', {
		start: start,
		skin: this.skin
	});

	this.direction = {
		prev_x: 0,
		prev_y: 0,
		x: 0,
		y: 0,
	}
	this.physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
	var player_coords = decodePoint(start.x, start.y)
	this.player = this.physics.add.sprite(player_coords[0], player_coords[1], this.skin)
		.setSize(20, 15)
		.setOffset((32 - 20) / 2, 44 - 15)
	this.player.smoothed = false;
	this.text = this.add.text(start.x, start.y, uname, style)

	for (let i = 0; i < skin_files.length; i++) {
		this.anims.create({
			key: skin_files[i]["name"] + 'stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 3
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: skin_files[i]["name"] + 'back_stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 0
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: skin_files[i]["name"] + 'walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 3,
				end: 5
			}),
			frameRate: frameRate,
			repeat: -1
		});
		this.anims.create({
			key: skin_files[i]["name"] + 'back_walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 0,
				end: 2
			}),
			frameRate: frameRate,
			repeat: -1
		});
	}

	this.player.anims.play(this.skin + 'stand', true);
	if (captured_auth != null) {
		socket.emit('updateplayer', captured_auth);
	}

	this.blocks = this.physics.add.staticGroup();
	this.ground = this.physics.add.staticGroup();

	buildMap(this);

	this.physics.add.collider(this.player, this.blocks);


	this.cameras.main.startFollow(this.player);
	this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
}

function update() {
	var cursors = this.input.keyboard.createCursorKeys();
	if (this.shift.isDown) {
		speed = 160
	} else {
		speed = default_speed
	}
	if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
		skin_id++;
		if (skin_id >= skin_files.length) {
			skin_id = 0;
		}
		this.skin = skin_files[skin_id]["name"];
		this.player.setTexture(this.skin, 0);
		socket.emit('updateskin', this.skin);

	}
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
	}

	if (this.direction.prev_x != this.player.x || this.direction.prev_y != this.player.y) {
		this.direction.prev_x = this.player.x
		this.direction.prev_y = this.player.y
		this.text.setPosition(this.direction.prev_x - (this.text.width / 2), this.direction.prev_y - text_margin);
		var u = p

		var move_coords = encodePoint(this.player.x, this.player.y)
		u.direction = this.direction
		u.direction.cx = move_coords[0]
		u.direction.cy = move_coords[1]
		socket.emit('move', u);
		this.player.depth = this.player.y;
		this.text.depth = this.player.y;
	}

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
				player: g.physics.add.sprite(data.direction.prev_x, data.direction.prev_y, 'player_01'),
				text: g.add.text(data.direction.prev_x, data.direction.prev_y, data["twitch_name"], style)
			}
			try {
				move_player(data, players[data["uid"]]["player"], players[data["uid"]]["text"])
			} catch (err) {
				console.log(err)
			}
		}


	}
	moveUser(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			move_player(data, players[data["uid"]]["player"], players[data["uid"]]["text"])
		}
	}
	updateUser(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			players[data["uid"]]["text"].setText(data["twitch_name"]);
		}
	}

	updateSkin(data) {
		if (players.hasOwnProperty(data["uid"]) && p.hasOwnProperty("uid") && p["uid"] != data["uid"]) {
			players[data["uid"]]["skin"] = data["skin"]
			players[data["uid"]]["player"].setTexture(players[data["uid"]]["skin"], 0);
		}

	}
}

var game

const MmoGame = function (game) {
	var t = this,
		c = {}
	this.init = function (s) {

		socket = s
		game = new PhaserGame(game);
		socket.on("connected", function (data) {
			p = {
				"uid": data["uid"]
			}
			for (let i = 0; i < data["players"].length; i++) {
				players[data["uid"]] = data["players"][i]
				game.newUser(players[data["uid"]])
			}

		});

		socket.on("newplayer", function (data) {
			players[data["uid"]] = data
			game.newUser(data)

		});
		socket.on('updateself', function (data) {
			uname = data["twitch_name"]
			g.text.setText(uname);
		});

		socket.on('updateplayer updatename', game.updateUser);

		socket.on('updateskin', game.updateSkin);

		socket.on('move', game.moveUser);
		socket.on('remove', function (data) {
			console.log(data)
			if (p["uid"] != data["uid"] && players.hasOwnProperty(data["uid"])) {
				players[data["uid"]]["player"].setActive(false);
				players[data["uid"]]["player"].setVisible(false);
				players[data["uid"]]["text"].setActive(false);
				players[data["uid"]]["text"].setVisible(false);
			}
		});

		socket.on('disconnect', function (data) {
			// Add connection sprite, change to red/disconnected 
		});



	}
	this.setPlayer = function (auth) {
		console.log("Sending Auth...")
		socket.emit('updateplayer', auth);
		captured_auth = auth
	}
	this.getSkins = function() {
		console.log(skin_files)
		return skin_files;
	}
	this.setSkin = function(skin) {
		console.log(skin)
		g.skin = skin;
		g.player.setTexture(g.skin, 0);
		socket.emit('updateskin', g.skin);
	}

}


export const Mmo = new MmoGame(game);