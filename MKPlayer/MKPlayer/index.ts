import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as mkplayer from '@mediakind/mkplayer';

export class MKPlayer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _currentTime: string;
    private _isPlaying: boolean;
    private _notifyOutputChanged: () => void;
    private _onPlay: () => void;
    private _onPause: () => void;
    private _onEnd: () => void;
    private _MKPlayer: mkplayer.MKPlayer;
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _refreshData: () => void;
    private _videoUrl: string;
    private _playerLicenseKey: string;
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
        this._playerLicenseKey = context.parameters.MkPlayerLicenseKey.raw ?? '';
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
        const videoElement = document.createElement('div');
        videoElement.setAttribute('id', 'video-container');

        const playerConfig = {
            key: this._context.parameters.MkPlayerLicenseKey.raw || 'key',
            ui: true,
            playback: {
                muted: false,
                autoplay: false,
            },
            events: {
                [mkplayer.MKPlayerEvent.TimeChanged]: () => {
                    this._refreshData();
                },
                [mkplayer.MKPlayerEvent.Play]: () => {
                    this._refreshData();
                    this._onPlay();
                },
                [mkplayer.MKPlayerEvent.Paused]: () => {
                    this._refreshData();
                    this._onPause();
                },
                [mkplayer.MKPlayerEvent.PlaybackFinished]: () => {
                    this._onEnd();
                },
            },
        };

        this._container.appendChild(videoElement);
        this._MKPlayer = new mkplayer.MKPlayer(videoElement, playerConfig);
    }

    private _loadVideo(): void {
        const sourceConfig = {
            hls: this._context.parameters.videoUrl.raw || '',
            drm: {
                clearkey: {
                    LA_URL: 'HLS_AES',
                    headers: {
                        Authorization: 'Bearer=' + this._context.parameters.jwtToken.raw || '',
                    },
                },
            },
        };

        this._MKPlayer.load(sourceConfig);
    }

    public refreshData(): void {
        this._currentTime = this._MKPlayer.getCurrentTime().toString();
        this._isPlaying = this._MKPlayer.isPlaying();
        this._notifyOutputChanged();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (
            context.parameters.videoUrl.raw != this._videoUrl ||
            context.parameters.MkPlayerLicenseKey.raw != this._playerLicenseKey ||
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
        this._MKPlayer.destroy();
    }
}
