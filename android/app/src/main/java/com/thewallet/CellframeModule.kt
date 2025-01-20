package com.thewallet

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.BufferedReader
import java.io.InputStreamReader
import android.util.Log
import java.io.FileNotFoundException

class CellframeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) 
{
    // Load the shared library
    init {
        try {
            System.loadLibrary("cellframe-tool-sign") // Do not include 'lib' prefix or '.so' suffix
            Log.d("MY_APP", "Successfully loaded libcellframe-tool-sign.so")
        } catch (e: UnsatisfiedLinkError) {
            Log.e("MY_APP", "Failed to load shared library: ${e.message}")
        }
    }

    override fun getName(): String {
        return "CellframeToolSign"
    }

    @ReactMethod
    fun wrapWalletCreate(walletPath: String, walletName: String, pass: String, sigType: String, seed: String, promise: Promise) {
        try {
            val result = wrapWalletCreateNative(walletPath, walletName, pass, sigType, seed)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("WRAP_WALLET_ERROR", e.message)
        }
    }

    @ReactMethod
    fun wrapWalletDetails(walletPath: String, networkID: String, pwd: String, promise: Promise)
    {
        try
        {
            val result = wrapWalletDetailsNative(walletPath, networkID, pwd);
            promise.resolve(result)
        }
        catch(e: Exception)
        {
            promise.reject("WRAP_DETAILS_ERROR", e.message)
        }
    }

    @ReactMethod
    fun wrapWalletSign(walletPath: String, pwd: String, input: String, promise: Promise)
    {
        try
        {
            val result = wrapWalletSignNative(walletPath, pwd, input);
            promise.resolve(result)
        }
        catch(e: Exception)
        {
            promise.reject("WRAP_DETAILS_ERROR", e.message)
        }
    }

    // Declare the external native function
    private external fun wrapWalletCreateNative(
        walletPath: String,
        walletName: String,
        pass: String,
        sigType: String,
        seed: String
    ): Int

    private external fun wrapWalletDetailsNative(
        walletPath: String,
        networkID: String,
        pwd: String
    ): String

    private external fun wrapWalletSignNative(
        walletPath: String,
        pwd: String,
        input: String
    ): String
}
