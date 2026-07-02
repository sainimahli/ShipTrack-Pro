function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold p-6">
        ShipTrack Pro
      </h1>

      <ul className="space-y-2 px-4">
        <li className="p-3 hover:bg-slate-800 rounded">
          Dashboard
        </li>

        <li className="p-3 hover:bg-slate-800 rounded">
          Shipments
        </li>

        <li className="p-3 hover:bg-slate-800 rounded">
          Tracking
        </li>

        <li className="p-3 hover:bg-slate-800 rounded">
          Analytics
        </li>

        <li className="p-3 hover:bg-slate-800 rounded">
          Users
        </li>

        <li className="p-3 hover:bg-slate-800 rounded">
          Reports
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;