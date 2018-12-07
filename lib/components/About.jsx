import React, { Component } from "react";

import { Jumbotron, Button } from "react-bootstrap";
import "./About.css";

class About extends Component {
    render() {
        return (
            <Jumbotron id="content">
                <div className="container">
                    <h1>About</h1>
                    <p>
                        FindTune is a music exploration application to let you find the right tunes for your taste.
                        We want to show you music that actually fits into your own individual personality.
                        Using the powerful Spotify and Microsoft Azure API, we load in your personal tastes as a first step
                        and suggest new songs based on your emotional reaction. If we detect that you enjoy the song,
                        we will add it to the FindTune playlist we create for you. Otherwise, we skip that song and suggest
                        a new one based on the preferences we see.
                    </p>
                    <p>
                        <Button bsStyle="primary" id="explore-button">Explore</Button>
                        <Button bsStyle="link" id="source-button">See the source.</Button>
                    </p>
                </div>
            </Jumbotron>
        );
    }
}

export default About;
