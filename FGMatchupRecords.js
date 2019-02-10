//FGMatchupBot.js 
//Author: Edrees Wahezi 
/**
	FGMatchupBot stores matchup/win-loss records between users

	Enter records with the following commands/format: 

	!updatematchuprecords @user1 int_user1wins @user2 int_user2wins 

	will store/update records accordingly, and will add new users to the record.

	!viewuserrecord @user1  

	will display all records for that user

	!viewmatchuprecord @user1 @user2 

	will display record for the given matchup
	
	TODO: 
	.resetmatchuprecord @user1 @user2 (deletes all records associated with user)
	
	!nuke - delete the db

	more info: 
		- saves info into a file, stores as dict of arrays (?), database?
**/

const fs = require("fs"); 
const Discord = require('discord.js');
const client = new Discord.Client(); 
const {prefix, token} = require('./config.json');

let rawData = fs.readFileSync("matchupData.json"); 
let data = JSON.parse(rawData); 

client.once('ready', () => {
	client.user.setActivity("!commandlist for commands");
	console.log("***Running FGMatchupBot***");
});

client.on('message', (message) => {
	//console.log(message.content);
	if(!message.content.startsWith(prefix) || message.author.bot) { return; }

	const args = message.content.slice(prefix.length).split(/ +/); 
	const command = args.shift().toLowerCase(); 
	let user1ID = null; //manually parse mentions to ensure they come through in the correct order, since message.mentions orders them based on id
	let user2ID = null; 
	
	switch(command) {
		case "commandlist" :
		message.author.send("```********************\n\nFGMatchupBot stores matchup win/loss records between users\nEnter records with the following commands/format:\n\n!updatematchuprecord @user1 int_user1wins @user2 int_user2wins\nwill store/update records accordingly, and will add new users to the record.\n\n!viewuserrecord @user1  \nwill display all records for that user\n\n!viewmatchuprecord @user1 @user2 \nwill display record for the given matchup\n\n!resetmatchuprecord @user1 @user2 will reset the records for the given matchup to 0\n\n********************```");
		break; 
		case "updatematchuprecord" :
		 	//const taggedUsers = message.mentions.users.array();
		 	//console.log("ARRAY: " + taggedUsers.toString());
			//message.channel.send("User1: " + taggedUsers[0] + " User2: " + taggedUsers[1]);
		 	
		 	user1ID = getUserIDfromMention(args[0]); //manually parse mentions to ensure they come through in the correct order, since message.mentions orders them based on id
		 	user2ID = getUserIDfromMention(args[2]); 
		 	if(!user1ID || !user2ID || (user1ID === user2ID)) {
		 		return message.reply("```You need 2 user mentions for this command, in the format '@user1 wins @user2 wins'!```")
		 	}
			const user1Wins = parseInt(args[1]);
			const user2Wins = parseInt(args[3]); 

		    if (isNaN(user1Wins) || isNaN(user2Wins)) {
		        return message.reply("```That doesn't seem to be a valid number, bozo. \nthe argument format is '@user1 wins @user2 wins'!```");
		    }

		    //create/initialize user records if they don't exist 
		    scorekeeper.checkMatchupRecord(user1ID, user2ID, message.guild.id, data);

		    //will update and post results to channel 
		  	message.channel.send("```"+scorekeeper.updateMatchup(user1ID, user1Wins, user2ID, user2Wins, message.guild.id, data)+"```"); 

		    //save updates
		    fs.writeFileSync("matchupData.json", JSON.stringify(data, null, 4));

		break;
		
		case "viewuserrecord" : 
			user1ID = getUserIDfromMention(args[0]); 
			if(!user1ID) {
				return message.reply("```You need to mention the @user whose record you want!```"); 
			}
			let userRecords = scorekeeper.getSingleUserRecords(user1ID, message.guild.id, data);
			if(!userRecords) {
				return message.channel.send("```No user record exists for the given user. Add a user by entering a matchup result!```");
			}
			let matchupRecord = ""; 
			for (opponent in userRecords) {
				console.log(userRecords[opponent].wins + " wins and " + userRecords[opponent].losses + " losses against " + getUserFromID(opponent).username + "\n");
				matchupRecord += userRecords[opponent].wins + " wins and " + userRecords[opponent].losses + " losses against " + getUserFromID(opponent).username + "\n";  
			}

			message.channel.send("```"+matchupRecord+"```"); 
			break; 

		case "viewmatchuprecord" :
			user1ID = getUserIDfromMention(args[0]); 
			user2ID = getUserIDfromMention(args[1]); 

			if(!user1ID || !user2ID) {
				return message.reply("```You need to mention the two @users whose record you want!```"); 
			}
			let user1Records = scorekeeper.getSingleUserRecords(user1ID, message.guild.id, data);
			let user2Records = scorekeeper.getSingleUserRecords(user2ID, message.guild.id, data);
			if(!user1Records || !user2Records) {
				return message.channel.send("```No user record exists for the given user(s). Add a user by entering a matchup result!```");
			}
			message.channel.send("```"+scorekeeper.updateMatchup(user1ID, 0, user2ID, 0, message.guild.id, data)+"```"); 
			break; 

		case "resetmatchuprecord" : 
			user1ID = getUserIDfromMention(args[0]); //manually parse mentions to ensure they come through in the correct order, since message.mentions orders them based on id
		 	user2ID = getUserIDfromMention(args[1]); 
		 	if(!user1ID || !user2ID || (user1ID === user2ID)) {
		 		return message.reply("```You need 2 user mentions for this command, in the format '@user1 @user2'!```");
		 	}

		    if(!data[message.guild.id][user1ID] || !data[message.guild.id][user2ID]) {
		    	return message.reply("```At least one of your mentioned users doesn't exist in the matchup records! To add, enter a new matchup record using the update command.```");
		    }

		    //will update and post results to channel 
		  	message.channel.send("``` matchup reset: "+scorekeeper.resetMatchup(user1ID, user2ID, message.guild.id, data)+"```"); 

		    //save updates
		    fs.writeFileSync("matchupData.json", JSON.stringify(data, null, 4));
			break; 

			case "nuke" :
			//TODO
			break; 

			case "tellmeabout" : //hard coded entries for fun
				user1ID = getUserIDfromMention(args[0]); 
				if(!user1ID) {
					return message.reply("```You need to mention the @user whose info you want!```"); 
				}

				switch(user1ID) {
					case "179655134534565888" : //edzi
					return message.channel.send("```Edzi is the coolest most handsome guy here. His Alex consists of nothing but clean, solid play.```");
					break; 
					case "371405111102013440" : //paradise
					return message.channel.send("```Paradise is a scrub who doesn't understand the basic concepts behind neutral. Relies on braindead characters he can autopilot with.```");
					break;
					case "185515173375639552" : //joey
					return message.channel.send("```Joey is the only non degenerate Chun main in existence. Just barely though.```");
					break; 
					case "371708778774528003" : //producer
					return message.channel.send("```Producer is the most degenerate Chun main in existence. He's kinda okay though, knows more about the game than Paradise anyway.```"); 
					break; 
					case "139922160767598592" : //rocwell 
					return message.channel.send("```Rocwell plays Laura, therefore he's probably a perv who gets off on coin flips.```"); 
					break; 
					case "348119596626214934" : //kenjamin
					return message.channel.send("```Kenjamin is an old man that plays Ken like a child. Stop. Mashing. Tatsu.```"); 
					break; 
					default: 
					return message.channel.send("```Nothing to say about this user... Yet.```"); 
				}
				break; 
		/*
		//test/practice commands
		case "ping" :
			message.channel.send("Pong!"); 
			break;
		case "hi" : 
			message.channel.send("Hello!"); 
			break; 
		case "server" : 
			message.channel.send("Server name: " + message.guild.name + "\nTotal members: " + message.guild.memberCount); 
			break;
		case "user-info" :
			message.channel.send("User name: " + message.author.username + "\nYour ID: " + message.author.id)
			break; 

		case "testjson" : 
			//let rawdata = fs.readFileSync("matchupData.json"); 
			//let data = JSON.parse(rawdata); 
			console.log(data); 

			//change values 
			console.log("no data exists: " + data["serverID"]["user3"]);

			let newWinValue = 5; 
			if(args[0]) {
				newWinValue = parseInt(args[0])
			}

			data["serverID"]["user1"]["opponentuser1"]["wins"] = newWinValue; 

			console.log("NEW OBJ data: " + data["serverID"]["user1"]["opponentuser1"].toString());

			fs.writeFileSync("matchupData.json", JSON.stringify(data, null, 4)); 
			rawdata = fs.readFileSync("matchupData.json"); 
			data = JSON.parse(rawdata); 
			console.log("UPDATED FILE data: " + data["serverID"]["user1"]["opponentuser1"].toString());

			if(!data["serverID202"]) {
				data["serverID202"] = null; 
				fs.writeFileSync("matchupData.json", JSON.stringify(data, null, 4)); 
			}

			break; 
		*/

	}
});


