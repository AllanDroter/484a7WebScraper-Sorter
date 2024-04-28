const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const jsonData = require('./credentials.json');
const artistQuery = process.argv.slice(2);

console.log(jsonData.from);
console.log(jsonData.to);
console.log(jsonData.sender_email);
console.log(jsonData.sender_password);

console.log(artistQuery);

async function artistList(){

  try{
    const response = await axios.get('https://www.popvortex.com/music/charts/top-rap-songs.php');
    const $ = cheerio.load(response.data);
    const artistAndSong = [];

    for(let a of artistQuery){
      $('p.title-artist').each(function(i, element){
        if($(element).find('em.artist').text().includes(a) || $(element).find('cite.title').text().includes(a)){
          const artist = $(element).find('em.artist').text();
          const song = $(element).find('cite.title').text();
          artistAndSong.push({artist, song});
        }
      });
    }
    if(artistAndSong.length === 0){
      console.log('Specified artist(s) not found, exiting, no email to be sent.');
      process.exit(9);
    }else{
      console.log(artistAndSong);
      return artistAndSong;
    }
  }catch(error){
    console.error('Error fetching data:', error);
  };
}

async function main(){

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
     user: jsonData.sender_email,
     pass: jsonData.sender_password,
    },
  });

  const artistAS = await artistList();
  let emailHTML = '';
  for (const artist of artistAS) {
      emailHTML += `<b>${artist.artist}</b>: <i>${artist.song}</i><br>`;
  };
  let emailSubject = '';

  if(artistQuery.length === 0){
    console.log('You did not specify any artist(s), terminating process.');
    process.exit(9);
  }
  if(artistQuery.length === 1){
    emailSubject = `Your artist(s) are: ${artistQuery}`;
  }
  if(artistQuery.length === 2){
    emailSubject = `Your artist(s) are: ${artistQuery.join(' and ')}`;
  }
  if(artistQuery.length > 2){
    let lastTwoArtists = artistQuery.slice(-2).join(', and '); // doing this for the exact phrasing in the assignment, but I think we ditch these now before the and
    let beforeLTA = artistQuery.slice(0, -2).join(', ');
    emailSubject = `Your artist(s) are: ${beforeLTA}, ${lastTwoArtists}`;
  };

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
  }
  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: ', info.messageId);

}

main().catch(console.error);