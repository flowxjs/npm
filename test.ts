import crypto from 'crypto';

const timestamp=1546084445901
const appSecret='testappSecret'
const signature = 'HCbG3xNE3vzhO+u7qCUL1jS5hsu2n5r2cFhnTrtyDAE=';
const urlEncode = 'HCbG3xNE3vzhO%2Bu7qCUL1jS5hsu2n5r2cFhnTrtyDAE%3D';

const hmac = crypto.createHmac('sha256', appSecret)
            
hmac.update(timestamp + '');
 
console.log(hmac.digest('base64'));