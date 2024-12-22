package com.anonymous.scannerbleapp

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class BluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val bluetoothLeScanner: BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner

    override fun getName(): String {
        return "BluetoothModule"
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    fun startScanning() {
        bluetoothLeScanner?.startScan(scanCallback)
    }

    @ReactMethod
    fun stopScanning() {
        bluetoothLeScanner?.stopScan(scanCallback)
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device: BluetoothDevice = result.device
            val rssi: Int = result.rssi // Get the signal strength
            sendDeviceToJS(device.name, device.address, rssi)
        }
    }

    private fun sendDeviceToJS(deviceName: String?, deviceAddress: String, rssi: Int) {
        val params = Arguments.createMap().apply {
            putString("name", deviceName)
            putString("address", deviceAddress)
            putInt("rssi", rssi)
        }
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BluetoothDeviceFound", params)
    }
}