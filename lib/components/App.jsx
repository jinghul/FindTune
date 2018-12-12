import React, { Component } from 'react';

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

export default App;
