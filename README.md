# 📉 Github Agile Dashboard

![](demo.png)

## Installation

    npm install

## Usage

    npm start [organisation|user] [project] [username] [password|token]


To prevent your password to show in the bash history, you can use a GitHub generated [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)

E.g.: `npm start Elao symfony-standard Tom32i 46z5hm3vqyhxyjmagw7c89q7c5ac3yae92k7sug6`

### Commands

| Command | Description |
|---|---|
| __sprint__ | Show the state of the current sprint |
| __sprints__ | Show the state of all sprints |
| __backlog__ | Show the state of the backlog |
| __status__ | Show the status of the repository |
| __help__ | Show list of commands |
| __exit__ | Quit the dashboard |
