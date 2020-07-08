import React, {Component, PureComponent} from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactMapGL, {NavigationControl, Marker} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import pin from './images/organic.png';
import Button from 'react-bootstrap/Button';

const axios = require('axios');
const mapbox_token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const navControlStyle = {
  position: 'absolute',
  bottom: 20,
  right: 0,
  padding: '10px'
};

async function getMarkets(lat, long) {
  let response = await axios.get('https://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat='+lat+'&lng='+long, {})
    .then((response) => {
    console.log(response.status);
    //console.log(response.data);
    return response;
  }, (error) => {
    console.log(error);
  });
  //console.log(response.data.results)
  return response.data.results //JSONArray
}

async function getMarketDetails(id) {
  let response = await axios.get('https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id='+id, {})
    .then((response) => {
    console.log(response.status);
    //console.log(response.data);
    return response;
  }, (error) => {
    console.log(error);
  });
  //console.log(response.data.marketdetails)
  return response.data.marketdetails //JSONObject
}

//example link: 'http://maps.google.com/?q=42.066418%2C%20-87.937294%20(%22Mt.+Prospect+Farmers+Market%22)'
function parseGMapsLink(GMapsLink) {
  let tempBoth = GMapsLink.split('%2C%20');
  let tempLat = tempBoth[0].split('=');
  let lat = parseFloat(tempLat[1]);
  let tempLong = tempBoth[1].split('%20');
  let long = parseFloat(tempLong[0]);
  return {lat: lat, long: long};
}

class myMarker extends PureComponent{
  constructor(props) {
    super(props);
  }

  render() {
    let marketDetails = this.props.marketDetails;
    return (
      <Marker 
        
      >

      </Marker>
    );
  }
}

class Markers extends PureComponent {
  render() {
    return this.props.markets.map(market => {
        let GMapsLink = market.marketDetails.GoogleLink;
        let coords = parseGMapsLink(GMapsLink);
        return (
        <Marker 
          key={market.id} 
          latitude={coords.lat} 
          longitude={coords.long}>
          <img src={pin} />
          <div>{market.marketname}</div>
          <div><Button>Hello</Button></div>
        </Marker>
        )
      }
    )
  }
}

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: null,
        longitude: null,
        zoom: 14,
        bearing: 0,
        pitch: 0,
      },
      markets: null
    };
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      async position => {
        let viewport = {...this.state.viewport};
        viewport.latitude = position.coords.latitude;
        viewport.longitude = position.coords.longitude;
        this.setState({viewport});

        //load markets
        let marketList = await getMarkets(position.coords.latitude, position.coords.longitude);
        //get details
        let newList = [];
        for (const market of marketList) {
          let marketDetails = await getMarketDetails(market.id);
          market.marketDetails = marketDetails;
          newList.push(market);
        }
        console.log('detailMarketList:')
        console.log(newList)
        this.setState({markets: newList});
      },
      err => console.log(err)
    );
  }

  render() {
    let {viewport} = this.state;
    if (!viewport.latitude || !viewport.longitude || !this.state.markets) {
      return <div>Loading...</div> //TODO replace with loading screen
    }
    return (
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewport => this.setState({viewport})}
        >
        <Markers markets={this.state.markets} />
        <div className="nav" style={navControlStyle}>
          <NavigationControl/>
        </div>
      </ReactMapGL>
    );
  }  
}

function App() {
  return (
    <Map/>
  );
}

export default App;
