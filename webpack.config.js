const fs = require('fs')
const path = require("path")
const webpack = require("webpack")
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// defines where the bundle file will live
const bundlePath = path.resolve(__dirname, "dist/")

module.exports = (_env,argv)=> {
	let entryPoints = {
    Index:{
      path:"./src/index.js",
      outputHtml:"index.html",
      build:true
    },
  }
 

  let entry = {}
  let plugins = [
    new CleanWebpackPlugin(['dist']),
    new webpack.HotModuleReplacementPlugin()
  ]

  for(name in entryPoints){
    if(entryPoints[name].build){
      entry[name]=entryPoints[name].path
      if(argv.mode==='production'){
        plugins.push(new HtmlWebpackPlugin({
          inject:true,
          chunks:[name],
          template:'./template.html',
          filename:entryPoints[name].outputHtml
        }))
      }
    }    
  }
  
  let config={
    entry: './src/index.js',
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader' ]
        },
        {
		  test: /\.(gif|png|jpe?g|svg|xml)$/i,
          loader: "file-loader",
          options:{
            name:"assets/[name].[ext]"
          }
		},
      ]
    },
    resolve: { extensions: ['*', '.js', '.jsx'] },
    output: {
      filename: "[name].bundle.js",
      path:bundlePath
    },
    plugins: [new HtmlWebpackPlugin({
		inject:true,
		template:'./public/index.html',
		filename:"index.html",
	  })]
  }

  if(argv.mode==='development'){
    config.devServer = {
	  historyApiFallback: true,
	  contentBase: path.join(__dirname,'public'),
	  disableHostCheck: true,
      host: '0.0.0.0',
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      port: config.react_port
    }
    if(fs.existsSync(path.resolve(__dirname,'conf/server.key'))){
      config.devServer.https = {
        key:fs.readFileSync(path.resolve(__dirname,'conf/server.key')),
        cert:fs.readFileSync(path.resolve(__dirname,'conf/server.crt'))
      }
    }
  }
  if(argv.mode==='production'){
    config.optimization.splitChunks={
      cacheGroups:{
        default:false,
        vendors:false,
        vendor:{
          chunks:'all',
          test:/node_modules/,
          name:false
        }
      },
      name:false
    }
  }  

  return config;
}
