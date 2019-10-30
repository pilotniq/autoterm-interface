const raspi = require( 'raspi' );
const gpio = require( 'raspi-gpio' );

const conpressorPin = 18;

setTimeout( gpio_start, 200 )

function gpio_start()
{
raspi.init( () => {
    console.log( "raspi init callback" );
    const compressorInput = new gpio.DigitalInput({
	pin: 'GPIO18',
	pullResistor: gpio.PULL_NONE
    });

    compressorInput.on( 'change', (value) => { compressorChanged( value ); } );

    compressorChanged( compressorInput.read() );
} );
}
function compressorChanged( value )
{
    console.log( "compressorChanged: " + value );
    
    // if( mqttConnected )
    {
	const logValue = value ? "off" : "on";
	console.log( "compressorChanged logging " + logValue );
	
	// mqttClient.publish( "heatpump/compressorState", value ? "on" : "off" );
    }
}
