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
        'reference_id':     ['REFERANCE', 'REFERENCE'],
        'invoice_no':       ['REFERANCE', 'INVOICE_NO', 'REF_NO', 'DOC_NUMBER'],
        'invoice_date':     ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'awb_number':       ['AWB_NUMBER', 'AWB', 'TRACKING_NO'],
        'exporter_details': ['CONSIGNOR_NAME', 'CONSIGNOR_ADDRESS', 'CONSIGNOR_FULL'], 
        'consignee_details':['CONSIGNEE_NAME', 'CONSIGNEE_ADDRESS', 'CONSIGNEE_FULL'],
        'country_dest':     ['DESTINATION_COUNTRY', 'COUNTRY'],
        'place_supply':     ['DESTINATION_STATE', 'STATE'],
        'gstin':            ['GSTIN', 'GST_NO', 'ID_GST_PAN_ADHAR'],
        'description_of_goods': ['PRODUCT'],
        // Additional common fields found across multiple documents
        'exporter_name':    ['CONSIGNOR_NAME', 'EXPORTER_NAME', 'COMPANY_NAME'],
        'exporter_address': ['CONSIGNOR_ADDRESS', 'EXPORTER_ADDRESS', 'COMPANY_ADDRESS'],
        'consignee_name':   ['CONSIGNEE_NAME'],
        'consignee_address':['CONSIGNEE_ADDRESS'],
        'shipping_bill_no': ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'declaration_date': ['ORDER_DATE', 'DATE'],
        'signatory_name':   ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_title':  ['DESIGNATION', 'AUTH_ROLE'],
        'company_name':     ['CONSIGNOR_NAME', 'B2B_NAME'],
        'company_address':  ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'iec_number':       ['IEC', 'IEC_CODE'],
        'pan':              ['PAN', 'PAN_NO', 'PAN_NUMBER'],
        'country_origin':   ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'marks_numbers':    ['MARKS', 'BOX_NO'],
        'goods_description': ['PRODUCT', 'CONTENT', 'DESC'],
        'vessel_flight_no': ['FLIGHT_NO', 'VEHICLE_NO'],
        'port_loading':     ['ORIGIN_CITY', 'ORIGIN', 'FROM_CITY'],
        'port_discharge':   ['DESTINATION_CITY', 'DESTINATION', 'TO_CITY'],
        'certificate_date': ['ORDER_DATE', 'DATE'],
        'authorized_signatory': ['CONTACT_PERSON', 'AUTH_NAME']
    },

    // --- Specific Document Mappings (Overrides _COMMON) ---
    'KYC': {
        'entity_type':      ['ENTITY_TYPE', 'CATEGORY', 'B2B_TYPE'],
        'entity_name':      ['CONSIGNOR_NAME', 'NAME', 'CLIENT_NAME', 'B2B_NAME'],
        'permanent_address':['CONSIGNOR_ADDRESS', 'ADDRESS', 'REGISTERED_ADDRESS', 'B2B_ADDRESS'],
        'business_address': ['CONSIGNOR_ADDRESS', 'ADDRESS', 'BUSINESS_ADDRESS', 'B2B_ADDRESS'],
        'auth_signatories': ['AUTH_SIGNATORIES', 'CONTACT_PERSON'],
        'iec_no':           ['IEC', 'IEC_CODE', 'IEC_NO'],
        'authorized_signatory_name': ['CONTACT_PERSON', 'AUTH_NAME'],
        'authorized_signatory_designation': ['DESIGNATION', 'AUTH_ROLE'],
        'declaration_place':['CONSIGNOR_CITY', 'CITY', 'BRANCH', 'B2B_CITY']
    },
    
    'COM_INV': {
        'iec':              ['IEC', 'IEC_CODE'],
        'terms':            ['INCOTERMS', 'TERMS'],
        'buyer_order':      ['REFERANCE', 'PO_NUMBER']
    },

    'PKL': {
        'total_pkgs':       ['PIECS', 'TOTAL_BOXES', 'NO_OF_PKGS', 'BOX_NUM'],
        'net_wt':           ['WEIGHT', 'NET_WEIGHT'],
        'gross_wt':         ['GROSS_WEIGHT', 'VOL_WEIGHT', 'CHG_WT']
    },

    'SLI': {
        'forwarder_name':   ['FORWARDER', 'CARRIER', 'VENDOR'],
        'special_instructions': ['REMARKS', 'INSTRUCTIONS', 'NOTE'],
        'shipper_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'consignee_name':   ['CONSIGNEE_NAME'],
        'invoice_no':       ['REFERANCE', 'INVOICE_NO', 'REF_NO'],
        'e_code':           ['E_CODE', 'IEC'],
        'bank_ad_code':     ['BANK_AD_CODE', 'AD_CODE'],
        'currency':         ['CURRENCY'],
        'incoterms':        ['INCOTERMS', 'TERMS'],
        'payment_terms':    ['PAYMENT_TERMS'],
        'invoice_value':    ['DECLARED_VALUE', 'VALUE', 'AMOUNT'],
        'freight':          ['FREIGHT'],
        'insurance':        ['INSURANCE'],
        'no_of_pkgs':       ['PIECS', 'TOTAL_BOXES', 'NO_OF_PKGS'],
        'net_weight':       ['WEIGHT', 'NET_WEIGHT'],
        'gross_weight':     ['GROSS_WEIGHT', 'CHG_WT'],
        'volume_weight':    ['VOL_WEIGHT']
    },
    'BL_AWB': {
        'carrier_name':     ['CARRIER', 'TRANSPORTER'],
        'port_of_loading':  ['ORIGIN_CITY', 'ORIGIN', 'FROM_CITY'],
        'port_of_discharge':['DESTINATION_CITY', 'DESTINATION', 'TO_CITY'],
        'vessel_flight_no': ['FLIGHT_NO', 'VEHICLE_NO']
    },
    'SDF': {
        'shipping_bill_no': ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'bank_name':        ['BANK_NAME', 'BANK'],
        'repatriation_date': ['REPATRIATION_DATE'],
        'exporter_name':    ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'currency':         ['CURRENCY'],
        'amount':           ['DECLARED_VALUE', 'VALUE', 'AMOUNT', 'COD', 'TOPAY']
    },
    'ANN_1': {
        'goods_description': ['PRODUCT', 'CONTENT', 'DESC'],
        'invoice_no':        ['REFERANCE', 'INVOICE_NO', 'REF_NO'],
        'invoice_date':      ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'exporter_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'exporter_address':  ['CONSIGNOR_ADDRESS', 'EXPORTER_ADDRESS']
    },
    'ANN_2': {
        'goods_description': ['PRODUCT', 'CONTENT', 'DESC'],
        'invoice_no':        ['REFERANCE', 'INVOICE_NO', 'REF_NO'],
        'invoice_date':      ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'manufacturer_name': ['MANUFACTURER_NAME', 'VENDOR'],
        'manufacturer_address': ['MANUFACTURER_ADDRESS'],
        'exporter_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME']
    },
    'APP_3': {
        'shipping_bill_no':  ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'exporter_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'declaration_date':  ['ORDER_DATE', 'DATE'],
        'excise_procedure': ['EXCISE_PROCEDURE'],
        'deec_status': ['DEEC_STATUS']
    },
    'APP_4': {
        'shipping_bill_no':  ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'exporter_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'exporter_address':  ['CONSIGNOR_ADDRESS', 'EXPORTER_ADDRESS'],
        'superintendent_name': ['SUPERINTENDENT_NAME'],
        'excise_range': ['EXCISE_RANGE']
    },
    'APP_2': {
        'shipping_bill_no':  ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'exporter_name':     ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'excise_procedure': ['EXCISE_PROCEDURE'],
        'export_type': ['EXPORT_TYPE']
    },
    'ANN_C1': {
        'shipping_bill_no':  ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'eou_name':          ['CONSIGNOR_NAME', 'EOU_NAME'],
        'iec_no':            ['IEC', 'IEC_CODE'],
        'factory_address':   ['CONSIGNOR_ADDRESS', 'FACTORY_ADDRESS'],
        'invoice_no':        ['REFERANCE', 'INVOICE_NO'],
        'consignee_name':    ['CONSIGNEE_NAME'],
        'range': ['RANGE'],
        'division': ['DIVISION'],
        'commissionerate': ['COMMISSIONERATE'],
        'certificate_no': ['CERTIFICATE_NO'],
        'examination_date': ['EXAMINATION_DATE'],
        'examining_officer': ['EXAMINING_OFFICER'],
        'supervising_officer': ['SUPERVISING_OFFICER'],
        'location_code': ['LOCATION_CODE'],
        'total_packages': ['TOTAL_PACKAGES'],
        'goods_description_correct': ['GOODS_DESCRIPTION_CORRECT'],
        'sample_drawn': ['SAMPLE_DRAWN'],
        'seal_details': ['SEAL_DETAILS'],
        'container_details': ['CONTAINER_DETAILS']
    },
    'SCD': {
        'declarant_name':    ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'country_origin':    ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'marks_numbers':     ['MARKS', 'BOX_NO'],
        'description_goods': ['PRODUCT', 'CONTENT', 'DESC'],
        'exportation_date':  ['ORDER_DATE', 'DATE'],
        'signatory_name':    ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_title':   ['DESIGNATION', 'AUTH_ROLE'],
        'company_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'company_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'made_in_country':   ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN']
    },
    'MCD': {
        'declarant_name':    ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'country_a':         ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'signatory_name':    ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_title':   ['DESIGNATION', 'AUTH_ROLE'],
        'company_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'company_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'country_b': ['COUNTRY_B'],
        'country_c': ['COUNTRY_C'],
        'country_d': ['COUNTRY_D']
    },
    'NEG_DEC': {
        'declarant_name':    ['CONSIGNOR_NAME', 'EXPORTER_NAME'],
        'marks_numbers':     ['MARKS', 'BOX_NO'],
        'description_goods': ['PRODUCT', 'CONTENT', 'DESC'],
        'country_origin':    ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'signatory_name':    ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_title':   ['DESIGNATION', 'AUTH_ROLE'],
        'company_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'company_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS']
    },
    'QUOTA': {
        'company_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'invoice_no':        ['REFERANCE', 'INVOICE_NO', 'REF_NO'],
        'invoice_date':      ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'quota_amount':      ['QUOTA_CHARGE', 'QUOTA_FEE'],
        'paid_by':           ['CONSIGNOR_NAME', 'B2B_NAME'],
        'paid_to':           ['QUOTA_AUTHORITY', 'ISSUING_AUTHORITY'],
        'signatory_title':   ['DESIGNATION', 'AUTH_ROLE'],
        'company_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'quota_included': ['QUOTA_INCLUDED'],
        'statement_date': ['STATEMENT_DATE']
    },
    'TSCA': {
        'company_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'company_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'authorized_name':   ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_title':   ['DESIGNATION', 'AUTH_ROLE'],
        'awb_number':        ['AWB_NUMBER', 'AWB'],
        'certification_type': ['CERTIFICATION_TYPE']
    },
    'GR_SAMPLE': {
        'shipper_name':      ['CONSIGNOR_NAME', 'B2B_NAME'],
        'shipper_address':   ['CONSIGNOR_ADDRESS', 'B2B_ADDRESS'],
        'consignee_name':    ['CONSIGNEE_NAME'],
        'consignee_address': ['CONSIGNEE_ADDRESS'],
        'invoice_no':        ['REFERANCE', 'INVOICE_NO'],
        'invoice_date':      ['ORDER_DATE', 'DATE'],
        'description':       ['PRODUCT', 'CONTENT', 'DESC'],
        'bank_name': ['BANK_NAME'],
        'bank_address': ['BANK_ADDRESS'],
        'customs_authority': ['CUSTOMS_AUTHORITY'],
        'invoice_value': ['INVOICE_VALUE'],
        'bank_signatory': ['BANK_SIGNATORY'],
        'bank_designation': ['BANK_DESIGNATION']
    },
    'GR_REPAIR': {
        'company_name': ['COMPANY_NAME', 'CONSIGNOR_NAME'],
        'company_address': ['COMPANY_ADDRESS', 'CONSIGNOR_ADDRESS'],
        'bank_name': ['BANK_NAME'],
        'bank_address': ['BANK_ADDRESS'],
        'invoice_no': ['INVOICE_NUMBER', 'INVOICE_NO'],
        'invoice_date': ['INVOICE_DATE'],
        'invoice_value': ['INVOICE_VALUE', 'TOTAL_VALUE'],
        'awb_no': ['AWB_NUMBER', 'AWB_NO'],
        'awb_date': ['AWB_DATE'],
        'consignee_name': ['CONSIGNEE_NAME'],
        'consignee_address': ['CONSIGNEE_ADDRESS'],
        'destination_country': ['DESTINATION_COUNTRY', 'COUNTRY'],
        'goods_description': ['PRODUCT_DESCRIPTION', 'DESCRIPTION'],
        'return_reason': ['RETURN_REASON'],
        'certificate_date': ['CERTIFICATE_DATE'],
        'authorized_signatory': ['AUTHORIZED_SIGNATORY'],
        'customs_authority': ['CUSTOMS_AUTHORITY'],
        'bank_signatory': ['BANK_SIGNATORY'],
        'bank_designation': ['BANK_DESIGNATION']
    },
    // MSDS Document
    'MSDS': {
        'commodity_name': ['PRODUCT_DESCRIPTION', 'DESCRIPTION'],
        'shipping_name': ['PROPER_SHIPPING_NAME'],
        'preparation': ['PREPARATION_TYPE'],
        'manufacturer_name': ['MANUFACTURER_NAME', 'COMPANY_NAME'],
        'manufacturer_address': ['MANUFACTURER_ADDRESS', 'COMPANY_ADDRESS'],
        'emergency_tel': ['EMERGENCY_PHONE'],
        'chemical_name': ['CHEMICAL_NAME'],
        'chemical_formula': ['CHEMICAL_FORMULA'],
        'cas_number': ['CAS_NUMBER'],
        'index_number': ['INDEX_NUMBER'],
        'hazard_symbol': ['HAZARD_SYMBOL'],
        'risk_phrases': ['RISK_PHRASES'],
        'un_number': ['UN_NUMBER'],
        'physical_form': ['PHYSICAL_FORM'],
        'colour': ['COLOUR'],
        'odour': ['ODOUR'],
        'melting_point': ['MELTING_POINT'],
        'density': ['DENSITY'],
        'vapour_pressure': ['VAPOUR_PRESSURE'],
        'viscosity': ['VISCOSITY'],
        'water_solubility': ['WATER_SOLUBILITY'],
        'ph_value': ['PH_VALUE'],
        'flash_point': ['FLASH_POINT'],
        'ignition_temp': ['IGNITION_TEMPERATURE'],
        'explosive_limits': ['EXPLOSIVE_LIMITS'],
        'oral_toxicity': ['ORAL_TOXICITY_LD50'],
        'dermal_toxicity': ['DERMAL_TOXICITY_LD50'],
        'inhalation_toxicity': ['INHALATION_TOXICITY_LC50'],
        'transport_class': ['TRANSPORT_CLASS'],
        'packing_group': ['PACKING_GROUP']
    },
    // Domestic Tax Invoice
    'TAX_CHALLAN': {
        'challan_no': ['REFERANCE', 'INVOICE_NO', 'DOC_NUMBER'],
        'challan_date': ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'po_number': ['PO_NUMBER', 'BUYER_ORDER'],
        'po_date': ['PO_DATE'],
        'eway_bill': ['EWAY_BILL_NO'],
        'supplier_name': ['CONSIGNOR_NAME', 'COMPANY_NAME'],
        'supplier_address': ['CONSIGNOR_ADDRESS', 'COMPANY_ADDRESS'],
        'supplier_gstin': ['GSTIN', 'GST_NO'],
        'receiver_name': ['CONSIGNEE_NAME'],
        'receiver_address': ['CONSIGNEE_ADDRESS'],
        'receiver_gstin': ['RECEIVER_GSTIN'],
        'transport_mode': ['MODE', 'TRANSPORT_MODE'],
        'vehicle_no': ['VEHICLE_NO', 'FLIGHT_NO'],
        'transporter': ['CARRIER', 'TRANSPORTER'],
        'lr_no': ['LR_NO', 'AWB_NUMBER'],
        'dispatch_date': ['DISPATCH_DATE', 'ORDER_DATE']
    },
    // Letter of Authority
    'LOA': {
        'exporter_name': ['CONSIGNOR_NAME', 'COMPANY_NAME'],
        'exporter_address': ['CONSIGNOR_ADDRESS', 'COMPANY_ADDRESS'],
        'iec_number': ['IEC', 'IEC_CODE'],
        'gstin': ['GSTIN', 'GST_NO'],
        'pan': ['PAN', 'PAN_NO'],
        'cha_name': ['CHA_NAME', 'FORWARDER'],
        'cha_license': ['CHA_LICENSE'],
        'shipping_bill_no': ['SB_NO', 'SHIPPING_BILL'],
        'invoice_no': ['REFERANCE', 'INVOICE_NO'],
        'vessel_flight': ['FLIGHT_NO', 'VESSEL_NO'],
        'port_loading': ['ORIGIN_CITY', 'FROM_CITY'],
        'valid_from': ['VALID_FROM', 'ORDER_DATE'],
        'valid_to': ['VALID_TO'],
        'signatory_name': ['CONTACT_PERSON', 'AUTH_NAME'],
        'signatory_designation': ['DESIGNATION', 'AUTH_ROLE'],
        'customs_authority': ['CUSTOMS_AUTHORITY']
    },
    // Delivery Challan & Packaging List
    'DELIVERY_CHALLAN': {
        'challan_no': ['REFERANCE', 'INVOICE_NO', 'DOC_NUMBER'],
        'challan_date': ['ORDER_DATE', 'DATE', 'BOOKING_DATE'],
        'from_company': ['CONSIGNOR_NAME', 'COMPANY_NAME'],
        'from_address': ['CONSIGNOR_ADDRESS', 'COMPANY_ADDRESS'],
        'to_company': ['CONSIGNEE_NAME'],
        'to_address': ['CONSIGNEE_ADDRESS'],
        'delivery_date': ['DELIVERY_DATE'],
        'vehicle_no': ['VEHICLE_NO', 'FLIGHT_NO'],
        'driver_name': ['DRIVER_NAME'],
        'special_instructions': ['REMARKS', 'INSTRUCTIONS', 'NOTE'],
        'packaging_notes': ['PACKAGING_NOTES']
    },
    // Certificate of Origin
    'COO': {
        'exporter_name': ['CONSIGNOR_NAME', 'COMPANY_NAME'],
        'exporter_address': ['CONSIGNOR_ADDRESS', 'COMPANY_ADDRESS'],
        'consignee_name': ['CONSIGNEE_NAME'],
        'consignee_address': ['CONSIGNEE_ADDRESS'],
        'departure_date': ['ORDER_DATE', 'DISPATCH_DATE'],
        'vessel_aircraft': ['FLIGHT_NO', 'VESSEL_NO'],
        'port_loading': ['ORIGIN_CITY', 'FROM_CITY'],
        'port_discharge': ['DESTINATION_CITY', 'TO_CITY'],
        'marks_numbers': ['MARKS', 'BOX_NO'],
        'description_goods': ['PRODUCT_DESCRIPTION', 'DESCRIPTION'],
        'gross_weight': ['GROSS_WEIGHT', 'WEIGHT'],
        'invoice_no': ['REFERANCE', 'INVOICE_NO'],
        'invoice_date': ['ORDER_DATE', 'INVOICE_DATE'],
        'country_origin': ['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN'],
        'country_destination': ['DESTINATION_COUNTRY', 'COUNTRY'],
        'transport_details':['MODE', 'CARRIER'],
        'marks_and_numbers':['MARKS', 'BOX_NO'],
        'country_of_origin':['ORIGIN_COUNTRY', 'COUNTRY_OF_ORIGIN', 'ORIGIN'],
        'origin_criterion': ['ORIGIN_CRITERION'],
        'number_packages': ['NUMBER_PACKAGES'],
        'certifying_authority': ['CERTIFYING_AUTHORITY'],
        'certification_date': ['CERTIFICATION_DATE'],
        'declaration_place': ['DECLARATION_PLACE']
    },
    // Annexure D for DEPB
    'ANN_D': {
        'shipping_bill_no': ['SB_NO', 'SHIPPING_BILL'],
        'shipping_bill_date': ['ORDER_DATE', 'DATE'],
        'exporter_name': ['CONSIGNOR_NAME', 'COMPANY_NAME'],
        'exporter_address': ['CONSIGNOR_ADDRESS', 'COMPANY_ADDRESS'],
        'excise_procedure': ['EXCISE_PROCEDURE'],
        'deec_status': ['DEEC_STATUS'],
        'declaration_date': ['ORDER_DATE', 'DATE']
    },
    'NON_DG': {
        'destination':      ['DESTINATION_CITY', 'DESTINATION', 'TO_CITY'],
        'description':      ['PRODUCT', 'CONTENT', 'DESC'],
        'mawb_number': ['MAWB_NUMBER'],
        'airport_departure': ['AIRPORT_DEPARTURE'],
        'airport_destination': ['AIRPORT_DESTINATION'],
        'total_packages': ['TOTAL_PACKAGES'],
        'net_weight': ['NET_WEIGHT'],
        'gross_weight': ['GROSS_WEIGHT'],
        'shipper_name': ['SHIPPER_NAME'],
        'shipper_address': ['SHIPPER_ADDRESS'],
        'signatory_designation': ['SIGNATORY_DESIGNATION']
    },
    'INS_CERT': {
        'policy_no': ['POLICY_NO'],
        'insured_amount':   ['DECLARED_VALUE', 'VALUE', 'AMOUNT'],
        'insured_party':    ['CONSIGNOR_NAME', 'EXPORTER'],
        'subject_matter':   ['PRODUCT', 'CONTENT']
    },
    'ARE1': {
        'are1_no': ['ARE1_NO'],
        'excise_reg_no': ['EXCISE_REG_NO'],
        'quantity':         ['PIECS', 'QTY', 'QUANTITY'],
        'value_for_excise': ['DECLARED_VALUE', 'VALUE'],
        'duty_involved': ['DUTY_INVOLVED'],
        'description_of_goods': ['PRODUCT', 'CONTENT']
    }
};

