import { useContext } from "react";
import { AuthContext } from "../context/auth";
import { Link } from "react-router-dom";
import { ShipmentContext } from "../context/shipments";
import "./Dashboard.css";

function Dashboard() {
  const { auth } = useContext(AuthContext);
  const { metrics, shipments } = useContext(ShipmentContext);

  return (
    <div className="dashboard">

      <h1 className="dashboard-title">
        Cargo.Control
      </h1>

      <div className="top-cards">

        <div className="card">
          <h4>Total Shipments</h4>
          <h2>{metrics.total}</h2>
          <span>+12.4%</span>
        </div>

        <div className="card">
          <h4>In Transit</h4>
          <h2>{metrics.active}</h2>
          <span>+3.1%</span>
        </div>

        <div className="card">
          <h4>Delayed</h4>
          <h2>2</h2>
          <span className="danger">-0.8%</span>
        </div>

        <div className="card">
          <h4>Delivered</h4>
          <h2>{metrics.delivered}</h2>
          <span>+18.9%</span>
        </div>

      </div>

      <div className="middle-section">

        <div className="map-card">
          <h3>Global Fleet • Live Radar</h3>

          <div className="fake-map">

            <div className="dot green" style={{top:"25%",left:"25%"}}></div>
            <div className="dot green" style={{top:"50%",left:"55%"}}></div>
            <div className="dot red" style={{top:"70%",left:"75%"}}></div>
            <div className="dot yellow" style={{top:"20%",left:"45%"}}></div>

          </div>

        </div>

        <div className="chart-card">

          <h3>Throughput • 24H</h3>

          <div className="bars">

            {[20,30,25,40,35,50,45,60,55,70,65,75].map((h,i)=>(
              <div
                key={i}
                className="bar"
                style={{height:`${h}%`}}
              ></div>
            ))}

          </div>

        </div>

      </div>

      <div className="bottom-section">

        <div className="table-card">

          <h3>Active Shipments</h3>

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Route</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>

            </thead>

            <tbody>

              {shipments.slice(0,8).map((shipment)=>(
                <tr key={shipment.id}>

                  <td>{shipment.trackingNumber}</td>

                  <td>
                    {shipment.senderCity} → {shipment.receiverCity}
                  </td>

                  <td>{shipment.status}</td>

                  <td>{shipment.progress}%</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        <div className="alerts-card">

          <h3>Alerts</h3>

          <ul>

            <li>🔴 Port congestion detected</li>

            <li>🟠 Weather advisory</li>

            <li>🔵 Customs cleared</li>

            <li>🟢 POD received</li>

            <li>⚡ Route optimized</li>

          </ul>

          <hr />

          <p>
            Logged in as <strong>{auth.user.name}</strong>
          </p>

          <p>{auth.user.role}</p>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;