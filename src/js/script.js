"use strict";

const API_URL = "http://dataservice.accuweather.com";
const API_KEY = "mj1ocFZbLnAaffWkZGgRjS10NCwGSisC";

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

async function getForecastDetails(key) {
  try {
    const request = await fetch(`${API_URL}/forecasts/v1/daily/5day/${key}?apikey=${API_KEY}&metric=true`);
    if (!request.ok)
      throw new Error("cannot retrieve weather forecast at the moment. Try another time");

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
    const [data, forecastData] = await Promise.all([getWeatherDetails(key), getForecastDetails(key)]);
    clearSpinners(sidebarHTML, contentHTML);
    renderCurrentConditions(data[0], sidebarHTML, contentHTML);
    renderForecast(forecastData);
    addHandlers();
  } catch (e) {
    console.log(e);
  }
}

function getDateText(today = new Date()) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weekDays = ["Sun", "Tue", "Wed", "Thur", "Fri", "Sat"];
  return `${weekDays[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;
}

function init() {
  getCurrentPositionWeather();
}

//EVENT LISTENERS
function addHandlers() {
  document.querySelector(".sidebar-top__search").addEventListener("click", () => {
    console.log("shit");
    document.querySelector(".searchbar").classList.remove("hidden");
  });
  document.querySelector(".searchbar-close").addEventListener("click", () => document.querySelector(".searchbar").classList.add("hidden"));
  document.querySelector(".sidebar-top__current-location").addEventListener("click", () => getCurrentPositionWeather());
}

function revealSection(entries, observer) {
  const [entry] = entries;

  if (entry.isIntersecting)
    entry.target.classList.remove("day-highlights__section--hidden");
}

const sectionObserver = new IntersectionObserver(revealSection, {
  root: null,
  threshold: 0.15,
});


//RENDER FUNCTION
function renderForecast(data) {
  const filteredData = data.DailyForecasts.map((value, index) => {
    return {
      date: index === 0 ? "Tomorrow" : getDateText(new Date(value.Date)),
      text: value.Day.IconPhrase,
      min: value.Temperature.Minimum.Value,
      max: value.Temperature.Maximum.Value,
    };
  });

  const allDays = document.querySelectorAll(".future-temperatures__day");
  allDays.forEach((value, key, parent) => {
    value.querySelector(".future-temperatures__date").textContent = filteredData[key].date;
    value.querySelector(".future-temperatures__illustration").style.backgroundImage = `url(../../${getImageURL(filteredData[key].text)})`;
    value.querySelector(".future-temperatures__temperatures--low").textContent = Math.round(filteredData[key].min) + "°C";
    value.querySelector(".future-temperatures__temperatures--high").textContent = Math.round(filteredData[key].max) + "°C";
  });

  smoothEntry(allDays, "hidden");
}

function renderWindStatus(speed, degree, direction) {
  const section = document.querySelector(".day-highlights__wind");
  slowlyIncrement(section.querySelector(".day-highlights--value"), 1, speed, 1.5, 1);
  section.querySelector(".day-highlights__wind--direction").lastChild.nodeValue = direction;
  section.querySelector(".day-highlights__wind--direction span").style.transform = `rotate(${degree - 45}deg)`;
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

function clearSpinners(sidebarHTML = "", contentHTML = "") {
  if (sidebarHTML)
    removeSpinner(sidebar, sidebarHTML);
  if (contentHTML)
    removeSpinner(content, contentHTML);
}

function renderCurrentConditions(data) {
  document.querySelector(".weather-illustration img").setAttribute("src", getImageURL(data.WeatherText));
  document.querySelector(".current-temperature p").textContent = Math.round(+data.Temperature.Metric.Value) + "";
  document.querySelector(".current-weather").textContent = data["WeatherText"];
  document.querySelector(".date-text").textContent = getDateText();
  document.querySelector(".current-location p").textContent = displayedLocation;
  renderWindStatus(data.Wind.Speed.Imperial.Value, data.Wind.Direction.Degrees, data.Wind.Direction.English);
  renderHumidity(data.RelativeHumidity);
  renderVisibility(data.Visibility.Imperial.Value);
  renderAirPressure(data.Pressure.Metric.Value);
  const allSections = document.querySelectorAll(".day-highlights__section");
  if (window.innerWidth < 600)
    allSections.forEach(section => sectionObserver.observe(section));
  else
    smoothEntry(allSections, "day-highlights__section--hidden");
}

function smoothEntry(sections, hiddenClass) {
  let counter = 0;
  const interval = setInterval(() => {
    if (counter >= sections.length)
      clearInterval(interval);

    sections[counter].classList.remove(hiddenClass);
    console.log(sections[counter]);

    counter++;
  }, 200);
}

function getImageURL(text) {
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
    img = "Shower";

  return baseSrc + img + png;
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
init();