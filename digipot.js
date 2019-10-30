const spi = require('spi-device');

function readAddress( addr )
{
    const device = spi.open( 0, 1, (err) => {
	if( err )
	{
	    console.log( "Error: " + err );
	    return;
	}

	const readMessage = [{
	    sendBuffer: Buffer.from([(addr << 4) | 0x0c, 0x00]),
	    receiveBuffer: Buffer.alloc(2),        // Raw data read from channel 5
	    byteLength: 2,
	    speedHz: 20000 // Use a low bus speed to get a good reading from the TMP36
	}];

	console.log( "readMessage buffer: " + readMessage[0].sendBuffer.toString( 'hex' ) );
	console.log( "doing transfer!" );
	device.transfer(readMessage, (err, readResponseMessage) => {
	    if (err) throw err;

	    console.log( "addr " + addr + " response: " +
			 readResponseMessage[0].receiveBuffer.toString( 'hex' ) );
    });
    });
}

function writeAddress( address, value )
{
    const device = spi.open( 0, 1, (err) => {
	const writeMessage = [{
	    sendBuffer: Buffer.from([ (address << 4) | (value >> 8) & 0x03,
				      value & 0xff]),
	receiveBuffer: Buffer.alloc(2),        // Raw data read from channel 5
	byteLength: 2,
	speedHz: 20000 // Use a low bus speed to get a good reading from the TMP36
    }];

    if (err) throw err;

    device.transfer(writeMessage, (err, responseMessage) => {
	if (err) throw err;

	console.log("wrote address, response=" + responseMessage[0].receiveBuffer.toString('hex'));
    });
});

}

readAddress( 0 );
readAddress( 1 );
readAddress( 4 );
readAddress( 5 );

writeAddress( 0, 0x101 ); // 0x101 is Full scale
readAddress( 0 );

writeAddress( 0, 0x080 ); // 0x80 is Mid scale
readAddress( 0 );

writeAddress( 0, 0x001 ); // 0x80 is Mid scale
readAddress( 0 );

writeAddress( 0, 0x000 ); // 0x80 is Mid scale
readAddress( 0 );
