const express = require ('express');
const { InfluxDB } = require('influx');
const app = express();

const influxConfig = {
    host: '192.168.160.55',
    port: 8086,
    database: 'carbonoz',
    username: 'admin',
    password: 'adminadmin',
};

const influx = new InfluxDB({
    host: influxConfig.host,
    port: influxConfig.port,
    database: influxConfig.database,
    username: influxConfig.username,
    password: influxConfig.password,
});

app.set('view engine', 'ejs');

async function queryInfluxDB(topic) {
    const query = `
      SELECT mean("value") AS "value"
      FROM "state"
      WHERE "topic" = '${topic}'
      AND time >= now() - 30d
      GROUP BY time(1d) tz('Indian/Mauritius')
    `;

    try {
        const result = await influx.query(query);
        return result;
    } catch (error) {
        console.error(`Error querying InfluxDB for topic ${topic}:`, error.toString());
        throw error;
    }
}

// Assuming your Express setup and data fetching logic

app.get('/analytics', async (req, res) => {
    try {
        const loadPowerData = (await queryInfluxDB('solar_assistant_DEYE/total/load_energy/state')).reverse();
        const pvPowerData = (await queryInfluxDB('solar_assistant_DEYE/total/pv_energy/state')).reverse();
        const batteryStateOfChargeData = (await queryInfluxDB('solar_assistant_DEYE/total/battery_energy_in/state')).reverse();
        const batteryPowerData = (await queryInfluxDB('solar_assistant_DEYE/total/battery_energy_out/state')).reverse();
        const gridPowerData = (await queryInfluxDB('solar_assistant_DEYE/total/grid_energy_in/state')).reverse();
        const gridVoltageData = (await queryInfluxDB('solar_assistant_DEYE/total/grid_energy_out/state')).reverse();

        const data = {
            loadPowerData,
            pvPowerData,
            batteryStateOfChargeData,
            batteryPowerData,
            gridPowerData,
            gridVoltageData,
        };

        res.render('analytics', { data });
    } catch (error) {
        console.error('Error fetching analytics data from InfluxDB:', error);
        res.status(500).send('Error fetching analytics data from InfluxDB');
    }
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
