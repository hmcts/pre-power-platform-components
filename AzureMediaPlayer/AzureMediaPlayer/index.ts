import { IInputs, IOutputs } from './generated/ManifestTypes';

declare const amp: any;

export class AzureMediaPlayer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement,
    ): void {
        container.innerHTML = `<iframe id="azureMediaPlayer" frameborder="0" scrolling="no" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen style="width: 100%; aspect-ratio: 16 / 9; overflow: hidden;"></iframe>`;

        let iframe: any = document.getElementById('azureMediaPlayer');
        let azureMediaPlayerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Azure Media Player</title>
                <script src="https://amp.azure.net/libs/amp/2.3.11/azuremediaplayer.min.js"></script>
                <link href="https://amp.azure.net/libs/amp/2.3.11/skins/amp-default/azuremediaplayer.min.css" rel="stylesheet">
            </head>
            <body>
                <video id="azuremediaplayer" class="azuremediaplayer amp-default-skin amp-big-play-centered" controls>
                    <p class="amp-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5 video</p>
                </video>

                <script>
                    let myPlayer = amp('azuremediaplayer', {
                        "logo": {
                            "enabled": false
                        },
                        "controls": true,
                        "width": "100%",
                        "height": "auto",
                    }, function () {
                        console.log('Azure Media Player Initialized');
                        myPlayer.src([
                            {
                                "src": "${context.parameters.manifestUrl.raw || ''}",
                                "type": "application/vnd.ms-sstr+xml",
                                "protectionInfo": [{
                                    "type": "AES",
                                    "authenticationToken": "${context.parameters.token.raw || ''}"
                                }]
                            }
                        ]);
                    });
                </script>
            </body>
            </html>
        `;

        if (iframe) {
            iframe.src = 'data:text/html;charset=utf-8,' + azureMediaPlayerHTML;
        }
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.init(context, () => {}, {}, document.getElementById('azureMediaPlayer') as HTMLDivElement);
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}
}
