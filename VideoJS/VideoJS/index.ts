import { IInputs, IOutputs } from './generated/ManifestTypes';
import _vjs from 'video.js';
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
            'liveDisplay',
            'volumePanel',
            'fullscreenToggle',
        ],
    },
    liveui: true,
};

export class VideoJS implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _currentTime: string;
    private _isPlaying: boolean;
    private _notifyOutputChanged: () => void;
    private _onPlay: () => void;
    private _onPause: () => void;
    private _onEnd: () => void;
    private _videoJSPlayer: Player;
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _refreshData: () => void;
    private _videoUrl: string;
    private _isLive: boolean;
    private _jwtToken: string;
    private _isJwtRestricted: boolean;
    private _state: ComponentFramework.Dictionary;

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
        this._refreshData = this.refreshData.bind(this);
        this._videoUrl = context.parameters.videoUrl.raw ?? '';
        this._isLive = context.parameters.isLive.raw;
        this._jwtToken = context.parameters.jwtToken.raw ?? '';
        this._isJwtRestricted = context.parameters.hasJwtRestriction.raw;
        this._state = state;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPlay = (context as any).events?.OnPlay;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPause = (context as any).events?.OnPause;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onEnd = (context as any).events?.OnEnd;

        this._onPlay = this._onPlay ? this._onPlay.bind(this) : () => {};
        this._onPause = this._onPause ? this._onPause.bind(this) : () => {};
        this._onEnd = this._onEnd ? this._onEnd.bind(this) : () => {};

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
        this._videoJSPlayer = vjs('video-js', this._context.parameters.isLive.raw ? livePlayerOptions : playerOptions);

        this._videoJSPlayer.on('timeupdate', this._refreshData);
        this._videoJSPlayer.on('play', this._refreshData);
        this._videoJSPlayer.on('pause', this._refreshData);
        this._videoJSPlayer.on('play', this._onPlay);
        this._videoJSPlayer.on('pause', this._onPause);
        this._videoJSPlayer.on('ended', this._onEnd);
    }

    private _loadVideo(): void {
        this._videoJSPlayer.src({
            src: this._context.parameters.videoUrl.raw,
            type: 'application/x-mpegURL',
        });
    }

    public refreshData(): void {
        this._currentTime = this._videoJSPlayer?.currentTime()?.toString() ?? '';
        this._isPlaying = this._videoJSPlayer?.paused() === false;
        this._notifyOutputChanged();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (
            context.parameters.videoUrl.raw != this._videoUrl ||
            context.parameters.isLive.raw != this._isLive ||
            context.parameters.jwtToken.raw != this._jwtToken ||
            context.parameters.hasJwtRestriction.raw != this._isJwtRestricted
        ) {
            this.destroy();
            this.init(context, this._notifyOutputChanged, this._state, this._container);
        }

        this._context = context;
    }

    public getOutputs(): IOutputs {
        return {
            currentTime: this._currentTime,
            playing: this._isPlaying,
        };
    }

    public destroy(): void {
        this._videoJSPlayer.off('timeupdate', this._refreshData);
        this._videoJSPlayer.off('play', this._refreshData);
        this._videoJSPlayer.off('pause', this._refreshData);
        this._videoJSPlayer.off('play', this._context.events.OnPlay);
        this._videoJSPlayer.off('pause', this._context.events.OnPause);
        this._videoJSPlayer.off('ended', this._context.events.OnEnd);
        this._videoJSPlayer.dispose();
    }
}
