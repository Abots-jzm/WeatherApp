"use strict";

const API_URL = "http://dataservice.accuweather.com";
const API_KEY = "mj1ocFZbLnAaffWkZGgRjS10NCwGSisC";

const searchButton = document.querySelector(".sidebar-top__search");
const searchPanel = document.querySelector(".searchbar");
const closeSearchBarBtn = document.querySelector(".searchbar-close");
const currentLocationBtn = document.querySelector(".sidebar-top__current-location");
const sidebar = document.querySelector(".sidebar");
const content = document.querySelector(".content");

let displayedLocation;

//FUNCTIONS

function getPosition() {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function getWeatherDetails(key) {
  try {
    const request = await fetch(`${API_URL}/currentconditions/v1/${key}?apikey=${API_KEY}&details=true`);
    if (!request.ok)
      throw new Error("cannot retrieve current weather details. Try another time");

    return await request.json();
  } catch (e) {
    throw e;
  }
}

async function getLocationKey(search = "current") {
  try {
    if (search === "current") {
      const position = await getPosition();
      const request = await fetch(`${API_URL}/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${position.coords.latitude}%2C${position.coords.longitude}`);
      if (!request.ok)
        throw new Error("Cannot retrieve current location at the moment. Try again later");

      const data = await request.json();
      displayedLocation = data.ParentCity.LocalizedName;
      return data.Key;
    } else {
      const request = await fetch(`${API_URL}/locations/v1/cities/autocomplete?apikey=${API_KEY}&q=${search}`);
      if (!request.ok)
        throw new Error("Cannot retrieve current location at the moment. Try again later");

      const data = await request.json();
      displayedLocation = data[0].LocalizedName;
      return data[0].Key;
    }
  } catch (e) {
    throw e;
  }
}

async function getCurrentPositionWeather() {
  try {
    const sidebarHTML = renderSpinner(sidebar);
    const contentHTML = renderSpinner(content);
    const key = await getLocationKey();
    const data = await getWeatherDetails(key);
    renderCurrentConditions(data[0], sidebarHTML, contentHTML);
  } catch (e) {
    console.log(e);
  }
}

function getDateText() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Tue", "Wed", "Thur", "Fri", "Sat"];
  const today = new Date();
  return `${weekDays[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;
}

function init() {
  getCurrentPositionWeather();
}

//EVENT LISTENERS
searchButton.addEventListener("click", () => searchPanel.classList.remove("hidden"));
closeSearchBarBtn.addEventListener("click", () => searchPanel.classList.add("hidden"));
currentLocationBtn.addEventListener("click", () => getCurrentPositionWeather());

//RENDER FUNCTION
function renderWindStatus(speed, degree, direction) {
  const section = document.querySelector(".day-highlights__wind");
  slowlyIncrement(section.querySelector(".day-highlights--value"), 1, speed, 1.5, 1);
  section.querySelector(".day-highlights__wind--direction").lastChild.nodeValue = direction;
  section.querySelector(".day-highlights__wind--direction span").style.transform = `rotate(${degree}deg)`;
}

function renderHumidity(humidity) {
  const section = document.querySelector(".day-highlights__humidity");
  slowlyIncrement(section.querySelector(".day-highlights--value"), 1, humidity, 1.5, 0);
  section.querySelector(".day-highlights__humidity__progress-bar--inner-bar").style.width = humidity + "%";
}

function renderVisibility(visibility) {
  slowlyIncrement(document.querySelector(".day-highlights__visibility .day-highlights--value"), 1, visibility, 1, 1, " ");
}

function renderAirPressure(pressure) {
  document.querySelector(".day-highlights__pressure .day-highlights--value").firstChild.nodeValue = pressure + " ";
  slowlyIncrement(document.querySelector(".day-highlights__pressure .day-highlights--value"), 1, pressure, 2.5, 1, "");

}

function slowlyIncrement(element, start, end, time, decimalPoints, extraString = "") {
  const steps = 10;
  const distance = end - start;
  const rounder = Math.pow(10, decimalPoints);

  const counter = setInterval(() => {
    const additionAmount = distance / (time * 1000 / steps);
    start += additionAmount;
    element.firstChild.nodeValue = (Math.round(start * rounder) / rounder) + extraString;

    if (start >= end)
      clearInterval(counter);

  }, steps);
}

function renderCurrentConditions(data, sidebarHTML = "", contentHTML = "") {
  if (sidebarHTML)
    removeSpinner(sidebar, sidebarHTML);
  renderImage(data["WeatherText"]);
  document.querySelector(".current-temperature p").textContent = Math.round(+data.Temperature.Metric.Value) + "";
  document.querySelector(".current-weather").textContent = data["WeatherText"];
  document.querySelector(".date-text").textContent = getDateText();
  document.querySelector(".current-location p").textContent = displayedLocation;
  if (contentHTML)
    removeSpinner(content, contentHTML);
  renderWindStatus(data.Wind.Speed.Imperial.Value, data.Wind.Direction.Degrees, data.Wind.Direction.English);
  renderHumidity(data.RelativeHumidity);
  renderVisibility(data.Visibility.Imperial.Value);
  renderAirPressure(data.Pressure.Metric.Value);
  console.log(data);
}

function renderImage(text) {
  const baseSrc = "./img/";
  let img;
  const png = ".png";

  text = text.trim().toLowerCase();
  //inefficient, will probably use object later
  if (text === "sunny" || text === "mostly sunny" || text === "hot" || text.endsWith("clear"))
    img = "Clear";
  else if (text === "ice" || text === "cold")
    img = "Hail";
  else if (text.endsWith("cloudy") || text === "fog" || text === "mist" || text.startsWith("dreary") || text.endsWith("flurries"))
    img = "HeavyCloud";
  else if (text === "rain")
    img = "HeavyRain";
  else if (text === "partly sunny" || text === "intermittent clouds" || text === "hazy sunshine" || text === "windy")
    img = "LightCloud";
  else if (text === "sleet" || text === "freezing rain" || text === "rain and snow")
    img = "Sleet";
  else if (text.endsWith("snow"))
    img = "Snow";
  else if (text.endsWith("storm") || text.endsWith("storms"))
    img = "Thunderstorm";
  else
    return;

  document.querySelector(".weather-illustration img").setAttribute("src", baseSrc + img + png);
}

function renderSpinner(element) {
  const spinnerHTML = `
      <div class="spinner">
        <div class="spinner__inner">&nbsp;</div>
      </div>`;


  const previousHTML = element.innerHTML;
  element.innerHTML = spinnerHTML;
  return previousHTML;
}

function removeSpinner(element, html) {
  element.innerHTML = html;
}

//START
// init();

const DUMMY_DATA = {
  "LocalObservationDateTime": "2022-08-15T19:57:00+01:00",
  "EpochTime": 1660589820,
  "WeatherText": "Rain",
  "WeatherIcon": 18,
  "HasPrecipitation": true,
  "PrecipitationType": "Rain",
  "IsDayTime": false,
  "Temperature": {
    "Metric": {
      "Value": 25,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": 77,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "RealFeelTemperature": {
    "Metric": {
      "Value": 27.8,
      "Unit": "C",
      "UnitType": 17,
      "Phrase": "Very Warm",
    },
    "Imperial": {
      "Value": 82,
      "Unit": "F",
      "UnitType": 18,
      "Phrase": "Very Warm",
    },
  },
  "RealFeelTemperatureShade": {
    "Metric": {
      "Value": 27.8,
      "Unit": "C",
      "UnitType": 17,
      "Phrase": "Very Warm",
    },
    "Imperial": {
      "Value": 82,
      "Unit": "F",
      "UnitType": 18,
      "Phrase": "Very Warm",
    },
  },
  "RelativeHumidity": 94,
  "IndoorRelativeHumidity": 94,
  "DewPoint": {
    "Metric": {
      "Value": 23.9,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": 75,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "Wind": {
    "Direction": {
      "Degrees": 203,
      "Localized": "SSW",
      "English": "SSW",
    },
    "Speed": {
      "Metric": {
        "Value": 13,
        "Unit": "km/h",
        "UnitType": 7,
      },
      "Imperial": {
        "Value": 8.1,
        "Unit": "mi/h",
        "UnitType": 9,
      },
    },
  },
  "WindGust": {
    "Speed": {
      "Metric": {
        "Value": 13,
        "Unit": "km/h",
        "UnitType": 7,
      },
      "Imperial": {
        "Value": 8.1,
        "Unit": "mi/h",
        "UnitType": 9,
      },
    },
  },
  "UVIndex": 0,
  "UVIndexText": "Low",
  "Visibility": {
    "Metric": {
      "Value": 4.8,
      "Unit": "km",
      "UnitType": 6,
    },
    "Imperial": {
      "Value": 3,
      "Unit": "mi",
      "UnitType": 2,
    },
  },
  "ObstructionsToVisibility": "R-",
  "CloudCover": 100,
  "Ceiling": {
    "Metric": {
      "Value": 213,
      "Unit": "m",
      "UnitType": 5,
    },
    "Imperial": {
      "Value": 700,
      "Unit": "ft",
      "UnitType": 0,
    },
  },
  "Pressure": {
    "Metric": {
      "Value": 1011,
      "Unit": "mb",
      "UnitType": 14,
    },
    "Imperial": {
      "Value": 29.85,
      "Unit": "inHg",
      "UnitType": 12,
    },
  },
  "PressureTendency": {
    "LocalizedText": "Steady",
    "Code": "S",
  },
  "Past24HourTemperatureDeparture": {
    "Metric": {
      "Value": -2.2,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": -4,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "ApparentTemperature": {
    "Metric": {
      "Value": 27.8,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": 82,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "WindChillTemperature": {
    "Metric": {
      "Value": 25,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": 77,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "WetBulbTemperature": {
    "Metric": {
      "Value": 24.3,
      "Unit": "C",
      "UnitType": 17,
    },
    "Imperial": {
      "Value": 76,
      "Unit": "F",
      "UnitType": 18,
    },
  },
  "Precip1hr": {
    "Metric": {
      "Value": 0.5,
      "Unit": "mm",
      "UnitType": 3,
    },
    "Imperial": {
      "Value": 0.02,
      "Unit": "in",
      "UnitType": 1,
    },
  },
  "PrecipitationSummary": {
    "Precipitation": {
      "Metric": {
        "Value": 0.5,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.02,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "PastHour": {
      "Metric": {
        "Value": 0.5,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.02,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past3Hours": {
      "Metric": {
        "Value": 0.5,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.02,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past6Hours": {
      "Metric": {
        "Value": 0.5,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.02,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past9Hours": {
      "Metric": {
        "Value": 0.5,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.02,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past12Hours": {
      "Metric": {
        "Value": 4.1,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.16,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past18Hours": {
      "Metric": {
        "Value": 7,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.28,
        "Unit": "in",
        "UnitType": 1,
      },
    },
    "Past24Hours": {
      "Metric": {
        "Value": 7,
        "Unit": "mm",
        "UnitType": 3,
      },
      "Imperial": {
        "Value": 0.28,
        "Unit": "in",
        "UnitType": 1,
      },
    },
  },
  "TemperatureSummary": {
    "Past6HourRange": {
      "Minimum": {
        "Metric": {
          "Value": 25,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 77,
          "Unit": "F",
          "UnitType": 18,
        },
      },
      "Maximum": {
        "Metric": {
          "Value": 27.8,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 82,
          "Unit": "F",
          "UnitType": 18,
        },
      },
    },
    "Past12HourRange": {
      "Minimum": {
        "Metric": {
          "Value": 24.4,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 76,
          "Unit": "F",
          "UnitType": 18,
        },
      },
      "Maximum": {
        "Metric": {
          "Value": 27.8,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 82,
          "Unit": "F",
          "UnitType": 18,
        },
      },
    },
    "Past24HourRange": {
      "Minimum": {
        "Metric": {
          "Value": 23.5,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 74,
          "Unit": "F",
          "UnitType": 18,
        },
      },
      "Maximum": {
        "Metric": {
          "Value": 27.8,
          "Unit": "C",
          "UnitType": 17,
        },
        "Imperial": {
          "Value": 82,
          "Unit": "F",
          "UnitType": 18,
        },
      },
    },
  },
  "MobileLink": "http://www.accuweather.com/en/ng/shomolu/253773/current-weather/253773?lang=en-us",
  "Link": "http://www.accuweather.com/en/ng/shomolu/253773/current-weather/253773?lang=en-us",
};

renderCurrentConditions(DUMMY_DATA);