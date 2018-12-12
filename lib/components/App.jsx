import React, { Component } from 'react';

import { hot } from 'react-hot-loader';

import Header from './Header.jsx';
import Splash from './Splash.jsx';
import About from './About.jsx';

class App extends Component {
    render() {
        return (
            <React.Fragment>
                <Header page={'home'} />
                <Splash />
                <About />
            </React.Fragment>
        );
    }
}

export default hot(module)(App);
