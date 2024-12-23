
// Start a game of 1 player
function startGame1() {
  $('.start-game-btn').css({'visibility': 'hidden'});
  $('#game-board').css({'visibility': 'visible'});

  restartData();
  sendStartGame1();
}

// Triggered when the mouse hovers over a card
$('.card').on({
  mouseenter: function(event){  // When mouse hover a card
    let cardId = getCardId(event.target.id);
    if (!selectedCardsId.includes(cardId)) {
      if (!duringAnimation){
        mouseHoverCard(cardId);
      }
    }
    

  }, mouseleave: function(event){  // When mouse get out of the card hovering
    if (!duringAnimation){
      let cardId = getCardId(event.target.id);
      if (selectedCardsId.includes(cardId)) {
        selectCard(cardId);
      } else {
        deselectCard(cardId)
      }
    }
  }
})

function mouseHoverCard(cardId){
  $('#' + cardId).css({'background-color': mouseOnCardColor});
  $('#' + cardId).css({'box-shadow': 'rgba(0, 0, 0, 0.5) 0 8px 15px'})
}

function selectCard(cardId){
  $('#' + cardId).css({'background-color': selectedCardColor});
}

function deselectCard(cardId) {
  $('#' + cardId).css({'background-color': cardColor});
  $('#' + cardId).css({'box-shadow': 'rgba(0, 0, 0, 0) 0 0px 0px'});
}

function correctSetAnimation(cardId, sendTheSet){
  duringAnimation = true;

  if (sendTheSet) {
    $('#' + cardId).css({'background-color': correctSetColor});
  } else {
    $('#' + cardId).css({'background-color': enemySetColor});
  }
  setTimeout(() => {
    deselectCard(cardId);
    duringAnimation = false;
  }, animationTime);
}

function wrongSetAnimation(cardId){
  duringAnimation = true;
  $('#' + cardId).css({'background-color': wrongSetColor});
  setTimeout(() => {
    deselectCard(cardId);
    duringAnimation = false;
  }, animationTime);
}

function updateCounter(score) {
  for (let i = 0; i < score.length; i++) {
    $('#setsCounter' + i).text(score[i]);
  }
}

function updateTimer() {
  if (Math.floor(timer / 60).toString().length < 2) {
    $('#minutesCounter').text('0' + Math.floor(timer / 60));
  } else {
  $('#minutesCounter').text(Math.floor(timer / 60));
  }

  if ((timer % 60).toString().length < 2) {
    $('#secondsCounter').text('0' + timer % 60);
  } else {
  $('#secondsCounter').text(timer % 60);
  }
}

function prepareGameScreen(){
  $('#game-board').css({'visibility': 'visible'});
  $('#loading-dots').css({'visibility': 'hidden'});
}

// Create the shape inside the card
function createShape(cardId, shape, color, shade, amount) {
  // debugger
  let cardIdNum = cardId.replace('card', '');
  $('#' + cardId).css({'position': 'relative'}); // Set the positions of all the cards to relative
  $('#' + cardId).empty();  // Delete the card's shape (if there is)
  // Sets the amount of the shape
  for (let i = 0; i < amount; i++) {

    // Create the shape element
    $('#' + cardId).append('<div id="shape' + cardIdNum + '-'+ i +'" class="' + shape + '-shape shapes" </div>');
    // debugger
    // $('#' + cardId).width(0.67 * $('#' + cardId).height());
    // Creates the shape border element
    $('#shape' + cardIdNum + '-' + i).append('<div id="shape-border' + cardIdNum + '-'+ i +'" class="' + shape + '-border borders"</div>');

    // Set the color of the shape and it's border
    $('#shape' + cardIdNum + '-'+ i).css({'background-color': color}); // Set the color of the shape
    $('#shape-border' + cardIdNum + '-'+ i).css({'background-color': color}); // Set the color of the shape

    // Set the filling of the shape
    if (shade == 'full'){
      // Do nothing because the shape's filling is by default set to "full"
    } else if (shade == 'lines'){
      $('#shape' + cardIdNum + '-'+ i).css({'background': 'repeating-linear-gradient(180deg,' + color + ',' + color + ' 5%, rgba(0, 0, 0, 0) 5%, rgba(0, 0, 0, 0) 10%)' }); // Set the shade of the shape
    } if (shade == 'hollow'){
      $('#shape' + cardIdNum + '-'+ i).css({'background-color': 'transparent'});
    }
  }
}

// called when the game is over
function gameOver(score) {

  // Show the results table
  $('#game-board').css({'visibility': 'hidden'});
  $('#game-results').css({'visibility': 'visible'});

  if ($('#setsDisplayer').children().length <= 1) {  // If there is only 1 player
    
    $('#back-to-homepage-btn').before('<div>Sets:  ' + score + '</div>');
    $('#back-to-homepage-btn').before('<div> <span>Time:  </span>'
     + '<span><span>'
     + $('#minutesCounter').text() + '</span><span>:</span><span>' 
     + $('#secondsCounter').text() + '</span></span> </div>');

  } else {  // If there are 2 players

    for (let i = 0; i < score.length; i++) {

      $('#back-to-homepage-btn').before('<div>' + $('#name' + i).text() + '</div>');
      $('#back-to-homepage-btn').before('<div>Sets:  ' + score[i] + '</div>');

    }
  }
}

// ------------------------- 2 players game code --------------------------------------------------------------------

// Called when the player choose 2 players game option
function getPlayersNamesTable() {
  $('#get-players-names-table').css({'visibility': 'visible'});
  $('.start-game-btn').css({'visibility': 'hidden'});
}

// Called when the back button in the beginning is clicked or at the end of a game
function goToHomePage() {
  $('#get-players-names-table').css({'visibility': 'hidden'});
  $('#game-results').css({'visibility': 'hidden'});
  $('.start-game-btn').css({'visibility': 'visible'});
}

// Start a game of 2 players
function startGame2() {
  $('#get-players-names-table').css({'visibility': 'hidden'});
  $('#loading-dots').css({'visibility': 'visible'})

  restartData();
  sendStartGame2($('#name-input').val(), $('#opponent-name-input').val());
}

function showNames(playersNames) {
  for (let i = 0; i < playersNames.length; i++) {

    if (playersNames.length > 1) {  // Show the name of the players only of there are more than one
      $('#setsDisplayer').append('<div id="name' + i + '">' + playersNames[i] + '</div>');
    }
    $('#setsDisplayer').append('<div id="setsCounter' + i + '">0</div>');

    if (playersNames.length <= 1) {  // If there is only 1 player
      $('#setsDisplayer').css({'display': 'flex'});
    } else {  // If there are 2 players
      $('#setsDisplayer').css({'display': 'grid'});
    }
  }
}

function enemySelectedCards(setCards){
  for (let currentCard of setCards){
    $('#' + Object.keys(currentCard)[0]).css({'box-shadow': 'rgba(0, 0, 0, 0.5) 0 8px 15px'})
    // $('#' + Object.keys(currentCard)[0]).css({'background-color': enemySetCardColor});
  }
}

// function goToHomePage1() {
//   $('#get-players-names-table').css({'visibility': 'hidden'});
//   $('#loading-dots').css({'visibility': 'visible'})
//   restartData();
//   sendStartGame2('Elisheva', 'Nitay');
// }

// function startGame21() {
//   $('#get-players-names-table').css({'visibility': 'hidden'});
//   $('#loading-dots').css({'visibility': 'visible'})

//   restartData();
//   sendStartGame2('Nitay', 'Elisheva');
// }