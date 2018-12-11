import React, { Component } from 'react';
import { Jumbotron } from 'react-bootstrap';
import { BounceLoader } from 'react-spinners';
import SpotifyControl from './SpotifyControl.js';
import posed from 'react-pose';

import SongDisplay from './SongDisplay.jsx';
import Camera from './Camera.jsx';

const MIN_QUEUE_SIZE = 5;
const MAX_BACKSTACK_SIZE = 10;

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
            .init(this.handleError, this.handlePlayStateChange)
            .then(success => {
                if (success) {
                    this.timerID = setInterval(() => this.tick(), 3000000);
                    this.spotifyControl.getRecommendations().then(songs => {
                        this.setState({
                            loading: false,
                            song: songs[0],
                        });

                        this.queue = songs.slice(1);
                        this.backStack = [];
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

    handlePlayStateChange = newPlayState => {
        if (this.state.isPlaying && newPlayState.paused) {
            this.handlePause();
        } else if (!this.state.isPlaying && !newPlayState.paused) {
            this.handlePlay();
        }
    };

    handleError = err => {
        console.log(err);
        this.handlePause();
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
                            result: ''
                        });
                    }, 5000);

                    if (json.action == 'dislike') {
                        this.handleNext();
                    }
                }
            })
            .catch(() => {this.handleError();});
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

    handlePlay = () => {
        this.setState({
            isPlaying: true,
        });
        this.spotifyControl.play(this.state.song.uri);
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

        this.spotifyControl.play(prevSong.uri);

        this.setState({
            song: prevSong,
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
            this.spotifyControl.play(nextSong.uri);
        }

        this.setState({
            song: nextSong,
        });
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
    }

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
                    onPlay={this.handlePlay}
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
