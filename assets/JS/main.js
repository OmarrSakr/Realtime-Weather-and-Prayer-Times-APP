"use strict";

// HTML elements
let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    locationBtn = document.getElementById('locationBtn'),
    api_key = '738a4b7cc6cd40d9512fad8b13d51299';

let currentWeatherCard = document.getElementById('current-weather-card');
let fiveDayForeCastCard = document.querySelector('.day-forecast');
let aqiCard = document.querySelectorAll('.highlights .card')[0];
let sunriseCard = document.querySelectorAll('.highlights .card')[1];
let humidityVal = document.getElementById('humidityVal');
let pressureVal = document.getElementById('pressureVal');
let visibilityVal = document.getElementById('visibilityVal');
let windSpeedVal = document.getElementById('windSpeedVal');
let feelsVal = document.getElementById('feelsVal');
let hourlyForecastContainer = document.querySelector('.hourly-forecast');

let aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

// متغيرات الصلاة والبوصلة
let nextPrayerInterval;
let currentPrayerTimes = {};
let currentLocation = {};
let qiblaDirection = 0;
let hasPlayedNotification = false; // لتتبع تشغيل صوت التنبيه

// دالة لتشغيل صوت التنبيه
function playPrayerNotification() {
    const audio = new Audio('https://www.islamicfinder.org/media/sounds/adhan/adhan-fajr.mp3');
    audio.play().catch(error => {
        console.error('Error playing prayer notification:', error);
    });
}

// دالة لتحديد طريقة الحساب حسب الدولة
function getCalculationMethod(country) {
    const methods = {
        'EG': 5, 'SA': 4, 'AE': 4, 'KW': 4, 'QA': 4, 'BH': 4, 'OM': 4,
        'JO': 4, 'LB': 4, 'SY': 4, 'IQ': 4, 'YE': 4, 'TR': 1, 'PK': 1,
        'IN': 1, 'BD': 1, 'MY': 3, 'ID': 2, 'MA': 2, 'TN': 2, 'DZ': 2,
        'LY': 2, 'SD': 2, 'IR': 7, 'AF': 1
    };
    return methods[country] || 2;
}

// عرض Loading State لمواعيد الصلاة
function showPrayerLoading() {
    let timingPrayer = document.querySelector('.timing-prayer');
    if (timingPrayer) {
        timingPrayer.innerHTML = Array(6).fill().map(() => `
            <div class="prayer-skeleton">
                <div class="skeleton-content">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-circle"></div>
                    <div class="skeleton-line skeleton-time"></div>
                </div>
            </div>
        `).join('');
    }
}

// العثور على الصلاة القادمة
function getNextPrayer(times) {
    const now = new Date();
    const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (let prayerName of prayerOrder) {
        if (times[prayerName]) {
            const [hours, minutes] = times[prayerName].split(':').map(Number);
            const prayerTime = new Date();
            prayerTime.setHours(hours, minutes, 0, 0);

            if (prayerTime > now) {
                return {
                    name: prayerName,
                    time: times[prayerName],
                    remaining: prayerTime - now
                };
            }
        }
    }

    // فجر الغد
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = times.Fajr.split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);

    return {
        name: 'Fajr',
        time: times.Fajr,
        remaining: tomorrow - now,
        isTomorrow: true
    };
}

// إضافة العداد التنازلي للصلاة القادمة
function createPrayerCountdown() {
    const prayerContainer = document.querySelector('.prayer-container');
    if (prayerContainer && !document.getElementById('prayer-countdown')) {
        const countdownDiv = document.createElement('div');
        countdownDiv.id = 'prayer-countdown';
        countdownDiv.className = 'prayer-countdown';
        countdownDiv.style.display = 'none';
        prayerContainer.insertAdjacentElement('afterend', countdownDiv);
    }
}
const prayerNames = {
    Fajr: "الفجر",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
};

