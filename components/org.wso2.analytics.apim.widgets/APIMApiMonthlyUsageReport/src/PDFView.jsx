/* eslint-disable require-jsdoc */
import React from 'react';
import PropTypes from 'prop-types';

import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { Paper, Typography } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * PDFView Component to embed PDF in HTML
 */

export default class PDFView extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
        this.fetchPdf = this.fetchPdf.bind(this);
        this.state = {
            // isLoading: false,
            hasData: false,
        };
    }

    componentDidMount() {
        const { src } = this.props;
        this.fetchPdf(src);
    }

    shouldComponentUpdate(nextProps) {
        const { src } = this.props;
        // const { hasData } = this.state;
        if (src !== nextProps.src) {
            this.fetchPdf(src);
            return true;
        }
        return false;
    }

    async fetchPdf(src) {
        const loadingTask = pdfjs.getDocument(src);

        const pdf = await loadingTask.promise.catch(() => {
        });

        if (!pdf) {
            this.setState({
                hasData: false,
            });
            return;
        }
        const firstPageNumber = 1;

        const page = await pdf.getPage(firstPageNumber);
        const scale = 1.3;
        const viewport = page.getViewport({ scale });

        // Prepare canvas using PDF page dimensions

        const canvas = this.canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport,
        };
        const renderTask = page.render(renderContext);

        await renderTask.promise;
    }

    showNoData() {
        const { themeName } = this.props;
        const styles = {
            dataWrapper: {
                height: '75%',
                margin: 'auto',
            },
            paper: {
                background: themeName === 'dark' ? '#969696' : '#E8E8E8',
                borderColor: themeName === 'dark' ? '#fff' : '#D8D8D8',
                padding: '4%',
                border: '1.5px solid',
            },
        };
        return (
            <div style={styles.dataWrapper}>
                <Paper
                    elevation={1}
                    style={styles.paper}
                >
                    <Typography variant='h5' component='h3'>
                        <FormattedMessage
                            id='nodata.error.heading'
                            defaultMessage='No Data Available !'
                        />
                    </Typography>
                    <Typography component='p'>
                        <FormattedMessage
                            id='nodata.error.body'
                            defaultMessage='No data available for the selected options'
                        />
                    </Typography>
                </Paper>
            </div>
        );
    }

    render() {
        const { hasData } = this.state;
        return (
            <React.Fragment>
                { hasData ? '' : this.showNoData()}
                <canvas
                    ref={this.canvasRef}
                    width={800}
                    height={window.innerHeight}
                />
            </React.Fragment>
        );
    }
}

PDFView.propTypes = {
    src: PropTypes.string.isRequired,
    themeName: PropTypes.string.isRequired,
};
