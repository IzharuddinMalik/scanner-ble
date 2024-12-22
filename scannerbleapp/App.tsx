import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Button, StyleSheet, NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { BluetoothModule } = NativeModules;
const bluetoothEmitter = new NativeEventEmitter(BluetoothModule);

interface Device {
  name: string | null;
  address: string;
  rssi: number;
}

// Define the type for the native module
interface BluetoothModuleInterface {
  startScanning(): void;
  stopScanning(): void;
}

// Type assertion for the native module
const BLEModule = BluetoothModule as BluetoothModuleInterface;

const App = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Listen for the correct event name that matches the Kotlin code
    const subscription = bluetoothEmitter.addListener(
      'BluetoothDeviceFound',
      (device: Device) => {
        console.log(`Device: ${device.name}, Address: ${device.address}, RSSI: ${device.rssi}`);
        setDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.address === device.address)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    );

    return () => {
      subscription.remove();
      if (isScanning) {
        BLEModule.stopScanning();
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      console.warn('Required permissions not granted.');
      return;
    }
  
    setDevices([]);
    setIsScanning(true);
    try {
      BLEModule.startScanning();
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      setIsScanning(false);
      BLEModule.stopScanning();
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return Object.values(granted).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  return (
    <View style={styles.container}>
      <Button 
        title={isScanning ? "Stop Scanning" : "Start Scanning"} 
        onPress={isScanning ? stopScanning : startScanning} 
      />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <Text style={styles.deviceName}>
              {item.name || 'Unknown Device'} ({item.address})
            </Text>
            <Text style={styles.deviceRssi}>RSSI: {item.rssi} ms</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>
            {isScanning ? 'Scanning for devices...' : 'No devices found. Start scanning!'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    fontSize: 16,
  },
  deviceRssi: {
    fontSize: 14,
    color: '#666',
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default App;