# Project Description
This Discord bot can be used to keep a record of matchups/games (wins/losses) played between users in a server. It can also display those matchups when requested. 

# Setup
To use, must add your discord token to the config file, then follow discord's steps for adding a bot to your server. Must leave the main FGMatchupRecords.js file running to have the bot appear online in the discord server. 

# How it Works
Stores user record as a JSON file

Enter records with the following commands/format:

```	!updatematchuprecords @user1 int_user1wins @user2 int_user2wins ```
Will store/update records accordingly, and will add new users to the record.

```	!viewuserrecord @user1  ```
Will display all records for that user

``` !viewmatchuprecord @user1 @user2 ```
Will display record for the given matchup

``` !resetmatchuprecord @user1 @user2 ```
Deletes all records associated with user

# Technologies Used
Written in javascript and using Discord APIs
