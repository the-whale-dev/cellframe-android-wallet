<h1>⚠️ WARNING: This project is under development!</h1>
This project is a WIP and is most likely not suitable for casual use. There are certain bugs which may make for an uncomfortable experience for the average user. Issues can be found at the bottom of this README

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Running Debug on Computer

1) Install [Android Studio](https://developer.android.com/studio)
2) Open Android Studio
3) Click the 4 line toolbar button
4) Click Tools
5) Click SDK Manager
6) In the centre you'll see "SDK Platforms", "SDK Tools" and "SDK Update Sites". Click "SDK Tools"
7) Install the following
   - Android SDK
   - NDK (Side by side)
   - Android SDK Command-line Tools (latest)
   - CMake
   - Android SDK Platform-Tools
   - (Optional) Google USB Driver -> If you want to run on a physical Android device
   - (Optional) Android Emulator -> If you want to run an Android emulator
9) Once installed. Close all instances of command prompts/terminals (alternatively you can restart the computer)
10) Clone the project
11) If running a physical device make sure it's plugged in and USB terthering is enabled. You may need to enable developer tools on your phone which you can find out how to do for your device online
12) Run "npm run start" in the parent folder
13) Press "a" to open up the Android

## Building App Instance



## Other Information
This project uses a modified version of the demlabs [cellframe-tool-sign](https://gitlab.demlabs.net/cellframe/cellframe-tool-sign) project which has had JNI wrappers added so that it is functional with Android devices. You can see the modified code [here](https://github.com/the-whale-dev/cellframe-android-wallet-misc)

## Current Issues
1) cellframe-tool-sign currently creates a different wallet to one created via the [Cellframe Dashboard](https://cellframe.net/download/) using the same seed phrase
2) RPC nodes are still under development and are currently unstable. This isn't a major issue but you may struggle to create transactions for awhile and have to wait for the RPC nodes to become stable again
