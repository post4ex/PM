/**
 * docs-gen.js
 * The "Brain" of the Document Center.
 * Handles form schemas, validation logic, and dynamic rendering for docs.html.
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
// SECTION 0.5: FIELD MAPPINGS (SOURCE DATA -> DOC FIELDS)
// ============================================================================
// Maps document schema keys (left) to potential source data keys (right).
// Used when "Importing from Shipment" to pre-fill data.
const FIELD_MAPPINGS = {
    // --- Common Fields (Mutual) ---
    '_COMMON': {
        'invoice_no':       ['REFERANCE', 'INVOICE_NO', 'REF_NO'],
        'invoice_date':     ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'awb_number':       ['AWB_NUMBER', 'AWB', 'TRACKING_NO'],
        'exporter_details': ['CONSIGNOR_NAME', 'CONSIGNOR_ADDRESS', 'CONSIGNOR_FULL'], 
        'consignee_details':['CONSIGNEE_NAME', 'CONSIGNEE_ADDRESS', 'CONSIGNEE_FULL'],
        'country_dest':     ['DESTINATION_COUNTRY', 'COUNTRY'],
        'place_supply':     ['DESTINATION_STATE', 'STATE'],
        'gstin':            ['GSTIN', 'GST_NO']
    },

    // --- Specific Document Mappings (Overrides _COMMON) ---
    'KYC': {
        'entity_type':      ['ENTITY_TYPE', 'CATEGORY'],
        'entity_name':      ['CONSIGNOR_NAME', 'NAME', 'CLIENT_NAME'],
        'permanent_address':['CONSIGNOR_ADDRESS', 'ADDRESS', 'REGISTERED_ADDRESS'],
        'business_address': ['CONSIGNOR_ADDRESS', 'ADDRESS', 'BUSINESS_ADDRESS'],
        'auth_signatories': ['AUTH_SIGNATORIES', 'CONTACT_PERSON'],
        'iec_no':           ['IEC', 'IEC_CODE', 'IEC_NO'],
        'pan':              ['PAN', 'PAN_NO', 'PAN_NUMBER'],
        'authorized_signatory_name': ['CONTACT_PERSON', 'AUTH_NAME'],
        'authorized_signatory_designation': ['DESIGNATION', 'AUTH_ROLE'],
        'declaration_place':['CONSIGNOR_CITY', 'CITY', 'BRANCH'],
        'declaration_date': ['ORDER_DATE', 'DATE']
    },
    
    'COM_INV': {
        'iec':              ['IEC', 'IEC_CODE'],
        'country_origin':   ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'terms':            ['INCOTERMS', 'TERMS'],
        'buyer_order':      ['REFERANCE', 'PO_NUMBER']
    },

    'PKL': {
        'total_pkgs':       ['PIECS', 'TOTAL_BOXES', 'NO_OF_PKGS'],
        'net_wt':           ['WEIGHT', 'NET_WEIGHT'],
        'gross_wt':         ['GROSS_WEIGHT', 'VOL_WEIGHT']
    }
};

// ============================================================================
// SECTION 1: DOCUMENT SCHEMAS (CONFIGURATION)
// ============================================================================
const DOC_SCHEMAS = {
    // --- Category 1: Core Documents ---
    'DOM_INV': {
        id: 'DOM_INV',
        title: 'Domestic Invoice / Challan',
        desc: 'Issued for domestic sales to comply with GST regulations, transfer ownership, and serve as a formal request for payment within the country. It acts as the primary proof of sale for local tax authorities.',
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
        desc: 'The primary document used by foreign customs for valuation, classification, and duty assessment. It acts as the legal bill of sale between buyer and seller, detailing the price, value, and quantity of goods sold.',
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
        desc: 'Required by customs and carriers to identify specific contents, weights, and dimensions of each package. It ensures safety during handling and allows officials to reconcile the cargo against the Commercial Invoice.',
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
        desc: 'Mandatory verification document for Indian Customs to establish the identity and address of the exporter/importer. It is required to prevent fraud, ensure regulatory compliance, and link the IEC/PAN to the shipment.',
        fields: [
            { key: 'entity_type', label: 'Category / Entity Type', type: 'select', options: ['Individual/Proprietary firm', 'Company', 'Trusts/Foundations', 'Partnership firm'], required: true, width: 'w-full' },
            { key: 'entity_name', label: 'Entity Name (and partners, if applicable)', type: 'text', required: true, width: 'w-full' },
            { key: 'permanent_address', label: 'Permanent / Registered Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'business_address', label: 'Principal Business Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'auth_signatories', label: 'Authorized Signatories (Names)', type: 'textarea', required: true, width: 'w-full', placeholder: 'e.g., 1. Mr. Rajesh Sharma\n2. Ms. Priya Patel' },
            { key: 'iec_no', label: 'IEC Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'pan', label: 'PAN Number', type: 'text', required: true, width: 'w-1/2' },

            { type: 'heading', label: 'Declaration & Signature Details' },

            { key: 'declaration_text', label: 'Declaration', type: 'textarea', value: 'I/We hereby declare that the particulars given herein above are true, correct and complete to the best of my/our knowledge and belief, the documents submitted in support of this Form KYC are genuine and obtained legally from the respective issuing authority. In case of any change in any of the aforementioned particulars, I/we undertake to notify you in writing failing which the above particulars may be relied upon including all shipments/documents executed and tendered by the individual so authorized and mentioned in 6 above. I/we hereby authorize you to submit the above particulars to the customs and other regulatory authorities on my/our behalf as may be required in order to transport and customs clear my/our shipments.', width: 'w-full', required: true },

            { key: 'authorized_signatory_name', label: 'Signing Authority Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'authorized_signatory_designation', label: 'Signing Authority Designation', type: 'text', required: true, width: 'w-1/2' },
            { key: 'declaration_place', label: 'Place of Declaration', type: 'text', required: true, width: 'w-1/2' },
            { key: 'declaration_date', label: 'Date of Declaration', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'SLI': {
        id: 'SLI',
        title: 'Shippers Letter of Instructions',
        desc: 'Formal instructions from the exporter to the freight forwarder detailing shipment handling, routing, and documentation requirements. It ensures the Forwarder issues the Air Waybill or Bill of Lading correctly.',
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
        desc: 'Acts as a receipt for cargo, a contract of carriage between shipper and carrier, and (in the case of a B/L) a document of title required to claim possession of the goods at the destination.',
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
        desc: 'Provides proof that the shipment is insured against loss or damage during transit. It is often required by the buyer under specific Incoterms (like CIF) or by banks for Letter of Credit compliance.',
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
        desc: 'Legally authorizes a Customs House Agent (CHA) to act on behalf of the exporter/importer. It allows the agent to file documents and clear shipments with Customs authorities.',
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
        desc: 'Used to claim rebates on excise duty or remove goods for export without payment of duty (under bond/LUT). It serves as official proof of export for Central Excise authorities.',
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
        desc: 'Statutory Declaration Form required by RBI/FEMA to declare the full export value and guarantee that foreign exchange will be repatriated to India within the stipulated time frame.',
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
        desc: 'Certifies the country where the goods were manufactured. It is used by importing customs to determine duty rates, apply preferential tariffs under trade agreements, or enforce embargoes.',
        fields: [
            { key: 'exporter_details', label: 'Exporter Details', type: 'textarea', required: true, width: 'w-full' }, // Already standard
            { key: 'consignee_details', label: 'Consignee Details', type: 'textarea', required: true, width: 'w-full' }, // Already standard
            { key: 'country_of_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', width: 'w-1/2' },
            { key: 'transport_details', label: 'Transport Details', type: 'text', width: 'w-1/2' },
            { key: 'marks_and_numbers', label: 'Marks and Numbers on Packages', type: 'text', width: 'w-full' }
        ]
    },
    'NON_DG': {
        id: 'NON_DG',
        title: 'Non-DG Declaration',
        desc: 'A mandatory declaration for air freight certifying that the shipment contains no dangerous goods (explosives, flammables, etc.) restricted by IATA regulations, ensuring flight safety.',
        fields: [
            { key: 'awb_number', label: 'AWB Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'destination', label: 'Destination', type: 'text', required: true, width: 'w-1/2' },
            { key: 'description', label: 'Description of Goods', type: 'textarea', required: true, width: 'w-full' },
            { key: 'declaration_text', label: 'Declaration', type: 'textarea', value: 'I hereby declare that the contents of this consignment are fully and accurately described above by the proper shipping name, and are classified, packaged, marked and labeled/placarded, and are in all respects in proper condition for transport according to applicable international and national governmental regulations.', width: 'w-full', required: true }
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

let isPreviewOpen = false;

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
            let fieldWrapper;

            if (field.type === 'heading') {
                fieldWrapper = `
                    <div class="w-full px-2 mt-4">
                        <h3 class="text-md font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-2">${field.label}</h3>
                    </div>
                `;
            } else {
                if (field.type === 'select') {
                    const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                    inputHtml = `<select name="${field.key}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">${options}</select>`;
                } else if (field.type === 'textarea') {
                    inputHtml = `<textarea name="${field.key}" rows="4" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">${field.value || ''}</textarea>`;
                } else {
                    inputHtml = `<input type="${field.type}" name="${field.key}" value="${field.value || ''}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">`;
                }

                fieldWrapper = `
                    <div class="${widthClass} px-2">
                        <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">${field.label} ${requiredMark}</label>
                        ${inputHtml}
                    </div>
                `;
            }
            formHtml += fieldWrapper;
        });

        formHtml += `</form>`;
    } else {
        formHtml = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
                <i class="fa-solid fa-person-digging text-4xl mb-3"></i>
                <p>Template configuration for <strong>${schema.title}</strong> is under development.</p>
            </div>
        `;
    }

    // Common Header with Toolbar
    const headerHtml = `
        <div class="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
            <div class="flex items-center gap-3">
                <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <i class="fa-solid fa-file-contract text-xl"></i>
                </div>
                <div>
                    <h1 class="text-xl font-bold text-gray-900 leading-tight">${schema.title}</h1>
                    <p class="text-xs text-gray-500 font-mono">${schema.id}</p>
                </div>
            </div>
            
            <div class="flex flex-wrap justify-center items-center gap-3">
                <button onclick="document.getElementById('doc-form').reset()" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-sm transition-colors">
                    Reset
                </button>
                <button onclick="handleGenerate('${schema.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold shadow-sm transition-all transform active:scale-95 flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Document
                </button>
                <div class="flex flex-wrap justify-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button onclick="togglePreview()" class="p-2 text-gray-600 hover:text-blue-700 hover:bg-white rounded-md transition-all shadow-sm" title="Toggle Live Preview">
                    <i id="preview-toggle-icon" class="fa-regular ${isPreviewOpen ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <div class="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                <button onclick="handleDownloadPDF('${schema.id}')" class="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-sm" title="Download PDF">
                    <i class="fa-regular fa-file-pdf"></i>
                </button>
                <button onclick="handleDownloadDOCX('${schema.id}')" class="p-2 text-gray-600 hover:text-blue-800 hover:bg-white rounded-md transition-all shadow-sm" title="Download DOCX">
                    <i class="fa-regular fa-file-word"></i>
                </button>
                <button onclick="showDocInfo('${schema.title.replace(/'/g, "\\'")}', '${schema.desc.replace(/'/g, "\\'")}')" class="p-2 text-gray-600 hover:text-yellow-600 hover:bg-white rounded-md transition-all shadow-sm" title="Info">
                    <i class="fa-solid fa-circle-info"></i>
                </button>
                <button onclick="saveLocalDraft('${schema.id}')" class="p-2 text-gray-600 hover:text-green-600 hover:bg-white rounded-md transition-all shadow-sm" title="Save Local">
                    <i class="fa-solid fa-floppy-disk"></i>
                </button>
                <button onclick="saveCloudDraft('${schema.id}')" class="p-2 text-gray-600 hover:text-purple-600 hover:bg-white rounded-md transition-all shadow-sm" title="Save Cloud">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                </button>
                <div class="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                <button onclick="renderDecisionGuide()" class="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-sm" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    `;

    const formColClass = isPreviewOpen ? 'lg:col-span-2' : 'lg:col-span-3';
    const previewColClass = isPreviewOpen ? 'lg:col-span-1 space-y-6' : 'hidden lg:col-span-1 space-y-6';

    // Inject HTML
    contentArea.innerHTML = `
        <div class="max-w-5xl mx-auto animate-fade-in">
            ${headerHtml}
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left: Input Form -->
                <div id="doc-form-container" class="${formColClass} bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between mb-4 border-b pb-2">
                        <h2 class="text-lg font-semibold text-gray-800">Document Details</h2>
                        <span class="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">ID: ${schema.id}</span>
                    </div>
                    ${formHtml}
                </div>

                <!-- Right: Preview / Actions -->
                <div id="doc-preview-container" class="${previewColClass}">
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
                            <button onclick="loadLocalDraft('${schema.id}')" class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex items-center">
                                <i class="fa-solid fa-clock-rotate-left w-6"></i> Load Last Draft
                            </button>
                            <button onclick="handleImportData('${schema.id}')" class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex items-center">
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
 * Toggles the visibility of the live preview column.
 */
