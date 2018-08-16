/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: './samples/index',
    output: {
        path: path.resolve(__dirname, './docs'),
        filename: 'app.js',
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                exclude: [path.resolve(__dirname, './node_modules')],
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
            },

            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'css-loader', 'sass-loader'],
            },
            {
                test: /\.md$/,
                loader: 'raw-loader',
            },
            {
                test: /\.(jpg|png)$/,
                loader: 'url-loader',
            },
        ],
    },
    devServer: {
        contentBase: './docs',
        historyApiFallback: true,
        inline: true,
        port: 8080,
    },
    resolve: {
        extensions: ['.js', '.json', '.jsx', '.scss'],
    },
};
