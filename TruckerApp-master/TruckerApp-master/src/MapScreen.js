import React, { Component } from 'react';
import { Router, Scene } from 'react-native-router-flux';
import { AsyncStorage, ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity, Button } from 'react-native';
import MapView from 'react-native-maps'
import Polyline from '@mapbox/polyline';
import { Actions } from 'react-native-router-flux';
import { Global } from './global.js';
import renderIf from './renderIf';

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;

const ASPECT_RATIO = width / height;
const LATITUDE = 23.0421179;
const LONGITUDE = 72.5488746;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

console.disableYellowBox = false;

export default class MapScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedID: -1,
      selectedStatus: "NA",
      coords: [],
      selectedTags: [],
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
    }
  }

  componentDidMount() {
    AsyncStorage.getItem("SelectedID").then((idValue) => {
      if (idValue) {
		  let selectedId = JSON.parse(idValue);
		  this.setState({ selectedID: selectedId });
		  console.warn("Selected Id: " + this.state.selectedID);
		  AsyncStorage.getItem(this.props.data.id).then((statusValue) => {
			  if (statusValue) {
				let selectedStatus = JSON.parse(statusValue);
				this.setState({ selectedStatus: selectedStatus });
				console.warn("Selected Status: " + this.state.selectedStatus);
			  }
		  });
      }
    });
    
    this._findMe();
    this.getDirections((this.props.data.pickup_lat + "," + this.props.data.pickup_long), (this.props.data.delivery_lat + "," + this.props.data.delivery_long))
  }

  render() {
    return (
      <View style={styles.container}>
        <View>
          <TouchableOpacity style={[{
            width: 100,
            height: 40,
            padding: 15,
            justifyContent: 'center',
          }]} 
          onPress={() => { Actions.pop({ refresh: {} });}}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 28 }}>Back</Text>
            </View>
          </TouchableOpacity>
          <MapView
            style={styles.map}
            /*provider="google"*/
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            followsUserLocation={true}
            loadingEnabled={true}
            toolbarEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
            initialRegion={{
              latitude: parseFloat(this.props.data.pickup_lat),
              longitude: parseFloat(this.props.data.pickup_long),
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA
            }}>


            <MapView.Marker
              coordinate={{
                latitude: parseFloat(this.props.data.pickup_lat),
                longitude: parseFloat(this.props.data.pickup_long)
              }}
              image={require('../images/startpin.png')}
              title={this.props.data.pickup_title} />

            <MapView.Marker
              coordinate={{
                latitude: parseFloat(this.props.data.delivery_lat),
                longitude: parseFloat(this.props.data.delivery_long)
              }}
              image={require('../images/endpin.png')}
              title={this.props.data.delivery_title} />

            <MapView.Polyline
              coordinates={this.state.coords}
              strokeColor="#000"
              fillColor="rgba(255,0,0,0.5)"
              strokeWidth={3} />

          </MapView>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.viewStyle}>
            <Text style={styles.textStyle}>
              Pickup Location : {this.props.data.pickup_location}
            </Text>
          </View>
          <View style={styles.viewStyle}>
            <Text style={styles.textStyle}>
              Delivery Location : {this.props.data.delivery_location}
            </Text>
          </View>
          <View style={styles.viewStyle}>
            <Text style={styles.textStyle}>
              Time : {this.props.data.time} Min , Weight : {this.props.data.weight} Kg
            </Text>
          </View>
          {renderIf(this.state.selectedStatus != "Stop")(
          <Button
            color={this.state.selectedStatus == "NA" ? "green" : "red"}
            onPress={() => { this.insertTag(this.props.data.id) }}
            title={this.state.selectedStatus == "NA"? "Start Trip" : "Stop Trip"}
          />
          )}
        </ScrollView>
      </View>
    );
  }

  insertTag = (id) => {
  	if (this.state.selectedID != -1 && this.state.selectedID != id) {
  		alert("Please stop already running trip before you start another trip");
  		return;
  	}
  	if (this.state.selectedStatus == "NA") {
    	this.updateStatus(id, "Start");
    }
    else {
    	this.updateStatus(id, "Stop");
    }
  }

  async updateStatus(itemId, itemStatus) {
  	fetch('http://www.foodq.co.in/reactnative/public/feeds/updateStatus.json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: itemId,
        status: itemStatus,
      })
    })
      .then((response) => response.json())
      .then((responseJson) => {
      	this.setState({ selectedStatus: itemStatus });
      	AsyncStorage.setItem(itemId, JSON.stringify(itemStatus))
      	
      	if (itemStatus == "Stop") {
      		this.setState({ selectedID: -1 });
      		AsyncStorage.setItem("SelectedID", JSON.stringify(this.state.selectedID));
      		alert("Congratulations! You successfully completed your trip!");
      		Actions.pop({ refresh: {} });
      	}
      	else {
      		this.setState({ selectedID: itemId });
      		AsyncStorage.setItem("SelectedID", JSON.stringify(itemId));
      	}
      	
        Global.onUIUpdate = true;
        Global.onSelectedID = itemId;
      })
      .catch((error) => {
      	alert("Error while updating status: " + error.message + "\nTry again later!")
        console.warn("Error while updating status: " + error.message);
      });
  }

  async getDirections(startLoc, destinationLoc) {
    try {
      let resp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${startLoc}&destination=${destinationLoc}`)
      let respJson = await resp.json();
      let points = Polyline.decode(respJson.routes[0].overview_polyline.points);
      let coords = points.map((point, index) => {
        return {
          latitude: point[0],
          longitude: point[1]
        }
      })
      this.setState({ coords: coords })
      return coords
    } catch (error) {
      console.warn("Error while getting directions: " + error.message);
      return error
    }
  }

  _findMe() {
    navigator.geolocation.getCurrentPosition(
      ({coords}) => {
        const {latitude, longitude} = coords
        this.setState({
          region: {
            latitude,
            longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        })
      },
      (error) => console.warn("Error while FindMe: " + JSON.stringify(error)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#424548',
  },
  map: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  textStyle: {
    fontSize: 18,
    padding: 10,
    color: '#000000',
  },
  viewStyle: {
    padding: 5,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 5
  },
  buttonStartStyle: {
    backgroundColor: 'red',
  },
  buttonStopStyle: {
    backgroundColor: 'blue',
  }
});