function togglePreview() {
    isPreviewOpen = !isPreviewOpen;
    const formContainer = document.getElementById('doc-form-container');
    const previewContainer = document.getElementById('doc-preview-container');
    const icon = document.getElementById('preview-toggle-icon');

    if (isPreviewOpen) {
        formContainer.classList.remove('lg:col-span-3');
        formContainer.classList.add('lg:col-span-2');
        previewContainer.classList.remove('hidden');
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    } else {
        formContainer.classList.remove('lg:col-span-2');
        formContainer.classList.add('lg:col-span-3');
        previewContainer.classList.add('hidden');
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    }
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

    // Simulate processing delay then generate
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        // Generate Print View
        generatePrintView(docId, data);
        
        // Update Preview Area
        const previewBox = document.getElementById('mini-preview');
        previewBox.innerHTML = `
            <div class="text-center p-4">
                <i class="fa-solid fa-check-circle text-green-500 text-4xl mb-2"></i>
                <p class="font-bold text-gray-800">Generated Successfully!</p>
                <p class="text-xs text-gray-500 mb-3">Document opened in new tab.</p>
                <button onclick='generatePrintView("${docId}", ${JSON.stringify(data)})' class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded font-semibold transition-colors">
                    <i class="fa-solid fa-print mr-1"></i> Re-print
                </button>
            </div>
        `;
        
        // Use global notification if available (from layout.js)
        if (window.showNotification) {
            window.showNotification(`${docId} generated successfully!`, 'success');
        }
    }, 800);
}

