import React, { Component } from 'react';
import { Navbar, Nav, NavItem, Image } from 'react-bootstrap';

import './Header.css';
import Icon from '../assets/favicon.png';
import PropTypes from 'prop-types';

class Header extends Component {
    render() {
        return (
            <Navbar className="absolute" fluid>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="/" className="align-center">
                            <Image src={Icon} />
                        </a>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav pullRight className="shadow">
                        <NavItem eventKey={1} href="/">
                            Home
                        </NavItem>
                        <NavItem
                            onClick={() => {
                                if (this.props.page == 'home') {
                                    document.getElementById('content').scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    window.location = process.env.INDEX_URL + '/#content';
                                }
                            }}
                            eventKey={1}
                        >
                            About
                        </NavItem>
                        <NavItem eventKey={2} href="/play">
                            Explore
                        </NavItem>
                        <NavItem eventKey={3} href="/profile">
                            Profile
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

Header.propTypes = { page: PropTypes.string, aboutRef: PropTypes.object };

export default Header;