// ============================================================================
// SECTION 1.1: DYNAMIC TABLE HELPERS
// ============================================================================
window.addDocItemRow = function() {
    const tbody = document.getElementById('doc-items-body');
    if(!tbody) return;
    const rowCount = tbody.rows.length;
    const row = document.createElement('tr');
    row.className = "bg-white border-b hover:bg-gray-50 transition-colors";
    row.innerHTML = `
        <td class="px-2 py-2 text-center text-xs font-mono">${rowCount + 1}</td>
        <td class="px-2 py-2"><input type="text" name="item_marks[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Marks/No"></td>
        <td class="px-2 py-2"><input type="text" name="item_desc[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Description"></td>
        <td class="px-2 py-2"><input type="text" name="item_hsn[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="HSN"></td>
        <td class="px-2 py-2"><input type="number" step="any" name="item_qty[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0" oninput="updateRowCalculations(this)"></td>
        <td class="px-2 py-2"><input type="text" name="item_unit[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="PCS"></td>
        <td class="px-2 py-2"><input type="number" step="any" name="item_rate[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0.00" oninput="updateRowCalculations(this)"></td>
        <td class="px-2 py-2"><input type="number" step="any" name="item_amount[]" class="w-full p-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-600 cursor-not-allowed" readonly placeholder="0.00"></td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeDocItemRow(this)" class="text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;
    tbody.appendChild(row);
};

window.removeDocItemRow = function(btn) {
    btn.closest('tr').remove();
    Array.from(document.getElementById('doc-items-body').rows).forEach((r, i) => r.cells[0].innerText = i + 1);
};

window.updateRowCalculations = function(input) {
    const row = input.closest('tr');
    const qty = parseFloat(row.querySelector('input[name="item_qty[]"]').value) || 0;
    const rate = parseFloat(row.querySelector('input[name="item_rate[]"]').value) || 0;
    row.querySelector('input[name="item_amount[]"]').value = (qty * rate).toFixed(2);
};

// --- Packing List Table Helpers ---
window.addNonDGRow = function() {
    const tbody = document.getElementById('nondg-items-body');
    if(!tbody) return;
    const row = document.createElement('tr');
    row.className = "bg-white border-b hover:bg-gray-50 transition-colors";
    row.innerHTML = `
        <td class="px-2 py-2"><input type="text" name="nondg_marks[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="C/NO. 1-34"></td>
        <td class="px-2 py-2"><input type="text" name="nondg_desc[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cotton Textile Fabric (100% Cotton)"></td>
        <td class="px-2 py-2"><input type="text" name="nondg_qty[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="125.0 KGS"></td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeDocItemRow(this)" class="text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;
    tbody.appendChild(row);
};

window.addNegRow = function() {
    const tbody = document.getElementById('neg-items-body');
    if(!tbody) return;
    const row = document.createElement('tr');
    row.className = "bg-white border-b hover:bg-gray-50 transition-colors";
    row.innerHTML = `
        <td class="px-2 py-2"><input type="text" name="neg_marks[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="GE/SILK/001"></td>
        <td class="px-2 py-2"><input type="text" name="neg_desc[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Pure Silk Sarees - 72% Silk Content"></td>
        <td class="px-2 py-2"><input type="text" name="neg_country[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Made in India"></td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeDocItemRow(this)" class="text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;
    tbody.appendChild(row);
};

window.addMCDRow = function() {
    const tbody = document.getElementById('mcd-items-body');
    if(!tbody) return;
    const row = document.createElement('tr');
    row.className = "bg-white border-b hover:bg-gray-50 transition-colors";
    row.innerHTML = `
        <td class="px-2 py-2"><input type="text" name="mcd_marks[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="GE/001"></td>
        <td class="px-2 py-2"><input type="text" name="mcd_desc[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cotton Fabric"></td>
        <td class="px-2 py-2"><input type="text" name="mcd_mfg_ops[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Weaving & Dyeing"></td>
        <td class="px-2 py-2"><input type="date" name="mcd_mfg_date[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"></td>
        <td class="px-2 py-2"><input type="text" name="mcd_mfg_country[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="INDIA"></td>
        <td class="px-2 py-2"><input type="text" name="mcd_material[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cotton Yarn"></td>
        <td class="px-2 py-2"><input type="date" name="mcd_material_date[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"></td>
        <td class="px-2 py-2"><input type="text" name="mcd_prod_country[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="INDIA"></td>
        <td class="px-2 py-2"><input type="date" name="mcd_export_date[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"></td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeDocItemRow(this)" class="text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;
    tbody.appendChild(row);
};

window.addPackingRow = function() {
    const tbody = document.getElementById('pkl-items-body');
    if(!tbody) return;
    const row = document.createElement('tr');
    row.className = "bg-white border-b hover:bg-gray-50 transition-colors";
    row.innerHTML = `
        <td class="px-2 py-2"><input type="text" name="pkl_carton[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="1-10"></td>
        <td class="px-2 py-2"><input type="text" name="pkl_desc[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Description"></td>
        <td class="px-2 py-2"><input type="text" name="pkl_qty[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Qty"></td>
        <td class="px-2 py-2"><input type="number" step="any" name="pkl_net[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0.00"></td>
        <td class="px-2 py-2"><input type="number" step="any" name="pkl_gross[]" class="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0.00"></td>
        <td class="px-2 py-2 flex gap-1">
            <input type="number" name="pkl_l[]" class="w-1/3 p-1.5 border border-gray-300 rounded text-xs" placeholder="L" oninput="updateVolWeight(this)">
            <input type="number" name="pkl_b[]" class="w-1/3 p-1.5 border border-gray-300 rounded text-xs" placeholder="B" oninput="updateVolWeight(this)">
            <input type="number" name="pkl_h[]" class="w-1/3 p-1.5 border border-gray-300 rounded text-xs" placeholder="H" oninput="updateVolWeight(this)">
        </td>
        <td class="px-2 py-2"><input type="number" step="any" name="pkl_vol[]" class="w-full p-1.5 border border-gray-200 rounded text-xs bg-gray-50 text-gray-600" readonly placeholder="0.00"></td>
        <td class="px-2 py-2 text-center">
            <button type="button" onclick="removeDocItemRow(this)" class="text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
        </td>
    `;
    tbody.appendChild(row);
};

window.updateVolWeight = function(input) {
    const row = input.closest('tr');
    const l = parseFloat(row.querySelector('input[name="pkl_l[]"]').value) || 0;
    const b = parseFloat(row.querySelector('input[name="pkl_b[]"]').value) || 0;
    const h = parseFloat(row.querySelector('input[name="pkl_h[]"]').value) || 0;
    // Standard IATA Volumetric Divisor: 5000
    const vol = (l * b * h) / 5000;
    row.querySelector('input[name="pkl_vol[]"]').value = vol.toFixed(2);
};

