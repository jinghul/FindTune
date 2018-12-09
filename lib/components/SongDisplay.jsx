import React, { Component } from 'react';
import { Image, Glyphicon } from 'react-bootstrap';

import PropTypes from 'prop-types';
import './SongDisplay.css';

class SongDisplay extends Component {
    componentDidMount() {
        this.timerID = setInterval(
            () => this.props.onCheckFace(),
            200000 // 20 Seconds interval
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    render() {
        const isPlaying = this.props.isPlaying;

        let mainButton;
        if (isPlaying) {
            mainButton = (
                <a onClick={this.props.onPlay}>
                    <Glyphicon glyph="play" />
                </a>
            );
        } else {
            mainButton = (
                <a onClick={this.props.onPause}>
                    <Glyphicon glyph="pause" />
                </a>
            );
        }

        return (
            <div className="mx-auto w-50 h-75">
                <Image src={this.props.songAlbumImg} />
                <div>
                    <span>{this.props.songName}</span>
                    <span>{this.props.songArtists}</span>
                </div>
                <div>
                    <a
                        onClick={this.props.onBack}
                        className={this.props.canGoBack ? '' : 'disabled'}
                        role="button"
                    >
                        <Glyphicon glyph="step-backward" />
                    </a>

                    {mainButton}

                    <a onClick={this.props.onNext} role="button">
                        <Glyphicon glyph="step-forward" />
                    </a>
                </div>
            </div>
        );
    }
}

SongDisplay.propTypes = {
    albumImg: PropTypes.string,
    canGoBack: PropTypes.bool,
    isPlaying: PropTypes.bool,
    name: PropTypes.string,
    onBack: PropTypes.func,
    onCheckFace: PropTypes.func,
    onNext: PropTypes.func,
    onPause: PropTypes.func,
    onPlay: PropTypes.func,
    songAlbumImg: PropTypes.string,
    songArtists: PropTypes.string,
    songName: PropTypes.string,
};

export default SongDisplay;