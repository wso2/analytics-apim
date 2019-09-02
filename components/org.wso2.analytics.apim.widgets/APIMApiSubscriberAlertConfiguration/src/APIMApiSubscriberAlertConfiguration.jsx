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
import {MuiThemeProvider} from '@material-ui/core/styles';
import FlatButton from 'material-ui/FlatButton';
import TextField from '@material-ui/core/TextField';

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
            style: {
                legendTextColor: "#5d6e77"
            },
            pagination: true,
            filterable: true,
            append: false
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
            width: this.props.glContainer.width,
            height: this.props.glContainer.height,
            data:[],
            dataProviderConf:[],
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
    
    componentDidMount() {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
            super.getWidgetChannelManager().subscribeWidget(this.props.id, this.handleDataReceived, message.data.configs.providerConfig);
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

    componentWillUnmount(){
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    handleDataReceived(message) {
        this.setState({
            data:message.data
        });
    }

    handleDataManaged(message){ 
    }

    handleChange(event){
       this.setState({
           [event.target.name]:event.target.value
       });
    }

    handleSubmit(){
       let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
       let query;  
       let applicationId = this.state.applicationId;
       let apiName = this.state.apiName;
       let apiVersion = this.state.apiVersion;
       let tRequestCount = parseInt(this.state.tRequestCount);
       
       if(applicationId != null && apiName != null && apiVersion != null && tRequestCount != null){  
            if(tRequestCount == 0){
                query = dataProviderConfigs.configs.config.queryData.queryDelete;
                query = query
                .replace('{{applicationId}}',applicationId)
                .replace('{{apiName}}',apiName)
                .replace('{{apiVersion}}',apiVersion)
            }
            else{
                query = dataProviderConfigs.configs.config.queryData.queryInsert;
                query = query
                .replace('{{applicationId}}',applicationId)
                .replace('{{apiName}}',apiName)
                .replace('{{apiVersion}}',apiVersion)
                .replace('{{tRequestCount}}',tRequestCount);
            }
        }
        dataProviderConfigs.configs.config.queryData.query=query;
        super.getWidgetChannelManager().subscribeWidget(this.props.id+"manage",this.handleDataManaged,dataProviderConfigs);
    }

    render() {
        let styles={
            backgroundColor:'#c9ced6',padding:'10px',paddingLeft:'15px',paddingRight:'15px',margin:'10px',border:'none',font:'bold'
        };
        let inputFieldStyles = {
            margin:'10px', 
            border:'none',
            borderBottom:'solid white',
            color:'white',
            background:'none',
            font:'bold',
        };
        
        return ( 
            <MuiThemeProvider theme={this.props.muiTheme}> 
                <section> 
                    <input style={inputFieldStyles} type="text" name="applicationId"  placeholder="application Id" value={this.state.applicationId} onChange={this.handleChange} required/>       
                    <input style={inputFieldStyles} type="text" name="apiName" placeholder="api name"  onChange={this.handleChange} required/>
                    <input style={inputFieldStyles} type="text" name="apiVersion" placeholder="api Version" value={this.state.apiVersion} onChange={this.handleChange} required/>
                    <input style={inputFieldStyles} type="text" name="tRequestCount" placeholder="Threshold Request Count" onChange={this.handleChange} required/>
                    <button onClick={this.handleSubmit} style={styles}>submit</button>
                </section>        
                <section style={{ paddingTop: 50 }}>                    
                    <VizG
                        config={this.chartConfig}
                        metadata={this.metadata}
                        data={this.state.data}
                        theme={this.props.muiTheme.name}
                    />
                </section>
            </MuiThemeProvider>      
        );
    }
}
global.dashboard.registerWidget('APIMApiSubscriberAlertConfiguration',APIMApiSubscriberAlertConfiguration); //(widgetId,reactComponent)
