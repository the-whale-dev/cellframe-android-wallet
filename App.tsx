/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Animated,
  BackHandler,
  Button,
  Dimensions,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import Clipboard from '@react-native-clipboard/clipboard';
import axios, { AxiosError } from 'axios';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowUpFromBracket, faGear, faGlobe, faLock, faTrash, faWallet } from '@fortawesome/free-solid-svg-icons';
import DropDownPicker from 'react-native-dropdown-picker';

import Init, { RootStackParamList } from './Init';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const { CellframeToolSign } = NativeModules;

interface CellNetwork
{
  name: string,
  id: string,
  ticker: string,
}

const CELL_Icon = require(`./assets/CELL.png`);
const QEVM_Icon = require(`./assets/QEVM.png`);
const CPUNK_Icon = require(`./assets/CPUNK.png`);
const KEL_Icon = require(`./assets/KEL.png`);
const BNB_Icon = require(`./assets/BNB.png`);
const USDT_Icon = require(`./assets/USDT.png`);
const USDC_Icon = require(`./assets/USDC.png`);
const NYS_Icon = require(`./assets/NYS.jpg`);

type Props = NativeStackScreenProps<RootStackParamList, 'App'>;

import TcpSocket from 'react-native-tcp-socket';
import WebView from 'react-native-webview';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { faCircleHalfStroke } from '@fortawesome/free-solid-svg-icons/faCircleHalfStroke';

