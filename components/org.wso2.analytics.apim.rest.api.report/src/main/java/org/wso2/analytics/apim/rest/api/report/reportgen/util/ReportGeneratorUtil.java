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

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.edit.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.xobject.PDJpeg;
import org.wso2.analytics.apim.rest.api.report.impl.ReportApiServiceImpl;
import org.wso2.analytics.apim.rest.api.report.reportgen.model.RowEntry;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Util class for report generation.
 */
public class ReportGeneratorUtil {

    private static final float ROW_HEIGHT = 25;
    private static final float CELL_PADDING = 5;
    private static final float CELL_MARGIN = 40; // margin on left side;
    private static final float TABLE_WIDTH = 500;
    private static final float TABLE_TOP_Y = 700;

    // Font configuration
    private static final PDFont TEXT_FONT = PDType1Font.HELVETICA;
    private static final float FONT_SIZE = 9;
    private static final int RECORD_COUNT_PER_PAGE = 25;

    /**
     * Get List of integers with the number of records in each page.
     * @param numberOfRows total number of rows across the document.
     * @return list of integers with the number of records. Each index represents the page number - 1.
     */
    public static List<Integer> getRecordsPerPage(int numberOfRows) {

        int numOfPages = (int) Math.ceil(numberOfRows / (float) RECORD_COUNT_PER_PAGE);
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

    /**
     * Inserts page number onto the bottom center of the page.
     * @param contentStream content stream of the page.
     * @param pageNumber page number.
     * @throws IOException
     */
    public static void insertPageNumber(PDPageContentStream contentStream, int pageNumber) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        contentStream.beginText();
        contentStream.moveTextPositionByAmount((PDPage.PAGE_SIZE_A4.getUpperRightX() / 2),
                (PDPage.PAGE_SIZE_A4.getLowerLeftY()) + ROW_HEIGHT);
        contentStream.drawString(pageNumber + "");
        contentStream.endText();
    }

    /**
     * Inserts logo onto the top right of the page.
     * @param document
     * @param contentStream
     * @throws IOException
     */
    public static void insertLogo(PDDocument document, PDPageContentStream contentStream) throws IOException {

        InputStream in = ReportApiServiceImpl.class.getResourceAsStream("/wso2-logo.jpg");
        PDJpeg img = new PDJpeg(document, in);
        contentStream.drawImage(img, 375, 755);
    }

