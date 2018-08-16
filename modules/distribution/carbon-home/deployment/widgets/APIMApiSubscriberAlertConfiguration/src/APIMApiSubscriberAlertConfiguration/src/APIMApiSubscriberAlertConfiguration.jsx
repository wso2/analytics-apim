/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { Component } from 'react';
import VizG from 'react-vizgrammar';
import Widget from '@wso2-dashboards/widget';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import {MuiThemeProvider} from 'material-ui/styles';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
/*import {MuiThemeProvider, createMuiTheme} from '@material-ui/core/styles';


const darkTheme = createMuiTheme({
    palette: {
        type: "dark"
    }
});

const lightTheme = createMuiTheme({
    palette: {
        type: "light"
    }
});
*/
class APIMApiSubscriberAlertConfiguration extends Widget {
    
    constructor(props) {
         super(props);
         
        this.chartConfig = {
            "charts": [
                {
                    "type": "table",
                    "columns": [
                        
                        {
                            "name" : "applicationId",
                            "title": "Application ID"
                        },
                        {
                            "name": "apiName",
                            "title": "Api Name"
                        },
                        {
                            "name": "apiVersion",
                            "title": "Api Version"
                        },
                        {
                            "name": "thresholdRequestCountPerMin",
                            "title": "Threshold Request Count"
                        }
                    ]
                }
            ],
            "pagination": true,
            "filterable": true,
            "append": false
        };


        this.metadata = {
            "names": [
                "applicationId",
                "apiName",
                "apiVersion",
                "thresholdRequestCountPerMin"
            ],
            "types": [
                "ordinal",
                "ordinal",
                "ordinal",
                "ordinal"
            ]
        };
         
         this.state = {
            chartConfig:this.chartConfig,
            metadata:this.metadata,
            loaddata:this.loaddata,
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            data:[],
            dataProviderConf:[],
            apiName:[],
            apiVersion:[]

         };
        
         this.props.glContainer.on('resize', () =>
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            })
         );

         this.handleDataReceived = this.handleDataReceived.bind(this);
         this.handleDataManaged = this.handleDataManaged.bind(this);
         this.handleSubmit = this.handleSubmit.bind(this);
         this.handleChange = this.handleChange.bind(this);
    }
    
    componentDidMount() 
    {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
               
            super.getWidgetChannelManager().subscribeWidget(this.props.id,this.handleDataReceived, message.data.configs.providerConfig);
            console.info(message.data.configs.providerConfig);
            this.setState({
                    dataProviderConf : message.data.configs.providerConfig
                }); 
            })
            .catch((error) => {
                this.setState({
                    faultyProviderConf: true
                });
            })
            
            
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleDataReceived(message) {
        this.setState({
            data:message.data
        });
        
    }

    handleDataManaged(message)
    {
    }

    handleChange(event)
    {
       const name = event.target.name;
       this.setState({
           [name]:event.target.value
       });
       console.log(this.state.apiName);
    }

    handleNameChange(event)
    {
        this.setState({
            apiName:event.target.value
        });
        console.log(this.state.apiName);
    }

    handleSubmit()
    {
       console.log(this.state.dataProviderConf);
       let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
       let query;
       
       let applicationId = this.state.applicationId;
       let apiName = this.state.apiName;
       let apiVersion = this.state.apiVersion;
       let tRequestCount = parseInt(this.state.tRequestCount);
       
       if(applicationId != null && apiName != null && apiVersion != null && tRequestCount != null)
       {  
            if(tRequestCount == 0)
            {
                    query = dataProviderConfigs.configs.config.queryData.queryDelete;
                    query = query
                    .replace('{{applicationId}}',applicationId)
                    .replace('{{apiName}}',apiName)
                    .replace('{{apiVersion}}',apiVersion)
            }
            else if(tRequestCount > 0)
            {
                    query = dataProviderConfigs.configs.config.queryData.queryInsert;
                    query = query
                    .replace('{{applicationId}}',applicationId)
                    .replace('{{apiName}}',apiName)
                    .replace('{{apiVersion}}',apiVersion)
                    .replace('{{tRequestCount}}',tRequestCount);
            }
            alert("Reload to see the changes");
        }
        else{
            alert("Please fill all values");
        }

       dataProviderConfigs.configs.config.queryData.query=query;
       super.getWidgetChannelManager().subscribeWidget(this.props.id+"manage",this.handleDataManaged,dataProviderConfigs);
    }

    render() {
        return ( 
            <MuiThemeProvider> 
                <section>
                    
                        <input type="text" name="applicationId"  placeholder="application Id" value={this.state.applicationId} onChange={this.handleChange} required/>
                        <input type="text" name="apiName" placeholder="api name"  onChange={this.handleChange} required/>
                        <input type="text" name="apiVersion" placeholder="api Version" value={this.state.apiVersion} onChange={this.handleChange} required/>
                        <input type="text" name="tRequestCount" placeholder="Threshold Request Count" onChange={this.handleChange} required/>
                        <button onClick={this.handleSubmit}>submit</button>
                
                </section>        
                <section style={{ paddingTop: 50 }}>                    
                    <VizG
                        config={this.state.chartConfig}
                        metadata={this.state.metadata}
                        data={this.state.data}
                        theme={this.props.muiTheme.name}
                    />
                </section>
            </MuiThemeProvider>
        );
    }
}

 
global.dashboard.registerWidget('APIMApiSubscriberAlertConfiguration',APIMApiSubscriberAlertConfiguration); //(widgetId,reactComponent)
