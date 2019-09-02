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
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';

class APIMApiCreatorAlertConfiguration extends Widget {
    
    constructor(props) {
         super(props);
         
        this.chartConfig = {
            charts: [
                {
                    type: "table",
                    columns: [
                        {
                            "name": "apiName",
                            "title": "Api Name"
                        },
                        {
                            "name": "apiVersion",
                            "title": "Api Version"
                        },
                        {
                            "name": "apiCreator",
                            "title": "Api Creator"
                        },
                        {
                            "name": "apiCreatorTenantDomain",
                            "title": "TenantDomain"
                        },
                        {
                            "name": "thresholdResponseTime",
                            "title": "thresholdResponseTime"
                        },
                        {
                            "name": "thresholdBackendTime",
                            "title": "thresholdBackendTime"
                        }
                    ]
                }
            ],
            pagination: true,
            filterable: true,
            append: false
        };

        this.metadata = {
            "names": [
                "apiName",
                "apiVersion",
                "apiCreator",
                "apiCreatorTenantDomain",
                "thresholdResponseTime",
                "thresholdBackendTime"
            ],
            "types": [
                "ordinal",
                "ordinal",
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
            dataProviderConf:[]
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

    handleDataManaged(message){
    }

    handleChange(event){
       this.setState({
           [event.target.name]:event.target.value
       });
    }

    handleSubmit(){
       console.log(this.state.dataProviderConf);
       let dataProviderConfigs = _.cloneDeep(this.state.dataProviderConf);
       let query;

       let apiName=this.state.apiName;
       let apiVersion=this.state.apiVersion;
       let apiCreator=this.state.apiCreator
       let tenantDomain=this.state.tenantDomain;
       let tResponseTime=parseInt(this.state.tResponseTime);
       let tBackendTime=parseInt(this.state.tBackendTime);
       if(apiName != null && apiVersion != null && apiCreator != null && tenantDomain != null && tResponseTime != null && tBackendTime != null){ 
            if(tResponseTime == 0 && tBackendTime == 0){
                query = dataProviderConfigs.configs.config.queryData.queryDelete;
                query = query
                .replace('{{apiName}}',this.state.apiName)
                .replace('{{apiVersion}}',this.state.apiVersion)
            }
            else{
                query = dataProviderConfigs.configs.config.queryData.queryInsert;
                query = query
                .replace('{{apiName}}',apiName)
                .replace('{{apiVersion}}',apiVersion)
                .replace('{{apiCreator}}',apiCreator)
                .replace('{{apiCreatorTenantDomain}}',tenantDomain)
                .replace('{{tResponseTime}}',tResponseTime)
                .replace('{{tBackendTime}}',tBackendTime);
            }
        
            dataProviderConfigs.configs.config.queryData.query=query;
            super.getWidgetChannelManager().subscribeWidget(this.props.id+"insert",this.handleDataManaged,dataProviderConfigs);
        } 
    }

    render() {
        return ( 
            <MuiThemeProvider theme={this.props.muiTheme}> 
                <section>
                    <input type="text" name="apiName" placeholder="api name"  onChange={this.handleChange}/>
                    <input type="text" name="apiVersion" placeholder="api Version" value={this.state.apiVersion} onChange={this.handleChange}/>
                    <input type="text" name="apiCreator"  placeholder="api Creator" value={this.state.apiCreator} onChange={this.handleChange}/>
                    <input type="text" name="tenantDomain" placeholder="Tenant Domain " value={this.state.apiCreatorTenantDomain} onChange={this.handleChange}/>
                    <input type="text" name="tResponseTime" placeholder="Threshold Response" value={this.state.tResponseTime} onChange={this.handleChange}/>
                    <input type="text" name="tBackendTime" placeholder="Threshold Backend" value={this.state.tBackendTime} onChange={this.handleChange}/>
                    <button onClick={this.handleSubmit}>submit</button> 
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

 
global.dashboard.registerWidget('APIMApiCreatorAlertConfiguration',APIMApiCreatorAlertConfiguration); //(widgetId,reactComponent)