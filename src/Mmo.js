import Phaser from 'phaser';
import './style.css';
import { assets } from './Assets';
import { map } from './Map';
import { encodePoint, decodePoint, getRandomInt } from './Utils';
import cursor from "./assets/sprites/cursor.png";
import io from 'socket.io-client';
const config = require('./Config');
export const socket = io('https://' + config.server.host + ":" + config.server.port + '/');

var game;


var loadAnimations = function(game) {
	for (let i = 0; i < assets["skins"]["files"].length; i++) {
		for (let j = 0; j < assets["skins"]["animations"].length; j++) {
			game.anims.create({
				key: assets["skins"]["files"][i]["name"] + assets["skins"]["animations"][j]["name"],
				frames: !assets["skins"]["animations"][j]["animated"] ? [{
					key: assets["skins"]["files"][i]["name"],
					frame: assets["skins"]["animations"][j]["frames"][0]
				}] : game.anims.generateFrameNumbers(assets["skins"]["files"][i]["name"], {
					start: assets["skins"]["animations"][j]["frames"][0],
					end: assets["skins"]["animations"][j]["frames"][1]
				}),
				frameRate: 7,
			});
		}
	}
}

class Player extends Phaser.GameObjects.Sprite {
	constructor(conf) {
		
		super(conf.scene, conf.x, conf.y, conf.skin);
		for (var k in conf) {
			this[k] = conf[k]
		}
		
		this.scene = conf.scene;
		this.scene.physics.world.enable(this);
		this.scene.add.existing(this);
		this.smoothed = false;
		this.animate("stand")

		this.text = this.scene.add.bitmapText(conf.x, conf.y, config.font.default, this.name, config.font.size)
		
		this.chat = this.scene.add.text(conf.x, conf.y, "Lorem ipsum dolor sit amet, consectetur adipiscing elit", { 
			font: "10px Arial", 
			fill: '#000000', 
			backgroundColor: 'rgba(255,255,255,0.9)',
			wordWrap: { width: 130, useAdvancedWrap: true } 
		});
		this.chat.setPadding(8, 5);
		this.chat.setLineSpacing(-1);
		this.chat.setVisible(false);

		this.depth = conf.depth
		this.direction = "sw"
		this.moveText(conf.x, conf.y, conf.depth)

	}
	
	animate(a) {
		this.anims.play(this.skin + a, true);
	}
	moveText(x, y, depth){
		this.text.setPosition(x-(this.text.width / 2), y-(config.sprite.height/2)-(this.text.height));
		this.text.depth = depth

		this.chat.setPosition(x-(this.chat.width / 2), y-(config.sprite.height/2)-(this.text.height+this.chat.height)-7);
		this.chat.depth = depth
	}
	move(x, y, d, m) {
		var animation = m ? d == "se" || d == "sw" ? 'walk' : 'back_walk' : d == "se" || d == "sw" ? 'stand' : 'back_stand',
			c = decodePoint(x, y);
		
		this.flipX = d == "se" || d == "ne";
		this.animate(animation, true);
		this.setPosition(c.x, c.y);
		this.x = c.x
		this.y = c.y
		this.moveText(c.x, c.y, y)
		this.depth = y
		this.direction = d
		
	}

	update(data) {
		var d = this.direction,
			m = false,
			animation = m ? d == "se" || d == "sw" ? 'walk' : 'back_walk' : d == "se" || d == "sw" ? 'stand' : 'back_stand'
	
		this.flipX = d == "se" || d == "ne";
		this.skin = data.skin
		this.name = data.name
		this.text.setText(this.name);
		this.moveText(this.x, this.y);
		this.animate(animation, true);
	}
	message(data) {
		this.chat.setText(data.message);
		this.chat.setPosition(this.x-(this.chat.width / 2), this.y-(config.sprite.height/2)-(this.text.height+this.chat.height)-7);
		this.chat.setVisible(true);
		var t = this;
		setTimeout(function(){
			t.chat.setVisible(false);
		}, config.chat.timeout)
	}

	remove() {
		this.text.setActive(false);
		this.text.setVisible(false);
		this.chat.setActive(false);
		this.chat.setVisible(false);
		this.setActive(false);
		this.setVisible(false);
	}
}

var createMap = function(game) {
	game.blocks = game.physics.add.staticGroup();
	game.ground = game.physics.add.staticGroup();

	const tile_width = 64,
		tile_height = 32,
		width = config.game.width,
		height = config.game.height,
		ratio = map.tiles[0].length / map.tiles.length,
		n = Math.floor(width / tile_width),
		centerX = width / 2,
		centerY = 16 - (height / 2),
		i = 0;

	for (var y = 0; y < map.tiles.length; y++) {
		for (var x = 0; x < map.tiles[y].length; x++) {
			if (map.tiles[y][x] !== null && map.tiles[y][x] >= 0) {
				var type = map.types[map.tiles[y][x]],
					group = type == 'bush1' || type == 'water' || type == 'bush2' ? game.blocks : game.ground,
					tx = width > window.innerWidth ? (x - y) * (tile_width / 2) - ((width - window.innerWidth) / tile_width) : (x - y) * (tile_width / 2),
					ty = height > window.innerHeight ? ((x + y) * (tile_height / 2) - ((width / ratio - window.innerHeight) / tile_height)) : (x + y) * (tile_height / 2);
				
				var tile = group.create(centerX + tx, type == 'bush1' ? centerY + ty - 7 : centerY + ty, 'tileset', type),
					c = encodePoint(tile.x, tile.y - tile_height);
				tile.depth = c.y - 9999;
				if (type == 'bush1') {
					tile.setSize(64, 32).setOffset(0, 13)
					tile.depth = y == n / ratio || x == n ? c.y : tile.depth;
				}

			}
		}
	}

	game.physics.add.collider(game.cursor, game.blocks);
}


