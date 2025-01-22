<h1>⚠️ WARNING: This project is under development!</h1>
<h2>⚠️ WARNING: Only the Backbone network is useable at the moment</h2>
This project is a WIP and while the app does function correctly at most times it may not be suitable for casual use. There are certain bugs which may make for an uncomfortable experience for the average user. Issues can be found at the bottom of this README

## App Layout
<p align="center">
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222523_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="200" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222843_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="200" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222523_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="200" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222523_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="200" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222523_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="200" />
</p>

## Getting Started

1) Install [Node.JS](https://nodejs.org/en/download)
2) Install the [JDK](https://www.oracle.com/java/technologies/downloads/?er=221886#java17). Make sure you're downloading JDK 17
3) Install [Android Studio](https://developer.android.com/studio)
4) Open Android Studio
5) Click the 4 line toolbar button
6) Click Tools
7) Click SDK Manager
8) In the centre you'll see "SDK Platforms", "SDK Tools" and "SDK Update Sites". Click "SDK Tools"
9) Install the following
   - Android SDK
   - NDK (Side by side)
   - Android SDK Command-line Tools (latest)
   - CMake
   - Android SDK Platform-Tools
   - (Optional) Google USB Driver -> If you want to run on a physical Android device
   - (Optional) Android Emulator -> If you want to run an Android emulator
10) Once installed. Close all instances of command prompts/terminals (alternatively you can restart the computer)
11) Clone the project
12) Open the command prompt/terminal and run "npm i" in the cloned folder to install all necessary packages
13) If running a physical device make sure it's plugged in and USB terthering is enabled. You may need to enable developer tools on your phone which you can find out how to do for your device online
14) Run "npm run start" in the parent folder
15) Press "a" to open the app on Android

## Building App Instance

To build the app to run on your Android device without debugging tools you need to do the following:
1) Open a command prompt and cd into {PROJECT}/android
2) Run gradlew assembleRelease
3) Wait for release .apk to get created
4) Download/Move the app-release.apk from the {PROJECT}/android/app/build/outputs/app-release.apk to your Android device
5) Install the .apk on your device by opening it on your device

## Other Information
This project uses a modified version of the demlabs [cellframe-tool-sign](https://gitlab.demlabs.net/cellframe/cellframe-tool-sign) project which has had JNI wrappers added so that it is functional with Android devices. You can see the modified code [here](https://github.com/the-whale-dev/cellframe-android-wallet-misc)

## Current Issues
1) cellframe-tool-sign currently creates a different wallet to one created via the [Cellframe Dashboard](https://cellframe.net/download/) using the same seed phrase. You can still sign transactions and the .dwallet files are even compatible with eachother but the generation of the .dwallet file is different
2) RPC nodes are still under development and are currently unstable. This isn't a major issue but you may struggle to create transactions for awhile and have to wait for the RPC nodes to become stable again
