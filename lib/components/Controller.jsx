import React, { Component } from 'react';
import { Jumbotron } from 'react-bootstrap';
import { BounceLoader } from 'react-spinners';
import SpotifyControl from './SpotifyControl.js';

import SongDisplay from './SongDisplay.jsx';
import StartIcon from '../assets/start-button.png';

const MIN_QUEUE_SIZE = 5;
const MAX_BACKSTACK_SIZE = 10;

import './Controller.css';

class Controller extends Component {
    state = {
        error: false,
        loading: true,
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
        this.spotifyControl = new SpotifyControl(
            this.handleError,
            this.handlePlayStateChange
        );

        this.spotifyControl.init().then(success => {
            if (success) {
                this.timerID = setInterval(() => this.tick(), 3000000);
                this.spotifyControl.getRecommendations().then(songs => {
                    console.log(songs);
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
        if (this.state.isPlaying && newPlayState.paused === true) {
            this.handlePause();
        } else if (
            !this.state.isPlaying &&
            newPlayState.paused === false
        ) {
            this.handlePlay();
        }
    }

    handleError = err => {
        console.log(err);
        this.setState({
            error: true,
        });
    };

    handleCheckFace = imgBits => {
        fetch
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
