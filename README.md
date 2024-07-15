# Custom PCF Components

This repo contains the source code for the custom PCF components used in Power Apps.

## Pre-requisites

- Visual Studio Code
- [Power Platform Tools](https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode) extension for Visual Studio Code
- After installing the Power Platform Tools extension you can use the `pac` command in the VSCode terminal
- Node.js

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
cd dts_pre_recorded_evidence_components
pac solution version --buildversion <version number>
dotnet build
```

This will output a zip file in `dts_pre_recorded_evidence_components/bin/Debug/dts_pre_recorded_evidence_components.zip`. This zip file can be imported into a solution to use the component here: <https://make.powerapps.com/environments/3df85815-859a-e884-8b20-6a6dac1054a1/solutions> (replace the environment ID with the ID of the environment you want to deploy to).

## Troubleshooting

When importing the solution you may receive the error `Webresource content size is too big`. [This is the fix](https://powerusers.microsoft.com/t5/Power-Apps-Pro-Dev-ISV/imported-PCF-solution-error/m-p/552539/highlight/true#M2373).

- Set system-level settings for Microsoft Dynamics 365
- Go to Settings > Administration > System Settings
- Go to the email tab
- Increase the maximum allowed attachment size to (for example) 20480