function App({ navigation, route }: Props): React.JSX.Element 
{
  const isDarkMode = useColorScheme() === 'dark';
  function parseQueryString(queryString: string) 
  {
    console.log(`Got the query: ${queryString}`);
    const params: Record<string, string> = {};
    if (!queryString) return params; // Handle empty query strings
  
    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  
    return params;
  }
  
  // A local TCP server to gain access to the stake.cellframe.net and vote.cellframe.net sites
  const startServer = () =>
  {
    const server = TcpSocket.createServer((socket) =>
    {
      console.log(`Client connected:`, socket.address());
      socket.setKeepAlive(true);

      socket.on('data', async (data) =>
      {
        console.log(`Received:`, data.toString());

        const requestLine = data.toString().split('\r\n')[0];
        const path = requestLine.split(' ')[1];

        const queryString = path.split('?')[1];
        const params = parseQueryString(queryString);
        console.log(params);

        // Extract the method
        const method = params.method || null;
        // Remove the method from the parameters object
        delete params.method;

        console.log(`METHOD IS: ${method}`);
        switch(method)
        {
          case 'Connect':
            {
              console.log("WE WILL CONNECT");
              const _id = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(byte => byte.toString(16).padStart(2, '0')).join('');
              console.log(`ID: 0x${_id}`);
              const json = JSON.stringify(
              {
                data:
                {
                  id: `0x${_id}`
                },
                errorMsg: "",
                status: "ok"
              });
              const res = `HTTP/1.1 200 OK\r\n` +
              `Content-Type: application/json; charset="UTF-8"\r\n` +
              `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
              `Access-Control-Allow-Origin: *\r\n` +
              `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
              `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
              `Connection: keep-alive\r\n` +
              `\r\n`+
              `${json}`;
              socket.write(res);
            }
            return;
          case 'GetFee':
            {
              console.log("WE WILL GET FEE");
              const json = JSON.stringify(
                {
                  "data": {
                    "Backbone": {
                        "network": "Backbone",
                        "network_fee": {
                            "fee_addr": "null",
                            "fee_coins": "0.0",
                            "fee_datoshi": "0",
                            "fee_ticker": "CELL"
                        },
                        "validator_fee": {
                            "average_fee_coins": "0.025854872375690609",
                            "average_fee_datoshi": "25854872375690609",
                            "fee_ticker": "CELL",
                            "max_fee_coins": "0.1",
                            "max_fee_datoshi": "100000000000000000",
                            "median_fee_coins": "0.05",
                            "median_fee_datoshi": "50000000000000000",
                            "min_fee_coins": "0.000000000000000001",
                            "min_fee_datoshi": "1"
                        }
                    }
                },
                "errorMsg": "",
                "status": "ok"
                });
                const res = `HTTP/1.1 200 OK\r\n` +
                `Content-Type: application/json; charset="UTF-8"\r\n` +
                `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
                `Access-Control-Allow-Origin: *\r\n` +
                `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
                `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
                `Connection: keep-alive\r\n` +
                `\r\n`+
                `${json}`;
                socket.write(res);
            }
            return;
          case 'GetWallets':
            {
              console.log("WE WILL GET WALLETS");
              const json = JSON.stringify(
              {
                data: wallets.map((x) => ({ name: x, status: "" })),
                errorMsg: "",
                status: "ok"
              });

              const res = `HTTP/1.1 200 OK\r\n` +
              `Content-Type: application/json; charset="UTF-8"\r\n` +
              `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
              `Access-Control-Allow-Origin: *\r\n` +
              `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
              `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
              `Connection: keep-alive\r\n` +
              `\r\n`+
              `${json}`;
              socket.write(res);
            }
            return;
          case 'GetDataWallet':
            {
              console.log("WE WILL GET WALLET DATA");
              const json = JSON.stringify(
              {
                data: params["walletName"] === walletRef.current.name ? [
                {
                  address: walletRef.current.address,
                  network: "Backbone",
                  tokens: balancesRef.current.map((x) => (
                  {
                    availableCoins: "",
                    availableDatoshi: "",
                    balance: (x.amount/(10**18)).toString(),
                    datoshi: x.amount.toString(),
                    tokenName: x.ticker,
                  })),
                }] : [],
                errorMsg: "",
                status: "ok"
              })
              console.log(`DATA WALLET`);
              console.log(json);
              console.log(`^^^ DATA WALLET ^^^`);
              const res = `HTTP/1.1 200 OK\r\n` +
              `Content-Type: application/json; charset="UTF-8"\r\n` +
              `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
              `Access-Control-Allow-Origin: *\r\n` +
              `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
              `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
              `Connection: keep-alive\r\n` +
              `\r\n`+
              `${json}`;
              socket.write(res);
            }
            return;
          case "GetMempoolList":
            {
              console.log("WE WILL GET MEMPOOL LIST DATA");
              const json = JSON.stringify(
                {
                  "data": [
                    {
                        "address": "Rj7J7MiX2bWy8sNyYXwqWSscuw2Wr8rWR2Vcm34osmMHDC8Ykrse4ba5aoDuW7zoik4qnFjGkNMgLRzTcLz6zbkpBwWivkEsmLK3YgD3",
                        "atom": "",
                        "date": "2024-12-23",
                        "date_to_secs": "1734928324",
                        "direction": "",
                        "fee": "0.0",
                        "fee_net": "0.0",
                        "fee_token": "CELL",
                        "m_value": "0.0",
                        "network": "Backbone",
                        "status": "Pending",
                        "token": "CELL",
                        "tx_hash": "0x0ABC4BDDE5DE24E5DD42FB710146EF8CCF51DAC2C8C89C17AF4A9F5CFB8B2046",
                        "tx_status": "PROCESSING",
                        "value": "0.00001",
                        "wallet_name": ""
                    }
                ],
                "errorMsg": "",
                "status": "ok"
                })
  
                const res = `HTTP/1.1 200 OK\r\n` +
                `Content-Type: application/json; charset="UTF-8"\r\n` +
                `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
                `Access-Control-Allow-Origin: *\r\n` +
                `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
                `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
                `Connection: keep-alive\r\n` +
                `\r\n`+
                `${json}`;
                socket.write(res);
            }
            return;
          case 'StakeLockHold':
            {
              const stake = await stakeCoins(parseInt(params["value"])/(10**18), params["tokenName"], params["timeStaking"], params["reinvest"], walletRef.current);
              //idk what information we need to store and what information we need to send to staking site but for now I'm taking a break
              const json = JSON.stringify(
              {

              })
              const res = `HTTP/1.1 200 OK\r\n` +
              `Content-Type: application/json; charset="UTF-8"\r\n` +
              `Content-Length: ${new TextEncoder().encode(json).length}\r\n`+
              `Access-Control-Allow-Origin: *\r\n` +
              `Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n` +
              `Access-Control-Allow-Headers: Content-Type, X-Requested-With\r\n` +
              `Connection: keep-alive\r\n` +
              `\r\n`+
              `${json}`;
              socket.write(res);
            }
            return;
        }
      });

      socket.on('error', (err) =>
      {
        console.error('Socket Error:', err);
      });

      socket.on('close', () =>
      {
        console.log('Connection closed');
      });
    });

    server.listen({ port: 8045, host: '127.0.0.1' }, () =>
    {
      console.log('Server is running on http://127.0.0.1:8045');
    });

    server.on('error', (err) =>
    {
      console.error('Server error:', err);
    });

    return server;
  }

  useEffect(() =>
  {
    const server = startServer();
    return () =>
    {
      server.close();
    }
  }, []);

  const height = Dimensions.get('screen').height;
  const safeHeight = useSafeAreaFrame().height;

  const [activeNetwork, setActiveNetwork] = useState("Backbone");
  
  const [wallet, setWallet] = useState<{ name: string, address: string}>({ name: route.params.initWallet, address: "" });
  const [wallets, setWallets] = useState<string[]>(route.params.foundWallets);
  const walletRef = useRef<{ name: string, address: string }>({ name: route.params.initWallet, address: "" }); 

  const [password, setPassword] = useState(route.params.initPassword);

  const [balances, setBalances] = useState<{ ticker: string, amount: number }[]>([]);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const balancesRef = useRef<any[]>([]);

  // Allows access to debug functions
  // e.g. you can get the transaction JSON content and then execute it on a local cellframe node if the RPC fails
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() =>
  {
    balancesRef.current = balances;
  }, [balances]);

  useEffect(() =>
  {
    walletRef.current = wallet;
  }, [wallet]);

  const [send, setSend] = useState<{address: string, amount: string}>({ address: "", amount: "" });
  const [stake, setStake] = useState<{ amount: number, time: { year: string, month: string, day: string, }}>({amount: 0, time: { year: "25", month: "12", day: "12" }});
  const [networks, setNetworks] = useState<CellNetwork[]>([{ name: "Backbone", id: "0x0404202200000000", ticker: "CELL" }, { name: "KelVPN", id: "0x1807202300000000", ticker: "KEL" }]);

  const backgroundStyle = StyleSheet.create(
  {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter
  });

  useEffect(() =>
  {
    details().then(() => updateBalances());
    setRefreshRate(5);
  }, []);

  useEffect(() =>
  {
    details();
  }, [activeNetwork, wallet.name]);

  useEffect(() =>
  {
    updateBalances();
  }, [wallet.address]);

  const [fees, setFees] = useState<{network: string, validator: string}>({ network: '0', validator: '0.01' }); //0.0025 when enabled for network
  const [refreshRate, setRefreshRate] = useState(5);
/*
  TEMPORARILY REMOVING BALANCE REFRESH UNTIL ISSUES RESOLVED
  useEffect(() =>
  {
    let calling = false;
    const update = setInterval(async () =>
    {
      if(calling) return;
      calling = true;

      try
      {
        const change = await updateBalances();
        if(!change)
        {
          if(refreshRate < 30) setRefreshRate((prev) => Math.min(prev * 1.5, 30));
        }
        else if(refreshRate > 5) setRefreshRate(5);
        console.log(`Updating balances. Next update in ${refreshRate}s`);
      }
      catch(err: any)
      {
        console.error(err);
      }
      finally
      {
        calling = false;
      }
    }, refreshRate*1000);

    return () =>
    {
      clearInterval(update);
    }
  }, [refreshRate, activeNetwork, wallet.address]);
*/
  const updateBalances = useCallback(async () =>
  {
    try
    {
      if(wallet.address === "") throw new Error("Can't get balance of nothing");

      console.log(`${wallet.address} on ${activeNetwork}`);
      setBalanceLoaded(false);

      const res = await axios.post(`http://rpc.cellframe.net/connect`, 
      {
        method: "wallet",
        params: [`wallet;info;-addr;${wallet.address};-net;Backbone`],
        id: "1"
      });

      if(res.data.result[0][0].tokens == undefined) throw new Error("We don't have any coins");
      
      console.log(`WE ARE INTERESTED FOR THE ${activeNetwork}`);
      console.log(res.data.result);
      console.log(res.data.result[0][0].tokens);
      let supplies = res.data.result[0][0].tokens.filter((x: any) => parseInt(x.datoshi) > 0);
      const _supplies = supplies.map((x: { token: { ticker: string }, datoshi: number }) => ({ticker: x.token.ticker, amount: x.datoshi/(10**18)}));
      
      if(_supplies === balances) return false;

      setBalances(_supplies); 
      return true;
    }
    catch(err: any)
    {
      console.log("Error getting latest holdings")
      console.log(err);
      console.log(err.message);
      setBalances([]);
      return false;
    }
    finally
    {
      setBalanceLoaded(true);
    }
  }, [wallet.address, activeNetwork, balances]);

  const mainToken = (network: string) =>
  {
    switch(network)
    {
      case "Backbone": return "CELL";
      case "KelVPN": return "KEL";
      case "qEVM": return "QEVM";
      default: "CELL";
    }

    return "CELL";
  }

  const attemptUnlockWallet = useCallback(async (_wallet: string, _password: string) =>
  {
    try
    {
      const network = networks.find((x) => x.name === activeNetwork); //Backbone
      if(!network) throw new Error("That network does not exist");

      const res = await CellframeToolSign.wrapWalletDetails(`/data/data/com.thewallet/files/wallets/${_wallet}.dwallet`, network.id, _password);
      if(res.startsWith("Error opening wallet")) 
      {
        console.log("It is possible the password is to blame. Which in this case it is");
        return false;
      }

      return true;
    }
    catch(err: any)
    {
      console.log(err);
      return false;
    }
  }, [activeNetwork]); 

  const details = useCallback(async () =>
  {
    try
    {
      const network = networks.find((x) => x.name === activeNetwork); //Backbone
      if(!network) throw new Error("That network does not exist");

      const res = await CellframeToolSign.wrapWalletDetails(`/data/data/com.thewallet/files/wallets/${wallet.name}.dwallet`, network.id, password);
      if(res.startsWith("Error opening wallet")) 
      {
        console.log("It is possible the password is to blame. Which in this case it is");
        return false;
      }

      console.log(`Address is ${res} for the ${network.name} network`);
      setWallet((prev) => ({ name: prev.name, address: res }));

      return true;
    }
    catch(err: any)
    {
      console.log(err);
      return false;
    }
  }, [wallet.name, password, activeNetwork]);

  const exchange = async () =>
  {
    try
    {
      const amount = 1*(10**18);
      const token = "CPUNK";

      const maybe = await axios.post(`http://rpc.cellframe.net/connect`,
      {
        method: "wallet",
        params: [`wallet;outputs;-addr;${wallet.address};-net;Backbone;-token;CELL`],
        id: "1"
      });

      let utxos = maybe.data.result[0][0].outs.map((x: any) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx, value: parseInt(x.value_datosi) })); //datosi is misspelt but they might fix later so maybe change to datoshi if issues arise
      console.log(`THE UTXOS BELOW`);
      console.log(utxos);
      let usingUTXOs = [];

      for(let i = 0; i < utxos.length; i++)
      {
        if(usingUTXOs.reduce((a, b) => a + b.in, 0) >= amount) break;
        usingUTXOs.push(utxos[i]);
      }
      console.log("Our using UTXOs");
      console.log(usingUTXOs);
      console.log(`^^^^^^^^^^^^^^^^`);

      const utxoTotal = usingUTXOs.reduce((a, b) => a + b.value, 0) - (parseFloat(fees.network)*(10**18)) - (parseFloat(fees.validator)*(10**18));
      const leftover = utxoTotal > amount ? utxoTotal - amount : amount - utxoTotal;

      console.log(`Leftover: ${leftover}`);

      const json = JSON.stringify(
      {
        items:
        [
          ...usingUTXOs.map((x) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx })),
          leftover > 0
          ?
          {
            type: "out",
            addr: wallet.address,
            value: leftover.toString()
          } : undefined,
          parseFloat(fees.network) > 0
          ?
          {
            type: "out",
            addr: "Rj7J7MiX2bWy8sNyX38bB86KTFUnSn7sdKDsTFa2RJyQTDWFaebrj6BucT7Wa5CSq77zwRAwevbiKy1sv1RBGTonM83D3xPDwoyGasZ7",
            value: (parseFloat(fees.network)*(10**18)).toString()
          } : undefined,
          {
            type: "out_cond",
            ts_expires: "never",
            value: (parseFloat(fees.validator)*(10**18)).toString(),
            service_id: "0x0000000000000000",
            subtype: "fee"
          },
          {
            type: "out_cond",
            subtype: "srv_xchange",
            net: activeNetwork,
            token,
            value: amount.toString()
          }
        ]
      });

      const signedJSON = await CellframeToolSign.wrapWalletSign(`/data/data/com.thewallet/files/wallets/${wallet.name}.dwallet`, password, json);
      console.log(signedJSON);

      const remoteSignResult = await axios.post(`http://rpc.cellframe.net`, 
      {
        method: "tx_create_json",
        params: [`tx_create_json;-net;Backbone-chain;main;-json_str;${signedJSON}`],
        id: "1"
      });

      console.log(remoteSignResult.data.result[0][0]);
    }
    catch(err: any)
    {
      console.error(err);
    }
  }

  const stakeCoins = useCallback(async (value: number, ticker: string, time: string, reinvest: string, wallet: { name: string, address: string }) =>
  {
    try
    {
      console.log(wallet);
      console.log(value);
      console.log(ticker);
      console.log(time);
      console.log(reinvest);
      const amount = (value*(10**18));
      console.log(`We need ${amount}`);
      let usingUTXOs: {hash: string, index: Number, in: number}[] = [];

      const utxoAmount = usingUTXOs.reduce((a, b) => a + b.in, 0);
      console.log(`UTXO AMOUNT: ${utxoAmount}`);
      console.log(usingUTXOs);

      if(usingUTXOs.reduce((a, b) => a + b.in, 0) < amount) throw new Error("You don't have enough tokens to execute this command");
      console.log(amount);

      let ins = usingUTXOs.map((x) => ({ type: "in", prev_hash: x.hash, out_prev_idx: x.index })); //Creates the necessary ins for the transaction to be completed
      const leftover = (usingUTXOs.reduce((a, b) => a + b.in, 0) - amount - (parseFloat(fees.network)*(10**18)) - (parseFloat(fees.validator)*(10**18))); //Creates the leftover
      console.log(`What is leftover: ${leftover}`);

      const json = JSON.stringify(            
      {
        items:
        [
          ...ins,
          {
            type: "in_ems"
          },
          parseFloat(fees.network) > 0
          ?
          {
            type: "out",
            addr: "Rj7J7MiX2bWy8sNyX38bB86KTFUnSn7sdKDsTFa2RJyQTDWFaebrj6BucT7Wa5CSq77zwRAwevbiKy1sv1RBGTonM83D3xPDwoyGasZ7",
            value: (parseFloat(fees.network)*(10**18)).toString()
          } : undefined,
          leftover > 0 ?
          {
            type: "out",
            addr: wallet.address,
            value: leftover.toString()
          } : undefined,
          {
            type: "out_ext",
            addr: wallet.address,
            value: (amount/1000).toString(),
            token: `m${ticker}`
          },
          {
            type: "out_cond",
            ts_expires: "never",
            value: (parseFloat(fees.validator)*(10**18)).toString(),
            service_id: "0x0000000000000000",
            subtype: "fee"
          },
          {
            type: "out_cond",
            subtype: "srv_stake_lock",
            time_unlock: time,
            ts_expires: "never",
            value: amount.toString(),
            service_id: "",
            reinvest: "0",
            token: ticker === "CELL" ? undefined : ticker
          }
        ].filter((x) => x !== undefined)
      });

      const signedJSON = await CellframeToolSign.wrapWalletSign(`/data/data/com.thewallet/files/wallets/${wallet.name}.dwallet`, password, json);
      console.log(signedJSON);

      const remoteSignatureRes = await axios.post(`http://rpc.cellframe.net/connect`, 
      {
        method: "tx_create_json",
        params: [`tx_create_json;-net;Backbone;-chain;main;-json_str;${signedJSON}`],
        id: "1"
      });

      console.log(remoteSignatureRes.data);
    }
    catch(err: any)
    {
      console.log(err);
    }
  }, [wallet, balances]);

  const [txnJSON, setTxnJSON] = useState("");
  const sendCoins = async () =>
  {
    try
    {
      // Sending native coin definetly works but there is an issue with the json_str command or something
      // Or maybe an issue on the RPC idk really. Weird how the first transaction worked but none after have
      // If you need to 
      // Latest wallet issue is that UTXOs is returning an empty array even though ti should return: hash: 0xAC7D5CAA123BEF3829B1B31E252CD6B6E704A1E0C11C2F4F60E3A0FA84EBFE22, index: 0
      console.log("HELLO???");
      const amount = (parseFloat(send.amount)*(10**18));
      const network = networks.find((x) => x.name === activeNetwork);
      
      if(amount <= 0) throw new Error("No need to send nothing or less than nothing");
      if(!network) throw new Error("Could not find network information");

      setSendStatus("SENDING");
      console.log(`We will attempt to send ${amount} coins`);

      let json: any = "";
      if(dpValue!.toUpperCase() === network.ticker.toUpperCase())
      {
        //In the case that you are sending the native ticker
        console.log("We are sending native tokens i.e. $CELL");
        console.log(network.ticker.toUpperCase());
        console.log(activeNetwork);
        console.log(wallet.address);
        const params = `wallet;outputs;-addr;${wallet.address};-net;${activeNetwork};-token;${network.ticker.toUpperCase()}`;
        console.log(params);
        const UTXOs = await axios.post(`http://rpc.cellframe.net/connect?360`,
        {
          method: "wallet",
          params: [params],
          id: "1"
        });
        console.log(UTXOs.data);
        console.log(UTXOs.data.result);
        let t_UTXOs = UTXOs.data.result[0][0].outs.map((x: any) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx, value: parseInt(x.value_datosi) })); //datosi is misspelt but they might fix later so maybe change to datoshi if issues arise
        console.log(t_UTXOs);
        console.log(`^^^^^^^^ These are the UTXOs ^^^^^^^^^^`);
        let usingUTXOs: any[] = [];

        for(let i = 0; i < t_UTXOs.length; i++)
        {
          if(usingUTXOs.reduce((a, b) => a + b.value, 0) >= (amount + (parseFloat(fees.network)*(10**18)) + (parseFloat(fees.validator)*(10**18)))) break;
          usingUTXOs.push(t_UTXOs[i]);
        }

        console.log (`----------- Using UTXOs -----------`);
        console.log(usingUTXOs);
        console.log(`Using UTXOS ^^^^^^^^^^^`);

        let total = usingUTXOs.reduce((a, b) => a + b.value, 0);
        console.log(`Total: ${total}`);
        let leftover = total - amount - (parseFloat(fees.network)*(10**18)) - (parseFloat(fees.validator)*(10**18));
        console.log(`Leftover: ${leftover}`);

        if(leftover < 0) throw new Error("You don't have enough funds to create this transaction");

        json = JSON.stringify(
        {
          items:
          [
            ...usingUTXOs.map((x) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx })),
            {
              type: "out",
              addr: send.address,
              value: amount.toString(),
            },
            parseFloat(fees.network) > 0
            ?
            {
              type: "out",
              addr: "Rj7J7MiX2bWy8sNyX38bB86KTFUnSn7sdKDsTFa2RJyQTDWFaebrj6BucT7Wa5CSq77zwRAwevbiKy1sv1RBGTonM83D3xPDwoyGasZ7",
              value: (parseFloat(fees.network)*(10**18)).toString(),
              token: network.ticker.toLowerCase()
            } : undefined,
            leftover > 0 ?
            {
              type: "out",
              addr: wallet.address,
              value: leftover.toString(),
            } : undefined,
            {
              type: "out_cond",
              ts_expires: "never",
              value: (parseFloat(fees.validator)*(10**18)).toString(),
              service_id: "0x0000000000000000",
              subtype: "fee"
            }
          ].filter((x) => x !== undefined)
        });
      }
      else
      {
        console.log("We are sending custom tokens i.e. $QEVM");
        const nativeUTXOs = await axios.post(`http://rpc.cellframe.net/connect`,
        {
          method: "wallet",
          params: [`wallet;outputs;-addr;${wallet.address};-net;${activeNetwork};-token;${network.ticker.toUpperCase()}`],
          id: "1"
        });
        const tokenUTXOs = await axios.post(`http://rpc.cellframe.net/connect`,
        {
          method: "wallet",
          params: [`wallet;outputs;-addr;${wallet.address};-net;${activeNetwork};-token;${dpValue!.toUpperCase()}`],
          id: "1"
        });

        let n_UTXOs = nativeUTXOs.data.result[0][0].outs.map((x: any) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx, value: parseInt(x.value_datosi) })); //datosi is misspelt but they might fix later so maybe change to datoshi if issues arise
        let t_UTXOs = tokenUTXOs.data.result[0][0].outs.map((x: any) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx, value: parseInt(x.value_datosi) }));

        let usingNativeUTXOs: any[] = [];
        let usingTokenUTXOs: any[] = [];

        for(let i = 0; i < n_UTXOs.length; i++)
        {
          if(usingNativeUTXOs.reduce((a, b) => a + b.value, 0) >= ((parseFloat(fees.network)*(10**18)) + (parseFloat(fees.validator)*(10**18)))) break;
          usingNativeUTXOs.push(n_UTXOs[i]);
        }

        for(let i = 0; i < t_UTXOs.length; i++)
        {
          if(usingTokenUTXOs.reduce((a, b) => a + b.value, 0) >= amount) break;
          usingTokenUTXOs.push(t_UTXOs[i]);
        }

        let n_leftover = usingNativeUTXOs.reduce((a, b) => a + b.value, 0) - (parseFloat(fees.network)*(10**18)) - (parseFloat(fees.validator)*(10**18));
        let t_leftover = usingTokenUTXOs.reduce((a, b) => a + b.value, 0) - amount;

        const json = JSON.stringify(
        {
          items:
          [
            ...usingNativeUTXOs.map((x) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx })),
            ...usingTokenUTXOs.map((x) => ({ type: "in", prev_hash: x.prev_hash, out_prev_idx: x.out_prev_idx })),
            {
              type: "out_ext",
              addr: send.address,
              value: amount.toString(),
              token: (dpValue! as string).toUpperCase()
            },
            parseFloat(fees.network) > 0
            ?
            {
              type: "out",
              addr: "Rj7J7MiX2bWy8sNyX38bB86KTFUnSn7sdKDsTFa2RJyQTDWFaebrj6BucT7Wa5CSq77zwRAwevbiKy1sv1RBGTonM83D3xPDwoyGasZ7",
              value: (parseFloat(fees.network)*(10**18)).toString(),
            } : undefined,
            n_leftover > 0 ?
            {
              type: "out",
              addr: wallet.address,
              value: n_leftover.toString(),
            } : undefined,
            t_leftover > 0 ?
            {
              type: "out_ext",
              addr: wallet.address,
              value: t_leftover.toString(),
              token: (dpValue! as string).toUpperCase()
            } : undefined,
            {
              type: "out_cond",
              ts_expires: "never",
              value: (parseFloat(fees.validator)*(10**18)).toString(),
              service_id: "0x0000000000000000",
              subtype: "fee"
            }
          ].filter((x) => x !== undefined)
        });
      }

      console.log(json);

      const signedJSON = await CellframeToolSign.wrapWalletSign(`/data/data/com.thewallet/files/wallets/${wallet.name}.dwallet`, password, json);
      console.log(signedJSON);
      console.log(JSON.stringify(signedJSON));

      setTxnJSON(`${signedJSON}`);
      const remoteSignatureRes = await axios.post(`http://rpc.cellframe.net/connect`, 
      {
        method: "tx_create_json",
        params: [`tx_create_json;-net;Backbone;-chain;main;-json_str;${signedJSON}`],
        id: "1"
      });

      console.log(remoteSignatureRes.data);
      if(remoteSignatureRes.data.result[0] === undefined) throw new Error("Failed to sign message");
      setSendStatus(remoteSignatureRes.data.result[0].hash);
    }
    catch(err: any)
    {
      console.log(err);
      setSendStatus("Error");
    }
  }

  const copy = () =>
  {
    Clipboard.setString(wallet.address);
  }

  const amountInputRef = useRef<TextInput>(null);
  const smallWallet = useCallback(() =>
  {
    const start = wallet.address.slice(0, 6);
    const end = wallet.address.slice(wallet.address.length-6, wallet.address.length);
    return `${start}...${end}`;
  }, [wallet]);

  const getIcon = (ticker: string) =>
  {
    switch(ticker)
    {
      case "mCELL":
      case "CELL": return CELL_Icon;
      case "QEVM": return QEVM_Icon;
      case "CPUNK": return CPUNK_Icon;
      case "KEL": return KEL_Icon;
      case "BNB": return BNB_Icon;
      case "USDT": return USDT_Icon;
      case "USDC": return USDC_Icon;
      case "NYS": return NYS_Icon;
      default: return CELL_Icon;
    } 
  }

  /* FOR SEND DROPDOWN MENU */
  const [dpOpen, setDPOpen] = useState(false);
  const [dpValue, setDPValue] = useState<string | null>(null);
  const [dpItems, setDPItems] = useState(
  [
    {
      label: 'CELL',
      value: 'cell',
      icon: () => (
        <Image source={getIcon("CELL")}
        style={{ width: 30, height: 30, marginRight: 10, borderRadius: 320 }} />
      ),
    },
    {
      label: 'KEL',
      value: 'kel',
      icon: () => (
        <Image source={getIcon("KEL")}
        style={{ width: 30, height: 30, marginRight: 10, borderRadius: 320 }} />
      ),
    }
  ]);
  /* ---------------------- */

  useEffect(() =>
  {
    console.log(balances);
    setDPItems(() => balances.map((x) => 
    (   
      {
        label: x.ticker, 
        value: x.ticker.toLowerCase(), 
        icon: () => 
        (
          <Image source={getIcon(x.ticker)} style={{ width: 30, height: 30, marginRight: 10, borderRadius: 320 }} />
        )
      }
    )));
  }, [balances]);

  useEffect(() =>
  {
    console.log(dpItems)
  }, [dpItems]);

  const sendHeightRef = useRef(new Animated.Value(0)).current;
  const [isSendOpen, setIsSendOpen] = useState(false);

  const openSend = () =>
  {
    if(isSendOpen)
    {
      Animated.timing(sendHeightRef,
        {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
        }).start();
    }
    else
    {
      Animated.timing(sendHeightRef,
        {
          toValue: (height * 0.5) - 48,
          duration: 300,
          useNativeDriver: false
        }).start();
    }

    setIsSendOpen((prev) => !prev);
  }

  const [page, setPage] = useState<"SETTINGS" | "BALANCE" | "WEB">("BALANCE");
  const [settingsTab, setSettingsTab] = useState<"INIT" | "NETWORKS" | "NETWORKS.MODIFY" | "WALLET" | "WALLET.MODIFY" | "TRANSACTION">("INIT");

  const [networkModifyValues, setNetworkModifyValues] = useState<{ name: string, id: string, ticker: string, networkIndex?: number | undefined }>(
  {
    name: "",
    id: "",
    ticker: "",
  });

  useEffect(() =>
  {
    if(wallets.length === 0) navigation.navigate("Init");
  }, [wallets]);

  useEffect(() => 
  {
    const settingsBackHandler = () => 
    {
      if (page === 'SETTINGS' && settingsTab !== 'INIT') {
        if(settingsTab.includes('.'))
        {
          const tabsSplit = settingsTab.split('.');
          tabsSplit.pop();

          if(tabsSplit.length === 1) setSettingsTab(tabsSplit[0] as any);
          else setSettingsTab(tabsSplit.join('.') as any);

          return true;
        }
        setSettingsTab('INIT'); // Custom logic when in the settings page
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    };

    if (page === 'SETTINGS' && settingsTab !== 'INIT') 
    {
      // Add the BackHandler event listener
      const backHandlerSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        settingsBackHandler
      );

      // Cleanup listener if conditions no longer match
      return () => {
        backHandlerSubscription.remove();
      };
    }

    // If conditions aren't met, ensure no lingering listeners
    return undefined;
  }, [page, settingsTab]);

  const [networkChooserOpen, setNetworkChooserOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<{ orgName: string, newName: string }>({ orgName: "", newName: ""});
  const [unlockWallet, setUnlockWallet] = useState<{ unlocking: string, password: string, error: string }>({ unlocking: "", password: "", error: "" });
  
  const [url, setURL] = useState<{ actual: string, typing: string }>({ actual: "https://stake.cellframe.net", typing: "" });

  const [sendStatus, setSendStatus] = useState("");

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        {
          page === "SETTINGS"
          ?
            settingsTab === "INIT"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '100%' }}>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, width: '75%' }} onPress={() => 
              {
                setSettingsTab("NETWORKS");
              }}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center'}}>Network Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, width: '75%'  }} onPress={() => 
              {
                setSettingsTab("WALLET");
              }}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center'}}>Wallet Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, width: '75%'  }} onPress={() => 
              {
                setSettingsTab("TRANSACTION");
              }}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center'}}>Transaction Settings</Text>
              </TouchableOpacity>
            </View>
            :
            settingsTab === "NETWORKS"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '100%' }}>
            {
              networks.map((x, index) => 
              <TouchableOpacity key={x.id} style={{ width: '75%', backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 }} onPress={() =>
              {
                console.log(`Our index is ${index}`);
                setNetworkModifyValues({ ...x, networkIndex: index });
                setSettingsTab("NETWORKS.MODIFY");
              }}>
                <Text style={{ fontWeight: '800', color: 'white', textAlign: 'center', fontSize: 18 }}>{x.name}</Text>
              </TouchableOpacity>)
            }
              <TouchableOpacity style={{ width: '75%', backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 }} onPress={() => setSettingsTab("NETWORKS.MODIFY")}>
                <Text style={{ fontWeight: '800', color: 'white', textAlign: 'center', fontSize: 18 }}>++ Add Network ++</Text>
              </TouchableOpacity>
            </View>
            :
            settingsTab === "NETWORKS.MODIFY"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: '100%' }}>
              <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'pink'} placeholder='Network Name' value={networkModifyValues.name} onChangeText={(e) => setNetworkModifyValues((prev) => ({...prev, name: e}))} />
              <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'pink'} placeholder='Network Ticker' value={networkModifyValues.ticker} onChangeText={(e) => setNetworkModifyValues((prev) => ({...prev, ticker: e}))} />
              <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'pink'} placeholder='Network ID' value={networkModifyValues.id} onChangeText={(e) => setNetworkModifyValues((prev) => ({...prev, id: e}))} />
              <TouchableOpacity style={{ backgroundColor: 'red', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8}} onPress={() =>
              {
                setNetworks((prev) => prev.filter((x, index) => index !== networkModifyValues.networkIndex));
                setSettingsTab("NETWORKS");
              }}>
                  <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800'}}>Remove Network</Text>
                </TouchableOpacity>
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%'}}>
                <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '37.5%', paddingVertical: 9, borderRadius: 8}} onPress={() =>
                {
                  setNetworks((prev) => 
                  {
                    if(networkModifyValues.networkIndex !== undefined)
                    {
                      let edited = prev;
                      edited[networkModifyValues.networkIndex] = { ...networkModifyValues };
                      return edited;
                    }
                    else return [...prev, { ...networkModifyValues }];
                  });
                  setNetworkModifyValues({ id: "", name: "", ticker: "" });
                  setSettingsTab("NETWORKS");
                }}>
                  <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800'}}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: 'red', paddingHorizontal: 18, width: '37.5%', paddingVertical: 9, borderRadius: 8}} onPress={() => setSettingsTab("NETWORKS")}>
                  <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800'}}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
            :
            settingsTab === "TRANSACTION"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Text style={{ color: 'white', fontSize: 22, margin: 4, fontWeight: '800' }}>Network Fee</Text>
              <TextInput keyboardType='numeric' style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'pink'} placeholder='Network Fee' value={fees.network} enabled={false} onChangeText={(e) => setFees((prev) => ({...prev, network: e }))} />
              <Text style={{ color: 'white', fontSize: 22, margin: 4, fontWeight: '800' }}>Validator Fee</Text>
              <TextInput keyboardType='numeric' style={{ backgroundColor: 'white', color: 'purple', width: '75%', textAlign: 'center', fontWeight: '600', borderRadius: 8 }} placeholderTextColor={'pink'} placeholder='Validator Fee' value={fees.validator} onChangeText={(e) => setFees((prev) => ({...prev, validator: e }))} />
              <Text style={{ color: 'white', fontSize: 22, margin: 4, fontWeight: '800' }}>Enable Debug Mode</Text>
              <TouchableOpacity style={{ position: 'relative', width: '32.5%', borderRadius: 60, height: 60, backgroundColor: 'white' }} onPress={() => setDebugMode((prev) => !prev)}>
                <View style={{ position: 'absolute', borderRadius: 320, height: 60, width: 60, backgroundColor: debugMode ? 'purple' : 'grey', left: debugMode ? undefined : 0, right: debugMode ? 0 : undefined }} />
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8}} onPress={() => setFees(
              {
                network: '0.0025',
                validator: '0.01'
              })} >
                <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Restore Defaults</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: 'purple', paddingHorizontal: 18, width: '75%', paddingVertical: 9, borderRadius: 8, margin: 4 }} onPress={() => setSettingsTab("INIT")} >
                <Text style={{ textAlign: 'center', color: 'white', fontSize: 18, fontWeight: '800' }}>Back</Text>
              </TouchableOpacity>
            </View>
            :
            settingsTab === "WALLET"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, position: 'relative' }}>
              <ScrollView contentContainerStyle={{ alignItems: 'center' }}   style={{ borderBottomColor: 'purple', borderBottomWidth: 3, borderTopWidth: 3, width: '90%', marginVertical: 8, maxHeight: height*0.6, minHeight: height * 0.6 }}>
              {
                wallets.map((x, index) => 
                  <TouchableOpacity key={index} activeOpacity={0.75} onLongPress={() => { setEditWallet({orgName: x, newName: ""}); setSettingsTab("WALLET.MODIFY"); }} onPress={() => 
                  {
                    if(x.startsWith("_"))
                    {
                      //open up password tab
                      setUnlockWallet({ unlocking: x, password: "", error: "" });
                    }
                    else 
                    {
                      setPassword("");
                      setWallet(() => ({ name: x, address: "" }));
                    }
                  }} style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'purple', borderColor: wallet.name === x ? 'red' : 'transparent', borderWidth: 2, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%', marginBottom: 8, marginTop: index === 0 ? 8 : 0 }}>
                    <Text style={{ color: 'white', fontSize: 22, textAlign: 'center'}}>{x.startsWith("_") ? x.split("_")[1] : x}</Text>
                    { x.startsWith("_") ? <FontAwesomeIcon style={{ position: 'absolute', right: 32 }} color='white' icon={faLock} /> : <></> }
                  </TouchableOpacity>)
              }
              </ScrollView>
              {
                unlockWallet.unlocking === ""
                ? <></> :
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'space-evenly', zIndex: 18, width: Dimensions.get('screen').width/1.25, height: Dimensions.get('screen').height/2, backgroundColor: 'grey'}}>
                  <Text style={{ color: 'purple', fontWeight: '800', fontSize: 22}}>Enter Password</Text>
                  <TextInput placeholder='password' value={unlockWallet.password} onChangeText={(e) => setUnlockWallet((prev) => ({...prev, password: e}))} style={{ backgroundColor: 'white', textAlign: 'center', width: '90%', margin: 8, color: 'purple' }} placeholderTextColor={'grey'} />
                  <Text style={{ color: 'red', fontSize: 18, fontWeight: '600' }}>{unlockWallet.error}</Text>
                  <TouchableOpacity style={{ backgroundColor: 'purple', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, width: '80%' }} onPress={async () => 
                  {
                    const test = await attemptUnlockWallet(unlockWallet.unlocking, unlockWallet.password);
                    if(test)
                    {
                      setPassword(unlockWallet.password);
                      setWallet(() => ({ name: unlockWallet.unlocking, address: "" }));
                      setUnlockWallet({ unlocking: "", password: "", error: "" });
                    }
                    else
                    {
                      setUnlockWallet((prev) => ({...prev, error: "Wrong Password"}));
                    }
                  }}>
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '800', fontSize: 18 }}>Unlock Wallet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: 'purple', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, width: '80%' }} onPress={() => setUnlockWallet({ unlocking: "", password: "", error: "" })}>
                    <Text style={{ textAlign: 'center', color: 'white', fontWeight: '800', fontSize: 18 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              }
              <View style={{ height: height * 0.2, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}>
                <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%' }} onPress={() => navigation.navigate("WalletImporter")}>
                  <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center'}}>Import Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%' }} onPress={() => navigation.navigate("WalletCreator")}>
                  <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center'}}>New Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%' }} onPress={() => setSettingsTab("INIT")}>
                  <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Back</Text>
                </TouchableOpacity>
              </View>
            </View> 
            : 
            settingsTab === "WALLET.MODIFY"
            ?
            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', width: '100%' }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 32 }}>{editWallet.orgName.startsWith("_") ? editWallet.orgName.split("_")[1] : editWallet.orgName}</Text>
                <TextInput style={{ backgroundColor: 'white', color: 'purple', width: '75%', marginVertical: 32 }} placeholderTextColor={'grey'} placeholder={editWallet.orgName} value={editWallet.newName} onChangeText={(e) => setEditWallet((prev) => ({ ...prev, newName: e.replace(/_/g, "") }))} />
              </View>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'red', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%', marginBottom: 8 }} onPress={async () => 
              {
                await RNFS.unlink(`/data/data/com.thewallet/files/wallets/${editWallet.orgName}.dwallet`);
                setWallets((prev) => ([...prev.filter((x) => x !== editWallet.orgName)]));
                setSettingsTab("WALLET");
              }}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Delete Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%', marginBottom: 8 }} onPress={async () => 
              {
                await RNFS.moveFile(`/data/data/com.thewallet/files/wallets/${editWallet.orgName}.dwallet`, `/data/data/com.thewallet/files/wallets/${editWallet.orgName.startsWith("_") ? "_" : ""}${editWallet.newName}.dwallet`);
                setWallets((prev) => ([...prev.filter((x) => x !== editWallet.orgName), `${editWallet.orgName.startsWith("_") ? "_" : ""}${editWallet.newName}`]));
                setEditWallet((prev) => ({ orgName: `${prev.orgName.startsWith("_") ? "_" : ""}${prev.newName}`, newName: "" }));
              }}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Rename Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} style={{backgroundColor: 'purple', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 32, width: '75%', marginBottom: 8 }} onPress={() => setSettingsTab("WALLET")}>
                <Text style={{color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center' }}>Back</Text>
              </TouchableOpacity>
            </View> : <></>
          :
          page === "BALANCE"
          ?
          <View style={{flexDirection: 'column', height: '100%'}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{ flex: 1 }}>
                <DropDownPicker
                  items={networks.map((x) => 
                  ({
                    label: x.name,
                    value: x.name,
                    icon: () => <Image source={CELL_Icon} />
                  }))}
                  value={activeNetwork}
                  setValue={setActiveNetwork}
                  multiple={false}
                  open={networkChooserOpen}
                  setOpen={setNetworkChooserOpen}
                  style={{ backgroundColor: 'transparent', borderColor: '#5A5A5A', borderRadius: 0, borderWidth: 0 }}
                  arrowIconStyle={{ display: 'none' }}
                  textStyle={{color: 'white', fontSize: 22 }}
                  dropDownContainerStyle={{ backgroundColor: '#5A5A5A', paddingVertical: 4 }}
                />
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                <TouchableOpacity style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}} onPress={() =>
                  {
                    if(isSendOpen) 
                    {
                      openSend();
                      setSendStatus("");
                      setTxnJSON("");
                    }

                    setSettingsTab("WALLET");
                    setPage("SETTINGS");
                  }}>
                  <Text style={{fontSize: 22, color: 'white', marginRight: 8}}>{wallet.name.startsWith("_") ? wallet.name.split("_")[1] : wallet.name}</Text>
                  <FontAwesomeIcon icon={faWallet} size={22} color={'white'} style={{marginRight: 8}} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.75} onPress={copy}>
              <Text style={{ color: 'white', fontSize: 22, textAlign: 'center', marginVertical: 8}} >{wallet.address === "" ? "No Wallet" : smallWallet()}</Text>
            </TouchableOpacity>
            <View style={{alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 8}}>
              <View style={{backgroundColor: 'purple', height: 1, width: '90%'}}></View>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: '800', color: 'white' }}>Balances</Text>
            {
              !balanceLoaded
              ?
              <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: '800', color: 'red' }}>LOading Balance</Text>
              :
              balances.length === 0
              ?
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 'auto'}}>
                <Image source={getIcon(networks.find((x) => x.name === activeNetwork)!.ticker)} style={{ height: 12, aspectRatio: '1/1', objectFit: 'contain', borderRadius: 320 }} />
                <Text style={{color: 'white', fontSize: 24 }}>0</Text>
              </View>
              :
              balances.map((x) => x.amount === 0 ? null : <View key={x.ticker} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 'auto'}}><Image source={getIcon(x.ticker)} style={{ height: 12, aspectRatio: '1/1', objectFit: 'contain', borderRadius: 320 }} /><Text style={{color: 'white', fontSize: 24 }}>{x.amount}</Text></View>)
            }
          </View>
          :
          page === "WEB"
          ?
          <View style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
            <View style={{ width: '100%', height: '80%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'orange'}}>
              <TextInput placeholder='https://www.cellframe.net' style={{ backgroundColor: 'white', color: 'purple', width: '100%', textAlign: 'center' }} placeholderTextColor={'grey'}
                onChangeText={(e) => setURL((prev) => ({...prev, typing: e}))}
                onSubmitEditing={() => setURL((prev) => ({ actual: prev.typing, typing: "" }))}
               />
              <WebView
                source={{ uri: url.actual }}
                style={{ width: Dimensions.get("screen").width, flex: 1 }}
                onShouldStartLoadWithRequest={(req) => { console.log('WebView Request:', req); return true; }}
                onError={(err) => console.log(err)}
                onMessage={(msg) => console.warn('Webview Log:', msg.nativeEvent.data)}
                javaScriptEnabled={true}
                injectedJavaScript=
                {
                  `
                  // temporary solution so you can access the connect/disconnect button on mobile
                  const meta = document.createElement('meta');
                  meta.name = 'viewport';
                  meta.content = 'width=1024';
                  document.head.appendChild(meta);
                  `
                }
              />
            </View>
          </View>
          :
          <></>
        }
        <View style={{flex: 1, justifyContent: 'flex-end'}}>
          <View style={{height: 48, backgroundColor: 'purple', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around'}}>
            <TouchableOpacity activeOpacity={0.75} style={{flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'white', height: '100%'}} onPress={() => 
            {
              if(isSendOpen) 
              {
                openSend();
                setSendStatus("");
                setTxnJSON("");
              }

              setSettingsTab("INIT");
              setPage("SETTINGS");
            }}>
              <FontAwesomeIcon icon={faGear} color='white' />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} style={{flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%'}} onPress={() => 
            {
              if(page === "BALANCE") 
              {
                openSend();
                setSendStatus("");
                setTxnJSON("");
                return;
              }

              setPage("BALANCE");
            }}>
              <FontAwesomeIcon icon={faArrowUpFromBracket} color='white' />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} style={{flex: 1, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: 'white', height: '100%'}} onPress={() => 
            {
              if(isSendOpen) 
              {
                openSend();
                setSendStatus("");
                setTxnJSON("");
              }

              setPage("WEB");
            }}>
              <FontAwesomeIcon icon={faGlobe} color='white' />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={{height: sendHeightRef, position: 'absolute', bottom: 48, backgroundColor: 'purple', width: '100%', overflow: 'hidden'}}>
        {
          sendStatus === "SENDING"
          ?
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly'}}>
            <FontAwesomeIcon style={{ color: 'white', }} size={128} icon={faCircleHalfStroke} />
            <Text style={{ color: 'white', fontSize: 32, textAlign: 'center', fontWeight: '800' }}>{sendStatus}</Text>
          </View>
          :
          sendStatus === "Error"
          ?
          <View style={{ flex: 1}}>
            <Text style={{ color: 'red', fontWeight: '800', fontSize: 22, textAlign: 'center' }}>ERROR</Text>
            <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center'}}>Transaction Failed</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={{ backgroundColor: 'white', margin: 8, borderRadius: 16}} onPress={() => setSendStatus("")}>
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: 'purple', paddingVertical: 8 }}>Retry</Text>
            </TouchableOpacity>
          </View>
          :
          sendStatus === ""
          ?
          <>
            <DropDownPicker
              open={dpOpen}
              value={dpValue}
              items={dpItems}
              setOpen={setDPOpen}
              setValue={setDPValue}
              placeholder='Select a Coin'
              listMode='SCROLLVIEW'
              searchable={true}
              ListEmptyComponent={() => <Text style={{ textAlign: 'center', paddingVertical: 4 }}>You have no Tokens</Text>}
            />
            <View>
              <TextInput placeholder='Address' style={{ backgroundColor: 'white', textAlign: 'center', color: 'purple', margin: 4, borderRadius: 8, marginTop: 8 }} placeholderTextColor={'grey'} onChangeText={(e) => setSend((prev) => ({ address: e, amount: prev.amount }))} onSubmitEditing={() => {amountInputRef.current?.focus()}} />
            </View>
            <View style={{position: 'relative', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
              <TextInput ref={amountInputRef} keyboardType='numeric' placeholder='Amount' style={{ backgroundColor: 'white', textAlign: 'center', color: 'purple', margin: 4, borderRadius: 8, marginBottom: 8, width: '100%' }} placeholderTextColor={'grey'} value={send.amount} onChangeText={(e) => setSend((prev) => ({ address:  prev.address, amount: e }))} onSubmitEditing={sendCoins} />
              <TouchableOpacity style={{ position: 'absolute', right: 16 }} onPress={() => { if(!dpValue) return; const balance = balances.find((x) => x.ticker === (dpValue.toUpperCase())); if(!balance) return; console.log(balance.amount); setSend((prev) => ({...prev, amount: (balance.amount - parseFloat(fees.network) - parseFloat(fees.validator)).toString()})); }}>
                <Text style={{ color: 'blue' }}>MAX</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ backgroundColor: 'white', margin: 8, borderRadius: 16}} onPress={sendCoins}>
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: 'purple', paddingVertical: 8 }}>Send Coins</Text>
            </TouchableOpacity>
          </>
          :
          <View style={{ flexDirection: 'column', height: '100%'}}>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 22, fontWeight: '800'}}>Txn Created</Text>
            <Text style={{ color: 'white', fontWeight: '600' }} onPress={() => Clipboard.setString(sendStatus)}>{sendStatus}</Text>
            <View style={{ flex: 1 }} />
            {
              debugMode
              ?
              <TouchableOpacity style={{ backgroundColor: 'white', margin: 8, borderRadius: 16}} onPress={() => Clipboard.setString(txnJSON)}>
                <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: 'purple', paddingVertical: 8 }}>Copy Txn JSON</Text>
              </TouchableOpacity> 
              :
              <></>
            }
            <TouchableOpacity style={{ backgroundColor: 'white', margin: 8, borderRadius: 16}} onPress={() => Linking.openURL(`https://explorer.cellframe.net/transaction/${activeNetwork}/${sendStatus}`)}>
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: 'purple', paddingVertical: 8 }}>View on Explorer</Text>
            </TouchableOpacity>                
            <TouchableOpacity style={{ backgroundColor: 'white', margin: 8, borderRadius: 16}} onPress={() => 
            {
              openSend();
              setSendStatus("");
              setTxnJSON("");
            }}>
              <Text style={{ textAlign: 'center', fontWeight: '800', fontSize: 22, color: 'purple', paddingVertical: 8 }}>Close</Text>
            </TouchableOpacity>                
          </View>
        }    
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default App;
