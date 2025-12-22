/**
 * docs-gen.js
 * The "Brain" of the Document Center.
 * Handles form schemas, validation logic, and dynamic rendering for docs.html.
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
                    <tbody id="decision-guide-body">
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
                guideHtml += `<button data-doc-id="${doc.id}" data-doc-title="${schema.title.replace(/"/g, '&quot;')}" data-doc-desc="${schema.desc.replace(/"/g, '&quot;')}" class="doc-guide-btn text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-full hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">${doc.name}</button>`;
            } else {
                guideHtml += `<span class="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-1 rounded-full cursor-not-allowed" title="Schema not defined yet">${doc.name}</span>`;
            }
        });
        guideHtml += `</div></td></tr>`;
    });

    guideHtml += `</tbody></table></div></div>`;
    contentArea.innerHTML = guideHtml;
    
    // Add event delegation for document buttons
    const tbody = document.getElementById('decision-guide-body');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('doc-guide-btn')) {
                const docId = e.target.dataset.docId;
                const docTitle = e.target.dataset.docTitle;
                const docDesc = e.target.dataset.docDesc;
                const sidebarLink = document.querySelector(`.doc-link[onclick*="'${docId}'"]`);
                selectDoc(sidebarLink, docId, docTitle, docDesc);
            }
        });
    }
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
                    if (field.key === 'reference_id') {
                        // SPECIAL CASE: Attach the auto-fill trigger to Reference ID
                        inputHtml = `<input type="${field.type}" name="${field.key}" value="${field.value || ''}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readonlyClasses}" ${readonlyAttr} placeholder="Enter Ref/AWB to Auto-fill" onblur="autoFillFromReference(this.value, '${schema.id}')" ${stepAttr}>`;
                    } else {
                        inputHtml = `<input type="${field.type}" name="${field.key}" value="${field.value || ''}" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${readonlyClasses}" ${readonlyAttr} ${placeholderAttr} ${stepAttr}>`;
                    }
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
                <button onclick="handleDownloadDOCX('${schema.id}')" class="p-2 text-gray-600 hover:text-blue-800 hover:bg-white rounded-md transition-all shadow-sm" title="Download Data Summary (DOCX)">
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
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;

    // Generate Print View immediately
    generatePrintView(docId, data);
    
    // Update Preview Area
    const previewBox = document.getElementById('mini-preview');
    if (previewBox) {
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
    }
    
    // Reset button state
    btn.disabled = false;
    btn.innerHTML = originalText;
    
    // Use global notification if available (from layout.js)
    if (window.showNotification) {
        window.showNotification(`${docId} generated successfully!`, 'success');
    }
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
        return sanitizeHTML(String(val)).replace(/\n/g, '<br>');
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
                <h1>${sanitizeHTML(schema.title)}</h1>
                <p>${sanitizeHTML(schema.desc)}</p>
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
 * Generates the specific Packing List print view.
/**
 * Generates a print view for any document schema by routing to specific templates.
 * @param {string} docId 
 * @param {object} data 
 */
function generatePrintView(docId, data) {
    // Route to specific print view functions in docs-templates.js
    const printFunctions = {
        'KYC': generateKYCPrintView,
        'COM_INV': generateCommercialInvoicePrintView,
        'PKL': generatePackingListPrintView,
        'SDF': generateSDFPrintView,
        'ANN_1': generateAnnexure1PrintView,
        'SLI': generateSLIPrintView,
        'ANN_2': generateAnnexure2PrintView,
        'APP_3': generateAppendix3PrintView,
        'APP_4': generateAppendix4PrintView,
        'APP_2': generateAppendix2PrintView,
        'ANN_C1': generateAnnexureC1PrintView,
        'SCD': generateSingleCountryDeclarationPrintView,
        'MCD': generateMultipleCountryDeclarationPrintView,
        'NEG_DEC': generateNegativeDeclarationPrintView,
        'QUOTA': generateQuotaChargeStatementPrintView,
        'NON_DG': generateNonDGPrintView,
        'TSCA': generateTSCAPrintView,
        'GR_SAMPLE': generateGRSamplePrintView,
        'GR_REPAIR': generateGRRepairPrintView,
        'MSDS': generateMSDSPrintView,
        'TAX_CHALLAN': generateTaxChallanPrintView,
        'LOA': generateLOAPrintView,
        'COO': generateCOOPrintView,
        'ANN_D': generateAnnexureDPrintView,
        'DELIVERY_CHALLAN': generateDeliveryChallanPrintView,
        'DOM_INV': generateDomesticInvoicePrintView,
        'BL_AWB': generateBLAWBPrintView,
        'INS_CERT': generateInsuranceCertPrintView,
        'ARE1': generateARE1PrintView
    };

    const printFunction = printFunctions[docId];
    if (printFunction) {
        printFunction(data);
    } else {
        generateGenericPrintView(docId, data);
    }
}

