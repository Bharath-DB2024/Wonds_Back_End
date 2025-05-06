const express = require('express');
const Subscription = require('../models/subscription');
const router = express.Router();
const archiver = require('archiver');
const XLSX = require('xlsx');

// Route to download Excel file with document URLs
router.post('/excel', async (req, res) => {
  try {
    const { uniqueId } = req.body;
    console.log(uniqueId);

    if (!uniqueId) {
      return res.status(400).json({ error: "Unique identifier is required" });
    }

    // Fetch all subscriptions for the uniqueId
    const allSubscriptions = await Subscription.find({ uniqueId: uniqueId });

    if (!allSubscriptions.length) {
      return res.status(404).json({ error: "No subscriptions found for this unique ID" });
    }

    // Generate base URL for the server
    const baseUrl = `${process.env.baseUrl}/api`; // Adjust to your server URL

    // Flatten subscriptions for Excel with serial number
    const flattenedSubscriptions = allSubscriptions.map((sub, index) => ({
      serialNo: index + 1, // Add serial number starting from 1
      Date: sub.createdAt.toISOString(),
      mobile: sub.mobile,
      name: sub.name,
      plan: sub.plan,
      category: sub.category,
    
      uniqueId: sub.uniqueId,
      invoice: sub.documents.invoice?.filename ? `${baseUrl}/download/document/${sub._id}/invoice` : "No Invoice",
      warranty: sub.documents.warranty?.filename ? `${baseUrl}/download/document/${sub._id}/warranty` : "No Warranty",
      others: sub.documents.others?.filename ? `${baseUrl}/download/document/${sub._id}/others` : "No Others"
    }));

    // Create Excel worksheet with updated headers
    const worksheet = XLSX.utils.json_to_sheet(flattenedSubscriptions, {
      header: ['serialNo', 'Date', 'mobile', 'name', 'plan', 'category', 'uniqueId', 'invoice', 'warranty', 'others']
    });

    // Rename the "serialNo" header to "Serial No"
    worksheet['A1'].v = "Serial No";

    // Add hyperlinks to the document columns
    flattenedSubscriptions.forEach((sub, rowIndex) => {
      const row = rowIndex + 2; // +2 for header row (1-based index)

      // Invoice column (H)
      if (sub.invoice !== "No Invoice") {
        worksheet[`H${row}`] = {
          t: 's',
          v: `Invoice_${sub.name}_${sub.mobile}`, // Display text
          l: { 
            Target: sub.invoice,
            Tooltip: `Click to download Invoice for ${sub.name} (${sub.mobile})`
          }
        };
      }

      // Warranty column (I)
      if (sub.warranty !== "No Warranty") {
        worksheet[`I${row}`] = {
          t: 's',
          v: `Warranty_${sub.name}_${sub.mobile}`,
          l: { 
            Target: sub.warranty,
            Tooltip: `Click to download Warranty for ${sub.name} (${sub.mobile})`
          }
        };
      }

      // Others column (J)
      if (sub.others !== "No Others") {
        worksheet[`J${row}`] = {
          t: 's',
          v: `Others_${sub.name}_${sub.mobile}`,
          l: { 
            Target: sub.others,
            Tooltip: `Click to download Others for ${sub.name} (${sub.mobile})`
          }
        };
      }
    });

    // Create workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Send Excel file as response
    res.setHeader('Content-Disposition', `attachment; filename="Subscriptions_${uniqueId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(excelBuffer);

  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/excel1', async (req, res) => {
  console.log(process.env.baseUrl);
  
  try {
    const { secondaryUniqueId } = req.body;
    console.log('Received secondaryUniqueId:', req.body);

    // Validate input
    if (!secondaryUniqueId) {
      return res.status(400).json({ error: 'Secondary unique identifier is required' });
    }

    // Fetch the subscription for the secondaryUniqueId
    const subscription = await Subscription.findOne({ secondaryUniqueId });
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found for this secondary unique ID' });
    }

    // Generate base URL for the server
    const baseUrl = process.env.baseUrl
      ? `${process.env.baseUrl}/api`
      : 'http://localhost:3000/api'; // Fallback for local development

    // Prepare data for Excel
    const flattenedSubscriptions = [{
      serialNo: 1,
      Date: subscription.createdAt.toISOString(),
      mobile: subscription.mobile,
      name: subscription.name,
      plan: subscription.plan,
      category: subscription.category,
      secondaryUniqueId: subscription.secondaryUniqueId,
      invoice: subscription.documents.invoice?.filename
        ? `${baseUrl}/download/document/${subscription._id}/invoice`
        : 'No Invoice',
      warranty: subscription.documents.warranty?.filename
        ? `${baseUrl}/download/document/${subscription._id}/warranty`
        : 'No Warranty',
      others: subscription.documents.others?.filename
        ? `${baseUrl}/download/document/${subscription._id}/others`
        : 'No Others'
    }];

    // Create Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(flattenedSubscriptions, {
      header: ['serialNo', 'Date', 'mobile', 'name', 'plan', 'category', 'secondaryUniqueId', 'invoice', 'warranty', 'others']
    });

    // Rename the "serialNo" header to "Serial No"
    worksheet['A1'].v = 'Serial No';

    // Add hyperlinks for documents
    if (flattenedSubscriptions[0].invoice !== 'No Invoice') {
      worksheet['H2'] = {
        t: 's',
        v: `Invoice_${subscription.name}_${subscription.mobile}`,
        l: {
          Target: flattenedSubscriptions[0].invoice,
          Tooltip: `Click to download Invoice for ${subscription.name} (${subscription.mobile})`
        }
      };
    }

    if (flattenedSubscriptions[0].warranty !== 'No Warranty') {
      worksheet['I2'] = {
        t: 's',
        v: `Warranty_${subscription.name}_${subscription.mobile}`,
        l: {
          Target: flattenedSubscriptions[0].warranty,
          Tooltip: `Click to download Warranty for ${subscription.name} (${subscription.mobile})`
        }
      };
    }

    if (flattenedSubscriptions[0].others !== 'No Others') {
      worksheet['J2'] = {
        t: 's',
        v: `Others_${subscription.name}_${subscription.mobile}`,
        l: {
          Target: flattenedSubscriptions[0].others,
          Tooltip: `Click to download Others for ${subscription.name} (${subscription.mobile})`
        }
      };
    }

    // Create workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscriptions');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Send Excel file as response
    res.setHeader('Content-Disposition', `attachment; filename="Subscriptions_${secondaryUniqueId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
// Route to download all documents as a ZIP file (unchanged)
router.post('/download', async (req, res) => {
  try {
    const { uniqueId } = req.body;
    console.log(uniqueId);

    if (!uniqueId) {
      return res.status(400).json({ error: "Unique identifier is required" });
    }

    const allSubscriptions = await Subscription.find({ uniqueId: uniqueId });

    if (!allSubscriptions.length) {
      return res.status(404).json({ error: "No subscriptions found for this unique ID" });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Documents_${uniqueId}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.pipe(res);

    allSubscriptions.forEach((sub, index) => {
      const documents = sub.documents;

      if (documents.invoice?.data) {
        const fileName = documents.invoice.filename || `invoice_${sub._id}${documents.invoice.mimetype.includes('image') ? '.jpg' : '.pdf'}`;
        archive.append(documents.invoice.data, { name: fileName });
      }

      if (documents.warranty?.data) {
        const fileName = documents.warranty.filename || `warranty_${sub._id}${documents.warranty.mimetype.includes('image') ? '.jpg' : '.pdf'}`;
        archive.append(documents.warranty.data, { name: fileName });
      }

      if (documents.others?.data) {
        const fileName = documents.others.filename || `others_${sub._id}${documents.others.mimetype.includes('image') ? '.jpg' : '.pdf'}`;
        archive.append(documents.others.data, { name: fileName });
      }
    });

    await archive.finalize();

  } catch (error) {
    console.error('Error generating ZIP file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to serve individual documents with custom filename (unchanged)
router.get('/document/:id/:type', async (req, res) => {
  try {
    const { id, type } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let document;
    let docType;
    switch (type) {
      case 'invoice':
        document = subscription.documents.invoice;
        docType = 'Invoice';
        break;
      case 'warranty':
        document = subscription.documents.warranty;
        docType = 'Warranty';
        break;
      case 'others':
        document = subscription.documents.others;
        docType = 'Others';
        break;
      default:
        return res.status(400).json({ error: 'Invalid document type' });
    }

    if (!document?.data) {
      return res.status(404).json({ error: `${type} document not found` });
    }

    const extension = document.mimetype.includes('image') ? '.jpg' : '.pdf';
    const customFilename = `${docType}_${subscription.name}_${subscription.mobile}${extension}`;

    res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${customFilename}"`);
    res.setHeader('Content-Length', document.data.length);
    res.status(200).send(document.data);

  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;