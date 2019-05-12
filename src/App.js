import React from 'react'
import './App.css';
import io from 'socket.io-client';
import { Mmo } from './components/Mmo';
var config = require('../config');

export default class App extends React.Component{
	constructor(props){
        super(props)
		this.updateSkin = this.updateSkin.bind(this);
		//this.enable = this.enable.bind(this);
        this.state={
			connected: false,
			skin: '',
			skins: {},
			init: false,
			skin_disabled: false
		}

	}
	generateSkins(skins) {
		{
			var options = []
			for(let i = 0; i < skins.length; i++) {
				options.push(<option key={skins[i].name} value={skins[i].name}>{skins[i].title}</option>)
			}
			return options;
		}
	}
	componentDidMount(){
		const socket = io('https://' + config.server_host + ':' + config.server_port + '/'),
			t = this
		socket.on("connected", function (data) {
			t.setState(()=>{
				return {connected:true}
			})
			t.state.skins = Mmo.getSkins();
			t.setState(()=>{
				return {init:true}
			})
		})
		socket.on("disconnect", function (data) {
			t.setState(()=>{
				return {connected:false}
			})
		})
		Mmo.init(socket)

        
	}
	updateSkin(event) {
		this.setState({skin: event.target.value});
		Mmo.setSkin(event.target.value);
		event.target.blur()
		
	}	
	enable(event) {
		event.target.focus()
	}	
	//disable(e) {
	//	e.blur()
	//}	
	updateUsername(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			Mmo.setPlayer({
				"is_twitch":false,
				"twitch_name":event.target.getElementsByTagName("input")[0].value
			});
		}
		event.target.getElementsByTagName("input")[0].value = "";
		//this.disable(event.target)
		
	}
	sendChat(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			Mmo.sendChat(event.target.getElementsByTagName("input")[0].value);
		}
		event.target.getElementsByTagName("input")[0].value = "";
		
		//this.disable(event.target)
		
	}

	
	render(){
		return (
			<div className="interface">
				<div className="status">
					<i className={ this.state.connected ? 'fas fa-link' : 'fas fa-unlink'} ></i>
				</div>
				<div className="menu"
					style={{
						opacity: 1
					}}>
					<div className="menu--group">
						<div className="menu--label">
							character
						</div>
						<div className="skin">
							<select onChange={this.updateSkin} tabIndex={-1} disabled={(this.state.skin_disabled)? "disabled" : ""} onClick={this.enable}>
								{ this.state.init? this.generateSkins(this.state.skins) : "" }
							</select>
						</div>
					</div>
					<div className="menu--group">
						<div className="menu--label">
							name
						</div>
						<div className="username">
							<form onSubmit={this.updateUsername}><input tabIndex={-1}/></form>
						</div>
					</div>
					<div className="menu--group">
						<div className="menu--label">
							chat
						</div>
						<div className="textchat">
							<form onSubmit={this.sendChat}><input tabIndex={-1}/></form>
						</div>
					</div>
					
				</div>
			</div>
		)

    }
}