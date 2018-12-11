import React, { Component } from 'react';

import Header from './Header.jsx';
import Preferences from './Preferences.jsx';

class Profile extends Component {
    render() {
        return (
            <React.Fragment>
                <Header page="profile"/>
                <Preferences />
            </React.Fragment>
        );
    }
}

export default Profile;