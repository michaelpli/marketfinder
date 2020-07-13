import React, {Component, PureComponent} from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
//import ReactMapGL, {NavigationControl, Marker} from 'react-map-gl';
import MapGL, {
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  Marker
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import pin from './images/organic.png';
import Card from 'react-bootstrap/Card';

const axios = require('axios');
const mapbox_token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const navControlStyle = {
  position: 'absolute',
  bottom: 25,
  left: 0,
  padding: '10px'
};

const geolocateStyle = {
  position: 'absolute',
  bottom: 120,
  left: 0,
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
//ex: '05/01/2016 to 10/31/2016 Sat: 10:00 AM-4:00 PM;Sun: 10:00 AM-4:00 PM;<br> <br> <br> '
//ex: '06/12/2014 to 11/20/2014 Thu: 11:00 AM-6:00 PM;<br> <br> <br> '
//ex: ' Thu: 2:00 PM-6:00 PM;<br> <br> <br> '
function formatSchedule(schedule) {
  schedule = schedule.slice(0, schedule.length - 16)
  console.log(schedule)
  if(schedule.charAt(0) == ' ') { //no month signature
    const timesArray = schedule.split(';')
    return timesArray
  }
  const months = schedule.slice(0, 24)
  console.log(months)
  return schedule
}

class MarkerInfo extends PureComponent{

  render() {
    const market = this.props.market;
    const name = market.marketname.slice(4)
    const dist = market.marketname.slice(0, 3)
    const address = market.marketDetails.Address
    const streetAddress = address.slice(0, address.indexOf(','))
    const restAddress = address.slice(address.indexOf(','), address.length - 7)
    const products = market.marketDetails.Products
    const googleLink = market.marketDetails.GoogleLink
    const schedule = market.marketDetails.Schedule
    const formatschedule = formatSchedule(schedule)
    if (formatschedule == null) return

    return(
      <div className="MarkerInfo">
        <div className="PopupTitle">{name}</div>
        <div className="PopupAddress">
          <a style = {{color: "RoyalBlue"}} target="_new" href={googleLink} >
            {streetAddress} 
          </a>
          {restAddress+" ("+dist +" mi.)"}
        </div>
        <div className="PopupProductTitle">Products:</div>
        <div className="PopupProducts">{products}</div>
        <div className="PopupScheduleTitle">Schedule:</div>
        <div className="PopupSchedule">{formatschedule}</div>
      </div>
    )
  }
} 

class MyMarker extends PureComponent{

  constructor(props) {
    super(props);
    this.state = {
      popupInfo: null
    }
  }

  render() {
    let market = this.props.market;
    let GMapsLink = market.marketDetails.GoogleLink;
    let coords = parseGMapsLink(GMapsLink);
    market = {...market, coords: coords};
    const SIZE = 30;
    return (
        <Marker
          key={market.id} 
          latitude={coords.lat} 
          longitude={coords.long}>
            <img 
            height={SIZE}
            viewBox="0 0 24 24"
            src={pin} 
            style={{
              cursor: 'pointer',
              fill: '#d00',
              stroke: 'none',
              transform: `translate(${-SIZE/2}px,${-SIZE}px)`
            }}
             onMouseEnter={() => this.props.onEnter(market)}  
            > 
            </img>
        </Marker>
    );
  }
}

class Markers extends PureComponent {
  render() {
    return this.props.markets.map(market => {
        return (
          <MyMarker market = {market} key = {market.id} /*onClick = {this.props.onClick} */ onEnter = {this.props.onEnter} onLeave = {this.props.onLeave} />
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
      markets: null,
      popupInfo: null,
      popup: false
    };
    //this.onHoverMarker = this.onHoverMarker.bind(this)
    this.renderPopup = this.renderPopup.bind(this)
    this.onEnterMarker = this.onEnterMarker.bind(this)
    this.onLeaveMarker = this.onLeaveMarker.bind(this)
  }

  // onHoverMarker = market => {
  //   if (this.state.popupInfo) {
  //     this.setState({popupInfo: null});
  //     console.log("popupinfo = null")
  //   }
  //   else {
  //     this.setState({popupInfo: market}); 
  //     console.log("popupinfo = market")
  //   }
  // };

  onEnterMarker = (market) => {
    this.setState({popupInfo: market})
  }

  onLeaveMarker = () => {
    this.setState({popupInfo: null})
  }

  renderPopup() {
    const {popupInfo, popup} = this.state;
    const SIZE = 30;
    return (
      (popupInfo || popup) && (
        <Popup
          tipSize={5}
          anchor="top"
          longitude={popupInfo.coords.long}
          latitude={popupInfo.coords.lat}
          closeButton={true}
          onClose = {() => this.setState({popupInfo: null})}
          closeOnClick={true}
          style={{
            cursor: 'pointer',
            fill: '#d00',
            stroke: 'none',
            transform: `translate(${-SIZE/2}px,${-SIZE}px)`
          }}
        >
          {<MarkerInfo market={popupInfo}/>}
        </Popup>
      )
    );
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      async position => {
        let viewport = {...this.state.viewport};
        //viewport.latitude = position.coords.latitude;
        //viewport.longitude = position.coords.longitude;
        viewport.latitude = 40.7128
        viewport.longitude = -74.0060
        this.setState({viewport});

        //load markets
        //let marketList = await getMarkets(position.coords.latitude, position.coords.longitude);
        let marketList = await getMarkets(viewport.latitude, viewport.longitude);
        
        //get details
        let newList = [];
        for (const market of marketList.slice(0, 19)) {
          let marketDetails = await getMarketDetails(market.id);
          if (marketDetails.Products.length == 0 || marketDetails.Schedule.length <= 15) continue
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
      <MapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewport => this.setState({viewport})}
        >
        <Markers markets={this.state.markets} /*onClick={this.onHoverMarker}*/ onEnter = {this.onEnterMarker} onLeave = {this.onLeaveMarker}/>
        {this.renderPopup()}
        <div className="nav" style={navControlStyle}>
          <NavigationControl/>
        </div>
        <div style={geolocateStyle}>
          <GeolocateControl fitBoundsOptions={{maxZoom: 12}}/>
        </div>
      </MapGL>
    );
  }  
}

function App() {
  return (
    <Map/> 
  );
}

export default App;
