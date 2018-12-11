import React, { Component } from 'react';
import { Navbar, Nav, NavItem, Image } from 'react-bootstrap';

import './Header.css';
import Icon from '../assets/favicon.png';

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
                        <NavItem eventKey={1} id="home-button" href="/">
                            Home
                        </NavItem>
                        <NavItem
                            eventKey={1}
                            href={process.env.INDEX_URL + '/#content'}
                        >
                            About
                        </NavItem>
                        <NavItem eventKey={2} id="play-button" href="/play">
                            Explore
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

export default Header;