/**
 * Generates and downloads a PDF of the document using jsPDF and html2canvas.
 * @param {string} docId
 */
async function handleDownloadPDF(docId) {
    const { jsPDF } = window.jspdf;
    const schema = DOC_SCHEMAS[docId];
    const form = document.getElementById('doc-form');
    if (!schema || !form || !window.html2canvas || !window.jspdf) {
        alert('Required libraries (jsPDF, html2canvas) not found.');
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (window.showNotification) window.showNotification('Generating PDF...', 'info');

    // Create a temporary, off-screen element to render the printable content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px'; // Standard A4-ish width for rendering

    const formatValue = (key, val) => {
        if (!val) return '-';
        const fieldDef = schema.fields.find(f => f.key === key);
        if (fieldDef && fieldDef.type === 'date') {
            const date = new Date(val);
            return isNaN(date.getTime()) ? val : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return String(val).replace(/\n/g, '<br>');
    };

    const rows = schema.fields.map(field => `
        <tr>
            <td class="label">${field.label}</td>
            <td class="value">${formatValue(field.key, data[field.key] || field.value || '')}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div id="pdf-content" style="background: white; padding: 40px;">
            <style>
                #pdf-content { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0; text-transform: uppercase; font-size: 24px; letter-spacing: 1px; }
                .header p { margin: 5px 0 0; color: #666; font-style: italic; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #eee; }
                td { padding: 12px 15px; border-bottom: 1px solid #eee; vertical-align: top; }
                td.label { width: 35%; font-weight: 600; color: #555; background: #f9fafb; border-right: 1px solid #eee; }
                td.value { width: 65%; word-break: break-word; }
                tr:last-child td { border-bottom: none; }
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
            <div class="header">
                <h1>${schema.title}</h1>
                <p>${schema.desc}</p>
            </div>
            <table><tbody>${rows}</tbody></table>
            <div class="footer">
                Generated via Document Center • ${new Date().toLocaleString('en-IN')}
            </div>
        </div>
    `;
    document.body.appendChild(container);

    try {
        const content = document.getElementById('pdf-content');
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, imgHeight);
        pdf.save(`${docId}_${Date.now()}.pdf`);

        if (window.showNotification) window.showNotification('PDF downloaded!', 'success');
    } catch (error) {
        console.error("PDF Generation Error:", error);
        if (window.showNotification) window.showNotification('Failed to generate PDF.', 'error');
    } finally {
        document.body.removeChild(container);
    }
}

/**
 * Generates and downloads a DOCX file of the document using docx.
 * @param {string} docId
 */
function handleDownloadDOCX(docId) {
    const schema = DOC_SCHEMAS[docId];
    const form = document.getElementById('doc-form');
    if (!schema || !form || !window.docx) {
        alert('Required library (docx) not found.');
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (window.showNotification) window.showNotification('Generating DOCX...', 'info');

    try {
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType } = docx;

        const tableRows = schema.fields.map(field => {
            const value = data[field.key] || field.value || '';
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: field.label, bold: true })] })],
                        width: { size: 35, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                        children: [new Paragraph(String(value))],
                        width: { size: 65, type: WidthType.PERCENTAGE },
                    }),
                ],
            });
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: schema.title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: schema.desc, alignment: AlignmentType.CENTER, style: "Quote" }),
                    new Paragraph(" "), // Spacer
                    new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            if (window.saveAs) {
                window.saveAs(blob, `${docId}_${Date.now()}.docx`);
            } else { // Fallback for browsers that don't support FileSaver.js
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${docId}_${Date.now()}.docx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
            if (window.showNotification) window.showNotification('DOCX downloaded!', 'success');
        });

    } catch (error) {
        console.error("DOCX Generation Error:", error);
        if (window.showNotification) window.showNotification('Failed to generate DOCX.', 'error');
    }
}