// تحديث العداد التنازلي
function updatePrayerCountdown() {
    if (!currentPrayerTimes || Object.keys(currentPrayerTimes).length === 0) return;

    const nextPrayer = getNextPrayer(currentPrayerTimes);
    const countdownElement = document.getElementById('prayer-countdown');

    if (nextPrayer && countdownElement) {
        const hours = Math.floor(nextPrayer.remaining / (1000 * 60 * 60));
        const minutes = Math.floor((nextPrayer.remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((nextPrayer.remaining % (1000 * 60)) / 1000);

        const dayText = nextPrayer.isTomorrow ? ' (Tomorrow)' : '';

        countdownElement.innerHTML = `
                <div class="next-prayer-info">
            <div class="next-prayer-name">
                الصلاة القادمة: ${prayerNames[nextPrayer.name]} ${dayText}
            </div>
            <div class="countdown-timer">
                ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
            </div>
            <div class="next-prayer-time">
                عند الساعة ${convertTo12Hour(nextPrayer.time)}
            </div>
        </div>
        `;

        countdownElement.style.display = 'block';

        // تشغيل صوت التنبيه إذا كان الوقت المتبقي أقل من 5 دقايق
        if (nextPrayer.remaining <= 300000 && !hasPlayedNotification) { // 300,000 مللي ثانية = 5 دقايق
            playPrayerNotification();
            hasPlayedNotification = true; // منع تكرار الصوت
        } else if (nextPrayer.remaining > 300000) {
            hasPlayedNotification = false; // إعادة تعيين المتغير للصلاة التالية
        }
    }
}

// تحويل الوقت لصيغة 12 ساعة
function convertTo12Hour(timeStr) {
    let [hour, minute] = timeStr.split(':').map(Number);
    let period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute < 10 ? '0' + minute : minute} ${period}`;
}

// حفظ واسترجاع بيانات المدينة
function saveSelectedCity(cityData) {
    try {
        window.savedCityData = cityData;
        console.log('City data saved locally');
    } catch (error) {
        console.log('Cannot save city data');
    }
}

function getSavedCity() {
    try {
        return window.savedCityData || null;
    } catch (error) {
        return null;
    }
}

// معالجة الأخطاء
function handleError(error, context, retryFunction = null) {
    console.error(`Error in ${context}:`, error);

    const errorMessages = {
        network: 'Network connection issue',
        location: 'Location not found',
        permission: 'Location access denied',
        api: 'Service unavailable, please try again later',
        prayer: 'Unable to fetch prayer times'
    };

    let message = errorMessages[context] || 'An unexpected error occurred';

    if (retryFunction) {
        message += ` <button onclick="(${retryFunction.toString()})()" class="retry-btn">Retry</button>`;
    }

    return message;
}
// إضافة بوصلة القبلة
function createQiblaCompass() {
    const weatherRight = document.querySelector('.weather-right');
    if (weatherRight && !document.getElementById('qibla-section')) {
        const qiblaSection = document.createElement('div');
        qiblaSection.id = 'qibla-section';
        qiblaSection.className = 'qibla-section';
        qiblaSection.innerHTML = `
            <h2><i class="fas fa-compass"></i> Qibla Direction - اتجاه القبلة</h2>
            <div class="qibla-compass" id="qiblaCompass">
                <div class="compass-directions north">N</div>
                <div class="compass-directions east">E</div>
                <div class="compass-directions south">S</div>
                <div class="compass-directions west">W</div>
                
                <div class="compass-needle" id="compassNeedle"></div>
                <div class="compass-center"></div>
                <div class="qibla-arrow" id="qiblaArrow" style="background: green;"></div>
            </div>
            <div class="qibla-info">
                <div class="qibla-degree" id="qiblaDegree">--°</div>
                <p id="qiblaText">Direction of Qibla (اتجاه القبلة من موقعك)</p>
                <p id="facingStatus"></p>
            </div>
        `;
        weatherRight.appendChild(qiblaSection);
    }
}

// الحصول على اتجاه القبلة
function getQiblaDirection(lat, lon) {
    fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lon}`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) {
                const qiblaDirection = data.data.direction;
                const qiblaArrow = document.getElementById('qiblaArrow');
                const qiblaDegree = document.getElementById('qiblaDegree');
                const qiblaText = document.getElementById('qiblaText');

                if (qiblaArrow && qiblaDegree && qiblaText) {
                    qiblaArrow.style.transform = `translate(-50%, -100%) rotate(${qiblaDirection}deg)`;
                    qiblaDegree.textContent = `${Math.round(qiblaDirection)}°`;
                    qiblaText.textContent = `Qibla Direction: ${Math.round(qiblaDirection)}° (جنوب شرق)`;
                }

                // استشعار اتجاه الجهاز
                if (window.DeviceOrientationEvent) {
                    window.addEventListener("deviceorientation", function (event) {
                        let compassHeading = event.alpha; // اتجاه الجهاز
                        let difference = Math.abs(compassHeading - qiblaDirection);

                        const facingStatus = document.getElementById('facingStatus');
                        if (facingStatus) {
                            if (difference < 10) {
                                facingStatus.textContent = "✅ You are facing Qibla (انت متوجه للقبلة)";
                                facingStatus.style.color = "green";
                            } else {
                                facingStatus.textContent = "❌ Not facing Qibla (انت مش في اتجاه القبلة)";
                                facingStatus.style.color = "red";
                            }
                        }
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error fetching Qibla direction:', error);
            const qiblaDegree = document.getElementById('qiblaDegree');
            if (qiblaDegree) {
                qiblaDegree.textContent = 'Unavailable';
            }
        });
}

// تشغيل البوصلة عند تحميل الصفحة
createQiblaCompass();
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            getQiblaDirection(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
            console.error("Error getting location:", error);
            const qiblaDegree = document.getElementById('qiblaDegree');
            if (qiblaDegree) {
                qiblaDegree.textContent = 'Location blocked';
            }
        }
    );
}

