import React, { Component } from 'react';
import { ActivityIndicator, AsyncStorage, StyleSheet, Text, View, Image, ScrollView, TouchableHighlight, ListView, ToolbarAndroid } from 'react-native';
import { Actions } from 'react-native-router-flux';
import renderIf from './renderIf';
import { Global } from './global.js';

console.disableYellowBox = true;

var LOCDATAASYNC = "LOCDATAASYNC";
var API_URL = 'http://www.foodq.co.in/reactnative/track.json';

export default class TripListScreen extends Component {

    constructor(props) {
        super(props);
        this.state = { isLoading: true, jsonData: '', selectedID: '' }
        this.dataSource = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2
        })
    }

    componentWillUpdate() {
        if (Global.onUIUpdate) {
            this.setState({ selectedID: Global.onSelectedID });
            AsyncStorage.getItem("SelectedID").then((value) => {
                let va1 = JSON.parse(value);
                this.setState({ selectedID: va1 });
            });
            Global.onUIUpdate = false;
        }
    }

    componentDidMount() {
        return fetch(API_URL)
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({ isLoading: false, jsonData: responseJson });
                this._onStroreLocationData(LOCDATAASYNC, responseJson);
                return responseJson;
            })
            .catch((error) => {
                console.warn("Error while fetching trip details: " + error.message);
                this.setState({ isLoading: false });
                AsyncStorage.getItem(LOCDATAASYNC).then((value) => {
                    let va1 = JSON.parse(value);
                });
            });
    }

    async _onStroreLocationData(item, value) {
        try {
            await AsyncStorage.setItem(item, JSON.stringify(value));
        } catch (error) {
            console.warn('AsyncStorage error: ' + error.message);
        }
    }

    insertTag = (rowData) => {
        Global.onUIUpdate = true;
        Actions.map({ data: rowData });
    }

    render() {
        const rows = this.dataSource.cloneWithRows(this.state.jsonData.items || [])
        if (this.state.isLoading != true) {
            return (
                <View style={styles.viewcontainer}>
                    <Text style={styles.textStyle}>{this.state.jsonData.channel.title}</Text>
                    <View style={styles.viewseparator} />
                    <ListView
                        renderSeparator={(sectionID, rowID) =>
                            <View key={`${sectionID}-${rowID}`} style={styles.separator} />
                        }
                        style={styles.listView}
                        dataSource={rows}
                        renderRow={(rowData) =>
                            <TouchableHighlight onPress={() => this.insertTag(rowData)}
                                underlayColor='rgba(73,182,77,1,0.9)' style={{ flex: 1, padding: 5, margin: 5, backgroundColor: '#FFFFFF', borderRadius: 5 }}>
                                <View>
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ fontWeight: 'bold', paddingLeft: 10 }}>{rowData.pickup_title} - {rowData.delivery_title}</Text>
                                        {renderIf(rowData.id == this.state.selectedID)(
                                            <Image
                                                style={{ width: 16, height: 16 }}
                                                source={require('../images/online.png')}
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.rowTextStyle}>
                                        <Text style={{ fontWeight: 'bold' }}>Time:</Text> <Text> {rowData.time} Min</Text>{"\n"}
                                        <Text style={{ fontWeight: 'bold' }}>Weight:</Text> <Text> {rowData.weight} Kg</Text>
                                    </Text>
                                </View>
                            </TouchableHighlight>
                        }
                    />
                </View>
            );
        }
        else {
            return (
                <View style={styles.container}>
                    <View style={styles.singleviewcontainer}>
                        <ActivityIndicator
                            style={styles.centering}
                            color="#48BBEC"
                            size="large" />
                    </View>
                </View>
            );
        }
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    separator: {
        height: 0,
        backgroundColor: '#000000',
    },
    viewseparator: {
        height: 5,
        backgroundColor: '#424548',
    },
    textStyle: {
        textAlign: 'center',
        fontSize: 28,
        color: '#FFFFFF',
        backgroundColor: '#424548'
    },
    rowTextStyle: {
        justifyContent: 'center',
        fontSize: 18,
        padding: 10,
    },
    listView: {
        backgroundColor: '#424548'
    },
    baseToolbar: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    viewcontainer: {
        flex: 1,
        color: '#424548',
    },
    centering: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    singleviewcontainer: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
});
