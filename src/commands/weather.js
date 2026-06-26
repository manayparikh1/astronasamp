const { getJSON } = require("../lib/http");
const { header, section, fields, context } = require("../lib/blocks");
const { describe } = require("../lib/weatherCodes");

module.exports = {
  name: "weather",
  aliases: ["w"],
  category: "Utilities",
  summary: "Current conditions for any city",
  usage: "/astronasamp weather <city>",
  run: async ({ args, respond }) => {
    const place = args.join(" ").trim();
    if (!place) {
      await respond({ blocks: [section(":round_pushpin: Usage: `/astronasamp weather <city>` — e.g. `weather Tokyo`")] });
      return;
    }

    // 1) Geocode the city name → coordinates.
    const geo = await getJSON("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: place, count: 1 }
    });
    if (!geo.results || geo.results.length === 0) {
      await respond({ blocks: [section(`:mag: I couldn't find a place called *${place}*. Check the spelling?`)] });
      return;
    }
    const loc = geo.results[0];

    // 2) Fetch current conditions.
    const data = await getJSON("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        timezone: "auto"
      }
    });
    const c = data.current;
    const sky = describe(c.weather_code);
    const where = [loc.name, loc.admin1, loc.country].filter(Boolean).join(", ");

    await respond({
      blocks: [
        header(`${sky.emoji}  Weather — ${loc.name}`),
        section(`*${sky.label}* in ${where}`),
        fields([
          `:thermometer: *Temperature*\n${c.temperature_2m}°C`,
          `:dash: *Feels like*\n${c.apparent_temperature}°C`,
          `:sweat_drops: *Humidity*\n${c.relative_humidity_2m}%`,
          `:wind_blowing_face: *Wind*\n${c.wind_speed_10m} km/h`
        ]),
        context(`Data: open-meteo.com • local time ${data.timezone}`)
      ]
    });
  }
};
