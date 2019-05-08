import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import io from 'socket.io-client';
import { Mmo } from '../../Mmo';
import './App.css';
import { list } from 'postcss';
var config = require('../../../config');

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()
		this.twitch = window.Twitch ? window.Twitch.ext : null
		this.updateSkin = this.updateSkin.bind(this);
        this.state={
            finishedLoading:false,
            theme:'light',
			isVisible:true,
			connected: false,
			skin: '',
			skins: {},
			init: false,
		}

	}
	
	generateSkins(skins) {
		{
			console.log(skins)
			var options = []
			for(let i = 0; i < skins.length; i++) {
				options.push(<option key={skins[i].name} value={skins[i].name}>{skins[i].title}</option>)
			}
			return options;
			//skins.map(function(s) {
			//	return 
				//console.log(k,v)
			  //return <option key={user._id}
			//	value={user.name}>{user.name}</option>;
			//})
		}
	}

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    visibilityChanged(isVisible){
        this.setState(()=>{
            return {
                isVisible
            }
        })
    }

    componentDidMount(){
		
		const socket = io('https://' + config.server_host + ':' + config.server_port + '/'),
			t = this
		socket.on("connected", function (data) {
			t.setState(()=>{
				return {connected:true}
			})
			t.state.skins = Mmo.getSkins();
			/*for(var key in skins) {
				console.log(key)
				<option value="grapefruit">Grapefruit</option>
							<option value="lime">Lime</option>
							<option value="coconut">Coconut</option>
							<option value="mango">Mango</option>
			}*/
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

        if(this.twitch){
			console.log("Is Twitch");
            this.twitch.onAuthorized((auth)=>{
				Mmo.setPlayer(auth)
                if(!this.state.finishedLoading){
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })
                }
            })
			
            this.twitch.listen('broadcast',(target,contentType,body)=>{
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)

            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
        }
	}
	updateSkin(event) {
		this.setState({skin: event.target.value});
		Mmo.setSkin(event.target.value);
		console.log(event.target.value)
		//this.setState({ skin: event.target.value });
	}

    componentWillUnmount(){
        if(this.twitch){
            this.twitch.unlisten('broadcast', ()=>console.log('successfully unlistened'))
        }
	}
	

    
    render(){
        /*if(this.state.finishedLoading && this.state.isVisible){
            return (<div className="App"></div>)
        }else{return (<div className="App"></div>)
		}*/
		return (
			<div className="interface">
				<div id="status"
					style={{
						position: "absolute",
						left: 15,
						top: 15,
						color: this.state.connected ? "green" : "red"
					}}>
					<i
						className={ this.state.connected ? 'fas fa-link' : 'fas fa-unlink'}
					></i>
				</div>
				<div className="ui"
					style={{
						position: "absolute",
						left: 15,
						right: 15,
						bottom: 15,
						padding: 15,
						background: "rgba(0,0,0,0.5)"
						//background: "#ffffff",
						//height: 100,
						//width: 100,
					}}>
					<div className="skin">
						<select onChange={this.updateSkin}>
							{ this.state.init? this.generateSkins(this.state.skins) : "" }
						</select>
					</div>
				</div>
			</div>
		)

    }
}