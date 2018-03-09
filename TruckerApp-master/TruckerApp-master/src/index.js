import React, { Component } from 'react';
import { Router, Scene } from 'react-native-router-flux';
import TripListScene from './TripListScreen';
import MapScene from './MapScreen';

console.disableYellowBox = true;

const App = () => {
    return (
        <Router>
            <Scene key="root">
                <Scene key="triplist"
                    component={TripListScene}
                    hideNavBar={true}
                    initial
                />
                <Scene key="map"
                    component={MapScene}
                    title="Map"
                />
            </Scene>
        </Router>
    );
}

export default App;