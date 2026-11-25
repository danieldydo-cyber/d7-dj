/* Ghost X G tiers: 0 = Ghost X G (free, everything), 1 = 💎 Ghost Open SI, 2 = 👑 Maxi Ghost SI, 3 = owner (all).
   Only hashes here. Codes: SHA-256 of the uppercased code (random codes, plaintext kept privately by Daniel).
   Owner key: PBKDF2-SHA256, 100 000 iterations, public salt. Client-side check = honor system, not DRM. */
window.GX_CODE_HASHES=[
 'b3f9edb06fa14258a6eeea176f1ab4b2fd1c35a361c05cc311aaef3ca9eb0ea2',
 'c58f150e87c7bc9a25372d7c31f5877abb8cf40a5e312c01b550f30873ec3731',
 '42746f6b549f0c00461f40559a755277bdc6e35737017ebf5ad382d63f5db72d',
 'd2bed5db9dfdcdd1144ea57fa4d0a27b5a16b1ecf37ecc9203060409c3a7827b',
 'a41a71a63ccc93eb0ab37fa0501be29185e142b0fdd2e083eac7934f02284ea6',
 '8acb05c3d4b186d36b6e4e4375a750ac1b4b28aadaf63c79e7c74f8e523321ab',
 '097f509c8bbdf55bfa8615ee8c665bf953381a0e360e42fd0ba8287bd19ee03a',
 '09860b69337758919181b239c992dfc4be5e40d65be8b8318dfc69422f28d119',
 'dc7c9713ae44ea7e1395a5b39a4e7347a4edb47847cab2cd3697fe85eff24aaf',
 '882a063beff2aff585c623c2034db7fbe9a2da39abe4b15337356322ae6e354c',
 '1d0aed746970bcb2fce4c8acd24d0c3dea59906f85ba317164d7ec30038c080f',
 '3de5ea3b3b4237ac8b91a57dacbae2f46ad26468418983eb1cf4a95db73d7b5c',
 'be95bfd84192c0c27c86f6f400912b18d3a7eb81b8c97bc0164618f24c13191b',
 '3e96fa751b2e53e7009f646ce204471b355a3f29c178a323603add99f98f09d4',
 '1140299860709e2ad520b5dee7c67722d685e4789ee4aa1d9b571955cec8dbf6',
 '20679c52c4dc665d9650be86e39ce73580cbd503f3c943264761e10c92d3f56d',
 'cffd2739b30965290dbf6a4ec73deceea76a241fac8a107e2c30fe58785919cc',
 '922e47fbbb0045184793ba11dc48fede293a726bfc501e677dd9ea7135dab9dc',
 '15f34299f615c9bf203662b47e44163d675015f5c902b6b46c8dd65e76cb92d4',
 '66160cdca06a23f1539ae6868d19aca02d44ed4cbd1f8f16623e01da71ae410e'
];
window.GX_MAXI_HASHES=[
 '1a43f38282737855f725beb961847770296178b8a8dd394d05836d0ad7e6d020',
 '02b72b7e755dcf7b988e7da9686d7a39f94a1e5eb4e26a475b8869282b00a1cd',
 '8d536e876269e05d007781fec1c806f44601a34034a119b215212c400808bdfa',
 '5fb7f0e6455a6884d919d7f01ded16b829bc4781c14478a585113ab21b026458',
 '1f995bb6aecdc017deb00b2b21e8ae36e1487bfd9b7bf5cc963e675a71b95737',
 '8e645a8095b3a1ce5558859ce95d298febff0578c02ee2bd760aadfa68222a51',
 '933e227aceb90c39007c9d6eb322f516843f15a558328eb46a4f38ae1a21da23',
 '0b80b18c0c7f2716b450b5ec8c56a1587110b7d4e09c39320d12a5af911df955',
 '430cd417b8ca029e9b80bb03fa34cf4a7b15de5ee77972df1320b5e53a237fc9',
 '62ccb1956d04c1c33e72ec77e72066682689f9aae437ac012c6148fd56286eb6',
 'cb0e7eaa29bf613c1ade411fe19d802bd43a2e51e8dbb920e39754f3fb723ff2',
 'f119c93cd3575dcf0c81cb81995091da5a25a2a70c51876066d6c7077bc66585',
 '771ab84c30437955f281caba2277f28db983108803c5c81b50b85b248f1c6828',
 '46ca720e0e49f0bb191d51c921f2307aabdebefe3d2e94a9d0c1a10962ebb3b8',
 '6d4c4ac018e887a37a6548f8ed79153f086a8ca6b5ec7262a49f6a92b406edf0',
 '784ecceab07e28fa8ca3d53d9d29ae42573e7566be83e38bca6c49ca5fdd2af7',
 '9b873fd4b58b904bfdfd780fc1fc0b80b534bbcaef791bc164f55c9290c64367',
 '3ace0d3f2b52122ed51b46204975f0a5d79d2c8b69a8678dbbd125383ded87ed',
 '890367e37437d1e7e0add92f3bae3d45eec7dbc81e8346a7db1e48308eca388a',
 '7d7db8604abef4e8af89e9214865576f50559431d368bfda5cb9672bb966be0e'
];
window.GX_OWNER={salt:'a05630c030fe34290ea7cdbdeb4fd6ce',iter:100000,hash:'2da32ca2311f1be209a6f8bf2ffc5014cc044fcb4602ccd3d3ca9dd461ceb354'};
window.GXUnlock={
 tier:function(){var t=+(localStorage.getItem('gx_tier')||0);if(!t&&localStorage.getItem('gx_full')==='1')t=1;return t},
 full:function(){return this.tier()>=1}, maxi:function(){return this.tier()>=2}, owner:function(){return this.tier()>=3},
 name:function(){return ['Ghost X G · 100% za darmo','💎 Ghost Open SI','👑 Maxi Ghost SI','👑 Właściciel · wszystko odblokowane'][this.tier()]},
 hex:function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')},
 hash:async function(s){return this.hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s.trim().toUpperCase())))},
 pbkdf2:async function(s){var k=await crypto.subtle.importKey('raw',new TextEncoder().encode(s.trim()),'PBKDF2',false,['deriveBits']);var salt=new Uint8Array(GX_OWNER.salt.match(/../g).map(function(h){return parseInt(h,16)}));return this.hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:GX_OWNER.iter},k,256))},
 set:function(t){if(t>this.tier())localStorage.setItem('gx_tier',String(t));localStorage.setItem('gx_full','1');return t},
 tryCode:async function(c){c=(c||'').trim();if(!c)return 0;
  if(/^\d{1,8}$/.test(c)&&await this.pbkdf2(c)===GX_OWNER.hash)return this.set(3);
  var h=await this.hash(c);if(GX_MAXI_HASHES.indexOf(h)>=0)return this.set(2);if(GX_CODE_HASHES.indexOf(h)>=0)return this.set(1);return 0}};
