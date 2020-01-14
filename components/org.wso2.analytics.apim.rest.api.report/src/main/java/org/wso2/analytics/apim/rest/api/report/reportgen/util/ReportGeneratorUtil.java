/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.apim.rest.api.report.reportgen.util;

import io.siddhi.core.event.Event;
import io.siddhi.query.api.definition.Attribute;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.edit.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.xobject.PDJpeg;
import org.wso2.analytics.apim.rest.api.report.impl.ReportApiServiceImpl;
import org.wso2.analytics.apim.rest.api.report.reportgen.model.Record;
import org.wso2.analytics.apim.rest.api.report.reportgen.model.RecordDetail;
import org.wso2.analytics.apim.rest.api.report.reportgen.model.RowEntry;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 *
 */
public class ReportGeneratorUtil {

    private static final float ROW_HEIGHT = 25;
    private static final float CELL_PADDING = 10;
    private static final float CELL_MARGIN = 40; // margin on left side;
    private static final float TABLE_WIDTH = 500;
    private static final float TABLE_TOP_Y = 700;

    // Font configuration
    private static final PDFont TEXT_FONT = PDType1Font.HELVETICA;
    private static final float FONT_SIZE = 9;
    private static final float RECORD_COUNT_PER_PAGE = 25;

    /**
     *
     * @param events
     * @return
     */
    public static List<Record> getRecords(Event[] events) {

        List<Record> records = new ArrayList<>();
        if (events != null) {
            for (Event event : events) {
                Record record = new Record();
                record.addAll(Arrays.asList(event.getData()));
                records.add(record);
            }
        }
        return records;
    }

    /**
     * Get record details.
     *
     * @param attributes Set of attributes
     * @return List of record details
     */
    public static List<RecordDetail> getRecordDetails(Attribute[] attributes) {

        List<RecordDetail> details = new ArrayList<>();
        for (Attribute attribute : attributes) {
            details.add(new RecordDetail()
                    .name(attribute.getName())
                    .dataType(attribute.getType().toString()));
        }
        return details;
    }

    public static List<Integer> getRecordsPerPage(int numberOfRows) {

        int numOfPages = (int) Math.ceil(numberOfRows / RECORD_COUNT_PER_PAGE);
        List<Integer> recordCountPerPage = new ArrayList<>();

        int remainingRows = numberOfRows;

        if (numberOfRows < RECORD_COUNT_PER_PAGE) {
            recordCountPerPage.add(numberOfRows);
            return recordCountPerPage;
        } else {
            for (int i = 0; i < numOfPages; i++) {
                if (remainingRows >= RECORD_COUNT_PER_PAGE) {
                    recordCountPerPage.add((int) RECORD_COUNT_PER_PAGE);
                    remainingRows -= RECORD_COUNT_PER_PAGE;
                } else {
                    recordCountPerPage.add(remainingRows);
                }
            }
        }
        return recordCountPerPage;
    }

