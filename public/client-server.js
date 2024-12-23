// ------------------------- server variables -------------------------------------------------------------
let socket = io.connect('http://localhost:3000');

// ------------------------- server connection code -------------------------------------------------------

// * The format of the cards that's transferred to the server and from the server is like in this example:
// [{card4: {shape: 'wave', color: 'red', shade: 'lines', amount: 1}},
// {card8: {shape: 'wave', color: 'green', shade: 'lines', amount: 2}}]

// ----------------- connection ----------------------
// Get response from server at beginning of the game
// socket.on('nameError', () => {nameError()});

socket.on('createGameBoard', (cardsFromServer, playersNames) => 
  {createGameBoard(cardsFromServer, playersNames)});

// Get response from server when 3 cards are selected
socket.on('set', (set, setCards, score, sendTheSet) => 
  {setAttempt(set, setCards, score, sendTheSet)});

socket.on('gameOver', (score) => {
  gameOver(score);
});

// ------------- get from server ---------------------
function nameError() {
  setTimeout(() => {
    alert("There was an error with the name or the opponent's name");
    location.reload();
  }, 1200);
}

function createGameBoard(cardsFromServer, playersNames){
  cards = cardsFromServer;
  prepareGameScreen();
  restartCards(cardsFromServer);
  timeCounter();
  showNames(playersNames);
  if (screen.width <= 1200) {
    mobileDevice = true;
  }
}

function setAttempt(set, setCards, score, sendTheSet){
  console.log("Set: " + set);

  restartCards(setCards);

  if (set) {
    for (let card of setCards) {  // Replace the set cards with the new cards in the cards variable
      cards[Object.keys(card)[0].replace('card', '')] = card;
      correctSetAnimation(Object.keys(card)[0], sendTheSet);
    }
    updateCounter(score);

  } else {
    for (let card of setCards) {
      wrongSetAnimation(Object.keys(card)[0]);
    }
  }
}

// ------------- send to server ---------------------
function sendStartGame1() {socket.emit('startGame1');}
function sendStartGame2(name, opponentName) {socket.emit('startGame2', name, opponentName);}
function sendSet(jsonCardsToSend) {socket.emit('set', jsonCardsToSend, cards)}
