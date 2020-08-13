import React, {PureComponent} from 'react';
import '../App.scss';

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

String.prototype.replaceMonth = function(index, replacement) {
    return this.substr(0, index-2) + replacement + this.substr(index+3);
}

//ex: '05/01/2016 to 10/31/2016 Sat: 10:00 AM-4:00 PM;Sun: 10:00 AM-4:00 PM;<br> <br> <br> '
//ex: '06/12/2014 to 11/20/2014 Thu: 11:00 AM-6:00 PM;<br> <br> <br> '
//ex: ' Thu: 2:00 PM-6:00 PM;<br> <br> <br> '
function formatSchedule(schedule) {
    schedule = schedule.slice(0, schedule.length - 16)
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

export default MarkerInfo;