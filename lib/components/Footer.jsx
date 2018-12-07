import React, { Component } from "react";

import { Glyphicon } from "react-bootstrap";
import "./Footer.css";

class Footer extends Component {
    state = {};
    render() {
        return (
            <footer>
                <div className="container-fluid">
                    <div className="footer-copyright text-center py-3">
                        <Glyphicon
                            style={{ marginRight: 10 }}
                            glyph="heart-empty"
                        />
                        <a href="https://github.com/jinghul/findtune" id="github-link">Github</a>
                    </div>
                </div>
            </footer>
        );
    }
}

export default Footer;
