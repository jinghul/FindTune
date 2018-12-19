import React, { Component } from 'react';
import { Jumbotron, Image, ProgressBar } from 'react-bootstrap';

import './Preferences.css';

class Preferences extends Component {
    state = {
        genres: [],
        artists: [],
        tracks: [],
        error: false,
    };

    componentDidMount() {
        this.getPreferences();
    }

    getPreferences = () => {
        fetch(process.env.INDEX_URL + '/profile/preferences', {
            credentials: 'include',
        })
            .then(response => {
                if (response.status === 401) {
                    return fetch(process.env.INDEX_URL + '/play/init', {
                        credentials: 'include',
                    }).then(() => {
                        return location.reload();
                    });
                } else if (response.status != 200) {
                    this.handleError();
                    return;
                } else {
                    return response.json();
                }
            })
            .then(json => {
                if (!json) {
                    return;
                }
                console.log(json);
                this.setState({
                    genres: json.genres,
                    artists: json.artists,
                    tracks: json.tracks,
                });
            });
    };

    handleError = err => {
        console.log(err);
        this.setState({
            error: true,
        });
    };

    render() {
        const trackBox =
                (<Jumbotron className="shadow pref-box" id="track-box">
                    <h1>Your Tracks</h1>
                    <ul className="display-box">
                        {this.state.tracks.map((track, i) => {
                            return (
                                <li key={i}>
                                    <Image src={track.image} />{' '}
                                    <h3>{track.name}</h3>
                                </li>
                            );
                        })}
                    </ul>
                </Jumbotron>);
        const artistBox =
                (<Jumbotron className="shadow pref-box" id="artist-box">
                    <h1>Your Artists</h1>
                    <ul className="display-box">
                        {this.state.artists.map((artist, i) => {
                            return (
                                <li key={i}>
                                    <h3>{artist.name}</h3>
                                    <ProgressBar>
                                        <ProgressBar
                                            bsStyle="success"
                                            now={
                                                Math.floor(
                                                    artist.likes /
                                                        (artist.likes +
                                                            artist.dislikes)
                                                *100)
                                            }
                                            key={1}
                                            label={`Like`}
                                        />
                                        <ProgressBar
                                            bsStyle="danger"
                                            now={
                                                Math.floor(
                                                    artist.dislikes /
                                                        (artist.likes +
                                                            artist.dislikes)
                                                *100)
                                            }
                                            key={2}
                                            label={`Dislike`}
                                        />
                                    </ProgressBar>
                                </li>
                            );
                        })}
                    </ul>
                </Jumbotron>);

        const genreBox =
                (<Jumbotron className="shadow pref-box" id="genre-box">
                    <h1>Your Genres</h1>
                    <ul className="display-box">
                        {this.state.genres.map((genre, i) => {
                            return (
                                <li key={i}>
                                    <h3>{genre.id}</h3>
                                    <ProgressBar>
                                        <ProgressBar
                                            bsStyle="success"
                                            now={
                                                Math.floor(
                                                    genre.likes /
                                                        (genre.likes +
                                                            genre.dislikes)
                                                * 100)
                                            }
                                            key={1}
                                            label={`Like`}
                                        />
                                        <ProgressBar
                                            bsStyle="danger"
                                            now={
                                                Math.floor(
                                                    genre.dislikes /
                                                        (genre.likes +
                                                            genre.dislikes)
                                                * 100)
                                            }
                                            key={2}
                                            label={`Dislike`}
                                        />
                                    </ProgressBar>
                                </li>
                            );
                        })}
                    </ul>
                </Jumbotron>);

        const errorDisplay = this.state.error ? (
            <div className="fullscreen">
                <Jumbotron>
                    <h1>An error has occured. :(</h1>
                </Jumbotron>
            </div>
        ) : null;

        return (
            <div id="preference-container" className="container-fluid">
                {trackBox}
                {artistBox}
                {genreBox}
                {errorDisplay}
            </div>
        );
    }
}

export default Preferences;
