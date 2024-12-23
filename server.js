// ------------------------- variables format ------------------------------------------------------------
/*
The format of the cards that's transferred to the server and from the server is like in this example:
[{card4: {shape: 'wave', color: 'red', shade: 'lines', amount: 1}},
{card8: {shape: 'wave', color: 'green', shade: 'lines', amount: 2}}]
-----------------------------------------------
The format of the gamesData variable is like in this example:
[[cardsPack: [Card (class), Card (class)], {id: socketId, points: 10}, {id: matchingPlayersSocketId, points: 12}],
[cardsPack: [Card (class), Card (class)], {id: socketId, points: 12}, {id: matchingPlayersSocketId, points: 4}]] 
*/
// ------------------------- server variables ------------------------------------------------------------
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

server.listen(port, () => {  // Create server on port 3000
	console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));  // Send the public folder to the client

const io = require('socket.io')(server);
const Card = require('./card.js');

// ------------------------- game variables ---------------------------------------------------------------
const shapes = ['wave', 'diamond', 'ellipse'];
const colors = ['red', 'purple', 'green'];
const shades = ['full', 'lines', 'hollow'];
const amounts = [1, 2, 3];
var gamesData = [];
var waitingPlayersData = [];  // [{socketId: {name, opponentName}}]

// ------------------------- server connection code -------------------------------------------------------
// ----------------- connection ----------------------
io.on('connection', (socket) => {
	console.log('New connection: ' + socket.id);
	socket.on('disconnect', () => {disconnect(socket.id)});
	socket.on('set', (setCards, boardCards) => {setAttempt(socket.id, setCards, boardCards)});
	socket.on('startGame1', () => {startGame1(socket.id)});
	socket.on('startGame2', (name, opponentName) => {startGame2(socket.id, name, opponentName)});
});

// ------------- get from client ---------------------
function startGame1(socketId) {  // Start 1 player game
	console.log('Starting 1 player game')

	// Create the card pack
	let cardsPack = createCards();

	let jsonCardsToSend = createStartGameCards(cardsPack);
	// Loop until there is a set existence, usually the first time
	while (!checkIfSetExist(jsonCardsToSend)) {
		let newCard = buildJsonCardsToSend(Object.keys(jsonCardsToSend[0])[0], selectRandomCard(cardsPack));
		cardsPack.push(new Card(jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shape, 
			jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].color, 
			jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shade, 
			jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].amount));
		jsonCardsToSend[0] = newCard;
	}
	saveGamesData(cardsPack, socketId);
	sendCreateGameBoard(jsonCardsToSend, socketId, ['']);
}

function startGame2(socketId, name, opponentName) {  // Start 2 players game
	console.log(name);
	if (name == '' | opponentName == '' | name == opponentName) {
		sendNameError(socketId);
		return
	}

	console.log('Starting 2 players game');
	saveWaitingPlayerData(name, opponentName, socketId);

	// If there is a match, then return it's id
	let matchingId = findMatchOfWaitingPlayers(waitingPlayersData[waitingPlayersData.length -1][socketId].name, 
		waitingPlayersData[waitingPlayersData.length -1][socketId].opponentName);
	if (matchingId != null) {  // Check if returned a matching id of there isn't
		// Create the card pack
		let cardsPack = createCards();

		let playersNames = [];  // Save the players' names
		playersNames.push(getNameOfId(socketId));
		playersNames.push(getNameOfId(matchingId));

		let jsonCardsToSend = createStartGameCards(cardsPack);
		// Loop until there is a set existence, usually the first time
		while (!checkIfSetExist(jsonCardsToSend)) {
			let newCard = buildJsonCardsToSend(Object.keys(jsonCardsToSend[0])[0], selectRandomCard(cardsPack));
			cardsPack.push(new Card(jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shape, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].color, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shade, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].amount));
			jsonCardsToSend[0] = newCard;
		}

		saveGamesData(cardsPack, socketId, matchingId);  // Add match to the matching list
		deleteWaitingPlayerData(socketId);  // Delete the data of the current id from the waiting list
		deleteWaitingPlayerData(matchingId);  // Delete the data of the matching id from the waiting list

		sendCreateGameBoard(jsonCardsToSend, socketId, playersNames);
	}
}

function setAttempt(socketId, setCards, boardCards) {  // Check if set by getting 3 cards
		var set = checkIfSet(setCards);

		let jsonCardsToSend = [];
		let cardsPack = getCardsPack(socketId);

		if (set) {
			increaseScore(socketId);
			if (cardsPack.length == 0){  // If the game is over
				// The order of the below function is important and SHOULDN'T BE TOUCHED!!!
				sendGameOver(socketId);
				deleteMatchedgamesData(getMatchId(socketId));
				deleteMatchedgamesData(socketId);
				return;
			}

			jsonCardsToSend = giveNewCards(setCards, cardsPack);

			// Loop until there is a set existence, usually the first time
			while (!checkIfSetExist(boardCards, jsonCardsToSend)) {
			let newCard = buildJsonCardsToSend(Object.keys(jsonCardsToSend[0])[0], selectRandomCard(cardsPack));
			cardsPack.push(new Card(jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shape, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].color, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].shade, 
				jsonCardsToSend[0][Object.keys(jsonCardsToSend[0])[0]].amount));
			jsonCardsToSend[0] = newCard;
			}

		} else {  // If not set then the new cards are the old cards
			jsonCardsToSend = setCards;
		}

		sendSet(socketId, set, jsonCardsToSend);
}