function saveLocalDraft(docId) {
    // Placeholder for local draft saving
    if (window.showNotification) window.showNotification('Local draft saved!', 'success');
}

function saveCloudDraft(docId) {
    // Placeholder for cloud draft saving
    if (window.showNotification) window.showNotification('Cloud draft saved!', 'success');
}

function loadLocalDraft(docId) {
    // Placeholder for local draft loading
    if (window.showNotification) window.showNotification('Local draft loaded!', 'info');
}

function handleImportData(docId) {
    // Placeholder for data import
    if (window.showNotification) window.showNotification('Data import feature coming soon!', 'info');
}

/**
 * Automatically fetches data when Reference ID is typed.
 * @param {string} ref - The value typed by the user.
 * @param {string} docId - The current document ID (e.g., 'COM_INV').
 */
window.autoFillFromReference = function(ref, docId) {
    if (!ref) return; // Do nothing if empty

    // 1. Get Data (Support both Window object or LocalStorage)
    let appData = window.appData; 
    if (!appData) {
        try {
            appData = JSON.parse(localStorage.getItem('appData'));
        } catch (e) {
            console.error("No AppData found");
            return;
        }
    }
    
    if (!appData || !appData.SHIPMENTS) return;

    const orders = appData.SHIPMENTS.ORDERS || {};
    const products = appData.SHIPMENTS.PRODUCT || {};
    const b2bData = appData.CHANNEL?.B2B || {};

    // 2. Find the Shipment (Search by Reference OR AWB)
    const searchRef = ref.toUpperCase().trim();
    
    let order = Object.values(orders).find(o => 
        (o.REFERANCE && o.REFERANCE.toUpperCase() === searchRef) || 
        (o.AWB_NUMBER && o.AWB_NUMBER.toUpperCase() === searchRef)
    );

    if (!order) {
        // Optional: Visual feedback if not found (e.g., red border)
        const refInput = document.querySelector('input[name="reference_id"]');
        if(refInput) refInput.classList.add('border-red-500');
        if(window.showNotification) window.showNotification("Reference not found in database.", "warning");
        return;
    }

    // 3. Success! Visual Feedback
    const refInput = document.querySelector('input[name="reference_id"]');
    if(refInput) {
        refInput.classList.remove('border-red-500');
        refInput.classList.add('border-green-500', 'bg-green-50');
    }
    if(window.showNotification) window.showNotification("Shipment data found! Filling form...", "success");

    // 4. Merge Data Sources (Order + Product + B2B)
    const mergedData = { ...order };
    
    // Merge Product Data
    const productInfo = Object.values(products).find(p => p.RERERANCE === order.REFERANCE);
    if (productInfo) Object.assign(mergedData, productInfo);

    // Merge B2B/Client Data
    if (order.CODE) {
        const clientInfo = Object.values(b2bData).find(c => c.CODE === order.CODE);
        if (clientInfo) Object.assign(mergedData, clientInfo);
    }

    // 5. Execute the Bindup (Map Data -> Inputs)
    const mapping = FIELD_MAPPINGS[docId] || {};
    const commonMapping = FIELD_MAPPINGS['_COMMON'] || {};
    const form = document.getElementById('doc-form');

    // Helper to find data case-insensitively
    const getDataValue = (keys) => {
        if (!Array.isArray(keys)) keys = [keys];
        for (const k of keys) {
            // Find key in mergedData ignoring case
            const dataKey = Object.keys(mergedData).find(dk => dk.toUpperCase() === k.toUpperCase());
            if (dataKey && mergedData[dataKey]) return mergedData[dataKey];
        }
        return null;
    };

    // Loop through form fields and fill them
    const schema = DOC_SCHEMAS[docId];
    if (!schema) return;

    let filledCount = 0;
    schema.fields.forEach(field => {
        // Skip reference_id itself to avoid loops
        if (field.key === 'reference_id') return;

        const input = form.elements[field.key];
        if (!input) return;

        // Check specific doc mapping, then fallback to common mapping
        const sourceKeys = mapping[field.key] || commonMapping[field.key];
        
        if (sourceKeys) {
            const val = getDataValue(sourceKeys);
            if (val) {
                // Handle different input types
                if (input.type === 'date' && val) {
                    // Try to format date if needed, otherwise just set it
                    input.value = val.split('T')[0]; // Simple ISO fix if needed
                } else {
                    input.value = val;
                }
                
                // Visual flash effect for filled fields
                input.style.backgroundColor = "#f0fdf4"; // Light green
                setTimeout(() => input.style.backgroundColor = "", 1000);
                filledCount++;
            }
        }
    });
    
    console.log(`Auto-filled ${filledCount} fields for ${docId}`);
};

// Initialize the document center
function initDocCenter() {
    renderDecisionGuide();
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initDocCenter();
});