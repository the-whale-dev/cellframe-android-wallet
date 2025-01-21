
import { Animated, BackHandler, Button, Image, NativeModules, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { words } from "./Info";
import { width } from '@fortawesome/free-solid-svg-icons/fa0';
import 'react-native-get-random-values';
import React from 'react';
import RNFS from 'react-native-fs';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import App from './App';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const { CellframeToolSign } = NativeModules;
const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList =
{
    Init: undefined;
    App: { initWallet: string; initPassword: string; foundWallets: string[] };
    WalletImporter: undefined;
    WalletCreator: undefined;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Init'>;
type WalletImporterProps = NativeStackScreenProps<RootStackParamList, 'WalletImporter'>;
type WalletCreatorProps = NativeStackScreenProps<RootStackParamList, 'WalletCreator'>;

const AppIcon = require(`./assets/icon.png`);

const wordArray = words.split("\n");
const createSeedPhrase = (wordCount: number = 24) =>
{
    try
    {
        const seed = [];
        if(!wordArray || wordArray.length === 0) throw new Error("Word list is empty or invalid.");
        if(wordCount <= 0) throw new Error("Cannot create a seed phrase of 0 or less words.");

        const maxValidValue = Math.floor(0xffffffff / wordArray.length) * wordArray.length;

        for(let i = 0; i < wordCount; i++)
        {
            let rand;
            do
            {
                try
                {
                    rand = crypto.getRandomValues(new Uint32Array(1))[0];
                }
                catch(err)
                {
                    throw new Error("Failed to generate secure random number.");
                }
            } while(rand >= maxValidValue);

            const index = rand % wordArray.length;
            seed.push(wordArray[index]);
        }

        return seed;
    }
    catch(err: any)
    {
        console.error(`CREATE-SEED-PHRASE Error: ${err.message}`);
        return null;
    }
}

const createWallet = async (phrase: string[], confirmPhrase: string[], password: string, navigation: any) =>
{
    try
    {
        if(phrase.includes("")) throw new Error("Invalid Seed Phrase Length");
        if((phrase.join("") + password) !== (confirmPhrase.join("") + password)) throw new Error("Secret Phrase didn't match one given");

        let walletCount = 0;
        let foundWallets: string[] = [];
        try
        {
            const files = await RNFS.readDir("/data/data/com.thewallet/files/wallets");
            foundWallets = files.filter((x) => !x.isDirectory()).filter((x) => x.ctime !== undefined).sort((a, b) => 
            {
                try { const poop = a.ctime!.getTime() - b.ctime!.getTime(); return poop } catch(err: any) { console.log(err); return 0; } 
            }).map((x) => x.name.split('.')[0]);
        }
        catch(err: any)
        {
            console.log(`Error accessing folder: ${err.message}`);
            await RNFS.mkdir("/data/data/com.thewallet/files/wallets");
        }

        const res = await CellframeToolSign.wrapWalletCreate("/data/data/com.thewallet/files/wallets", `${password === "" ? '' : "_"}Wallet-${walletCount}`, password, "sig_dil", phrase.join(" "));
        console.log("Result:", res);

        if(res === -1){ console.log("Error creating wallet"); return; }

        navigation.replace("App",
        {
            initWallet: `${password === "" ? '' : "_"}Wallet-${walletCount}`,
            initPassword: password,
            foundWallets: [...foundWallets, `${password === "" ? '' : "_"}Wallet-${walletCount}`]
        });
    }
    catch(err: any)
    {
        console.log(err);
    }
}

export function InitMapper(): React.JSX.Element
{
    const res =
    (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='Init' screenOptions={{ headerShown: false, headerTransparent: true, headerTitle: '' }} >
                <Stack.Screen name="Init" component={Init} />
                <Stack.Screen name="App" component={App} />
                <Stack.Screen name="WalletImporter" component={WalletImport} />
                <Stack.Screen name="WalletCreator" component={WalletCreate} />
            </Stack.Navigator>
        </NavigationContainer>
    );
    return res;
}

function Init({ navigation }: Props): React.JSX.Element 
{
    const [phrase, setPhrase] = useState<string[]>([]);
    const [confirmPhrase, setConfirmPhrase] = useState<string[]>(["","","","","","","","","","","","","","","","","","","","","","","",""]);
    const [stage, setStage] = useState<'LOADING' | 'UNLOCK' | 'INIT' | 'CREATE.START' | 'CREATE.FINAL' | 'IMPORT'>('LOADING');
    const [password, setPassword] = useState("");
    const [unlock, setUnlock] = useState("");
    const [wallets, setWallets] = useState<string[]>([]);
    const [error, setError] = useState("");

    useEffect(() =>
    {
        //Check if wallet exists, if it does then move to App
        exists();
    }, []);

    useEffect(() =>
    {
        const goBack = () =>
        {
            if(stage === "IMPORT" || stage === "CREATE.START")
            {
                setStage("INIT");
                return true;
            }
            else if(stage === "CREATE.FINAL")
            {
                setStage("CREATE.START");
                return true;
            }

            return false;
        }

        BackHandler.addEventListener('hardwareBackPress', goBack);

        return () => BackHandler.removeEventListener('hardwareBackPress', goBack);
    }, [stage]);

    const exists = async() =>
    {
        try
        {
            const res = await RNFS.exists("/data/data/com.thewallet/files/wallets");
            console.log(`Does the wallet exist: ${res}`);
            if(res)
            {
                const files = await RNFS.readDir("/data/data/com.thewallet/files/wallets");
                if(files.length <= 0) return setStage("INIT");

                const foundWallets: string[] = files.filter((x) => !x.isDirectory()).filter((x) => x.ctime !== undefined).sort((a, b) => 
                {
                    try { const poop = a.ctime!.getTime() - b.ctime!.getTime(); return poop } catch(err: any) { console.log(err); return 0; } 
                }).map((x) => x.name.split('.')[0]);
                const initWallet = foundWallets[1];

                if(initWallet.startsWith("_"))
                {
                    setUnlock(initWallet);
                    setWallets(foundWallets);
                    setStage("UNLOCK");
                    return;
                }

                console.log(foundWallets);

                navigation.replace("App", 
                {
                    initWallet,
                    initPassword: password,
                    foundWallets
                });
            }
            else
            {
                setStage("INIT");
            }
        }
        catch(err: any)
        {
            console.log(err);
            setStage("INIT");
        }
    }

    const reuse = async () =>
    {
        try
        {
            if(confirmPhrase.length != 24) throw new Error("Invalid Seed Phrase Length");
                        
            const walletCount = (await RNFS.readDir("/data/data/com.thewallet/files/wallets")).length;
            //determine wallet count
            console.log(confirmPhrase.join(" "));
            await RNFS.mkdir("/data/data/com.thewallet/files/wallets/");
            const res = await CellframeToolSign.wrapWalletCreate("/data/data/com.thewallet/files/wallets", `${password === "" ? '' : "_"}Wallet-${walletCount}`, password, "sig_dil", confirmPhrase.join(" "));
            console.log("Result:", res);
            // Now we must go to App page

            if(res === -1){ console.log("Error creating wallet"); return; }

            navigation.replace("App",
            {
                initWallet: `${password === "" ? '' : "_"}Wallet-0`,
                initPassword: password,
                foundWallets: [`${password === "" ? '' : "_"}Wallet-0`]
            });
        }
        catch(err: any)
        {
            console.log(err);
        }
    }

    const part = (num: number) =>
    {
        if(num === 1)
        {
            return phrase.slice(0, 12);
        }
        else
        {
            return phrase.slice(12, 24);
        }
    }

    const subpart = (num: number) =>
    {
        if(num === 1)
        {
            return confirmPhrase.slice(0, 12);
        }
        else
        {
            return confirmPhrase.slice(12, 24);
        }
    }

    const confirmInputRefs = useRef<Array<React.RefObject<TextInput>>>([]);
    const handleTextChange = (index: number, value: string) => 
    {
        setConfirmPhrase((prev) => 
        {
            const updated = [...prev];
            updated[index] = value.trim();
            return updated;
        });
        console.log(confirmPhrase);
    }

    const handleSubmitEditing = (index: number) => 
    {
        console.log(confirmInputRefs.current);
        const nextIndex = index + 1;
        if(!confirmInputRefs.current) return;

        if (nextIndex < confirmInputRefs.current.length) 
        {
            if(!confirmInputRefs.current[nextIndex]) return;
            confirmInputRefs.current[nextIndex].current!.focus();
        }
        else if(nextIndex == confirmInputRefs.current.length)
        {
            console.log(phrase.length);
            console.log(confirmPhrase.length);
            console.log(phrase.join(" ") === confirmPhrase.join(" "));
            if(phrase.length > 0)
            {
                if(phrase.join(" ") !== confirmPhrase.join(" ")) throw new Error("Phrases don't match");
            }
            reuse();
        }
    }

    const attemptUnlock = async () =>
    {
        const res = await CellframeToolSign.wrapWalletDetails(`/data/data/com.thewallet/files/wallets/${unlock}.dwallet`, "0x0404202200000000", password);
        if(res.startsWith("Error opening wallet")) 
        {
            console.log("It is possible the password is to blame. Which in this case it is");
            setError("Wrong password given");
            return;
        }

        navigation.replace("App",
        {
            initWallet: unlock,
            initPassword: password,
            foundWallets: wallets
        });
    }

    if(stage === "LOADING") return <View style={{ backgroundColor: Colors.darker, alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%'}}><Text>LOADING</Text></View>
    else if(stage === "UNLOCK") return (
        <GestureHandlerRootView>
    <View style={{ backgroundColor: Colors.darker, alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%'}}>
        <TextInput placeholder='Password' onChangeText={(e) => setPassword(e)} style={{ width: '75%', backgroundColor: 'white', color: 'purple', textAlign: 'center' }} onSubmitEditing={attemptUnlock} placeholderTextColor={'grey'} />
        <Text style={{color: 'red', fontSize: 18, fontWeight: '600'}}>{error}</Text>
        <TouchableOpacity style={{ backgroundColor: 'purple', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }} onPress={attemptUnlock}>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Unlock Wallet</Text>
        </TouchableOpacity>
    </View>
    </GestureHandlerRootView>
    );
    const res =
    (
        <GestureHandlerRootView>
            <View style={{ backgroundColor: Colors.darker, flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <SafeAreaView style={{ width: '100%', height: '100%' }}>
                    <StatusBar
                            barStyle={'dark-content'}
                            backgroundColor={'transparent'}
                            translucent={true}
                        />
                    <Animated.View style={{position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        {
                            stage === "INIT"
                            ?
                            <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', height: '100%',  marginTop: useSafeAreaInsets().top}}>
                                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                    <Image source={AppIcon} style={{ height: 84, width: 84 }} />
                                    <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: 'white', fontSize: 32, fontWeight: '800', textAlign: 'left', width: '100%'}}>Quantum Wallet</Text>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: 'lightgrey', textAlign: 'left', width: '100%', marginLeft: 10 }}>Keep your assets protected, forever.</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                    <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, width: '75%', marginVertical: 8}} onPress={() => 
                                    {
                                        const seed = createSeedPhrase();
                                        if(!seed) return;

                                        setPhrase(seed);
                                        setConfirmPhrase(seed.map((x) => ""));
                                        setStage("CREATE.START"); 
                                    }}>
                                        <Text style={{color: 'white', fontSize: 18, fontWeight: '800', textAlign: 'center'}}>Create New Wallet</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, width: '75%', marginVertical: 8}} onPress={() => setStage("IMPORT") }>
                                        <Text style={{color: 'white', fontSize: 18, fontWeight: '800', textAlign: 'center'}}>Import Existing Wallet</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            :
                            stage === "CREATE.START"
                            ?
                            <View style={{ flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: Colors.darker, marginTop: useSafeAreaInsets().top}}>
                                <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginVertical: 16 }}>Backup Seed Phrase</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4, backgroundColor: 'white'}}>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        part(1).map((x, index) => <Text key={index} style={{ margin: 4, textAlign: 'center', color: 'purple', fontSize: 18 }}>{index+1}. {x}</Text>)
                                    }
                                    </View>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        part(2).map((x, index) => <Text key={index + 12} style={{  margin: 4, textAlign: 'center', color: 'purple', fontSize: 18}}>{index + 13}. {x}</Text>)
                                    }
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => setStage("CREATE.FINAL")}>
                                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Continue</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            :
                            stage === "CREATE.FINAL"
                            ?
                            <SafeAreaView style={{ flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: Colors.darker, marginTop: useSafeAreaInsets().top}}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4}}>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        subpart(1).map((_, index) => <TextInput key={index} ref={confirmInputRefs.current[index]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'black' }} placeholder={`${index+1}. Word`} placeholderTextColor={'grey'} onChangeText={(e) => handleTextChange(index, e)} onSubmitEditing={() => handleSubmitEditing(index)} />)
                                    }
                                    </View>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        subpart(2).map((_, index) => <TextInput key={index + 12} ref={confirmInputRefs.current[index+12]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'black' }} placeholder={`${index+13}. Word`} placeholderTextColor={'grey'}  onChangeText={(e) => handleTextChange(index+12, e)} onSubmitEditing={() => handleSubmitEditing(index+12)} />)
                                    }
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginTop: 26 }}>
                                    <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8, margin: 4 }} placeholderTextColor={'grey'} placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => createWallet(phrase, confirmPhrase, password, navigation)}>
                                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Create Wallet</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => setStage("CREATE.START")}>
                                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Go Back</Text>
                                    </TouchableOpacity>
                                </View>
                            </SafeAreaView>
                            :
                            stage === "IMPORT"
                            ?
                            <View style={{ flexDirection: 'column', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: Colors.darker, marginTop: useSafeAreaInsets().top}}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4}}>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        subpart(1).map((_, index) => <TextInput key={index} ref={confirmInputRefs.current[index]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'purple' }} placeholderTextColor={'grey'} placeholder={`${index+1}. Word`} onChangeText={(e) => handleTextChange(index, e)} onSubmitEditing={() => handleSubmitEditing(index)} />)
                                    }
                                    </View>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        subpart(2).map((_, index) => <TextInput key={index + 12} ref={confirmInputRefs.current[index+12]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'purple' }} placeholderTextColor={'grey'} placeholder={`${index+13}. Word`}  onChangeText={(e) => handleTextChange(index+12, e)} onSubmitEditing={() => handleSubmitEditing(index+12)} />)
                                    }
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                    <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'grey'} placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => createWallet(phrase, phrase, password, navigation)}>
                                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Create Wallet</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            :<></>
                        }
                    </Animated.View>
                </SafeAreaView>
            </View>
        </GestureHandlerRootView>
    );
    return res;
}

