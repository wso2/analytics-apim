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

function summarizePieData(data = [], nameField, countField) {
    const PIE_CHART_LIMIT = 8;
    // data could be null
    data = (data === null) ? [] : data;
    const pieChartData = data.sort((a, b) => {
        return b[countField] - a[countField];
    });

    if (data.length > PIE_CHART_LIMIT) {
        const otherPieChartData = pieChartData.slice(PIE_CHART_LIMIT, pieChartData.length)
            .reduce((accumulator, currentValue) => {
                return { [nameField]: ['Other'], [countField]: accumulator[countField] + currentValue[countField] };
            }, { [nameField]: ['Other'], [countField]: 0 });

        pieChartData.splice(PIE_CHART_LIMIT, pieChartData.length, otherPieChartData);
    }
    const legendData = pieChartData.map((item) => {
        return { name: item[nameField] };
    });
    return {
        pieChartData,
        legendData
    };
}

export function buildCSVHeader(columns) {
    return '"' + columns.join('","') + '"\r\n';
}

export function buildCSVBody(data) {
    if (!data.length) return '';
    return data.reduce((soFar, row) => {
        if (row.id) delete row.id;
        return soFar + '"' + Object.values(row).join('","') + '"\r\n';
    }, '').trim();
}

export function downloadCSV(csv, title) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const dataURI = `data:text/csv;charset=utf-8,${csv}`;
    const URL = window.URL || window.webkitURL;
    const downloadURI = typeof URL.createObjectURL === 'undefined' ? dataURI : URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fileName = title.split(' ').join('_').replace(' ', '_') + '_DATA.csv';
    link.setAttribute('href', downloadURI);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function downloadPDF(doc, title, headers, dataToExport, username, timeTo, timeFrom) {
    const logoURL = findLogoURL(username);
    let image = new Image();
    const fileName = title.split(' ').join('_').replace(' ', '_') + '_DATA.pdf';

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica");
    doc.setFontStyle("bold");
    doc.setFontSize(16);
    doc.text(15, 17, convertToTitleCase(title));

    const generationDate = 'Report generated on : ' + Date(Date.now()).toString();
    doc.setFontSize(9);
    doc.text(15, 23, generationDate);
    if (timeTo && timeFrom) {
        doc.setFontStyle("normal")
        doc.text(15, 30, "From : " + new Date(timeFrom).toString());
        doc.text(15, 35, "To : " + new Date(timeTo).toString());
    }

    doc.autoTable({
        alternateRowStyles: { fillColor: false },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
        headStyles: { fillColor: false, textColor: [0, 0, 0], fontSize: 9, minCellHeight: 9, valign: 'middle' },
        bodyStyles: { textColor: [0, 0, 0], fontSize: 9, minCellHeight: 9, valign: 'middle' },
        head: headers,
        body: dataToExport,
        startY: 42,
    });

    image.onload = function () {
        let canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth;
        canvas.height = this.naturalHeight;
        canvas.getContext('2d').drawImage(this, 0, 0);
        doc.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 141, 9, 62, 22);
        doc.save(fileName);
    };
    image.src = logoURL;
}

function convertToTitleCase(string) {
    const sentence = string.toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(' ');
}

function findLogoURL(username) {
    let tenantName = '';
    const contextPath = '/analytics-dashboard/public/app/images/';
    const baseURL = window.location.origin;
    const logoName = 'pdf-report-logo.jpg';
    const defaultLogoURL = baseURL + contextPath + logoName;
    const usernameParts = username.split('@');
    if (usernameParts.length === 3) {
        tenantName = usernameParts[2];
    } else if (usernameParts.length === 2) {
        tenantName = usernameParts[1];
    } else {
        tenantName = 'carbon.super'
    }
    const customLogoURL = baseURL + contextPath + tenantName + '/' + logoName;
    return isLogoExists(customLogoURL) ? customLogoURL : defaultLogoURL;

}

function isLogoExists(URL) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', URL, false);
    xhr.send();
    return xhr.status === 200;
}

export default {
    summarizePieData,
    buildCSVBody,
    buildCSVHeader,
    downloadCSV,
    downloadPDF,
    convertToTitleCase,
};
