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
import MapboxAutocomplete from 'react-mapbox-autocomplete';
import Geocoder from 'react-mapbox-gl-geocoder'
import FadeIn from "react-fade-in";
import Lottie from "react-lottie";
import * as tractor from "./tractor.json";
import * as completeOrange from "./check.json";

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

const tractorOptions = {
  loop: true,
  autoplay: true,
  animationData: tractor.default,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
}

const completeOptions = {
  loop: false,
  autoplay: true,
  animationData: completeOrange.default,
  rendererSettings: {
     preserveAspectRatio: "xMidYMid slice"
  }
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
      <div>
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
             onMouseLeave={() => this.props.onLeave()}
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
          <MyMarker 
            market = {market} 
            key = {market.id} 
            /*onClick = {this.props.onClick} */ 
            onEnter = {this.props.onEnter} 
            onLeave = {this.props.onLeave}
          />
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
        zoom: 13,
        bearing: 0,
        pitch: 0,
      },
      markets: null,
      loadComplete: false,
      popupInfo: null,
      overPopup: false,
      overMarker: false,
      flag: false,
    };
    this.renderPopup = this.renderPopup.bind(this)
    this.onEnterMarker = this.onEnterMarker.bind(this)
    this.onLeaveMarker = this.onLeaveMarker.bind(this)
    this.suggestionSelect = this.suggestionSelect.bind(this)
  }

  onEnterMarker = (market) => {
    this.setState({popupInfo: market, overMarker: true})
  }

  onLeaveMarker = () => {
    this.setState({overMarker: false})
  }

  renderPopup() {
    const {popupInfo, overPopup, overMarker} = this.state;
    const SIZE = 30;
    return (
      (overMarker || overPopup) && (
        <div onMouseEnter={() => this.setState({overPopup: true})} onMouseLeave={() => this.setState({overPopup : false})}>
        <Popup
          className="Popup"
          offsetTop={0}
          tipSize={0}
          anchor="top"
          longitude={popupInfo.coords.long}
          latitude={popupInfo.coords.lat}
          closeButton={false}
          //onClose = {() => this.setState({popupInfo: null, popup: false})}
          closeOnClick={false}
          style={{
            cursor: 'pointer',
            fill: '#d00',
            stroke: 'none',
            transform: `translate(${-SIZE/2}px,${-SIZE}px)`,
          }}
        >
          {<MarkerInfo market={popupInfo}/>}
        </Popup>
        </div>
      )
    );
  }

  suggestionSelect(result, lat, lng, text) {
    console.log(result, lat, lng, text);
    this.moveMap(parseFloat(lat), parseFloat(lng));
    this.loadMarkets(parseFloat(lat), parseFloat(lng));
    this.setState({flag: !this.state.flag})
  }

  async loadMarkets(lat, long) {
    this.setState({loadComplete: false, markets: null});
    let marketList = await getMarkets(lat, long);
    //get details
    let newList = [];
    for (const market of marketList.slice(0, 19)) {
      let marketDetails = await getMarketDetails(market.id);
      if (marketDetails.Products.length == 0 || marketDetails.Schedule.length <= 16) continue;
      market.marketDetails = marketDetails;
      newList.push(market);
    }
    console.log('detailMarketList:');
    console.log(newList);
    this.setState({loadComplete: true});
    setTimeout(() => {
      this.setState({markets: newList});
    }, 1200);
  }

  moveMap(lat, long) {
    let viewport = {...this.state.viewport};
    viewport.latitude = lat;
    viewport.longitude = long;
    viewport.zoom = 13;
    this.setState({viewport});
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      async position => {
        this.moveMap(position.coords.latitude, position.coords.longitude);
        this.loadMarkets(position.coords.latitude, position.coords.longitude);
      },
      err => console.log(err)
    );
  }

  render() {
    let {viewport} = this.state;
    if (!viewport.latitude || !viewport.longitude) {
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

        <div className="MapboxAutocomplete">
        <MapboxAutocomplete 
          publicKey={mapbox_token}
          inputClass='form-control search'
          onSuggestionSelect={this.suggestionSelect}
          country='us'
          resetSearch={true}/>
        </div> 

        {this.state.markets ?
         <Markers markets={this.state.markets} /*onClick={this.onHoverMarker}*/ onEnter = {this.onEnterMarker} onLeave = {this.onLeaveMarker} />
        : loadingMarkets(this.state.loadComplete)}

        {this.renderPopup()}

        <div style={navControlStyle}>
          <NavigationControl/>
        </div>
        <div style={geolocateStyle}>
          <GeolocateControl fitBoundsOptions={{maxZoom: 10}}/>
        </div>

      </MapGL>
    );
  }  
}

function loadingMarkets(loadComplete) {
  return(
    (loadComplete ? 
    (<div className="Complete">
      <FadeIn>
        <div className="d-flex justify-content-center align-items-center">
          <h5 className="CompleteText">  Finding Nearby Markets</h5>
          <Lottie options={completeOptions} height={72} width={72} /> 
        </div>
      </FadeIn>
    </div>) 
    :
    (<div className="Loading">
    <FadeIn>
      <div className="d-flex justify-content-center align-items-center">
        <h5 className="LoadingText">  Finding Nearby Markets</h5>
        <Lottie options={tractorOptions} height={60} width={60}/>
      </div>
    </FadeIn>
  </div>)
  ))
}

function App() {
  return (
    <Map/> 
  );
}

export default App;
