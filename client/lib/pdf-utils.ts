// PDF generation utilities for invoices
// This is a client-side PDF generation solution

export const generateInvoicePDF = (
  invoiceData: any,
  type: "client" | "admin" = "client",
) => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour télécharger le PDF");
    return;
  }

  // Normalize invoice data to match expected format
  const normalizedInvoice = {
    invoiceNumber: invoiceData.invoice_number || invoiceData.invoiceNumber,
    client: invoiceData.client,
    clientIce: invoiceData.client_ice || invoiceData.clientIce,
    project: invoiceData.project,
    amount: invoiceData.amount,
    taxAmount: invoiceData.tax_amount || invoiceData.taxAmount,
    totalAmount: invoiceData.total_amount || invoiceData.totalAmount,
    issueDate: invoiceData.issue_date || invoiceData.issueDate,
    dueDate: invoiceData.due_date || invoiceData.dueDate,
    items: invoiceData.items || [],
    teamMembers: invoiceData.team_members || invoiceData.teamMembers || [],
    notes: invoiceData.notes
  };

  const invoiceHtml =
    type === "client"
      ? generateClientInvoiceHTML(normalizedInvoice)
      : generateAdminInvoiceHTML(normalizedInvoice);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Facture ${invoiceData.invoiceNumber}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            padding: 20px;
            background: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
          }
          .logo-section {
            flex-grow: 1;
          }
          .logo-section img {
            max-width: 250px;
            height: auto;
            margin-bottom: 15px;
          }
          .logo-section p {
            color: #666;
            font-size: 11px;
            line-height: 1.5;
            max-width: 400px;
          }
          .invoice-info {
            text-align: right;
            font-size: 14px;
            color: #666;
          }
          .client-info {
            margin-bottom: 30px;
          }
          .client-info h2 {
            font-size: 18px;
            margin-bottom: 10px;
            color: #333;
          }
          .invoice-number {
            margin-bottom: 30px;
          }
          .invoice-number h2 {
            font-size: 20px;
            color: #6366f1;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
          }
          .items-table .text-center {
            text-align: center;
          }
          .items-table .text-right {
            text-align: right;
          }
          .totals-row {
            background-color: #f8f9fa;
            font-weight: 600;
          }
          .final-total {
            background-color: #6366f1 !important;
            color: white !important;
            font-size: 16px;
          }
          .amount-words {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          }
          .signature-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
          }
          .signature-box {
            text-align: center;
            border: 2px dashed #ddd;
            padding: 30px;
            width: 200px;
            border-radius: 8px;
          }
          .admin-notes {
            background-color: #e0f2fe;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
          .admin-notes h4 {
            color: #0277bd;
            margin-bottom: 10px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-section h3 {
            margin-bottom: 10px;
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-paid {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-overdue {
            background-color: #fee2e2;
            color: #dc2626;
          }
          @media print {
            body { padding: 0; }
            .invoice-container { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${invoiceHtml}
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">Imprimer</button>
          <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Fermer</button>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
};

const generateClientInvoiceHTML = (invoice: any) => {
  return `
    <div class="invoice-container">
      <div class="header">
        <div class="logo-section">
          <img src="https://cdn.builder.io/api/v1/image/assets%2F7a25a5293015472896bb7679c041e95e%2F27c40508f6d34af887b8f7974a28d0f3?format=webp&width=800"
               alt="Nomedia Production"
               style="height: 80px; margin-bottom: 20px;" />
          <p style="font-size: 12px; color: #666; line-height: 1.4;">
            Adresse : 123, Rue Emile Zola, Casablanca<br/>
            Tél : 212 522408888 / Fax : 212 522 608839 / DXM : 212 661119900 / 212 661436394<br/>
            Email : contact@nomedianord.com / contact@nomedianord.com<br/>
            ICE : 000000225004917 / IF : 33265750 / RC : 642540 / CNSS : BANK OF AFRICA - 011 780 000002000001407 26
          </p>
        </div>
        <div class="invoice-info">
          <p style="font-size: 14px;">Casablanca : Le ${new Date(invoice.issueDate).toLocaleDateString("fr-FR")}</p>
        </div>
      </div>

      <div class="client-info" style="margin-bottom: 25px; text-align: center;">
        <p style="font-weight: bold; font-size: 14px; margin-bottom: 5px; text-decoration: underline;">
          Client : ${invoice.client}
        </p>
        <p style="font-size: 12px;">ICE : ${invoice.clientIce}</p>
      </div>

      <div class="invoice-number" style="margin-bottom: 30px; text-align: center;">
        <p style="font-weight: bold; font-size: 14px; text-decoration: underline;">
          Facture : ${invoice.invoiceNumber}
        </p>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th class="text-center">Prix unitaire</th>
            <th class="text-center">Qté</th>
            <th class="text-center">Prix Total H.T</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
            .map(
              (item: any) => `
            <tr>
              <td>${item.description}</td>
              <td class="text-center">${(item.unit_price || item.unitPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="totals-row">
            <td colspan="3" class="text-center">TOTAL H.T</td>
            <td class="text-center">${invoice.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</td>
          </tr>
          <tr class="totals-row">
            <td colspan="3" class="text-center">T.V.A 20 %</td>
            <td class="text-center">${invoice.taxAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</td>
          </tr>
          <tr class="totals-row final-total">
            <td colspan="3" class="text-center">TOTAL T.T.C</td>
            <td class="text-center">${invoice.totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</td>
          </tr>
        </tbody>
      </table>

      <div class="amount-words">
        ARRÊTÉ LA PRÉSENTE FACTURE À LA SOMME DE :<br/>
        ${numberToWords(invoice.totalAmount)} DIRHAMS TTC.
      </div>

      <div style="margin-top: 40px;">
        <div style="text-align: right; margin-bottom: 30px;">
          <p style="font-weight: bold; margin-bottom: 10px;">La Direction</p>
          <div style="width: 150px; height: 80px; border: 2px dashed #ccc; display: inline-block;
                      position: relative; margin-left: auto;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
                        opacity: 0.3; font-size: 10px; text-align: center; line-height: 1.2;">
              NOMEDIA<br/>PRODUCTION<br/>
              <div style="font-size: 8px; margin-top: 5px;">
                Tél: 212 522408888<br/>
                Fax: 212 522 608839<br/>
                Email: contact@nomedianord.com<br/>
                ICE: 000000225004917
              </div>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #ccc; padding-top: 15px; font-size: 10px; color: #666; text-align: center;">
          <p style="margin-bottom: 5px;">
            <strong>Adresse :</strong> 123, Rue Emile Zola, Casablanca<br/>
            <strong>Tél :</strong> 212 522408888 <strong>Fax :</strong> 212 522 608839 <strong>GSM :</strong> 212 661119900 / 212 661436394
          </p>
          <p style="margin-bottom: 5px;">
            <strong>Email :</strong> contact@nomedianord.com / contact@nomedianord.com
          </p>
          <p>
            <strong>ICE :</strong> 000000225004917 / <strong>IF :</strong> 33265750 / <strong>RC :</strong> 642540 / <strong>CNSS :</strong> BANK OF AFRICA - 011 780 000002000001407 26
          </p>
        </div>
      </div>
    </div>
  `;
};

const generateAdminInvoiceHTML = (invoice: any) => {
  return `
    <div class="invoice-container">
      <div style="margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin-bottom: 10px;">FACTURE ADMINISTRATIVE</h1>
        <p style="color: #666;">Détails complets pour usage interne</p>
      </div>

      <div class="grid">
        <div class="info-section">
          <h3>Informations Facture</h3>
          <p><strong>Numéro:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date d'émission:</strong> ${new Date(invoice.issueDate).toLocaleDateString("fr-FR")}</p>
          <p><strong>Date d'échéance:</strong> ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}</p>
          <p><strong>Statut:</strong> <span class="status-badge status-${invoice.status}">${formatStatus(invoice.status)}</span></p>
        </div>
        <div class="info-section">
          <h3>Client</h3>
          <p><strong>Nom:</strong> ${invoice.client}</p>
          <p><strong>ICE:</strong> ${invoice.clientIce}</p>
          <p><strong>Projet:</strong> ${invoice.project}</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="margin-bottom: 15px;">Détail des prestations</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Prix Unitaire</th>
              <th class="text-center">Quantité</th>
              <th class="text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item: any) => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.unitPrice.toLocaleString()} MAD</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.total.toLocaleString()} MAD</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>Sous-total HT:</span>
          <span style="font-weight: 600;">${invoice.amount.toLocaleString()} MAD</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span>TVA (20%):</span>
          <span style="font-weight: 600;">${invoice.taxAmount.toLocaleString()} MAD</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; border-top: 2px solid #ddd; padding-top: 10px;">
          <span>Total TTC:</span>
          <span>${invoice.totalAmount.toLocaleString()} MAD</span>
        </div>
      </div>

      ${
        invoice.teamMembers && invoice.teamMembers.length > 0
          ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #0369a1; margin-bottom: 10px;">Équipe Projet</h4>
          <p style="color: #0369a1;">${invoice.teamMembers.join(", ")}</p>
        </div>
      `
          : ""
      }

      <div class="admin-notes">
        <h4>Notes internes</h4>
        <p style="font-size: 14px; color: #666;">
          • Marge brute: ${(invoice.amount * 0.3).toLocaleString()} MAD (30%)<br/>
          • Coûts de production estimés: ${(invoice.amount * 0.7).toLocaleString()} MAD<br/>
          • Date de paiement prévue: ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
          ${invoice.notes ? `<br/>• Notes: ${invoice.notes}` : ""}
        </p>
      </div>
    </div>
  `;
};

// Helper function to convert numbers to words (simplified French)
const numberToWords = (num: number): string => {
  if (num === 0) return "ZÉRO";

  const ones = [
    "",
    "UN",
    "DEUX",
    "TROIS",
    "QUATRE",
    "CINQ",
    "SIX",
    "SEPT",
    "HUIT",
    "NEUF",
  ];
  const tens = [
    "",
    "",
    "VINGT",
    "TRENTE",
    "QUARANTE",
    "CINQUANTE",
    "SOIXANTE",
    "SOIXANTE-DIX",
    "QUATRE-VINGTS",
    "QUATRE-VINGT-DIX",
  ];
  const hundreds = [
    "",
    "CENT",
    "DEUX CENTS",
    "TROIS CENTS",
    "QUATRE CENTS",
    "CINQ CENTS",
    "SIX CENTS",
    "SEPT CENTS",
    "HUIT CENTS",
    "NEUF CENTS",
  ];

  if (num < 10) return ones[num];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return `${tens[ten]} ${ones[one]}`.trim();
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return `${hundreds[hundred]} ${numberToWords(remainder)}`.trim();
  }
  if (num < 1000000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    return `${numberToWords(thousand)} MILLE ${numberToWords(remainder)}`.trim();
  }

  return `${Math.floor(num / 1000000)} MILLIONS ${numberToWords(num % 1000000)}`.trim();
};

const formatStatus = (status: string) => {
  switch (status) {
    case "paid":
      return "Payée";
    case "pending":
      return "En attente";
    case "overdue":
      return "En retard";
    case "draft":
      return "Brouillon";
    default:
      return status;
  }
};

export const downloadInvoiceCSV = (invoices: any[]) => {
  const headers = [
    "Numéro",
    "Client",
    "Projet",
    "Montant HT",
    "TVA",
    "Total TTC",
    "Date émission",
    "Échéance",
    "Statut",
  ];
  const csvContent = [
    headers.join(","),
    ...invoices.map((inv) =>
      [
        inv.invoiceNumber,
        `"${inv.client}"`,
        `"${inv.project}"`,
        inv.amount,
        inv.taxAmount,
        inv.totalAmount,
        inv.issueDate,
        inv.dueDate,
        inv.status,
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `factures_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
