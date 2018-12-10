import React, { Component } from 'react';
import { Image, Glyphicon } from 'react-bootstrap';

import PropTypes from 'prop-types';
import './SongDisplay.css';

class SongDisplay extends Component {
    componentDidMount() {
        console.log(
            this.props.songArtists.map(artist => artist.name).toString()
        );
        this.timerID = setInterval(
            () => this.props.onCheckFace(),
            200000 // 20 Seconds interval
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    getArtistNames = function(artists) {
        let artist_list = '';
        artists.forEach(artist => {artist_list += artist.name + ', '});
        return artist_list.slice(0, artist_list.length - 2)
    }

    render() {
        const isPlaying = this.props.isPlaying;

        let mainButton;
        if (!isPlaying) {
            mainButton = (
                <a className="main-button controller-button" onClick={this.props.onPlay} role="button">
                    <Glyphicon glyph="play" />
                </a>
            );
        } else {
            mainButton = (
                <a className="main-button controller-button" onClick={this.props.onPause} role="button">
                    <Glyphicon glyph="pause" />
                </a>
            );
        }

        return (
            <div className="flex shadow" id="song-info">
                <a id="album-img" href={this.props.songHref}>
                    <Image
                        className="shadow"
                        src={this.props.songAlbumImg}
                        height="100%"
                    />
                </a>
                <div>
                    <div className="center-text" id="song-name">
                        {this.props.songName}
                    </div>
                    <div className="center-text">
                        {this.getArtistNames(this.props.songArtists)}
                    </div>
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
