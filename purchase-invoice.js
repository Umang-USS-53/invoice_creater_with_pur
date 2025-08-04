// Initialize Firebase (if not already initialized)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual Firebase API Key
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ------------------------------------------
// Logic for purchase-invoice-create.html
// ------------------------------------------
if (document.getElementById('purchaseInvoiceForm')) {
    const itemTableBody = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
    const addItemButton = document.getElementById('addItemButton');
    const saveButton = document.getElementById('savePurchaseInvoiceButton');

    function calculateTotals() {
        let totalQuantity = 0;
        let taxableValue = 0;
        let cgstValue = 0;
        let sgstValue = 0;
        let igstValue = 0;
        
        const itemRows = document.querySelectorAll('#itemTable .item-row');
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const rate = parseFloat(row.querySelector('.rate').value) || 0;
            const cgstRate = parseFloat(row.querySelector('.cgst-rate').value) || 0;
            const sgstRate = parseFloat(row.querySelector('.sgst-rate').value) || 0;
            const igstRate = parseFloat(row.querySelector('.igst-rate').value) || 0;
            
            const amount = quantity * rate;
            const itemCgst = amount * (cgstRate / 100);
            const itemSgst = amount * (sgstRate / 100);
            const itemIgst = amount * (igstRate / 100);
            
            row.querySelector('.item-total').textContent = (amount + itemCgst + itemSgst + itemIgst).toFixed(2);
            
            totalQuantity += quantity;
            taxableValue += amount;
            cgstValue += itemCgst;
            sgstValue += itemSgst;
            igstValue += itemIgst;
        });

        const grandTotal = taxableValue + cgstValue + sgstValue + igstValue;

        document.getElementById('totalQuantity').textContent = totalQuantity;
        document.getElementById('taxableValue').textContent = taxableValue.toFixed(2);
        document.getElementById('cgstValue').textContent = cgstValue.toFixed(2);
        document.getElementById('sgstValue').textContent = sgstValue.toFixed(2);
        document.getElementById('igstValue').textContent = igstValue.toFixed(2);
        document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
    }
    
    function addEventListenersToRow(row) {
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateTotals);
        });
        row.querySelector('.remove-item-button').addEventListener('click', function() {
            row.remove();
            calculateTotals();
        });
    }

    addItemButton.addEventListener('click', () => {
        const newRow = itemTableBody.insertRow();
        newRow.className = 'item-row';
        newRow.innerHTML = `
            <td><input type="text" class="lot-no" value="${itemTableBody.rows.length + 1}"></td>
            <td><input type="text" class="description" required></td>
            <td><input type="text" class="hsn-code" required></td>
            <td><input type="text" class="unit" required></td>
            <td><input type="number" class="quantity" value="1" required></td>
            <td><input type="number" class="rate" value="0" required></td>
            <td><input type="number" class="cgst-rate" value="9"></td>
            <td><input type="number" class="sgst-rate" value="9"></td>
            <td><input type="number" class="igst-rate" value="0"></td>
            <td><span class="item-total">0.00</span></td>
            <td><button type="button" class="remove-item-button">-</button></td>
        `;
        addEventListenersToRow(newRow);
        
        // Show remove buttons if there's more than one row
        document.querySelectorAll('.remove-item-button').forEach(btn => btn.style.display = 'block');
        if (itemTableBody.rows.length === 1) {
            itemTableBody.querySelector('.remove-item-button').style.display = 'none';
        }

        calculateTotals();
    });

    saveButton.addEventListener('click', async () => {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('You must be logged in to save a purchase invoice.');
            return;
        }

        const invoiceNumber = document.getElementById('invoiceNumber').value;
        if (!invoiceNumber) {
            alert('Please enter an invoice number.');
            return;
        }

        const purchaseInvoiceData = {
            invoiceNumber: invoiceNumber,
            invoiceDate: document.getElementById('invoiceDate').value,
            supplierName: document.getElementById('supplierName').value,
            supplierGST: document.getElementById('supplierGST').value,
            totalQuantity: parseFloat(document.getElementById('totalQuantity').textContent),
            taxableValue: parseFloat(document.getElementById('taxableValue').textContent),
            cgstValue: parseFloat(document.getElementById('cgstValue').textContent),
            sgstValue: parseFloat(document.getElementById('sgstValue').textContent),
            igstValue: parseFloat(document.getElementById('igstValue').textContent),
            grandTotal: parseFloat(document.getElementById('grandTotal').textContent),
            items: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const itemRows = document.querySelectorAll('#itemTable .item-row');
        itemRows.forEach(row => {
            purchaseInvoiceData.items.push({
                lotNo: row.querySelector('.lot-no').value,
                description: row.querySelector('.description').value,
                hsnCode: row.querySelector('.hsn-code').value,
                unit: row.querySelector('.unit').value,
                quantity: parseFloat(row.querySelector('.quantity').value),
                rate: parseFloat(row.querySelector('.rate').value),
                cgstRate: parseFloat(row.querySelector('.cgst-rate').value),
                sgstRate: parseFloat(row.querySelector('.sgst-rate').value),
                igstRate: parseFloat(row.querySelector('.igst-rate').value),
                itemTotal: parseFloat(row.querySelector('.item-total').textContent)
            });
        });

        try {
            await db.collection('users').doc(user.uid).collection('purchaseInvoices').doc(invoiceNumber).set(purchaseInvoiceData);
            alert('Purchase Invoice saved successfully!');
            // Clear the form
            document.getElementById('purchaseInvoiceForm').reset();
            document.querySelector('.item-row').innerHTML = `
                <td><input type="text" class="lot-no" value="1"></td>
                <td><input type="text" class="description" required></td>
                <td><input type="text" class="hsn-code" required></td>
                <td><input type="text" class="unit" required></td>
                <td><input type="number" class="quantity" value="1" required></td>
                <td><input type="number" class="rate" value="0" required></td>
                <td><input type="number" class="cgst-rate" value="9"></td>
                <td><input type="number" class="sgst-rate" value="9"></td>
                <td><input type="number" class="igst-rate" value="0"></td>
                <td><span class="item-total">0.00</span></td>
                <td><button type="button" class="remove-item-button" style="display:none;">-</button></td>
            `;
            calculateTotals();
        } catch (error) {
            console.error("Error saving purchase invoice: ", error);
            alert("Error saving purchase invoice. See console for details.");
        }
    });

    // Initial calculations and event listeners for the first row
    document.querySelectorAll('.item-row').forEach(addEventListenersToRow);
    calculateTotals();
}

