import React, { Component } from 'react';
import PropTypes from 'prop-types';
import posed from 'react-pose';
import { Glyphicon } from 'react-bootstrap';


import './Camera.css';

const Box = posed.div({
    closed: { x: '-100%' },
    open: { x: '0%' },
});

class Camera extends Component {
    componentDidMount() {
        const _this = this;
        this.videoStream = document.getElementById('video-stream');
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(stream => (this.videoStream.srcObject = stream))
            .catch(err => {
                console.log(err);
            });

        this.videoStream.oncanplay = function() {
            _this.initialized = true;

            if (_this.props.streaming) {
                _this.props.onStartStream(_this);
            }
        };

        this.timerID = setInterval(
            () => {this.takePicture();},
            20000 // 20 Seconds interval
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    takePicture = () => {
        if (this.initialized && this.props.streaming && this.props.isPlaying) {
            var canvas = document.createElement('canvas');
            canvas.width = this.props.width;
            canvas.height = this.props.height;
            canvas.getContext('2d').drawImage(this.videoStream, 0, 0, this.props.width, this.props.width);
            canvas.toBlob((blob) => {
                this.props.onCheckFace(blob);
            });
        }
    };

    render() {
        return (
            <Box
                id="video-container"
                style={{ height: '40%', width: '24%' }}
                pose={this.props.minimized ? 'closed' : 'open'}
            >
                <video id="video-stream" height="100%" width="100%" />
                <a
                    id="minimize-button"
                    role="button"
                    onClick={this.props.onStreamMinimize}
                >
                    <Glyphicon
                        glyph={
                            this.props.minimized ? 'menu-right' : 'menu-left'
                        }
                    />
                </a>
                <a
                    id="video-play-button"
                    role="button"
                    onClick={() => {
                        this.props.streaming
                            ? this.props.onPauseStream(this)
                            : this.props.onStartStream(this);
                    }}
                >
                    <Glyphicon
                        glyph={this.props.streaming ? 'pause' : 'play'}
                    />
                </a>
            </Box>
        );
    }
}

Camera.propTypes = {
    height: PropTypes.number,
    isPlaying: PropTypes.bool,
    minimized: PropTypes.bool,
    onCheckFace: PropTypes.func,
    onPauseStream: PropTypes.func,
    onStartStream: PropTypes.func,
    onStreamMinimize: PropTypes.func,
    streaming: PropTypes.bool,
    width: PropTypes.number,
};

export default Camera;
