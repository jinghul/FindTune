import React, { Component } from 'react';
import { Navbar, Nav, NavItem, Image } from 'react-bootstrap';

import './Header.css';
import Icon from '../assets/favicon.png';

class Header extends Component {
    isCurrent = name => {
        if (this.props.page === name) {
            return 'current';
        } else {
            return '';
        }
    };

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
                    <Nav pullRight>
                        <NavItem
                            eventKey={1}
                            id="home-button"
                            className={this.isCurrent('home')}
                            href="/"
                        >
                            Home
                        </NavItem>
                        <NavItem
                            eventKey={1}
                            href={process.env.INDEX_URL + '/#content'}
                        >
                            About
                        </NavItem>
                        <NavItem
                            eventKey={2}
                            id="play-button"
                            className={this.isCurrent('play')}
                            href="/play"
                        >
                            Explore
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

export default Header;