/**
 * Displays document information using the global notification modal if available.
 * @param {string} title 
 * @param {string} desc 
 */
function showDocInfo(title, desc) {
    if (typeof openNotificationModal === 'function') {
        openNotificationModal(desc, 'info');
        // Override the default title "Information" with the specific Doc Title
        const titleEl = document.getElementById('notif-modal-title');
        if (titleEl) titleEl.textContent = title;
    } else {
        alert(desc);
    }
}

/**
 * Generates a generic print view for any document schema.
 * @param {string} docId 
 * @param {object} data 
 */
function generatePrintView(docId, data) {
    // Special handling for KYC Form to match specific design
    if (docId === 'KYC') {
        generateKYCPrintView(data);
        return;
    }

    const schema = DOC_SCHEMAS[docId];
    if (!schema) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const formatValue = (key, val) => {
        if (!val) return '-';
        const fieldDef = schema.fields.find(f => f.key === key);
        if (fieldDef && fieldDef.type === 'date') {
            const date = new Date(val);
            return isNaN(date.getTime()) ? val : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return val.replace(/\n/g, '<br>');
    };

    const rows = schema.fields.map(field => `
        <tr>
            <td class="label">${field.label}</td>
            <td class="value">${formatValue(field.key, data[field.key])}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${schema.title}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .header h1 { margin: 0; text-transform: uppercase; font-size: 24px; letter-spacing: 1px; }
                .header p { margin: 5px 0 0; color: #666; font-style: italic; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #eee; }
                td { padding: 12px 15px; border-bottom: 1px solid #eee; vertical-align: top; }
                td.label { width: 35%; font-weight: 600; color: #555; background: #f9fafb; border-right: 1px solid #eee; }
                td.value { width: 65%; }
                tr:last-child td { border-bottom: none; }
                
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
                
                @media print {
                    body { padding: 0; max-width: 100%; }
                    .no-print { display: none; }
                    table { border: 1px solid #ccc; }
                    td { border-bottom: 1px solid #ccc; }
                    td.label { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
                }
                
                .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; }
                .btn:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${schema.title}</h1>
                <p>${schema.desc}</p>
            </div>

            <table>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="footer">
                Generated via Document Center • ${new Date().toLocaleString('en-IN')}
            </div>

            <div class="no-print" style="text-align: center; margin-top: 40px;">
                <button onclick="window.print()" class="btn">Print Document</button>
                <button onclick="window.close()" class="btn" style="background: #6b7280; margin-left: 10px;">Close</button>
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

/**
 * Saves the current form data to localStorage.
 */
function saveLocalDraft(docId) {
    const form = document.getElementById('doc-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    localStorage.setItem('draft_' + docId, JSON.stringify(data));
    
    if (window.showNotification) {
        window.showNotification('Draft saved locally!', 'success');
    } else {
        alert('Draft saved locally!');
    }
}

/**
 * Loads the draft from localStorage.
 */
function loadLocalDraft(docId) {
    const draft = localStorage.getItem('draft_' + docId);
    if (!draft) {
        if (window.showNotification) window.showNotification('No draft found.', 'error');
        else alert('No draft found.');
        return;
    }
    
    const data = JSON.parse(draft);
    const form = document.getElementById('doc-form');
    if (!form) return;
    
    Object.keys(data).forEach(key => {
        const field = form.elements[key];
        if (field) field.value = data[key];
    });
    
    if (window.showNotification) window.showNotification('Draft loaded!', 'success');
}

/**
 * Placeholder for Cloud Save.
 */
function saveCloudDraft(docId) {
    if (window.showNotification) {
        window.showNotification('Cloud save feature coming soon!', 'info');
    } else {
        alert('Cloud save feature coming soon!');
    }
}

/**
 * Imports data from a shipment into the form using FIELD_MAPPINGS.
 * @param {string} docId 
 */
function handleImportData(docId) {
    const ref = prompt("Enter Shipment Reference / AWB to import:");
    if (!ref) return;

    // Try to find in local appData (assuming layout.js has loaded it)
    const appDataStr = localStorage.getItem('appData');
    if (!appDataStr) {
        alert("No local data found. Please sync first.");
        return;
    }
    
    const appData = JSON.parse(appDataStr);
    const orders = appData.SHIPMENTS?.ORDERS || {};
    
    // Find order (simple search)
    let order = null;
    if (orders[ref]) order = orders[ref];
    else {
        order = Object.values(orders).find(o => o.REFERANCE === ref || o.AWB_NUMBER === ref);
    }

    if (!order) {
        alert("Shipment not found.");
        return;
    }

    // Map Data
    const mapping = FIELD_MAPPINGS[docId] || {};
    const commonMapping = FIELD_MAPPINGS['_COMMON'] || {};
    const schema = DOC_SCHEMAS[docId];
    const form = document.getElementById('doc-form');

    if (!schema || !form) return;

    // Helper to get value from order based on keys array
    const getValue = (keys) => {
        if (!Array.isArray(keys)) keys = [keys];
        for (const k of keys) {
            if (order[k]) return order[k];
        }
        return null;
    };

    // Iterate schema fields and populate
    schema.fields.forEach(field => {
        const fieldKey = field.key;
        // Check specific mapping first, then common
        let sourceKeys = mapping[fieldKey] || commonMapping[fieldKey];
        
        if (sourceKeys) {
            const val = getValue(sourceKeys);
            if (val) {
                const input = form.elements[fieldKey];
                if (input) input.value = val;
            }
        }
    });

    if (window.showNotification) window.showNotification("Data imported successfully!", "success");
}

/**
 * Initializes the Document Center page.
 */
function initDocCenter() {
    renderDecisionGuide();
}

// Initialize
document.addEventListener('DOMContentLoaded', initDocCenter);