var preload = function() {
	game = this
	this.load.atlas('tileset', assets["map"]["file"], assets["map"]["json"]);
	for (let i = 0; i < assets["skins"]["files"].length; i++) {
		this.load.spritesheet(assets["skins"]["files"][i]["name"],
			assets["skins"]["files"][i]["file"], {
				frameWidth: config.sprite.width,
				frameHeight: config.sprite.height
			});
	}
	for (let i = 0; i < assets["fonts"].length; i++) {
		var f = assets["fonts"][i]
		this.load.bitmapFont(f["name"], f["file"], f["xml"]);
	}
	this.load.image('cursor', cursor);
	this.players = {}

}


var create = function() {
	loadAnimations(this)
	var start = decodePoint(getRandomInt(-config.game.spawn_area, config.game.spawn_area), 0);
	this.data = {
		moving: false,
		was_moving: false,
		x: start.x,
		y: start.y,
		skin: assets["skins"]["files"][0]["name"],
		name: "???"
	}
	this.cursor = this.physics.add.image(this.data.x, this.data.y, 'cursor')
	this.cursor.setBounce(0.5);
	this.physics.world.enable(this.cursor);
	this.cursor.setCollideWorldBounds(true)
	this.cursor.setSize(config.sprite.hitbox.width, config.sprite.hitbox.height)
	this.cursor.setOffset((config.sprite.width - config.sprite.hitbox.width) / 2, config.sprite.height - config.sprite.hitbox.height)
	this.scene = this
	createMap(this);

	var data = this.data,
		c = encodePoint(this.data.x, this.data.y);
	data.x = c.x
	data.y = c.y
	socket.emit('connected', data);
	
}

var update = function() {
	var cursors = this.input.keyboard.createCursorKeys(),
		update = false,
		moving = true,
		speed = cursors.shift.isDown ? config.game.speed*config.game.speed_multiplier : config.game.speed;
	if (cursors.left.isDown) {
		this.data.x = -1
		this.data.y = -1
		this.data.d = "nw"

	} else if (cursors.right.isDown) {
		this.data.x = 1
		this.data.y = 1
		this.data.d = "se"

	} else if (cursors.up.isDown) {
		this.data.x = 1
		this.data.y = -1
		this.data.d = "ne"

	} else if (cursors.down.isDown) {
		this.data.x = -1
		this.data.y = 1
		this.data.d = "sw"
	} else {
		this.data.x = 0
		this.data.y = 0
		moving = false;
		
	}

	if (moving) {
		this.data.moving = true
		this.data.was_moving = this.data.moving
		this.cursor.body.velocity.x = this.data.x * speed;
		this.cursor.body.velocity.y = this.data.y * speed * 0.5;
		update = true
	}
	else {
		if(this.data.was_moving) {
			this.data.moving = false
			this.data.was_moving = this.data.moving
			update = true
		}
		this.cursor.body.velocity.y = 0;
		this.cursor.body.velocity.x = 0;
	}
	if(update) {
		var data = this.data,
			c = encodePoint(this.cursor.x, this.cursor.y);
		data.x = c.x
		data.y = c.y
		socket.emit('move', data);
	}
	

}

const MmoGame = function() {
	var t = this
	new Phaser.Game({
			type: Phaser.AUTO,
			width: config.game.width,
			height: config.game.height,
			parent: 'playsmmo',
			pixelArt: true,
			physics: {
				default: 'arcade',
				arcade: {
					//debug: true
				}
			},
			scene: {
				preload: preload,
				create: create,
				update: update
			}
	});
	var join = function(player){
		if(!game.players.hasOwnProperty(player["id"])) {
			var c = decodePoint(player.x, player.y);
			game.players[player["id"]] = new Player({
				scene: game,
				skin: player.skin,
				x: c.x,
				y: c.y,
				name: player.name,
				depth: player.y
			})
		}
		
	}
	socket.on("joined", function(data) {
		join(data)
	})
	socket.on("message", function(player) {
		if(game.players.hasOwnProperty(player["id"])) {
			game.players[player["id"]].message(player)
		}
	})
	socket.on("update", function(player) {
		console.log("UPDATE PLAYER")
		if(game.players.hasOwnProperty(player["id"])) {
			game.players[player["id"]].update(player)
		}
	})
	socket.on("connected", function(data) {
		game.data.id = data["id"]
		for (let i = 0; i < data["players"].length; i++) {
			join(data["players"][i])
		}
	});
	socket.on('move', function(data){
		game.players[data["id"]].move(data.x, data.y, data.d, data.moving)
	});

	socket.on('remove', function(player) {
		if(game.players.hasOwnProperty(player["id"])) {
			game.players[player["id"]].remove();
			delete game.players[player["id"]];
		}
	});

}



export const Mmo = new MmoGame();