import React, { Component } from 'react';
import { Jumbotron } from 'react-bootstrap';
import { BounceLoader } from 'react-spinners';

import SongDisplay from './SongDisplay.jsx';
import StartIcon from '../assets/start-button.png';

const MIN_QUEUE_SIZE = 5;
const MAX_BACKSTACK_SIZE = 10;

import './Controller.css';

class Controller extends Component {
    state = {
        error: false,
        loading: true,
        started: false,
        isPlaying: false,
        song: {
            albumImg: '',
            name: '',
            uri: '',
            id: '',
            href: '',
            artists: [],
            genres: [],
        },
    };

    componentDidMount() {
        // Insert the spotify player callback
        fetch(process.env.INDEX_URL + '/login/refresh', {
            credentials: 'include',
        }).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            } else if (response.status !== 200) {
                this.handleError();
            }

            response.json().then(json => {
                const script = document.createElement('script');
                script.src = 'https://sdk.scdn.co/spotify-player.js';
                script.async = false;
                document.body.appendChild(script);

                window.onSpotifyWebPlaybackSDKReady = () => {
                    this.access_token = json.access_token;
                    // eslint-disable-next-line no-undef
                    this.player = new Spotify.Player({
                        name: 'FindTune Player',
                        getOAuthToken: cb => {
                            cb(this.access_token);
                        },
                    });

                    this.playerId = this.player._options.id;

                    // Error handling
                    this.player.addListener(
                        'initialization_error',
                        ({ message }) => {
                            console.error(message);
                        }
                    );
                    this.player.addListener(
                        'authentication_error',
                        ({ message }) => {
                            console.error(message);
                        }
                    );
                    this.player.addListener('account_error', ({ message }) => {
                        console.error(message);
                    });
                    this.player.addListener('playback_error', ({ message }) => {
                        console.error(message);
                    });

                    // Playback status updates
                    this.player.addListener('player_state_changed', state => {
                        console.log(state);
                        if (this.state.isPlaying && state.paused === true) {
                            this.handlePause();
                        } else if (!this.state.isPlaying && state.paused === false) {
                            this.handlePlay();
                        }
                    });

                    // Ready
                    this.player.addListener('ready', ({ device_id }) => {
                        console.log('Ready with Device ID', device_id);
                    });

                    // Not Ready
                    this.player.addListener('not_ready', ({ device_id }) => {
                        console.log('Device ID has gone offline', device_id);
                    });

                    // Connect to the player!
                    this.player.connect();
                };
            });

