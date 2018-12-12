class SpotifyControl {
    init = (handleError, handlePlayStateChange, handlePlayerReady) => {
        this.handleError = handleError;
        this.handlePlayStateChange = handlePlayStateChange;
        this.handlePlayerReady = handlePlayerReady;

        // Insert the spotify player callback
        return fetch(process.env.INDEX_URL + '/login/refresh', {
            credentials: 'include',
        }).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
                return false;
            } else if (response.status !== 200) {
                this.handleError();
            }

            return response.json().then(json => {
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
                        this.handlePlayStateChange(state);
                    });

                    // Ready
                    this.player.addListener('ready', ({ device_id }) => {
                        console.log('Ready with Device ID', device_id);
                        this.handlePlayerReady();
                    });

                    // Not Ready
                    this.player.addListener('not_ready', ({ device_id }) => {
                        console.log('Device ID has gone offline', device_id);
                    });

                    // Connect to the player!
                    this.player.connect();
                };

                return fetch(process.env.INDEX_URL + '/play/init', {
                    credentials: 'include',
                }).then(response => {
                    console.log(response);
                    if (response.status === 401) {
                        this.handleUnauthorized();
                        return false;
                    } else if (response.status != 200) {
                        this.handleError();
                        return false;
                    }

                    return true;
                });
            });
        });
    };

    pause = () => {
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
        ).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
            } else if (response.status != 204) {
                this.handleError();
            }
        });
    };

    next = () => {
        fetch(
            `https://api.spotify.com/v1/me/player/next?device_id=${
                this.playerId
            }`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        ).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
            } else if (response.status != 204) {
                this.handleError();
            }
        });
    };

    resume = () => {
        fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${
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
    }

    previous = () => {
        fetch(
            `https://api.spotify.com/v1/me/player/previous?device_id=${
                this.playerId
            }`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        ).then(response => {
            if (response.status === 401) {
                this.handleUnauthorized();
            } else if (response.status != 204) {
                this.handleError();
            }
        });
    };

    refreshToken = () => {
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

    play = uris => {
        fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${
                this.playerId
            }`,
            {
                method: 'PUT',
                body: JSON.stringify({ uris: uris }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.access_token}`,
                },
            }
        );
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
                    if (!json) {
                        this.handleError();
                        return null;
                    }

                    return json.tracks;
                });
            })
            .catch(this.handleError);
    };

    handleUnauthorized = () => {
        window.location.href = process.env.INDEX_URL +
        '/login?auth_redirect_uri=' +
        encodeURIComponent(window.location.href);
    };
}

module.exports = SpotifyControl;
