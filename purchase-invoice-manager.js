// Function to handle the form submission for a new purchase invoice
document.getElementById('purchase-invoice-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const supplierName = document.getElementById('supplier-name').value;
    const invoiceNumber = document.getElementById('invoice-number').value;
    const invoiceDate = document.getElementById('invoice-date').value;
    const totalAmount = parseFloat(document.getElementById('total-amount').value);

    // Get the currently logged-in user
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to record an invoice.');
        return;
    }

    // Reference to the new 'purchaseInvoices' collection
    const db = firebase.firestore();
    const purchaseInvoicesRef = db.collection('users').doc(user.uid).collection('purchaseInvoices');

    try {
        await purchaseInvoicesRef.add({
            supplierName,
            invoiceNumber,
            invoiceDate,
            totalAmount,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear the form and refresh the list
        document.getElementById('purchase-invoice-form').reset();
        fetchPurchaseInvoices();
        alert('Purchase invoice saved successfully!');
    } catch (error) {
        console.error('Error saving purchase invoice:', error);
        alert('Failed to save purchase invoice. Please try again.');
    }
});

// Function to fetch and display all purchase invoices
function fetchPurchaseInvoices() {
    const user = firebase.auth().currentUser;
    if (!user) {
        // If no user is logged in, clear the table
        document.getElementById('invoices-table-body').innerHTML = '<tr><td colspan="4">Please log in to view invoices.</td></tr>';
        return;
    }
    
    const db = firebase.firestore();
    const purchaseInvoicesRef = db.collection('users').doc(user.uid).collection('purchaseInvoices').orderBy('createdAt', 'desc');

    purchaseInvoicesRef.onSnapshot(snapshot => {
        const tableBody = document.getElementById('invoices-table-body');
        tableBody.innerHTML = ''; // Clear the table
        
        snapshot.forEach(doc => {
            const invoice = doc.data();
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = invoice.supplierName;
            row.insertCell(1).textContent = invoice.invoiceNumber;
            row.insertCell(2).textContent = invoice.invoiceDate;
            row.insertCell(3).textContent = invoice.totalAmount.toFixed(2);
        });
    }, error => {
        console.error('Error fetching purchase invoices:', error);
        document.getElementById('invoices-table-body').innerHTML = '<tr><td colspan="4">Error loading invoices.</td></tr>';
    });
}

// Ensure the invoices are loaded when the user is logged in
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchPurchaseInvoices();
    } else {
        // If not logged in, show a message
        document.getElementById('invoices-table-body').innerHTML = '<tr><td colspan="4">Please log in to view invoices.</td></tr>';
    }
});