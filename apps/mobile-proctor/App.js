import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import io from 'socket.io-client';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    try {
      const payload = JSON.parse(data);
      if (payload.examSessionId && payload.pairingToken) {
        setSessionData(payload);
        connectToSignalingServer(payload);
      }
    } catch (e) {
      alert('Invalid QR Code format. Please scan from the student portal.');
    }
  };

  const connectToSignalingServer = (payload) => {
    const WS_URL = payload.streamingServiceUrl || 'http://localhost:4003';
    socketRef.current = io(`${WS_URL}/signaling`, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join', {
        sessionId: payload.examSessionId,
        role: 'secondary',
        streamToken: payload.pairingToken,
      });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });
  };

  if (hasPermission === null) return <View style={styles.container}><Text>Requesting camera permissions...</Text></View>;
  if (hasPermission === false) return <View style={styles.container}><Text>No access to camera</Text></View>;

  return (
    <View style={styles.container}>
      {!sessionData ? (
        <View style={styles.scannerContainer}>
          <Text style={styles.title}>ExamGuard Mobile Proctor</Text>
          <Text style={styles.subtitle}>Scan the QR code shown on your laptop to link phone camera</Text>
          <Camera
            style={styles.camera}
            type={CameraType.back}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
        </View>
      ) : (
        <View style={styles.activeContainer}>
          <Text style={styles.title}>📱 Secondary View Active</Text>
          <Text style={styles.status}>
            Status: {isConnected ? '🟢 Connected & Streaming' : '🔴 Connecting...'}
          </Text>
          <Camera style={styles.previewCamera} type={CameraType.back} />
          <Text style={styles.instructions}>
            Place your phone at a 45-degree angle beside your desk so your keyboard and screen are visible.
          </Text>
          <TouchableOpacity style={styles.disconnectBtn} onPress={() => setSessionData(null)}>
            <Text style={styles.btnText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a', justifyContent: 'center', alignItems: 'center' },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  activeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e8eaf6', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#8892b0', textAlign: 'center', marginBottom: 20 },
  status: { fontSize: 16, color: '#10b981', marginBottom: 15 },
  camera: { width: 300, height: 300, borderRadius: 12, overflow: 'hidden' },
  previewCamera: { width: 250, height: 350, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  instructions: { fontSize: 13, color: '#8892b0', textAlign: 'center', marginHorizontal: 20, marginBottom: 20 },
  disconnectBtn: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
});
