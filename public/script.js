// ------------------------- game variables -------------------------------------------------------------
const cardColor = '#dbf5e4';
const selectedCardColor = '#20df9b';
const mouseOnCardColor = '#36C98C';
const correctSetColor = '#9ec7fe';
const wrongSetColor = '#ff4b4b';
const enemySetColor = '#ff8888'

let duringAnimation = false;
let animationTime = 350  // In milliseconds

let cards = [];
let selectedCardsId = [];

let setsCounter;
let timer;
let interval;

let mobileDevice = false;
// startGame1()
// ------------------------- game code --------------------------------------------------------------------
function restartData() {

  // Delete the data from the results table expect from the button
  for (let child = $('#game-results').children().length - 2; child >= 0; child--) {
    $('#game-results').children()[child].remove();
  }

  // Delete all the shapes from their cards
  for (let i = 0; i < 12; i++) {
    $('#card' + i).empty();
  }

  setsCounter = [];
  clearInterval(interval);  // Stop the timer
  timer = 0;

  $('#setsDisplayer').empty();  // Delete the sets and the names of the players
  
  $('#minutesCounter').text('00');
  $('#secondsCounter').text('00');
}

// Called when a card is selected
function cardSelected(id){
  // Check if the card is already selected, and if so then deselect it
  if (selectedCardsId.includes(id)){
    selectedCardsId.splice(selectedCardsId.indexOf(id), 1);
    if (mobileDevice) {
      deselectCard(id);
    } else {
      mouseHoverCard(id);
    }
    return
  }

  if (selectedCardsId.length < 3 || selectedCardsId.length == null){
    selectedCardsId.push(id);
    selectCard(id);
  }

  // Check if there is enough cards for set, and if so then send them to server to check if set
  if (selectedCardsId.length == 3) {
    let jsonCardsToSend = [];
    let currentCard;

    // Loop for every card in the set
    for (let i = 0; i < 3; i++) {
      currentCard = cards[selectedCardsId[i].toString().replace('card', '')];
      jsonCardsToSend = buildJsonCardsToSend(selectedCardsId[i], currentCard[selectedCardsId[i]], jsonCardsToSend);
    }
    sendSet(jsonCardsToSend);
  }
}

function timeCounter() {
  interval = setInterval(() => {
    timer++;
    updateTimer()
  }, 1000);
}

// clear the cards from the selected cards list (if there), and also deselect these cards
// and draw the new 
function restartCards(cards){
  selectedCardsId = [];
  for (let currentCard of cards){
    let cardNum = Object.keys(currentCard)[0];
    deselectCard(cardNum);
    createShape(cardNum, currentCard[cardNum].shape, currentCard[cardNum].color, currentCard[cardNum].shade, currentCard[cardNum].amount);
    // if (cardNum.substring(4) < 3) {
    //   $('#' + cardNum).css({'bottom': 0});
    // } else if  (cardNum.substring(4) > 7) {
    //   $('#' + cardNum).css({'top': 0});
    // }
  }
}

// Create the json file of the cards in the format that the server requires
function buildJsonCardsToSend(cardId, card, jsonCardsToSend) {
  jsonCardsToSend.push( {[cardId] : {
    'shape': card.shape,
    'color': card.color,
    'shade': card.shade,
    'amount': card.amount
  }})

  return jsonCardsToSend;
}

// Because sometimes the elementId was the id of the shape or the id of the border-shape,
// I created the below function, so the elementId will be of the card.
function getCardId(elementId){
  let gotToIdNum = false;
    let cardIdNum = ''
    for (char of elementId) {
      if (gotToIdNum & !isNumber(char)) {
        break;
      }

      if (isNumber(char)) {
        gotToIdNum = true;
        cardIdNum += char;
      }
      
    } 

    return 'card' + cardIdNum;
  }

// Check if the char that's given is a number
function isNumber(char) {
  if (typeof char !== 'string') {
    return false;
  }

  if (char.trim() === '') {
    return false;
  }

  return !isNaN(char);
}