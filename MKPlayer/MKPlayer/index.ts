import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as mkplayer from '@mediakind/mkplayer';

export class MKPlayer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _onPlay: () => void;
    private _onPause: () => void;
    private _onEnd: () => void;
    private _onReady: () => void;
    private _onError: () => void;
    private _container: HTMLDivElement;
    private _videoElement: HTMLDivElement;
    private _MKPlayer: mkplayer.MKPlayer;
    private _context: ComponentFramework.Context<IInputs>;
    private _videoUrl: string;
    private _autoplay: boolean;

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
        this._autoplay = context.parameters.autoPlay.raw ?? false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPlay = (context as any).events?.OnPlay;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onPause = (context as any).events?.OnPause;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onEnd = (context as any).events?.OnEnd;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onReady = (context as any).events?.OnReady;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._onError = (context as any).events?.OnError;

        this._onPlay = this._onPlay ? this._onPlay.bind(this) : () => {};
        this._onPause = this._onPause ? this._onPause.bind(this) : () => {};
        this._onEnd = this._onEnd ? this._onEnd.bind(this) : () => { };
        this._onReady = this._onReady ? this._onReady.bind(this) : () => { };
        this._onError = this._onError ? this._onError.bind(this) : () => { };

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
                autoplay: this._autoplay,
            },
            events: {
                [mkplayer.MKPlayerEvent.Play]: () => {
                    this._onPlay();
                },
                [mkplayer.MKPlayerEvent.Paused]: () => {
                    this._onPause();
                },
                [mkplayer.MKPlayerEvent.PlaybackFinished]: () => {
                    this._onEnd();
                },
                [mkplayer.MKPlayerEvent.SourceLoaded]: () => {
                    this._onReady();
                },
                [mkplayer.MKPlayerEvent.Error]: () => {
                    this._onError();
                },
                [mkplayer.MKPlayerEvent.StallStarted]: () => {
                    this._onError();
                },
            },
        };

        this._container.appendChild(this._videoElement);
        this._MKPlayer = new mkplayer.MKPlayer(this._videoElement, playerConfig);
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

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        if (
            context.parameters.reset.raw === true
        ) {
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
        this._container.removeChild(this._videoElement);
        this._MKPlayer.destroy();
    }
}