// تحديث اتجاه البوصلة بناءً على حركة الجهاز
function startCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            const alpha = event.alpha;
            const compassNeedle = document.getElementById('compassNeedle');
            if (compassNeedle && alpha !== null) {
                compassNeedle.style.transform = `translate(-50%, -100%) rotate(${360 - alpha}deg)`;
            }
        });
    } else {
        console.log('DeviceOrientation not supported');
    }
}

// طلب إذن للوصول إلى البوصلة
function requestCompassPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    startCompass();
                } else {
                    console.log('Permission denied for compass');
                }
            })
            .catch(console.error);
    } else {
        startCompass();
    }
}

// جلب مواعيد الصلاة
function getPrayTimesForLocation(lat, lon, country = '') {
    let timingPrayer = document.querySelector('.timing-prayer');
    showPrayerLoading();
    createPrayerCountdown();
    createQiblaCompass();
    requestCompassPermission();

    let method = getCalculationMethod(country);

    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}`)
        .then(res => {
            if (!res.ok) throw new Error('Error fetching prayer times');
            return res.json();
        })
        .then(data => {
            let times = data.data.timings;
            currentPrayerTimes = times;
            let hijri = data.data.date.hijri;
            let gregorian = data.data.date.gregorian;

            timingPrayer.innerHTML = "";

            let dayOfPray = document.querySelector(".dayOfPray strong");
            if (dayOfPray) {
                dayOfPray.innerHTML = `${hijri.weekday.ar} ${gregorian.date}`;
            }

            let mainPrayers = [
                { key: 'Fajr', name: 'Fajr - الفجر', icon: 'Fajr' },
                { key: 'Sunrise', name: 'Sunrise - الشروق', icon: 'Sunrise' },
                { key: 'Dhuhr', name: 'Dhuhr - الظهر', icon: 'sun3Pm' },
                { key: 'Asr', name: 'Asr - العصر', icon: 'Asr' },
                { key: 'Maghrib', name: 'Maghrib - المغرب', icon: 'sunset' },
                { key: 'Isha', name: 'Isha - العشاء', icon: 'Isha' }
            ];

            mainPrayers.forEach(prayer => {
                if (times[prayer.key]) {
                    let imageSrc = `./assets/Imgs/${prayer.icon}.png`;
                    timingPrayer.innerHTML += `
                        <div class="card prayer-card">
                            <p class="prayer-name">${prayer.name}</p>
                            <img src="${imageSrc}" alt="${prayer.name}" class="prayer-icon">
                            <p class="PrayTime prayer-time">${convertTo12Hour(times[prayer.key])}</p>
                        </div>
                    `;
                }
            });

            if (nextPrayerInterval) clearInterval(nextPrayerInterval);
            updatePrayerCountdown();
            nextPrayerInterval = setInterval(updatePrayerCountdown, 1000);

            getQiblaDirection(lat, lon);
        })
        .catch(error => {
            console.error('Error fetching prayer times:', error);
            timingPrayer.innerHTML = `
                <div class="error-message">
                    <p>${handleError(error, 'prayer', () => getPrayTimesForLocation(lat, lon, country))}</p>
                </div>
            `;
        });
}

// دالة الطقس الرئيسية
function getWeatherDetails(name, lat, lon, country, state) {
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}`,
        WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`,
        AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`,
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    currentLocation = { name, lat, lon, country, state };
    saveSelectedCity(currentLocation);

    getPrayTimesForLocation(lat, lon, country);

    fetch(AIR_POLLUTION_API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch pollution data');
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
            aqiCard.innerHTML = `<div class="error-message"><p>${handleError(error, 'api')}</p></div>`;
        });

    fetch(WEATHER_API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch weather data');
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

            document.title = `${Math.round(data.main.temp - 273.15)}°C - ${name} | Weather & Prayer Times`;

            let { sunrise, sunset } = data.sys,
                { timezone, visibility } = data,
                { humidity, pressure, feels_like } = data.main,
                { speed } = data.wind,
                sRiseTime = moment.unix(sunrise).utcOffset(timezone / 60).format('hh:mm A'),
                sSetTime = moment.unix(sunset).utcOffset(timezone / 60).format('hh:mm A');

            sunriseCard.innerHTML = `
                <div class="card-head">
                    <p>Sunrise & Sunset</p>
                </div>
                <div class="sunrise-sunset">
                    <div class="item">
                        <div class="icon">
                            <img src="./assets/Imgs/sunrise (1).png" alt="Sunrise">
                        </div>
                        <div>
                            <p>Sunrise</p>
                            <h2>${sRiseTime}</h2>
                        </div>
                    </div>
                    <div class="item">
                        <div class="icon">
                            <img src="./assets/Imgs/sunset_1.png" alt="Sunset">
                        </div>
                        <div>
                            <p>Sunset</p>
                            <h2>${sSetTime}</h2>
                        </div>
                    </div>
                </div>`;

            humidityVal.innerHTML = `${humidity}%`;
            pressureVal.innerHTML = `${pressure}hPa`;
            visibilityVal.innerHTML = `${(visibility / 1000).toFixed(1)}km`;
            windSpeedVal.innerHTML = `${speed.toFixed(1)}m/s`;
            feelsVal.innerHTML = `${(feels_like - 273.15).toFixed(2)}&deg;C`;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            if (!currentWeatherCard.innerHTML.includes('current-weather')) {
                currentWeatherCard.innerHTML = `<div class="error-message"><p>${handleError(error, 'network')}</p></div>`;
            }
        });

    fetch(FORECAST_API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
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
            if (!fiveDayForeCastCard.innerHTML.includes('forecast-item')) {
                fiveDayForeCastCard.innerHTML = `<div class="error-message"><p>${handleError(error, 'network')}</p></div>`;
            }
        });
}

