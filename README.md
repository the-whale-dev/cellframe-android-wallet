# 🚧 Quantum Wallet (Under Development)

Welcome to the **Quantum Wallet**, the first Android wallet for the Backbone network! 🎉  

⚠️ **Please Note:**
- This project is currently in active development, and the UI is not final.
- Only the **Backbone network** is **fully** supported at the moment. KelVPN is not supported by all RPC nodes and may require multiple attempts to complete a transaction.
- While the app functions correctly in most cases, there are known issues that may affect usability. See [Current Issues](#current-issues) for details.
- If you wish to use the wallet now you can download the pre-built app-release.apk [here](https://drive.google.com/file/d/1ZtakCn3yykhcESlImGa39B8Mne7fwOol/view?usp=sharing)
  
We appreciate your patience and feedback as we work toward making this project more stable and feature-rich!

## App Layout
<p align="center">
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222523_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_222843_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250123_010800_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250123_011144_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250122_223458_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
   <img src="https://github.com/the-whale-dev/cellframe-android-wallet-imgs/blob/main/Screenshot_20250123_005115_Quantum%20Wallet.jpg" alt="Init page of the wallet" width="150" />
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
1) If on Windows clone or move the project to a folder so that it has the shortest possible path e.g. C:\X\
2) Open a command prompt and cd into {PROJECT}/android
3) Run gradlew assembleRelease
4) Wait for release .apk to get created
5) Download/Move the app-release.apk from the {PROJECT}/android/app/build/outputs/app-release.apk to your Android device
6) Install the .apk on your device by opening it on your device

## TODO
1) Create functioning staking transaction
2) Create functioning MN delegating transaction
3) Create functioning bridge transaction
4) Complete ability to connect to cellframe sites such as stake.cellframe.net, vote.cellframe.net and bridge.cellframe.net using local TCP server
5) Add repository for token details such as token icon ???

## Other Information
This project uses a modified version of the demlabs [cellframe-tool-sign](https://gitlab.demlabs.net/cellframe/cellframe-tool-sign) project which has JNI wrappers added so that it is functional with Android devices. You can see the modified code [here](https://github.com/the-whale-dev/cellframe-android-wallet-misc)

## Current Issues
1) cellframe-tool-sign currently creates a different wallet to one created via the [Cellframe Dashboard](https://cellframe.net/download/) using the same seed phrase. You can still sign transactions and the .dwallet files are even compatible with eachother but the generation of the .dwallet file is different
2) RPC nodes are under development and can sometimes become unstable. This isn't a major issue but there could be temporary issues creating transactions whilst you wait for the RPC nodes to become stable again
3) There are only RPC nodes for the Backbone network at the moment. While you can send tokens to your KelVPN address it is not recommended as you may not be able to move them for some time