    public static void insertPageNumber(PDPageContentStream contentStream, int pageNumber) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        contentStream.beginText();
        contentStream.moveTextPositionByAmount((PDPage.PAGE_SIZE_A4.getUpperRightX() / 2),
                (PDPage.PAGE_SIZE_A4.getLowerLeftY()) + ROW_HEIGHT);
        contentStream.drawString(pageNumber + "");
        contentStream.endText();
    }

    public static void insertLogo(PDDocument document, PDPageContentStream contentStream) throws IOException {

        InputStream in = ReportApiServiceImpl.class.getResourceAsStream("/wso2-logo.jpg");
        PDJpeg img = new PDJpeg(document, in);
        contentStream.drawImage(img, 375, 755);
    }

    public static void insertReportTitleToHeader(PDPageContentStream contentStream, String title) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
        writeContent(contentStream, CELL_MARGIN, 770, title);
    }

    public static void insertReportTimePeriodToHeader(PDPageContentStream contentStream, String period)
            throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        writeContent(contentStream, CELL_MARGIN, 750, period);
    }

    public static void insertReportGeneratedTimeToHeader(PDPageContentStream contentStream) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        writeContent(contentStream, CELL_MARGIN, 730, "Report generated on : " + new Date().toString());
    }

    public static void writeContent(PDPageContentStream contentStream, float positionX, float positionY, String text)
            throws IOException {

        contentStream.beginText();
        contentStream.moveTextPositionByAmount(positionX, positionY);
        contentStream.drawString(text != null ? text : "");
        contentStream.endText();
    }

    public static void writeRowsContent(String[] columnHeaders, float[] columnWidths, PDDocument document, Map<Integer,
            PDPage> pageMap, List<RowEntry> rowEntries) throws IOException {

        float startX = CELL_MARGIN + CELL_PADDING; // space between entry and the column line
        float startY = TABLE_TOP_Y - (ROW_HEIGHT / 2)
                - ((TEXT_FONT.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * FONT_SIZE) / 4);

        PDPageContentStream contentStream = new PDPageContentStream(document, pageMap.get(1), true, false);

        // write table column headers
        writeColumnHeader(contentStream, columnWidths, startX, startY, columnHeaders);

        startY -= ROW_HEIGHT;
        startX = CELL_MARGIN + CELL_PADDING;

        int currentPageNum = 1;
        int rowNum = 0;
        // write content
        for (RowEntry entry : rowEntries) {
            rowNum += 1;
            if (rowNum > RECORD_COUNT_PER_PAGE) {
                contentStream.close();
                currentPageNum += 1;
                contentStream = new PDPageContentStream(document, pageMap.get(currentPageNum), true, false);
                contentStream.setFont(TEXT_FONT, FONT_SIZE);
                startY = TABLE_TOP_Y - (ROW_HEIGHT / 2)
                        - ((TEXT_FONT.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * FONT_SIZE) / 4);
                startX = CELL_MARGIN + CELL_PADDING;
                rowNum = 1;
            }
            writeToRow(contentStream, columnWidths, startX, startY, entry);
            startY -= ROW_HEIGHT;
            startX = CELL_MARGIN + CELL_PADDING;
        }
    }

    public static void writeToRow(PDPageContentStream contentStream, float[] columnWidths, float positionX,
                                  float positionY, RowEntry entry)
            throws IOException {

        for (int i = 0; i < columnWidths.length; i++) {
            writeContent(contentStream, positionX, positionY, entry.getEntries().get(i));
            positionX += columnWidths[i];
        }
        contentStream.close();
    }

    public static void writeColumnHeader(PDPageContentStream contentStream, float[] columnWidths, float positionX,
                                         float positionY, String[] content)
            throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        for (int i = 0; i < columnWidths.length; i++) {
            writeContent(contentStream, positionX, positionY, content[i]);
            positionX += columnWidths[i];
        }
        contentStream.setFont(TEXT_FONT, FONT_SIZE);
        contentStream.close();
    }

    /**
     * Draws the table grid.
     *
     * @param numberOfRows number of rows for the table
     * @throws IOException
     */
    public static void drawTableGrid(PDDocument document, Map<Integer,
            PDPage> pageMap, List<Integer> recordsPerPageList, float[] columnWidths, int numberOfRows)
            throws IOException {

        float nextY = TABLE_TOP_Y;

        // draw horizontal lines
        int currentPageNum = 1;
        PDPageContentStream contentStream = new PDPageContentStream(document, pageMap.get(currentPageNum), true,
                false);
        int rowNum = 0;
        for (int i = 0; i <= numberOfRows + 1; i++) {
            contentStream.drawLine(CELL_MARGIN, nextY, CELL_MARGIN + TABLE_WIDTH, nextY);
            nextY -= ROW_HEIGHT;
            if (rowNum > RECORD_COUNT_PER_PAGE) {
                contentStream.close();
                currentPageNum++;
                contentStream = new PDPageContentStream(document, pageMap.get(currentPageNum),
                        true, false);
                insertPageNumber(contentStream, currentPageNum);
                insertLogo(document, contentStream);
                nextY = TABLE_TOP_Y;
                rowNum = 0;
                numberOfRows++; // at each new page add one more horizontal line
            }
            rowNum++;
        }

        contentStream.close();

        // draw vertical lines
        for (int k = 1; k <= pageMap.size(); k++) {
            float tableYLength = (ROW_HEIGHT * (recordsPerPageList.get(k - 1)));
            float tableBottomY = TABLE_TOP_Y - tableYLength;
            if (k == 1) {
                tableBottomY -= ROW_HEIGHT;
            }
            float nextX = CELL_MARGIN;

            contentStream = new PDPageContentStream(document, pageMap.get(k), true, false);
            for (float columnWidth : columnWidths) {
                contentStream.drawLine(nextX, TABLE_TOP_Y, nextX, tableBottomY);
                nextX += columnWidth;
            }
            contentStream.drawLine(CELL_MARGIN + TABLE_WIDTH, TABLE_TOP_Y, CELL_MARGIN + TABLE_WIDTH, tableBottomY);
            contentStream.close();
        }
    }

    public static int getNumberOfPages(int numberOfRows) {

        return (int) Math.ceil(numberOfRows / RECORD_COUNT_PER_PAGE);
    }

}
