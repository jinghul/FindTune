import React, { Component } from 'react';
import { Jumbotron } from 'react-bootstrap';
import { BounceLoader } from 'react-spinners';
import SpotifyControl from './SpotifyControl.js';
import posed from 'react-pose';

import SongDisplay from './SongDisplay.jsx';
import Camera from './Camera.jsx';

const MIN_QUEUE_SIZE = 5;

import './Controller.css';

const LikeDisplay = posed.div({
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
});

class Controller extends Component {
    state = {
        error: false,
        loading: true,
        isPlaying: false,
        songsReady: false,
        result: '',
        song: {
            albumImg: '',
            name: '',
            uri: '',
            id: '',
            href: '',
            artists: [],
            genres: [],
        },
        streamMinimized: true,
        streaming: true,
    };

    componentDidMount() {
        this.spotifyControl = new SpotifyControl();
        this.spotifyControl
            .init(this.handleError, this.handlePlayStateChange, this.handlePlayerReady)
            .then(success => {
                if (success) {
                    this.timerID = setInterval(() => this.tick(), 3000000);
                    this.spotifyControl.getRecommendations().then(songs => {
                        this.setState({
                            songsReady: true,
                            song: songs[0],
                        });

                        this.queue = songs.slice(1);
                        this.backStack = [];

                        if (this.state.playerReady) {
                            this.setState({
                                loading: false,
                            });
                        }
                    });
                }
            });
    }

    componentWillUnmount() {
        if (!this.timerID) return;
        clearInterval(this.timerID);
    }

    tick = () => {
        if (this.spotifyControl) {
            this.spotifyControl.refreshToken();
        }
    };

    handlePlayerReady = () => {
        this.setState({
            playerReady: true,
        });

        if (this.state.songsReady) {
            this.setState({
                loading: false,
            });
        }
    }

    handlePlayStateChange = newPlayState => {
        if (
            newPlayState.track_window &&
            newPlayState.track_window.current_track
        ) {
            const song = this.state.song;
            const currentTrack = newPlayState.track_window.current_track;
            if (currentTrack.id == song.id) {
                if (this.state.isPlaying && newPlayState.paused) {
                    this.handlePause();
                } else if (!this.state.isPlaying && !newPlayState.paused) {
                    this.handleResume();
                }
            } else if (this.queue.length != 0 && currentTrack.id == this.queue[0].id){
                const newSong = this.queue.shift();
                this.backStack.push(song);
                this.setState({
                    song : newSong,
                });
            } else if (this.backStack.length != 0 && currentTrack.id == this.backStack[this.backStack.length-1].id) {
                const newSong = this.backStack.pop();
                this.queue.unshift(song);
                this.setState({
                    song : newSong,
                });
            } else {
                this.backStack.push(song);
                var trackUris = [currentTrack.uri].concat(this.getQueueUris());
                this.setState({
                    song: {
                        albumImg: currentTrack.album.images[2].url,
                        uri: currentTrack.uri,
                        id: currentTrack.id,
                        name: currentTrack.name,
                        href:
                            'https://api.spotify.com/v1/tracks/' +
                            currentTrack.id,
                        artists: 
                            currentTrack.artists.map(artist => ({
                                name: artist.name,
                                id: artist.uri.slice('spotify:artist:'.length),
                            })),
                        genres: [],
                    },
                    isPlaying:!newPlayState.paused,
                });

                if (!newPlayState.paused) {
                    this.spotifyControl.play(trackUris);
                } else {
                    this.spotifyControl.pause();
                }
            }
        } else {
            this.setState({
                isPlaying: false,
            });
        }
    };

    handleError = err => {
        console.log(err);
        this.handlePause();
        document.getElementById('video-stream').pause();
        this.setState({
            error: true,
            streaming: false,
            isPlaying: false,
        });
    };

    handleCheckFace = imgBlob => {
        const song = this.state.song;
        var formData = new FormData();
        formData.append('track', JSON.stringify(song));
        formData.append('face', imgBlob);

        fetch(process.env.INDEX_URL + '/face/emotion/', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                return response.json();
            })
            .then(json => {
                if (
                    json.action != 'none' &&
                    json.trackId == this.state.song.id
                ) {
                    this.setState({
                        result: json.action,
                    });
                    setTimeout(() => {
                        this.setState({
                            result: '',
                        });
                    }, 5000);

                    if (json.action == 'dislike') {
                        this.handleNext();
                    }
                }
            })
            .catch(() => {
                this.handleError();
            });
    };

    handleStartStream = camera => {
        this.setState({
            streaming: true,
        });

        camera.videoStream.play();
    };

    handlePauseStream = camera => {
        this.setState({
            streaming: false,
        });

        camera.videoStream.pause();
    };

    handleStreamMinimize = () => {
        this.setState({
            streamMinimized: !this.state.streamMinimized,
        });
    };

    getQueueUris = () => {
        return this.queue.map(song => song.uri);
    }

    handleResume = () => {
        this.setState({
            isPlaying: true,
        });
        this.spotifyControl.resume();
    }

    handlePlay = () => {
        this.setState({
            isPlaying: true,
        });
        this.spotifyControl.play([this.state.song.uri].concat(this.getQueueUris()));
    };

    handlePause = () => {
        this.setState({
            isPlaying: false,
        });
        this.spotifyControl.pause();
    };

    handleBack = () => {
        const prevSong = this.backStack.pop();
        this.queue.unshift(this.state.song);

        this.spotifyControl.previous();

        this.setState({
            song: prevSong,
        });
    };

    handleNext = () => {
        this.backStack.push(this.state.song);

        this.setState({
            song: this.queue.shift(),
            isPlaying: true,
        });

        if (this.queue.length < MIN_QUEUE_SIZE) {
            this.spotifyControl.getRecommendations().then(songs => {
                this.queue = this.queue.concat(songs);
                this.handlePlay();
            });
        } else {
            this.spotifyControl.next();
        }
    };

    getLikeDisplay = () => {
        if (this.state.result != '') {
            if (this.state.result == 'like') {
                return 'Liked';
            } else {
                return 'Skipped';
            }
        } else {
            return '';
        }
    };

    render() {
        const loading = this.state.loading;
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
                    onPlay={this.backStack.length == 0 ? this.handlePlay : this.handleResume}
                    onPause={this.handlePause}
                    onNext={this.handleNext}
                    onBack={this.handleBack}
                />
            );
        }

        return (
            <div id="masthead" className="container-fluid">
                <Camera
                    width={480}
                    height={360}
                    id="camera"
                    streaming={this.state.streaming}
                    minimized={this.state.streamMinimized}
                    onStreamMinimize={this.handleStreamMinimize}
                    onCheckFace={this.handleCheckFace}
                    onStartStream={this.handleStartStream}
                    onPauseStream={this.handlePauseStream}
                    isPlaying={this.state.isPlaying}
                />
                {display}
                <LikeDisplay
                    id="like-display"
                    pose={this.state.result != '' ? 'visible' : 'hidden'}
                    className={this.state.result != '' ? this.state.result : ''}
                >
                    <h1>{this.getLikeDisplay()}</h1>
                </LikeDisplay>
            </div>
        );
    }
}

export default Controller;