window.fetchExchangeRate = async function(currency) {
    if (!currency) return;
    
    // Only proceed if there is an exchange rate field to populate
    const rateField = document.querySelector('input[name="exchange_rate"]');
    if (!rateField) return;

    // Visual feedback
    const originalPlaceholder = rateField.placeholder;
    rateField.value = '';
    rateField.placeholder = "Fetching rate...";
    
    try {
        // Using open.er-api.com (Free, No Key Required)
        const response = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();
        // We need the rate of 1 Unit of Target Currency in INR (e.g., 1 USD = 84 INR)
        const rate = data.rates.INR;
        
        if (rate) {
            rateField.value = rate.toFixed(2);
            if (window.showNotification) window.showNotification(`Rate updated: 1 ${currency} = ${rate.toFixed(2)} INR`, 'success');
        }
    } catch (e) {
        console.error("Exchange rate fetch failed", e);
        if (window.showNotification) window.showNotification("Failed to fetch exchange rate automatically.", "error");
        rateField.placeholder = originalPlaceholder;
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
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
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
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice No.', type: 'text', required: true, width: 'w-1/3' },
            { key: 'invoice_date', label: 'Date', type: 'date', required: true, width: 'w-1/3' },
            { key: 'iec', label: 'IEC Code', type: 'text', width: 'w-1/3' },
            { key: 'exporter_ref', label: 'Exporter Reference', type: 'text', width: 'w-1/2' },
            { key: 'other_ref', label: 'Other References', type: 'text', width: 'w-1/2' },
            { key: 'buyer_order', label: 'Buyer Order No.', type: 'text', width: 'w-1/2' },
            { key: 'buyer_date', label: 'Order Date', type: 'date', width: 'w-1/2' },
            { key: 'consignee_details', label: 'Consignee Details', type: 'textarea', required: true, width: 'w-full' },
            { key: 'buyer_details', label: 'Buyer (if other than Consignee)', type: 'textarea', width: 'w-full' },
            { key: 'country_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', width: 'w-1/2' },
            { key: 'country_dest', label: 'Country of Destination', type: 'text', required: true, width: 'w-1/2' },
            { type: 'heading', label: 'Logistics Details' },
            { key: 'pre_carriage', label: 'Pre-Carriage By', type: 'text', width: 'w-1/3' },
            { key: 'place_receipt', label: 'Place of Receipt', type: 'text', width: 'w-1/3' },
            { key: 'vessel_flight_no', label: 'Vessel / Flight No.', type: 'text', width: 'w-1/3' },
            { key: 'port_loading', label: 'Port of Loading', type: 'text', width: 'w-1/3' },
            { key: 'port_discharge', label: 'Port of Discharge', type: 'text', width: 'w-1/3' },
            { key: 'final_dest', label: 'Final Destination', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: 'Commercial Terms' },
            { key: 'terms', label: 'Incoterms', type: 'select', options: ['FOB', 'CIF', 'C&F', 'EXW', 'DAP', 'DDP'], width: 'w-1/2' },
            { key: 'payment_terms', label: 'Payment Terms', type: 'select', options: ['DP', 'DA', 'AP', 'LC', 'TT'], width: 'w-1/2' },
            { type: 'heading', label: 'Currency & Product Details' },
            { key: 'currency', label: 'Target Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'AED'], width: 'w-1/2' },
            { key: 'exchange_rate', label: 'Exchange Rate (INR to Target)', type: 'number', width: 'w-1/2', placeholder: 'e.g. 84.50' },
            { key: 'items', label: 'Product List (Enter Values in INR)', type: 'items_table', width: 'w-full' },
            { key: 'declaration', label: 'Declaration', type: 'textarea', value: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', width: 'w-full' }
        ]
    },
    'PKL': {
        id: 'PKL',
        title: 'Packing List',
        desc: 'Required by customs and carriers to identify specific contents, weights, and dimensions of each package. It ensures safety during handling and allows officials to reconcile the cargo against the Commercial Invoice.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_details', label: 'Consignee (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice No.', type: 'text', width: 'w-1/3' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', width: 'w-1/3' },
            { key: 'buyer_order', label: 'Buyer Order No.', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: 'Logistics' },
            { key: 'vessel_flight', label: 'Vessel / Flight', type: 'text', width: 'w-1/3' },
            { key: 'port_loading', label: 'Port of Loading', type: 'text', width: 'w-1/3' },
            { key: 'port_discharge', label: 'Port of Discharge', type: 'text', width: 'w-1/3' },
            { key: 'final_dest', label: 'Final Destination', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: 'Packing Details' },
            { key: 'packing_list', label: 'Packages', type: 'packing_table', width: 'w-full' },
            { type: 'heading', label: 'Other Info' },
            { key: 'marks_numbers', label: 'Marks & Numbers', type: 'textarea', width: 'w-1/2' },
            { key: 'special_instructions', label: 'Special Instructions', type: 'textarea', width: 'w-1/2' }
        ]
    },
    'KYC': {
        id: 'KYC',
        title: 'KYC Form',
        desc: 'Mandatory verification document for Indian Customs to establish the identity and address of the exporter/importer. It is required to prevent fraud, ensure regulatory compliance, and link the IEC/PAN to the shipment.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
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
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipper_name', label: 'Shipper Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'consignee_name', label: 'Consignee Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_no', label: 'Invoice No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'sli_date', label: 'Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'e_code', label: 'E Code No (10 Digit)', type: 'text', width: 'w-1/2' },
            { key: 'bank_ad_code', label: 'Bank AD Code', type: 'text', width: 'w-1/2' },
            { key: 'currency', label: 'Currency of Invoice', type: 'select', options: ['USD', 'EUR', 'GBP', 'INR'], width: 'w-1/3' },
            { key: 'incoterms', label: 'Incoterms', type: 'select', options: ['FOB', 'C&F', 'C&I', 'CIF'], width: 'w-1/3' },
            { key: 'payment_terms', label: 'Nature of Payment', type: 'select', options: ['DP', 'DA', 'AP', 'OTHERS'], width: 'w-1/3' },
            { type: 'heading', label: 'Shipping Bill Details' },
            { key: 'invoice_value', label: 'For Value', type: 'number', width: 'w-1/2' },
            { key: 'freight', label: 'Freight (if any)', type: 'number', width: 'w-1/2' },
            { key: 'insurance', label: 'Insurance (if any)', type: 'number', width: 'w-1/2' },
            { key: 'commission', label: 'Commission (if any)', type: 'number', width: 'w-1/2' },
            { key: 'discount', label: 'Discount (if any)', type: 'number', width: 'w-1/2' },
            { key: 'no_of_pkgs', label: 'No. of Packages', type: 'text', width: 'w-1/2' },
            { key: 'net_weight', label: 'Net Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'gross_weight', label: 'Gross Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'volume_weight', label: 'Volume Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'forwarder_name', label: 'Freight Forwarder', type: 'text', required: true, width: 'w-full' },
            { key: 'special_instructions', label: 'Special Instructions', type: 'textarea', width: 'w-full' }
        ]
    },
    'BL_AWB': {
        id: 'BL_AWB',
        title: 'Bill of Lading / Air Waybill',
        desc: 'Acts as a receipt for cargo, a contract of carriage between shipper and carrier, and (in the case of a B/L) a document of title required to claim possession of the goods at the destination.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_details', label: 'Consignee (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'carrier_name', label: 'Carrier Name', type: 'text', required: true, width: 'w-full' },
            { key: 'awb_number', label: 'B/L or AWB Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', width: 'w-1/2' },
            { key: 'port_of_loading', label: 'Port of Loading', type: 'text', width: 'w-1/2' },
            { key: 'port_of_discharge', label: 'Port of Discharge', type: 'text', width: 'w-1/2' },
            { key: 'vessel_flight_no', label: 'Vessel / Flight No.', type: 'text', width: 'w-1/2' },
            { key: 'country_dest', label: 'Country of Destination', type: 'text', width: 'w-1/2' },
            { key: 'description_of_goods', label: 'Description of Goods', type: 'textarea', width: 'w-full' }
        ]
    },
    'INS_CERT': {
        id: 'INS_CERT',
        title: 'Insurance Certificate',
        desc: 'Provides proof that the shipment is insured against loss or damage during transit. It is often required by the buyer under specific Incoterms (like CIF) or by banks for Letter of Credit compliance.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_details', label: 'Consignee (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', width: 'w-1/2' },
            { key: 'awb_number', label: 'AWB/B/L Number', type: 'text', width: 'w-1/2' },
            { key: 'policy_no', label: 'Policy Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'insured_amount', label: 'Insured Amount', type: 'number', required: true, width: 'w-1/2' },
            { key: 'insured_party', label: 'Insured Party', type: 'text', width: 'w-1/2' },
            { key: 'subject_matter', label: 'Subject Matter Insured', type: 'text', width: 'w-full' },
            { key: 'country_dest', label: 'Country of Destination', type: 'text', width: 'w-1/2' },
            { key: 'description_of_goods', label: 'Description of Goods', type: 'textarea', width: 'w-full' }
        ]
    },
    'LOA': {
        id: 'LOA',
        title: 'Letter of Authority',
        desc: 'Legally authorizes a Customs House Agent (CHA) to act on behalf of the exporter/importer. It allows the agent to file documents and clear shipments with Customs authorities.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'cha_name', label: 'CHA Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'validity_period', label: 'Validity Period', type: 'text', width: 'w-1/2' },
            { key: 'authorized_signatory', label: 'Authorized Signatory', type: 'text', width: 'w-1/2' }
        ]
    },

    // --- Category 2: Incentives & Regimes ---
    'ANN_D': {
        id: 'ANN_D',
        title: 'Annexure D for DEPB',
        desc: 'DEPB Declaration required for claims under the Duty Entitlement Pass Book scheme.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipping_bill_no', label: 'Shipping Bill Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address', type: 'textarea', required: true, width: 'w-full' },
            { type: 'heading', label: 'Declaration Options' },
            { key: 'excise_procedure', label: 'Central Excise Procedure', type: 'select', options: ['Not availed', 'Availed under rule 12(1)(b)/13(1)(b)'], width: 'w-full' },
            { key: 'deec_status', label: 'DEEC Status', type: 'select', options: ['Not under DEEC', 'Under DEEC - Central Excise only', 'Under DEEC - Brand rate'], width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'ARE1': {
        id: 'ARE1',
        title: 'ARE-1 Form',
        desc: 'Used to claim rebates on excise duty or remove goods for export without payment of duty (under bond/LUT). It serves as official proof of export for Central Excise authorities.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'exporter_details', label: 'Exporter (Name & Address)', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_details', label: 'Consignee (Name & Address)', type: 'textarea', width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', width: 'w-1/2' },
            { key: 'are1_no', label: 'ARE-1 Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'excise_reg_no', label: 'Central Excise Reg. No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'description_of_goods', label: 'Description of Goods', type: 'textarea', width: 'w-full' },
            { key: 'quantity', label: 'Quantity', type: 'number', width: 'w-1/3' },
            { key: 'value_for_excise', label: 'Value for Excise Duty', type: 'number', width: 'w-1/3' },
            { key: 'duty_involved', label: 'Duty Involved', type: 'number', width: 'w-1/3' },
            { key: 'country_dest', label: 'Country of Destination', type: 'text', width: 'w-1/2' },
            { key: 'awb_number', label: 'AWB/B/L Number', type: 'text', width: 'w-1/2' }
        ]
    },

    // --- Category 3: Shipment Type ---
    'SDF': {
        id: 'SDF',
        title: 'SDF Form',
        desc: 'Statutory Declaration Form required by RBI/FEMA to declare the full export value and guarantee that foreign exchange will be repatriated to India within the stipulated time frame.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'seller_consignor', label: 'Declaration Type', type: 'select', options: ['SELLER', 'CONSIGNOR'], value: 'SELLER', width: 'w-1/2' },
            { key: 'value_ascertainment', label: 'Value Ascertainment', type: 'select', options: ['A - Value as contracted', 'B - Value not ascertainable'], value: 'B - Value not ascertainable', width: 'w-1/2' },
            { key: 'bank_name', label: 'Bank Name', type: 'text', required: true, width: 'w-full' },
            { key: 'repatriation_date', label: 'Repatriation Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'rbi_caution_list', label: 'RBI Caution List Status', type: 'select', options: ['am/are not', 'am/are'], value: 'am/are not', width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'ANN_1': {
        id: 'ANN_1',
        title: 'Annexure-I for Drawback',
        desc: 'Exporters Declaration required for Exports of Woven Garments for availing higher All Industry Rate of Drawback.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'goods_description', label: 'Description of the Goods', type: 'text', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address with Central Excise Details', type: 'textarea', required: true, width: 'w-full' },
            { key: 'manufacturer_address', label: 'Manufacturer Address with Central Excise Details', type: 'textarea', width: 'w-full' },
            { key: 'manufacturing_unit_address', label: 'Manufacturing Unit Address', type: 'text', width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'ANN_2': {
        id: 'ANN_2',
        title: 'Annexure-II for Drawback',
        desc: 'Supporting Manufacturers/Job Workers Declaration required for Exports of Woven Garments for availing higher All Industry Rate of Drawback.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'goods_description', label: 'Description of the Goods', type: 'text', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address with Central Excise Details', type: 'textarea', width: 'w-full' },
            { key: 'manufacturer_name', label: 'Supporting Manufacturer/Job Worker Name', type: 'text', required: true, width: 'w-full' },
            { key: 'manufacturer_address', label: 'Manufacturer Address with Central Excise Details', type: 'textarea', required: true, width: 'w-full' },
            { key: 'manufacturing_unit_address', label: 'Manufacturing Unit Address', type: 'text', width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'APP_3': {
        id: 'APP_3',
        title: 'Appendix III for Drawback',
        desc: 'Declaration form to be filled for export goods under claim for drawback.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'excise_procedure', label: 'Central Excise Procedure', type: 'select', options: ['Not availed', 'Availed under rule 191A/191B'], width: 'w-full' },
            { key: 'deec_status', label: 'DEEC Status', type: 'select', options: ['Not under DEEC', 'Under DEEC'], width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'APP_4': {
        id: 'APP_4',
        title: 'Appendix IV for Drawback',
        desc: 'Declaration for goods claiming drawback under specific S.S.Nos with CENVAT facility certification.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'superintendent_name', label: 'Superintendent Name', type: 'text', width: 'w-1/2' },
            { key: 'excise_range', label: 'Central Excise Range/Division/Commissionerate', type: 'text', width: 'w-1/2' }
        ]
    },
    'APP_2': {
        id: 'APP_2',
        title: 'Appendix II for DEEC',
        desc: 'DEEC Declaration required for exports under the Advance License (DEEC) scheme.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'excise_procedure', label: 'Central Excise Procedure', type: 'select', options: ['Not availed', 'Availed except notification 49/94-CE', 'Availed under rule 12(I)(b)/13(I)(b)'], width: 'w-full' },
            { key: 'export_type', label: 'Export Type', type: 'select', options: ['Direct by license holder', 'By third party'], width: 'w-full' }
        ]
    },
    'ANN_C1': {
        id: 'ANN_C1',
        title: 'Annexure C1 for EOU',
        desc: 'Mandatory certificate for 100% Export Oriented Units (EOU) from Central Excise authorities.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'range', label: 'Range', type: 'text', width: 'w-1/3' },
            { key: 'division', label: 'Division', type: 'text', width: 'w-1/3' },
            { key: 'commissionerate', label: 'Commissionerate', type: 'text', width: 'w-1/3' },
            { key: 'certificate_no', label: 'Certificate No', type: 'text', width: 'w-1/2' },
            { key: 'certificate_date', label: 'Certificate Date', type: 'date', width: 'w-1/2' },
            { key: 'shipping_bill_no', label: 'Shipping Bill No', type: 'text', required: true, width: 'w-1/2' },
            { key: 'shipping_bill_date', label: 'Shipping Bill Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'eou_name', label: 'Name of EOU', type: 'text', required: true, width: 'w-full' },
            { key: 'iec_no', label: 'IEC No (of the EOU)', type: 'text', required: true, width: 'w-1/2' },
            { key: 'factory_address', label: 'Factory Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'examination_date', label: 'Date of Examination', type: 'date', width: 'w-1/2' },
            { key: 'examining_officer', label: 'Examining Officer Name & Designation', type: 'text', width: 'w-full' },
            { key: 'supervising_officer', label: 'Supervising Officer Name & Designation', type: 'text', width: 'w-full' },
            { key: 'location_code', label: 'Location Code', type: 'text', width: 'w-1/2' },
            { key: 'invoice_no', label: 'Export Invoice No', type: 'text', width: 'w-1/2' },
            { key: 'total_packages', label: 'Total No of Packages', type: 'number', width: 'w-1/2' },
            { key: 'consignee_name', label: 'Name & Address of Consignee Abroad', type: 'textarea', width: 'w-full' },
            { key: 'goods_description_correct', label: 'Is goods description correct?', type: 'select', options: ['Yes', 'No'], width: 'w-1/2' },
            { key: 'sample_drawn', label: 'Sample drawn for port?', type: 'select', options: ['Yes', 'No'], width: 'w-1/2' },
            { key: 'seal_details', label: 'Seal Details (Non-containerized)', type: 'text', width: 'w-full' },
            { key: 'container_details', label: 'Container Details (if applicable)', type: 'text', width: 'w-full' }
        ]
    },
    'SCD': {
        id: 'SCD',
        title: 'Single Country Declaration',
        desc: 'For goods wholly produced in one country (often required for US imports).',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'declarant_name', label: 'Declarant Name', type: 'text', required: true, width: 'w-full' },
            { key: 'country_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', required: true, width: 'w-1/2' },
            { key: 'country_b', label: 'Country B (if applicable)', type: 'text', width: 'w-1/2' },
            { key: 'country_c', label: 'Country C (if applicable)', type: 'text', width: 'w-1/2' },
            { key: 'country_d', label: 'Country D (if applicable)', type: 'text', width: 'w-1/2' },
            { key: 'marks_numbers', label: 'Marks of Identification Numbers', type: 'textarea', width: 'w-full' },
            { key: 'description_goods', label: 'Description of Articles & Quantity', type: 'textarea', required: true, width: 'w-full' },
            { key: 'exportation_date', label: 'Date of Exportation', type: 'date', required: true, width: 'w-1/2' },
            { key: 'made_in_country', label: 'Made in Country', type: 'text', value: 'INDIA', width: 'w-1/2' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'signatory_name', label: 'Signatory Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_title', label: 'Signatory Title', type: 'text', width: 'w-1/2' },
            { key: 'company_name', label: 'Company Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'company_address', label: 'Company Address', type: 'textarea', width: 'w-full' }
        ]
    },
    'MCD': {
        id: 'MCD',
        title: 'Multiple Country Declaration',
        desc: 'For goods assembled across multiple countries (often required for US textile imports).',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'declarant_name', label: 'Declarant Name', type: 'text', required: true, width: 'w-full' },
            { key: 'country_a', label: 'Country A', type: 'text', value: 'INDIA', required: true, width: 'w-1/4' },
            { key: 'country_b', label: 'Country B', type: 'text', width: 'w-1/4' },
            { key: 'country_c', label: 'Country C', type: 'text', width: 'w-1/4' },
            { key: 'country_d', label: 'Country D', type: 'text', width: 'w-1/4' },
            { key: 'items', label: 'Textile Items Details', type: 'mcd_table', width: 'w-full' },
            { key: 'signatory_name', label: 'Signatory Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_title', label: 'Signatory Title', type: 'text', width: 'w-1/2' },
            { key: 'company_name', label: 'Company Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'company_address', label: 'Company Address', type: 'textarea', width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'NEG_DEC': {
        id: 'NEG_DEC',
        title: 'Negative Declaration',
        desc: 'Required for Silk products (>70% silk) exported to the USA.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'declarant_name', label: 'Declarant Name', type: 'text', required: true, width: 'w-full' },
            { key: 'items', label: 'Silk Products Details', type: 'neg_table', width: 'w-full' },
            { key: 'declaration_date', label: 'Declaration Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'signatory_name', label: 'Signatory Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_title', label: 'Signatory Title', type: 'text', width: 'w-1/2' },
            { key: 'company_name', label: 'Company Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'company_address', label: 'Company Address', type: 'textarea', width: 'w-full' }
        ]
    },
    'QUOTA': {
        id: 'QUOTA',
        title: 'Quota Charge Statement',
        desc: 'Required for textile exports subject to quota charges.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'company_name', label: 'Company Name', type: 'text', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'quota_amount', label: 'Quota Charge Amount', type: 'text', required: true, width: 'w-1/2', placeholder: 'USD 2,500.00' },
            { key: 'paid_by', label: 'Paid By', type: 'text', required: true, width: 'w-1/2' },
            { key: 'paid_to', label: 'Paid To (Quota Authority)', type: 'text', required: true, width: 'w-full' },
            { key: 'quota_included', label: 'Quota charge included in invoice price?', type: 'select', options: ['Yes', 'No'], width: 'w-1/2' },
            { key: 'statement_date', label: 'Statement Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'signatory_title', label: 'Signatory Title', type: 'text', width: 'w-1/2' },
            { key: 'company_address', label: 'Company Address', type: 'textarea', width: 'w-full' }
        ]
    },
    'TSCA': {
        id: 'TSCA',
        title: 'TSCA Certificate',
        desc: 'Required for chemical shipments to the USA.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'certification_type', label: 'Certification Type', type: 'select', options: ['Positive Certification', 'Negative Certification'], width: 'w-full' },
            { key: 'company_name', label: 'Company Name', type: 'text', required: true, width: 'w-full' },
            { key: 'company_address', label: 'Company Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'authorized_name', label: 'Authorized Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_title', label: 'Title', type: 'text', width: 'w-1/2' },
            { key: 'awb_number', label: 'Air Waybill Number', type: 'text', width: 'w-1/2' },
            { key: 'certificate_date', label: 'Certificate Date', type: 'date', required: true, width: 'w-1/2' }
        ]
    },
    'GR_SAMPLE': {
        id: 'GR_SAMPLE',
        title: 'GR Waiver (Free Sample)',
        desc: 'For commercial samples with no commercial value.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'bank_name', label: 'Bank Name', type: 'text', value: 'STATE BANK OF INDIA', width: 'w-full' },
            { key: 'bank_address', label: 'Bank Address', type: 'textarea', value: 'International Banking Division, Fort Branch, Mumbai - 400001', width: 'w-full' },
            { key: 'customs_authority', label: 'Customs Authority', type: 'text', value: 'The Commissioner of Customs, Mumbai', width: 'w-full' },
            { key: 'certificate_date', label: 'Certificate Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'shipper_name', label: 'Shipper Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_name', label: 'Consignee Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'description', label: 'Description with Model/Serial/Part Number', type: 'textarea', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'invoice_value', label: 'Value of Goods', type: 'text', value: 'USD 1.00 (NOMINAL)', width: 'w-1/2' },
            { key: 'bank_signatory', label: 'Bank Signatory Name', type: 'text', width: 'w-1/2' },
            { key: 'bank_designation', label: 'Bank Signatory Designation', type: 'text', width: 'w-1/2' }
        ]
    },
    'GR_REPAIR': {
        id: 'GR_REPAIR',
        title: 'GR Waiver (Repair & Return)',
        desc: 'For goods exported for repair and subsequent re-import.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'bank_name', label: 'Bank Name', type: 'text', value: 'STATE BANK OF INDIA', width: 'w-full' },
            { key: 'bank_address', label: 'Bank Address', type: 'textarea', value: 'International Banking Division, Fort Branch, Mumbai - 400001', width: 'w-full' },
            { key: 'customs_authority', label: 'Customs Authority', type: 'text', value: 'The Commissioner of Customs, Mumbai', width: 'w-full' },
            { key: 'certificate_date', label: 'Certificate Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'shipper_name', label: 'Shipper Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'consignee_name', label: 'Consignee Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'description', label: 'Description with Model/Serial/Part Number', type: 'textarea', required: true, width: 'w-full' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'invoice_value', label: 'Value of Goods', type: 'text', required: true, width: 'w-1/2' },
            { key: 'repair_reason', label: 'Reason for Repair', type: 'text', value: 'REPAIR AND RE-IMPORT AFTER REPAIR', width: 'w-1/2' },
            { key: 'bank_signatory', label: 'Bank Signatory Name', type: 'text', width: 'w-1/2' },
            { key: 'bank_designation', label: 'Bank Signatory Designation', type: 'text', width: 'w-1/2' }
        ]
    },
    'MSDS': {
        id: 'MSDS',
        title: 'MSDS (Material Safety Data Sheet)',
        desc: 'Required for chemical shipments containing 16 mandatory safety data points as per international regulations.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { type: 'heading', label: '1. Identification of Substance/Preparation & Company' },
            { key: 'commodity_name', label: 'Name of Commodity & Proper Shipping Name', type: 'text', required: true, width: 'w-full' },
            { key: 'preparation', label: 'Preparation', type: 'text', width: 'w-1/2' },
            { key: 'manufacturer_name', label: 'Manufacturing Company Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'manufacturer_address', label: 'Manufacturer Address & Emergency Tel', type: 'textarea', required: true, width: 'w-full' },
            { type: 'heading', label: '2. Composition/Information on Ingredients' },
            { key: 'chemical_name', label: 'Chemical Name & Family', type: 'text', width: 'w-1/2' },
            { key: 'chemical_formula', label: 'Chemical Formula & CAS Number', type: 'text', width: 'w-1/2' },
            { key: 'index_number', label: 'Index Number & Hazard Symbol', type: 'text', width: 'w-1/2' },
            { key: 'risk_phrases', label: 'Risk Phrases & UN Number', type: 'text', width: 'w-1/2' },
            { type: 'heading', label: '9. Physical & Chemical Properties' },
            { key: 'physical_form', label: 'Physical Form, Colour, Odour', type: 'text', width: 'w-full' },
            { key: 'melting_point', label: 'Melting Point, Density, Vapour Pressure, Viscosity', type: 'text', width: 'w-full' },
            { key: 'water_solubility', label: 'Solubility in Water & pH Value', type: 'text', width: 'w-1/2' },
            { key: 'flash_point', label: 'Flash Point, Ignition Temp, Explosive Limits', type: 'text', width: 'w-1/2' },
            { type: 'heading', label: '11. Toxicological Information' },
            { key: 'oral_toxicity', label: 'Oral Toxicity LD50 mg/kg', type: 'text', width: 'w-1/3' },
            { key: 'dermal_toxicity', label: 'Dermal Toxicity LD50 mg/kg', type: 'text', width: 'w-1/3' },
            { key: 'inhalation_toxicity', label: 'Inhalation Toxicity LC50 mg/kg', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: '14. Transport Information' },
            { key: 'transport_class', label: 'UN Number, Class Category & Packing Group', type: 'text', width: 'w-full' }
        ]
    },
    'TAX_CHALLAN': {
        id: 'TAX_CHALLAN',
        title: 'Tax Invoice cum Delivery Challan',
        desc: 'GST compliant domestic invoice for inter-state supply of goods with delivery challan format.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { type: 'heading', label: 'Supplier Details' },
            { key: 'supplier_name', label: 'Supplier Name', type: 'text', required: true, width: 'w-full' },
            { key: 'supplier_address', label: 'Supplier Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'supplier_gstin', label: 'Supplier GSTIN', type: 'text', required: true, width: 'w-1/2' },
            { key: 'supplier_state', label: 'Supplier State & Code', type: 'text', width: 'w-1/2' },
            { type: 'heading', label: 'Invoice Details' },
            { key: 'challan_no', label: 'Challan Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'challan_date', label: 'Challan Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'po_number', label: 'PO Number', type: 'text', width: 'w-1/2' },
            { key: 'po_date', label: 'PO Date', type: 'date', width: 'w-1/2' },
            { key: 'eway_bill', label: 'E-Way Bill Number', type: 'text', width: 'w-1/2' },
            { key: 'eway_valid', label: 'E-Way Bill Valid Upto', type: 'date', width: 'w-1/2' },
            { type: 'heading', label: 'Receiver Details' },
            { key: 'receiver_name', label: 'Receiver Name', type: 'text', required: true, width: 'w-full' },
            { key: 'receiver_address', label: 'Receiver Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'receiver_gstin', label: 'Receiver GSTIN', type: 'text', width: 'w-1/2' },
            { key: 'receiver_state', label: 'Receiver State & Code', type: 'text', width: 'w-1/2' },
            { type: 'heading', label: 'Transport Details' },
            { key: 'transport_mode', label: 'Mode of Transport', type: 'select', options: ['ROAD', 'RAIL', 'AIR', 'SHIP'], width: 'w-1/3' },
            { key: 'vehicle_no', label: 'Vehicle Number', type: 'text', width: 'w-1/3' },
            { key: 'transporter', label: 'Transporter Name', type: 'text', width: 'w-1/3' },
            { key: 'lr_no', label: 'LR Number', type: 'text', width: 'w-1/2' },
            { key: 'dispatch_date', label: 'Dispatch Date', type: 'date', width: 'w-1/2' },
            { type: 'heading', label: 'Goods Details' },
            { key: 'items', label: 'Product List', type: 'items_table', width: 'w-full' },
            { type: 'heading', label: 'Additional Information' },
            { key: 'supply_type', label: 'Supply Type', type: 'select', options: ['Inter-State', 'Intra-State'], value: 'Inter-State', width: 'w-1/2' },
            { key: 'reverse_charge', label: 'Reverse Charge Applicable', type: 'select', options: ['No', 'Yes'], value: 'No', width: 'w-1/2' },
            { key: 'declaration', label: 'Declaration', type: 'textarea', value: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods sold are meant for resale/manufacture.', width: 'w-full' }
        ]
    },

    'DELIVERY_CHALLAN': {
        id: 'DELIVERY_CHALLAN',
        title: 'Delivery Challan & Packaging List',
        desc: 'Document for goods dispatch and receipt with detailed packaging information.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'challan_no', label: 'Challan No.', type: 'text', required: true, width: 'w-1/2' },
            { key: 'challan_date', label: 'Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'from_company', label: 'From (Company)', type: 'text', required: true, width: 'w-1/2' },
            { key: 'to_company', label: 'To (Company)', type: 'text', required: true, width: 'w-1/2' },
            { key: 'from_address', label: 'From Address', type: 'textarea', required: true, width: 'w-1/2' },
            { key: 'to_address', label: 'To Address', type: 'textarea', required: true, width: 'w-1/2' },
            { key: 'delivery_date', label: 'Delivery Date', type: 'date', width: 'w-1/3' },
            { key: 'vehicle_no', label: 'Vehicle No.', type: 'text', width: 'w-1/3' },
            { key: 'driver_name', label: 'Driver Name', type: 'text', width: 'w-1/3' },
            { key: 'items', label: 'Product List', type: 'items_table', width: 'w-full' },
            { key: 'packages', label: 'Packaging Items', type: 'packing_table', width: 'w-full' },
            { key: 'special_instructions', label: 'Special Instructions', type: 'textarea', width: 'w-1/2' },
            { key: 'packaging_notes', label: 'Packaging Notes', type: 'textarea', width: 'w-1/2' }
        ]
    },
    'LOA': {
        id: 'LOA',
        title: 'Letter of Authority',
        desc: 'Legally authorizes a Customs House Agent (CHA) to act on behalf of the exporter/importer for customs clearance.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { type: 'heading', label: 'Exporter Details' },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'iec_number', label: 'IEC Number', type: 'text', required: true, width: 'w-1/3' },
            { key: 'gstin', label: 'GSTIN', type: 'text', width: 'w-1/3' },
            { key: 'pan', label: 'PAN Number', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: 'CHA Details' },
            { key: 'cha_name', label: 'CHA Name & Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'cha_license', label: 'CHA License Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'customs_authority', label: 'Customs Authority', type: 'text', value: 'The Commissioner of Customs', width: 'w-1/2' },
            { type: 'heading', label: 'Consignment Details' },
            { key: 'shipping_bill_no', label: 'Shipping Bill Number', type: 'text', width: 'w-1/2' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', width: 'w-1/3' },
            { key: 'vessel_flight', label: 'Vessel/Flight Number', type: 'text', width: 'w-1/3' },
            { key: 'port_loading', label: 'Port of Loading', type: 'text', width: 'w-1/3' },
            { type: 'heading', label: 'Authorization Period' },
            { key: 'valid_from', label: 'Valid From', type: 'date', required: true, width: 'w-1/2' },
            { key: 'valid_to', label: 'Valid To', type: 'date', required: true, width: 'w-1/2' },
            { type: 'heading', label: 'Signatory Details' },
            { key: 'signatory_name', label: 'Authorized Signatory Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_designation', label: 'Designation', type: 'text', required: true, width: 'w-1/2' }
        ]
    },
    'COO': {
        id: 'COO',
        title: 'Certificate of Origin',
        desc: 'Certifies the country where the goods were manufactured for customs duty determination and trade agreement benefits.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { type: 'heading', label: '1. Exporter Details' },
            { key: 'exporter_name', label: 'Exporter Business Name', type: 'text', required: true, width: 'w-full' },
            { key: 'exporter_address', label: 'Exporter Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'country_origin', label: 'Country of Origin', type: 'text', value: 'INDIA', required: true, width: 'w-1/2' },
            { type: 'heading', label: '2. Consignee Details' },
            { key: 'consignee_name', label: 'Consignee Name', type: 'text', required: true, width: 'w-full' },
            { key: 'consignee_address', label: 'Consignee Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'country_destination', label: 'Country of Destination', type: 'text', required: true, width: 'w-1/2' },
            { type: 'heading', label: '3. Transport Details' },
            { key: 'departure_date', label: 'Departure Date', type: 'date', required: true, width: 'w-1/3' },
            { key: 'vessel_aircraft', label: 'Vessel/Aircraft Name', type: 'text', width: 'w-1/3' },
            { key: 'transport_mode', label: 'Mode of Transport', type: 'select', options: ['AIR', 'SEA', 'ROAD', 'RAIL'], width: 'w-1/3' },
            { key: 'port_loading', label: 'Port of Loading', type: 'text', width: 'w-1/2' },
            { key: 'port_discharge', label: 'Port of Discharge', type: 'text', width: 'w-1/2' },
            { type: 'heading', label: '5-10. Goods Details' },
            { key: 'marks_numbers', label: 'Marks and Numbers on Packages', type: 'textarea', width: 'w-1/2' },
            { key: 'description_goods', label: 'Description of Goods', type: 'textarea', required: true, width: 'w-1/2' },
            { key: 'origin_criterion', label: 'Origin Criterion', type: 'select', options: ['P - Wholly Produced', 'W - Wholly Obtained', 'PE - Product Specific Rule'], value: 'P', width: 'w-1/3' },
            { key: 'gross_weight', label: 'Gross Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'number_packages', label: 'Number of Packages', type: 'number', width: 'w-1/3' },
            { key: 'invoice_no', label: 'Invoice Number', type: 'text', required: true, width: 'w-1/2' },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: 'w-1/2' },
            { type: 'heading', label: '11-12. Certification & Declaration' },
            { key: 'certifying_authority', label: 'Certifying Authority', type: 'text', value: 'MUMBAI CHAMBER OF COMMERCE & INDUSTRY', width: 'w-full' },
            { key: 'certification_date', label: 'Certification Date', type: 'date', required: true, width: 'w-1/2' },
            { key: 'declaration_place', label: 'Place of Declaration', type: 'text', value: 'MUMBAI', width: 'w-1/2' }
        ]
    },
    'NON_DG': {
        id: 'NON_DG',
        title: 'Non-DG Declaration',
        desc: 'A mandatory declaration for air freight certifying that the shipment contains no dangerous goods (explosives, flammables, etc.) restricted by IATA regulations, ensuring flight safety.',
        fields: [
            { key: 'reference_id', label: 'Reference ID', type: 'text', width: 'w-full', placeholder: 'Enter ID or leave blank for auto-generation' },
            { key: 'awb_number', label: 'DHL/AWB Number', type: 'text', required: true, width: 'w-1/3' },
            { key: 'mawb_number', label: 'MAWB Number', type: 'text', width: 'w-1/3' },
            { key: 'airport_departure', label: 'Airport of Departure', type: 'text', required: true, width: 'w-1/3' },
            { key: 'airport_destination', label: 'Airport of Destination', type: 'text', required: true, width: 'w-1/3' },
            { key: 'items', label: 'Cargo Details', type: 'nondg_table', width: 'w-full' },
            { key: 'total_packages', label: 'Total Number of Packages', type: 'number', width: 'w-1/3' },
            { key: 'net_weight', label: 'Net Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'gross_weight', label: 'Gross Weight (KGS)', type: 'number', width: 'w-1/3' },
            { key: 'shipper_name', label: 'Shipper Name', type: 'text', required: true, width: 'w-full' },
            { key: 'shipper_address', label: 'Shipper Address', type: 'textarea', required: true, width: 'w-full' },
            { key: 'signatory_name', label: 'Signatory Full Name', type: 'text', required: true, width: 'w-1/2' },
            { key: 'signatory_designation', label: 'Signatory Designation', type: 'text', required: true, width: 'w-1/2' }
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
                const readonlyAttr = field.readonly ? 'readonly' : '';
                const readonlyClasses = field.readonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';
                const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';

                if (field.type === 'select') {
                    const onChangeAttr = field.key === 'currency' ? 'onchange="fetchExchangeRate(this.value)"' : '';
                    const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                    inputHtml = `<select name="${field.key}" ${onChangeAttr} class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">${options}</select>`;
                } else if (field.type === 'items_table') {
                    inputHtml = `
                        <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th class="px-2 py-2 w-10 text-center">#</th>
                                        <th class="px-2 py-2 w-24">Marks & No.</th>
                                        <th class="px-2 py-2 min-w-[150px]">Description</th>
                                        <th class="px-2 py-2 w-24">HSN</th>
                                        <th class="px-2 py-2 w-20">Qty</th>
                                        <th class="px-2 py-2 w-20">Unit</th>
                                        <th class="px-2 py-2 w-28">Rate (INR)</th>
                                        <th class="px-2 py-2 w-28">Amt (INR)</th>
                                        <th class="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody id="doc-items-body"></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="8" class="px-2 py-2 bg-gray-50 border-t"><button type="button" onclick="addDocItemRow()" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Item</button></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    `;
                } else if (field.type === 'nondg_table') {
                    inputHtml = `
                        <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th class="px-2 py-2 w-32">Marks & Numbers</th>
                                        <th class="px-2 py-2 min-w-[200px]">Description of Goods</th>
                                        <th class="px-2 py-2 w-24">Net Quantity</th>
                                        <th class="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody id="nondg-items-body"></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="px-2 py-2 bg-gray-50 border-t"><button type="button" onclick="addNonDGRow()" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Item</button></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    `;
                } else if (field.type === 'neg_table') {
                    inputHtml = `
                        <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th class="px-2 py-2 w-32">Marks & Numbers</th>
                                        <th class="px-2 py-2 min-w-[200px]">Description & Quantity</th>
                                        <th class="px-2 py-2 w-32">Country of Origin</th>
                                        <th class="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody id="neg-items-body"></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="4" class="px-2 py-2 bg-gray-50 border-t"><button type="button" onclick="addNegRow()" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Silk Item</button></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    `;
                } else if (field.type === 'mcd_table') {
                    inputHtml = `
                        <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th class="px-2 py-2 w-20">Marks</th>
                                        <th class="px-2 py-2 min-w-[120px]">Description</th>
                                        <th class="px-2 py-2 min-w-[120px]">Manufacturing Ops</th>
                                        <th class="px-2 py-2 w-24">Mfg Date</th>
                                        <th class="px-2 py-2 w-20">Mfg Country</th>
                                        <th class="px-2 py-2 min-w-[100px]">Material Desc</th>
                                        <th class="px-2 py-2 w-24">Material Date</th>
                                        <th class="px-2 py-2 w-20">Production Country</th>
                                        <th class="px-2 py-2 w-24">Export Date</th>
                                        <th class="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody id="mcd-items-body"></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="10" class="px-2 py-2 bg-gray-50 border-t"><button type="button" onclick="addMCDRow()" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Item</button></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    `;
                } else if (field.type === 'packing_table') {
                    inputHtml = `
                        <div class="w-full overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                    <tr>
                                        <th class="px-2 py-2 w-16">Carton#</th>
                                        <th class="px-2 py-2 min-w-[150px]">Description</th>
                                        <th class="px-2 py-2 w-20">Qty</th>
                                        <th class="px-2 py-2 w-20">N.W.</th>
                                        <th class="px-2 py-2 w-20">G.W.</th>
                                        <th class="px-2 py-2 w-32">Dims (LxBxH)</th>
                                        <th class="px-2 py-2 w-20">Vol.Wt</th>
                                        <th class="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody id="pkl-items-body"></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="8" class="px-2 py-2 bg-gray-50 border-t"><button type="button" onclick="addPackingRow()" class="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wide flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Package</button></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    `;
                } else if (field.type === 'textarea') {
                    inputHtml = `<textarea name="${field.key}" rows="4" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readonlyClasses}" ${readonlyAttr} ${placeholderAttr}>${field.value || ''}</textarea>`;
                } else {
                    const stepAttr = field.type === 'number' ? 'step="any"' : '';
                    inputHtml = `<input type="${field.type}" name="${field.key}" value="${field.value || ''}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readonlyClasses}" ${readonlyAttr} ${placeholderAttr} ${stepAttr}>`;
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
            
            <div class="flex flex-wrap justify-center items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <button onclick="document.getElementById('doc-form').reset()" class="p-2 text-gray-600 hover:text-orange-600 hover:bg-white rounded-md transition-all shadow-sm" title="Reset Form">
                    <i class="fa-solid fa-eraser"></i>
                </button>
                <button onclick="handleGenerate('${schema.id}')" class="p-2 text-blue-600 hover:text-blue-800 hover:bg-white rounded-md transition-all shadow-sm" title="Generate Document">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </button>
                <div class="w-px h-6 bg-gray-300 mx-1 self-center"></div>
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

    // --- Special Handling for Dynamic Items Table ---
    if (docId === 'COM_INV') {
        const descs = formData.getAll('item_desc[]');
        if (descs.length > 0) {
            const marks = formData.getAll('item_marks[]');
            const hsns = formData.getAll('item_hsn[]');
            const qtys = formData.getAll('item_qty[]');
            const units = formData.getAll('item_unit[]');
            const rates = formData.getAll('item_rate[]');
            
            data.products = descs.map((desc, i) => ({
                sno: i + 1,
                marks: marks[i] || '',
                desc: desc,
                hsn: hsns[i] || '',
                qty: parseFloat(qtys[i] || 0),
                unit: units[i] || '',
                rate: parseFloat(rates[i] || 0),
                amount: (parseFloat(qtys[i] || 0) * parseFloat(rates[i] || 0))
            }));
        }
    }

    // --- Special Handling for NON_DG Table ---
    if (docId === 'NON_DG') {
        const marks = formData.getAll('nondg_marks[]');
        if (marks.length > 0) {
            const descs = formData.getAll('nondg_desc[]');
            const qtys = formData.getAll('nondg_qty[]');
            
            data.nondgItems = marks.map((mark, i) => ({
                marks: mark,
                description: descs[i] || '',
                quantity: qtys[i] || ''
            }));
        }
    }

    // --- Special Handling for NEG_DEC Table ---
    if (docId === 'NEG_DEC') {
        const marks = formData.getAll('neg_marks[]');
        if (marks.length > 0) {
            const descs = formData.getAll('neg_desc[]');
            const countries = formData.getAll('neg_country[]');
            
            data.negItems = marks.map((mark, i) => ({
                marks: mark,
                description: descs[i] || '',
                country: countries[i] || ''
            }));
        }
    }

    // --- Special Handling for MCD Table ---
    if (docId === 'MCD') {
        const marks = formData.getAll('mcd_marks[]');
        if (marks.length > 0) {
            const descs = formData.getAll('mcd_desc[]');
            const mfgOps = formData.getAll('mcd_mfg_ops[]');
            const mfgDates = formData.getAll('mcd_mfg_date[]');
            const mfgCountries = formData.getAll('mcd_mfg_country[]');
            const materials = formData.getAll('mcd_material[]');
            const materialDates = formData.getAll('mcd_material_date[]');
            const prodCountries = formData.getAll('mcd_prod_country[]');
            const exportDates = formData.getAll('mcd_export_date[]');
            
            data.mcdItems = marks.map((mark, i) => ({
                marks: mark,
                description: descs[i] || '',
                mfgOps: mfgOps[i] || '',
                mfgDate: mfgDates[i] || '',
                mfgCountry: mfgCountries[i] || '',
                material: materials[i] || '',
                materialDate: materialDates[i] || '',
                prodCountry: prodCountries[i] || '',
                exportDate: exportDates[i] || ''
            }));
        }
    }

    // --- Special Handling for DELIVERY_CHALLAN (both products and packages) ---
    if (docId === 'DELIVERY_CHALLAN') {
        // Handle products table
        const descs = formData.getAll('item_desc[]');
        if (descs.length > 0) {
            const marks = formData.getAll('item_marks[]');
            const hsns = formData.getAll('item_hsn[]');
            const qtys = formData.getAll('item_qty[]');
            const units = formData.getAll('item_unit[]');
            const rates = formData.getAll('item_rate[]');
            
            data.products = descs.map((desc, i) => ({
                sno: i + 1,
                marks: marks[i] || '',
                desc: desc,
                hsn: hsns[i] || '',
                qty: parseFloat(qtys[i] || 0),
                unit: units[i] || '',
                rate: parseFloat(rates[i] || 0),
                amount: (parseFloat(qtys[i] || 0) * parseFloat(rates[i] || 0))
            }));
        }
        
        // Handle packages table
        const cartons = formData.getAll('pkl_carton[]');
        if (cartons.length > 0) {
            const pdescs = formData.getAll('pkl_desc[]');
            const pqtys = formData.getAll('pkl_qty[]');
            const nets = formData.getAll('pkl_net[]');
            const gross = formData.getAll('pkl_gross[]');
            const ls = formData.getAll('pkl_l[]');
            const bs = formData.getAll('pkl_b[]');
            const hs = formData.getAll('pkl_h[]');
            const vols = formData.getAll('pkl_vol[]');

            data.packages = cartons.map((c, i) => ({
                carton: c,
                desc: pdescs[i] || '',
                qty: pqtys[i] || '',
                net: parseFloat(nets[i] || 0),
                gross: parseFloat(gross[i] || 0),
                dims: `${ls[i]}x${bs[i]}x${hs[i]}`,
                vol: parseFloat(vols[i] || 0)
            }));
        }
    }

    // Visual Feedback
    const btn = document.querySelector(`button[onclick*="handleGenerate('${docId}')"]`);
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;

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
    const val = (key, fallback = '____________________') => data[key] || fallback;
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
 * Generates a generic print view for any document schema.
 * @param {string} docId 
 * @param {object} data 
 */
function generatePrintView(docId, data) {
    // Special handling for specific document types
    if (docId === 'KYC') {
        generateKYCPrintView(data);
        return;
    }
    if (docId === 'COM_INV') {
        generateCommercialInvoicePrintView(data);
        return;
    }
    if (docId === 'PKL') {
        generatePackingListPrintView(data);
        return;
    }
    if (docId === 'SDF') {
        generateSDFPrintView(data);
        return;
    }
    if (docId === 'ANN_1') {
        generateAnnexure1PrintView(data);
        return;
    }
    if (docId === 'SLI') {
        generateSLIPrintView(data);
        return;
    }
    if (docId === 'ANN_2') {
        generateAnnexure2PrintView(data);
        return;
    }
    if (docId === 'APP_3') {
        generateAppendix3PrintView(data);
        return;
    }
    if (docId === 'APP_4') {
        generateAppendix4PrintView(data);
        return;
    }
    if (docId === 'APP_2') {
        generateAppendix2PrintView(data);
        return;
    }
    if (docId === 'ANN_C1') {
        generateAnnexureC1PrintView(data);
        return;
    }
    if (docId === 'SCD') {
        generateSingleCountryDeclarationPrintView(data);
        return;
    }
    if (docId === 'MCD') {
        generateMultipleCountryDeclarationPrintView(data);
        return;
    }
    if (docId === 'NEG_DEC') {
        generateNegativeDeclarationPrintView(data);
        return;
    }
    if (docId === 'QUOTA') {
        generateQuotaChargeStatementPrintView(data);
        return;
    }
    if (docId === 'NON_DG') {
        generateNonDGPrintView(data);
        return;
    }
    if (docId === 'TSCA') {
        generateTSCAPrintView(data);
        return;
    }
    if (docId === 'GR_SAMPLE') {
        generateGRSamplePrintView(data);
        return;
    }
    if (docId === 'GR_REPAIR') {
        generateGRRepairPrintView(data);
        return;
    }
    if (docId === 'MSDS') {
        generateMSDSPrintView(data);
        return;
    }
    if (docId === 'TAX_CHALLAN') {
        generateTaxChallanPrintView(data);
        return;
    }
    if (docId === 'LOA') {
        generateLOAPrintView(data);
        return;
    }
    if (docId === 'COO') {
        generateCOOPrintView(data);
        return;
    }
    if (docId === 'ANN_D') {
        generateAnnexureDPrintView(data);
        return;
    }
    if (docId === 'DELIVERY_CHALLAN') {
        generateDeliveryChallanPrintView(data);
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
 * Generates the specific Annexure-I for Drawback print view.
 */
function generateAnnexure1PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Annexure I - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 12px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            .document-preview { background: white; padding: 40px; border: 1px solid #ddd; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.1); font-weight: bold; z-index: 1; }
            .document-content { position: relative; z-index: 2; }
            .form-title { text-align: center; font-size: 18px; font-weight: bold; color: #c62828; margin-bottom: 20px; text-decoration: underline; }
            .field-group { margin: 15px 0; }
            .field-label { font-weight: bold; display: block; margin-bottom: 5px; color: #555; }
            .field-input { border: none; border-bottom: 1px solid #000; padding: 2px 5px; font-family: monospace; }
            .declaration-box { background: #ffebee; padding: 25px; border: 1px solid #ffcdd2; margin: 25px 0; border-radius: 5px; line-height: 1.8; font-size: 12px; }
            .checkbox-item { margin: 10px 0; }
            .checkbox-box { display: inline-block; width: 16px; height: 16px; border: 1px solid #000; margin-right: 10px; vertical-align: middle; }
            .checkbox-box.checked:after { content: '✓'; display: block; text-align: center; font-weight: bold; }
            .signature-section { margin-top: 60px; padding-top: 20px; border-top: 2px solid #c62828; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .company-stamp { width: 150px; height: 80px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; margin-top: 10px; }
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
                <div class="watermark">ANNEXURE-I</div>
                <div class="document-content">
                    <div class="form-title">
                        ANNEXURE-I<br>
                        <small>Exporters' Declaration required for Exports of Woven Garments for availing higher All Industry Rate of Drawback</small><br>
                        <small style="font-size: 10px;">(Circular No.54/2001-Cus, dated 19th October, 2001)</small>
                    </div>
                    <div class="field-group">
                        <div class="field-label">1. Description of the Goods:</div>
                        <span class="field-input" style="width: 100%; display: block;">${val('goods_description')}</span>
                    </div>
                    <div class="field-group">
                        <div class="field-label">2. Invoice No. and Date:</div>
                        <span class="field-input">${val('invoice_no')} Dated: ${val('invoice_date')}</span>
                    </div>
                    <div class="field-group">
                        <div class="field-label">3. Name and address of the Exporter alongwith the name of the jurisdictional Central Excise Commissionerate/Division/Range:</div>
                        <div style="border: 1px solid #ddd; padding: 10px; margin-top: 5px; white-space: pre-line;">${val('exporter_address')}</div>
                    </div>
                    <div class="field-group">
                        <div class="field-label">4. Name of the Supporting Manufacturer(s)/Job worker(s) alongwith the name of the Jurisdictional Central Excise Commissionerate/Division/Range:</div>
                        <div style="border: 1px solid #ddd; padding: 10px; margin-top: 5px; white-space: pre-line;">${val('manufacturer_address')}</div>
                    </div>
                    <div class="field-group">
                        <div class="field-label">5. Address of the Manufacturing Unit(s)/Job Work Premises:</div>
                        <span class="field-input" style="width: 100%; display: block;">${val('manufacturing_unit_address')}</span>
                    </div>
                    <div class="declaration-box">
                        We, M/S. <strong>${val('exporter_name')}</strong>, the Exporters of the above mentioned goods, hereby declare that - 
                        <div class="checkbox-item"><span class="checkbox-box checked"></span>(a) we are not registered with Central Excise authorities,</div>
                        <div class="checkbox-item"><span class="checkbox-box checked"></span>(b) we have not paid any Central Excise duty on these goods, and</div>
                        <div class="checkbox-item"><span class="checkbox-box checked"></span>(c) we have not availed of the Cenvat facility under the CENVAT Credit Rules, 2001 or any notification issued thereunder, and</div>
                        <div class="checkbox-item"><span class="checkbox-box checked"></span>(d) we have not authorized any supporting manufacturer/job-worker to pay excise duty and discharge the liabilities and comply with the provisions of Central Excise (No.2) Rules, 2001, under the proviso to Rule 4(3) of the said Rules.</div>
                        <div style="margin-top: 20px;">We also undertake that in case it is discovered that the Cenvat facility has been availed by us or by our supporting manufacturers in respect of these export goods, we shall return the excess drawback paid to us on the basis of above declaration.</div>
                    </div>
                    <div class="signature-section">
                        <div style="float: left;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Date: ${val('declaration_date')}</div>
                            <div class="signature-line"></div>
                            <div style="font-weight: bold; margin-bottom: 5px;">Exporters' Signature & Seal</div>
                        </div>
                        <div style="float: right;"><div class="company-stamp">EXPORTER'S<br>STAMP</div></div>
                        <div style="clear: both;"></div>
                        <div style="margin-top: 20px;">
                            <div class="field-label">Name & Address of Exporter:</div>
                            <div style="padding: 10px; border: 1px solid #ddd; font-family: monospace; white-space: pre-line;">${val('exporter_name')}\n${val('exporter_address')}</div>
                        </div>
                    </div>
                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 10px; border-top: 1px solid #ddd;">
                        Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Annexure I DOC-005
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Shipper's Letter of Instructions print view.
 */
function generateSLIPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isSelected = (field, value) => data[field] === value ? 'checked' : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Shipper's Letter - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: #fff; padding: 20px; font-size: 11px; }
            .container { width: 1123px; min-height: 794px; background: white; margin: 0 auto; padding: 30px; }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 20px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .header-table td { padding: 5px; vertical-align: top; }
            .section-box { border: 1px solid #000; padding: 10px; margin: 10px 0; }
            .section-title { font-weight: bold; font-size: 12px; margin-bottom: 8px; text-decoration: underline; }
            .field-label { font-weight: bold; display: inline-block; width: 120px; font-size: 11px; }
            .field-value { font-family: 'Courier New', monospace; font-size: 11px; }
            .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin-right: 5px; position: relative; top: 2px; }
            .checkbox.checked:after { content: '✓'; display: block; text-align: center; font-size: 10px; line-height: 12px; }
            .circle { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; border-radius: 50%; margin-right: 5px; position: relative; top: 3px; }
            .circle.checked:after { content: '●'; display: block; text-align: center; font-size: 12px; line-height: 14px; }
            .yes-no-box { margin: 15px 0; }
            .yes-no-item { display: inline-block; margin-right: 20px; font-size: 11px; }
            .document-list { column-count: 2; margin: 15px 0; }
            .document-item { margin-bottom: 5px; font-size: 11px; break-inside: avoid; }
            .signature-area { margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .stamp-area { float: right; width: 150px; height: 80px; border: 2px dashed #666; text-align: center; padding-top: 30px; font-size: 10px; color: #666; margin-top: 20px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="container">
            <div class="form-title">SHIPPER'S LETTER OF INSTRUCTIONS</div>
            <table class="header-table">
                <tr>
                    <td width="50%">
                        <div class="field-label">Shipper Name:</div>
                        <span class="field-value">${val('shipper_name')}</span>
                    </td>
                    <td width="50%" align="right">
                        <div class="field-label">Date:</div>
                        <span class="field-value">${val('sli_date')}</span>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="field-label">Consignee Name:</div>
                        <span class="field-value">${val('consignee_name')}</span>
                    </td>
                    <td align="right">
                        <div class="field-label">Invoice No:</div>
                        <span class="field-value">${val('invoice_no')}</span>
                    </td>
                </tr>
            </table>
            <hr style="border: 1px solid #000; margin: 15px 0;">
            <div class="section-box">
                <div class="section-title">E CODE NO (10 DIGIT):</div>
                <span class="field-value">${val('e_code')}</span>
                <div class="section-title" style="margin-top: 15px;">BANK AD CODE # (PART I & II):</div>
                <span class="field-value">${val('bank_ad_code')}</span>
                <table width="100%" style="margin-top: 15px;">
                    <tr>
                        <td width="33%">
                            <div class="field-label">CURRENCY OF INVOICE:</div>
                            <span class="field-value">${val('currency')}</span>
                        </td>
                        <td width="33%">
                            <div class="field-label">INCOTERMS:</div>
                            <span class="field-value">
                                <span class="checkbox ${isSelected('incoterms', 'FOB')}"></span> F O B /
                                <span class="checkbox ${isSelected('incoterms', 'C&F')}"></span> C & F /
                                <span class="checkbox ${isSelected('incoterms', 'C&I')}"></span> C & I /
                                <span class="checkbox ${isSelected('incoterms', 'CIF')}"></span> C I F
                            </span>
                        </td>
                        <td width="33%">
                            <div class="field-label">NATURE OF PAYMENT:</div>
                            <span class="field-value">
                                <span class="checkbox ${isSelected('payment_terms', 'DP')}"></span> D P /
                                <span class="checkbox ${isSelected('payment_terms', 'DA')}"></span> D A /
                                <span class="checkbox ${isSelected('payment_terms', 'AP')}"></span> A P /
                                <span class="checkbox ${isSelected('payment_terms', 'OTHERS')}"></span> OTHERS
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="grid-container">
                <div class="section-box">
                    <div class="section-title">Details to be declared for preparation of Shipping Bill</div>
                    <table width="100%">
                        <tr><td width="40%">FOR VALUE:</td><td><span class="field-value">${val('currency')} ${val('invoice_value')}</span></td></tr>
                        <tr><td>FREIGHT (IF ANY):</td><td><span class="field-value">${val('currency')} ${val('freight') || '0.00'}</span></td></tr>
                        <tr><td>INSURANCE (IF ANY):</td><td><span class="field-value">${val('currency')} ${val('insurance') || '0.00'}</span></td></tr>
                        <tr><td>COMMISSION (IF ANY):</td><td><span class="field-value">${val('currency')} ${val('commission') || 'NIL'}</span></td></tr>
                        <tr><td>DISCOUNT (IF ANY):</td><td><span class="field-value">${val('currency')} ${val('discount') || 'NIL'}</span></td></tr>
                    </table>
                </div>
                <div class="section-box">
                    <div class="section-title">Description of Goods to be declared on Shipping Bill</div>
                    <table width="100%">
                        <tr><td width="40%">NO. OF PKGS.:</td><td><span class="field-value">${val('no_of_pkgs')}</span></td></tr>
                        <tr><td>NET WT.:</td><td><span class="field-value">${val('net_weight')} KGS</span></td></tr>
                        <tr><td>GROSS WT.:</td><td><span class="field-value">${val('gross_weight')} KGS</span></td></tr>
                        <tr><td>VOLUME WT.:</td><td><span class="field-value">${val('volume_weight')} KGS</span></td></tr>
                    </table>
                </div>
            </div>
            <div class="section-box">
                <div class="section-title">Please TICK & LIST the documents provided to ${val('forwarder_name')} with the shipment:</div>
                <div class="document-list">
                    <div class="document-item"><span class="checkbox checked"></span> 1. INVOICE (4 COPIES)</div>
                    <div class="document-item"><span class="checkbox checked"></span> 2. PACKING LIST (4 COPIES)</div>
                    <div class="document-item"><span class="checkbox checked"></span> 3. SDF FORM IN DUPLICATE</div>
                    <div class="document-item"><span class="checkbox checked"></span> 4. NON-DG DECLARATION</div>
                    <div class="document-item"><span class="checkbox checked"></span> 5. PURCHASE ORDER COPY</div>
                    <div class="document-item"><span class="checkbox"></span> 6. GR FORM/GR WAIVER</div>
                    <div class="document-item"><span class="checkbox"></span> 7. ARE-I FORM IN DUPLICATE</div>
                    <div class="document-item"><span class="checkbox"></span> 8. VISA/AEPC ENDORSEMENT</div>
                    <div class="document-item"><span class="checkbox"></span> 9. LAB ANALYSIS REPORT</div>
                    <div class="document-item"><span class="checkbox"></span> 10. MSDS</div>
                    <div class="document-item"><span class="checkbox"></span> 11. PHYTOSANITARY CERT</div>
                    <div class="document-item"><span class="checkbox"></span> 12. GSP CERTIFICATE</div>
                </div>
            </div>
            <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; font-size: 11px;">
                <div class="section-title">SPECIAL INSTRUCTIONS:</div>
                <div style="margin-top: 10px;">${val('special_instructions')}</div>
            </div>
            <div class="signature-area">
                <div style="font-size: 11px; margin-bottom: 20px;">
                    We hereby confirm that the above details declared are true and correct.<br>
                    We confirm that our company's IEC & Bank AD Code Details are registered with EDI System of Air Cargo.<br>
                    * LC (Letter of Credit) Shipments are not handled by ${val('forwarder_name')}
                </div>
                <div class="stamp-area">EXPORTER STAMP</div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 11px; font-weight: bold;">SIGNATURE OF EXPORTER</div>
            </div>
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 10px; border-top: 1px solid #ddd;">
                Shipper's Letter of Instructions - DOC-012 | Generated: ${new Date().toLocaleString()}
            </div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Annexure-II for Drawback print view.
 */
function generateAnnexure2PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Annexure II - ${val('invoice_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .form-title small { font-size: 12px; display: block; margin-top: 5px; }
            .field-group { margin: 15px 0; }
            .field-label { font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px; }
            .field-input { width: 100%; border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 0; }
            .declaration-box { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin: 25px 0; line-height: 1.6; font-size: 12px; }
            .checkbox-item { margin: 8px 0; }
            .checkbox-box { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 8px; vertical-align: middle; background: #000; }
            .signature-area { margin-top: 60px; padding-top: 20px; border-top: 2px solid #000; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .stamp-area { float: right; width: 120px; height: 60px; border: 2px dashed #666; text-align: center; padding-top: 20px; font-size: 10px; color: #666; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">
                ANNEXURE-II<br>
                <small>Supporting Manufacturers/Job Workers' Declaration required for Exports of Woven Garments for availing higher All Industry Rate of Drawback.</small><br>
                <small>(Circular No.54/2001-Cus, dated 19th October, 2001).</small>
            </div>
            <div class="field-group">
                <div class="field-label">1. Description of the Goods:</div>
                <span class="field-input">${val('goods_description')}</span>
            </div>
            <div class="field-group">
                <div class="field-label">2. Invoice No. and Date:</div>
                <span class="field-input">${val('invoice_no')} Dated: ${val('invoice_date')}</span>
            </div>
            <div class="field-group">
                <div class="field-label">3. Name and address of the Exporter alongwith the name of the jurisdictional Central Excise Commissionerate/Division/Range:</div>
                <span class="field-input">${val('exporter_address')}</span>
            </div>
            <div class="field-group">
                <div class="field-label">4. Name of the Supporting Manufacturer(s)/Job worker(s) alongwith the name of the Jurisdictional Central Excise Commissionerate/Division/Range:</div>
                <span class="field-input">${val('manufacturer_address')}</span>
            </div>
            <div class="field-group">
                <div class="field-label">5. Address of the Manufacturing Unit(s)/Job Work Premises:</div>
                <span class="field-input">${val('manufacturing_unit_address')}</span>
            </div>
            <div class="declaration-box">
                We, M/S. <strong>${val('manufacturer_name')}</strong>, the supporting manufacturers/job workers declare that we 
                <div class="checkbox-item"><span class="checkbox-box"></span>(a) are not registered with Central Excise authorities,</div>
                <div class="checkbox-item"><span class="checkbox-box"></span>(b) have not paid any Central Excise duty on these goods, and</div>
                <div class="checkbox-item"><span class="checkbox-box"></span>(c) have not availed of the Cenvat facility under the CENVAT Credit Rules, 2001 or any notification issued thereunder,</div>
                <div style="margin-top: 15px;">and We also declare that we are manufacturing and supplying garments to the above merchant exporters only.</div>
            </div>
            <div class="signature-area">
                <div class="stamp-area">MANUFACTURER'S<br>STAMP</div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Supporting Manufacturers/Job Workers' Signature & Seal</div>
                <div style="margin-top: 30px;">
                    <div class="field-label">Name & Address of Manufacturer:</div>
                    <div style="padding: 10px; border: 1px solid #ddd; font-family: 'Courier New';">${val('manufacturer_name')}<br>${val('manufacturer_address')}</div>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Annexure II DOC-006</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Appendix III for Drawback print view.
 */
function generateAppendix3PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isExciseAvailed = data.excise_procedure === 'Availed under rule 191A/191B';
    const isDEECStatus = data.deec_status === 'Under DEEC';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Appendix III - ${val('shipping_bill_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; min-width: 200px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .strike-text { text-decoration: line-through; color: #999; }
            .active-text { color: #000; font-weight: bold; }
            .or-text { text-align: center; font-weight: bold; margin: 5px 0; }
            .market-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .market-table th, .market-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 60px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">APPENDIX III<br><small>(To be filled for export goods under claim for drawback)</small></div>
            <div style="margin-bottom: 20px;">Shipping Bill no. <span class="field-input">${val('shipping_bill_no')}</span> and date <span class="field-input">${val('shipping_bill_date')}</span></div>
            <div style="margin-bottom: 20px;">I/We <span class="field-input">${val('exporter_name')}</span> do hereby further declare as follows:</div>
            <div class="declaration-text">1. That the quality and specification of the foods as stated in this Shipping Bill are in accordance with the terms of the exports contract entered into with the buyer/consignee in pursuance of which the goods are being exported.</div>
            <div class="declaration-text">2. That we are not claiming benefit under "Engineering Products Export (Replenishment of Iron and Steel Intermediates) Scheme" notified vide Ministry of Commerce Notification No.539RE/92-97 dated 01.03.95.</div>
            <div class="declaration-text">3. That there is no chance in the manufacturing formula and in the quatum per unit of the imported material or components, if any, utilized in the manufacture of the export goods and that the materials or components which have been stated in the application under Rule 6 or Rule 7 to have been imported, continue to be so imported and are not been obtained from indigenous sources.</div>
            <div class="declaration-text">4. <span class="${isExciseAvailed ? 'strike-text' : 'active-text'}">A. That the export goods have not been manufactured by availing the procedure under rule 191A/191B or under Rule 12(1)(b)/13(1)(b) of the Central Excise rules,1944.</span></div>
            <div class="or-text">OR</div>
            <div class="declaration-text"><span class="${isExciseAvailed ? 'active-text' : 'strike-text'}">B. That the export goods have been manufactured by availing the procedure under rule 191A/191B or under Rule 12(1)(b)/13(1)(b) of the Central Excise rules,1944.</span></div>
            <div class="declaration-text">5. <span class="${isDEECStatus ? 'strike-text' : 'active-text'}">A. That the goods are not manufactured and/or exported in discharge of export obligation against an Advance Licence issued under the Duty Exemption Scheme (DEEC) vide relevant Import and Export Policy in force.</span></div>
            <div class="or-text">OR</div>
            <div class="declaration-text"><span class="${isDEECStatus ? 'active-text' : 'strike-text'}">B. That goods are not manufactured and are being exported in discharge of export obligation under the Duty Exemption Scheme (DEEC),but I/We are claiming drawback of only the Central Excise Portion of the duties on inputs specified in the Drawback Schedule except for the Central Excise Portion of duties on inputs permitted import free of Addl. Duty of customs against Advance Licence.</span></div>
            <div class="declaration-text">6. That the goods are not manufactured and/or exported after availing of the facility under the Passbook Scheme as contained in para 54 of the Export and Import Policy (April. 1992 -31st March, 1997).</div>
            <div class="declaration-text">7. That the goods are not manufactured and/or exported by a unit licensed as 100% Export Oriented Unit in terms of Import and Export Policy in force.</div>
            <div class="declaration-text">8. That the goods are not manufactured and/or exported by a unit situated in any Free Trade Zone/Export Processing Zone or any such Zone.</div>
            <div class="declaration-text">9. That the goods are not manufactured partly or wholly in bond under Section 65 of the Customs Act, 1962.</div>
            <div style="page-break-before: always; margin-top: 50px;">
                <div class="declaration-text">10. That the present Market Value of goods is as follows:</div>
                <table class="market-table">
                    <thead><tr><th width="10%">S.No</th><th width="30%">ITEM NO. IN INVOICE</th><th width="60%">MARKET VALUE</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td>Sample Product 1</td><td>USD 13.00 per piece</td></tr>
                        <tr><td>2</td><td>Sample Product 2</td><td>USD 9.25 per piece</td></tr>
                        <tr><td>3</td><td>Sample Product 3</td><td>USD 47.50 per set</td></tr>
                    </tbody>
                </table>
                <div class="declaration-text">11. That the export value of the goods covered by this Shipping Bill is not less than the total value of all imported materials used in manufacture of such goods.</div>
                <div class="declaration-text">12. That the market price of the goods being exported is not less than the drawback amount being claimed.</div>
                <div class="declaration-text">13. That the drawback amount claimed is more that 1% of the FOB value of the export product or the drawback amount claimed is less than 1% of the FOB value but more than Rs.500.00 against the Shipping Bill.</div>
                <div class="declaration-text">14. I/We undertake to repatriate export proceeds within 6 months from date of export and submit B.R.C to Asstt. Commissioner (Drawback). In case, the export proceeds are not realized within 6 months from the date of export, I/We will either furnish extension of time from R.B.I and submit B.R.C within such extended period or will pay back the drawback received against this Shipping Bill.</div>
            </div>
            <div class="signature-area">
                <div style="margin-bottom: 20px;">Date: <span class="field-input">${val('declaration_date')}</span></div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">For ${val('exporter_name')}</div>
                <div style="text-align: center; font-size: 11px;">NAME AND SIGNATURE OF THE EXPORTER</div>
                <div style="margin-top: 30px; font-size: 10px; color: #666;">(* Strike out whichever is not applicable)</div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 2 | Generated: ${new Date().toLocaleString()} | Appendix III DOC-007</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Appendix IV for Drawback print view.
 */
function generateAppendix4PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Appendix IV - ${val('shipping_bill_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">APPENDIX IV</div>
            <div style="font-size: 11px; text-align: center; margin-bottom: 20px;">
                (Declaration to be filed in respect of goods for which drawback under S.S.Nos.<br>
                03.01, 03.02, 04.01, 04.02, 04.03, 07.01, 07.02, 07.03, 08.01, 08.02, 08.03, 09.01, 09.02, 09.03, 16.01<br>
                16.02, 16.03, 17.01, 17.02, 17.03, 18.01, 18.02, 18.03, 19.01, 19.02, 19.03, 20.01, 20.02, 20.03,<br>
                20.06, 20.07, 20.10, 20.11, 20.12, 20.15, 20.16, 20.17, 21.01, 21.02, 21.03, 39.01, 39.03, 39.05,<br>
                39.06, 39.07, 39.09, 39.11, 39.12, 39.13, 39.14, 39.15, 39.16, 39.18, 39.19, 39.20, 39.24, 39.25,<br>
                39.27, 39.29, 40.06, 42.01, 42.02, 42.05, 42.06, 42.07, 42.10, 42.12, 42.14, 52.01, 52.03, 52.04,<br>
                52.05, 54.03, 54.04, 54.05, 54.06, 55.01, 55.02, 55.03, 55.04, 55.05, 56.04, 58.01, 58.02, 58.03, 58.04,<br>
                60.06, 60.10, 61.02, 61.05, 61.07, 62.02, 62.09, 62.10, 62.21, 63.03, 63.04, 63.061, 63.062, 63.07,<br>
                63.08, 63.10, 63.11, 64.01, 64.02, 64.03, 64.06, 64.07, 64.08, 64.09, 64.11, 71.02, 71.03, 71.05,<br>
                73.03, 73.11, 73.13, 73.15, 73.22, 74.02, 74.04, 74.05, 74.06, 74.07, 74.12, 74.17, 74.19, 74.20,<br>
                74.24, 76.03, 76.04, 82.01, 82.03, 82.031, 82.032, 83.07, 84.26, 84.54, 84.58, 85.37, 85.38, 85.39,<br>
                85.40, 85.45, 85.120, 85.154, 87.45, 90.07, 94.01, & 95.08 has been claimed).
            </div>
            <div style="margin-bottom: 30px;">Shipping Bill Number & Date <span class="field-input">${val('shipping_bill_no')} Dated: ${val('shipping_bill_date')}</span></div>
            <div style="margin-bottom: 30px;">I/We <span class="field-input">${val('exporter_name')}</span> do hereby declare as follows:</div>
            <div class="declaration-text">1. That no CENVAT facility has been availed for any of the inputs used in the manufacture of export products; and</div>
            <div class="declaration-text">2. That the goods are being exported under bond or claim for rebate of Central Excise duty and a certificate from concerned Superintendent of Central Excise, incharge of factory of production, to the effect that CENVAT facility has not been availed for the goods under export, is enclosed (Drawback as per schedule is applicable).</div>
            <div style="margin-top: 40px; padding: 15px; border: 1px solid #000; font-size: 11px;">
                <strong>Certificate from Superintendent of Central Excise:</strong><br>
                Certified that M/s. ${val('exporter_name')} has not availed CENVAT facility for the goods covered under Shipping Bill No. ${val('shipping_bill_no')}.
                <div style="margin-top: 30px;">
                    <div style="border-bottom: 1px solid #000; width: 250px; margin-bottom: 5px;"></div>
                    Signature of Superintendent of Central Excise<br>
                    Name: ${val('superintendent_name')}<br>
                    Designation: Superintendent of Central Excise<br>
                    ${val('excise_range')}
                </div>
            </div>
            <div class="signature-area">
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">(Name, Address & Signature of the Exporter)</div>
                <div style="margin-top: 30px;">
                    <strong>Name & Address:</strong><br>
                    ${val('exporter_name')}<br>
                    ${val('exporter_address')}
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Appendix IV DOC-008</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Appendix II for DEEC print view.
 */
function generateAppendix2PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const exciseProcedure = val('excise_procedure');
    const exportType = val('export_type');

    const strikeA = exciseProcedure === 'Not availed' ? '' : 'strike-text';
    const strikeB = exciseProcedure === 'Availed except notification 49/94-CE' ? '' : 'strike-text';
    const strikeC = exciseProcedure === 'Availed under rule 12(I)(b)/13(I)(b)' ? '' : 'strike-text';
    const strikeDirectExport = exportType === 'Direct by license holder' ? '' : 'strike-text';
    const strikeThirdParty = exportType === 'By third party' ? '' : 'strike-text';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Appendix II DEEC - ${val('shipping_bill_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .strike-text { text-decoration: line-through; color: #999; }
            .active-text { color: #000; font-weight: bold; }
            .or-text { text-align: center; font-weight: bold; margin: 5px 0; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">
                APPENDIX II<br>
                DEEC DECLARATION<br>
                <small>(To be filled for export of goods under DEEC scheme)</small>
            </div>
            <div style="margin-bottom: 30px;">
                Shipping Bill No. & Date: <span class="field-input">${val('shipping_bill_no')} Dated: ${val('shipping_bill_date')}</span>
            </div>
            <div style="margin-bottom: 30px;">
                I/We <span class="field-input">${val('exporter_name')}</span> do hereby further declare as follows:
            </div>
            <div class="declaration-text">
                1. <span class="${strikeA}">A. That the export goods have not been manufactured by availing the procedures under rule 12(I)(b)/13(I)(b) of the Central Excise Rules, 1994.</span>
            </div>
            <div class="or-text">OR</div>
            <div class="declaration-text">
                <span class="${strikeB}">B. That the export goods have not been manufactured by availing the procedure under rule 12(I)(b)/12(I)(b) of the Central excise Rules, 1994 in respect of the materials permitted to be imported duty free under the relevant license except the benefit under the notification number 49/94-CE (NT) dated 22/09/94.</span>
            </div>
            <div class="or-text">OR</div>
            <div class="declaration-text">
                <span class="${strikeC}">C. That the export goods have been manufactured by availing the procedure under rule 12(I)(b)/13(I)(b) of the Central Excise Rules, 1994.</span>
            </div>
            <div class="declaration-text">
                2. <span class="${strikeDirectExport}">(A) The export against this shipping bill is made directly by advance license holder</span>
            </div>
            <div class="or-text">OR</div>
            <div class="declaration-text">
                <span class="${strikeThirdParty}">(B) The export against this shipping bill is being made directly by third party(s) and a contractual agreement in this regard exists between the advance license holder and third party. all the export documents are signed by both advance license holder and exporter. In the event of any fraud – both will be severally and jointly responsible for such fraud and liable for penal action.</span>
            </div>
            <div style="font-size: 11px; margin: 20px 0; color: #666;">
                (* Strike out whichever is inapplicable)
            </div>
            <div style="margin-top: 60px;">
                <div style="font-weight: bold; font-size: 14px;">
                    Name of the Exporter:<br>
                    ${val('exporter_name')}
                </div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Signature of the Exporter</div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Appendix II DEEC DOC-010</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Annexure C1 for EOU print view.
 */
function generateAnnexureC1PrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isYes = (field) => data[field] === 'Yes' ? 'checked' : '';
    const isNo = (field) => data[field] === 'No' ? 'checked' : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Annexure C1 EOU - ${val('shipping_bill_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; }
            .form-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .form-table td { padding: 8px; border: 1px solid #000; vertical-align: top; font-size: 12px; }
            .form-label { font-weight: bold; width: 40%; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; width: 100%; }
            .signature-area { margin-top: 60px; }
            .signature-box { width: 250px; display: inline-block; margin-right: 20px; vertical-align: top; }
            .signature-line { width: 100%; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .yes-no { display: inline-block; margin-right: 15px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">APPENDIX -C1<br>OFFICE OF THE SUPERINTENDENT OF CENTRAL EXCISE</div>
            <table class="form-table">
                <tr>
                    <td class="form-label">Range</td>
                    <td>${val('range')}</td>
                    <td class="form-label">Division</td>
                    <td>${val('division')}</td>
                </tr>
                <tr>
                    <td class="form-label">Commissionerate</td>
                    <td colspan="3">${val('commissionerate')}</td>
                </tr>
                <tr>
                    <td class="form-label">C. No.</td>
                    <td>${val('certificate_no')}</td>
                    <td class="form-label">Date</td>
                    <td>${val('certificate_date')}</td>
                </tr>
                <tr>
                    <td class="form-label">Shipping Bill No.*</td>
                    <td>${val('shipping_bill_no')}</td>
                    <td class="form-label">Date</td>
                    <td>${val('shipping_bill_date')}</td>
                </tr>
                <tr>
                    <td class="form-label">1. Name of EOU:</td>
                    <td colspan="3">${val('eou_name')}</td>
                </tr>
                <tr>
                    <td class="form-label">2. IEC No. (of the EOU):</td>
                    <td colspan="3">${val('iec_no')}</td>
                </tr>
                <tr>
                    <td class="form-label">3. Factory address:</td>
                    <td colspan="3">${val('factory_address').replace(/\n/g, '<br>')}</td>
                </tr>
                <tr>
                    <td class="form-label">4. Date of examination:</td>
                    <td colspan="3">${val('examination_date')}</td>
                </tr>
                <tr>
                    <td class="form-label">5. Name and designation of the examining Officer-Inspector/EO/PO:</td>
                    <td colspan="3">${val('examining_officer')}</td>
                </tr>
                <tr>
                    <td class="form-label">6. Name & designation of the supervision Officer-Appraiser/Superintendent:</td>
                    <td colspan="3">${val('supervising_officer')}</td>
                </tr>
                <tr>
                    <td class="form-label">7. (a) Name of Commissionerate/Division/Range:</td>
                    <td colspan="3">${val('commissionerate')} / ${val('division')} / ${val('range')}</td>
                </tr>
                <tr>
                    <td class="form-label">(b) Location Code**</td>
                    <td colspan="3">${val('location_code')}</td>
                </tr>
                <tr>
                    <td class="form-label">8. Particulars of Export Invoice:</td>
                    <td colspan="3">
                        (a) Export Invoice No.: ${val('invoice_no')}<br>
                        (b) Total No. of packages: ${val('total_packages')}<br>
                        (c) Name and address of the consignee abroad: ${val('consignee_name').replace(/\n/g, '<br>')}
                    </td>
                </tr>
                <tr>
                    <td class="form-label">9. (a) Is the description of the goods, the Quantity and their value as per</td>
                    <td colspan="3">
                        <span class="yes-no">Yes <input type="radio" ${isYes('goods_description_correct')}></span>
                        <span class="yes-no">No <input type="radio" ${isNo('goods_description_correct')}></span>
                    </td>
                </tr>
                <tr>
                    <td class="form-label">(b) Whether sample is drawn for being forwarded to port of export?</td>
                    <td colspan="3">
                        <span class="yes-no">Yes <input type="radio" ${isYes('sample_drawn')}></span>
                        <span class="yes-no">No <input type="radio" ${isNo('sample_drawn')}></span>
                    </td>
                </tr>
                <tr>
                    <td class="form-label">10. (a) For Non-containerized cargo<br>Nos. of packages:Seal Nos</td>
                    <td colspan="3">${val('seal_details')}</td>
                </tr>
                <tr>
                    <td class="form-label">(b) For Containerized cargo:<br>Container No. Size Seal No.</td>
                    <td colspan="3">${val('container_details')}</td>
                </tr>
            </table>
            <div class="signature-area">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div style="text-align: center; font-size: 11px;">Signature of Exporter</div>
                    <div style="text-align: center; font-size: 11px; margin-top: 5px;">Name: ${val('eou_name')}</div>
                    <div style="text-align: center; font-size: 10px; margin-top: 5px;">Stamp:</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div style="text-align: center; font-size: 11px;">Signature of Examiner/Inspector</div>
                    <div style="text-align: center; font-size: 11px; margin-top: 5px;">Name: ${val('examining_officer')}</div>
                    <div style="text-align: center; font-size: 10px; margin-top: 5px;">Stamp:</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div style="text-align: center; font-size: 11px;">Signature of Appraiser/Superintendent</div>
                    <div style="text-align: center; font-size: 11px; margin-top: 5px;">Name: ${val('supervising_officer')}</div>
                    <div style="text-align: center; font-size: 10px; margin-top: 5px;">Stamp:</div>
                </div>
            </div>
            <div style="margin-top: 40px; font-size: 10px; line-height: 1.4;">
                <strong>Note:</strong><br>
                1. The office supervising the examination should attest Invoice(s) and any other document accompanying this<br>
                2. * To be filled in by the exporter before filing of this document at the time goods registration in the export shed.<br>
                3. * Revised 6 digit code as assigned by the Directorate of S & I, XXYYZZ<br>
                &nbsp;&nbsp;&nbsp;XX Commissionerate<br>
                &nbsp;&nbsp;&nbsp;YY Division<br>
                &nbsp;&nbsp;&nbsp;ZZ Range
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Annexure C1 EOU DOC-011</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Single Country Declaration print view.
 */
function generateSingleCountryDeclarationPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Single Country Declaration - ${val('declarant_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .country-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .country-table th, .country-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">Single Country Declaration</div>
            <div class="declaration-text">
                I, <span class="field-input">${val('declarant_name')}</span> declare that the articles listed below and covered by the invoice of entry to which this declaration relates are wholly the gross product or manufacture of a single foreign territory or country or insular possession of the U.S. of fabricated component which are in whole the product of U.S. as identified below. I declare that information set forth in this declaration is correct and true.
            </div>
            <div style="margin: 20px 0;">
                A <span class="field-input" style="width: 200px;">${val('country_origin')}</span><br>
                B <span class="field-input" style="width: 200px;">${val('country_b') || '________________'}</span><br>
                C <span class="field-input" style="width: 200px;">${val('country_c') || '________________'}</span><br>
                D <span class="field-input" style="width: 200px;">${val('country_d') || '________________'}</span>
            </div>
            <table class="country-table">
                <thead>
                    <tr>
                        <th width="20%">Marks of identification Numbers</th>
                        <th width="40%">Description of Article Quantity</th>
                        <th width="20%">Country of Origin</th>
                        <th width="20%">Date of Exportation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${val('marks_numbers').replace(/\n/g, '<br>')}</td>
                        <td>${val('description_goods').replace(/\n/g, '<br>')}</td>
                        <td>${val('country_origin')}</td>
                        <td>${val('exportation_date')}</td>
                    </tr>
                    <tr>
                        <td colspan="4" style="border: none; padding-top: 20px;">
                            <strong>Made in ${val('made_in_country')}</strong>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="signature-area">
                <div style="margin-bottom: 20px;">
                    Date: <span class="field-input">${val('declaration_date')}</span>
                </div>
                <div>
                    Name: <span class="field-input">${val('signatory_name')}</span>
                </div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px;">Signature</div>
                <div style="margin-top: 20px;">
                    Title: <span class="field-input">${val('signatory_title')}</span><br>
                    Company: <span class="field-input">${val('company_name')}</span><br>
                    Address: <span class="field-input">${val('company_address').replace(/\n/g, '<br>')}</span>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Single Country Declaration DOC-013</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Multiple Country Declaration print view.
 */
function generateMultipleCountryDeclarationPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const mcdItems = data.mcdItems || [];

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Multiple Country Declaration - ${val('declarant_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .country-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 9px; }
            .country-table th, .country-table td { border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top; }
            .signature-area { margin-top: 60px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">Multiple Country Textile Declaration</div>
            <div class="declaration-text">
                I, <span class="field-input">${val('declarant_name')}</span> declare that the articles described below and covered by the invoice or entry to which this declaration relates were exported from the countries* identified below on the dates listed and were subject to assembling, manufacturing or processing operations in, and/or incorporate materials originating in, the foreign territory or counties* or inj the U.S. or an insular possession of the U.S., identified below. I declare that the information set forth in this declaration is correct and true to the best of my knowledge, information and belief.
            </div>
            <div style="margin: 15px 0;">
                <strong>A. <span class="field-input" style="width: 150px;">${val('country_a')}</span></strong><br>
                <strong>B. <span class="field-input" style="width: 150px;">${val('country_b') || '________________'}</span></strong><br>
                <strong>C. <span class="field-input" style="width: 150px;">${val('country_c') || '________________'}</span></strong><br>
                <strong>D. <span class="field-input" style="width: 150px;">${val('country_d') || '________________'}</span></strong>
            </div>
            <table class="country-table">
                <thead>
                    <tr>
                        <th width="12%">Marks of Identification Numbers</th>
                        <th width="18%">Description of Article and Quantity</th>
                        <th width="20%">Description of Manufacturing and/or processing operations</th>
                        <th width="15%">Date and Country of Manufacturing and/or processing Country</th>
                        <th width="15%">Description of Material Date of Exportation</th>
                        <th width="10%">Country of Production</th>
                        <th width="10%">Date of Exportation</th>
                    </tr>
                </thead>
                <tbody>
                    ${mcdItems.map(item => `
                    <tr>
                        <td>${item.marks}</td>
                        <td>${item.description}</td>
                        <td>${item.mfgOps}</td>
                        <td>${item.mfgDate}<br>${item.mfgCountry}</td>
                        <td>${item.material}<br>${item.materialDate}</td>
                        <td>${item.prodCountry}</td>
                        <td>${item.exportDate}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <div class="signature-area">
                <div>
                    <strong>Name:</strong> <span class="field-input">${val('signatory_name')}</span>
                </div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px;">Signature</div>
                <div style="margin-top: 20px;">
                    <strong>Title:</strong> <span class="field-input">${val('signatory_title')}</span><br>
                    <strong>Company:</strong> <span class="field-input">${val('company_name')}</span><br>
                    <strong>Address:</strong> <span class="field-input">${val('company_address').replace(/\n/g, '<br>')}</span><br>
                    <strong>Date:</strong> <span class="field-input">${val('declaration_date')}</span>
                </div>
            </div>
            <div style="margin-top: 30px; font-size: 10px; font-style: italic;">
                *Country or countries when used in this declaration includes territories and U.S. insular possessions. The country will be identified in the above declaration by the alphabetical designation appearing next to the named country.
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Multiple Country Declaration DOC-014</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Negative Declaration print view.
 */
function generateNegativeDeclarationPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const negItems = data.negItems || [];

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Negative Declaration - ${val('declarant_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 20px 0; font-size: 12px; line-height: 1.4; }
            .goods-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .goods-table th, .goods-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">Negative Declaration</div>
            <div style="text-align: center; font-size: 12px; margin-bottom: 20px; font-style: italic;">
                (Negative declaration is required to be submitted by the Shipper when exporting Silk Garments, Fabric, Made-ups, where the content is more than 70%, to the USA)
            </div>
            <div class="declaration-text">
                I, <span class="field-input">${val('declarant_name')}</span> declare that the articles described below and covered by the invoice of entry to which this declaration relates are not subject to SECTION 204 Agricultural Act of 1956, as amended (7 USE 1854) and the information set forth in this declaration is correct and true to the best of my information, knowledge and belief.
            </div>
            <table class="goods-table">
                <thead>
                    <tr>
                        <th width="30%">Marks of identification Numbers</th>
                        <th width="50%">Description of Article & Quantity</th>
                        <th width="20%">Country of Origin</th>
                    </tr>
                </thead>
                <tbody>
                    ${negItems.map(item => `
                    <tr>
                        <td>${item.marks}</td>
                        <td>${item.description}</td>
                        <td style="font-weight: bold;">${item.country}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <div class="signature-area">
                <div style="margin-bottom: 20px;">
                    Date: <span class="field-input">${val('declaration_date')}</span>
                </div>
                <div>
                    Name: <span class="field-input">${val('signatory_name')}</span>
                </div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px;">Signature</div>
                <div style="margin-top: 20px;">
                    Title: <span class="field-input">${val('signatory_title')}</span><br>
                    Company: <span class="field-input">${val('company_name')}</span><br>
                    Address: <span class="field-input">${val('company_address').replace(/\n/g, '<br>')}</span>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Negative Declaration DOC-015</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific TSCA Certificate print view.
 */
function generateTSCAPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isPositive = data.certification_type === 'Positive Certification' ? 'checked' : '';
    const isNegative = data.certification_type === 'Negative Certification' ? 'checked' : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>TSCA Certificate - ${val('company_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .certification-box { margin: 20px 0; padding: 15px; border: 1px solid #000; }
            .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 8px; position: relative; top: 2px; }
            .checkbox.checked:after { content: '✓'; display: block; text-align: center; font-size: 12px; line-height: 14px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .contact-note { font-size: 10px; margin-top: 20px; font-style: italic; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">TOXIC SUBSTANCES CONTROL ACT (TSCA) CERTIFICATION</div>
            <div style="margin-bottom: 20px;">
                Date: <span class="field-input">${val('certificate_date')}</span>
            </div>
            <div style="margin: 20px 0; font-size: 12px;">
                (Check one section only)
            </div>
            <div class="certification-box">
                <div style="margin-bottom: 15px;">
                    <span class="checkbox ${isPositive}"></span> <strong>POSITIVE CERTIFICATION:</strong><br>
                    "I certify that all chemical substances in this shipment comply with all applicable rules and orders under TSCA and that I am not offering a chemical substance for entry in violation of TSCA or and applicable rule or order hereunder."
                </div>
                <div style="text-align: center; font-weight: bold; margin: 10px 0;">OR</div>
                <div>
                    <span class="checkbox ${isNegative}"></span> <strong>NEGATIVE CERTIFICATION:</strong><br>
                    "I certify that all chemicals in this shipment are not subject to TSCA."
                </div>
            </div>
            <div style="margin-top: 30px;">
                <div>
                    <strong>Company Name:</strong><br>
                    <span class="field-input" style="width: 400px;">${val('company_name')}</span>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Company Address:</strong><br>
                    <span class="field-input" style="width: 400px;">${val('company_address').replace(/\n/g, ', ')}</span>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Authorized Name:</strong><br>
                    <span class="field-input" style="width: 300px;">${val('authorized_name')}</span>
                </div>
            </div>
            <div class="signature-area">
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px;">Authorized Signature</div>
                <div style="margin-top: 20px;">
                    <strong>Title:</strong> <span class="field-input">${val('signatory_title')}</span>
                </div>
                <div style="margin-top: 15px;">
                    <strong>AIR WAYBILL:</strong> <span class="field-input">${val('awb_number')}</span>
                </div>
            </div>
            <div class="contact-note">
                If the certifier is unsure if them chemical substance is subject to TSCA compliance, contact the environmental protection agency, TSCA Assistance Office, D. C. (202) 554-1404 between 8:30 a.m. - 5:00 p.m. E.T
            </div>
            <div style="margin-top: 20px;">
                Date: <span class="field-input">${val('certificate_date')}</span>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | TSCA Certificate DOC-018</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific GR Waiver Free Sample print view.
 */
function generateGRSamplePrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>GR Waiver Free Sample - ${val('shipper_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .bank-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .bank-name { font-size: 18px; font-weight: bold; }
            .bank-address { font-size: 12px; }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .certification-text { margin: 20px 0; font-size: 12px; line-height: 1.6; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 60px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="bank-header">
                <div class="bank-name">${val('bank_name')}</div>
                <div class="bank-address">${val('bank_address').replace(/\n/g, '<br>')}</div>
            </div>
            <div style="margin-bottom: 30px;">
                To, <span class="field-input" style="width: 400px;">${val('customs_authority')}</span><br>
                Dated: <span class="field-input">${val('certificate_date')}</span>
            </div>
            <div class="form-title">FREE TRADE SAMPLE<br><small>SAMPLE OF BANK CERTIFICATE FOR FREE TRADE SAMPLE</small></div>
            <div style="margin-bottom: 20px;">
                <strong>Subject:</strong> Certificate of Free Trade Sample
            </div>
            <div class="certification-text">
                We certify that to the best of our knowledge and belief, the Free Trade Sample shipment being exported (details of which are given below) does not involve any transactions in foreign exchange as informed by the clients.
            </div>
            <div style="margin: 25px 0;">
                <strong>Name & Address of Shipper:</strong><br>
                <span class="field-input" style="width: 500px;">${val('shipper_name').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <strong>Name & Address of Consignee:</strong><br>
                <span class="field-input" style="width: 500px;">${val('consignee_name').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <strong>Description with clear model/serial/part number:</strong><br>
                <span class="field-input" style="width: 500px;">${val('description').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <table width="100%">
                    <tr>
                        <td width="50%">
                            <strong>Invoice number and Date:</strong><br>
                            <span class="field-input" style="width: 300px;">${val('invoice_no')} Dated: ${val('invoice_date')}</span>
                        </td>
                        <td width="50%">
                            <strong>Value of Goods as per Invoice:</strong><br>
                            <span class="field-input" style="width: 200px;">${val('invoice_value')}</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="certification-text">
                Kindly allow the export of the above detailed goods on Free Sample basis on completion of necessary customs and legal formalities.
            </div>
            <div class="signature-area">
                <div style="text-align: center; font-style: italic;">Thank you,</div>
                <div style="text-align: center; font-weight: bold; margin-top: 10px;">For, ${val('bank_name')}</div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Authorized Signatory</div>
                <div style="text-align: center; margin-top: 10px;">
                    Name: <span class="field-input">${val('bank_signatory')}</span><br>
                    Designation: <span class="field-input">${val('bank_designation')}</span>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | GR Waiver Free Sample DOC-019</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific GR Waiver Repair & Return print view.
 */
function generateGRRepairPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>GR Waiver Repair & Return - ${val('shipper_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .bank-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .bank-name { font-size: 18px; font-weight: bold; }
            .bank-address { font-size: 12px; }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .certification-text { margin: 20px 0; font-size: 12px; line-height: 1.6; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 60px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="bank-header">
                <div class="bank-name">${val('bank_name')}</div>
                <div class="bank-address">${val('bank_address').replace(/\n/g, '<br>')}</div>
            </div>
            <div style="margin-bottom: 30px;">
                To, <span class="field-input" style="width: 400px;">${val('customs_authority')}</span><br>
                Dated: <span class="field-input">${val('certificate_date')}</span>
            </div>
            <div class="form-title">REPAIR AND RETURN<br><small>SAMPLE OF BANK CERTIFICATE FOR REPAIR AND RETURN</small></div>
            <div style="margin-bottom: 20px;">
                <strong>Subject:</strong> Certificate of Re-Export
            </div>
            <div class="certification-text">
                We certify that to the best of our knowledge and belief, the Re-export (details of which are given below) does not involve any transactions in foreign exchange as informed by the clients.
            </div>
            <div style="margin: 25px 0;">
                <strong>Name & Address of Shipper:</strong><br>
                <span class="field-input" style="width: 500px;">${val('shipper_name').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <strong>Name & Address of Consignee:</strong><br>
                <span class="field-input" style="width: 500px;">${val('consignee_name').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <strong>Description with clear model/serial/part number:</strong><br>
                <span class="field-input" style="width: 500px;">${val('description').replace(/\n/g, ', ')}</span>
            </div>
            <div style="margin: 25px 0;">
                <table width="100%">
                    <tr>
                        <td width="50%">
                            <strong>Invoice number and Date:</strong><br>
                            <span class="field-input" style="width: 300px;">${val('invoice_no')} Dated: ${val('invoice_date')}</span>
                        </td>
                        <td width="50%">
                            <strong>Value of Goods as per Invoice:</strong><br>
                            <span class="field-input" style="width: 200px;">${val('invoice_value')}</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="margin: 25px 0;">
                <strong>Reason:</strong><br>
                <span class="field-input" style="width: 500px;">${val('repair_reason')}</span>
            </div>
            <div class="certification-text">
                Kindly allow the export of the above detailed goods on Repair & Return basis on completion of necessary customs and legal formalities.
            </div>
            <div class="signature-area">
                <div style="text-align: center; font-style: italic;">Thank you,</div>
                <div style="text-align: center; font-weight: bold; margin-top: 10px;">For, ${val('bank_name')}</div>
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Authorized Signatory</div>
                <div style="text-align: center; margin-top: 10px;">
                    Name: <span class="field-input">${val('bank_signatory')}</span><br>
                    Designation: <span class="field-input">${val('bank_designation')}</span>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | GR Waiver Repair & Return DOC-020</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Non-DG Declaration print view.
 */
function generateNonDGPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const nondgItems = data.nondgItems || [];
    const totalNet = parseFloat(val('net_weight')) || 0;
    const totalGross = parseFloat(val('gross_weight')) || 0;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Non-DG Declaration - ${val('awb_number')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .goods-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .goods-table th, .goods-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .notes-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin: 20px 0; font-size: 10px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">Shipper's Certification for Non - Hazardous Cargo</div>
            <table width="100%" style="margin-bottom: 20px; font-size: 12px;">
                <tr>
                    <td width="33%">
                        DHL/AWB no.: <span class="field-input">${val('awb_number')}</span>
                    </td>
                    <td width="33%" align="center">
                        Airport of Dep.: <span class="field-input">${val('airport_departure')}</span>
                    </td>
                    <td width="33%" align="right">
                        Airport of Dest.: <span class="field-input">${val('airport_destination')}</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="3" align="center">
                        MAWB no.: <span class="field-input">${val('mawb_number')}</span>
                    </td>
                </tr>
            </table>
            <div class="declaration-text">
                This is to certify that the articles / substances of this shipment are properly described by name that they are not listed in the current edition of IATA / Dangerous Goods Regulations (DGR), Alphabetical List of Dangerous Goods, nor do they correspond to any of the hazard classes appearing in the DGR, Section 3, classification of Dangerous goods and that they are known not to be dangerous, i.e., not restricted.
            </div>
            <div class="declaration-text">
                Furthermore the shipper confirms that the goods are in proper condition for transportation on passenger carrying aircraft (DGR, 8.1.23.) of International Air Transport Association (IATA)
            </div>
            <table class="goods-table">
                <thead>
                    <tr>
                        <th width="30%">Marks and Number of Packages</th>
                        <th width="50%">Proper description of goods / give technical name (Trade Names not Permitted) Specify each article separately</th>
                        <th width="20%">Net Quantity per package</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Shipper & Consignee Address on packages<br>${val('shipper_name')}<br>${val('shipper_address').replace(/\n/g, '<br>')}</td>
                        <td>
                            ${nondgItems.map((item, i) => `${i + 1}. ${item.description}`).join('<br>')}
                        </td>
                        <td>
                            ${nondgItems.map((item, i) => `${i + 1}. ${item.quantity}`).join('<br>')}
                        </td>
                    </tr>
                    <tr>
                        <td>TOTAL NUMBER of PACKAGES: ${val('total_packages')}</td>
                        <td></td>
                        <td>
                            NET WEIGHT: ${totalNet.toFixed(1)} KGS<br>
                            GROSS WEIGHT: ${totalGross.toFixed(1)} KGS
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="notes-box">
                <strong>To be completed in duplicate duly signed & stamped by shipper</strong><br>
                ONE COPY to be filed with the AWB copy at ORIGIN & ONE COPY to accompany DEST: AWB<br>
                Attach Lab Analysis Report, Material Safety Data Sheet for Bulk-Drugs/medicines/Chemicals/Cosmetics.<br>
                Please note that MSDS is available at www.msdssearch.com
            </div>
            <div class="signature-area">
                <div style="font-weight: bold; font-size: 14px;">
                    Name & Address of Shipper:<br>
                    ${val('shipper_name')}<br>
                    ${val('shipper_address').replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 30px;">
                    <table width="100%">
                        <tr>
                            <td width="33%">
                                FULL NAME<br>
                                <span class="field-input">${val('signatory_name')}</span>
                            </td>
                            <td width="33%">
                                DESIGNATION<br>
                                <span class="field-input">${val('signatory_designation')}</span>
                            </td>
                            <td width="33%">
                                SIGNATURE & COMPANY STAMP<br>
                                <div style="height: 40px;"></div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Non-DG Declaration DOC-017</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Quota Charge Statement print view.
 */
function generateQuotaChargeStatementPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isIncluded = data.quota_included === 'Yes' ? 'checked' : '';
    const isNotIncluded = data.quota_included === 'No' ? 'checked' : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Quota Charge Statement - ${val('company_name')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            @media print { .no-print { display: none; } }
            .form-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 40px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .statement-box { margin: 30px 0; padding: 20px; border: 1px solid #000; font-size: 12px; line-height: 1.6; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin: 0 5px; position: relative; top: 2px; }
            .checkbox.checked:after { content: '✓'; display: block; text-align: center; font-size: 10px; line-height: 12px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">Quota Charge Statement</div>
            <div style="height: 100px; border-bottom: 2px solid #000;"></div>
            <div class="statement-box">
                We, M/s <span class="field-input">${val('company_name')}</span>, shipper confirms that the foreign seller of the goods covered by invoice number <span class="field-input">${val('invoice_no')}</span> dated <span class="field-input">${val('invoice_date')}</span> the best of my knowledge and belief, the amount paid to obtain the Export Quota for the goods was <span class="field-input">${val('quota_amount')}</span> and paid by <span class="field-input">${val('paid_by')}</span> to <span class="field-input">${val('paid_to')}</span> (quota issuing authority) and such quota charge 
                <span class="checkbox ${isIncluded}"></span> is / <span class="checkbox ${isNotIncluded}"></span> is not included in the invoice unit price.
            </div>
            <div class="signature-area">
                <table width="100%" style="font-size: 12px;">
                    <tr>
                        <td width="50%">
                            Date: <span class="field-input">${val('statement_date')}</span>
                        </td>
                        <td width="50%" align="right">
                            Signature: _______________________
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Title: <span class="field-input">${val('signatory_title')}</span>
                        </td>
                        <td align="right">
                            Authorized Signature: _______________________
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding-top: 20px;">
                            Address: <span class="field-input" style="width: 500px;">${val('company_address').replace(/\n/g, ', ')}</span>
                        </td>
                    </tr>
                </table>
            </div>
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Quota Charge Statement DOC-016</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific MSDS print view.
 */
function generateMSDSPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>MSDS Template - DOC-021</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #000; }
            .section-content { font-size: 12px; line-height: 1.4; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .requirements-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin: 20px 0; font-size: 11px; font-weight: bold; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">16 POINT MSDS<br>LIST OF POINTS IN A MATERIAL SAFETY DATA SHEET</div>
            
            <div class="section">
                <div class="section-title">1. IDENTIFICATION OF THE SUBSTANCE / PREPARATION & THE COMPANY</div>
                <div class="section-content">
                    Name of the commodity & proper shipping name: <span class="field-input">${val('commodity_name')}</span><br>
                    Preparation: <span class="field-input">${val('preparation')}</span><br>
                    Manufacturing company name, address and emergency tel.: <span class="field-input">${val('manufacturer_name')} - ${val('manufacturer_address')}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">2. COMPOSITION / INFORMATION ON INGREDIENTS</div>
                <div class="section-content">
                    Details of ingredients with chemical name & family: <span class="field-input">${val('chemical_name')}</span><br>
                    Chemical formula CAS (Chemical Abstract Service) no.: <span class="field-input">${val('chemical_formula')}</span><br>
                    Index no. hazard Symbol: <span class="field-input">${val('index_number')}</span><br>
                    Risk phrases & United Nations number (UN no) wherever applicable: <span class="field-input">${val('risk_phrases')}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">3. HAZARDS IDENTIFICATION</div>
                <div class="section-content">
                    Will give details about reactions it may cause while in contact with skin, eye, Inhalation & ingestion.<br>
                    It will also give details of stability & materials to avoid while in transit or any hazardous reactions.
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">4. FIRST AID MEASURES</div>
                <div class="section-content">
                    Will give details of first aid measures to be taken in case of emergencies with regards skin, eyes, inhalation & ingestion.
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">5. FIRE FIGHTING MEASURES</div>
                <div class="section-content">
                    Will have information on what extinguishing media is to be used & what fire fighting equipment's are required
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">6. ACCIDENTAL RELEASE MEASURES</div>
                <div class="section-content">
                    Will give details on what measures are to be taken while handling the material in case of any accident.
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">7. HANDLING AND STORAGE</div>
                <div class="section-content">
                    Will give you information about handling of the material & storage (temperature control, packaging etc.)
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">8. EXPOSURE CONTROLS / PERSONAL PROTECTION</div>
                <div class="section-content">
                    Will give details on technical measures (ventilation if required), safety breathing apparatus, physical protection (hands, eyes, face etc)
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">9. PHYSICAL & CHEMICAL PROPERTIES</div>
                <div class="section-content">
                    Will give details about:<br>
                    Physical Form Colour Odour: <span class="field-input">${val('physical_form')}</span><br>
                    Melting Point, Density Vapour Pressure – Viscosity: <span class="field-input">${val('melting_point')}</span><br>
                    Solubility in water, soluble in ph value: <span class="field-input">${val('water_solubility')}</span><br>
                    Flash point, Ignition Temperature, Explosive Limits: <span class="field-input">${val('flash_point')}</span>
                </div>
            </div>
            
            <div style="page-break-before: always; margin-top: 50px;">
                <div class="section">
                    <div class="section-title">10. STABILITY & REACTIVITY</div>
                    <div class="section-content">
                        Will give details on the stability & reactivity of the material with respect to the various conditions.
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">11. TOXICOLOGICAL INFORMATION</div>
                    <div class="section-content">
                        Will give toxicity data of tests conducted on<br>
                        The test gives information on:<br>
                        Oral toxicity LD50 mg/kg – Dermal Toxicity LD 50 mg/kg: <span class="field-input">${val('oral_toxicity')} - ${val('dermal_toxicity')}</span><br>
                        Inhalation Toxicity LC 50 mg/kg: <span class="field-input">${val('inhalation_toxicity')}</span>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">12. ECOLOGICAL INFORMATION</div>
                    <div class="section-content">
                        Will give details of reaction of the materials with respect to the environment (air/water pollution etc.)
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">13. DISPOSAL CONSIDERATION</div>
                    <div class="section-content">
                        Will have information of disposal of the materials as per general rules.
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">14. TRANSPORT INFORMATION</div>
                    <div class="section-content">
                        Will have details of:<br>
                        Labeling & precautions to be taken while in transit (air, land & ship)<br>
                        It also gives UN no. class category: <span class="field-input">${val('transport_class')}</span>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">15. REGULATORY INFORMATIONS</div>
                    <div class="section-content">
                        Will give hazard identifications (label, symbol & description) with respect to the regulatory board.
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">16. OTHER INFORMATION</div>
                    <div class="section-content">
                        Any other commodity specific information not covered in the about point.
                    </div>
                </div>
            </div>
            
            <div class="requirements-box">
                INCLUDE ANY DISCLAIMERS<br>
                SHOULD BE FROM A GOVERNMENT / ITA RECOGNISED LAB
            </div>
            
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 2 of 2 | Generated: ${new Date().toLocaleString()} | MSDS Template DOC-021</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Tax Challan print view.
 */
function generateTaxChallanPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    
    let products = data.products || [];
    if (products.length === 0) {
        products = [{ sno: 1, desc: 'Sample Product', hsn: '0000', qty: 1, unit: 'PCS', rate: 100, amount: 100 }];
    }

    const totalTaxable = products.reduce((sum, p) => sum + p.amount, 0);
    const cgstRate = 9; // Default 9%
    const sgstRate = 9; // Default 9%
    const cgstAmount = (totalTaxable * cgstRate) / 100;
    const sgstAmount = (totalTaxable * sgstRate) / 100;
    const grandTotal = totalTaxable + cgstAmount + sgstAmount;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Tax Challan - ${val('challan_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial', sans-serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 22px; font-weight: bold; color: #1a237e; }
            .company-details { font-size: 11px; color: #666; margin-top: 5px; }
            .form-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .header-table td { padding: 5px; vertical-align: top; }
            .section-title { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
            .goods-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            .goods-table th { background: #1a237e; color: white; padding: 8px 5px; text-align: left; font-weight: bold; }
            .goods-table td { border: 1px solid #000; padding: 8px 5px; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section { margin-top: 20px; }
            .totals-table { width: 300px; float: right; border-collapse: collapse; font-size: 11px; }
            .totals-table td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
            .totals-table .total-row { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
            .declaration-box { margin-top: 30px; padding: 15px; border: 1px solid #ddd; background: #f9f9f9; font-size: 10px; line-height: 1.4; clear: both; }
            .signature-area { margin-top: 40px; }
            .signature-box { width: 200px; display: inline-block; margin-right: 20px; vertical-align: top; }
            .signature-line { width: 100%; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .copy-label { position: absolute; top: 20px; right: 20px; font-size: 14px; font-weight: bold; color: #ff0000; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="copy-label">ORIGINAL FOR RECEIVER</div>
            
            <div class="header">
                <div class="company-name">${val('supplier_name')}</div>
                <div class="company-details">
                    ${val('supplier_address').replace(/\n/g, '<br>')}<br>
                    GSTIN: ${val('supplier_gstin')} | Phone: +91-22-12345678
                </div>
            </div>
            
            <div class="form-title">TAX INVOICE CUM DELIVERY CHALLAN</div>
            
            <table class="header-table">
                <tr>
                    <td width="50%">
                        <div class="section-title">Supplier Details</div>
                        <div><strong>Name:</strong> ${val('supplier_name')}</div>
                        <div><strong>Address:</strong> ${val('supplier_address').replace(/\n/g, ', ')}</div>
                        <div><strong>GSTIN:</strong> ${val('supplier_gstin')}</div>
                        <div><strong>State:</strong> ${val('supplier_state')}</div>
                    </td>
                    <td width="50%">
                        <div class="section-title">Invoice Details</div>
                        <div><strong>Challan No:</strong> ${val('challan_no')}</div>
                        <div><strong>Date:</strong> ${val('challan_date')}</div>
                        <div><strong>PO No:</strong> ${val('po_number')}</div>
                        <div><strong>PO Date:</strong> ${val('po_date')}</div>
                        <div><strong>E-Way Bill No:</strong> ${val('eway_bill')}</div>
                        <div><strong>Valid Upto:</strong> ${val('eway_valid')}</div>
                    </td>
                </tr>
            </table>
            
            <table class="header-table">
                <tr>
                    <td width="50%">
                        <div class="section-title">Receiver Details</div>
                        <div><strong>Name:</strong> ${val('receiver_name')}</div>
                        <div><strong>Address:</strong> ${val('receiver_address').replace(/\n/g, ', ')}</div>
                        <div><strong>GSTIN:</strong> ${val('receiver_gstin')}</div>
                        <div><strong>State:</strong> ${val('receiver_state')}</div>
                    </td>
                    <td width="50%">
                        <div class="section-title">Transport Details</div>
                        <div><strong>Mode:</strong> ${val('transport_mode')}</div>
                        <div><strong>Vehicle No:</strong> ${val('vehicle_no')}</div>
                        <div><strong>Transporter:</strong> ${val('transporter')}</div>
                        <div><strong>LR No:</strong> ${val('lr_no')}</div>
                        <div><strong>Dispatch Date:</strong> ${val('dispatch_date')}</div>
                    </td>
                </tr>
            </table>
            
            <table class="goods-table">
                <thead>
                    <tr>
                        <th width="5%">S.No.</th>
                        <th width="35%">Description of Goods</th>
                        <th width="10%">HSN Code</th>
                        <th width="8%">Quantity</th>
                        <th width="7%">Unit</th>
                        <th width="10%">Rate (₹)</th>
                        <th width="10%">Taxable Value (₹)</th>
                        <th width="7%">CGST %</th>
                        <th width="8%">SGST %</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                    <tr>
                        <td class="text-center">${p.sno || ''}</td>
                        <td>${p.desc}</td>
                        <td class="text-center">${p.hsn}</td>
                        <td class="text-right">${p.qty}</td>
                        <td class="text-center">${p.unit}</td>
                        <td class="text-right">${p.rate.toFixed(2)}</td>
                        <td class="text-right">${p.amount.toFixed(2)}</td>
                        <td class="text-center">${cgstRate}%</td>
                        <td class="text-center">${sgstRate}%</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <table class="totals-table">
                    <tr><td>Total Taxable Value:</td><td class="text-right">₹ ${totalTaxable.toFixed(2)}</td></tr>
                    <tr><td>CGST (${cgstRate}%):</td><td class="text-right">₹ ${cgstAmount.toFixed(2)}</td></tr>
                    <tr><td>SGST (${sgstRate}%):</td><td class="text-right">₹ ${sgstAmount.toFixed(2)}</td></tr>
                    <tr class="total-row"><td><strong>Grand Total:</strong></td><td class="text-right"><strong>₹ ${grandTotal.toFixed(2)}</strong></td></tr>
                </table>
            </div>
            
            <div class="declaration-box">
                <strong>Amount in Words:</strong> RUPEES ${grandTotal.toFixed(0)} ONLY<br><br>
                <strong>Declaration:</strong> ${val('declaration')}<br>
                <strong>Supply Type:</strong> ${val('supply_type')} | <strong>Reverse Charge:</strong> ${val('reverse_charge')}
            </div>
            
            <div class="signature-area">
                <div class="signature-box">
                    <div class="section-title">For Supplier</div>
                    <div class="signature-line"></div>
                    <div style="text-align: center; font-size: 11px;">Authorized Signatory</div>
                </div>
                
                <div class="signature-box">
                    <div class="section-title">Receiver's Acceptance</div>
                    <div><strong>Received in Good Condition</strong></div>
                    <div style="margin-top: 10px; font-size: 10px;">
                        Date & Time: _________________<br>
                        Signature: ___________________<br>
                        Name: _______________________<br>
                        Designation: _________________
                    </div>
                </div>
                
                <div class="signature-box">
                    <div class="section-title">Transporter's Receipt</div>
                    <div><strong>Goods Handed Over</strong></div>
                    <div style="margin-top: 10px; font-size: 10px;">
                        Date: _________________<br>
                        Driver Signature: __________<br>
                        Vehicle No: _______________
                    </div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 40px; width: 734px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
                Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Tax Challan DOC-022<br>
                This is a computer generated document, no signature required
            </div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Letter of Authority print view.
 */
function generateLOAPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Letter of Authority - DOC-023</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 50px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .letterhead { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
            .company-name { font-size: 22px; font-weight: bold; }
            .company-address { font-size: 12px; line-height: 1.4; }
            .to-address { margin: 30px 0; }
            .subject { font-weight: bold; margin: 20px 0; }
            .content { font-size: 12px; line-height: 1.8; text-align: justify; }
            .authorized-activities { margin: 20px 0 20px 40px; }
            .activity-item { margin-bottom: 8px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 60px 0 5px; }
            .stamp-area { float: right; width: 120px; height: 60px; border: 2px dashed #666; text-align: center; padding-top: 20px; font-size: 10px; color: #666; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="letterhead">
                <div class="company-name">${val('exporter_name')}</div>
                <div class="company-address">
                    ${val('exporter_address').replace(/\n/g, '<br>')}<br>
                    GSTIN: ${val('gstin')} | PAN: ${val('pan')} | IEC: ${val('iec_number')}
                </div>
            </div>
            
            <div class="to-address">
                To,<br>
                ${val('customs_authority')},<br>
                Air Cargo Complex,<br>
                Sahar, Andheri (East),<br>
                Mumbai - 400099
            </div>
            
            <div class="subject">Subject: Authorization Letter for Customs Clearance</div>
            
            <div class="content">
                We, <strong>${val('exporter_name')}</strong>, having our registered office at <strong>${val('exporter_address').replace(/\n/g, ', ')}</strong> and holding Importer Exporter Code (IEC) No. <strong>${val('iec_number')}</strong>, hereby authorize M/s. <strong>${val('cha_name').split(',')[0] || val('cha_name')}</strong>, our Customs House Agent bearing CHA License No. <strong>${val('cha_license')}</strong> to act on our behalf for clearance of our export/import consignments through your port.
                
                <div class="authorized-activities">
                    <div class="activity-item">1. To file documents, declarations, and Bills of Entry/Shipping Bills on our behalf</div>
                    <div class="activity-item">2. To pay duties, taxes, and other charges on our behalf</div>
                    <div class="activity-item">3. To submit documents and obtain documents from Customs authorities</div>
                    <div class="activity-item">4. To represent us before Customs and other regulatory authorities</div>
                    <div class="activity-item">5. To do all such acts, deeds and things as may be necessary for customs clearance</div>
                </div>
                
                This authorization is specifically for the consignment with following details:<br>
                <strong>Shipping Bill No.:</strong> ${val('shipping_bill_no')}<br>
                <strong>Invoice No.:</strong> ${val('invoice_no')}<br>
                <strong>Date:</strong> ${val('invoice_date')}<br>
                <strong>Vessel/Flight:</strong> ${val('vessel_flight')}<br>
                <strong>Port of Loading:</strong> ${val('port_loading')}
                
                <br><br>
                This authorization is valid from <strong>${val('valid_from')}</strong> to <strong>${val('valid_to')}</strong> or until revoked in writing, whichever is earlier.
                
                <br><br>
                We reserve the right to revoke this authorization at any time by providing written notice to you and the authorized CHA.
            </div>
            
            <div class="signature-area">
                <div class="stamp-area">COMPANY STAMP</div>
                
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 14px; font-weight: bold;">For ${val('exporter_name')}</div>
                
                <div style="text-align: center; margin-top: 10px;">
                    <strong>Name:</strong> ${val('signatory_name')}<br>
                    <strong>Designation:</strong> ${val('signatory_designation')}
                </div>
                
                <div style="margin-top: 60px;">
                    <div style="font-weight: bold; margin-bottom: 10px;">ACCEPTED BY:</div>
                    <div style="margin-left: 50px;">
                        For <strong>${val('cha_name').split(',')[0] || val('cha_name')}</strong>
                        <div style="margin-top: 40px;">
                            <div style="border-bottom: 1px solid #000; width: 250px; margin-bottom: 5px;"></div>
                            <div>Authorized Signatory</div>
                            <div>CHA License No.: ${val('cha_license')}</div>
                            <div>Date: _________________</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 40px; width: 694px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Letter of Authority DOC-023</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Certificate of Origin print view.
 */
function generateCOOPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Certificate of Origin - DOC-024</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; text-decoration: underline; }
            .form-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            .form-table td { padding: 10px; vertical-align: top; border: 1px solid #000; }
            .form-number { width: 30px; text-align: center; font-weight: bold; }
            .goods-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            .goods-table th, .goods-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .text-center { text-align: center; }
            .stamp-area { float: right; width: 150px; height: 80px; border: 2px dashed #666; text-align: center; padding-top: 30px; font-size: 11px; color: #666; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">CERTIFICATE OF ORIGIN</div>
            
            <table class="form-table">
                <tr>
                    <td class="form-number">1.</td>
                    <td>Goods consigned from (Exporter's business name, address, country):</td>
                    <td>
                        ${val('exporter_name')}<br>
                        ${val('exporter_address').replace(/\n/g, '<br>')}<br>
                        ${val('country_origin')}
                    </td>
                </tr>
                <tr>
                    <td class="form-number">2.</td>
                    <td>Goods consigned to (Consignee's name, address, country):</td>
                    <td>
                        ${val('consignee_name')}<br>
                        ${val('consignee_address').replace(/\n/g, '<br>')}<br>
                        ${val('country_destination')}
                    </td>
                </tr>
                <tr>
                    <td class="form-number">3.</td>
                    <td>Means of transport and route (as far as known):</td>
                    <td>
                        Departure date: ${val('departure_date')}<br>
                        Vessel's name/Aircraft etc.: ${val('vessel_aircraft')}<br>
                        Port of loading: ${val('port_loading')}<br>
                        Port of discharge: ${val('port_discharge')}
                    </td>
                </tr>
                <tr>
                    <td class="form-number">4.</td>
                    <td colspan="2">For Official Use</td>
                </tr>
            </table>
            
            <table class="goods-table">
                <thead>
                    <tr>
                        <th width="5%">5. Item number</th>
                        <th width="20%">6. Marks and numbers on packages</th>
                        <th width="35%">7. Number and kind of packages; description of goods</th>
                        <th width="10%">8. Origin criterion</th>
                        <th width="15%">9. Gross weight or other quantity</th>
                        <th width="15%">10. Number and date of invoices</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="text-center">1</td>
                        <td>${val('marks_numbers').replace(/\n/g, '<br>')}</td>
                        <td>${val('number_packages')} PACKAGES<br>${val('description_goods')}</td>
                        <td class="text-center">${val('origin_criterion')}</td>
                        <td class="text-center">${val('gross_weight')} KGS</td>
                        <td class="text-center">${val('invoice_no')}<br>${val('invoice_date')}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin: 30px 0; font-size: 12px; line-height: 1.6;">
                <strong>11. Certification</strong><br>
                It is hereby certified, on the basis of control carried out, that the declaration by the exporter is correct.
                
                <div style="margin-top: 40px;">
                    <div class="stamp-area">CHAMBER OF COMMERCE<br>STAMP</div>
                    
                    <div style="float: left; width: 400px;">
                        <div style="border-bottom: 1px solid #000; width: 250px; margin-bottom: 5px;"></div>
                        Place and date, signature and stamp of certifying authority<br>
                        <strong>${val('certifying_authority')}</strong><br>
                        Date: ${val('certification_date')}
                    </div>
                </div>
            </div>
            
            <div style="clear: both; margin-top: 100px; font-size: 12px; line-height: 1.6;">
                <strong>12. Declaration by the exporter</strong><br>
                The undersigned hereby declares that the above details and statements are correct; that all the goods were produced in <strong>${val('country_origin')}</strong> and that they comply with the origin requirements specified for those goods in the Generalized System of Preferences for goods exported to <strong>${val('country_destination')}</strong>.
                
                <div style="margin-top: 40px;">
                    <div style="border-bottom: 1px solid #000; width: 300px; margin-bottom: 5px;"></div>
                    Place and date, signature of authorized signatory<br>
                    <strong>${val('declaration_place')}, ${val('certification_date')}</strong>
                </div>
                
                <div style="margin-top: 20px;">
                    <strong>For ${val('exporter_name')}</strong><br>
                    Authorized Signatory
                </div>
            </div>
            
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 1 of 1 | Generated: ${new Date().toLocaleString()} | Certificate of Origin DOC-024</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the specific Annexure D for DEPB print view.
 */
function generateAnnexureDPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    const isExciseAvailed = data.excise_procedure === 'Availed under rule 12(1)(b)/13(1)(b)';
    const deecStatus = data.deec_status || 'Not under DEEC';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Annexure D DEPB - DOC-009</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
            body { background: #f5f5f5; padding: 20px; }
            .document-container { width: 794px; min-height: 1123px; background: white; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .form-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-decoration: underline; }
            .field-input { border: none; border-bottom: 1px dashed #666; font-family: 'Courier New'; font-size: 12px; padding: 2px 5px; }
            .declaration-text { margin: 15px 0; font-size: 12px; line-height: 1.4; }
            .strike-text { text-decoration: line-through; color: #999; }
            .active-text { color: #000; font-weight: bold; }
            .or-text { text-align: center; font-weight: bold; margin: 5px 0; }
            .market-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .market-table th, .market-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            .signature-area { margin-top: 100px; }
            .signature-line { width: 300px; border-bottom: 1px solid #000; margin: 40px 0 5px; }
            .btn { background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; cursor: pointer; border: none; margin: 5px; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="document-container">
            <div class="form-title">
                APPENDIX – 11 (ANNEXURE D)<br>
                DEPB DECLARATION<br>
                <small>(To be filled for export goods under claim for drawback)</small>
            </div>
            
            <div style="margin-bottom: 20px;">
                Shipping Bill No. and Date: <span class="field-input">${val('shipping_bill_no')}</span> / <span class="field-input">${val('shipping_bill_date')}</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                I / We <span class="field-input">${val('exporter_name')}</span> do hereby further declare as follows:
            </div>
            
            <div class="declaration-text">
                1) That the quality and specification of goods as stated in this Shipping Bill are in accordance with the terms of exports contract entered into with the buyer / consignee in pursuance of the goods which are being exported.
            </div>
            
            <div class="declaration-text">
                2) That we are not claiming benefit under * Engineering Products Export (Replenishment of Iron and Steel Intermediates) schemes* notified vide Ministry of Commerce Notification No.539 RE / 92-97 dated 01.03.95.
            </div>
            
            <div class="declaration-text">
                3) That there is no change in the manufacturing formula and in the quantum per unit of the imported material or components, utilised in the manufacture of the export goods, and that the materials or components which have been stated in the application under Rule 6 or Rule 7 of the of Drawback Rules 1995 to have been imported continue to be so imported and are not been obtained from indigenous sources.
            </div>
            
            <div class="declaration-text">
                4) <span class="${isExciseAvailed ? 'strike-text' : 'active-text'}">* (A) That the export goods have not been manufactured by availing the procedure under Rule 12(1)(b)/13(1)(b) of the Central Excise Rules,1944.</span>
            </div>
            
            <div class="or-text">O R</div>
            
            <div class="declaration-text">
                <span class="${isExciseAvailed ? 'active-text' : 'strike-text'}">* (B) That the export goods have been manufactured by availing the procedure under rule 12(1)(b)/13(1)(b) of the Central Excise Rules,1944,but we are / shall be claiming DBK on the basis of special brand rate in terms of Rule 6 1995)</span>
            </div>
            
            <div class="declaration-text">
                5) <span class="${deecStatus === 'Not under DEEC' ? 'active-text' : 'strike-text'}">* (A) That the goods are not manufactured and / or exported in discharge of export obligation against an Advance license issued under the Duty Exemption Scheme (DEEC) vide relevant import and Export policy in force.</span>
            </div>
            
            <div class="or-text">O R</div>
            
            <div class="declaration-text">
                <span class="${deecStatus === 'Under DEEC - Central Excise only' ? 'active-text' : 'strike-text'}">* (B) That goods are manufactured and are being exported in discharge of export obligation under the Duty Exemption Scheme (DEEC), in terms of Notification 79 / 95 Cus,or 80/85 Cus, both dated 31.03.95 or 31/97 dated 01.04.97 but I / We are claiming Drawback of only the Central Excise portion of the duties on inputs specified in the Drawback Schedule.</span>
            </div>
            
            <div class="or-text">O R</div>
            
            <div class="declaration-text">
                <span class="${deecStatus === 'Under DEEC - Brand rate' ? 'active-text' : 'strike-text'}">* (C) That the goods are manufactured and are being exported in discharged of export obligation under the duty exemption scheme (DEEC), but I / We are claiming Brand rate of fixed under Rule 6 or & of the DBK Rules,1995.</span>
            </div>
            
            <div style="font-size: 11px; margin: 10px 0; color: #666;">
                * (Strike out which ever is inapplicable)
            </div>
            
            <div class="declaration-text">
                6) That the goods are not manufactured and / or exported after availing of the facility under the Passbook Scheme as contained in para 7.25 of the Export and Import Policy ( April,1997-31st March,2002).
            </div>
            
            <div class="declaration-text">
                7) That the goods are not manufactured and / or exported by unit licensed as 100% Export Oriented Unit in terms of Import and Export Policy in force.
            </div>
            
            <div style="page-break-before: always; margin-top: 50px;">
                <div class="declaration-text">
                    8) That the goods are not manufactured and / or exported by a unit situated in any Free Trade Zone / Export Processing Zone or any other such Zone.
                </div>
                
                <div class="declaration-text">
                    9) That the goods are not manufactured partly or wholly in bond under Section 65 of the the Customs Act,1962.
                </div>
                
                <div class="declaration-text">
                    10) That the present market value of the goods is as follow:
                </div>
                
                <table class="market-table">
                    <thead>
                        <tr>
                            <th width="10%">S. No.</th>
                            <th width="45%">Item No. In Invoice</th>
                            <th width="45%">Market Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td>Sample Product 1</td><td>USD 13.00 per piece</td></tr>
                        <tr><td>2</td><td>Sample Product 2</td><td>USD 9.25 per piece</td></tr>
                        <tr><td>3</td><td>Sample Product 3</td><td>USD 47.50 per set</td></tr>
                    </tbody>
                </table>
                
                <div class="declaration-text">
                    11) That the export value of the goods covered by this Shipping Bill is not less than total value of all imported materials used in manufacture of such goods.
                </div>
                
                <div class="declaration-text">
                    12) That the market price of the goods being exported is not less than the drawback amount being claimed.
                </div>
                
                <div class="declaration-text">
                    13) That the drawback amount claimed is more that 1% of the FOB value of the export product,or the drawback amount claimed is less than 1% of the FOB value but more than Rs.500/- against the Shipping Bill.
                </div>
                
                <div class="declaration-text">
                    14) I / We undertake to repatriate export proceeds with 6 months from date of export and submit BRC to Asst: Commissioner (Drawbck) In case,the export proceed are not realised within 6 months from the date of the export, I / We will either furnish extension fo time frm RBI and submite BRC within such extended period or will pay back the drawback received against this Shipping Bill.
                </div>
            </div>
            
            <div class="signature-area">
                <div style="margin-top: 30px; font-weight: bold;">
                    Name of Exporter Address<br>
                    ${val('exporter_name')}<br>
                    ${val('exporter_address').replace(/\n/g, '<br>')}
                </div>
                
                <div class="signature-line"></div>
                <div style="text-align: center; font-size: 12px; font-weight: bold;">Signature of the Exporter</div>
            </div>
            
            <div style="position: absolute; bottom: 40px; width: 714px; text-align: center; font-size: 9px; color: #666;">Page 2 of 2 | Generated: ${new Date().toLocaleString()} | Annexure D DEPB DOC-009</div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generates the Delivery Challan & Packaging List print view.
 */
function generateDeliveryChallanPrintView(data) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up blocked! Please allow pop-ups for this site.');
        return;
    }

    const val = (key, fallback = '') => data[key] || fallback;
    
    // Handle both products and packages
    const products = data.products || [];
    const packages = data.packages || [];
    
    const totalNet = packages.reduce((sum, p) => sum + (parseFloat(p.net) || 0), 0);
    const totalGross = packages.reduce((sum, p) => sum + (parseFloat(p.gross) || 0), 0);
    const totalVol = packages.reduce((sum, p) => sum + (parseFloat(p.vol) || 0), 0);
    const totalPackages = packages.length;
    const totalAmount = products.reduce((sum, p) => sum + (p.amount || 0), 0);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Delivery Challan - ${val('challan_no')}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            body { background: #fff; padding: 20px; font-size: 12px; }
            .container { max-width: 800px; margin: 0 auto; }
            @media print { .no-print { display: none; } }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
            .document-title { text-align: center; }
            .document-title h2 { color: #e74c3c; font-size: 20px; margin-bottom: 8px; }
            .form-section { margin-bottom: 25px; }
            .section-title { background: #ecf0f1; padding: 10px 15px; border-left: 4px solid #3498db; margin-bottom: 15px; font-weight: 600; color: #2c3e50; }
            .form-row { display: flex; margin: 0 -10px; }
            .form-group { flex: 1; padding: 0 10px; margin-bottom: 15px; }
            label { display: block; margin-bottom: 6px; font-weight: 500; color: #2c3e50; font-size: 12px; }
            .field-value { border-bottom: 1px solid #ddd; padding: 5px 0; min-height: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background: #2c3e50; color: white; padding: 10px; text-align: left; font-weight: 600; }
            .items-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .total-section { display: flex; justify-content: flex-end; margin-top: 20px; }
            .total-box { background: #ecf0f1; padding: 15px 25px; border-radius: 5px; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .total-amount { font-weight: 700; font-size: 16px; color: #2c3e50; border-top: 1px solid #bdc3c7; padding-top: 10px; margin-top: 10px; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; }
            .signature-box { width: 45%; }
            .signature-line { height: 1px; background: #333; margin: 40px 0 5px; }
            .btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" class="btn">Print</button>
            <button onclick="window.close()" class="btn" style="background: #6b7280;">Close</button>
        </div>
        <div class="container">
            <div class="header">
                <div class="company-info">
                    <h1>${val('from_company')}</h1>
                    <div style="white-space: pre-line;">${val('from_address')}</div>
                </div>
                <div class="document-title">
                    <h2>DELIVERY CHALLAN & PACKAGING LIST</h2>
                    <p>Document for Goods Dispatch & Receipt</p>
                </div>
                <div>
                    <div><strong>Challan No.:</strong> ${val('challan_no')}</div>
                    <div><strong>Date:</strong> ${val('challan_date')}</div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">Delivery Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label>To (Company)</label>
                        <div class="field-value">${val('to_company')}</div>
                    </div>
                    <div class="form-group">
                        <label>Delivery Date</label>
                        <div class="field-value">${val('delivery_date')}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>To Address</label>
                        <div class="field-value" style="white-space: pre-line;">${val('to_address')}</div>
                    </div>
                    <div class="form-group">
                        <label>Vehicle No.</label>
                        <div class="field-value">${val('vehicle_no')}</div>
                        <label style="margin-top: 10px;">Driver Name</label>
                        <div class="field-value">${val('driver_name')}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">Product Details</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Description</th>
                            <th>HSN</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map((prod, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${prod.desc || 'Sample Product'}</td>
                            <td>${prod.hsn || '0000'}</td>
                            <td style="text-align: right;">${prod.qty || 1}</td>
                            <td>${prod.unit || 'PCS'}</td>
                            <td style="text-align: right;">${(prod.rate || 0).toFixed(2)}</td>
                            <td style="text-align: right;">${(prod.amount || 0).toFixed(2)}</td>
                        </tr>`).join('')}
                        ${products.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: #666;">No products added</td></tr>' : ''}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f0f0f0; font-weight: bold;">
                            <td colspan="6" style="text-align: right;">Total Amount:</td>
                            <td style="text-align: right;">${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="form-section">
                <div class="section-title">Packaging List</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Carton No.</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Net Wt. (kg)</th>
                            <th>Gross Wt. (kg)</th>
                            <th>Dimensions (cm)</th>
                            <th>Vol. Wt. (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${packages.map((pkg, i) => `
                        <tr>
                            <td>${pkg.carton || (i + 1)}</td>
                            <td>${pkg.desc || 'Sample Item'}</td>
                            <td>${pkg.qty || '1 PCS'}</td>
                            <td style="text-align: right;">${(pkg.net || 0).toFixed(2)}</td>
                            <td style="text-align: right;">${(pkg.gross || 0).toFixed(2)}</td>
                            <td style="text-align: center;">${pkg.dims || '30x20x15'}</td>
                            <td style="text-align: right;">${(pkg.vol || 0).toFixed(2)}</td>
                        </tr>`).join('')}
                        ${packages.length === 0 ? '<tr><td colspan="7" style="text-align: center; color: #666;">No items added</td></tr>' : ''}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-box">
                        <div class="total-row">
                            <span>Total Packages:</span>
                            <span>${totalPackages}</span>
                        </div>
                        <div class="total-row">
                            <span>Total Net Weight:</span>
                            <span>${totalNet.toFixed(2)} kg</span>
                        </div>
                        <div class="total-row">
                            <span>Total Gross Weight:</span>
                            <span>${totalGross.toFixed(2)} kg</span>
                        </div>
                        <div class="total-row total-amount">
                            <span>Chargeable Weight:</span>
                            <span>${Math.max(totalGross, totalVol).toFixed(2)} kg</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <div class="section-title">Additional Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Special Instructions</label>
                        <div class="field-value" style="white-space: pre-line;">${val('special_instructions')}</div>
                    </div>
                    <div class="form-group">
                        <label>Packaging Notes</label>
                        <div class="field-value" style="white-space: pre-line;">${val('packaging_notes')}</div>
                    </div>
                </div>
            </div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <label>Prepared By</label>
                    <div class="signature-line"></div>
                    <p style="font-size: 11px; color: #666;">Name, Signature & Company Stamp</p>
                </div>
                <div class="signature-box">
                    <label>Received By</label>
                    <div class="signature-line"></div>
                    <p style="font-size: 11px; color: #666;">Name, Signature & Date of Receipt</p>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; padding-top: 10px; border-top: 1px solid #ddd;">
                Generated: ${new Date().toLocaleString()} | Delivery Challan DOC-025
            </div>
        </div>
    </body>
    </html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Saves the draft to localStorage.
 */
function saveLocalDraft(docId) {
    const form = document.getElementById('doc-form');
    if (!form) return;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // If reference_id is empty, generate one.
    if (!data.reference_id) {
        const refId = `${docId}-${Date.now()}`;
        const refIdInput = form.elements['reference_id'];
        if (refIdInput) refIdInput.value = refId;
        data.reference_id = refId; // Also update the data object to be saved
    }

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

    // 1. Get all data sources from localStorage
    const appDataStr = localStorage.getItem('appData');
    if (!appDataStr) {
        alert("No local data found. Please sync first.");
        return;
    }
    
    const appData = JSON.parse(appDataStr);
    const orders = appData.SHIPMENTS?.ORDERS || {};
    const products = appData.SHIPMENTS?.PRODUCT || {};
    const multiboxes = appData.SHIPMENTS?.MULTIBOX || {};
    const b2bData = appData.CHANNEL?.B2B || {};
    const b2b2cData = appData.CHANNEL?.B2B2C || {};
    
    // 2. Find the primary order record
    let order = null;
    if (orders[ref]) {
        order = orders[ref];
    } else {
        order = Object.values(orders).find(o => o.REFERANCE === ref || o.AWB_NUMBER === ref);
    }

    if (!order) {
        alert("Shipment not found in Orders.");
        return;
    }

    // 3. Build a comprehensive mergedData object
    const mergedData = { ...order };
    const orderRef = mergedData.REFERANCE;
    const orderCode = mergedData.CODE;
    const consignorUid = mergedData.CONSIGNOR;
    const consigneeUid = mergedData.CONSIGNEE;

    if (orderRef) {
        const productInfo = Object.values(products).find(p => p.RERERANCE === orderRef || p.REFERENCE === orderRef);
        if (productInfo) Object.assign(mergedData, productInfo);

        const multiboxInfo = Object.values(multiboxes).find(m => m.REFERENCE === orderRef);
        if (multiboxInfo) Object.assign(mergedData, multiboxInfo);
    }

    if (orderCode) {
        const b2bInfo = Object.values(b2bData).find(b => b.CODE === orderCode);
        if (b2bInfo) {
            Object.assign(mergedData, b2bInfo);
        }
    }
    
    if (consignorUid) {
        const consignorInfo = Object.values(b2b2cData).find(c => c.UID === consignorUid);
        if (consignorInfo) {
            mergedData.CONSIGNOR_NAME = consignorInfo.NAME;
            mergedData.CONSIGNOR_ADDRESS = consignorInfo.ADDRESS;
            mergedData.CONSIGNOR_CITY = consignorInfo.CITY;
            mergedData.CONSIGNOR_PINCODE = consignorInfo.PINCODE;
            mergedData.CONSIGNOR_FULL = `${consignorInfo.NAME}, ${consignorInfo.ADDRESS}, ${consignorInfo.CITY} - ${consignorInfo.PINCODE}`;
        }
    }
    
    if (consigneeUid) {
        const consigneeInfo = Object.values(b2b2cData).find(c => c.UID === consigneeUid);
        if (consigneeInfo) {
            mergedData.CONSIGNEE_NAME = consigneeInfo.NAME;
            mergedData.CONSIGNEE_ADDRESS = consigneeInfo.ADDRESS;
            mergedData.CONSIGNEE_CITY = consigneeInfo.CITY;
            mergedData.CONSIGNEE_PINCODE = consigneeInfo.PINCODE;
            mergedData.CONSIGNEE_FULL = `${consigneeInfo.NAME}, ${consigneeInfo.ADDRESS}, ${consigneeInfo.CITY} - ${consigneeInfo.PINCODE}`;
        }
    }

    // 4. Map Data to Form
    const mapping = FIELD_MAPPINGS[docId] || {};
    const commonMapping = FIELD_MAPPINGS['_COMMON'] || {};
    const schema = DOC_SCHEMAS[docId];
    const form = document.getElementById('doc-form');

    if (!schema || !form) return;

    // Helper to get value from the new mergedData object
    const getValue = (keys) => {
        if (!Array.isArray(keys)) keys = [keys];
        for (const k of keys) {
            const dataKey = Object.keys(mergedData).find(dk => dk.toUpperCase() === k.toUpperCase());
            if (dataKey && mergedData[dataKey]) {
                return mergedData[dataKey];
            }
        }
        return null;
    };

    // Iterate schema fields and populate
    schema.fields.forEach(field => {
        const fieldKey = field.key;
        let sourceKeys = mapping[fieldKey] || commonMapping[fieldKey];
        
        if (sourceKeys) {
            const val = getValue(sourceKeys);
            if (val) {
                const input = form.elements[fieldKey];
                if (input) input.value = val;
            }
        }
    });

    if (window.showNotification) window.showNotification("Data imported successfully from multiple sources!", "success");
}

/**
 * Initializes the Document Center page.
 */
function initDocCenter() {
    renderDecisionGuide();
}

// Initialize
document.addEventListener('DOMContentLoaded', initDocCenter);