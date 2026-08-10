// TEMPORARY dev-only harness to runtime-verify LiveTrackingMap (MapLibre + OpenFreeMap).
// Delete this file and its route after verification.
import LiveTrackingMap from '../components/emergency/LiveTrackingMap';

export default function DevMapCheck() {
  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Dev Map Check</h1>
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
