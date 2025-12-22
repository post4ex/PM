/**
 * docsx-gen.js
 * The "Brain" of the Document Center.
 * Handles form schemas, validation logic, and dynamic rendering for docsx.html.
 */

// ============================================================================
// SECTION 0: DATA DICTIONARY (COMMON MUTUAL FIELDS)
// ============================================================================
// These keys are used across multiple documents to ensure data consistency.
// - invoice_no:       Used in Invoice, Packing List, SDF
// - invoice_date:     Used in Invoice, Packing List
// - exporter_details: Used in Invoice, SLI, LOA, COO (Consignor/Shipper)
// - consignee_details:Used in Invoice, COO (Buyer/Receiver)
// - awb_number:       Used in SLI, AWB, Tracking
// - country_dest:     Used in Invoice, COO
// ============================================================================

// ============================================================================
// SECTION 1: DOCUMENT SCHEMAS (CONFIGURATION)
// ============================================================================
const DOC_SCHEMAS = {
    // --- Category 1: Core Documents ---
    'DOM_INV': {
        id: 'DOM_INV',
        title: 'Domestic Invoice / Challan',
        desc: 'Required for all domestic shipping and local transport.',
        fields: [
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_details', label: 'Consignor (Sender)', type: 'text', required: true, width: 'w-full' },
            { key: 'consignee_details', label: 'Consignee (Receiver)', type: 'text', required: true, width: 'w-full' },
            { key: 'gstin', label: 'GSTIN', type: 'text', width: 'w-1/2' },
            { key: 'place_supply', label: 'Place of Supply', type: 'text', width: 'w-1/2' }
        ]
    },
    'COM_INV': {
        id: 'COM_INV',
        title: 'Commercial Invoice',
        desc: 'Standard document for all commercial export shipments.',
        fields: [
            { key: 'invoice_no', label: 'Invoice No.', type: 'text', required: true, width: 'w-1/3' },
            { key: 'invoice_date', label: 'Date', type: 'date', required: true, width: 'w-1/3' },
            { key: 'iec', label: 'IEC Code', type: 'text', width: 'w-1/3' },
            { key: 'exporter_ref', label: 'Exporter Reference', type: 'text', width: 'w-1/2' },
            { key: 'buyer_order', label: 'Buyer Order No.', type: 'text', width: 'w-1/2' },
            { key: 'consignee_details', label: 'Consignee Details', type: 'textarea', required: true, width: 'w-full' },
            { key: 'country_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', width: 'w-1/2' },
            { key: 'country_dest', label: 'Country of Destination', type: 'text', required: true, width: 'w-1/2' },
            { key: 'terms', label: 'Incoterms', type: 'select', options: ['FOB', 'CIF', 'EXW', 'DAP', 'DDP'], width: 'w-full' }
        ]
    },
    'PKL': {
        id: 'PKL',
        title: 'Packing List',
        desc: 'Detailed breakdown of shipment contents, weights, and dimensions.',
        fields: [
            { key: 'invoice_no', label: 'Reference Invoice No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'total_pkgs', label: 'Total Packages', type: 'number', required: true, width: 'w-1/3' },
            { key: 'net_wt', label: 'Total Net Wt (kg)', type: 'number', required: true, width: 'w-1/3' },
            { key: 'gross_wt', label: 'Total Gross Wt (kg)', type: 'number', required: true, width: 'w-1/3' }
        ]
    },
    'KYC': {
        id: 'KYC',
        title: 'KYC Form',
        desc: 'Mandatory Indian Customs declaration for new or first-time exporters.',
        fields: [
            { key: 'entity_type', label: 'Category / Entity Type', type: 'select', options: ['Individual/Proprietary firm', 'Company', 'Trusts/Foundations', 'Partnership firm'], required: true, width: 'w-full' },
            { key: 'entity_name', label: 'Entity Name (and partners, if applicable)', type: 'text', required: true, width: 'w-full' },
            { key: 'permanent_address', label: 'Permanent / Registered Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'business_address', label: 'Principal Business Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'auth_signatories', label: 'Authorized Signatories (Names)', type: 'textarea', required: true, width: 'w-full', placeholder: 'e.g., 1. Mr. Rajesh Sharma\n2. Ms. Priya Patel' },
            { key: 'iec_no', label: 'IEC Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'pan', label: 'PAN Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'authorized_signatory_name', label: 'Signing Authority Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'authorized_signatory_designation', label: 'Signing Authority Designation', type: 'text', required: true, width: 'w-1/2' },
            { key: 'declaration_place', label: 'Place of Declaration', type: 'text', required: true, width: 'w-1/2' },
            { key: 'declaration_date', label: 'Date of Declaration', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'SLI': {
        id: 'SLI',
        title: 'Shippers Letter of Instructions',
        desc: 'Formal instructions provided to the freight forwarder.',
        fields: [
            { key: 'exporter_details', label: 'Shipper Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'forwarder_name', label: 'Freight Forwarder', type: 'text', required: true, width: 'w-1/2' },
            { key: 'awb_number', label: 'AWB/BL Number', type: 'text', width: 'w-1/2' },
            { key: 'special_instructions', label: 'Special Instructions', type: 'textarea', width: 'w-full' }
        ]
    },
    'BL_AWB': {
        id: 'BL_AWB',
        title: 'Bill of Lading / Air Waybill',
        desc: 'Contract of carriage issued by the carrier, detailing shipment terms.',
        fields: [
            { key: 'carrier_name', label: 'Carrier Name', type: 'text', required: true, width: 'w-full' },
            { key: 'awb_number', label: 'B/L or AWB Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'port_of_loading', label: 'Port of Loading', type: 'text', width: 'w-1/2' },
            { key: 'port_of_discharge', label: 'Port of Discharge', type: 'text', width: 'w-1/2' },
            { key: 'vessel_flight_no', label: 'Vessel / Flight No.', type: 'text', width: 'w-1/2' }
        ]
    },
    'INS_CERT': {
        id: 'INS_CERT',
        title: 'Insurance Certificate',
        desc: 'Proof of insurance coverage for the shipment.',
        fields: [
            { key: 'policy_no', label: 'Policy Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'insured_amount', label: 'Insured Amount', type: 'number', required: true, width: 'w-1/2' },
            { key: 'insured_party', label: 'Insured Party', type: 'text', width: 'w-full' },
            { key: 'subject_matter', label: 'Subject Matter Insured', type: 'text', width: 'w-full' }
        ]
    },
    'LOA': {
        id: 'LOA',
        title: 'Letter of Authority',
        desc: 'Authorizes a Customs House Agent (CHA) to act on your behalf.',
        fields: [
            { key: 'exporter_details', label: 'Exporter Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'cha_name', label: 'CHA Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'validity_period', label: 'Validity Period', type: 'text', width: 'w-1/2' },
            { key: 'authorized_signatory', label: 'Authorized Signatory', type: 'text', width: 'w-1/2' }
        ]
    },

    // --- Category 2: Incentives & Regimes ---
    'ARE1': {
        id: 'ARE1',
        title: 'ARE-1 Form',
        desc: 'For removal of goods for export without payment of Central Excise duty.',
        fields: [
            { key: 'are1_no', label: 'ARE-1 Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'excise_reg_no', label: 'Central Excise Reg. No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'description_of_goods', label: 'Description of Goods', type: 'textarea', width: 'w-full' },
            { key: 'quantity', label: 'Quantity', type: 'number', width: 'w-1/3' },
            { key: 'value_for_excise', label: 'Value for Excise Duty', type: 'number', width: 'w-1/3' },
            { key: 'duty_involved', label: 'Duty Involved', type: 'number', width: 'w-1/3' }
        ]
    },

    // --- Category 3: Shipment Type ---
    'SDF': {
        id: 'SDF',
        title: 'SDF Form',
        desc: 'Mandatory FEMA declaration for all exports from India.',
        fields: [
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', width: 'w-1/2' },
            { key: 'doc_date', label: 'Date', type: 'date', width: 'w-1/2' },
            { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'INR'], width: 'w-1/3' },
            { key: 'amount', label: 'Full Export Value', type: 'number', width: 'w-2/3' }
        ]
    },

    // --- Category 4: Product & Destination ---
    'COO': {
        id: 'COO',
        title: 'Certificate of Origin',
        desc: 'Certifies the country where the goods were manufactured.',
        fields: [
            { key: 'exporter_details', label: 'Exporter Details', type: 'textarea', required: true, width: 'w-full' }, // Already standard
            { key: 'consignee_details', label: 'Consignee Details', type: 'textarea', required: true, width: 'w-full' }, // Already standard
            { key: 'country_of_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', width: 'w-1/2' },
            { key: 'transport_details', label: 'Transport Details', type: 'text', width: 'w-1/2' },
            { key: 'marks_and_numbers', label: 'Marks and Numbers on Packages', type: 'text', width: 'w-full' }
        ]
    },
    // ... Add other schemas as needed ...
};

// ============================================================================
// SECTION 1.5: DECISION GUIDE
// ============================================================================
const DECISION_GUIDE = [
    {
        condition: "A standard commercial export",
        documents: [
            { id: 'COM_INV', name: 'Commercial-Invoice' },
            { id: 'PKL', name: 'Packing-List' },
            { id: 'KYC', name: 'KYC Form' },
            { id: 'SLI', name: 'Shippers-Letter-of-Instructions' },
            { id: 'BL_AWB', name: 'Bill of Lading/Air Waybill' },
            { id: 'SDF', name: 'SDF-Form' },
            { id: 'INS_CERT', name: 'Insurance Certificate (if applicable)' },
            { id: 'LOA', name: 'Letter of Authority (for CHA)' },
            { id: 'COO', name: 'Certificate of Origin (if required)' },
            { id: 'NON_DG', name: 'Non-DG-Declaration (if air freight)' }
        ]
    },
    {
        condition: "Claiming Duty Drawback",
        documents: [
            { id: 'APP_3', name: 'Appendix-III-for-Drawback' },
            { id: 'APP_4', name: 'Appendix-IV-for-Drawback' },
            { id: 'ANN_1_2', name: 'Annexure-I & II (Garments)' }
        ]
    },
    {
        condition: "Under DEPB/DEEC/EOU/Excise scheme",
        documents: [
            { id: 'ANN_D', name: 'Annexure-D (DEPB)' },
            { id: 'APP_2', name: 'Appendix-II (DEEC)' },
            { id: 'ANN_C1', name: 'Annexure-C1 (EOU)' },
            { id: 'ARE1', name: 'ARE-1 Form (Excise)' }
        ]
    },
    {
        condition: "Free Samples or Repair & Return",
        documents: [
            { id: 'GR_SAMPLE', name: 'GR-Waiver (Sample)' },
            { id: 'GR_REPAIR', name: 'GR-Waiver (Repair)' }
        ]
    },
    {
        condition: "Chemicals to the USA",
        documents: [ { id: 'MSDS', name: 'MSDS' }, { id: 'TSCA', name: 'TSCA-Certificate' } ]
    },
    {
        condition: "Textiles/Silk to the USA",
        documents: [ { id: 'NEG_DEC', name: 'Negative-Declaration' }, { id: 'QUOTA', name: 'Quota-Charge-Statement' }, { id: 'SCD', name: 'Single-Country-Declaration' }, { id: 'MCD', name: 'Multiple-Country-Declaration' } ]
    }
];

// ============================================================================
// SECTION 2: CORE LOGIC
// ============================================================================

/**
 * Main function called when a user clicks a sidebar item.
 * @param {HTMLElement} element - The clicked button element.
 * @param {string} docId - The ID of the document (e.g., 'COM_INV').
 * @param {string} docTitle - Fallback title.
 * @param {string} docDesc - Fallback description.
 */
function selectDoc(element, docId, docTitle, docDesc) {
    // 1. Visual Selection Logic
    document.querySelectorAll('.doc-link').forEach(link => {
        link.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-700');
        link.querySelector('span').classList.remove('text-blue-700');
        link.classList.add('border-transparent');
    });

    if (element) {
        element.classList.remove('border-transparent');
        element.classList.add('bg-blue-50', 'border-blue-500', 'text-blue-700');
        element.querySelector('span').classList.add('text-blue-700');
    }

    // 2. Fetch Schema
    const schema = DOC_SCHEMAS[docId] || { 
        id: docId, 
        title: docTitle, 
        desc: docDesc, 
        fields: [] // Empty fields means "Work in Progress"
    };

    // 3. Render Content
    renderDocumentWorkspace(schema);
}

/**
 * Renders the initial decision guide table.
 */
function renderDecisionGuide() {
    const contentArea = document.getElementById('app-content');
    if (!contentArea) return;

    // Clear active selection in sidebar
    document.querySelectorAll('.doc-link').forEach(link => {
        link.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-700');
        link.querySelector('span').classList.remove('text-blue-700');
        link.classList.add('border-transparent');
    });

    let guideHtml = `
        <div class="max-w-5xl mx-auto animate-fade-in">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Document Decision Guide</h1>
            <p class="text-gray-600 mb-8">Use this table to quickly identify the documents you need for your shipment.</p>
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="border-b-2 border-gray-200 bg-gray-50">
                        <tr>
                            <th class="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">If your shipment is...</th>
                            <th class="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Provide these documents</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    DECISION_GUIDE.forEach(rule => {
        guideHtml += `
            <tr class="border-b border-gray-100 last:border-b-0">
                <td class="p-4 align-top font-medium text-gray-800">${rule.condition}</td>
                <td class="p-4 align-top">
                    <div class="flex flex-wrap gap-2">
        `;
        rule.documents.forEach(doc => {
            const schema = DOC_SCHEMAS[doc.id];
            if (schema) {
                guideHtml += `<button onclick="selectDoc(document.querySelector('.doc-link[onclick*=\\'${doc.id}\\']'), '${doc.id}', '${schema.title.replace(/'/g, "\\'")}', '${schema.desc.replace(/'/g, "\\'")}')" class="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-full hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">${doc.name}</button>`;
            } else {
                guideHtml += `<span class="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-1 rounded-full cursor-not-allowed" title="Schema not defined yet">${doc.name}</span>`;
            }
        });
        guideHtml += `</div></td></tr>`;
    });

    guideHtml += `</tbody></table></div></div>`;
    contentArea.innerHTML = guideHtml;
}

