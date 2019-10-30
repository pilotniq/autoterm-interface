const mqtt = require( 'mqtt' );

var mqttClient  = mqtt.connect('mqtt://hallen.local')

mqttClient.on('connect', function () {
    mqttConnected = true;
    console.log( "MQTT connected." );
    // log compressor state on startup
    mqttClient.publish( "heatpump/compressorState", "off" );
    console.log( "Logged to heatmpump" );
});

