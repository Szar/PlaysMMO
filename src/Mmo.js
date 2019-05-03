import React from "react"
import ReactDOM from "react-dom"
import App from "./components/App/App"
import Phaser, {
	Game,
	Scene
} from 'phaser';
import io from 'socket.io-client';
import mapImg from "../assets/sprites/maps/DS DSi - Digimon World DS - Digi-Farm Default.png";
import statusImg from "../assets/sprites/maps/DS DSi - Digimon World DS - Digi-Farm Default.png";
import player01 from "../assets/sprites/players/01.png";
import player02 from "../assets/sprites/players/02.png";

const socket = io('http://localhost:8000/');
var style = {
	font: "8px Arial",
	fill: "#ffffff",
	wordWrap: true,
	wordWrapWidth: 32,
	align: "center",
	backgroundColor: "#000000"
};
var players = {},
	speed = 100,
	p = {},
	g,
	start = {
		x: 128,
		y: 128
	},
	text_margin = 25,
	captured_auth = null,
	uname = "Player",
	skins = {}
var skin_files = [{
		"name": "player_01",
		"file": player01
	},
	{
		"name": "player_02",
		"file": player02
	},
]

function preload() {
	this.load.image('map', mapImg);
	for (let i = 0; i < skin_files.length; i++) {
		this.load.spritesheet(skin_files[i]["name"],
			skin_files[i]["file"], {
				frameWidth: 32,
				frameHeight: 44
			});
		skins[skin_files[i]["name"]] = {}

	}

	g = this

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
	this.physics.world.setBounds(0, 0, 800, 600);
	this.add.image(800 / 2, 600 / 2, 'map')
	this.player = this.physics.add.sprite(start.x, start.y, 'player_01', this.isoGroup)
	this.text = this.add.text(start.x, start.y, uname, style)
	this.player.setCollideWorldBounds(true);



	for (let i = 0; i < skin_files.length; i++) {
		this.anims.create({
			key: 'stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 3
			}],
			frameRate: 5,
		});
		this.anims.create({
			key: 'back_stand',
			frames: [{
				key: skin_files[i]["name"],
				frame: 0
			}],
			frameRate: 5,
		});
		this.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 3,
				end: 5
			}),
			frameRate: 5,
			repeat: -1
		});
		this.anims.create({
			key: 'back_walk',
			frames: this.anims.generateFrameNumbers(skin_files[i]["name"], {
				start: 0,
				end: 2
			}),
			frameRate: 5,
			repeat: -1
		});
	}
	//this.load.spritesheet(skin_files[i]["name"],

	this.player.anims.play('stand', true);
	if (captured_auth != null) {
		socket.emit('updateplayer', captured_auth);
	}

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


}

function update() {
	var cursors = this.input.keyboard.createCursorKeys();

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
		this.player.body.velocity.x = this.direction.x * speed * 0.5;
		this.player.body.velocity.y = this.direction.y * speed * 0.3;
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
	}

}



class PhaserGame extends Phaser.Game {
	constructor() {
		const config = {
			type: Phaser.AUTO,
			parent: 'game-container',
			width: 800,
			height: 600,
			zoom: 2,
			pixelArt: true,
			physics: {
				default: 'arcade',
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
				player: g.physics.add.sprite(data.direction.prev_x, data.direction.prev_y, 'player_01', this.isoGroup),
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