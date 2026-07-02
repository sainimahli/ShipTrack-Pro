import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../../../App.css';

const TrackShipment = () => {
  const { auth } = useContext(AuthContext);
  const [trackingId, setTrackingId] = useState('');
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/shipments/track/${trackingId}`,
        {
          headers: {
            'Authorization': `Bearer ${auth?.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Shipment not found');
      }

      const data = await response.json();
      setShipmentData(data);
      setActiveTab('details');
    } catch (err) {
      setError(err.message || 'Failed to fetch shipment');
      setShipmentData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFA500',
      'shipped': '#2196F3',
      'in-transit': '#4CAF50',
      'delivered': '#4CAF50',
      'cancelled': '#F44336'
    };
    return colors[status?.toLowerCase()] || '#666';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Track Shipment</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('search')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'search' ? '#2196F3' : '#f0f0f0',
            color: activeTab === 'search' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Search
        </button>
        {shipmentData && (
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'details' ? '#2196F3' : '#f0f0f0',
              color: activeTab === 'details' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Details
          </button>
        )}
      </div>

      {activeTab === 'search' && (
        <form onSubmit={handleTrack} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Tracking ID
            </label>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking ID (e.g., SHIP001)"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Tracking...' : 'Track Shipment'}
          </button>
        </form>
      )}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {activeTab === 'details' && shipmentData && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>Shipment Overview</h2>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Tracking ID:</strong> {shipmentData.trackingId}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Status:</strong>
              <span style={{
                display: 'inline-block',
                marginLeft: '8px',
                padding: '4px 12px',
                backgroundColor: getStatusColor(shipmentData.status),
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {shipmentData.status?.toUpperCase()}
              </span>
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Origin:</strong> {shipmentData.origin || 'N/A'}
            </p>
            <p style={{ margin: '5px 0', color: '#666' }}>
              <strong>Destination:</strong> {shipmentData.destination || 'N/A'}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Timeline</h3>
            <div style={{ borderLeft: '3px solid #2196F3', paddingLeft: '20px' }}>
              {shipmentData.timeline && shipmentData.timeline.length > 0 ? (
                shipmentData.timeline.map((event, index) => (
                  <div key={index} style={{ marginBottom: '15px', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-26px',
                      top: '0px',
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#2196F3',
                      borderRadius: '50%'
                    }}></div>
                    <p style={{ margin: '0 0 5px 0', fontWeight: '500', color: '#333' }}>
                      {event.status}
                    </p>
                    <p style={{ margin: '0', color: '#999', fontSize: '13px' }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.location && (
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>No timeline events available</p>
              )}
            </div>
          </div>

          {shipmentData.estimatedDelivery && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px',
              marginTop: '20px'
            }}>
              <p style={{ margin: '0', color: '#2e7d32', fontWeight: '500' }}>
                📦 Estimated Delivery: {new Date(shipmentData.estimatedDelivery).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackShipment;
