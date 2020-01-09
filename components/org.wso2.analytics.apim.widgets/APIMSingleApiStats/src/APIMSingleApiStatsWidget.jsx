/* eslint-disable require-jsdoc */
/* eslint-disable no-console */
/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React from 'react';
import {
    defineMessages, IntlProvider, FormattedMessage,
} from 'react-intl';
import Axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Widget from '@wso2-dashboards/widget';
import APIMSingleApiStats from './APIMSingleApiStats';
import Moment from 'moment';

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
    },
    typography: {
        useNextVariants: true,
    },
});

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
    },
    typography: {
        useNextVariants: true,
    },
});



const queryParamKey = 'recentapistats';


const language = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;


const languageWithoutRegionCode = language.toLowerCase().split(/[_-]+/)[0];

//Create react component for the APIM Recent Api Traffic
class APIMSingleApiStatsWidget extends Widget {
   
    constructor(props) {
        super(props);
        this.styles = {
            loadingIcon: {
                margin: 'auto',
                display: 'block',
            },
            paper: {
                padding: '5%',
                border: '2px solid #4555BB',
            },
            paperWrapper: {
                margin: 'auto',
                width: '50%',
                marginTop: '20%',
            },
            inProgress: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: this.props.height,
            },
        };

        
        this.state = {
            width: this.props.width,
            height: this.props.height,
            usageData: null,
            localeMessages: null,
            data:null,
            apiname:null,
            apiVersion:null,
            totalreqcount: null,
            trafficdata: null,
            totallatencycount: null,
            latencydata: null,
            totalerrorcount: null,
            errordata: null,
            avglatency: null,
            errpercentage: null,
            totalreqcounted: null,
            sorteddata: null,
            formatederrorpercentage: null,
            xAxisTicks: null,
            maxCount: null,
            isloading: true,

        };

