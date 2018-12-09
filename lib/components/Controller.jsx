import React, { Component } from 'react';
import { Image, Jumbotron } from 'react-bootstrap';
import { BounceLoader } from 'react-spinners';

import SongDisplay from './SongDisplay.jsx';
import StartIcon from '../assets/start-button.svg';

const MIN_QUEUE_SIZE = 5;
const MAX_BACKSTACK_SIZE = 10;

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
        fetch(process.env.INDEX_URL + '/auth/token/', {
            credentials: 'include',
        }).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            response.json().then(json => {
                const script = document.createElement('script');
                script.src = 'https://sdk.scdn.co/spotify-player.js';
                script.async = false;
                document.body.appendChild(script);

                window.onSpotifyWebPlaybackSDKReady = () => {
                    this.token = json.access_token;
                    // eslint-disable-next-line no-undef
                    this.player = new Spotify.Player({
                        name: 'FindTune Player',
                        getOAuthToken: cb => {
                            cb(this.token);
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

            fetch(process.env.INDEX_URL + '/play/init/', {
                credentials: 'include',
            }).then(() => {
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                this.timerID = setInterval(() => this.tick(), 3000000);
                this.getRecommendations().then(songs => {
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
        fetch(process.env.INDEX_URL + '/auth/refresh/', {
            credentials: 'include',
        })
            .then(response => {
                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }
                this.access_token = response;
            })
            .catch(this.handleError);
    };

    getSongInfo = songId => {
        return fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
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

                response.json().then(json => {
                    var songInfo = {};
                    songInfo.albumImg = json.album.images[0].url; // 640 x 640 album image
                    songInfo.artists = json.artists.map(artist => ({
                        name: artist.name,
                        id: artist.id,
                    }));
                    fetch(
                        `https://api.spotify.com/v1/artists/${
                            songInfo.artists[0]
                        }`,
                        {
                            headers: {
                                'Content-Type':
                                    'application/json; charset=utf-8',
                                Authorization: 'Bearer ' + this.access_token,
                            },
                        }
                    ).then(response => {
                        response.json().then(json => {
                            songInfo.genres = json.genres;
                            return songInfo;
                        });
                    });
                });
            })
            .catch(this.handleError);
    };

    getRecommendations = () => {
        return fetch(process.env.INDEX_URL + '/play/recommend/', {
            credentials: 'include',
        })
            .then(response => {
                if (response.status == 401) {
                    this.handleUnauthorized();
                    return;
                }

                response.json().then(json => {
                    if (!json || !json.track_ids) {
                        this.handleError();
                        return null;
                    }

                    var songPromises = json.track_ids.map(id => {
                        return this.getSongInfo(id);
                    });

                    Promise.all(songPromises)
                        .then(songs => {
                            return songs;
                        })
                        .catch(this.handleError);
                });
            })
            .catch(this.handleError);
    };

    handleUnauthorized = () => {
        fetch(
            process.env.INDEX_URL + '/auth/?auth_redirect_uri=' +
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
        fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${
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

    handleBack = () => {
        this.setState({
            song: this.backStack.pop(),
        });

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
    };

    handleNext = () => {
        const nextSong = this.queue.shift();
        if (this.queue.length < MIN_QUEUE_SIZE) {
            this.getRecommendations().then(songs => {
                this.queue.concat(songs);
            });
        }
        if (this.backStack.length > MAX_BACKSTACK_SIZE) {
            this.backStack.splice(0, MAX_BACKSTACK_SIZE - this.backStack.length);
        }
        this.setState({
            song: nextSong
        })
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
                        <h1>An error has occured. Please refresh the page.</h1>
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
                    <Image src={StartIcon} height="25%" width="25%" />
                </a>
            );
        } else {
            display = (
                <SongDisplay
                    songAlbumImg={this.state.song.albumImg}
                    songName={this.state.song.name}
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
