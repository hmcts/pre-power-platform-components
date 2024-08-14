import { IInputs, IOutputs } from './generated/ManifestTypes';
import _vjs from 'video.js';
import MediaError from 'video.js/dist/types/media-error';
import Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vjs: any = _vjs;

const playerOptions: videojs.VideoJsPlayerOptions = {
    controls: true,
    preload: 'auto',
    controlBar: {
        volumePanel: {
            inline: false,
        },
        children: [
            'playToggle',
            'currentTimeDisplay',
            'progressControl',
            'durationDisplay',
            'volumePanel',
            'fullscreenToggle',
        ],
    },
    inactivityTimeout: 0,
    disablePictureInPicture: true,
};

const livePlayerOptions: videojs.VideoJsPlayerOptions = {
    ...playerOptions,
    controlBar: {
        volumePanel: {
            inline: false,
        },
        children: [
            'playToggle',
            'currentTimeDisplay',
            'progressControl',
            'seekToLive',
            'volumePanel',
            'fullscreenToggle',
        ],
    },
    liveui: true,
};

export class VideoJS implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _onPlay: () => void;
    private _onPause: () => void;
    private _onEnd: () => void;
    private _onReady: () => void;
    private _onLiveReady: () => void;
    private _onError: () => void;
    private _container: HTMLDivElement;
    private _videoJSPlayer: Player;
    private _context: ComponentFramework.Context<IInputs>;
    private _videoUrl: string;
    private _autoPlay: boolean;
    private _isLive: boolean;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement,
    ): void {
        this._context = context;
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;
        this._videoUrl = context.parameters.videoUrl.raw ?? '';
        this._autoPlay = context.parameters.autoPlay.raw;
        this._isLive = context.parameters.isLive.raw;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPlay = (context as any).events?.OnPlay;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPause = (context as any).events?.OnPause;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onEnd = (context as any).events?.OnEnd;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onReady = (context as any).events?.OnReady;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onLiveReady = (context as any).events?.OnLiveReady;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onError = (context as any).events?.OnError;

        this._onPlay = this._onPlay ? this._onPlay.bind(this) : () => {};
        this._onPause = this._onPause ? this._onPause.bind(this) : () => {};
        this._onEnd = this._onEnd ? this._onEnd.bind(this) : () => {};
        this._onReady = this._onReady ? this._onReady.bind(this) : () => {};
        this._onLiveReady = this._onLiveReady ? this._onLiveReady.bind(this) : () => {};
        this._onError = this._onError ? this._onError.bind(this) : () => {};

        this._initPlayer();
        this._loadVideo();
    }

    private _initPlayer(): void {
        // Create video element
        const videoElement = document.createElement('video-js');
        videoElement.setAttribute('id', 'video-js');
        videoElement.setAttribute('class', 'video-js');

        // Create no javascript message
        const noJsMessage = document.createElement('p');
        noJsMessage.setAttribute('class', 'vjs-no-js');
        noJsMessage.innerHTML =
            'To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5 video';
        videoElement.appendChild(noJsMessage);

        // Setup jwt header
        if (this._context.parameters.hasJwtRestriction.raw) {
            type XhrOptions = {
                uri: string;
                headers: { [key: string]: string };
            };

            vjs.Vhs.xhr.beforeRequest = (options: XhrOptions) => {
                const targetUrl = 'mkio.tv3cloud.com';
                if (!options.uri.includes(targetUrl)) {
                    return options;
                }

                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer=${this._context.parameters.jwtToken.raw}`,
                };
            };
        }

        this._container.appendChild(videoElement);
        let options = this._context.parameters.isLive.raw ? livePlayerOptions : playerOptions;
        options = {
            ...options,
            autoplay: this._autoPlay,
        };
        this._videoJSPlayer = vjs('video-js', options);

        this._videoJSPlayer.on('play', this._onPlay);
        this._videoJSPlayer.on('pause', this._onPause);
        this._videoJSPlayer.on('ended', this._onEnd);
        this._videoJSPlayer.on('loadeddata', this._onReady);
        this._videoJSPlayer.on('error', this._onError);
        this._videoJSPlayer.on('ready', this._checkLiveReady.bind(this));
    }

    private _checkLiveReady(): void {
        if (!this._isLive) return;

        const checkLiveReady = setInterval(() => {
            const duration = this._videoJSPlayer.duration() || 0;
            const currentTime = this._videoJSPlayer.currentTime() || 0;
            if (duration === 0 && currentTime === 0) return;
        
            this._onLiveReady();
            clearInterval(checkLiveReady);

            const checkIsLive = setInterval(() => {
                const duration = this._videoJSPlayer.duration() || 0;
                const currentTime = this._videoJSPlayer.currentTime() || 0;

                if (duration === Infinity) return;

                this._onEnd();
                clearInterval(checkIsLive);
            }, 5000);

            this._videoJSPlayer.on('error', (e: MediaError) => {
                if (e.code === 4) {
                    clearInterval(checkIsLive);
                    this._onEnd();
                }
            });
        }, 1000);
    }

    private _loadVideo(): void {
        this._videoJSPlayer.src({
            src: this._context.parameters.videoUrl.raw,
            type: 'application/x-mpegURL',
        });
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (context.parameters.reset.raw === true) {
            this.destroy();
            this.init(context, this._notifyOutputChanged, {}, this._container);
            this._notifyOutputChanged();
            return;
        }

        if (context.parameters.videoUrl.raw != this._videoUrl) {
            this._loadVideo();
        }
    }

    public getOutputs(): IOutputs {
        return {
            reset: false,
        };
    }

    public destroy(): void {
        this._videoJSPlayer.off('play');
        this._videoJSPlayer.off('pause');
        this._videoJSPlayer.off('ended');
        this._videoJSPlayer.off('loadeddata');
        this._videoJSPlayer.off('error');
        this._videoJSPlayer.off('ready');
        this._videoJSPlayer.dispose();
    }
}