// البحث عن المدينة
function getCityCoordinates() {
    let cityName = cityInput.value.trim();
    cityInput.value = '';
    if (!cityName) return;

    searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
    searchBtn.disabled = true;

    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

    fetch(GEOCODING_API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Error fetching coordinates');
            return res.json();
        })
        .then(data => {
            if (data.length === 0) {
                alert('City not found. Please try again');
                return;
            }
            let { name, lat, lon, country, state } = data[0];
            getWeatherDetails(name, lat, lon, country, state);
        })
        .catch((error) => {
            console.error(`Error fetching coordinates: ${error.message}`);
            alert(handleError(error, 'location'));
        })
        .finally(() => {
            searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Search';
            searchBtn.disabled = false;
        });
}

// الحصول على الموقع الحالي
function getUserCoordinatesWithPrayers() {
    locationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting Location...';
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(position => {
        let { latitude, longitude } = position.coords;

        let REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${api_key}`;

        fetch(REVERSE_GEOCODING_URL)
            .then(res => {
                if (!res.ok) throw new Error('Error fetching location');
                return res.json();
            })
            .then(data => {
                let { name, country, state } = data[0];
                getWeatherDetails(name, latitude, longitude, country, state);
            })
            .catch(error => {
                console.error(`Error fetching user coordinates: ${error.message}`);
                getPrayTimesForLocation(latitude, longitude);
            })
            .finally(() => {
                locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Current Location';
                locationBtn.disabled = false;
            });
    }, error => {
        locationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Current Location';
        locationBtn.disabled = false;

        if (error.code === error.PERMISSION_DENIED) {
            alert(handleError(error, 'permission'));
        }

        const savedCity = getSavedCity();
        if (savedCity) {
            getWeatherDetails(savedCity.name, savedCity.lat, savedCity.lon, savedCity.country, savedCity.state);
        }
    });
}

// Event listeners
searchBtn.addEventListener("click", getCityCoordinates);
locationBtn.addEventListener("click", getUserCoordinatesWithPrayers);
cityInput.addEventListener('keydown', e => {
    if (e.code === "Enter") {
        getCityCoordinates();
    }
});

// تهيئة التطبيق
window.addEventListener('load', () => {
    const savedCity = getSavedCity();
    if (savedCity) {
        console.log('Loading saved city:', savedCity.name);
        getWeatherDetails(savedCity.name, savedCity.lat, savedCity.lon, savedCity.country, savedCity.state);
    } else {
        getUserCoordinatesWithPrayers();
    }
});

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (nextPrayerInterval) {
        clearInterval(nextPrayerInterval);
    }
});