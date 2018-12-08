import React, { Component } from 'react';

import { hot } from 'react-hot-loader';

import Header from './Header.jsx';
import Controller from './Controller.jsx';
import Footer from './Footer.jsx';

class Explore extends Component {
    state = {};
    render() {
        return (
            <div>
                <Header page="play"/>
                <Controller />
                <Footer />
            </div>
        );
    }
}

export default hot(module)(Explore);
