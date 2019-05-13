import React from 'react'
import { Mmo, socket } from './Mmo';
import { assets } from './Assets';
var config = require('./Config');

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
			for (let i = 0; i < assets["skins"]["files"].length; i++) {
				options.push(<option key={assets["skins"]["files"][i].name} value={assets["skins"]["files"][i].name}>{assets["skins"]["files"][i].title}</option>)
			}
			return options;
		}
	}
	componentDidMount(){
		const t = this
		socket.on("connected", function (data) {
			t.setState(()=>{
				return {connected:true}
			})
			t.setState(()=>{
				return {init:true}
			})
		})
		socket.on("disconnect", function (data) {
			t.setState(()=>{
				return {connected:false}
			})
		})
	}
	updateSkin(event) {
		this.setState({skin: event.target.value});
		socket.emit('update', {"skin": event.target.value});
		event.target.blur()
	}	

	updateUsername(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			socket.emit('update', {"name": event.target.getElementsByTagName("input")[0].value});

		}
		event.target.getElementsByTagName("input")[0].value = "";
	}
	sendChat(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			socket.emit('message', event.target.getElementsByTagName("input")[0].value);
		}
		event.target.getElementsByTagName("input")[0].value = "";
		
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