/**
 * Renders the main content area with the form and preview sections.
 */
function renderDocumentWorkspace(schema) {
    const contentArea = document.getElementById('app-content');
    
    // Generate Form HTML
    let formHtml = '';
    if (schema.fields && schema.fields.length > 0) {
        formHtml = `<form id="doc-form" class="flex flex-wrap gap-y-4 -mx-2">`;
        
        schema.fields.forEach(field => {
            const widthClass = field.width || 'w-full';
            const requiredMark = field.required ? '<span class="text-red-500">*</span>' : '';
            
            let inputHtml = '';
            if (field.type === 'select') {
                const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                inputHtml = `<select name="${field.key}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">${options}</select>`;
            } else if (field.type === 'textarea') {
                inputHtml = `<textarea name="${field.key}" rows="3" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"></textarea>`;
            } else {
                inputHtml = `<input type="${field.type}" name="${field.key}" value="${field.value || ''}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">`;
            }

            formHtml += `
                <div class="${widthClass} px-2">
                    <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">${field.label} ${requiredMark}</label>
                    ${inputHtml}
                </div>
            `;
        });

        formHtml += `
            <div class="w-full px-2 mt-4 pt-4 border-t flex justify-end gap-3">
                <button type="button" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors">Reset</button>
                <button type="button" onclick="handleGenerate('${schema.id}')" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm transition-all transform active:scale-95">
                    <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>Generate Document
                </button>
            </div>
        </form>`;
    } else {
        formHtml = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                <i class="fa-solid fa-person-digging text-4xl mb-3"></i>
                <p>Template configuration for <strong>${schema.title}</strong> is under development.</p>
            </div>
        `;
    }

    // Inject HTML
    contentArea.innerHTML = `
        <div class="max-w-5xl mx-auto animate-fade-in">
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900">${schema.title}</h1>
                <p class="text-gray-600 mt-1">${schema.desc}</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left: Input Form -->
                <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 class="text-lg font-semibold text-gray-800">Document Details</h2>
                        <span class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">ID: ${schema.id}</span>
                    </div>
                    ${formHtml}
                </div>

                <!-- Right: Preview / Actions -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Preview Card -->
                    <div class="bg-gray-800 text-white p-6 rounded-lg shadow-lg">
                        <h3 class="font-semibold mb-2 flex items-center gap-2">
                            <i class="fa-regular fa-eye"></i> Live Preview
                        </h3>
                        <div id="mini-preview" class="bg-white text-gray-800 h-64 rounded opacity-90 flex items-center justify-center text-sm">
                            <span class="text-gray-400 italic">Fill form to see preview</span>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 class="text-sm font-bold text-gray-700 uppercase mb-3">Quick Actions</h3>
                        <div class="space-y-2">
                            <button class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex items-center">
                                <i class="fa-solid fa-clock-rotate-left w-6"></i> Load Last Draft
                            </button>
                            <button class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex items-center">
                                <i class="fa-solid fa-upload w-6"></i> Import from Shipment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style>
            .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
    `;
}

/**
 * Handles the generation logic.
 */
function handleGenerate(docId) {
    const form = document.getElementById('doc-form');
    if (!form) return;

    // Simple validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Visual Feedback
    const btn = form.querySelector('button[onclick*="handleGenerate"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Processing...`;

    // Simulate API Call / Generation
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        // Update Preview Area
        const previewBox = document.getElementById('mini-preview');
        previewBox.innerHTML = `
            <div class="text-center p-4">
                <i class="fa-solid fa-file-pdf text-red-500 text-4xl mb-2"></i>
                <p class="font-bold text-gray-800">${docId}_${Date.now()}.pdf</p>
                <button class="mt-3 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-xs rounded font-semibold">Download PDF</button>
            </div>
        `;
        
        // Use global notification if available (from layout.js)
        if (window.showNotification) {
            window.showNotification(`${docId} generated successfully!`, 'success');
        } else {
            alert('Document Generated Successfully!');
        }
    }, 1000);
}

/**
 * Initializes the Document Center page.
 */
function initDocCenter() {
    renderDecisionGuide();
}