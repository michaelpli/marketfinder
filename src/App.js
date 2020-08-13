import React, {Component, PureComponent} from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import MapGL, {
  Popup,
  NavigationControl,
  FullscreenControl,
  ScaleControl,
  GeolocateControl,
  Marker
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import pin from './images/red-blue-marker.png';
import info from './images/info3.png'
import MapboxAutocomplete from 'react-mapbox-autocomplete';
import Geocoder from 'react-mapbox-gl-geocoder'
import FadeIn from "react-fade-in";
import Lottie from "react-lottie";
import * as tractor from "./tractor.json";
import * as completeOrange from "./check-gold.json";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal'

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
  position: 'relative',
  left: '50%',
  marginLeft: '-65px',
  width: '130px',
  top: -50,
  paddingLeft: '14px',
  paddingRight: '11px',
  paddingTop: '7px',
  paddingBottom: '7px',
};

const infoButtonStyle = {
  position: 'absolute',
  top: 5,
  right: 5,
  //border: 'solid',
  borderColor: 'black',
  borderRadius: '50%',
  borderWidth: 'thin',
  cursor: 'pointer',
  width: '50px',
  height: '50px',
}

const infoPicStyle = {
  position: 'absolute',
  top: 5,
  right: 5,
  width: '35px',
  height: '35px',
  // top: '50%',
  // right: '50%',
  // marginTop: '-15px',
  // marginRight: '-15px',
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

const monthMap = {};
monthMap['01'] = 'January';
monthMap['02'] = 'February';
monthMap['03'] = 'March';
monthMap['04'] = 'April';
monthMap['05'] = 'May';
monthMap['06'] = 'June';
monthMap['07'] = 'July';
monthMap['08'] = 'August';
monthMap['09'] = 'September';
monthMap['10'] = 'October';
monthMap['11'] = 'November';
monthMap['12'] = 'December';

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
  let endIndex = schedule.indexOf('<br>');
  if (endIndex >= 0) {
    schedule = schedule.substring(0, endIndex);
  }
  if(schedule.charAt(0) == ' ') { //no month signature
    const timesArray = schedule.split(';')
    return timesArray
  }
  const years = [/\/2008/g, /\/2009/g, /\/2010/g, /\/2011/g, /\/2012/g, /\/2013/g, /\/2014/g, /\/2015/g, /\/2016/g, /\/2017/g, /\/2018/g, /\/2019/g, /\/2020/g, /\/2021/g]
  for (let year of years) {
    schedule = schedule.replace(year, '')
  }
  var newline = true;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule.charAt(i) == '/') {
      newline = !newline;
      console.log(schedule.substr(i-2, 5));
      var newMonth = formatMonth(schedule.substr(i-2, 5)) + (newline ? ';' : '')
      schedule = schedule.replaceMonth(i,  newMonth)
    }
  }
  schedule = schedule.replace(/-/g, '\u2014')
  //schedule = schedule.replace(/:00/g, '')
  schedule = schedule.replace(/ PM/g, 'PM')
  schedule = schedule.replace(/ AM/g, 'AM')
  return schedule
}

function formatMonth(s) {
  let tempArr = s.split('/');
  let month = tempArr[0];
  let day = parseInt(tempArr[1]);
  let monthString = monthMap[month];
  var dayString;
  if (day < 10) {
    dayString = "Early";
  }
  else if (day < 20) {
    dayString = "Mid";
  }
  else {
    dayString = "Late";
  }
  return dayString + " " + monthString;
}

String.prototype.replaceMonth = function(index, replacement) {
  return this.substr(0, index-2) + replacement + this.substr(index+3);
}

