import React, { Component } from 'react';
import { Jumbotron, Image } from 'react-bootstrap';

import './Preferences.css';

class Preferences extends Component {
    state = {
        genres: [],
        artists: [],
        tracks: [],
    };

    getPreferences = () => {
        fetch(process.env.INDEX_URL + '/profile/preferences', {
            credentials: 'include',
        })
            .then(response => {
                console.log(response);
                if (response.status === 401) {
                    window.location =
                        process.env.INDEX_URL +
                        '/login?auth_redirect_uri=' +
                        encodeURIComponent(window.location.href);
                } else if (response.status != 200) {
                    this.handleError();
                    return;
                } else {
                    return response.json();
                }
            })
            .then(json => {
                this.setState({
                    genres: json.genres,
                    artists: json.artists,
                    tracks: json.tracks,
                });
            });
    };

    render() {

        const trackBox = (this.state.tracks.length != 0 ? <Jumbotron class="display-box" id="track-box">
            <h1>
                Your Tracks
            </h1>
            <ul>
                {this.state.tracks.map(track => {<li><div><Image src={track.image} /> <h3>{track.name}</h3></div></li>})}
            </ul>
        </Jumbotron> : {});
        const artistBox = (this.state.artists.length != 0 ? <Jumbotron class="display-box" id="artist-box">
            <h1>
                Your Artists
            </h1>
            <ul>

            </ul>
        </Jumbotron> : {});
        const genreBox = (this.state.genre.length != 0 ? <Jumbotron class="display-box" id="genre-box">
            <h1>
                Your Genres
            </h1>
            <ul>

            </ul>
        </Jumbotron> : {});

        return (
            <div id="preference-container" className="container-fluid">

                {trackBox}
                {artistBox}
                {genreBox}
            </div>
        );
    }
}

export default Preferences;
