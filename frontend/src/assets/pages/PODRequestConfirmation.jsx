import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth";
import {
  confirmPOD,
  getAllPODs,
  getPODConfirmations,
} from "../services/api";

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "";

function PODRequestConfirmation() {
  const { auth } = useContext(AuthContext);

  const role = normalizeRole(auth?.user?.role);
  const isCustomer = role === "Customer";

  const [confirmations, setConfirmations] = useState([]);
  const [pods, setPods] = useState([]);

  const [confirmationShipmentId, setConfirmationShipmentId] = useState("");
  const [podShipmentId, setPodShipmentId] = useState("");

  const [confirmationLoading, setConfirmationLoading] = useState(true);
  const [podLoading, setPodLoading] = useState(true);

  const [confirmationError, setConfirmationError] = useState("");
  const [podError, setPodError] = useState("");

  const [confirmingId, setConfirmingId] = useState(null);

  const loadConfirmations = async () => {
    try {
      setConfirmationLoading(true);
      setConfirmationError("");

      const response = await getPODConfirmations();

      setConfirmations(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      setConfirmationError(
        error?.response?.data?.message ||
          "Unable to load POD confirmation requests."
      );
      setConfirmations([]);
    } finally {
      setConfirmationLoading(false);
    }
  };

  const loadPods = async () => {
    try {
      setPodLoading(true);
      setPodError("");

      const response = await getAllPODs();

      setPods(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      setPodError(
        error?.response?.data?.message ||
          "Unable to load created Proof of Delivery records."
      );
      setPods([]);
    } finally {
      setPodLoading(false);
    }
  };

  useEffect(() => {
    loadConfirmations();
    loadPods();
  }, []);

  const filteredConfirmations = useMemo(() => {
    const searchValue = confirmationShipmentId.trim();

    if (!searchValue) {
      return confirmations;
    }

    return confirmations.filter(
      (confirmation) =>
        String(confirmation.shipmentId) === searchValue
    );
  }, [confirmations, confirmationShipmentId]);

  const filteredPods = useMemo(() => {
    const searchValue = podShipmentId.trim();

    if (!searchValue) {
      return pods;
    }

    return pods.filter(
      (pod) => String(pod.shipmentId) === searchValue
    );
  }, [pods, podShipmentId]);

  const handleConfirmPOD = async (confirmationId) => {
    try {
      setConfirmingId(confirmationId);
      setConfirmationError("");

      await confirmPOD(confirmationId);

      await Promise.all([
        loadConfirmations(),
        loadPods(),
      ]);
    } catch (error) {
      setConfirmationError(
        error?.response?.data?.message ||
          "Unable to confirm the POD."
      );
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="page">

      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            PROOF OF DELIVERY
          </div>

          <h1>POD Request and Confirmation</h1>

          <p className="subtle">
            Search POD confirmation requests and created
            Proof of Delivery records using the shipment ID.
          </p>
        </div>
      </div>

      {/* POD CONFIRMATION REQUESTS */}

      <section className="panel">

        <div className="page-header">
          <div>
            <h2>POD Confirmation Requests</h2>

            <p className="subtle">
              Search for a POD confirmation request using
              the shipment ID.
            </p>
          </div>
        </div>

        <div className="form-field">

          <label htmlFor="confirmationShipmentId">
            Shipment ID
          </label>

          <input
            id="confirmationShipmentId"
            type="text"
            className="input"
            value={confirmationShipmentId}
            onChange={(event) =>
              setConfirmationShipmentId(event.target.value)
            }
            placeholder="Enter Shipment ID"
          />

        </div>

        {confirmationError && (
          <div className="alert error">
            {confirmationError}
          </div>
        )}

        {confirmationLoading ? (
          <p className="subtle">
            Loading confirmation requests...
          </p>
        ) : (
          <>
            {filteredConfirmations.length > 0 ? (
              <div style={{ overflowX: "auto" }}>

                <table className="table">

                  <thead>
                    <tr>
                      <th>Confirmation ID</th>
                      <th>Shipment ID</th>
                      <th>Delivered To</th>
                      <th>Status</th>

                      {isCustomer && (
                        <th>Action</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>

                    {filteredConfirmations.map(
                      (confirmation) => (
                        <tr
                          key={
                            confirmation.confirmationId
                          }
                        >

                          <td>
                            {
                              confirmation.confirmationId
                            }
                          </td>

                          <td>
                            {confirmation.shipmentId}
                          </td>

                          <td>
                            {
                              confirmation.deliveredToName ||
                              "-"
                            }
                          </td>

                          <td>
                            {confirmation.status || "-"}
                          </td>

                          {isCustomer && (
                            <td>
                              {confirmation.status ===
                              "PENDING" ? (
                                <button
                                  type="button"
                                  className="button primary"
                                  disabled={
                                    confirmingId ===
                                    confirmation.confirmationId
                                  }
                                  onClick={() =>
                                    handleConfirmPOD(
                                      confirmation.confirmationId
                                    )
                                  }
                                >
                                  {confirmingId ===
                                  confirmation.confirmationId
                                    ? "Confirming..."
                                    : "Confirm POD"}
                                </button>
                              ) : (
                                <span className="subtle">
                                  Already Confirmed
                                </span>
                              )}
                            </td>
                          )}

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            ) : (
              <p className="subtle">
                {confirmationShipmentId.trim()
                  ? "No POD confirmation request found for the entered shipment ID."
                  : "No POD confirmation requests available."}
              </p>
            )}
          </>
        )}

      </section>

      {/* CREATED PODS */}

      <section
        className="panel"
        style={{ marginTop: "24px" }}
      >

        <div className="page-header">
          <div>

            <h2>Created Proof of Delivery</h2>

            <p className="subtle">
              Search for a created POD using the shipment ID.
            </p>

          </div>
        </div>

        <div className="form-field">

          <label htmlFor="podShipmentId">
            Shipment ID
          </label>

          <input
            id="podShipmentId"
            type="text"
            className="input"
            value={podShipmentId}
            onChange={(event) =>
              setPodShipmentId(event.target.value)
            }
            placeholder="Enter Shipment ID"
          />

        </div>

        {podError && (
          <div className="alert error">
            {podError}
          </div>
        )}

        {podLoading ? (
          <p className="subtle">
            Loading created PODs...
          </p>
        ) : (
          <>
            {filteredPods.length > 0 ? (
              <div style={{ overflowX: "auto" }}>

                <table className="table">

                  <thead>
                    <tr>
                      <th>POD ID</th>
                      <th>Shipment ID</th>
                      <th>Delivered At</th>
                      <th>Delivered To</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredPods.map((pod) => (
                      <tr key={pod.podId}>

                        <td>
                          {pod.podId}
                        </td>

                        <td>
                          {pod.shipmentId}
                        </td>

                        <td>
                          {pod.deliveredAt
                            ? new Date(
                                pod.deliveredAt
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td>
                          {pod.deliveredToName || "-"}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            ) : (
              <p className="subtle">
                {podShipmentId.trim()
                  ? "No created POD found for the entered shipment ID."
                  : "No created POD records available."}
              </p>
            )}
          </>
        )}

      </section>

    </div>
  );
}

export default PODRequestConfirmation;