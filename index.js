/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { InitMapper } from './Init';

const errorHandler = (e, isFatal) =>
{
    console.error('Global Error:', e, isFatal ? 'Fatal' : 'Non-Fatal');
}

if(!__DEV__)
{
    ErrorUtils.setGlobalHandler(errorHandler);
}

AppRegistry.registerComponent(appName, () => InitMapper);
