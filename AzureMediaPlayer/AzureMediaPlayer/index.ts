import { escape } from "querystring";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

declare const amp: any;

export class AzureMediaPlayer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    /**
     * Empty constructor.
     */
    constructor() {

    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        container.innerHTML = `<iframe id="azureMediaPlayer" frameborder="0" scrolling="no" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen style="width: 100%; aspect-ratio: 16 / 9; overflow: hidden;"></iframe>`;

        let iframe: any = document.getElementById("azureMediaPlayer");
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
                                "src": "${context.parameters.manifestUrl.raw || ""}",
                                "type": "application/vnd.ms-sstr+xml",
                                "protectionInfo": [{
                                    "type": "AES",
                                    "authenticationToken": "${context.parameters.token.raw || ""}"
                                }]
                            }
                        ]);
                    });
                </script>
            </body>
            </html>
        `;

        if (iframe) {
            iframe.src = "data:text/html;charset=utf-8," + azureMediaPlayerHTML;
        }
    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.init(context, () => { }, {}, document.getElementById("azureMediaPlayer") as HTMLDivElement);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
