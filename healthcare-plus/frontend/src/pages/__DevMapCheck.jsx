// Dev-only harness to runtime-verify LiveTrackingMap (Google Maps).
// Access at /__devmap during development. Remove this file after verification.
import LiveTrackingMap from '../components/emergency/LiveTrackingMap';

export default function DevMapCheck() {
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 4, fontFamily: 'sans-serif' }}>Dev Map Check — Google Maps</h1>
      <p style={{ marginBottom: 12, fontSize: 13, color: '#64748b', fontFamily: 'sans-serif' }}>
        Verifies LiveTrackingMap renders with Google Maps JS API, patient + ambulance markers, and a real road route via Google Directions.
      </p>
      <LiveTrackingMap
        patientLat={22.3072}
        patientLng={73.1812}
        driverLat={22.3181}
        driverLng={73.1650}
        status="EN_ROUTE"
        driverName="Test Driver"
        vehicleNumber="GJ-06-AB-1234"
        distanceKm={2.4}
        etaMin={7}
      />
    </div>
  );
}
