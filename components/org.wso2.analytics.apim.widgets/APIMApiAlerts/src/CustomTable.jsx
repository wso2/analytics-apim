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
import PropTypes from 'prop-types';
import MUIDataTable from "mui-datatables";

/**
 * Tabular display of APIM Api Alerts
 */
class CustomTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }


    render() {
        const { data } = this.props;

        const columns = [
            {
             name: "name",
             label: "Api Name",
             options: {
              filter: true,
              sort: true,
             }
            },
            {
             name: "version",
             label: "Version",
             options: {
              filter: true,
              sort: false,
             }
            },
            {
             name: "hits",
             label: "Hits",
             options: {
              filter: true,
              sort: false,
             }
            },
           ];

        
        const options = {
          selectableRows: 'none',
        };

        return (
            <MUIDataTable 
                data={data} 
                columns={columns} 
                options={options} 
            />
        );
    }
}

CustomTable.propTypes = {
    data: PropTypes.instanceOf(Object).isRequired,
    isloading: PropTypes.bool.isRequired,
};

export default (CustomTable);
