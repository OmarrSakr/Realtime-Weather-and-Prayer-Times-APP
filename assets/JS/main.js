"use strict";  // يُفضل استخدام الفاصلة المنقوطة للوضوح

//* HTML elements
let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    locationBtn = document.getElementById('locationBtn'),
    api_key = '738a4b7cc6cd40d9512fad8b13d51299';

let currentWeatherCard = document.querySelectorAll('.weather-left .card')[0];
let fiveDayForeCastCard = document.querySelector('.day-forecast');

let aqiCard = document.querySelectorAll('.highlights .card')[0];
let sunriseCard = document.querySelectorAll('.highlights .card')[1];

let humidityVal = document.getElementById('humidityVal');
let pressureVal = document.getElementById('pressureVal');
let visibilityVal = document.getElementById('visibilityVal');
let windSpreedVal = document.getElementById('windSpreedVal');
let feelsVal = document.getElementById('feelsVal');
let hourlyForecastContainer = document.querySelector('.hourly-forecast');




let aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
//* Function
function getWeatherDetails(name, lat, lon, country, state) {
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`,
        WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`,
        AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`,
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch current pollution
    fetch(AIR_POLLUTION_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch pollution data');
            }
            return res.json();
        })
        .then(data => {
            let { co, no, no2, o3, so2, pm2_5, pm10, nh3 } = data.list[0].components;
            aqiCard.innerHTML = `
                <div class="card-head">
                            <p>Air Quality Index</p>
                            <p class="air-index aqi-${data.list[0].main.aqi}">${aqiList[data.list[0].main.aqi - 1]}</p>
                            
                        </div>
                        <div class="air-indices">
                            <i class="fa-solid fa-wind"></i>
                            <!-- <img src="./assets/Imgs/wind64px.png" alt=""> -->
                            <div class="item">
                                <p>PM2.5</p>
                                <h2>${pm2_5}</h2>
                            </div>
                            <div class="item">
                                <p>PM10</p>
                                <h2>${pm10}</h2>
                            </div>
                            <div class="item">
                                <p>SO2</p>
                                <h2>${so2}</h2>
                            </div>
                            <div class="item">
                                <p>CO</p>
                                <h2>${co}</h2>
                            </div>
                            <div class="item">
                                <p>NO</p>
                                <h2>${no}</h2>
                            </div>
                            <div class="item">
                                <p>NO2</p>
                                <h2>${no2}</h2>
                            </div>
                            <div class="item">
                                <p>NH3</p>
                                <h2>${nh3}</h2>
                            </div>
                            <div class="item">
                                <p>O3</p>
                                <h2>${o3}</h2>
                            </div>
                        </div>
            
            `;
        })
        .catch(error => {
            console.error(`Error fetching pollution data: ${error.message}`);
            // alert('Please check your internet connection');
        });
    // Fetch current weather
    fetch(WEATHER_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return res.json();
        })
        .then(data => {
            let date = new Date();
            currentWeatherCard.innerHTML = `
                <div class="current-weather">
                    <div class="details">
                        <p>Now</p>
                        <h2>${(data.main.temp - 273.15).toFixed(2)}&deg;C</h2>
                        <p>${data.weather[0].description}</p>
                    </div>
                    <div class="weather-icon">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="">
                    </div>
                </div>
                <hr>
                <div class="card-footer">
                    <p><i class="fa-regular fa-calendar"></i> ${days[date.getDay()]}, ${date.getDate()}, ${months[date.getMonth()]}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${name}, ${country}</p>
                </div>`;
            // const weather = data.weather[0].main; // الحصول على حالة الطقس
            // function changeBackground(weather) {
            //     const card = document.querySelector(".weather-left .card:nth-of-type(1)");

            //     switch (weather) {
            //         case 'Clear':
            //             card.style.backgroundImage = "url('./assets/bgweather/sunny.jpg')";
            //             break;
            //         case 'Clouds':
            //             card.style.backgroundImage = "url('./assets/bgweather/cloudy.jpg')";
            //             break;
            //         case 'Rain':
            //             card.style.backgroundImage = "url('./assets/bgweather/rainy.jpg')";
            //             break;
            //         case 'Snow':
            //             card.style.backgroundImage = "url('./assets/bgweather/snowy.jpg')";
            //             break;
            //         case 'Thunderstorm':
            //             card.style.backgroundImage = "url('./assets/bgweather/thunderstorm.jpg')";
            //             break;
            //         default:
            //             card.style.backgroundImage = "url('./assets/bgweather/default.jpg')";
            //     }
            // }

            // changeBackground(weather);

            // Fetch current sunrise and sunset
            let { sunrise, sunset } = data.sys,
                { timezone, visibility } = data,
                { humidity, pressure, feels_like } = data.main,
                { spreed } = data.wind,
                sRiseTime = moment.unix(sunrise).utcOffset(timezone / 60).format('hh:mm A'),
                sSetTime = moment.unix(sunset).utcOffset(timezone / 60).format('hh:mm A');


            sunriseCard.innerHTML = `
            <div class="card-head">
                <p>Sunrise & Sunset</p>
            </div>
            <div class="sunrise-sunset">
                <div class="item">
                    <div class="icon">
                        <img src="./assets/Imgs/sunrise (1).png" alt="sunrise">
                    </div>
                    <div>
                        <p>Sunrise</p>
                        <h2>${sRiseTime}</h2>
                    </div>
                </div>
                <div class="item">
                    <div class="icon">
                                    <img src="./assets/Imgs/sunset (1).png" alt="sunset">
                    </div>
                    <div>
                        <p>Sunset</p>
                        <h2>${sSetTime}</h2>
                    </div>
                </div>
            </div>`;
            humidityVal.innerHTML = `${humidity}%`;
            pressureVal.innerHTML = `${pressure}hPa`;
            visibilityVal.innerHTML = `${visibility / 1000}Km`;
            let { speed } = data.wind;
            windSpreedVal.innerHTML = `${speed}m /s`;

            feelsVal.innerHTML = `${(feels_like - 273.15).toFixed(2)}&deg;C`;

            
        })
        .catch(error => {
            console.log('Please check your internet connection');
        });
    // Fetch forecast
    fetch(FORECAST_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => {
            let hourlyForecastCard = data.list;
            hourlyForecastContainer.innerHTML = '';
            for (let i = 0; i <= 7; i++) {
                let hrForecastDate = new Date(hourlyForecastCard[i].dt_txt);
                let hr = hrForecastDate.getHours();
                let a = hr < 12 ? 'AM' : 'PM';
                hr = hr % 12 || 12;

                hourlyForecastContainer.innerHTML += `
                    <div class="card">
                        <p>${hr}${a}</p>
                        <img src="https://openweathermap.org/img/wn/${hourlyForecastCard[i].weather[0].icon}@2x.png" alt="">
                        <p>${(hourlyForecastCard[i].main.temp - 273.15).toFixed(2)}&deg;C</p>
                    </div>
                `;
            }

            let uniqueForecastDays = [];
            let fiveDayForecast = data.list.filter(forecast => {
                let forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    uniqueForecastDays.push(forecastDate);
                    return true;
                }
                return false;
            });

            fiveDayForeCastCard.innerHTML = '';
            fiveDayForecast.forEach(forecast => {
                let date = new Date(forecast.dt_txt);
                fiveDayForeCastCard.innerHTML += `
                    <div class="forecast-item">
                        <div class="icon-wrapper">
                            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="">
                            <span>${(forecast.main.temp - 273.15).toFixed(2)}&deg;C</span>
                        </div>
                        <p>${date.getDate()}, ${months[date.getMonth()]}</p>
                        <p>${days[date.getDay()]}</p>
                    </div>`;
            });

        })
        .catch((error) => {
            console.error(`Failed to fetch weather forecast: ${error.message}`);
            // alert('Please check your internet connection.');
        });
}

//* Event Listener
searchBtn.addEventListener("click", getCityCoordinates);

//* Functions
function getCityCoordinates() {
    let cityName = cityInput.value.trim();
    cityInput.value = '';
    if (!cityName) return;

    let GEOCODING_API_URL_ = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

    fetch(GEOCODING_API_URL_)
        .then(res => {
            if (!res.ok) {
                throw new Error('Error fetching coordinates');
            }
            return res.json();
        })
        .then(data => {
            let { name, lat, lon, country, state } = data[0];
            getWeatherDetails(name, lat, lon, country, state);
        })
        .catch((error) => {
            console.error(`Error fetching coordinates: ${error.message}`);
        });
}


//* Function Location
function getUserCoordinates() {
    navigator.geolocation.getCurrentPosition(position => {
        let { latitude, longitude } = position.coords;
        let REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;
        fetch(REVERSE_GEOCODING_URL).then(res => {
            if (!res.ok) {
                throw new Error('Error fetching location');
            }
            return res.json();

        })
            .then(data => {
                let { name, country, state } = data[0];
                getWeatherDetails(name, latitude, longitude, country, state);
            }).catch(() => {
                console.error(`Error fetching User coordinates: ${error.message}`);
            });

    }, error => {
        if (error.code === error.PERMISSION_DENIED) {
            alert('Geolocation permission denied. Please reset location permission to grant access again');
        }
    }
    );
}
searchBtn.addEventListener("click", getCityCoordinates);
locationBtn.addEventListener("click", getUserCoordinates);
cityInput.addEventListener('keydown', e => e.code === "Enter" && getCityCoordinates());
window.addEventListener('load', getUserCoordinates());



//* pray time

let timingPrayer = document.querySelector('.timing-prayer');

getPrayTimes();
function getPrayTimes() {
    // استخدام Geolocation API للحصول على الموقع الحالي
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;

            // استدعاء API مواقيت الصلاة باستخدام الإحداثيات
            fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=8`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Error fetching data of Timing Prayer');
                    }
                    return res.json();
                })
                .then(data => {
                    console.log(data);
                    //*for Pray Timing
                    let times = data.data.timings;
                    //*for date (xx-xx-xx day)
                    let hijri = data.data.date.hijri;
                    let gregorian = data.data.date.gregorian;

                    timingPrayer.innerHTML = "";
                    let dayOfPray = document.querySelector(".dayOfPray");
                    dayOfPray.innerHTML = `
                        <div>
                            <strong>${hijri.weekday.ar}  ${gregorian.date}</strong>
                        </div>
                    `;

                    for (let time in times) {

                        let prayerTranslation = {
                            Fajr: "الفجر",
                            Sunrise: "الشروق",
                            Dhuhr: "الظهر",
                            Asr: "العصر",
                            Sunset: "غروب الشمس",
                            Maghrib: "المغرب",
                            Isha: "العشاء",
                            Imsak: "الإمساك",
                            Midnight: "قيام الليل",
                            Firstthird: "الثُّلث الأول",
                            Lastthird: "الثُّلث الأخير"
                        };
                        // دالة لتحويل الوقت من 24 ساعة إلى 12 ساعة مع AM/PM
                        function convertTo12Hour(timeStr) {
                            let [hour, minute] = timeStr.split(':').map(Number);
                            let period = hour >= 12 ? "PM" : "AM";
                            hour = hour % 12 || 12;
                            return `${hour}:${minute < 10 ? '0' + minute : minute} ${period}`;
                        }
                        // تعيين صورة لكل وقت صلاة
                        let imageSrc = `./assets/Imgs/${time}.png`; // تأكد من أن الأسماء تتطابق مع أسماء الصور الخاصة بك
                        timingPrayer.innerHTML += `
                            <div class="card">
                                <p>${time} - ${prayerTranslation[time] || "غير معروف"}</p>
                                <img src="${imageSrc}" alt="" style="">
                                <p class="PrayTime">${convertTo12Hour(times[time])}</p>
                            </div>
                        `;
                    }
                })
                .catch(error => console.error('Error:', error));
        },
        error => {
            console.error('Error getting location:', error);
        }
    );
}

