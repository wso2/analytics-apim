/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

var Generator = require('yeoman-generator');
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option('babel');
    this.argument("widgetType", { type: String, required: true });
    this.argument("dataProvider", { type: String, required: true });
  }

  async prompting() {
    var inputName = this.options.widgetType;
    var dataprovider = this.options.dataProvider;

    this.answers = await this.prompt([
      {
        type: "input",
        name: "widgetName",
        message: "Enter Widget Name",
        default: "APIMSample",
        validate: function(value) {
          var pass = value.match(
           /^[a-zA-Z_]*$/i
          );
          if (pass) {
            return true;
          }
          return 'Please enter a valid Widget Name';
        }
      },
      {
        type: "input",
        name: "widgetHeading",
        message: "Enter Widget Heading",
        default: "Sample Heading"
      }
    ]);
  }

  writing() {
    if (this.options.widgetType === 'subscriber') {
      this.fs.copyTpl(
        this.templatePath('subscriber.jsx'),
        this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/${this.answers.widgetName}widget.jsx`),
        { 
          className: `${this.answers.widgetName}widget`,
          widgetId: this.answers.widgetName,
        }
      );
      if (this.options.dataProvider === 'SiddhiDataProvider') {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfSiddhi.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            widgetType: 'subscriber',
          }
        );
      } else {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfRdbms.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            widgetType: 'subscriber',
          }
        );
      }
    } else if (this.options.widgetType === 'publisher') {
      this.fs.copyTpl(
        this.templatePath('publisher.jsx'),
        this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/${this.answers.widgetName}widget.jsx`),
        { 
          className: `${this.answers.widgetName}widget`,
          widgetId: this.answers.widgetName
        }
      );
      if (this.options.dataProvider === 'SiddhiDataProvider') {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfSiddhi.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            dataProvider: 'SiddhiStoreDataProvider',
            widgetType: 'publisher'
          }
        );
      } else {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfRdbms.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            dataProvider: 'RDBMSStreamingDataProvider',
            widgetType: 'publisher'
          }
        );
      }
    } else {
      this.fs.copyTpl(
        this.templatePath('standalone.jsx'),
        this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/${this.answers.widgetName}widget.jsx`),
        { 
          className: this.answers.widgetName+'widget',
          widgetId: this.answers.widgetName
        }
      );
      if (this.options.dataProvider == 'SiddhiDataProvider') {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfSiddhi.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            dataProvider: 'SiddhiStoreDataProvider',
            widgetType: 'subscriber'
          }
        );
      } else {
        this.fs.copyTpl(
          this.templatePath('resources/widgetConfRdbms.json'),
          this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/widgetConf.json`),
          { 
            className: `${this.answers.widgetName}widget`,
            widgetId: this.answers.widgetName,
            dataProvider: 'RDBMSStreamingDataProvider',
            widgetType: 'subscriber'
          }
        );
      }
    }

    this.fs.copyTpl(
      this.templatePath('resources/locales/en.json'),
      this.destinationPath(`widgetTemplates/${this.answers.widgetName}/src/resources/locales/en.json`),
      { widgetHeading: this.answers.widgetHeading }
    );
    this.fs.copyTpl(
      this.templatePath('webpack.config.js'),
      this.destinationPath(`widgetTemplates/${this.answers.widgetName}/webpack.config.js`),
      { 
        className: `${this.answers.widgetName}widget`,
        widgetId: this.answers.widgetName,
        dataProvider: this.answers.dataProvider,
        widgetType: this.options.widgetType
      }
    );
    this.fs.copyTpl(
      this.templatePath('.eslintrc.js'),
      this.destinationPath(`widgetTemplates/${this.answers.widgetName}/.eslintrc.js`),
    );

    const pkgJson = {
      name: this.answers.widgetName,
      version: '1.0.0',
      private: true,
      dependencies: {
        '@material-ui/core': '^3.9.0',
        '@material-ui/icons': '^3.0.2',
        '@wso2-dashboards/widget': '^1.4.0',
        'react': '^16.7.0',
        'react-dom': '^16.7.0',
        'react-intl': '^2.8.0'
      },
      devDependencies: {
        '@babel/core': '^7.7.2',
        '@babel/plugin-proposal-class-properties': '^7.7.0',
        '@babel/preset-env': '^7.7.1',
        '@babel/preset-react': '^7.7.0',
        '@babel/register': '^7.7.0',
        'babel-eslint': '^10.0.3',
        'babel-loader': '^8.0.6',
        'copy-webpack-plugin': '^5.1.1',
        "cpr": "^3.0.1",
        'css-loader': '^3.4.2',
        'eslint': '^5.10.0',
        'eslint-config-airbnb': '^17.1.0',
        'eslint-plugin-import': '^2.14.0',
        'eslint-plugin-jsx-a11y': '^6.1.2',
        'eslint-plugin-react': '^7.11.1',
        'rimraf': '^2.6.3',
        'style-loader': '^0.20.3',
        'symlink-dir': '^3.1.2',
        'webpack': '^4.41.2',
        'webpack-cli': '^3.3.10'
      },
      'scripts': {
        'build': 'node_modules/.bin/webpack -p',
        'clean': 'rimraf dist',
        'dev': 'npm run build & npm run symlink && NODE_ENV=development node_modules/.bin/webpack -d --config webpack.config.js --watch --progress',
        'symlink': `symlink-dir ./dist/${this.answers.widgetName} ../../../../dashboard/deployment/web-ui-apps/analytics-dashboard/extensions/widgets/${this.answers.widgetName}`
      }
    };
  
    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath(`widgetTemplates/${this.answers.widgetName}/package.json`), pkgJson);
  }

  install() {
    let npmdir = this.destinationRoot(`widgetTemplates/${this.answers.widgetName}`);
    process.chdir(npmdir);	    
    this.installDependencies({
      npm: true,
      bower: false,
      yarn: false
    });
  }
};
