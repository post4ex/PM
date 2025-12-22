/**
 * docs-templates.js
 * Print view generators for all document types.
 * Contains specialized HTML templates for regulatory compliance.
 */

// ============================================================================
// SECURITY: HTML SANITIZATION
// ============================================================================
/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} str - Input string to sanitize
 * @returns {string} - Sanitized string safe for HTML insertion
 */
function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Helper to safely get and sanitize values
 */
const val = (data, key, fallback = '') => sanitizeHTML(data[key] || fallback);

/**
 * Generates the specific Commercial Invoice print view.
 * @param {object} data
 */
function generateCommercialInvoicePrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    // Helper to format data, with fallback
    const val = (key, fallback = '____________________') => sanitizeHTML(data[key] || fallback);
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- Currency Conversion Logic ---
    const currency = data.currency || 'USD';
    const exRate = parseFloat(data.exchange_rate) || 1;
    
    let products = data.products || [];
    if (products.length === 0) {
        products = [{ sno: 1, marks: '-', desc: 'Sample Product', hsn: '0000', qty: 1, unit: 'PCS', rate: 0, amount: 0 }];
    }

    // Convert INR values to Target Currency
    const displayProducts = products.map(p => ({
        ...p,
        rate: (p.rate / exRate),
        amount: (p.amount / exRate)
    }));

    const totalAmount = displayProducts.reduce((sum, p) => sum + p.amount, 0);
    const toWords = (num) => `${currency} ${num.toFixed(2)} (Exchange Rate: ${exRate})`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Commercial Invoice - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 10px; }
            .container { max-width: 800px; margin: 0 auto; }
            
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
                .invoice-box { border: 1px solid #000; }
            }

            .invoice-box { max-width: 800px; margin: auto; padding: 0; border: 1px solid #ccc; font-size: 11px; line-height: 16px; color: #000; background: white; }
            .invoice-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .invoice-table td { padding: 5px; vertical-align: top; border: 1px solid #000; }
            
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            .btn:hover { background: #1d4ed8; }
            .btn-close { background: #6b7280; }
            
            .header-title { text-align: center; font-size: 18px; font-weight: bold; border-bottom: 1px solid #000; padding: 10px; }
            .bold { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px; padding: 20px; background: #f0f0f0;">
            <button onclick="window.print()" class="btn">Print Invoice</button>
            <button onclick="window.close()" class="btn btn-close">Close</button>
        </div>

        <div class="container">
            <div class="invoice-box">
                <table class="invoice-table">
                    <tr>
                        <td colspan="4" class="header-title">COMMERCIAL INVOICE</td>
                    </tr>
                    <tr>
                        <td colspan="2" rowspan="2" width="50%">
                            <div class="bold">Exporter:</div>
                            ${val('exporter_details').replace(/\n/g, '<br>')}
                        </td>
                        <td colspan="1" width="25%">
                            <div class="bold">Invoice No. & Date:</div>
                            ${val('invoice_no')} <br> ${val('invoice_date')}
                        </td>
                        <td colspan="1" width="25%">
                            <div class="bold">Exporter's Ref:</div>
                            ${val('exporter_ref')}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <div class="bold">Buyer's Order No. & Date:</div>
                            ${val('buyer_order')} ${val('buyer_date') ? '/ ' + val('buyer_date') : ''}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" rowspan="2">
                            <div class="bold">Consignee:</div>
                            ${val('consignee_details').replace(/\n/g, '<br>')}
                        </td>
                        <td colspan="2">
                            <div class="bold">Other References:</div>
                            ${val('other_ref')}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2">
                            <div class="bold">Buyer (if other than Consignee):</div>
                            ${val('buyer_details', 'Same as Consignee').replace(/\n/g, '<br>')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="bold">Pre-Carriage by:</div>${val('pre_carriage')}
                        </td>
                        <td>
                            <div class="bold">Place of Receipt:</div>${val('place_receipt')}
                        </td>
                        <td colspan="2">
                            <div class="bold">Country of Origin:</div> ${val('country_origin')}<br>
                            <div class="bold">Country of Destination:</div> ${val('country_dest')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="bold">Vessel/Flight No.:</div>${val('vessel_flight_no')}
                        </td>
                        <td>
                            <div class="bold">Port of Loading:</div>${val('port_loading')}
                        </td>
                        <td colspan="2">
                            <div class="bold">Terms of Delivery & Payment:</div>
                            ${val('terms')} / ${val('payment_terms')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="bold">Port of Discharge:</div>${val('port_discharge')}
                        </td>
                        <td>
                            <div class="bold">Final Destination:</div>${val('final_dest')}
                        </td>
                        <td colspan="2">
                            <div class="bold">IEC Code:</div> ${val('iec')}
                        </td>
                    </tr>
                </table>

                <table class="invoice-table" style="border-top: none;">
                    <tr style="background: #eee; font-weight: bold; text-align: center;">
                        <td>Marks & No.</td>
                        <td>Description of Goods</td>
                        <td>HSN/SAC</td>
                        <td>Qty</td>
                        <td>Rate (${currency})</td>
                        <td>Amount (${currency})</td>
                    </tr>
                        ${displayProducts.map(p => `
                        <tr>
                            <td>${p.marks || '-'}</td>
                            <td>${p.desc}</td>
                            <td>${p.hsn}</td>
                            <td>${p.qty} ${p.unit}</td>
                            <td style="text-align:right;">${p.rate.toFixed(2)}</td>
                            <td style="text-align:right;">${p.amount.toFixed(2)}</td>
                        </tr>`).join('')}
                    <tr>
                        <td colspan="5" style="text-align:right; font-weight:bold;">Total</td>
                        <td style="text-align:right; font-weight:bold;">${totalAmount.toFixed(2)}</td>
                    </tr>
                </table>
                
                <div style="padding: 10px; border: 1px solid #000; border-top: none;">
                    <div class="bold">Amount Chargeable (in words):</div> ${toWords(totalAmount)}
                </div>

                <div style="display: flex; border: 1px solid #000; border-top: none;">
                    <div style="width: 50%; padding: 10px; border-right: 1px solid #000;">
                        <div class="bold">Declaration:</div>
                        ${val('declaration')}
                    </div>
                    <div style="width: 50%; padding: 10px; text-align: right; position: relative;">
                        <br><br><br>
                        <div class="bold">Signature & Date</div>
                        <span style="font-size: 10px;">(Company Stamp)</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Packing List print view.
 * @param {object} data
 */
function generatePackingListPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const packages = data.packages || [];
    
    // Calculate Summaries
    const totalNet = packages.reduce((sum, p) => sum + p.net, 0);
    const totalGross = packages.reduce((sum, p) => sum + p.gross, 0);
    const totalVol = packages.reduce((sum, p) => sum + p.vol, 0);
    const totalPkgs = packages.length;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Packing List - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 11px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .company-header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1565c0; }
            .company-name { font-size: 24px; font-weight: bold; color: #1565c0; margin-bottom: 5px; }
            
            .doc-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section-title { font-size: 12px; font-weight: bold; color: #1565c0; margin-bottom: 5px; border-bottom: 1px solid #ddd; }
            .info-row { margin-bottom: 4px; }
            .label { font-weight: bold; margin-right: 5px; }
            
            .packing-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
            .packing-table th { background: #1565c0; color: white; padding: 8px; text-align: left; }
            .packing-table td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .summary-row.total { font-weight: bold; border-top: 1px solid #1565c0; padding-top: 5px; margin-top: 5px; }
            
            .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature-line { width: 200px; border-bottom: 1px solid #000; margin-top: 40px; }
            
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="company-header">
                <div class="company-name">PACKING LIST</div>
                <div>Invoice No: ${val('invoice_no')} | Date: ${val('invoice_date')}</div>
            </div>
            
            <div class="doc-header">
                <div style="width: 48%;">
                    <div class="section-title">EXPORTER</div>
                    <div>${val('exporter_details').replace(/\n/g, '<br>')}</div>
                </div>
                <div style="width: 48%;">
                    <div class="section-title">CONSIGNEE</div>
                    <div>${val('consignee_details').replace(/\n/g, '<br>')}</div>
                </div>
            </div>

            <div class="doc-header">
                <div style="width: 48%;">
                    <div class="info-row"><span class="label">Buyer Order:</span> ${val('buyer_order')}</div>
                    <div class="info-row"><span class="label">Vessel/Flight:</span> ${val('vessel_flight')}</div>
                </div>
                <div style="width: 48%;">
                    <div class="info-row"><span class="label">Port of Loading:</span> ${val('port_loading')}</div>
                    <div class="info-row"><span class="label">Final Dest:</span> ${val('final_dest')}</div>
                </div>
            </div>
            
            <div class="section-title">PACKAGE DETAILS</div>
            <table class="packing-table">
                <thead>
                    <tr>
                        <th>Carton No</th><th>Description</th><th>Quantity</th>
                        <th class="text-right">N.W. (Kgs)</th><th class="text-right">G.W. (Kgs)</th>
                        <th class="text-center">Dims (cm)</th><th class="text-right">Vol. Wt.</th>
                    </tr>
                </thead>
                <tbody>
                    ${packages.map(p => `
                    <tr>
                        <td class="text-center">${p.carton}</td><td>${p.desc}</td><td>${p.qty}</td>
                        <td class="text-right">${p.net.toFixed(2)}</td><td class="text-right">${p.gross.toFixed(2)}</td>
                        <td class="text-center">${p.dims}</td><td class="text-right">${p.vol.toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            
            <div class="summary-box">
                <div class="summary-row"><span>Total Packages:</span><span>${totalPkgs}</span></div>
                <div class="summary-row"><span>Total Net Weight:</span><span>${totalNet.toFixed(2)} Kgs</span></div>
                <div class="summary-row"><span>Total Gross Weight:</span><span>${totalGross.toFixed(2)} Kgs</span></div>
                <div class="summary-row total"><span>Chargeable Weight (Max of Gross/Vol):</span><span>${Math.max(totalGross, totalVol).toFixed(2)} Kgs</span></div>
            </div>
            
            <div class="doc-header">
                <div style="width: 48%;">
                    <div class="section-title">MARKS & NUMBERS</div>
                    <div>${val('marks_numbers').replace(/\n/g, '<br>')}</div>
                </div>
                <div style="width: 48%;">
                    <div class="section-title">SPECIAL INSTRUCTIONS</div>
                    <div>${val('special_instructions').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            
            <div class="signature-section">
                <div style="text-align: center;"><div class="signature-line"></div><b>Prepared By</b></div>
                <div style="text-align: center;"><div class="signature-line"></div><b>Authorized Signatory</b></div>
            </div>
        </div>
    </body>
    </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific KYC Form print view.
 * @param {object} data 
 */
function generateKYCPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const isChecked = (val) => data.entity_type === val ? 'checked' : '';
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>KYC Form - ${data.entity_name || 'Draft'}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
                .document-preview { box-shadow: none; border: none; margin: 0; width: 100%; }
            }

            .document-preview { background: white; padding: 40px; width: 100%; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); font-weight: bold; z-index: 1; pointer-events: none; }
            .document-content { position: relative; z-index: 2; }
            .form-title { text-align: center; font-size: 20px; font-weight: bold; color: #2e7d32; margin-bottom: 30px; text-decoration: underline; }
            .form-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .form-table td { padding: 10px; border: 1px solid #ddd; vertical-align: top; }
            .form-label { font-weight: bold; color: #2e7d32; width: 200px; }
            .checkbox-group { margin: 10px 0; }
            .checkbox-item { display: block; margin-bottom: 5px; }
            .checkbox-box { display: inline-block; width: 16px; height: 16px; border: 1px solid #000; margin-right: 5px; vertical-align: middle; }
            .checkbox-box.checked { background: #000; }
            
            .text-field { width: 100%; border: none; border-bottom: 1px dashed #999; padding: 5px 0; font-family: monospace; font-size: 12px; color: #000; }
            .textarea-field { width: 100%; border: none; border-bottom: 1px dashed #999; padding: 5px 0; font-family: monospace; font-size: 12px; color: #000; white-space: pre-wrap; }
            
            .section-title { background: #e8f5e9; padding: 10px; font-weight: bold; color: #2e7d32; margin: 20px 0 10px; border-left: 4px solid #2e7d32; }
            .declaration-box { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin: 30px 0; font-size: 11px; line-height: 1.6; text-align: justify; }
            
            .signature-section { margin-top: 40px; padding-top: 20px; border-top: 2px solid #2e7d32; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; }
            .signature-line { width: 100%; border-bottom: 1px solid #000; margin: 60px 0 5px; }
            .signature-label { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
            .stamp-area { width: 150px; height: 80px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; margin-top: 10px; float: right; }
            
            .page-footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
            
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            .btn:hover { background: #1d4ed8; }
            .btn-close { background: #6b7280; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px; padding: 20px; background: #f0f0f0;">
            <button onclick="window.print()" class="btn">Print Document</button>
            <button onclick="window.close()" class="btn btn-close">Close</button>
        </div>

        <div class="container">
            <div class="document-preview">
                <div class="watermark">KYC FORM</div>
                <div class="document-content">
                    <div class="form-title"># Form KYC (Know Your Customer)</div>
                    
                    <table class="form-table">
                        <tr>
                            <td width="30" class="form-label">1.</td>
                            <td class="form-label">Category</td>
                            <td>
                                <div class="checkbox-group">
                                    <div class="checkbox-item"><span class="checkbox-box ${isChecked('Individual/Proprietary firm')}"></span> Individual/Proprietary firm</div>
                                    <div class="checkbox-item"><span class="checkbox-box ${isChecked('Company')}"></span> Company</div>
                                    <div class="checkbox-item"><span class="checkbox-box ${isChecked('Trusts/Foundations')}"></span> Trusts/Foundations</div>
                                    <div class="checkbox-item"><span class="checkbox-box ${isChecked('Partnership firm')}"></span> Partnership firm</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="form-label">2.</td>
                            <td class="form-label">Name</td>
                            <td>
                                <div class="text-field">${data.entity_name || ''}</div>
                                <div style="font-size: 10px; color: #666; margin-top: 5px;">Name of the individual including alias/ Proprietary Firm/Company/Trusts/Foundations/ Partnership firm (name of all partners)</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="form-label">3.</td>
                            <td class="form-label">Permanent/Registered Address</td>
                            <td><div class="textarea-field">${(data.permanent_address || '').replace(/\n/g, '<br>')}</div></td>
                        </tr>
                        <tr>
                            <td class="form-label">4.</td>
                            <td class="form-label">Principal Business Address</td>
                            <td><div class="textarea-field">${(data.business_address || '').replace(/\n/g, '<br>')}</div></td>
                        </tr>
                        <tr>
                            <td class="form-label">5.</td>
                            <td class="form-label">Authorized Signatories</td>
                            <td>
                                <div class="textarea-field">${(data.auth_signatories || '').replace(/\n/g, '<br>')}</div>
                                <div style="font-size: 10px; color: #666; margin-top: 5px;">(Please provide recent passport size self attested photographs of each signatory)</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="form-label">6.</td>
                            <td class="form-label">IEC No.</td>
                            <td>
                                <div class="text-field">${data.iec_no || ''}</div>
                                <div style="margin-top: 5px; font-weight: bold; font-size: 11px;">Copy Attached: [ &nbsp; ] Yes</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="form-label">7.</td>
                            <td class="form-label">PAN No.</td>
                            <td>
                                <div class="text-field">${data.pan || ''}</div>
                                <div style="margin-top: 5px; font-weight: bold; font-size: 11px;">Copy Attached: [ &nbsp; ] Yes</div>
                            </td>
                        </tr>
                    </table>
                    
                    <div class="section-title">DECLARATION</div>
                    <div class="declaration-box">
                        ${(data.declaration_text || '').replace(/\n/g, '<br>')}
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-label">Place: ${data.declaration_place || ''}</div>
                            <div class="signature-label">Date: ${data.declaration_date || ''}</div>
                            <div class="signature-line"></div>
                            <div class="signature-label" style="text-align: center;">Signature</div>
                        </div>
                        <div class="signature-box" style="text-align: right;">
                            <div class="stamp-area">OFFICIAL SEAL<br>(for all other than individuals)</div>
                            <div style="clear: both; height: 20px;"></div>
                            <div class="signature-label" style="text-align: right;">Name: ${data.authorized_signatory_name || ''}</div>
                            <div class="signature-label" style="text-align: right;">Designation: ${data.authorized_signatory_designation || ''}</div>
                        </div>
                    </div>
                    
                    <div class="page-footer">
                        Page 1 of 1 | Generated: ${new Date().toLocaleString()} | KYC Form DOC-003
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// Add other print view functions here as needed...
// (Due to length constraints, I'm showing the pattern with these key functions)

/**
 * Generates the specific SDF Form print view.
 * @param {object} data 
 */
function generateSDFPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isSellerChecked = data.seller_consignor === 'SELLER' ? 'checked' : '';
    const isConsignorChecked = data.seller_consignor === 'CONSIGNOR' ? 'checked' : '';
    const isValueAChecked = data.value_ascertainment?.includes('A -') ? 'checked' : '';
    const isValueBChecked = data.value_ascertainment?.includes('B -') ? 'checked' : '';
    const isCautionListYes = data.rbi_caution_list === 'am/are' ? 'am/are' : 'am/are not';
    const strikeYes = data.rbi_caution_list === 'am/are' ? '' : 'strike-text';
    const strikeNo = data.rbi_caution_list === 'am/are' ? 'strike-text' : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>SDF Form - ${val('shipping_bill_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 12px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .document-preview { background: white; padding: 40px; border: 1px solid #ddd; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.1); font-weight: bold; z-index: 1; }
            .document-content { position: relative; z-index: 2; }
            .form-title { text-align: center; font-size: 20px; font-weight: bold; color: #6a1b9a; margin-bottom: 30px; }
            .form-section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #6a1b9a; margin-bottom: 10px; font-size: 14px; }
            .strike-text { text-decoration: line-through; color: #999; }
            .active-text { color: #6a1b9a; font-weight: bold; }
            .form-field { margin: 15px 0; }
            .field-label { font-weight: bold; display: block; margin-bottom: 5px; color: #555; }
            .field-input { border: none; border-bottom: 1px solid #000; padding: 2px 5px; font-family: monospace; }
            .declaration-text { margin-bottom: 15px; line-height: 1.6; }
            .checkbox-item { margin: 8px 0; }
            .checkbox-box { display: inline-block; width: 16px; height: 16px; border: 1px solid #000; margin-right: 8px; vertical-align: middle; }
            .checkbox-box.checked { background: #000; }
            .signature-section { margin-top: 60px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="document-preview">
                <div class="watermark">SDF FORM</div>
                <div class="document-content">
                    <div class="form-title">
                        APPENDIX I<br>
                        <small>FORM SDF</small>
                    </div>
                    
                    <div class="form-field">
                        <span class="field-label">Shipping Bill No. and Date:</span>
                        <span class="field-input">${val('shipping_bill_no')} Dated: ${val('shipping_bill_date')}</span>
                    </div>
                    
                    <div class="form-section">
                        <div class="section-title">Declaration under Foreign Exchange Regulation Act, 1973:</div>
                        
                        <div class="declaration-text">
                            1. I/We hereby declare that I/We am/are the 
                            <span class="${data.seller_consignor === 'SELLER' ? 'active-text' : 'strike-text'}">*SELLER</span>/
                            <span class="${data.seller_consignor === 'CONSIGNOR' ? 'active-text' : 'strike-text'}">*CONSIGNOR</span>
                            of the goods in respect of which this declaration is made and that the particulars given in the Shipping Bill no <strong>${val('shipping_bill_no')}</strong> dated <strong>${val('shipping_bill_date')}</strong> are true and that,
                        </div>
                        
                        <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #6a1b9a;">
                            <div class="checkbox-item">
                                <span class="checkbox-box ${isValueAChecked}"></span> 
                                <span class="${isValueAChecked ? 'active-text' : 'strike-text'}">A)* The value as contracted with the buyer is same as the full export value in the above shipping bills.</span>
                            </div>
                            <div class="checkbox-item">
                                <span class="checkbox-box ${isValueBChecked}"></span> 
                                <span class="${isValueBChecked ? 'active-text' : 'strike-text'}">B)* The full export value of the goods are not ascertainable at the time of export and that the value declared is that which I/We, having regard to the prevailing market conditions, accept to receive on the sale of goods in the overseas market.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <div class="declaration-text">
                            2. I/We undertake that I/We will deliver to the bank named herein 
                            <span class="field-input" style="width: 300px;">${val('bank_name')}</span>
                            the foreign exchange representing the full export value of the goods on or before 
                            <span class="field-input" style="width: 150px;">${val('repatriation_date')}</span>
                            in the manner prescribed in Rule 9 of the Foreign Exchange Regulation Rules, 1974.
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <div class="declaration-text">
                            3. I/We further declares that I/We am/are resident in India and I/We have place of Business in India.
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <div class="declaration-text">
                            4. I./We <span class="${strikeYes}">am/are</span> <span class="${strikeNo}">am/are not</span> in Caution list of the Reserve Bank of India.
                        </div>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <div class="declaration-text">
                            <strong>Note:</strong> Strike out whichever is not applicable.
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <span class="field-label">Date:</span>
                        <span class="field-input">${val('declaration_date')}</span>
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-line"></div>
                        <div style="font-weight: bold; margin-bottom: 20px;">Signature of Exporter</div>
                        
                        <div>
                            <span class="field-label">Name:</span>
                            <span class="field-input" style="width: 400px;">${val('exporter_name')}</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 10px; border-top: 1px solid #ddd;">
                        Page 1 of 1 | Generated: ${new Date().toLocaleString()} | SDF Form DOC-004
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the Domestic Invoice print view.
 * @param {object} data 
 */
function generateDomesticInvoicePrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => sanitizeHTML(data[key] || fallback);
    const products = data.products || [];
    const totalAmount = products.reduce((sum, p) => sum + (p.amount || 0), 0);
    const cgstAmount = totalAmount * 0.09;
    const sgstAmount = totalAmount * 0.09;
    const grandTotal = totalAmount + cgstAmount + sgstAmount;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Tax Invoice cum Delivery Challan - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 11px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .invoice-header { text-align: center; font-size: 18px; font-weight: bold; color: #3498db; margin-bottom: 20px; }
            .company-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .invoice-table th, .invoice-table td { padding: 8px; border: 1px solid #000; text-align: left; }
            .invoice-table th { background: #3498db; color: white; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background: #f0f0f0; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="invoice-header">TAX INVOICE CUM DELIVERY CHALLAN</div>
            
            <div class="company-details">
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 48%;">
                        <strong>From:</strong><br>
                        ${val('supplier_details').replace(/\n/g, '<br>')}
                    </div>
                    <div style="width: 48%;">
                        <strong>Invoice No:</strong> ${val('invoice_no')}<br>
                        <strong>Date:</strong> ${val('invoice_date')}<br>
                        <strong>GSTIN:</strong> ${val('supplier_gstin')}
                    </div>
                </div>
            </div>
            
            <div class="company-details">
                <strong>To:</strong><br>
                ${val('buyer_details').replace(/\n/g, '<br>')}<br>
                <strong>GSTIN:</strong> ${val('buyer_gstin')}
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>S.No</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map((p, i) => `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td>${p.desc || ''}</td>
                        <td>${p.hsn || ''}</td>
                        <td class="text-center">${p.qty || 0}</td>
                        <td class="text-right">₹${(p.rate || 0).toFixed(2)}</td>
                        <td class="text-right">₹${(p.amount || 0).toFixed(2)}</td>
                    </tr>`).join('')}
                    <tr class="total-row">
                        <td colspan="5" class="text-right">Subtotal</td>
                        <td class="text-right">₹${totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="text-right">CGST @ 9%</td>
                        <td class="text-right">₹${cgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="text-right">SGST @ 9%</td>
                        <td class="text-right">₹${sgstAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="5" class="text-right">Grand Total</td>
                        <td class="text-right">₹${grandTotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                <div>Terms & Conditions:<br>${val('terms_conditions').replace(/\n/g, '<br>')}</div>
                <div style="text-align: right;">
                    <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 5px;">Authorized Signatory</div>
                </div>
            </div>
        </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the BL/AWB print view.
 * @param {object} data 
 */
function generateBLAWBPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => sanitizeHTML(data[key] || fallback);
    const docType = data.document_type === 'awb' ? 'AIR WAYBILL' : 'BILL OF LADING';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${docType} - ${val('bl_awb_number')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 11px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .doc-header { text-align: center; font-size: 20px; font-weight: bold; color: #e74c3c; margin-bottom: 20px; border-bottom: 2px solid #e74c3c; padding-bottom: 10px; }
            .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .info-table td { padding: 8px; border: 1px solid #000; vertical-align: top; }
            .label { font-weight: bold; background: #f8f9fa; width: 30%; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; text-align: center; }
            .signature-line { border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="doc-header">${docType}</div>
            
            <table class="info-table">
                <tr>
                    <td class="label">Document Number</td>
                    <td>${val('bl_awb_number')}</td>
                    <td class="label">Issue Date</td>
                    <td>${val('issue_date')}</td>
                </tr>
                <tr>
                    <td class="label">Carrier/Airline</td>
                    <td colspan="3">${val('carrier_name')}</td>
                </tr>
                <tr>
                    <td class="label">Shipper</td>
                    <td colspan="3">${val('shipper_details').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Consignee</td>
                    <td colspan="3">${val('consignee_details').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Port of Loading</td>
                    <td>${val('port_loading')}</td>
                    <td class="label">Port of Discharge</td>
                    <td>${val('port_discharge')}</td>
                </tr>
                <tr>
                    <td class="label">Vessel/Flight</td>
                    <td>${val('vessel_flight')}</td>
                    <td class="label">Voyage Date</td>
                    <td>${val('voyage_date')}</td>
                </tr>
                <tr>
                    <td class="label">Description of Goods</td>
                    <td colspan="3">${val('goods_description').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Gross Weight</td>
                    <td>${val('gross_weight')} KGS</td>
                    <td class="label">Volume</td>
                    <td>${val('volume')} CBM</td>
                </tr>
                <tr>
                    <td class="label">Freight Terms</td>
                    <td>${val('freight_terms')}</td>
                    <td class="label">On Board Date</td>
                    <td>${val('onboard_date')}</td>
                </tr>
            </table>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <strong>For Carrier</strong><br>
                    Authorized Signature & Stamp
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <strong>Shipper's Declaration</strong><br>
                    Shipper's Signature & Date
                </div>
            </div>
        </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the Insurance Certificate print view.
 * @param {object} data 
 */
function generateInsuranceCertPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => sanitizeHTML(data[key] || fallback);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Insurance Certificate - ${val('certificate_number')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 11px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .cert-header { text-align: center; font-size: 20px; font-weight: bold; color: #2ecc71; margin-bottom: 20px; border-bottom: 2px solid #2ecc71; padding-bottom: 10px; }
            .cert-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .cert-table td { padding: 10px; border: 1px solid #000; vertical-align: top; }
            .label { font-weight: bold; background: #e8f5e9; width: 30%; }
            .summary-box { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; text-align: center; }
            .signature-line { border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="cert-header">INSURANCE CERTIFICATE</div>
            
            <div class="summary-box">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Policy Number:</strong> ${val('certificate_number')}</span>
                    <span><strong>Insured Value:</strong> ${val('currency')} ${val('sum_insured')}</span>
                </div>
                <div><strong>Voyage:</strong> ${val('voyage_details')}</div>
            </div>
            
            <table class="cert-table">
                <tr>
                    <td class="label">Certificate Number</td>
                    <td>${val('certificate_number')}</td>
                    <td class="label">Issue Date</td>
                    <td>${val('issue_date')}</td>
                </tr>
                <tr>
                    <td class="label">Insurer/Underwriter</td>
                    <td colspan="3">${val('insurer_name')}<br>${val('insurer_address')}</td>
                </tr>
                <tr>
                    <td class="label">Insured Party</td>
                    <td colspan="3">${val('insured_party').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Sum Insured</td>
                    <td>${val('currency')} ${val('sum_insured')}</td>
                    <td class="label">Risks Covered</td>
                    <td>${val('risks_covered')}</td>
                </tr>
                <tr>
                    <td class="label">Description of Goods</td>
                    <td colspan="3">${val('goods_description').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Voyage Details</td>
                    <td colspan="3">${val('voyage_details').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Claims Payable At</td>
                    <td>${val('claims_payable')}</td>
                    <td class="label">Deductible</td>
                    <td>${val('deductible')}</td>
                </tr>
                <tr>
                    <td class="label">Linked Documents</td>
                    <td colspan="3">Invoice: ${val('invoice_number')} | BL/AWB: ${val('bl_awb_number')}</td>
                </tr>
            </table>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <strong>For the Insurer</strong><br>
                    Authorized Signature & Company Stamp
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <strong>Date of Issue</strong><br>
                    ${val('issue_date')}
                </div>
            </div>
        </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the ARE-1 Form print view.
 * @param {object} data 
 */
function generateARE1PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => sanitizeHTML(data[key] || fallback);
    const goods = data.goods || [];
    const totalValue = goods.reduce((sum, g) => sum + (g.assessable_value || 0), 0);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>ARE-1 Form - ${val('are1_number')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 11px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            
            .form-header { text-align: center; font-size: 20px; font-weight: bold; color: #9b59b6; margin-bottom: 20px; border-bottom: 2px solid #9b59b6; padding-bottom: 10px; }
            .form-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .form-table td { padding: 8px; border: 1px solid #000; vertical-align: top; }
            .label { font-weight: bold; background: #f3e5f5; width: 30%; }
            .goods-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
            .goods-table th { background: #9b59b6; color: white; padding: 8px; text-align: left; }
            .goods-table td { padding: 6px; border: 1px solid #ddd; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
            .signature-box { width: 45%; }
            .signature-line { border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin: 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>

        <div class="container">
            <div class="form-header">ARE-1 FORM<br><small>Application for Removal of Excisable Goods for Export</small></div>
            
            <table class="form-table">
                <tr>
                    <td class="label">ARE-1 Serial Number</td>
                    <td>${val('are1_number')}</td>
                    <td class="label">Date of Application</td>
                    <td>${val('application_date')}</td>
                </tr>
                <tr>
                    <td class="label">Exporter Name</td>
                    <td colspan="3">${val('exporter_name')}</td>
                </tr>
                <tr>
                    <td class="label">Exporter Address</td>
                    <td colspan="3">${val('exporter_address').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="label">Exporter GSTIN</td>
                    <td>${val('exporter_gstin')}</td>
                    <td class="label">IE Code</td>
                    <td>${val('exporter_iecode')}</td>
                </tr>
                <tr>
                    <td class="label">Manufacturer</td>
                    <td>${val('manufacturer_name')}</td>
                    <td class="label">Manufacturer GSTIN</td>
                    <td>${val('manufacturer_gstin')}</td>
                </tr>
                <tr>
                    <td class="label">Overseas Consignee</td>
                    <td colspan="3">${val('consignee_details').replace(/\n/g, '<br>')}</td>
                </tr>
            </table>
            
            <div style="font-weight: bold; color: #9b59b6; margin: 20px 0 10px; font-size: 14px;">GOODS DETAILS</div>
            <table class="goods-table">
                <thead>
                    <tr>
                        <th>S.No</th><th>Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th>USD Value</th><th>Assessable Value (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${goods.map((g, i) => `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td>${g.description || ''}</td>
                        <td>${g.hsn || ''}</td>
                        <td class="text-center">${g.quantity || 0}</td>
                        <td>${g.unit || ''}</td>
                        <td class="text-right">${(g.usd_value || 0).toFixed(2)}</td>
                        <td class="text-right">${(g.assessable_value || 0).toLocaleString('en-IN')}</td>
                    </tr>`).join('')}
                    <tr style="font-weight: bold; background: #f0f0f0;">
                        <td colspan="6" class="text-right">Total Assessable Value (INR)</td>
                        <td class="text-right">${totalValue.toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
            </table>
            
            <table class="form-table">
                <tr>
                    <td class="label">Destination Port/ICD</td>
                    <td>${val('destination_port')}</td>
                    <td class="label">Removal Date & Time</td>
                    <td>${val('removal_date')}</td>
                </tr>
                <tr>
                    <td class="label">Transporter</td>
                    <td>${val('transporter_name')}</td>
                    <td class="label">Vehicle Number</td>
                    <td>${val('vehicle_number')}</td>
                </tr>
                <tr>
                    <td class="label">Central Tax Rate</td>
                    <td>${val('central_tax_rate')}%</td>
                    <td class="label">Central Tax Amount</td>
                    <td>₹${val('central_tax_amount')}</td>
                </tr>
                <tr>
                    <td class="label">State Tax Rate</td>
                    <td>${val('state_tax_rate')}%</td>
                    <td class="label">State Tax Amount</td>
                    <td>₹${val('state_tax_amount')}</td>
                </tr>
                <tr>
                    <td class="label">Bond Details</td>
                    <td colspan="3">${val('bond_details')}</td>
                </tr>
            </table>
            
            <div class="signature-section">
                <div class="signature-box">
                    <strong>Central Tax Officer at Origin</strong>
                    <div class="signature-line"></div>
                    <div>Name: ${val('origin_officer_name')}</div>
                    <div>Date: ${val('verification_date')}</div>
                </div>
                <div class="signature-box">
                    <strong>Customs Officer at Destination</strong>
                    <div class="signature-line"></div>
                    <div>Name: ${val('destination_officer_name')}</div>
                    <div>Export Date: ${val('export_date')}</div>
                </div>
            </div>
        </div>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

// Add placeholder functions for all other print views
function generateAnnexure1PrintView(data) { generateGenericPrintView('ANN_1', data); }
function generateSLIPrintView(data) { generateGenericPrintView('SLI', data); }
function generateAnnexure2PrintView(data) { generateGenericPrintView('ANN_2', data); }
function generateAppendix3PrintView(data) { generateGenericPrintView('APP_3', data); }
function generateAppendix4PrintView(data) { generateGenericPrintView('APP_4', data); }
function generateAppendix2PrintView(data) { generateGenericPrintView('APP_2', data); }
function generateAnnexureC1PrintView(data) { generateGenericPrintView('ANN_C1', data); }
function generateSingleCountryDeclarationPrintView(data) { generateGenericPrintView('SCD', data); }
function generateMultipleCountryDeclarationPrintView(data) { generateGenericPrintView('MCD', data); }
function generateNegativeDeclarationPrintView(data) { generateGenericPrintView('NEG_DEC', data); }
function generateQuotaChargeStatementPrintView(data) { generateGenericPrintView('QUOTA', data); }
function generateNonDGPrintView(data) { generateGenericPrintView('NON_DG', data); }
function generateTSCAPrintView(data) { generateGenericPrintView('TSCA', data); }
function generateGRSamplePrintView(data) { generateGenericPrintView('GR_SAMPLE', data); }
function generateGRRepairPrintView(data) { generateGenericPrintView('GR_REPAIR', data); }
function generateMSDSPrintView(data) { generateGenericPrintView('MSDS', data); }
function generateTaxChallanPrintView(data) { generateGenericPrintView('TAX_CHALLAN', data); }
function generateLOAPrintView(data) { generateGenericPrintView('LOA', data); }
function generateCOOPrintView(data) { generateGenericPrintView('COO', data); }
function generateAnnexureDPrintView(data) { generateGenericPrintView('ANN_D', data); }
function generateDeliveryChallanPrintView(data) { generateGenericPrintView('DELIVERY_CHALLAN', data); }

/**
 * Generic print view fallback for documents without specialized templates
 */
function generateGenericPrintView(docId, data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${docId} - Generic View</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table td { padding: 8px; border: 1px solid #ddd; }
            .label { font-weight: bold; background: #f5f5f5; width: 30%; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 6px; margin: 5px; }
        </style>
    </head>
    <body>
        <div style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="header">
            <h1>${docId} Document</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        <table class="data-table">
            ${Object.entries(data).map(([key, value]) => `
                <tr>
                    <td class="label">${key}</td>
                    <td>${value || '-'}</td>
                </tr>
            `).join('')}
        </table>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}