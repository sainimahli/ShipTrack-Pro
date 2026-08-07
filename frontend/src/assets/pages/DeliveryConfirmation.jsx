import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    sendDeliveryOtp,
    verifyDeliveryOtp,
} from "../services/api";

const initialForm = {
    shipmentId: "",
    receiverName: "",
    remarks: "",
};

function DeliveryConfirmation() {

    const [form, setForm] = useState(initialForm);
    const [confirmation, setConfirmation] = useState(null);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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

                <div className="toolbar" style={{ margin: "22px 0 0" }}>
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