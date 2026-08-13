import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createPODConfirmation,
  getProofOfDelivery,
  downloadPODPdf,
  downloadSignature,
  downloadPackageImage,
} from "../services/api";
import { AuthContext } from "../context/auth";

function ProofOfDelivery() {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  const [form, setForm] = useState({
    shipmentId: "",
    deliveredToName: "",
    verificationMethod: "SIGNATURE",
    deliveredAt: "",
    deliveryNotes: "",
    signature: null,
    packageImages: [],
  });

  const [createdPod, setCreatedPod] = useState(null);
  const [podId, setPodId] = useState("");
  const [podDetails, setPodDetails] = useState(null);

  const canCreatePOD =
    auth?.user?.role === "LOGISTICS_OPERATOR";

  useEffect(() => {
    setForm((current) => ({
      ...current,
      shipmentId: location.state?.shipmentId || "",
      deliveredAt: new Date().toISOString(),
    }));
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSignatureChange = (event) => {
    const file = event.target.files?.[0] || null;

    setForm((current) => ({
      ...current,
      signature: file,
    }));
  };

  const handlePackageImages = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length !== 3) {
      alert("Please select exactly 3 package images.");
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      packageImages: files,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.shipmentId) {
      alert("Shipment ID is required.");
      return;
    }

    if (!form.deliveredToName.trim()) {
      alert("Receiver name is required.");
      return;
    }

    if (!form.signature) {
      alert("Customer signature is required.");
      return;
    }

    if (form.packageImages.length !== 3) {
      alert("Please select exactly 3 package images.");
      return;
    }

    const formData = new FormData();

    formData.append("shipmentId", form.shipmentId);
    formData.append(
      "deliveredToName",
      form.deliveredToName.trim()
    );
    formData.append(
      "verificationMethod",
      form.verificationMethod
    );
    formData.append("deliveredAt", form.deliveredAt);
    formData.append(
      "deliveryNotes",
      form.deliveryNotes.trim()
    );
    formData.append("signature", form.signature);

    form.packageImages.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await createPODConfirmation(formData);

      setCreatedPod(response.data);

      alert(
        "POD confirmation request sent successfully."
      );
    } catch (error) {
      console.error("POD confirmation error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to create POD confirmation request."
      );
    }
  };

  const handleReset = () => {
    setForm((current) => ({
      ...current,
      deliveredToName: "",
      deliveryNotes: "",
      signature: null,
      packageImages: [],
    }));

    setCreatedPod(null);
  };

  const handleGetPOD = async () => {
    if (!podId) {
      alert("Please enter POD ID.");
      return;
    }

    try {
      const response = await getProofOfDelivery(podId);

      setPodDetails(response.data);
    } catch (error) {
      console.error("Get POD error:", error);

      alert(
        error?.response?.data?.message ||
          "POD not found."
      );
    }
  };

  // Download Blob returned by the backend
  const saveBlobFile = (blobData, fileName) => {
    const blob = new Blob([blobData]);

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!podDetails?.podId) {
      alert("POD details are not available.");
      return;
    }

    try {
      const response = await downloadPODPdf(
        podDetails.podId
      );

      saveBlobFile(
        response.data,
        `POD-${podDetails.podId}.pdf`
      );
    } catch (error) {
      console.error("POD PDF download error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to download POD PDF."
      );
    }
  };

  const handleDownloadSignature = async () => {
    if (!podDetails?.podId) {
      alert("POD details are not available.");
      return;
    }

    try {
      const response = await downloadSignature(
        podDetails.podId
      );

      const contentType =
        response.headers?.["content-type"] ||
        "image/png";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `POD-${podDetails.podId}-signature`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Signature download error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to download signature."
      );
    }
  };

  const handleDownloadPackageImage = async (
    imageUrl,
    index
  ) => {
    try {
      const response = await downloadPackageImage(
        imageUrl
      );

      const contentType =
        response.headers?.["content-type"] ||
        "image/jpeg";

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `POD-${podDetails?.podId}-package-${index + 1}`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Package image download error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to download package image."
      );
    }
  };

  return (
    <div className="page">

      <div className="page-header">
        <div className="eyebrow">
          Proof of Delivery
        </div>

        <h1>Create Proof of Delivery</h1>

        <p className="subtle">
          Capture delivery confirmation, customer
          signature, and package images for completed
          shipments.
        </p>
      </div>

      {/* CREATE POD - LOGISTICS OPERATOR ONLY */}

      {canCreatePOD && (
        <form
          className="panel"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="shipmentId">
                Shipment ID
              </label>

              <input
                className="input"
                id="shipmentId"
                name="shipmentId"
                type="number"
                placeholder="Enter Shipment ID"
                value={form.shipmentId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="deliveredToName">
                Delivered To
              </label>

              <input
                className="input"
                id="deliveredToName"
                name="deliveredToName"
                type="text"
                placeholder="Enter Receiver Name"
                value={form.deliveredToName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="verificationMethod">
                Verification Method
              </label>

              <input
                className="input"
                id="verificationMethod"
                name="verificationMethod"
                value={form.verificationMethod}
                readOnly
              />
            </div>

            <div className="form-field">
              <label htmlFor="deliveredAt">
                Delivered Date & Time
              </label>

              <input
                className="input"
                id="deliveredAt"
                name="deliveredAt"
                type="text"
                value={
                  form.deliveredAt
                    ? new Date(
                        form.deliveredAt
                      ).toLocaleString()
                    : ""
                }
                readOnly
              />
            </div>

            <div className="form-field full">
              <label htmlFor="deliveryNotes">
                Delivery Notes
              </label>

              <textarea
                className="textarea"
                id="deliveryNotes"
                name="deliveryNotes"
                placeholder="Enter delivery notes"
                value={form.deliveryNotes}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-field">
              <label htmlFor="signature">
                Customer Signature
              </label>

              <input
                className="input"
                id="signature"
                name="signature"
                type="file"
                accept="image/*"
                onChange={handleSignatureChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="packageImages">
                Package Images
              </label>

              <input
                className="input"
                id="packageImages"
                name="packageImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePackageImages}
                required
              />

              <small className="subtle">
                Please select exactly 3 package images.
              </small>
            </div>

          </div>

          <div
            className="toolbar"
            style={{ marginTop: "20px" }}
          >
            <button
              className="button primary"
              type="submit"
            >
              Send POD Confirmation
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>
      )}

      {/* CREATED POD CONFIRMATION */}

      {createdPod && (
        <div
          className="panel"
          style={{ marginTop: "20px" }}
        >
          <h3>POD Confirmation Request</h3>

          {createdPod.confirmationId !== undefined && (
            <p>
              <strong>Confirmation ID:</strong>{" "}
              {createdPod.confirmationId}
            </p>
          )}

          {createdPod.shipmentId !== undefined && (
            <p>
              <strong>Shipment ID:</strong>{" "}
              {createdPod.shipmentId}
            </p>
          )}

          {createdPod.status !== undefined && (
            <p>
              <strong>Status:</strong>{" "}
              {createdPod.status}
            </p>
          )}
        </div>
      )}

      {/* VIEW POD */}

      <div
        className="panel"
        style={{ marginTop: "20px" }}
      >
        <h3>View Existing Proof of Delivery</h3>

        <div className="form-grid">

          <div className="form-field">
            <label htmlFor="podId">
              POD ID
            </label>

            <input
              className="input"
              id="podId"
              type="number"
              placeholder="Enter POD ID"
              value={podId}
              onChange={(event) =>
                setPodId(event.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label>&nbsp;</label>

            <button
              className="button primary"
              type="button"
              onClick={handleGetPOD}
            >
              Get POD
            </button>
          </div>

        </div>
      </div>

      {/* POD DETAILS */}

      {podDetails && (
        <div
          className="panel"
          style={{ marginTop: "20px" }}
        >

          <h3>Proof of Delivery Details</h3>

          <p>
            <strong>POD ID:</strong>{" "}
            {podDetails.podId}
          </p>

          <p>
            <strong>Shipment ID:</strong>{" "}
            {podDetails.shipmentId}
          </p>

          <p>
            <strong>Tracking Number:</strong>{" "}
            {podDetails.trackingNumber}
          </p>

          <p>
            <strong>Delivered To:</strong>{" "}
            {podDetails.deliveredToName}
          </p>

          <p>
            <strong>Verification Method:</strong>{" "}
            {podDetails.verificationMethod}
          </p>

          <p>
            <strong>Delivered At:</strong>{" "}
            {podDetails.deliveredAt
              ? new Date(
                  podDetails.deliveredAt
                ).toLocaleString()
              : "-"}
          </p>

          <p>
            <strong>Delivery Notes:</strong>{" "}
            {podDetails.deliveryNotes || "-"}
          </p>

          <p>
            <strong>Shipment Type:</strong>{" "}
            {podDetails.shipmentType || "-"}
          </p>

          <p>
            <strong>Sender City:</strong>{" "}
            {podDetails.senderCity || "-"}
          </p>

          <p>
            <strong>Receiver City:</strong>{" "}
            {podDetails.receiverCity || "-"}
          </p>

          {/* PACKAGE IMAGES */}

          {podDetails.images?.length > 0 && (
            <div style={{ marginTop: "20px" }}>

              <h3 className="section-title">
                Package Images
              </h3>

              <div
                className="grid grid-2"
                style={{ marginTop: "12px" }}
              >

                {podDetails.images.map(
                  (image, index) => (
                    <div
                      className="schema-box"
                      key={image}
                    >

                      <img
                        src={image}
                        alt={`Package ${index + 1}`}
                        style={{
                          width: "100%",
                          maxHeight: "250px",
                          objectFit: "contain",
                          borderRadius: "8px",
                        }}
                      />

                      <button
                        className="button secondary"
                        type="button"
                        style={{
                          marginTop: "10px",
                        }}
                        onClick={() =>
                          handleDownloadPackageImage(
                            image,
                            index
                          )
                        }
                      >
                        Download Image
                      </button>

                    </div>
                  )
                )}

              </div>

            </div>
          )}

          {/* DOWNLOAD BUTTONS */}

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            <button
              className="button primary"
              type="button"
              onClick={handleDownloadPDF}
            >
              Download PDF
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={handleDownloadSignature}
            >
              Download Signature
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default ProofOfDelivery;