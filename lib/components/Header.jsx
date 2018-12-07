import React, { Component } from "react";
import { Navbar, Nav, NavItem, Image } from "react-bootstrap";

import "./Header.css";
import Icon from "../assets/favicon.png";

class Header extends Component {
    render() {
        return (
            <Navbar className="absolute" fluid>
                <Navbar.Header>
                    <Navbar.Brand>
                        <a href="/" className="align-center">
                            <Image src={Icon}/>
                        </a>
                    </Navbar.Brand>
                </Navbar.Header>
                <Nav pullRight>
                    <NavItem eventKey={1} href="/">
                        Home
                    </NavItem>
                    <NavItem eventKey={1} href="#content">
                        About
                    </NavItem>
                    <NavItem eventKey={2} href="/play">
                        Explore
                    </NavItem>
                </Nav>
            </Navbar>
        );
    }
}

export default Header;
