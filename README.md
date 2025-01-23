# Custom PCF Components

This repo contains the source code for the custom PCF components used in Power Apps.

> [!TIP]
> A video walkthrough of the process can be found [here](https://teams.microsoft.com/v2/?tenantId=531ff96d-0ae9-462a-8d2d-bec7c0b42082).

## Pre-requisites

- [.NET Core SDK](https://dotnet.microsoft.com/download) greater than 8.0
- [PAC CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- [Node.js](https://nodejs.org/en) latest LTS version
- [Homebrew](https://brew.sh) (optional)

.NET Core SDK can be installed on MacOS using Homebrew:

```bash
brew install --cask dotnet-sdk
```

The PAC CLI can be installed by running the following command:

```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

Node.js can be installed on MacOS using Node Version Manager (NVM) and Homebrew:

```bash
brew install nvm
nvm install --lts
nvm use --lts
```

> [!IMPORTANT]
> When installing the tools follow the instrcutions on screen, you may have to add the tools to your PATH.
> in your `.bashrc` or `.zshrc` file, add the following lines:

```bash
export NVM_DIR=~/.nvm
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

export PATH="$PATH:/Users/<YOUR USERNAME>/.dotnet/tools" # This makes the PAC CLI available
```

## Creating a new component

To create a new component, run the following command from the root of the project:

```bash
mkdir <component name>
cd <component name>
pac pcf init --namespace pre --name <component name> --template field
npm install
cd dts_pre_recorded_evidence_components
pac solution add-reference --path ../<component name>
```

## Building a component

To build a component, run the following command from the root of the project:

```bash
cd <component name>
npm run build
```

## Testing a component

To test a component, run the following command from the root of the project:

```bash
cd <component name>
npm run start watch
```

## Deploying a component

To deploy a component, run the following command from the root of the project:

```bash
cd <component name>
npm version patch # take note of the version number
```
> [!IMPORTANT]
> Also bump the version number in the `ControlManifest.Input.xml` file to the same version number as the one in the `package.json` file (diaplayed when running `npm version patch`).

```bash
cd dts_pre_recorded_evidence_components
pac solution version --buildversion <version number>
dotnet build
```

> [IMPORTANT]
> The solution version number must be higher than the previous version number. Chech this on the solutions page in Power Apps. For example if the previous version number is `1.0.40` then run `pac solution version --buildversion 41`.

This will output a zip file in `dts_pre_recorded_evidence_components/bin/Debug/dts_pre_recorded_evidence_components.zip`.

### Next steps

1. Exit the canvas app editor and go to the solutions page in Power Apps.
2. Click `Import solution`, select the zip file and click `Next`.
3. Observer the message `This solution package contains an update for a solution that is already installed.` (only if you are updating an existing component, if you don't see this message check the solution version number).
4. Click `Import` and wait for the green banner to inform the solution has been imported.
5. Navigate in to the solution that was just imported.
6. Observe the custom controls and when they were last modified. (If last modified was more than a few minutes ago check the version number in the `ControlManifest.Input.xml` file).
7. When ready to propogate the updated components to the apps click `Publish all customizations`.
8. Go back to the canvas app editor for the app that uses the component, when opening the editor you will be prompted to update the component.

## Import a new component

1. Open the canvas app editor.
2. On the `Tree view` go to the `Components` tab.
3. Click `<-|` import components.
4. On the side pane chnage to the `Code` tab.
5. Search and select the component you want to import.
6. Now on the `Insert` menu under `Code components` you will see the new component.

## Troubleshooting

### Custom component not updating in Power Apps

- Check the version number in the `Solution.xml` file and ensure it is higher than the previous version number.
- Check the version number in the `ControlManifest.Input.xml` file and ensure it is higher than the previous version number.
- After importing the solution make sure to click `Publish all customizations` in the solutions page.
- When entering the canvas app editor you should be prompted to update the component.

### Component events are not available in the canvas app editor

To enable events for a custom compoennt add a `featureconfig.json` file to the root of the component with the 
following contents:

```json
{
    "pcfAllowEvents": "on"
}
```

### Webresource content size is too big

When importing the solution you may receive the error `Webresource content size is too big`. [This is the fix](https://powerusers.microsoft.com/t5/Power-Apps-Pro-Dev-ISV/imported-PCF-solution-error/m-p/552539/highlight/true#M2373).

- Set system-level settings for Microsoft Dynamics 365
- Go to Settings > Administration > System Settings
- Go to the email tab
- Increase the maximum allowed attachment size to (for example) 20480
