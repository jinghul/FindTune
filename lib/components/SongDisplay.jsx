import React, { Component } from 'react';
import { Image, Glyphicon } from 'react-bootstrap';

import PropTypes from 'prop-types';
import './SongDisplay.css';

class SongDisplay extends Component {
    state = {width:window.innerWidth, height:window.innerHeight};
    componentDidMount() {
        window.addEventListener('resize', this.updateDimensions);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateDimensions);
    }

    updateDimensions = () => {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
    };

    getArtistNames = function(artists) {
        let artist_list = '';
        artists.forEach(artist => {
            artist_list += artist.name + ', ';
        });
        return artist_list.slice(0, artist_list.length - 2);
    };

    render() {
        const isPlaying = this.props.isPlaying;

        let mainButton;
        if (!isPlaying) {
            mainButton = (
                <a
                    className="main-button controller-button"
                    onClick={this.props.onPlay}
                    role="button"
                >
                    <Glyphicon glyph="play" />
                </a>
            );
        } else {
            mainButton = (
                <a
                    className="main-button controller-button"
                    onClick={this.props.onPause}
                    role="button"
                >
                    <Glyphicon glyph="pause" />
                </a>
            );
        }

        const divHeightStyle = this.state.height
            ? { height: this.state.height }
            : {};
        const imgHeight = this.state.height ? this.state.height / 2 : {};

        return (
            <div className="flex shadow" id="song-info" style={divHeightStyle}>
                <div
                    id="album-img-cont"
                    style={{ height: this.state.height / 2 }}
                >
                    <a href={this.props.songHref}>
                        <Image
                            id="album-img"
                            className="shadow"
                            src={this.props.songAlbumImg}
                            height={imgHeight}
                            width="auto"
                        />
                    </a>
                </div>
                <div className="center-text" id="song-name">
                    {this.props.songName}
                </div>
                <div className="center-text">
                    {this.getArtistNames(this.props.songArtists)}
                </div>
                <div id="controls">
                    <a
                        onClick={this.props.onBack}
                        className={
                            this.props.canGoBack
                                ? 'controller-button'
                                : 'controller-button disabled'
                        }
                        role="button"
                    >
                        <Glyphicon glyph="step-backward" />
                    </a>

                    {mainButton}

                    <a
                        className="controller-button"
                        onClick={this.props.onNext}
                        role="button"
                    >
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
    height: PropTypes.number,
    isPlaying: PropTypes.bool,
    name: PropTypes.string,
    onBack: PropTypes.func,
    onCheckFace: PropTypes.func,
    onNext: PropTypes.func,
    onPause: PropTypes.func,
    onPlay: PropTypes.func,
    songAlbumImg: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    songArtists: PropTypes.array,
    songHref: PropTypes.string,
    songName: PropTypes.string,
};

export default SongDisplay;
