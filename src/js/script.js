"use strict";

const API_URL = "http://dataservice.accuweather.com";
const API_KEY = "mj1ocFZbLnAaffWkZGgRjS10NCwGSisC";

const searchButton = document.querySelector(".sidebar-top__search");
const searchPanel = document.querySelector(".searchbar");
const closeSearchBarBtn = document.querySelector(".searchbar-close");
const currentLocationBtn = document.querySelector(".sidebar-top__current-location");
const sidebar = document.querySelector(".sidebar");

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
    const html = renderSpinner(sidebar);
    const key = await getLocationKey();
    const data = await getWeatherDetails(key);
    renderCurrentConditions(data[0], html);
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
function renderCurrentConditions(data, html) {
  removeSpinner(sidebar, html);
  document.querySelector(".current-weather").textContent = data.WeatherText;
  document.querySelector(".date-text").textContent = getDateText();
  document.querySelector(".current-temperature p").textContent = Math.round(+data.Temperature.Metric.Value);
  document.querySelector(".current-location p").textContent = displayedLocation;
}

function renderSpinner(element) {
  const spinnerHTML = `
    <div class="spinner"></div>
  `;
  const previousHTML = element.innerHTML;
  element.innerHTML = spinnerHTML;
  return previousHTML;
}

function removeSpinner(element, html) {
  element.innerHTML = html;
}

//START
init();