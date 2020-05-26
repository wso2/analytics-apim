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

function summarizePieData(data=[], nameField, countField) {
    const PIE_CHART_LIMIT = 8;
    // data could be null
    data = (data === null) ? [] : data;
    const pieChartData = data.sort((a, b) => {
        return b[countField] - a[countField];
    });

    if (data.length > PIE_CHART_LIMIT) {
        const otherPieChartData = pieChartData.slice(PIE_CHART_LIMIT, pieChartData.length)
            .reduce((accumulator, currentValue) => {
                return { [nameField]: ['Other'],[countField]: accumulator[countField] + currentValue[countField] };
            }, { [nameField]: ['Other'],[countField]: 0 });

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

export function downloadPDF(doc, title, headers, dataToExport) {
    const base64Data = 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODww'
        + 'QFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSgBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCg'
        + 'oKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAEAAuAMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgs'
        + 'QAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZ'
        + 'HSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tf'
        + 'Y2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITE'
        + 'GEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd'
        + '4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gA'
        + 'MAwEAAhEDEQA/APqmgAoAp6vqEWlabPe3CSPFCNzCMZbH0rHEV40KbqyWi7G+GoSxFWNKLs33KXhrxHYeIreWbTzIBE2xlkADDjIOMnj'
        + '/AArHB46ljIuVPp3N8fl9bATUK3XsbNdhwhQBWgvree8uLWKQGe32mRO67hkVnGrCU3BPVb/M0lRnGEajWkr2+W5ZrQzAnFAHM65400v'
        + 'R9UXT7hbmS5IU7YUDYJ6DqOf8a83E5rQw1X2Mrt+R6uEybEYui68LKK7vt8jS1nX9N0aFZNSuVg3DKoeWb6Ac10YjGUcMuarKxy4XA18'
        + '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';

    const fileName = title.split(' ').join('_').replace(' ', '_') + '_DATA.pdf';

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica");
    doc.setFontStyle("bold");
    doc.setFontSize(16);
    doc.text(15, 17, convertToTitleCase(title));

    const generationDate = 'Report generated on : ' + Date(Date.now()).toString();
    doc.setFontSize(9);
    doc.text(15, 23, generationDate);
    doc.addImage(base64Data, 'JPEG', 141, 9, 62, 22);
    doc.autoTable({
        alternateRowStyles: { fillColor: false },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
        headStyles: { fillColor: false, textColor: [0, 0, 0], fontSize: 9, minCellHeight: 9, valign: 'middle' },
        bodyStyles: { textColor: [0, 0, 0], fontSize: 9, minCellHeight: 9 , valign: 'middle' },
        head: headers,
        body: dataToExport,
        startY: 42,
    });
    doc.save(fileName);
}

function convertToTitleCase(string) {
    const sentence = string.toLowerCase().split(" ");
    for ( var i = 0; i< sentence.length; i++ ) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(' ');
}

/**
 * Stabilize the data set and sort the data fields
 * @param {object} array - data set
 * @param {object} cmp - method to sort
 * @return {object}
 * */
export function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

/**
 * Set the value received from desc() according to 'order'
 * @param {string} order - desc or asc
 * @param {string} orderBy - column to sort table
 * @return {object}
 * */
export function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

/**
 * Compare two values and return the result
 * @param {object} a - data field
 * @param {object} b - data field
 * @param {string} orderBy - column to sort table
 * @return {number}
 * */
function desc(a, b, orderBy) {
    let tempa = a[orderBy];
    let tempb = b[orderBy];

    if (typeof (tempa) === 'string') {
        tempa = tempa.toLowerCase();
        tempb = tempb.toLowerCase();
    }

    if (tempb < tempa) {
        return -1;
    }
    if (tempb > tempa) {
        return 1;
    }
    return 0;
}

export default {
    summarizePieData,
    buildCSVBody,
    buildCSVHeader,
    downloadCSV,
    downloadPDF,
    convertToTitleCase,
    stableSort,
    getSorting,
};