// ------------------------------------------
// Logic for purchase-invoice-manager.html
// ------------------------------------------
if (document.getElementById('purchaseInvoicesList')) {
    const invoicesTableBody = document.getElementById('invoicesTable').getElementsByTagName('tbody')[0];
    const modal = document.getElementById('invoiceDetailsModal');
    const closeButton = modal.querySelector('.close-button');
    
    function displayPurchaseInvoices() {
        const user = firebase.auth().currentUser;
        if (!user) {
            invoicesTableBody.innerHTML = '<tr><td colspan="5">Please log in to view invoices.</td></tr>';
            return;
        }

        db.collection('users').doc(user.uid).collection('purchaseInvoices').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            invoicesTableBody.innerHTML = '';
            snapshot.forEach(doc => {
                const invoice = doc.data();
                const row = invoicesTableBody.insertRow();
                const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString();

                row.insertCell(0).textContent = invoice.invoiceNumber;
                row.insertCell(1).textContent = formattedDate;
                row.insertCell(2).textContent = invoice.supplierName;
                row.insertCell(3).textContent = invoice.grandTotal.toFixed(2);
                
                const actionsCell = row.insertCell(4);
                const viewButton = document.createElement('button');
                viewButton.textContent = 'View';
                viewButton.onclick = () => showInvoiceDetails(invoice);
                actionsCell.appendChild(viewButton);
            });
        }, error => {
            console.error('Error fetching purchase invoices:', error);
            invoicesTableBody.innerHTML = '<tr><td colspan="5">Error loading invoices.</td></tr>';
        });
    }

    function showInvoiceDetails(invoice) {
        const modalContent = document.getElementById('invoiceDetailsContent');
        let itemsHtml = invoice.items.map(item => `
            <li>
                ${item.description} (Lot: ${item.lotNo}, HSN: ${item.hsnCode}) - Qty: ${item.quantity} ${item.unit}, Rate: ${item.rate}, Total: ${item.itemTotal.toFixed(2)}
            </li>
        `).join('');

        modalContent.innerHTML = `
            <h2>Purchase Invoice Details</h2>
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Invoice Date:</strong> ${invoice.invoiceDate}</p>
            <p><strong>Supplier Name:</strong> ${invoice.supplierName}</p>
            <p><strong>Supplier GST:</strong> ${invoice.supplierGST}</p>
            <hr>
            <h3>Items:</h3>
            <ul>${itemsHtml}</ul>
            <hr>
            <p><strong>Total Quantity:</strong> ${invoice.totalQuantity}</p>
            <p><strong>Taxable Value:</strong> ${invoice.taxableValue.toFixed(2)}</p>
            <p><strong>CGST:</strong> ${invoice.cgstValue.toFixed(2)}</p>
            <p><strong>SGST:</strong> ${invoice.sgstValue.toFixed(2)}</p>
            <p><strong>IGST:</strong> ${invoice.igstValue.toFixed(2)}</p>
            <p><strong>Grand Total:</strong> ${invoice.grandTotal.toFixed(2)}</p>
        `;

        modal.style.display = 'block';
    }

    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Call the display function when auth state changes
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            displayPurchaseInvoices();
        } else {
            invoicesTableBody.innerHTML = '<tr><td colspan="5">Please log in to view invoices.</td></tr>';
        }
    });
}
