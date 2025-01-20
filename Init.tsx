
import { Animated, Button, NativeModules, StatusBar, Text, TouchableOpacity, View } from 'react-native';
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
    const [stage, setStage] = useState<'LOADING' | 'INIT' | 'CREATE' | 'IMPORT'>('LOADING');
    const [password, setPassword] = useState("");

    const wordArray = words.split("\n");
    useEffect(() =>
    {
        //Check if wallet exists, if it does then move to App
        exists();
    }, []);

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

                console.log(foundWallets);

                navigation.replace("App", 
                {
                    initWallet,
                    initPassword: password,
                    foundWallets
                });
            }
        }
        catch(err: any)
        {
            console.log(err);
            setStage("INIT");
        }
    }

    const create = async () =>
    {
        try
        {
            const seed = [];
            const empty = [];

            console.log("STARTING SEED PHRAE");
            for(let i = 0; i < 24; i++)
            {
                const index = crypto.getRandomValues(new Uint32Array(1))[0];
                console.log(index);
                console.log(index % wordArray.length);
                seed.push(wordArray[index % wordArray.length]);
                empty.push("");
            }
        
            console.log("HELLO");
            console.log(seed.join(" "));

            setPhrase(seed);
            setConfirmPhrase(empty);
            setStage('IMPORT');
            //Now we must go to App page
        }
        catch(err: any)
        {
            console.log("OOPISE!!!");
            console.log(err);
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

    if(stage === "LOADING") return <View style={{ backgroundColor: Colors.darker, alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%'}}><Text>LOADING</Text></View>
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
                            <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', width: '50%', height: '100%',  marginTop: useSafeAreaInsets().top}}>
                                <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32}} onPress={() => create().then(() => setStage("CREATE")) }>
                                    <Text style={{color: 'white', fontWeight: '800'}}>Create New Wallet</Text>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32}} onPress={() => setStage("IMPORT") }>
                                    <Text style={{color: 'white', fontWeight: '800'}}>Import Existing Wallet</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            stage === "CREATE"
                            ?
                            <View style={{ flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'space-evenly',  marginTop: useSafeAreaInsets().top}}>
                                <Text>Back Up Seed Phrase</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white'}}>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        part(1).map((x, index) => <Text key={index} style={{ textAlign: 'center', color: 'white', fontSize: 18 }}>{index+1}. {x}</Text>)
                                    }
                                    </View>
                                    <View style={{ height: '50%', width: '50%' }}>
                                    {
                                        part(2).map((x, index) => <Text key={index + 12} style={{ textAlign: 'center', color: 'white', fontSize: 18 }}>{index+13}. {x}</Text>)
                                    }
                                    </View>
                                </View>
                                <Button title='Continue' onPress={() => setStage("IMPORT")} />
                            </View>
                            :
                            stage === "IMPORT"
                            ?
                            <View style={{ flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: 'green', marginTop: useSafeAreaInsets().top}}>
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
                                <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <TextInput placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                                    <Button title='Create wallet' onPress={() => 
                                    {
                                        console.log(phrase.length);
                                        console.log(confirmPhrase.length);
                                        console.log(phrase.join(" ") === confirmPhrase.join(" "));
                                        console.log(phrase);
                                        console.log(confirmPhrase);
                                        if(phrase.length > 0)
                                        {
                                            if(phrase.join(" ") !== confirmPhrase.join(" ")) throw new Error("Phrases don't match");
                                        }
                                        reuse();
                                    }} />
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

    const create = async () =>
    {
        try
        {
            if(phrase.includes("")) throw new Error("Invalid Seed Phrase Length");
                        
            const files = await RNFS.readDir("/data/data/com.thewallet/files/wallets");
            const walletCount = files.length;

            const foundWallets: string[] = files.filter((x) => !x.isDirectory()).filter((x) => x.ctime !== undefined).sort((a, b) => 
            {
                try { const poop = a.ctime!.getTime() - b.ctime!.getTime(); return poop } catch(err: any) { console.log(err); return 0; } 
            }).map((x) => x.name.split('.')[0]);
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
        else if(nextIndex == confirmInputRefs.current.length)
        {
            create();
        }
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
                    <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'grey'} placeholder='Password (If Valid)' onChangeText={(e) => setPassword(e)} />
                    <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={create}>
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

    const wordArray = words.split("\n");

    useEffect(() =>
    {
        try
        {
            const seed = [];
            const empty = [];

            console.log("STARTING SEED PHRAE");
            for(let i = 0; i < 24; i++)
            {
                const index = crypto.getRandomValues(new Uint32Array(1))[0];
                console.log(index);
                console.log(index % wordArray.length);
                seed.push(wordArray[index % wordArray.length]);
                empty.push("");
            }
        
            console.log("HELLO");
            console.log(seed.join(" "));

            setPhrase(seed);
            setConfirmPhrase(empty);
        }
        catch(err: any)
        {
            console.log("OOPISE!!!");
            console.log(err);
        }
    }, []);
    
    const create = async () =>
    {
        try
        {
            if(phrase.includes("")) throw new Error("Invalid Seed Phrase Length");
            if((phrase.join("") + password) !== (confirmPhrase.join("") + password)) throw new Error("Secret Phrase didn't match one given");

            const files = await RNFS.readDir("/data/data/com.thewallet/files/wallets");
            const walletCount = files.length;

            const foundWallets: string[] = files.filter((x) => !x.isDirectory()).filter((x) => x.ctime !== undefined).sort((a, b) => 
            {
                try { const poop = a.ctime!.getTime() - b.ctime!.getTime(); return poop } catch(err: any) { console.log(err); return 0; } 
            }).map((x) => x.name.split('.')[0]);
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
            create();
        }
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
                        <Text>Back Up Seed Phrase</Text>
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
                        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'grey'} placeholder='Password (Optional)' onChangeText={(e) => setPassword(e)} />
                            <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={create}>
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