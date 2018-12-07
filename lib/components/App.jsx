import React, { Component } from "react";

import { hot } from 'react-hot-loader'

import Header from "./Header.jsx";
import Splash from "./Splash.jsx";
import About from "./About.jsx";

class App extends Component {
    render() {
        return (
            <div>
                <Header />
                <Splash />
                <About />
            </div>
        );
    }
}

export default hot(module)(App)
