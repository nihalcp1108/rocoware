const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Safely fetches a remote image as a binary Buffer for PDFKit embedding.
 * Automatically utilizes Cloudinary format transformation to guarantee JPEG buffer format.
 */
const fetchImageBuffer = async (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;

  try {
    let fetchUrl = trimmed;
    // If it's a Cloudinary URL, convert to high-quality JPEG for native PDFKit rendering
    if (fetchUrl.includes('res.cloudinary.com') && fetchUrl.includes('/image/upload/')) {
      fetchUrl = fetchUrl.replace('/image/upload/', '/image/upload/f_jpg,q_auto,w_1000/');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Rocoware-PDFKit-Generator/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[PDF Generator] Image download returned status ${res.status}: ${fetchUrl}`);
      return null;
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    console.warn(`[PDF Generator] Failed to download image for PDF: ${err.message}`);
    return null;
  }
};

/**
 * Generates an executive-level, professional PDF report of completed complaints.
 * Formatted with complete Customer, Product, Sanitary Ware Complaint, and Service sections.
 */
const generateCompletedComplaintsPDF = (complaints, stream) => {
  const doc = new PDFDocument({
    margin: 36,
    size: 'A4',
    bufferPages: true,
  });

  doc.pipe(stream);

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Top header banner
  doc.rect(36, 36, 523, 58).fill('#0f172a'); // slate-900
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('Complaint Management Portal', 50, 48);
  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Sanitary Ware Products Resolution & Audit Report', 50, 68);

  let currentY = 110;

  // Metadata summary line
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Completed Complaints Report', 36, currentY);
  currentY += 18;

  doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(
    `Generated: ${generatedDate} | Total Resolved Records: ${complaints.length}`,
    36,
    currentY
  );
  currentY += 16;

  // Divider
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, currentY).lineTo(559, currentY).stroke();
  currentY += 15;

  complaints.forEach((item, index) => {
    if (currentY + 270 > 760) {
      doc.addPage();
      currentY = 40;
    }

    const startY = currentY;
    const cardWidth = 523;

    // Card Header Bar
    doc.roundedRect(36, currentY, cardWidth, 24, 4).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`Complaint ID: ${item.complaintId || 'N/A'}`, 46, currentY + 7);
    doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold').text(`STATUS: ${item.status || 'COMPLETED'}`, 440, currentY + 7);

    currentY += 30;

    // --- Section 1: Customer Information ---
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('CUSTOMER INFORMATION', 46, currentY);
    currentY += 13;

    doc.font('Helvetica').fontSize(8.5);
    doc.fillColor('#475569').text('Customer Name:', 46, currentY);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.customerName || 'N/A', 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Shop Name:', 310, currentY);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.shopName || 'N/A', 380, currentY);
    currentY += 13;

    doc.font('Helvetica').fillColor('#475569').text('Mobile 1:', 46, currentY);
    doc.fillColor('#0f172a').text(item.mobileNumber1 || 'N/A', 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Mobile 2:', 310, currentY);
    doc.fillColor('#0f172a').text(item.mobileNumber2 ? item.mobileNumber2 : 'Not provided', 380, currentY);
    currentY += 13;

    doc.font('Helvetica').fillColor('#475569').text('Address:', 46, currentY);
    doc.fillColor('#334155').text(item.address || 'N/A', 125, currentY, { width: 420, height: 22, ellipsis: true });
    currentY += 22;

    // --- Section 2: Product & Complaint Information ---
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('PRODUCT & COMPLAINT DETAILS', 46, currentY);
    currentY += 13;

    // Complaint Name & Other Product Name
    doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('Complaint Name:', 46, currentY);
    const displayComplaintName = item.complaintName === 'Other' && item.otherProductName
      ? `Other (${item.otherProductName})`
      : item.complaintName || 'N/A';
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(displayComplaintName, 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Model Number:', 310, currentY);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(item.modelNumber || 'N/A', 380, currentY);
    currentY += 13;

    const purchaseDateStr = item.purchaseDate
      ? new Date(item.purchaseDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
      : 'N/A';
    const regDateStr = (item.registeredAt || item.createdAt)
      ? new Date(item.registeredAt || item.createdAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';

    doc.font('Helvetica').fillColor('#475569').text('Purchase Date:', 46, currentY);
    doc.fillColor('#0f172a').text(purchaseDateStr, 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Registered By:', 310, currentY);
    doc.fillColor('#0f172a').text(item.registeredPersonName || 'N/A', 380, currentY);
    currentY += 13;

    doc.font('Helvetica').fillColor('#475569').text('Registered At:', 46, currentY);
    doc.fillColor('#0f172a').text(regDateStr, 125, currentY);
    currentY += 13;

    doc.font('Helvetica').fillColor('#475569').text('Complaint Details:', 46, currentY);
    doc.fillColor('#334155').text(item.complaintDetails || 'No details specified', 125, currentY, {
      width: 420,
      height: 32,
      ellipsis: true,
    });
    currentY += 32;

    // --- Section 3: Service Information ---
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('SERVICE & RESOLUTION', 46, currentY);
    currentY += 13;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('Service Person:', 46, currentY);
    doc.fillColor('#0f172a').text(item.servicePersonName || 'N/A', 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Contact No:', 310, currentY);
    doc.fillColor('#0f172a').text(item.servicePersonNumber || 'N/A', 380, currentY);
    currentY += 13;

    const attendedDateStr = item.attendedDate
      ? new Date(item.attendedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
      : 'N/A';
    const completedDateStr = item.completedAt
      ? new Date(item.completedAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';

    doc.font('Helvetica').fillColor('#475569').text('Attended Date:', 46, currentY);
    doc.fillColor('#0f172a').text(attendedDateStr, 125, currentY);

    doc.font('Helvetica').fillColor('#475569').text('Completed Date:', 310, currentY);
    doc.fillColor('#059669').font('Helvetica-Bold').text(completedDateStr, 380, currentY);
    currentY += 13;

    const formattedBill = typeof item.billAmount === 'number'
      ? `Rs. ${item.billAmount.toFixed(2)}`
      : 'Rs. 0.00';

    doc.font('Helvetica').fillColor('#475569').text('Bill Amount:', 46, currentY);
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formattedBill, 125, currentY);

    const hasAttachment = Boolean(item.image || item.imageUrl);
    doc.font('Helvetica').fillColor('#475569').text('Attachment:', 310, currentY);
    doc.fillColor(hasAttachment ? '#2563eb' : '#64748b').text(hasAttachment ? 'Image Attached' : 'No image', 380, currentY);
    currentY += 13;

    if (item.remarks) {
      doc.font('Helvetica').fillColor('#475569').text('Remarks:', 46, currentY);
      doc.fillColor('#334155').text(item.remarks, 125, currentY, { width: 420, height: 20, ellipsis: true });
      currentY += 20;
    }

    const cardHeight = currentY - startY + 8;
    doc.roundedRect(36, startY, cardWidth, cardHeight, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();

    currentY += 14;
  });

  // Number all pages with headers/footers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(36, 804).lineTo(559, 804).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(
      `Confidential - Complaint Management Portal | Page ${i + 1} of ${range.count}`,
      36,
      812,
      { align: 'center', width: 523 }
    );
  }

  doc.end();
};

/**
 * Generates an executive single-complaint PDF report.
 * Includes complete customer, product, complaint, service details, and embedded Cloudinary image.
 */
const generateSingleComplaintPDF = async (complaint, stream) => {
  const doc = new PDFDocument({
    margin: 36,
    size: 'A4',
    bufferPages: true,
  });

  doc.pipe(stream);

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Top header banner
  doc.rect(36, 36, 523, 58).fill('#0f172a'); // slate-900
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('Complaint Management Portal', 50, 48);
  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Individual Sanitary Ware Resolution & Service Report', 50, 68);

  let currentY = 110;

  // Metadata summary line
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(`Complaint Report: ${complaint.complaintId || 'N/A'}`, 36, currentY);
  currentY += 18;

  doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(
    `Generated: ${generatedDate} | Status: ${complaint.status || 'COMPLETED'}`,
    36,
    currentY
  );
  currentY += 16;

  // Divider
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, currentY).lineTo(559, currentY).stroke();
  currentY += 15;

  const startY = currentY;
  const cardWidth = 523;

  // Card Header Bar
  doc.roundedRect(36, currentY, cardWidth, 24, 4).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`Complaint ID: ${complaint.complaintId || 'N/A'}`, 46, currentY + 7);
  doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold').text(`STATUS: ${complaint.status || 'COMPLETED'}`, 440, currentY + 7);

  currentY += 30;

  // --- Section 1: Customer Information ---
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('CUSTOMER INFORMATION', 46, currentY);
  currentY += 13;

  doc.font('Helvetica').fontSize(8.5);
  doc.fillColor('#475569').text('Customer Name:', 46, currentY);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(complaint.customerName || 'N/A', 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Shop Name:', 310, currentY);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(complaint.shopName || 'N/A', 380, currentY);
  currentY += 13;

  doc.font('Helvetica').fillColor('#475569').text('Mobile 1:', 46, currentY);
  doc.fillColor('#0f172a').text(complaint.mobileNumber1 || 'N/A', 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Mobile 2:', 310, currentY);
  doc.fillColor('#0f172a').text(complaint.mobileNumber2 ? complaint.mobileNumber2 : 'Not provided', 380, currentY);
  currentY += 13;

  doc.font('Helvetica').fillColor('#475569').text('Address:', 46, currentY);
  doc.fillColor('#334155').text(complaint.address || 'N/A', 125, currentY, { width: 420, height: 26, ellipsis: true });
  currentY += 26;

  // --- Section 2: Product & Complaint Information ---
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('PRODUCT & COMPLAINT DETAILS', 46, currentY);
  currentY += 13;

  doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('Complaint Name:', 46, currentY);
  const displayComplaintName = complaint.complaintName === 'Other' && complaint.otherProductName
    ? `Other (${complaint.otherProductName})`
    : complaint.complaintName || 'N/A';
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(displayComplaintName, 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Model Number:', 310, currentY);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(complaint.modelNumber || 'N/A', 380, currentY);
  currentY += 13;

  const purchaseDateStr = complaint.purchaseDate
    ? new Date(complaint.purchaseDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : 'N/A';
  const regDateStr = (complaint.registeredAt || complaint.createdAt)
    ? new Date(complaint.registeredAt || complaint.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  doc.font('Helvetica').fillColor('#475569').text('Purchase Date:', 46, currentY);
  doc.fillColor('#0f172a').text(purchaseDateStr, 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Registered By:', 310, currentY);
  doc.fillColor('#0f172a').text(complaint.registeredPersonName || 'N/A', 380, currentY);
  currentY += 13;

  doc.font('Helvetica').fillColor('#475569').text('Registered At:', 46, currentY);
  doc.fillColor('#0f172a').text(regDateStr, 125, currentY);
  currentY += 13;

  doc.font('Helvetica').fillColor('#475569').text('Complaint Details:', 46, currentY);
  doc.fillColor('#334155').text(complaint.complaintDetails || 'No details specified', 125, currentY, {
    width: 420,
    height: 38,
    ellipsis: true,
  });
  currentY += 38;

  // --- Section 3: Service Information ---
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('SERVICE & RESOLUTION', 46, currentY);
  currentY += 13;

  doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('Service Person:', 46, currentY);
  doc.fillColor('#0f172a').text(complaint.servicePersonName || 'N/A', 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Contact No:', 310, currentY);
  doc.fillColor('#0f172a').text(complaint.servicePersonNumber || 'N/A', 380, currentY);
  currentY += 13;

  const attendedDateStr = complaint.attendedDate
    ? new Date(complaint.attendedDate).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : 'N/A';
  const completedDateStr = complaint.completedAt
    ? new Date(complaint.completedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  doc.font('Helvetica').fillColor('#475569').text('Attended Date:', 46, currentY);
  doc.fillColor('#0f172a').text(attendedDateStr, 125, currentY);

  doc.font('Helvetica').fillColor('#475569').text('Completed Date:', 310, currentY);
  doc.fillColor('#059669').font('Helvetica-Bold').text(completedDateStr, 380, currentY);
  currentY += 13;

  const formattedBill = typeof complaint.billAmount === 'number'
    ? `Rs. ${complaint.billAmount.toFixed(2)}`
    : 'Rs. 0.00';

  doc.font('Helvetica').fillColor('#475569').text('Bill Amount:', 46, currentY);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(formattedBill, 125, currentY);
  currentY += 13;

  if (complaint.remarks) {
    doc.font('Helvetica').fillColor('#475569').text('Remarks:', 46, currentY);
    doc.fillColor('#334155').text(complaint.remarks, 125, currentY, { width: 420, height: 26, ellipsis: true });
    currentY += 26;
  }

  // --- Section 4: Complaint Image Attachment ---
  const imageUrl = complaint.image || complaint.imageUrl || '';
  if (imageUrl) {
    const imgBuffer = await fetchImageBuffer(imageUrl);

    // If remaining space on page 1 is small, add new page
    if (currentY + 220 > 750) {
      const cardHeight = currentY - startY + 8;
      doc.roundedRect(36, startY, cardWidth, cardHeight, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();

      doc.addPage();
      currentY = 40;
    }

    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('ATTACHED COMPLAINT IMAGE', 46, currentY);
    currentY += 12;

    if (imgBuffer) {
      try {
        const boxX = 46;
        const boxY = currentY;
        const boxW = 320;
        const boxH = 190;

        // Container frame
        doc.roundedRect(boxX, boxY, boxW, boxH, 6).fillAndStroke('#f8fafc', '#e2e8f0');

        doc.image(imgBuffer, boxX + 5, boxY + 5, {
          fit: [boxW - 10, boxH - 10],
          align: 'center',
          valign: 'center',
        });

        currentY += boxH + 10;
      } catch (embedErr) {
        console.warn('[PDF Generator] Image embed error:', embedErr.message);
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text('Image file attached (Cloudinary URL verified).', 46, currentY);
        currentY += 14;
      }
    } else {
      doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text('Image attached to complaint record.', 46, currentY);
      currentY += 14;
    }
  } else {
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('ATTACHMENT', 46, currentY);
    currentY += 12;
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text('No image attachment was submitted with this complaint.', 46, currentY);
    currentY += 14;
  }

  // Draw card border around content on this page
  const cardHeight = currentY - (doc.page.number > 1 ? 40 : startY) + 8;
  const pageStartY = doc.page.number > 1 ? 40 : startY;
  doc.roundedRect(36, pageStartY, cardWidth, cardHeight, 6).strokeColor('#e2e8f0').lineWidth(0.8).stroke();

  // Number all pages with headers/footers
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(36, 804).lineTo(559, 804).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(
      `Confidential - Complaint Management Portal | Page ${i + 1} of ${range.count}`,
      36,
      812,
      { align: 'center', width: 523 }
    );
  }

  doc.end();
};

module.exports = {
  generateCompletedComplaintsPDF,
  generateSingleComplaintPDF,
};