function disconnect(socketId) {  // When some user disconnects
	console.log('Lost connection: ' + socketId);

	// Delete the data from the waiting list
	deleteWaitingPlayerData(socketId);
	// Delete the match
	deleteMatchedgamesData(socketId);
	return;
}

// ------------- send to client ---------------------
function sendNameError(socketId) {
	io.to(socketId).emit('nameError');
}

function sendCreateGameBoard(jsonCardsToSend, socketId, playersNames) {
	io.to(socketId).emit('createGameBoard', jsonCardsToSend, playersNames);

	  // If there is a match (which means that it's a game of 2 players),
	  // then send also to the matching player
	let matchingId = getMatchId(socketId);
	if (matchingId != undefined) {
		io.to(matchingId).emit('createGameBoard', jsonCardsToSend, playersNames.reverse());
	}
}

function sendSet(socketId, set, jsonCardsToSend) {
	let matchingId = getMatchId(socketId);

	// If there is a match (which means that it's a game of 2 players),
	// then send also to the matching player
	if (matchingId != null) {
		io.to(socketId).emit('set', set, jsonCardsToSend,
			[getScore(socketId), getScore(matchingId)], true);
		io.to(matchingId).emit('set', set, jsonCardsToSend,
			[getScore(matchingId), getScore(socketId)], false);
		return
	}
	io.to(socketId).emit('set', set, jsonCardsToSend, [getScore(socketId)], true);
}

function sendGameOver(socketId){

	// If there is a match (which means that it's a game of 2 players),
	// then send also to the matching player
	let matchingId = getMatchId(socketId);
	if (matchingId != null) {
		io.to(socketId).emit('gameOver', [getScore(socketId), getScore(matchingId)]);
		io.to(matchingId).emit('gameOver', [getScore(matchingId), getScore(socketId)]);
		return
	}

	io.to(socketId).emit('gameOver', [getScore(socketId)]);
}

// -------------------- 2 players functions ---------------------------------------------------------------
// Save the id, name and the opponent name, until a match is found
function saveWaitingPlayerData(name, opponentName, socketId){
	waitingPlayersData.push({[socketId]: {'name': name, 'opponentName': opponentName}})
	console.log();
}

// Called when a match is found in order to delete the data from the waiting to match variable (waitingPlayersData)
function deleteWaitingPlayerData(socketId) {
	for (let i = 0; i < waitingPlayersData.length; i++){
		if (Object.keys(waitingPlayersData[i])[0] == socketId) {
			waitingPlayersData.splice(i, 1);
			break;
		}
	}
}

// Check if there is a match between the current user and some previous one, 
// and if so then return the id of the previous one
function findMatchOfWaitingPlayers(name, opponentName) {
	for (let i = 0; i < waitingPlayersData.length; i++) {
		if (waitingPlayersData[i][Object.keys(waitingPlayersData[i])[0]].opponentName == name &
		  waitingPlayersData[i][Object.keys(waitingPlayersData[i])[0]].name == opponentName) {
			console.log("Match is found");
			return Object.keys(waitingPlayersData[i])[0]
		}
	}
	// return -1;
	return null;
}

// Save the id's of the match
function saveGamesData(cardsPack, socketId, matchingId){
	// Check if there is only one player
	if (matchingId == undefined) {
		gamesData.push([cardsPack, {'id': socketId, 'score': 0}]);  // Add the id
		return;
	}
	gamesData.push([cardsPack, {'id': socketId, 'score': 0}, {'id': matchingId, 'score': 0}]);  // Add the ids of the match
}

// Called when a the game is over, or someone disconneted
function deleteMatchedgamesData(socketId) {
	for (let game = 0; game < gamesData.length; game++){
		for (let property = 1; property < gamesData[game].length; property++){
			if (gamesData[game][property].id === socketId){
				if (gamesData[game].length === 2) {
					gamesData.splice(game, 1);
				} else {
					gamesData[game].splice(property, 1); 
				}
				return;
			}
		}
	}
}

// Find the right match between all the recent matches and returns it's id
function findMatchId(socketId) {
	for (let i = 0; i < gamesData.length; i++) {
		if (Object.keys(gamesData[i])[1] == socketId) { // Check the first id of the match
			return gamesData[i];
		}
		if (Object.keys(gamesData[i])[2] == socketId) { // Check the second id of the match
			return gamesData[i][1][0];
		}
	}
	return null;
}

