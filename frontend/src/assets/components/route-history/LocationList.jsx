function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

function statusClass(status) {
  if (!status) return "";
  return status.toLowerCase().replaceAll(" ", "-");
}

/**
 * Tabular log displaying route coordinate pings, location names, and timestamps.
 */
function LocationList({ history = [], shipmentId = "Shipment" }) {
  if (!history || history.length === 0) {
    return null;
  }

  const exportCSV = () => {
    const headers = ["Timestamp", "Location", "Latitude", "Longitude", "Status"];
    const rows = history.map(point => [
      `"${new Date(point.timestamp || new Date()).toLocaleString('en-IN')}"`,
      `"${point.locationName || ''}"`,
      point.latitude,
      point.longitude,
      `"${point.status || 'In Transit'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `route_history_${shipmentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Route History Log - ${shipmentId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
            h1 { color: #0f172a; font-size: 24px; margin-bottom: 5px; }
            p { margin: 5px 0; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 9999px; text-transform: uppercase; }
            .in-transit { background-color: #dbeafe; color: #1e40af; }
            .delivered { background-color: #d1fae5; color: #065f46; }
            .created { background-color: #f3f4f6; color: #374151; }
            .out-for-delivery { background-color: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <h1>Route History Log Report</h1>
          <p><strong>Shipment Reference:</strong> ${shipmentId}</p>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Location</th>
                <th>Coordinates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(point => `
                <tr>
                  <td><strong>${new Date(point.timestamp || new Date()).toLocaleString('en-IN')}</strong></td>
                  <td>${point.locationName || ''}</td>
                  <td><code>${Number(point.latitude || 0).toFixed(4)}, ${Number(point.longitude || 0).toFixed(4)}</code></td>
                  <td>
                    <span class="badge ${point.status ? point.status.toLowerCase().replaceAll(' ', '-') : 'in-transit'}">
                      ${point.status || 'In Transit'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div className="toolbar" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 className="section-title">Location Ping Log</h3>
          <p className="subtle">Detailed GPS coordinate logs recorded for this shipment's journey.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportCSV} className="button secondary compact" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📥</span> Export CSV
          </button>
          <button onClick={exportPDF} className="button secondary compact" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📄</span> Export PDF
          </button>
        </div>
      </div>
      
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Location</th>
              <th>Coordinates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((point, index) => (
              <tr key={point.id || index}>
                <td><strong>{formatDateTime(point.timestamp)}</strong></td>
                <td><strong>{point.locationName}</strong></td>
                <td>
                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", color: "#475569" }}>
                    {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                  </code>
                </td>
                <td>
                  <span className={`badge ${statusClass(point.status || "In Transit")}`}>
                    {point.status || "In Transit"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LocationList;