            fetch(process.env.INDEX_URL + '/play/init', {
                credentials: 'include',
            }).then(() => {
                console.log(response);
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                this.timerID = setInterval(() => this.tick(), 3000000);
                this.getRecommendations().then(songs => {
                    console.log(songs);
                    this.setState({
                        loading: false,
                        song: songs[0],
                    });

                    this.queue = songs.slice(1);
                    this.backStack = [];
                });
            });
        });
    }

    componentWillUnmount() {
        if (!this.timerID) return;
        clearInterval(this.timerID);
    }

    tick = () => {
        fetch(process.env.INDEX_URL + '/auth/refresh', {
            credentials: 'include',
        })
            .then(response => {
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                response.json().then(json => {
                    this.access_token = json.access_token;
                });
            })
            .catch(this.handleError);
    };

    getSongInfo = songId => {
        return fetch('https://api.spotify.com/v1/tracks/' + songId, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + this.access_token,
            },
        })
            .then(response => {
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                return response.json().then(json => {
                    var songInfo = {};
                    
                    songInfo.name = json.name;
                    songInfo.id = json.id;
                    songInfo.uri = json.uri;
                    songInfo.href = json.external_urls.spotify;

                    songInfo.albumImg = json.album.images[0].url; // 640 x 640 album image
                    songInfo.artists = json.artists.map(artist => ({
                        name: artist.name,
                        id: artist.id,
                    }));

                    if (!songInfo.artists) {
                        songInfo.artists = 'Unknown';
                    }

                    return fetch(
                        `https://api.spotify.com/v1/artists/${
                            songInfo.artists[0].id
                        }`,
                        {
                            headers: {
                                'Content-Type':
                                    'application/json; charset=utf-8',
                                Authorization: 'Bearer ' + this.access_token,
                            },
                        }
                    ).then(response => {
                        return response.json().then(json => {
                            console.log(songInfo);
                            songInfo.genres = json.genres;
                            return songInfo;
                        });
                    });
                });
            })
            .catch(this.handleError);
    };

    getRecommendations = () => {
        return fetch(process.env.INDEX_URL + '/play/recommend', {
            credentials: 'include',
        })
            .then(response => {
                if (response.status == 401) {
                    this.handleUnauthorized();
                    return;
                }

                return response.json().then(json => {
                    if (!json || !json.track_ids) {
                        this.handleError();
                        return null;
                    }

                    var songPromises = json.track_ids.map(id => {
                        return this.getSongInfo(id).then(song => {
                            console.log(song);
                            return song;
                        });
                    });

                    return Promise.all(songPromises)
                        .then(songs => {
                            console.log(songs);
                            return songs;
                        })
                        .catch(this.handleError);
                });
            })
            .catch(this.handleError);
    };

    handleUnauthorized = () => {
        fetch(
            process.env.INDEX_URL +
                '/login?auth_redirect_uri=' +
                encodeURIComponent(window.location.href),
            {
                credentials: 'include',
                redirect: 'follow',
            }
        );
    };

    handleError = err => {
        console.log(err);
        this.setState({
            error: true,
        });
    };

    handleCheckFace = () => {};

    handleStart = () => {
        this.setState({
            started: true,
        });
    };

    handlePlay = () => {
        this.setState({
            isPlaying: true
        });

        fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${
                this.playerId
            }`,
            {
                method: 'PUT',
                body: JSON.stringify({ uris: [this.state.song.uri] }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        );
    };

    handlePause = () => {
        this.setState({
            isPlaying: false
        });

        fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${
                this.playerId
            }`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        );
    };

    handleBack = () => {
        const prev_song = this.backStack.pop();
        this.queue.unshift(this.state.song);

        fetch(
            `https://api.spotify.com/v1/me/player/previous?device_id=${
                this.playerId
            }`,
            {
                method: 'POST',
                body: JSON.stringify({ uris: [this.state.song.uri] }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        );

        this.setState({
            song: prev_song,
        });
    };

    handleNext = () => {
        const nextSong = this.queue.shift();
        if (this.queue.length < MIN_QUEUE_SIZE) {
            this.getRecommendations().then(songs => {
                this.queue.concat(songs);
            });
        }

        this.backStack.push(this.state.song);
        if (this.backStack.length > MAX_BACKSTACK_SIZE) {
            this.backStack.splice(
                0,
                MAX_BACKSTACK_SIZE - this.backStack.length
            );
        }
        
        if (this.state.isPlaying) {
            fetch(
                `https://api.spotify.com/v1/me/player/play?device_id=${
                    this.playerId
                }`,
                {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [nextSong.uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.access_token}`,
                    },
                }
            );
        }

        this.setState({
            song: nextSong,
        });
    };

    render() {
        const loading = this.state.loading;
        const started = this.state.started;
        const error = this.state.error;

        let display;
        if (error) {
            display = (
                <div className="fullscreen">
                    <Jumbotron>
                        <h1>An error has occured. :(</h1>
                    </Jumbotron>
                </div>
            );
        } else if (loading) {
            display = (
                <div className="fullscreen">
                    <BounceLoader
                        sizeUnit={'px'}
                        size={150}
                        color={'#36D7B7'}
                        loading={this.state.loading}
                    />
                </div>
            );
        } else if (!started) {
            display = (
                <a onClick={this.handleStart} role="button">
                    <img src={StartIcon} height="200px" width="200px" />
                </a>
            );
        } else {
            display = (
                <SongDisplay
                    songAlbumImg={this.state.song.albumImg}
                    songName={this.state.song.name}
                    songHref={this.state.song.href}
                    songArtists={this.state.song.artists}
                    isPlaying={this.state.isPlaying}
                    canGoBack={
                        this.backStack != undefined &&
                        this.backStack.length !== 0
                    }
                    onCheckFace={this.handleCheckFace}
                    onPlay={this.handlePlay}
                    onPause={this.handlePause}
                    onNext={this.handleNext}
                    onBack={this.handleBack}
                />
            );
        }

        return (
            <div id="masthead" className="container-fluid">
                {display}
            </div>
        );
    }
}

export default Controller;