// Find the right match between all the recent matches and returns it's index
function getMatchId(socketId) {
	for (let game = 0; game < gamesData.length; game++) {

		let ids = [];
		let correctGame = false;

		for (let property = 1; property < gamesData[game].length; property++){
			if (gamesData[game][property].id === socketId) {
				correctGame = true;
			} else {
				ids.push(gamesData[game][property].id);
			}
		}

		if (correctGame){
			if (ids.length  === 0){
				return null;  // Couldn't find the socketId
			} else if (ids.length  == 1){
				return ids[0];
			} else {
				return ids;
			}
		}
	}
}

function getNameOfId(socketId) {
	for (let i of waitingPlayersData) {
		if (Object.keys(i)[0] == socketId) {
			return i[Object.keys(i)[0]].name;
		}
	}
}

// ------------------------- game functions --------------------------------------------------------------------
function createCards() {
	let cardsPack = [];
	for (let shape of shapes) {
		for (let color of colors) {
			for (let shade of shades) {
				for (let amount of amounts) {
					cardsPack.push(new Card(shape, color, shade, amount));
					if (cardsPack.length == 81) {
					// if (cardsPack.length == 15) {
						return cardsPack;
					}
				}
			}
		}
	}
	return cardsPack;
}

function createStartGameCards(cardsPack) {
	let jsonCardsToSend = [];
	for (let i = 0; i < 12; i++){
		jsonCardsToSend = buildJsonCardsToSend('card' + i, 
			selectRandomCard(cardsPack), jsonCardsToSend);
	}
	return jsonCardsToSend;
}

function getCardsPack(socketId) {
	for (let game = 0; game < gamesData.length; game++) {
		for (let playerData = 1; playerData < gamesData[game].length; playerData++){
			if (gamesData[game][playerData].id === socketId) {
				return gamesData[game][0];			
			}
		}
	}
	return null;  // Couldn't find the socketId
}

function getScore(socketId) {
	for (let game = 0; game < gamesData.length; game++) {
		for (let playerData = 1; playerData < gamesData[game].length; playerData++){
			if (gamesData[game][playerData].id === socketId) {
				return gamesData[game][playerData].score;			
			}
		}
	}
	return null;  // Couldn't find the socketId
}

function increaseScore(socketId) {
	for (let game = 0; game < gamesData.length; game++) {
		for (let playerData = 1; playerData < gamesData[game].length; playerData++){
			if (gamesData[game][playerData].id === socketId) {
				gamesData[game][playerData].score++;
				return			
			}
		}
	}
}

function checkIfSet(setCards) {
	let set;
	let setCardsId = [];
	for (let i = 0; i < 3; i++){
		setCardsId.push(Object.keys(setCards[i])[0]);
	}
	for (let i in setCards[0][setCardsId[0]]){
		if ((setCards[0][setCardsId[0]][i] == setCards[1][setCardsId[1]][i] & setCards[0][setCardsId[0]][i] == setCards[2][setCardsId[2]][i])
			| (setCards[0][setCardsId[0]][i] != setCards[1][setCardsId[1]][i] & setCards[0][setCardsId[0]][i] != setCards[2][setCardsId[2]][i] 
				& setCards[1][setCardsId[1]][i] != setCards[2][setCardsId[2]][i])){
				set = true // Actually does nothing
		} else {
			set = false;
			break;
		}
	}
	return set;
}

function giveNewCards(setCards, cardsPack) {
	let jsonCardsToSend = [];
	for (let i = 0; i < 3; i++){
		jsonCardsToSend = buildJsonCardsToSend(Object.keys(setCards[i])[0], selectRandomCard(cardsPack), jsonCardsToSend);
	}
	console.log("Cards remain: " + cardsPack.length)
	return jsonCardsToSend;
}

function selectRandomCard(cardsPack) {
	let index = Math.floor(Math.random() * (cardsPack.length - 1));
	let randomCard = cardsPack[index];
	cardsPack.splice(index, 1);
	return randomCard;
}

function buildJsonCardsToSend(cardId, card, jsonCardsToSend) {
	if (jsonCardsToSend == undefined){
		return {[cardId] : {
			'shape': card.shape,
			'color': card.color,
			'shade': card.shade,
			'amount': card.amount
		}}
	}

	jsonCardsToSend.push( {[cardId] : {
		'shape': card.shape,
		'color': card.color,
		'shade': card.shade,
		'amount': card.amount
	}})
	return jsonCardsToSend;
}

function checkIfSetExist(boardCards, newCards) {
	if (newCards != undefined) {
		for (let card of newCards) {  // Replace the set cards with the new cards in the cards variable
    		boardCards[Object.keys(card)[0].replace('card', '')] = card;
    	}
	}
	
	for (let cardA = 0; cardA < boardCards.length; cardA++) {
		for (let cardB = cardA + 1; cardB < boardCards.length; cardB++) {
			for (let cardC = cardB + 1; cardC < boardCards.length; cardC++) {
				if(checkIfSet([boardCards[cardA], boardCards[cardB], boardCards[cardC]])) {
					console.log('Set cards: ' + cardA + ', ' + cardB + ', ' + cardC);
					return true
				}
			}
		}
	}
	console.log('NO SET!!!!!');
	return false
}