class MarkerInfo extends PureComponent{
  render() {
    const market = this.props.market;
    const name = market.marketname.slice(4)
    const dist = market.marketname.slice(0, 3)
    const address = market.marketDetails.Address
    const streetAddress = address.slice(0, address.indexOf(','))
    const restAddress = address.slice(address.indexOf(','), address.length - 7)
    const products = market.marketDetails.Products.replace(/; /g, ' • ')
    const googleLink = market.marketDetails.GoogleLink
    const schedule = market.marketDetails.Schedule
    const formatschedule = formatSchedule(schedule)
    if (formatschedule == null) {return};
    var scheduleArr = [];
    try {
      scheduleArr = formatschedule.split(';')
    }
    catch(err) {
    }
    
  
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
        {scheduleArr.map(row => <div key={row} className="PopupSchedule">{row}</div>)}
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
    const SIZE = 35;
    return (
        <Marker
          key={market.id} 
          latitude={coords.lat} 
          longitude={coords.long}>
            <img 
            height={SIZE}
            viewBox="0 0 30 30"
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

function InfoModal(props) {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <img height={25} src={pin} />
        <Modal.Title id="contained-modal-title-vcenter">
          &nbsp; What is <i>marketfinder</i>?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>About</h4>
        <p style={{fontSize: 16}}>marketfinder is a web app that helps users easily access detailed information about their local farmers markets. 
          I love to shop at different farmers markets, but I’ve always found it difficult to figure out if a certain market 
          will have the specific foods I’m looking for, not to mention if it’s currently open for the season or not. In
          addition, many people are  simply unsure where to find the closest markets and are unaware of all the different
          products they have to offer. So, I created marketfinder to streamline the farmers market experience and to 
          encourage people to shop local.</p>
        <p style={{fontSize: 16}}>After searching for an area you want to explore, you’ll be able to interactively visualize the closest farmers 
          markets nearby and view details about the products they offer and the months they’ll be in season for.</p>

        <h4>Why Farmers Markets?</h4>
        <p style={{fontSize: 16}}>The fruits and veggies you buy at the farmers market are the freshest available. They’re brought directly to you: 
          no long-distance shipping, no gassing to simulate the ripening process, no sitting for weeks in storage. </p>
        <p style={{fontSize: 16}}>It also contributes to protecting the environment. Food in the U.S. travels an average of 1,500 miles to get to 
          your plate. All this shipping consumes large amounts of natural resources, contributes to pollution, and creates 
          trash with excess packaging.</p>
        <p style={{fontSize: 16}}>Finally, shopping at farmers markets makes a big impact on family farmers. Now more than ever, small family farms 
          have a hard time competing in the food marketplace. Buying directly from farmers gives them a better return for their 
          produce and is a great way to support your community.</p>

        <h4>Technology</h4>
        <p style={{fontSize: 16}}>marketfinder is built with React (<a style = {{color: "Teal"}} target="_new" href='https://create-react-app.dev/' >
            create-react-app</a>). Mapping capabilities are provided by <a style = {{color: "Teal"}} target="_new" 
            href='https://www.mapbox.com/'>MapBox</a>, and detailed farmers 
          market data is sourced from the USDA Farmers Market Directory <a style = {{color: "Teal"}} target="_new" 
            href='https://www.ams.usda.gov/local-food-directories/farmersmarkets'>API</a>. <a style = {{color: "Teal"}} target="_new" 
            href='https://react-bootstrap.netlify.app/'>React-Bootstrap</a> for styling, hosted by <a style = {{color: "Teal"}} target="_new" 
            href='https://www.heroku.com'>Heroku</a>. 
          Feel free to check out the source code on my <a style = {{color: "Teal"}} target="_new" 
            href='https://www.github.com/michaelpli'>GitHub</a>.</p>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
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
    console.log(result, lat, lng, text);
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
        setTimeout(() => {
        this.moveMap(position.coords.latitude, position.coords.longitude);
        }, 0);
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
        mapStyle="mapbox://styles/mapbox/streets-v11"
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

        {/* <div className="InfoButton" style={infoButtonStyle} variant="info" onClick={() => this.setState({info: true})}>
          About
        </div> */}

        <div /*className="InfoButton" */ style={infoButtonStyle}>
          <img 
              //className="InfoPic"
              style={infoPicStyle}
              height={50}
              src={info} 
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
