# cui-quintiles
The CUI implementation for a demo to Quintiles.

## Getting Started

### Prerequisites

1. Node and npm - https://nodejs.org/en/ (every step after this requires npm)
2. Grunt cli - run `npm install -g grunt-cli`
3. Yeoman - run `npm install -g yo`
4. (Optional) NetBeans IDE HTML5 version

### Get started

1. Change the appearance settings in app-custom\scss\0-base\variables.scss.
2. Make sure your cui-18n language project is setup. Everywhere cui-i18n-bcbsm is written depends on it.
3. Make any remaining customizations to the necessary feature in app-custom\ and index.html.

## How it works

There are two main folders, app and app-custom. Make any changes to app-custom rather than app.

`app/` will in theory have the most up to date b2x code - the common-templates and modules folders specifically. To update it, all you have to do is run yo cui-ng:update from your new project's root.

`app-custom/` is where your custom code should live. The grunt copy task is setup so that any files in this folder that have the same path and file name as the ones in the app folder will be the ones that your app uses.

### How to customize the app

In this example, say we want to change the way the applications are being shown in the 'My applications' screen. What you would do is:

1. Make an applications folder within `app-custom/modules/`
2. Inside that folder, make another folder called `myApplications` (mimicking the structure withing the app folder)
3. Create a file called `myApplications.html` in that folder. This file will always override the one in the app folder, no matter what updates come in the future.

NOTES:

1. Every time you want to reference an asset in `app-custom`, be it an image or html template, make sure to point to `app` instead of `app-custom`, since everything gets moved to the `app` folder during the build process
2. All html files in app-custom get concatenated and merged in with the rest of your js files, using ng-templates. This helps reduce the number of http requests. If for some reason you need an html file to carry over (maybe to open in a new tab), simply create a `non-concat` folder in app-custom and put your html files in there (remember to follow the first note when referencing them)


The benefits of this yeoman generator should be clear now: You can change pieces in a file by file fashion without compromising your ability to get updates to the other moving pieces.

### How to run the app

* Running `grunt` from the root of the project will start browsersync which is a grunt task that starts an auto-reloaded browser page. Every time you make a change to any file in app-custom the page will refresh with the newest changes
* `grunt build` concatenates and minifies all the assets needed to run this app and puts it into a 'build/' folder. Note that if you add image assets or any sort of assets that is not javascript or html you will need to change the build task (The `tasks/` folder does _not_ get updated when you run `yo cui-ng:update`)
* `grunt demo` launches a browsersync window from the build folder, giving you an accurate representation of what the app will look like once it's deployed

### Other features

* From your `app-custom/modules/` folder you can run `yo cui-ng:add-module` to kick start a new module structure with a basic state configuration.
* Likewise, from within a nested module folder (for example, `app-custom/modules/applications/myApplications/`) you can kick start a new feature by running `yo cui-ng:add-controller`. This will create a new controller attached to the applications module and, optionally, a new html template file that matches the name of the controller.

## License

Copyright (c) 2015 Covisint Corporation. All Rights Reserved.