//console.log("TOKEN: " + token.toString()); 

client.login(token)

function getUserIDfromMention(mention) {
	if (!mention) return;

  	  if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return mention
 	  }

    return;
}
function getUserFromID(idString) {
	return client.users.get(idString); 
}

function randomIntRange(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}

const scorekeeper = {

	checkMatchupRecord : function(user1, user2, serverID, jsonData) {
		//create user data if it doesn't exist in the json
		if(!jsonData[serverID]) {
			jsonData[serverID] = {}; 
			
		}
		let serverJSON = jsonData[serverID];
		
		//check user 1's data
		if(!serverJSON[user1]) {
			serverJSON[user1] = {};
		}
		let userJSON = serverJSON[user1];
		if(!userJSON[user2]) {
			userJSON[user2] = { "wins" : 0, "losses" : 0 }; 
		}

		//check user 2's data
		if(!serverJSON[user2]) {
			serverJSON[user2] = {};
		}
		let user2JSON = serverJSON[user2];
		if(!user2JSON[user1]) {
			user2JSON[user1] = { "wins" : 0, "losses" : 0 }; 
		}
	}, 

	updateMatchup : function(user1, user1wins, user2, user2wins, serverID, jsonData) {
		
		let user1v2 = jsonData[serverID][user1][user2];
		let user2v1 = jsonData[serverID][user2][user1]; 
		//update user 1
		user1v2.wins = user1v2.wins + user1wins; 
		user1v2.losses = user1v2.losses + user2wins; 
		//update user 2
		user2v1.wins = user2v1.wins + user2wins; 
		user2v1.losses = user2v1.losses + user1wins; 

		return getUserFromID(user1).username + " " + user1v2.wins + " " + getUserFromID(user2).username + " " + user2v1.wins; 
	},

	resetMatchup : function(user1, user2, serverID, jsonData) {
		let user1v2 = jsonData[serverID][user1][user2];
		let user2v1 = jsonData[serverID][user2][user1]; 
		//update user 1
		user1v2.wins = 0;
		user1v2.losses =0;
		//update user 2
		user2v1.wins = 0;
		user2v1.losses = 0;

		return getUserFromID(user1).username + " " + user1v2.wins + " " + getUserFromID(user2).username + " " + user2v1.wins; 
	},

	getSingleUserRecords : function(user1, serverID, jsonData) {
		//if no user record exists/undefined, return null. records are created when you enter a matchup result for the first time.
		if(!jsonData[serverID][user1]) {
			return null;  
		}

		//return object with list of opponents/matchups for user1
		return jsonData[serverID][user1]; 
	}
}