function WalletImport({ navigation }: WalletImporterProps): React.JSX.Element
{
    const [phrase, setPhrase] = useState<string[]>(["","","","","","","","","","","","","","","","","","","","","","","",""]);
    const [password, setPassword] = useState("");
    const confirmInputRefs = useRef<Array<React.RefObject<TextInput>>>([]);

    const handleTextChange = (index: number, value: string) => 
    {
        setPhrase((prev) => 
        {
            const updated = [...prev];
            updated[index] = value.trim();
            return updated;
        });
        console.log(phrase);
    }

    const handleSubmitEditing = (index: number) => 
    {
        console.log(confirmInputRefs.current);
        const nextIndex = index + 1;
        if(!confirmInputRefs.current) return;

        if (nextIndex < confirmInputRefs.current.length) 
        {
            if(!confirmInputRefs.current[nextIndex]) return;
            confirmInputRefs.current[nextIndex].current!.focus();
        }
        else if(nextIndex == confirmInputRefs.current.length) createWallet(phrase, phrase, password, navigation);
    }

    const subpart = (num: number) =>
    {
        if(num === 1)
        {
            return phrase.slice(0, 12);
        }
        else
        {
            return phrase.slice(12, 24);
        }
    }
    
    const res =
    (
        <GestureHandlerRootView>
            <View style={{ flexDirection: 'column', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: Colors.darker, marginTop: useSafeAreaInsets().top}}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4}}>
                    <View style={{ height: '50%', width: '50%' }}>
                    {
                        subpart(1).map((_, index) => <TextInput key={index} ref={confirmInputRefs.current[index]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'purple' }} placeholderTextColor={'grey'} placeholder={`${index+1}. Word`} onChangeText={(e) => handleTextChange(index, e)} onSubmitEditing={() => handleSubmitEditing(index)} />)
                    }
                    </View>
                    <View style={{ height: '50%', width: '50%' }}>
                    {
                        subpart(2).map((_, index) => <TextInput key={index + 12} ref={confirmInputRefs.current[index+12]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'purple' }} placeholderTextColor={'grey'} placeholder={`${index+13}. Word`}  onChangeText={(e) => handleTextChange(index+12, e)} onSubmitEditing={() => handleSubmitEditing(index+12)} />)
                    }
                    </View>
                </View>
                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'grey'} placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => createWallet(phrase, phrase, password, navigation)}>
                        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Create Wallet</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GestureHandlerRootView>
    );
    return res;
}


