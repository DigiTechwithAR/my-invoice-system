/**
 * PDF Generation Module for Invoice System
 * Uses jsPDF library to generate professional invoice PDFs
 */

/**
 * Generate PDF from invoice data
 * @param {object} invoice - Invoice object with all details
 * @returns {jsPDF} PDF document
 */
function generateInvoicePDF(invoice) {
    const { jsPDF } = window.jspdf;

    // Create PDF (A4 size)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Colors
    const primaryColor = [99, 102, 241]; // Indigo
    const darkColor = [30, 41, 59]; // Slate 800
    const mutedColor = [148, 160, 193]; // Slate 400
    const successColor = [16, 185, 129]; // Green

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let yPos = margin;

    // ============== HEADER ==============

    // Logo placeholder (colored rectangle)
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPos, 15, 15, 'F');

    // Logo text
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('📄', margin + 5, yPos + 10);

    // Business name (from user data or default)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    doc.text(user.business_name || 'Your Business', margin + 20, yPos + 10);

    // Invoice title on right
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('INVOICE', pageWidth - margin - 40, yPos + 10);

    yPos += 20;

    // Business details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);

    const businessLines = [
        user.business_address || 'Your Address',
        user.business_phone ? `Phone: ${user.business_phone}` : null,
        user.business_gst ? `GST: ${user.business_gst}` : null,
        user.business_pan ? `PAN: ${user.business_pan}` : null,
    ].filter(Boolean);

    businessLines.forEach((line, i) => {
        doc.text(line, margin + 20, yPos + (i * 4));
    });

    // Invoice number and dates on right
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${invoice.invoice_number}`, pageWidth - margin - 40, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(`Date: ${formatDate(invoice.invoice_date)}`, pageWidth - margin - 40, yPos + 5);

    if (invoice.due_date) {
        doc.text(`Due: ${formatDate(invoice.due_date)}`, pageWidth - margin - 40, yPos + 10);
    }

    yPos += 25;

    // ============== BILL TO SECTION ==============

    // Section background
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos - 2, contentWidth, 25, 'F');

    // Bill To label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BILL TO:', margin + 3, yPos + 5);

    // Client details
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.text(invoice.client_name, margin + 3, yPos + 12);

    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);

    let clientY = yPos + 17;
    if (invoice.client_address) {
        doc.text(invoice.client_address, margin + 3, clientY);
        clientY += 5;
    }

    if (invoice.client_email) {
        doc.text(`Email: ${invoice.client_email}`, margin + 3, clientY);
        clientY += 5;
    }

    if (invoice.client_phone) {
        doc.text(`Phone: ${invoice.client_phone}`, margin + 3, clientY);
        clientY += 5;
    }

    // GST details on right
    const rightX = pageWidth - margin - 50;

    if (invoice.client_gst) {
        doc.setTextColor(...primaryColor);
        doc.text(`GST: ${invoice.client_gst}`, rightX, yPos + 12);
    }

    if (invoice.client_pan) {
        doc.text(`PAN: ${invoice.client_pan}`, rightX, yPos + 17);
    }

    doc.text(`State: ${invoice.client_state_name || 'Unknown'} (${invoice.client_state_code})`, rightX, yPos + 22);

    yPos += 30;

    // ============== ITEMS TABLE ==============

    // Table header
    const tableY = yPos;
    const colWidths = [70, 25, 30, 25, 30]; // Description, Qty, Rate, GST%, Amount
    const colHeaders = ['Description', 'Qty', 'Rate (₹)', 'GST%', 'Amount (₹)'];

    // Header background
    doc.setFillColor(...primaryColor);
    doc.rect(margin, tableY, contentWidth, 10, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);

    let colX = margin + 3;
    colHeaders.forEach((header, i) => {
        doc.text(header, colX, tableY + 6.5);
        colX += colWidths[i] + 2;
    });

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);

    let rowY = tableY + 10;
    const rowHeight = 10;

    (invoice.items || []).forEach((item, index) => {
        // Alternating row colors
        if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
        }

        const itemAmount = (item.quantity * item.rate).toFixed(2);

        doc.text(item.description.substring(0, 40), margin + 3, rowY + 6.5);
        doc.text(String(item.quantity), margin + 73, rowY + 6.5);
        doc.text(`₹${item.rate.toFixed(2)}`, margin + 98, rowY + 6.5);
        doc.text(`${item.gst_percentage}%`, margin + 128, rowY + 6.5);
        doc.text(`₹${itemAmount}`, margin + 153, rowY + 6.5);

        rowY += rowHeight;
    });

    // Table border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(margin, tableY, contentWidth, rowY - tableY, 'S');

    yPos = rowY + 10;

    // ============== TOTALS SECTION ==============

    const totalsX = pageWidth - margin - 60;

    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text('Subtotal:', totalsX, yPos);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${(invoice.subtotal || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 7;

    // CGST/SGST or IGST
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);

    if (invoice.igst > 0) {
        doc.text('IGST:', totalsX, yPos);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`₹${invoice.igst.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
    } else {
        doc.text('CGST:', totalsX, yPos);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`₹${(invoice.cgst || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mutedColor);
        doc.text('SGST:', totalsX, yPos);
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`₹${(invoice.sgst || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
    }

    // Grand Total
    doc.setFillColor(...primaryColor);
    doc.rect(totalsX - 3, yPos - 4, 63, 10, 'F');

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPos + 3);
    doc.text(`₹${(invoice.total_amount || 0).toFixed(2)}`, pageWidth - margin, yPos + 3, { align: 'right' });

    yPos += 15;

    // Amount paid and due
    doc.setFontSize(10);
    doc.setTextColor(...successColor);
    doc.text(`Amount Paid: ₹${(invoice.amount_paid || 0).toFixed(2)}`, totalsX, yPos);

    const dueAmount = (invoice.total_amount || 0) - (invoice.amount_paid || 0);
    doc.setTextColor(dueAmount > 0 ? [239, 68, 68] : mutedColor);
    doc.text(`Amount Due: ₹${dueAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;

    // ============== NOTES & TERMS ==============

    if (invoice.notes || invoice.terms) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);

        if (invoice.notes) {
            doc.text('Notes:', margin, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...mutedColor);
            doc.setFontSize(9);

            // Split long text
            const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
            notesLines.forEach(line => {
                doc.text(line, margin, yPos);
                yPos += 4;
            });

            yPos += 3;
        }

        if (invoice.terms) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...darkColor);
            doc.text('Terms & Conditions:', margin, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...mutedColor);
            doc.setFontSize(9);

            const termsLines = doc.splitTextToSize(invoice.terms, contentWidth);
            termsLines.forEach(line => {
                doc.text(line, margin, yPos);
                yPos += 4;
            });
        }
    }

    // ============== FOOTER ==============

    yPos = pageHeight - 20;

    // Footer background
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos - 5, contentWidth, 10, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

    // Page number
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    return doc;
}

/**
 * Download PDF file
 * @param {jsPDF} doc - PDF document
 * @param {string} filename - Filename for download
 */
function downloadPDF(doc, filename) {
    doc.save(filename);
}

/**
 * Convert PDF to blob URL for sharing
 * @param {jsPDF} doc - PDF document
 * @returns {string} Blob URL
 */
function getPDFBlobUrl(doc) {
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
}

/**
 * Generate PDF preview as base64
 * @param {jsPDF} doc - PDF document
 * @returns {string} Base64 encoded PDF
 */
function getPDFBase64(doc) {
    return doc.output('datauristring');
}

// Export functions
window.pdfGenerator = {
    generateInvoicePDF,
    downloadPDF,
    getPDFBlobUrl,
    getPDFBase64,
};
