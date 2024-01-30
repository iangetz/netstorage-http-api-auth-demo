const netstorage = require('./creds/netstorage.json');
const crypto = require('crypto');
const https = require('https');

// Adjust the action value (e.g. list, dir, stat, etc) as needed
const acsAction = 'version=1&action=list&max_entries=5';
// const acsAction = 'version=1&action=list&end=<dir>>';
// const acsAction = 'version=1&action=list&max_entries=5&start=<dir>';

// Build and sign auth headers
let acsAuthData = '', acsAuthSign = '';
try {
	acsAuthData = `5, 0.0.0.0, 0.0.0.0, ${Math.floor(Date.now() / 1000)}, ${Math.floor((Math.random() * 100000))}, ${netstorage.uploadId}`;
	const sign_string = `${netstorage.uploadDir}\nx-akamai-acs-action:${acsAction}\n`;
	const message = acsAuthData + sign_string;
	acsAuthSign = crypto.createHmac('sha256', netstorage.uploadKey)
		.update(message)
		.digest('base64');
} catch (err) {
	throw new Error(`[Auth Error] ${err}`);
}

// HTTPS request settings
const options = {
	hostname: `${netstorage.domainPrefix}${netstorage.apiDomain}`,
	port: 443,
	path: `${netstorage.uploadDir}`,
	method: 'GET',
	headers: {
		"Accept": "text/html",
		'X-Akamai-ACS-Action': acsAction,
		'X-Akamai-ACS-Auth-Data': acsAuthData,
		'X-Akamai-ACS-Auth-Sign': acsAuthSign,
		'Host': `${netstorage.domainPrefix}${netstorage.apiDomain}`
	}
};

const req = https.request(options, (res) => {
	console.log('statusCode:', res.statusCode);
	console.log('headers:', res.headers);

	res.on('data', (data) => {
		process.stdout.write(data);
	});
});

req.on('error', (e) => {
	console.error(e);
});

req.end();