function WalletCreate({ navigation }: WalletCreatorProps): React.JSX.Element
{
    const [phrase, setPhrase] = useState<string[]>([]);
    const [confirmPhrase, setConfirmPhrase] = useState<string[]>(["","","","","","","","","","","","","","","","","","","","","","","",""]);
    const [stage, setStage] = useState<'INIT' | 'CREATE'>('INIT');

    const [password, setPassword] = useState("");
    const confirmInputRefs = useRef<Array<React.RefObject<TextInput>>>([]);

    useEffect(() =>
    {
        const seed = createSeedPhrase();
        if(!seed) return console.error("Failed to create seed phrase");

        setPhrase(seed);
        setConfirmPhrase(seed.map((x) => ""));
    }, []);

    const handleTextChange = (index: number, value: string) => 
    {
        setConfirmPhrase((prev) => 
        {
            const updated = [...prev];
            updated[index] = value.trim();
            return updated;
        });
        console.log(confirmPhrase);
    }

    const handleSubmitEditing = (index: number) => 
    {
        console.log(confirmInputRefs.current);
        const nextIndex = index + 1;
        if(!confirmInputRefs.current) return;

        if (nextIndex < confirmInputRefs.current.length) 
        {
            if(!confirmInputRefs.current[nextIndex]) return;
            confirmInputRefs.current[nextIndex].current!.focus();
        }
        else if(nextIndex == confirmInputRefs.current.length) createWallet(phrase, confirmPhrase, password, navigation);
    }

    const subpart = (num: number) =>
    {
        if(num === 1)
        {
            return phrase.slice(0, 12);
        }
        else
        {
            return phrase.slice(12, 24);
        }
    }
    
    const res =
    (
        <GestureHandlerRootView>
            <View style={{ flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: Colors.darker, marginTop: useSafeAreaInsets().top}}>
                {
                    stage === "INIT"
                    ?
                    <>
                        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', marginVertical: 16 }}>Backup Seed Phrase</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4, backgroundColor: 'white'}}>
                            <View style={{ height: '50%', width: '50%' }}>
                            {
                                subpart(1).map((x, index) => <Text key={index} style={{ margin: 4, textAlign: 'center', color: 'purple', fontSize: 18 }}>{index+1}. {x}</Text>)
                            }
                            </View>
                            <View style={{ height: '50%', width: '50%' }}>
                            {
                                subpart(2).map((x, index) => <Text key={index + 12} style={{  margin: 4, textAlign: 'center', color: 'purple', fontSize: 18}}>{index + 13}. {x}</Text>)
                            }
                            </View>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => setStage("CREATE")}>
                                <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                    :
                    stage === "CREATE"
                    ?
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 4}}>
                            <View style={{ height: '50%', width: '50%' }}>
                            {
                                subpart(1).map((_, index) => <TextInput key={index} ref={confirmInputRefs.current[index]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'black' }} placeholder={`${index+1}. Word`} placeholderTextColor={'grey'} onChangeText={(e) => handleTextChange(index, e)} onSubmitEditing={() => handleSubmitEditing(index)} />)
                            }
                            </View>
                            <View style={{ height: '50%', width: '50%' }}>
                            {
                                subpart(2).map((_, index) => <TextInput key={index + 12} ref={confirmInputRefs.current[index+12]} style={{ backgroundColor: 'white', margin: 4, textAlign: 'center', color: 'black' }} placeholder={`${index+13}. Word`} placeholderTextColor={'grey'}  onChangeText={(e) => handleTextChange(index+12, e)} onSubmitEditing={() => handleSubmitEditing(index+12)} />)
                            }
                            </View>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginTop: 26 }}>
                            <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8, margin: 4 }} placeholderTextColor={'grey'} placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                            <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => createWallet(phrase, confirmPhrase, password, navigation)}>
                                <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Create Wallet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => setStage("INIT")}>
                                <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </> : <></>
                }

            </View>
        </GestureHandlerRootView>
    );
    return res;
}


export default Init;