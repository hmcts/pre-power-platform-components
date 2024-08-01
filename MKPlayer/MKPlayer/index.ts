import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as mkplayer from '@mediakind/mkplayer';

export class MKPlayer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _currentTime: number;
    private _isPlaying: boolean;
    private _duration: number;
    private _start: boolean;
    private _startTime: number;
    private _notifyOutputChanged: () => void;
    private _onPlay: () => void;
    private _onPause: () => void;
    private _onEnd: () => void;
    private _videoElement: HTMLDivElement;
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
        this._startTime = context.parameters.startTime.raw ?? 0;
        this._start = context.parameters.start.raw ?? false;
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
        this._videoElement = document.createElement('div');
        this._videoElement.setAttribute('id', 'video-container');

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

        this._container.appendChild(this._videoElement);
        this._MKPlayer = new mkplayer.MKPlayer(this._videoElement, playerConfig);
    }

    private async _loadVideo(): Promise<void> {
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

        await this._MKPlayer.load(sourceConfig);
        this._MKPlayer.seek(this._startTime);
    }

    public refreshData(): void {
        this._currentTime = Number(this._MKPlayer.getCurrentTime().toFixed(2));
        this._isPlaying = this._MKPlayer.isPlaying();
        this._duration = Number(this._MKPlayer.getDuration().toFixed(2));

        if (!isFinite(this._currentTime)) {
            this._currentTime = 0;
        }
        if (!isFinite(this._duration)) {
            this._duration = 0;
        }

        this._notifyOutputChanged();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (
            context.parameters.reset.raw === true ||
            context.parameters.videoUrl.raw != this._videoUrl ||
            context.parameters.MkPlayerLicenseKey.raw != this._playerLicenseKey ||
            context.parameters.jwtToken.raw != this._jwtToken ||
            context.parameters.hasJwtRestriction.raw != this._isJwtRestricted
        ) {
            this.destroy();
            this.init(context, this._notifyOutputChanged, this._state, this._container);
        }

        if (context.parameters.start.raw != this._start) {
            if (context.parameters.start.raw === true) {
                this._MKPlayer.play();
                this._start = true;
            } else {
                this._MKPlayer.pause();
                this._start = false
            }
        }

        if (context.parameters.startTime.raw != this._startTime) {
            this._startTime = context.parameters.startTime.raw ?? 0;
            this._MKPlayer.seek(this._startTime);
        }

        this._context = context;
    }

    public getOutputs(): IOutputs {
        return {
            currentTime: this._currentTime,
            playing: this._isPlaying,
            duration: this._duration,
            reset: false,
            start: this._isPlaying,
        };
    }

    public destroy(): void {
        this._MKPlayer.destroy();
        this._container.removeChild(this._videoElement);
    }
}
