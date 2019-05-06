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
var config = require('../config');

const socket = io('http://'+config.server_host+':'+config.server_port+'/');
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
	start = {
		x: 153,
		y: 70
	},
	text_margin = 25,
	captured_auth = null,
	uname = "Player",
	skins = {},
	blocks,
	d = 0,
	tileWidthHalf,
	tileHeightHalf,
	water = [],
	skin_id = 0;

var skin_files = [{
		"name": "player_01",
		"file": player01
	},
	{
		"name": "player_02",
		"file": player02
	},
	{
		"name": "player_03",
		"file": player03
	},
]

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function preload() {
	this.load.atlas('tileset', mapPng, mapJSON);
	for (let i = 0; i < skin_files.length; i++) {
		this.load.spritesheet(skin_files[i]["name"],
			skin_files[i]["file"], {
				frameWidth: 32,
				frameHeight: 44
			});
		skins[skin_files[i]["name"]] = {}

	}

	g = this

	start.x = window.innerWidth/2
	start.y = window.innerHeight/2

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

	this.player = this.physics.add.sprite(start.x, start.y, this.skin)
		.setSize(20, 15)
		.setOffset((32-20)/2, 44-15)  
	this.text = this.add.text(start.x, start.y, uname, style)

	for (let i = 0; i < skin_files.length; i++) {
		this.anims.create({
			key: skin_files[i]["name"]+'stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 3
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: skin_files[i]["name"]+'back_stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 0
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: skin_files[i]["name"]+'walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 3,
				end: 5
			}),
			frameRate: frameRate,
			repeat: -1
		});
		this.anims.create({
			key: skin_files[i]["name"]+'back_walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 0,
				end: 2
			}),
			frameRate: frameRate,
			repeat: -1
		});
	}

	this.player.anims.play(this.skin+'stand', true);
	if (captured_auth != null) {
		socket.emit('updateplayer', captured_auth);
	}

	this.blocks = this.physics.add.staticGroup();
	this.ground = this.physics.add.staticGroup();

	buildBlocks(this);

	this.physics.add.collider(this.player, this.blocks);


	this.cameras.main.startFollow(this.player);
	this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
	this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
}

function buildBlocks(game) {
	var tileArray = [];
	tileArray[0] = 'water';
	tileArray[1] = 'sand';
	tileArray[2] = 'grass';
	tileArray[3] = 'stone';
	tileArray[4] = 'wood';
	tileArray[5] = 'watersand';
	tileArray[6] = 'grasssand';
	tileArray[7] = 'sandstone';
	tileArray[8] = 'bush1';
	tileArray[9] = 'bush2';
	tileArray[10] = 'mushroom';
	tileArray[11] = 'wall';
	tileArray[12] = 'window';

	var tiles = [
		9, 2, 1, 1, 4, 4, 1, 6, 2, 10, 2,
		2, 6, 1, 0, 4, 4, 0, 0, 2, 2, 2,
		6, 1, 0, 0, 4, 4, 0, 0, 8, 8, 2,
		0, 0, 0, 0, 4, 4, 0, 0, 0, 9, 2,
		0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0,
		11, 11, 12, 11, 3, 3, 11, 12, 11, 11, 11,
		3, 7, 3, 3, 3, 3, 3, 3, 7, 3, 3,
		7, 1, 7, 7, 3, 3, 7, 7, 1, 1, 7
	];

	var tilewidth = 64,
		tileheight = 32,
		map_width = window.innerWidth*1.25,
		map_height = window.innerHeight
	tileWidthHalf = tilewidth / 2;
	tileHeightHalf = tileheight / 2;
	var mapwidth = map_width/tilewidth;
	  var mapheight = map_height/tileheight;
	  var blocks_size = 1200;
	  var n_blocks = Math.floor(blocks_size/tilewidth);
	var i = 0, tile;
	var centerX = mapwidth*tileWidthHalf;
  	var centerY = tileHeightHalf
	var shape = new Phaser.Geom.Rectangle(0, 0, 64, 32);
	for (var y = 0; y <= n_blocks; y++) {
		for (var x = 0; x <= n_blocks; x++) {
			console.log(x, y)
			console.log(n_blocks)
			var tile_type = y==0 || x==0 || y==n_blocks || x==n_blocks ? 'bush1' : 'grass';
			var group = game.ground;
			var tx = (x - y) * tileWidthHalf - (blocks_size-window.innerWidth);
			var ty = (x + y) * tileHeightHalf + (blocks_size-window.innerHeight)/tileHeightHalf;
			if(tile_type=='bush1') {
				
				ty = ty - 7;
				group = game.blocks
			}
			tile = group.create(centerX + tx, centerY + ty, 'tileset', tile_type);
			tile.depth = -100;
			if(tile_type=='bush1') {
				tile.setSize(64, 32).setOffset(0, 13)  
				if(y==n_blocks || x==n_blocks) {
					tile.depth = tile.y-tileheight;
				}
				
			}
			if (tiles[i] === 0) {
				water.push(tile);
			}
			i++;
		}
	}
//},
}

function move_player(d, sprite, text) {

	if (d.direction.d == "se" || d.direction.d == "ne") {
		sprite.flipX = true;
	} else {
		sprite.flipX = false;
	}

	if (d.direction.y !== 0) {
		if (d.direction.d == "se" || d.direction.d == "sw") {
			sprite.anims.play(d.skin+'walk', true);
		} else {
			sprite.anims.play(d.skin+'back_walk', true);
		}
	} else {
		if (d.direction.d == "se" || d.direction.d == "sw") {
			sprite.anims.play(d.skin+'stand', true);
		} else {
			sprite.anims.play(d.skin+'back_stand', true);
		}
	}

	sprite.setPosition(d.direction.prev_x, d.direction.prev_y);
	text.setPosition(d.direction.prev_x - (text.width / 2), d.direction.prev_y - text_margin);
	sprite.depth = sprite.y;
	text.depth = sprite.y;
	
}

function update() {
	var cursors = this.input.keyboard.createCursorKeys();
	if (this.shift.isDown) {
		speed = 160
	}
	else {
		speed = default_speed
	}
	if (Phaser.Input.Keyboard.JustDown(this.spacebar))
    {
		skin_id++;
		if (skin_id>=skin_files.length) {
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
			this.player.anims.play(this.skin+'walk', true);
		} else {
			this.player.anims.play(this.skin+'back_walk', true);
		}
		this.x += this.direction.x * speed;
		this.y += this.direction.y * speed;
		this.player.body.velocity.x = this.direction.x * speed
		this.player.body.velocity.y = this.direction.y * speed * 0.5;
	} else {
		if (this.direction.d == "se" || this.direction.d == "sw") {
			this.player.anims.play(this.skin+'stand', true);
		} else {
			this.player.anims.play(this.skin+'back_stand', true);
		}
	}

	if (this.direction.prev_x != this.player.x || this.direction.prev_y != this.player.y) {
		this.direction.prev_x = this.player.x
		this.direction.prev_y = this.player.y
		this.text.setPosition(this.direction.prev_x - (this.text.width / 2), this.direction.prev_y - text_margin);
		var u = p
		u.direction = this.direction
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
			move_player(data, players[data["uid"]]["player"], players[data["uid"]]["text"])
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
	// Move the rest of socket events to mmo functions
}

const game = new PhaserGame(game);

const MmoGame = function () {
	var t = this;
	this.setPlayer = function (auth) {
		console.log("Sending Auth...")
		socket.emit('updateplayer', auth);
		captured_auth = auth
	}
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


export const Mmo = new MmoGame(game);