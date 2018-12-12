import React, { Component } from 'react';

import Header from './Header.jsx';
import Controller from './Controller.jsx';

class Explore extends Component {
    state = {};
    render() {
        return (
            <React.Fragment>
                <Header page="play"/>
                <Controller />
            </React.Fragment>
        );
    }
}

export default Explore;
