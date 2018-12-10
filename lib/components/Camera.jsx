import React, { Component } from 'react';
import PropTypes from 'prop-types';
import posed from 'react-pose';
import { Glyphicon } from 'react-bootstrap';

const Box = posed.div({
    closed: { x: '-95%' },
    open: { x: '100%' },
});

class Camera extends Component {
    state = {
        streaming: this.props.streaming,
        minimized: this.props.minimized,
        initialized: false,
    };

    componentDidMount() {
        this.videoStream = document.getElementById('video-stream');
        this.videoStream.oncanplay = function() {
            if (this.state.streaming) {
                this.handleStartStream();
            }
        };
    }

    handleStartStream = () => {
        this.setState({
            streaming: true,
        });

        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(stream => (this.videoStream.srcObject = stream))
            .catch(err => {
                console.log(err);
            });
    };

    handlePauseStream = () => {
        this.setState({
            streaming: false,
        });
        this.videoStream.pause();
    };

    handleMinimize = () => {
        this.setState({
            minimized: !this.state.minimized,
        });
    };

    takePicture = () => {
        if (this.state.streaming) {
            var canvas = document.createElement('canvas');
            canvas.width = this.props.width;
            canvas.height = this.props.height;
            return canvas.toDataURL('image/png');
        }
    };

    render() {
        return (
            <Box
                id="video-container"
                style={{ height: '15%', width: '20%' }}
                pose={this.state.minimized ? 'closed' : 'open'}
            >
                <video id="video-stream" height="100%" width="100%" />
                <a id="minimize-button" role="button" onClick={this.handleMinimize}>
                    <Glyphicon
                        glyph={
                            this.state.minimized ? 'menu-right' : 'menu-left'
                        }
                    />
                </a>
                <a  id="video-play-button"
                    role="button"
                    onClick={
                        this.state.streaming
                            ? this.handlePauseStream
                            : this.handleStartStream
                    }
                >
                    <Glyphicon glyph={this.state.streaming ? 'pause' : 'play'} />
                </a>
            </Box>
        );
    }
}

Camera.propTypes = {
    height: PropTypes.number,
    minimized: PropTypes.bool,
    streaming: PropTypes.bool,
    width: PropTypes.number,
};

export default Camera;
