import React, {Component, PureComponent} from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import MapGL, {
  Popup,
  NavigationControl,
  GeolocateControl,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import info from './images/info.png'
import MapboxAutocomplete from 'react-mapbox-autocomplete';
import FadeIn from "react-fade-in";
import Lottie from "react-lottie";
import * as tractor from "./animations/tractor.json";
import * as completeOrange from "./animations/check-gold.json";

import MarkerInfo from './components/MarkerInfo';
import InfoModal from './components/InfoModal';
import MyMarker from './components/Marker';

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

const refreshStyle = {
  position: 'absolute',
  left: '50%',
  right: '50%',
  width: '130px',
  marginLeft: '-65px',
  top: 5,
  paddingLeft: '14px',
  paddingRight: '11px',
  paddingTop: '7px',
  paddingBottom: '7px',
};

const infoPicStyle = {
  position: 'absolute',
  top: 5,
  right: 5,
  width: '35px',
  height: '35px',
  cursor: 'pointer',
}

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
    //console.log(response.status);
    //console.log(response.data);
    return response;
  }, (error) => {
    console.log(error);
  });
  return response.data.results //JSONArray
}

async function getMarketDetails(id) {
  let response = await axios.get('https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id='+id, {})
    .then((response) => {
    //console.log(response.status);
    //console.log(response.data);
    return response;
  }, (error) => {
    console.log(error);
  });
  //console.log(response.data.marketdetails)
  return response.data.marketdetails //JSONObject
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
      moved: false,
      movedNum: 0,
      info: false,
    };
    this.renderPopup = this.renderPopup.bind(this)
    this.onEnterMarker = this.onEnterMarker.bind(this)
    this.onLeaveMarker = this.onLeaveMarker.bind(this)
    this.suggestionSelect = this.suggestionSelect.bind(this)
    this.refresh = this.refresh.bind(this)
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
    this.moveMap(parseFloat(lat), parseFloat(lng));
    this.loadMarkets(parseFloat(lat), parseFloat(lng));
    this.setState({moved: false})
  }

  refresh() {
    let viewport = {...this.state.viewport};
    this.loadMarkets(viewport.latitude, viewport.longitude);
    this.setState({moved: false})
  }

  async loadMarkets(lat, long) {
    this.setState({loadComplete: false, markets: null});
    let marketList = await getMarkets(lat, long);
    //get details
    let newList = [];
    for (const market of marketList.slice(0, 19)) {
      let marketDetails = await getMarketDetails(market.id);
      if (marketDetails.Products.length === 0 || marketDetails.Schedule.length <= 16) continue;
      market.marketDetails = marketDetails;
      newList.push(market);
    }
    // console.log('detailMarketList:');
    // console.log(newList);
    this.setState({loadComplete: true});
    setTimeout(() => {
      this.setState({markets: newList});
    }, 1200); //pause to show check mark animation
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
      return initialLoad()
    }
    return (
      <MapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v10"
        onViewportChange={viewport => this.setState({viewport, moved: true, movedNum: this.state.movedNum + 1})}
        >

        <div className="MapboxAutocomplete">
          <MapboxAutocomplete 
            publicKey={mapbox_token}
            inputClass='form-control search'
            onSuggestionSelect={this.suggestionSelect}
            country='us'
            resetSearch={true}/>
        </div>

        {this.state.moved && this.state.movedNum > 1 &&
        <div style={refreshStyle} className='Refresh' onClick={this.refresh}>
          Search this area
        </div>}

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

        <div>
          <img 
            className='InfoPic'
            style={infoPicStyle}
            height={50}
            src={info}
            alt="pin" 
            onClick={() => this.setState({info: true})}
          />
        </div>

        <InfoModal show={this.state.info} onHide={() => this.setState({info: false})}/>

      </MapGL>
    );
  }  
}

function initialLoad() {
  return(
  <div className="InitialLoading">
      <FadeIn>
        <h3 className="d-flex justify-content-center align-items-center">Getting Ready</h3>
        <div className="d-flex justify-content-center align-items-center">
          <Lottie options={tractorOptions} height={175} width={175} /> 
        </div>
      </FadeIn>
    </div> 
    )
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