    /**
     * Inserts title to the page.
     * @param contentStream
     * @param title
     * @throws IOException
     */
    public static void insertReportTitleToHeader(PDPageContentStream contentStream, String title) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
        writeContent(contentStream, CELL_MARGIN, 790, title);
    }

    /**
     * Inserts report period to the page.
     * @param contentStream content stream of the page.
     * @param period the time duration which should be printed below the title.
     * @throws IOException
     */
    public static void insertReportTimePeriodToHeader(PDPageContentStream contentStream, String period)
            throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 14);
        writeContent(contentStream, CELL_MARGIN, 770, period);
    }

    /**
     * Inserts total request count of the report on the header.
     * @param contentStream content stream of the page.
     * @param totalRequestCount total aggregated count.
     * @throws IOException
     */
    public static void insertTotalRequestCountToHeader(PDPageContentStream contentStream, Long totalRequestCount)
            throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        writeContent(contentStream, CELL_MARGIN, 735, "Total Request count : " +
                totalRequestCount.toString());
    }

    /**
     * Inserts report generated time.
     * @param contentStream content stream of the page.
     * @throws IOException
     */
    public static void insertReportGeneratedTimeToHeader(PDPageContentStream contentStream) throws IOException {

        contentStream.setFont(PDType1Font.HELVETICA_BOLD, FONT_SIZE);
        writeContent(contentStream, CELL_MARGIN, 750, "Report generated on : " + new Date().toString());
    }

    /**
     *
     * @param contentStream content stream of the page.
     * @param positionX x-axis position.
     * @param positionY y-axis position.
     * @param text the content to write.
     * @throws IOException
     */
    public static void writeContent(PDPageContentStream contentStream, float positionX, float positionY, String text)
            throws IOException {

        contentStream.beginText();
        contentStream.moveTextPositionByAmount(positionX, positionY);
        contentStream.drawString(text != null ? text : "");
        contentStream.endText();
    }

    /**
     * Prints a table with column headers and data.
     * @param columnHeaders the table column headers.
     * @param columnWidths widths of each column.
     * @param document the document.
     * @param pageMap page map with each page object stored against each page index.
     * @param rowEntries list of rows.
     * @throws IOException
     */
    public static void writeRowsContent(String[] columnHeaders, float[] columnWidths, PDDocument document, Map<Integer,
            PDPage> pageMap, List<RowEntry> rowEntries) throws IOException {

        float startX = CELL_MARGIN + CELL_PADDING; // space between entry and the column line
        float startY = TABLE_TOP_Y - (ROW_HEIGHT / 2)
                - ((TEXT_FONT.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * FONT_SIZE) / 4);

        PDPageContentStream contentStream = new PDPageContentStream(document, pageMap.get(1), true, false);

        // write table column headers
        writeColumnHeader(contentStream, columnWidths, startX, startY, columnHeaders);

        PDPageContentStream contentStreamForData = new PDPageContentStream(document, pageMap.get(1), true, false);
        contentStreamForData.setFont(TEXT_FONT, FONT_SIZE);
        startY -= ROW_HEIGHT;
        startX = CELL_MARGIN + CELL_PADDING;

        int currentPageNum = 1;
        int rowNum = 0;
        // write content
        for (RowEntry entry : rowEntries) {
            rowNum += 1;
            if (rowNum > RECORD_COUNT_PER_PAGE) {
                contentStreamForData.close();
                currentPageNum += 1;
                contentStreamForData = new PDPageContentStream(document, pageMap.get(currentPageNum), true, false);
                contentStreamForData.setFont(TEXT_FONT, FONT_SIZE);
                startY = TABLE_TOP_Y - (ROW_HEIGHT / 2)
                        - ((TEXT_FONT.getFontDescriptor().getFontBoundingBox().getHeight() / 1000 * FONT_SIZE) / 4);
                startX = CELL_MARGIN + CELL_PADDING;
                rowNum = 1;
            }
            writeToRow(contentStreamForData, columnWidths, startX, startY, entry);
            startY -= ROW_HEIGHT;
            startX = CELL_MARGIN + CELL_PADDING;
        }
        contentStreamForData.close();
    }

    /**
     *  Writes a row.
     * @param contentStream content stream of the page.
     * @param columnWidths widths of each column.
     * @param positionX x-axis position
     * @param positionY y-axis position
     * @param entry row data.
     * @throws IOException
     */
    public static void writeToRow(PDPageContentStream contentStream, float[] columnWidths, float positionX,
                                  float positionY, RowEntry entry)
            throws IOException {

        for (int i = 0; i < columnWidths.length; i++) {
            writeContent(contentStream, positionX, positionY, entry.getEntries().get(i));
            positionX += columnWidths[i];
        }
    }

    /**
     * Writes the column header.
     * @param contentStream content stream of the page.
     * @param columnWidths widths of each column.
     * @param positionX x-axis position
     * @param positionY y-axis position
     * @param content data to write in column header.
     * @throws IOException
     */
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
     *  Draws a table.
     * @param document document to draw the table.
     * @param pageMap map of page objects against page numbers.
     * @param recordsPerPageList a list of integers with number of records for each page.
     * @param columnWidths widths of the columns.
     * @param numberOfRows total number of rows.
     * @throws IOException
     */
    public static void drawTableGrid(PDDocument document, Map<Integer,
            PDPage> pageMap, List<Integer> recordsPerPageList, float[] columnWidths, int numberOfRows)
            throws IOException {
        float nextY;
        PDPageContentStream contentStream;
        // draw horizontal lines
        for (int currentPageNum = 1; currentPageNum <= pageMap.size(); currentPageNum++) {
            contentStream = new PDPageContentStream(document, pageMap.get(currentPageNum), true, false);
            int lineCount = currentPageNum == 1 ?
                    recordsPerPageList.get(0) + 2 : recordsPerPageList.get(currentPageNum - 1) + 1;
            nextY = TABLE_TOP_Y;
            if (currentPageNum > 1) {
                insertPageNumber(contentStream, currentPageNum);
                insertLogo(document, contentStream);
            }
            for (int rowNum = 0; rowNum < lineCount; rowNum++) {
                contentStream.drawLine(CELL_MARGIN, nextY, CELL_MARGIN + TABLE_WIDTH, nextY);
                nextY -= ROW_HEIGHT;
            }
            contentStream.close();
        }

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

    /**
     * Returns the number of pages in the document.
     * @param numberOfRows number of records.
     * @return number of pages in the document.
     */
    public static int getNumberOfPages(int numberOfRows) {

        return (int) Math.ceil(numberOfRows / (float) RECORD_COUNT_PER_PAGE);
    }

    /**
     * Trims long texts to match length in pdf table cell.
     * @param data
     * @return
     */
    public static String trimLongEntry(String data, int maxLength) {

        if (data != null && data.length() >= maxLength) {
            data = data.substring(0, maxLength - 2);
            data = data + "...";
        }
        return data;
    }

}
