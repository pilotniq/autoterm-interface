const mcpadc = require('mcp-spi-adc');
const mqtt = require( 'mqtt' );
const raspi = require( 'raspi' );
const gpio = require( 'raspi-gpio' );

const conpressorPin = 18;

var mqttClient  = mqtt.connect('mqtt://hallen.local')
var mqttConnected = false;

mqttClient.on('connect', function () {
    mqttConnected = true;
    console.log( "MQTT connected." );
    // log compressor state on startup
});

raspi.init( () => {
    console.log( "raspi init callback" );
    const compressorInput = new gpio.DigitalInput({
	pin: 'GPIO18',
	pullResistor: gpio.PULL_NONE
    });

    compressorInput.on( 'change', (value) => { compressorChanged( value ); } );

    if( mqttConnected )
	compressorChanged( compressorInput.read() );
    else
    {
	mqttClient.on( 'connect', function () {
	    compressorChanged( compressorInput.read() );
	});
    }

    gpioInitialized = true;
} );

// pin 25 is /chip select

const vHigh = 4.9; // Volts
const rHigh = 557; // kOhm;
const rLow = 996; // kOhm
const rHeatpumpHigh = 5000; // Ohm
const runningAverageDecay = 0.01;

var lastReportedTemperature;
var runningAverage;

function compressorChanged( value )
{
    console.log( "compressorChanged: " + value );
    
    if( mqttConnected )
    {
	const logValue = value ? "off" : "on";
	console.log( "compressorChanged logging " + logValue );
	
	mqttClient.publish( "heatpump/compressorState", logValue );
    }
}

function thermistorRtoC( b, r0, r )
{
    return 1/(Math.log(r/r0)/b+1/298)-273;
}

const uteVoltage = mcpadc.open(0, {speedHz: 20000}, (err) => {
    if (err) throw err;

    setInterval(() => {
	uteVoltage.read((err, reading) => {
	    if (err) throw err;

	    voltage = reading.value * 3.3;
	    if( voltage < 1.0 ) // if < 1V, is above 42 degrees, guess cable has been disconnected
	    {
		doReport = false;
		console.log( "Not reporting due to unreasonable low voltage" );
	    }
	    else
	    {
		// do voltage divider calculation for ADC input divider
		vThermistor = voltage * (rHigh + rLow) / rLow;
		// calculate heapump voltage divider (5 kOhm high)
		iThermistor = (vHigh - vThermistor) / rHeatpumpHigh;
		rThermistor = vThermistor / iThermistor;
		
		tempC = thermistorRtoC( 3977, 4700, rThermistor);
		// console.log( "reading=" + reading.value );
		console.log( "voltage=" + voltage );
		/*
		  console.log( "vThermistor = " + vThermistor + " V" );
		  console.log( "iThermistor = " + iThermistor + " A" );
		  console.log( "rThermistor = " + rThermistor + " Ohm" );
		*/
		console.log( "temp =" + tempC + " C" );
		// console.log((reading.value * 3.3 - 0.5) * 100);
		
		if( runningAverage )
		{
		    runningAverage = runningAverage * (1 - runningAverageDecay) +
			tempC * runningAverageDecay;
		}
		else
		    runningAverage = tempC;
		
		console.log( "runningAverage=" + runningAverage.toFixed(1) +
			     " = " + runningAverage );
	    
		if( typeof lastReportedTemperature == 'undefined' )
		    doReport = true;
		else if( Math.abs( lastReportedTemperature - runningAverage ) > 0.1 )
		    doReport = true;
		else
		    doReport = false;
	    }
	    
	    if( doReport && mqttConnected )
	    {
		// mqttClient.publish( "rooms/outdoors/temperature", tempC.toFixed( runningAverage, 1 ) );
		// Should we report tempC or runningAverage? tempC should give quicker but more noisy response
		var tempToReport = runningAverage.toFixed( 1 );
		mqttClient.publish( "rooms/outdoors/temperature", tempToReport );
		lastReportedTemperature = tempToReport;
		console.log( "Reporting temperature" );
	    }
	});
    }, 100);
});

