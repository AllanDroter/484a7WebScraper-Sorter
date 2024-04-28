const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const jsonData = require('./credentials.json');
const artistQuery = process.argv.slice(2);

console.log(jsonData.from);
console.log(jsonData.to);
console.log(jsonData.sender_email);
console.log(jsonData.sender_password);

if(artistQuery.length === 0){
  console.log('You did not specify any artist(s)');
  process.exit(9);
}
console.log(artistQuery);

async function artistList(){

  try{
    const response = await axios.get('https://www.popvortex.com/music/charts/top-rap-songs.php');
    const $ = cheerio.load(response.data);
    const artistAndSong = [];

    for(let a = 0; a < artistQuery.length; a++){
      $('p.title-artist').each(function(i, element){
        if($(element).find('em.artist').text().includes(artistQuery[a])){
          const artist = $(element).find('em.artist').text();
          const song = $(element).find('cite.title').text();
          artistAndSong.push({artist, song});
        }
      });
    }
    // $('p.title-artist').each(function(i, element){
    //   if($(element).find('em.artist').text().includes(artistQuery)){
    //     const artist = $(element).find('em.artist').text();
    //     const song = $(element).find('cite.title').text();
    //     artistAndSong.push({artist, song});
    //   }
    // });
    return artistAndSong;
  }catch(error){
    console.error('Error fetching data:', error);
  };
}

async function main(){

  const artistAS = await artistList();

  if(typeof artistAndSong === 'undefined'){
    console.log('Specified artist(s) not found, terminating function');
    process.exit(9);
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
     user: jsonData.sender_email,
     pass: jsonData.sender_password,
    },
  });

  let emailHTML = '';
  for (const artist of artistAS) {
      emailHTML += `<b>${artist.artist}</b>: <i>${artist.song}</i><br>`;
  };

  // let artistSet = new Set(artistAS.map(artist => artist.artist));
  // let justArtists = Array.from(artistSet);
  let emailSubject = `Your artist(s) are: ${artistQuery.join(' and ')}`;

  let mailOptions = {
    // sender address
    from: jsonData.sender_email,
    // list of receivers
    to: jsonData.to,
    // subject line
    subject: emailSubject,
    // plain text body
    // text: '',
    // html body
    html: emailHTML,
  };

  console.log("This is the email html" + emailHTML);

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: ', info.messageId);

}

main().catch(console.error);