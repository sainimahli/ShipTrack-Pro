import { useState, useCallback, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    sendDeliveryOtp,
    verifyDeliveryOtp,
} from "../services/api";
import { ShipmentContext } from "../context/shipments";
import { AuthContext } from "../context/auth";

/**
 * Mask an email address for privacy display.
 * e.g. customer@gmail.com  →  cus***@gmail.com
 */
function maskEmail(email) {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1);
    return `${visible}***@${domain}`;
}

const initialForm = {
    shipmentId: "",
    receiverName: "",
    remarks: "",
};

function DeliveryConfirmation() {

    const { shipments } = useContext(ShipmentContext);
    const { auth } = useContext(AuthContext);

    const [form, setForm] = useState(initialForm);
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Derive the OTP recipient email from the shipment in context.
    // The backend sends to: shipment.userId → User.email
    // If the logged-in user owns the shipment, show their email masked.
    // Otherwise show a generic note (admin/operator confirming on behalf).
    const recipientEmail = useMemo(() => {
        if (!form.shipmentId) return null;
        const found = shipments.find(
            (s) => String(s.shipmentId) === String(form.shipmentId)
        );
        if (!found) return null;
        // If the current user is the shipment owner, use their email
        if (auth?.user?.email) return auth.user.email;
        return null;
    }, [form.shipmentId, shipments, auth]);

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };
    const handleSendOtp = async () => {
        try {
            await sendDeliveryOtp(form.shipmentId);

            setOtpSent(true);

            alert("OTP sent successfully.");
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                "Failed to send OTP."
            );
        }
    };

    const handleSubmit = useCallback(
        async (event) => {
            event.preventDefault();

            setSubmitError(null);
            setSubmitting(true);

            try {
                const result = await verifyDeliveryOtp(form.shipmentId, {
                    otp,
                    receiverName: form.receiverName,
                    remarks: form.remarks,
                });

                setConfirmation(result.data ?? result);

                alert("Delivery confirmed successfully.");
            } catch (err) {
                const msg =
                    err?.response?.data?.message ??
                    err?.response?.data ??
                    "Invalid OTP.";

                setSubmitError(typeof msg === "string" ? msg : JSON.stringify(msg));
            } finally {
                setSubmitting(false);
            }
        },
        [form, otp],
    );

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <div className="eyebrow">Shipment management</div>
                    <h1>Delivery confirmation</h1>
                    <p className="subtle">Confirm receipt for a shipment.</p>
                </div>

                <Link className="button secondary" to="/shipments">
                    View shipments
                </Link>
            </div>

            {submitError && (
                <div className="alert error" style={{ marginBottom: 18 }}>
                    {submitError}
                </div>
            )}

            {confirmation && (
                <div className="alert success" style={{ marginBottom: 18 }}>
                    Shipment <strong>{confirmation.shipmentId}</strong> delivery confirmed.
                </div>
            )}

            <form className="panel" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label htmlFor="shipmentId">Shipment ID</label>
                        <input
                            className="input"
                            id="shipmentId"
                            name="shipmentId"
                            onChange={handleChange}
                            required
                            type="number"
                            value={form.shipmentId}
                            placeholder="e.g. 33"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="receiverName">Receiver name</label>
                        <input
                            className="input"
                            id="receiverName"
                            name="receiverName"
                            onChange={handleChange}
                            required
                            value={form.receiverName}
                            placeholder="Enter receiver name"
                        />
                    </div>

                    <div className="form-field full">
                        <label htmlFor="remarks">Remarks</label>
                        <textarea
                            className="textarea"
                            id="remarks"
                            name="remarks"
                            onChange={handleChange}
                            value={form.remarks}
                            placeholder="Optional delivery notes"
                        />
                    </div>
                </div>
                {otpSent && (
                    <div className="form-field">
                        <label htmlFor="otp">OTP</label>

                        <input
                            className="input"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            required
                        />
                    </div>
                )}

                <div className="toolbar" style={{ margin: "22px 0 0", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                    {/* OTP recipient email info — shown before sending */}
                    {!otpSent && form.shipmentId && (
                        <div style={{
                            background: "#f0f7ff",
                            border: "1px solid #c3dafe",
                            borderRadius: 6,
                            padding: "10px 14px",
                            fontSize: 14,
                            color: "#1e3a5f",
                            width: "100%",
                        }}>
                            📧 
                            {recipientEmail ? (
                                <span>
                                    OTP will be sent to: 
                                    <strong>{maskEmail(recipientEmail)}</strong>
                                     (registered customer email)
                                </span>
                            ) : (
                                <span>
                                    OTP will be sent to the 
                                    <strong>registered customer email</strong>
                                     associated with this shipment.
                                </span>
                            )}
                        </div>
                    )}
                    {!otpSent ? (
                        <button
                            type="button"
                            className="button primary"
                            onClick={handleSendOtp}
                        >
                            Send OTP
                        </button>
                    ) : (
                        <button
                            className="button primary"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? "Verifying..." : "Verify OTP"}
                        </button>
                    )}
                </div>
            </form>

            {confirmation && (
                <div className="panel" style={{ marginTop: 18 }}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Confirmation ID</label>
                            <p>{confirmation.id}</p>
                        </div>

                        <div className="form-field">
                            <label>Shipment ID</label>
                            <p>{confirmation.shipmentId}</p>
                        </div>

                        <div className="form-field">
                            <label>Receiver name</label>
                            <p>{confirmation.receiverName}</p>
                        </div>

                        <div className="form-field">
                            <label>Confirmed at</label>
                            <p>{confirmation.confirmedAt}</p>
                        </div>

                        <div className="form-field full">
                            <label>Remarks</label>
                            <p>{confirmation.remarks || "-"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeliveryConfirmation;