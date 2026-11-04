/** @typedef {'none' | 'rain' | 'snow' | 'sleet'} PrecipitationMode */

const WEATHERAPI_SNOW_CODES = new Set([
  1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258,
]);

const WEATHERAPI_RAIN_CODES = new Set([
  1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243,
  1246,
]);

const WEATHERAPI_SLEET_CODES = new Set([
  1069, 1072, 1198, 1201, 1204, 1207, 1249, 1252,
]);

/**
 * @param {number} code
 * @returns {{ snow: boolean, rain: boolean }}
 */
function flagsFromWeatherApiCode(code) {
  if (WEATHERAPI_SLEET_CODES.has(code)) {
    return { snow: true, rain: true };
  }
  return {
    snow: WEATHERAPI_SNOW_CODES.has(code),
    rain: WEATHERAPI_RAIN_CODES.has(code),
  };
}

/**
 * @param {{ snow: boolean, rain: boolean }} flags
 * @returns {PrecipitationMode}
 */
export function classifyPrecipitation(flags) {
  const { snow, rain } = flags;
  if (snow && rain) {
    return 'sleet';
  }
  if (snow) {
    return 'snow';
  }
  if (rain) {
    return 'rain';
  }
  return 'none';
}

/**
 * @param {object} config
 * @param {string} config.provider
 * @param {string} config.apiKey
 * @param {string} [config.city]
 * @param {number} [config.lat]
 * @param {number} [config.lon]
 * @param {'now' | 'today'} [config.scope]
 * @returns {Promise<PrecipitationMode>}
 */
export async function fetchPrecipitationMode(config) {
  const { provider, apiKey, city, lat, lon, scope = 'now' } = config;

  if (!apiKey) {
    throw new Error('weather.apiKey is required when weather.enabled is true');
  }

  if (provider === 'openweathermap') {
    return fetchOpenWeatherMap({ apiKey, city, lat, lon, scope });
  }

  if (provider === 'weatherapi') {
    return fetchWeatherApi({ apiKey, city, lat, lon, scope });
  }

  throw new Error(`Unknown weather provider: ${provider}`);
}

async function fetchWeatherApi({ apiKey, city, lat, lon, scope }) {
  const q = city ?? (lat != null && lon != null ? `${lat},${lon}` : null);
  if (!q) {
    throw new Error('weather.city or weather.lat/lon is required');
  }

  const url = new URL('https://api.weatherapi.com/v1/forecast.json');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', q);
  url.searchParams.set('days', '1');
  url.searchParams.set('aqi', 'no');
  url.searchParams.set('alerts', 'no');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WeatherAPI error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  let flags = flagsFromWeatherApiCode(current.condition.code);

  if (scope === 'today') {
    const hours = data.forecast?.forecastday?.[0]?.hour ?? [];
    for (const hour of hours) {
      const hourFlags = flagsFromWeatherApiCode(hour.condition.code);
      flags = {
        snow: flags.snow || hourFlags.snow,
        rain: flags.rain || hourFlags.rain,
      };
    }
  } else if (current.precip_mm > 0) {
    if (!flags.snow && !flags.rain) {
      flags.rain = true;
    }
  } else if (!flags.snow && !flags.rain) {
    return 'none';
  }

  return classifyPrecipitation(flags);
}

async function fetchOpenWeatherMap({ apiKey, city, lat, lon, scope }) {
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('appid', apiKey);
  url.searchParams.set('units', 'metric');
  if (city) {
    url.searchParams.set('q', city);
  } else if (lat != null && lon != null) {
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
  } else {
    throw new Error('weather.city or weather.lat/lon is required');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeatherMap error: ${response.status}`);
  }

  const data = await response.json();
  let flags = flagsFromOpenWeather(data);

  if (scope === 'today') {
    const forecastUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
    forecastUrl.searchParams.set('appid', apiKey);
    forecastUrl.searchParams.set('units', 'metric');
    if (city) {
      forecastUrl.searchParams.set('q', city);
    } else {
      forecastUrl.searchParams.set('lat', String(lat));
      forecastUrl.searchParams.set('lon', String(lon));
    }

    const forecastResponse = await fetch(forecastUrl);
    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();
      for (const item of forecastData.list ?? []) {
        const itemFlags = flagsFromOpenWeather(item);
        flags = {
          snow: flags.snow || itemFlags.snow,
          rain: flags.rain || itemFlags.rain,
        };
      }
    }
  }

  return classifyPrecipitation(flags);
}

function flagsFromOpenWeather(data) {
  const weatherList = data.weather ?? [];
  let snow = false;
  let rain = false;

  for (const item of weatherList) {
    const main = (item.main ?? '').toLowerCase();
    const id = item.id ?? 0;
    if (main === 'snow' || (id >= 600 && id < 622)) {
      snow = true;
    }
    if (
      main === 'rain' ||
      main === 'drizzle' ||
      main === 'thunderstorm' ||
      (id >= 200 && id < 600)
    ) {
      rain = true;
    }
  }

  if (data.snow && (data.snow['1h'] > 0 || data.snow['3h'] > 0)) {
    snow = true;
  }
  if (data.rain && (data.rain['1h'] > 0 || data.rain['3h'] > 0)) {
    rain = true;
  }

  return { snow, rain };
}