        // This will re-size the widget when the glContainer's width is changed.
        if (this.props.glContainer !== undefined) {
            this.props.glContainer.on('resize', () => this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height,
            }));
        }

        this.assembleApiUsageQuery = this.assembleApiUsageQuery.bind(this);
        this.handleApiUsageReceived = this.handleApiUsageReceived.bind(this);
        this.assemblelatencyquery = this.assemblelatencyquery.bind(this);
        this.handlelatencyReceived = this.handlelatencyReceived.bind(this);
        this.assembleerrorsquery = this.assembleerrorsquery.bind(this);
        this.handleerrorsReceived = this.handleerrorsReceived.bind(this);
        this.errorpercentageQuery = this.errorpercentageQuery.bind(this);
        this.handlerrorRateReceived = this.handlerrorRateReceived.bind(this);
        this.assembletotalreqcountquery = this.assembletotalreqcountquery.bind(this);
        this.handletotalreqcountReceived = this.handletotalreqcountReceived.bind(this);
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.getresourcetemplates = this.getresourcetemplates.bind(this);
        this.handleresourcetemplates = this.handleresourcetemplates.bind(this);
        this.loadurldata=this.loadurldata.bind(this);
        this.loadLocale = this.loadLocale.bind(this);
    }


    componentDidMount() {
        const { widgetID } = this.props;
        const locale = languageWithoutRegionCode || language;
        this.loadLocale(locale);
        this.loadurldata();

        super.getWidgetConfiguration(widgetID)
            .then((message) => {
                this.setState({
                    providerConfig: message.data.configs.providerConfig,
                }, () => super.subscribe(this.handlePublisherParameters));
            })
            .catch((error) => {
                console.error("Error occurred when loading widget '" + widgetID + "'. " + error);
                this.setState({
                    faultyProviderConfig: true,
                });
            });
    }

    componentWillUnmount() {
        super.getWidgetChannelManager().unsubscribeWidget(this.props.id);
    }

    loadurldata(){
       var str = window.location.href;
       var iscommunicated = str.includes("apsssss");
       console.log(iscommunicated);
       if(iscommunicated){
          var stringArray = str.split("%22");
          //console.log(stringArray);
          //console.log(stringArray[5]);
          //console.log(stringArray[9]);
        this.setState({apiname:stringArray[5],apiVersion:stringArray[9]});
       }
       else{
          window.location.href = './recent-api-details';
       }
    }
 
    loadLocale(locale) {
        Axios.get(`${window.contextPath}/public/extensions/widgets/APIMSingleApiStats/locales/${locale}.json`)
            .then((response) => {
                this.setState({ localeMessages: defineMessages(response.data) });
            })
            .catch(error => console.error(error));
    }

    //Set the date time range
    handlePublisherParameters(receivedMsg) {
        this.setState({
            // totalreqcount: null,
            // trafficdata: null,
            // totallatencycount: null,
            // latencydata: null,
            // totalerrorcount: null,
            // errordata: null,
            // avglatency: null,
            // errpercentage: null,
            // totalreqcounted: null,
            // sorteddata: null,
            // formatederrorpercentage: null,
            // usageData: null,
            // data:null,
            timeFrom: receivedMsg.from,
            timeTo: receivedMsg.to,
            perValue: receivedMsg.granularity,
            isloading: true,
        }, this.assembleApiUsageQuery);
    }

    getresourcetemplates(){
        const { providerConfig,apiname,apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;
        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.queryData.queryName = 'resourcetemplates';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{apiname}}': apiname,
            '{{apiVersion}}':apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleresourcetemplates, dataProviderConfigs);
    }

    handleresourcetemplates(message){
        const { id } = this.props;

      //  console.log(data);

        super.getWidgetChannelManager()
        .subscribeWidget(id, widgetName, this.assembleApiUsageQuery, dataProviderConfigs);
    }

  
    //Format the siddhi query
    assembleApiUsageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,apiname,apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'trafficquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}':apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleApiUsageReceived, dataProviderConfigs);
    }

    
    //format the query data
    handleApiUsageReceived(message) {
        const { data } = message;
        const { id } = this.props;
        if (data) {
            const trafficdata = [];
            var xAxisTicks = [];
            let totalreqcount = 0;

            data.forEach((e) => {
                totalreqcount+= e[2];
                trafficdata.push({ x: Moment(e[1])
                    .format('YYYY/MM/DD hh:mm'), y: e[2] },);
            });

            // const maxCount = trafficdata[trafficdata.length - 1].y;

            // const first = new Date(trafficdata[0].x).getTime();
            // const last = new Date(trafficdata[trafficdata.length - 1].x).getTime();
            // const interval = (last - first) / 5;
            // let duration = 0;
            // xAxisTicks.push(first);
            // for (let i = 1; i <= 5; i++) {
            //     duration = interval * i;
            //     xAxisTicks.push(new Date(first + duration).getTime());
            // }

            this.setState({ trafficdata, totalreqcount});

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assemblelatencyquery();
        }
    }

    // format siddhi query to get average latency
    assemblelatencyquery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,apiname,apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'latencyquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}':apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handlelatencyReceived, dataProviderConfigs);
    }


    // format the data received for latency query
    handlelatencyReceived(message) {
        const { data } = message;
        const { id } = this.props;
        if (data) {
            const latencydata = [];
            let totallatencycount = 0;
            let totallatencytime = 0;
            let avglatency = 0;

            data.forEach((e) => {
                totallatencycount+= e[2];
                latencydata.push({ x: Moment(e[1])
                    .format('YYYY/MM/DD hh:mm'), y: (e[3]/e[2]) },);
                totallatencytime += e[3];
            });
            
            avglatency = Math.floor(totallatencytime/totallatencycount);

            //console.log(latencydata);
            if(isNaN(avglatency)){
                this.setState({ latencydata: latencydata, avglatency: 0});
            }
            else
            this.setState({ latencydata, avglatency});

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.assembleerrorsquery();
        }
    }

    // format the siddhi query for error count
    assembleerrorsquery() {
        const {
            timeFrom, timeTo, perValue, providerConfig,apiname,apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);

        dataProviderConfigs.configs.config.apiname = apiname;
        dataProviderConfigs.configs.config.apiVersion = apiVersion;
        dataProviderConfigs.configs.config.queryData.queryName = 'errorquery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}':apiVersion,
        };
        //console.log(timeFrom,timeTo,perValue);
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handleerrorsReceived, dataProviderConfigs);
    }


    // format the error count received
    handleerrorsReceived(message) {
        const { data } = message;
        const { id } = this.props;
       // console.log(data);
        if (data) {
            const errordata = [];
            let totalerrorcount = 0;

            data.forEach((e) => {
                totalerrorcount += e[2];
                errordata.push({ x: Moment(e[3])
                    .format('YYYY/MM/DD hh:mm'), y: (e[2]) },);
            });

            this.setState({ totalerrorcount:totalerrorcount, errordata: errordata });

            super.getWidgetChannelManager().unsubscribeWidget(id);
            this.errorpercentageQuery();
        }
    }

    //first query to retreive the error percentage
    errorpercentageQuery() {
        const {
            timeFrom, timeTo, perValue, providerConfig, apiname, apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalerrorQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}':apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handlerrorRateReceived, dataProviderConfigs);
    }

    // format the total error count received
    handlerrorRateReceived(message) {
        const { data } = message;
        console.log(data);
        const { id } = this.props;

       this.setState({ errpercentage: data })

        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.assembletotalreqcountquery();
    }

   
    // retreive total request count to calculate error percentage
    assembletotalreqcountquery() {
        const {
            timeFrom, timeTo, providerConfig, perValue, apiname, apiVersion
        } = this.state;
        const { id, widgetID: widgetName } = this.props;

        const dataProviderConfigs = cloneDeep(providerConfig);
        dataProviderConfigs.configs.config.queryData.queryName = 'totalReqCountQuery';
        dataProviderConfigs.configs.config.queryData.queryValues = {
            '{{from}}': timeFrom,
            '{{to}}': timeTo,
            '{{per}}': perValue,
            '{{apiname}}': apiname,
            '{{apiVersion}}': apiVersion,
        };
        super.getWidgetChannelManager()
            .subscribeWidget(id, widgetName, this.handletotalreqcountReceived, dataProviderConfigs);
    }

    // format the data received by totalreqcount query
    handletotalreqcountReceived(message) {
        const { data } = message;
        const { id } = this.props;
       // console.log(data);

    
        this.setState({ totalreqcounted: data });
        super.getWidgetChannelManager().unsubscribeWidget(id);
        this.analyzeerrorrate();
    }

    // analyze the errors received
    analyzeerrorrate() {
        const { errpercentage, totalreqcounted } = this.state;
       console.log(errpercentage, totalreqcounted);
        const sorteddata = [];
        let totalhits = 0;
        let totalerrors = 0;
        let errorpercentage = 0;

        // console.log(errorpercentage);

        errpercentage.forEach((element) => {
            totalerrors += element[1];
        });

        totalreqcounted.forEach((element) => {
            totalhits += element[1];
        });

        errorpercentage = ((totalerrors / totalhits) * 100).toPrecision(3);

        errpercentage.forEach((dataUnit) => {
            for (let err = 0; err < totalreqcounted.length; err++) {
                if (dataUnit[0] === totalreqcounted[err][0]) {
                    const percentage = (totalreqcounted[err][1] / dataUnit[1]) * 100;
                    sorteddata.push({
                        x: '( '+totalreqcounted[err][0]+' )' + ' ' + percentage.toPrecision(3) + '%', y: percentage,
                    });
                }
            }
        });
        
        if(errorpercentage.length == 0 || isNaN(errorpercentage)){
            this.setState({ sorteddata, formatederrorpercentage:0 });
        }
        else
        this.setState({ sorteddata, formatederrorpercentage:errorpercentage, isloading: false, });
    }

    

    render() {
        const {
            localeMessages, faultyProviderConfig, height, apiname,apiVersion, totalreqcount, trafficdata, latencydata, totallatencycount, timeFrom, timeTo, 
            totalerrorcount, errordata, avglatency, formatederrorpercentage, sorteddata, isloading
        } = this.state;
        const {
            loadingIcon, paper, paperWrapper, inProgress,
        } = this.styles;
        const { muiTheme } = this.props;
        const themeName = muiTheme.name;
        const apiUsageProps = {
            themeName, height,trafficdata, apiname,apiVersion, totalreqcount, latencydata, totallatencycount, timeFrom, timeTo, 
            totalerrorcount, errordata, avglatency, formatederrorpercentage, sorteddata
        };

        if (!localeMessages || !trafficdata || isloading) {
            return (
                <div style={inProgress}>
                    <CircularProgress style={loadingIcon} />
                </div>
            );
        }
        return (
            <IntlProvider locale={languageWithoutRegionCode} messages={localeMessages}>
                <MuiThemeProvider theme={themeName === 'dark' ? darkTheme : lightTheme}>
                    {
                        faultyProviderConfig ? (
                            <div style={paperWrapper}>
                                <Paper elevation={1} style={paper}>
                                    <Typography variant='h5' component='h3'>
                                        <FormattedMessage
                                            id='config.error.heading'
                                            defaultMessage='Configuration Error !'
                                        />
                                    </Typography>
                                    <Typography component='p'>
                                        <FormattedMessage
                                            id='config.error.body'
                                            defaultMessage={'Cannot fetch provider configuration forAPIM Api '
                                            + 'Recent Api Traffic widget'}
                                        />
                                    </Typography>
                                </Paper>
                            </div>
                        ) : (
                            <APIMSingleApiStats
                                {...apiUsageProps}
                            />
                        )
                    }
                </MuiThemeProvider>
            </IntlProvider>
        );
    }
}

global.dashboard.registerWidget('APIMSingleApiStats', APIMSingleApiStatsWidget);
