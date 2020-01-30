/* eslint-disable require-jsdoc */
import React from 'react';
import PropTypes from 'prop-types';

import pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;


const fetchPdf = async (src, canvas) => {
    const loadingTask = pdfjs.getDocument(src);

    const pdf = await loadingTask.promise.catch(() => {
    });

    if (!pdf) {
        return;
    }
    const firstPageNumber = 1;

    const page = await pdf.getPage(firstPageNumber);
    const scale = 1.3;
    const viewport = page.getViewport({ scale });

    // Prepare canvas using PDF page dimensions

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
};

/**
 * PDFView Component to embed PDF in HTML
 */
export default class PDFView extends React.Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        const { src } = this.props;

        fetchPdf(src, this.canvasRef.current);
    }

    shouldComponentUpdate() {
        const { src } = this.props;
        fetchPdf(src, this.canvasRef.current);
    }

    render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={800}
                height={window.innerHeight}
            />
        );
    }
}

PDFView.propTypes = {
    src: PropTypes.string.isRequired,
};
