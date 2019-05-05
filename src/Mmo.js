import React from "react"
import ReactDOM from "react-dom"
import App from "./components/App/App"
import Phaser, {
	Game,
	Scene
} from 'phaser';
import io from 'socket.io-client';
import mapImg from "../assets/sprites/maps/map_01.png";
//import statusImg from "../assets/sprites/maps/01.png";
import player01 from "../assets/sprites/players/01.png";
import player02 from "../assets/sprites/players/02.png";
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
	water = []

var skin_files = [{
		"name": "player_01",
		"file": player01
	},
	{
		"name": "player_02",
		"file": player02
	},
]

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function preload() {
	//this.load.json('tileset', mapJSON);
	this.load.atlas('tileset', mapPng, mapJSON);
	//this.load.image('map', mapImg);
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
	socket.emit('newplayer', {
		start: start,
	});
	this.direction = {
		prev_x: 0,
		prev_y: 0,
		x: 0,
		y: 0,
	}
	this.physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);
	//this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'map')
	this.player = this.physics.add.sprite(start.x, start.y, 'player_01')
		.setSize(20, 15)
		.setOffset((32-20)/2, 44-15)  
	this.text = this.add.text(start.x, start.y, uname, style)
	//this.player.setCollideWorldBounds(true);
	for (let i = 0; i < skin_files.length; i++) {
		this.anims.create({
			key: 'stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 3
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: 'back_stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 0
			}],
			frameRate: frameRate,
		});
		this.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 3,
				end: 5
			}),
			frameRate: frameRate,
			repeat: -1
		});
		this.anims.create({
			key: 'back_walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 0,
				end: 2
			}),
			frameRate: frameRate,
			repeat: -1
		});
	}
	//this.load.spritesheet(skin_files[i]["name"],

	this.player.anims.play('stand', true);
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
			// this bit would've been so much cleaner if I'd ordered the tileArray better, but I can't be bothered fixing it :P
			//tile = game.add.isoSprite(x, y, tileArray[tiles[i]].match("water") ? 0 : game.rnd.pick([2, 3, 4]), 'tileset', tileArray[tiles[i]], isoGroup);
			//tile = blocks.create(x, y, tileArray[tiles[i]].match("water") ? 0 : game.rnd.pick([2, 3, 4]), 'tileset', tileArray[tiles[i]]);
			//tile.anchor.set(0.5, 1);
			//tile.smoothed = false;
			//tile.body.moves = false;
			//console.log(tileArray[tiles[i]].match("water") ? 0 : getRandomInt(2,4))
			// 38 64
			var tx = (x - y) * tileWidthHalf - (blocks_size-window.innerWidth);
			var ty = (x + y) * tileHeightHalf + (blocks_size-window.innerHeight)/tileHeightHalf;
			if(tile_type=='bush1') {
				
				ty = ty - 7;
				group = game.blocks
			}
			tile = group.create(centerX + tx, centerY + ty, 'tileset', tile_type); //tileArray[tiles[i]]
			tile.depth = -100;
			if(tile_type=='bush1') {
				tile.setSize(64, 32).setOffset(0, 13)   //
				if(y==n_blocks || x==n_blocks) {
					tile.depth = tile.y-tileheight;
				}
				
			}
			
			/*if(tile_type=='bush1') {
				var w = game.blocks.create(centerX + tx, centerY + ty, null, null);
				w.body.width = 64;
                w.body.height = 32;
			}*/
			//tile = game.add.image(centerX + tx, centerY + ty, 'tileset', tileArray[tiles[i]]);
			//tile = game.physics.add.sprite(x, y, , 'tileset', tileArray[tiles[i]]),
			//tile = game.physics.add.image(x, y, tileArray[tiles[i]].match("water") ? 0 : getRandomInt(2,4), 'tileset', tileArray[tiles[i]]),
			//tile.depth = y-tileHeightHalf*2;
			/*if (tiles[i] === 4) {
				tile.isoZ += 6;
			}
			if (tiles[i] <= 10 && (tiles[i] < 5 || tiles[i] > 6)) {
				tile.scale.x = game.rnd.pick([-1, 1]);
			}
			*/
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
			sprite.anims.play('walk', true);
		} else {
			sprite.anims.play('back_walk', true);
		}
	} else {
		if (d.direction.d == "se" || d.direction.d == "sw") {
			sprite.anims.play('stand', true);
		} else {
			sprite.anims.play('back_stand', true);
		}
	}
	console.log("=== MOVING USER ===")
	console.log(d)
	sprite.setPosition(d.direction.prev_x, d.direction.prev_y);
	//text.x = d.direction.prev_x
	//text.y = d.direction.prev_y
	text.setPosition(d.direction.prev_x - (text.width / 2), d.direction.prev_y - text_margin);
	sprite.depth = sprite.y;
	text.depth = sprite.y;
	
}

function update() {
	var cursors = this.input.keyboard.createCursorKeys();
	if (this.shift.isDown) {
		speed = 200
	}
	else {
		speed = default_speed
	}
	if (Phaser.Input.Keyboard.JustDown(this.spacebar))
    {
		this.player.setTexture('player_02', 0);
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
			this.player.anims.play('walk', true);
		} else {
			this.player.anims.play('back_walk', true);
		}
		this.x += this.direction.x * speed;
		this.y += this.direction.y * speed;
		this.player.body.velocity.x = this.direction.x * speed
		this.player.body.velocity.y = this.direction.y * speed * 0.5;
	} else {
		if (this.direction.d == "se" || this.direction.d == "sw") {
			this.player.anims.play('stand', true);
		} else {
			this.player.anims.play('back_stand', true);
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
					//gravity: { y: 200 }
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