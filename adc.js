const mcpadc = require('mcp-spi-adc');

// pin 25 is /chip select

const tempSensor = mcpadc.open(0, {speedHz: 20000}, (err) => {
    if (err) throw err;

    setInterval(() => {
	tempSensor.read((err, reading) => {
	    if (err) throw err;

	    console.log( reading.value );
	    // console.log((reading.value * 3.3 - 0.5) * 100);
	});
    }, 1000);
});
