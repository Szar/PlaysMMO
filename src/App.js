import React from 'react'
import { BrowserRouter, Route } from "react-router-dom";
import View from './View';

class App extends React.Component {
  render() {
  return (
	<BrowserRouter>
		<Route exact path="/" component={View} />
		<Route path="/:host" component={View} />
	</BrowserRouter>
  )
}
}

export default App