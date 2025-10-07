# Game Studio API

A Node.js/Express backend for managing players, games, and scores in a game studio. Fully CRUD-ready with PostgreSQL database integration. ESLint is configured for consistent code style.

---

## **Features**
- Add, update, delete, and list players, games, and scores
- Fully validated inputs using [Zod]

---

## **Tech Stack**
- Node.js  
- Express.js  
- PostgreSQL  
- Zod for validation  
- Insomnia testing

---

### validated inputs using [Zod]
<img width="824" height="386" alt="Zod-test-player" src="https://github.com/user-attachments/assets/780bc4dd-43e9-4043-a3b7-ae123ac889aa" />

---
### Players
- Add player
  
<img width="822" height="367" alt="add-player" src="https://github.com/user-attachments/assets/ca15ac80-a77a-46c4-9607-3ddef8a4e5b9" />

- PgAdmin (Add player)
<img width="803" height="867" alt="add-player-db" src="https://github.com/user-attachments/assets/1e0a8696-fcb6-4911-84d5-7df56432c61d" />

- Update player
<img width="392" height="352" alt="Update-player" src="https://github.com/user-attachments/assets/09f87206-51a4-4c54-b131-19ffcfbf070d" />

- Delete player

<img width="824" height="269" alt="Delete-Player" src="https://github.com/user-attachments/assets/e1adac12-24be-4ca2-8fc5-4ec403c0b7cd" />


---

### Games
- PgAdmin (Add game)
  <img width="817" height="864" alt="add-game" src="https://github.com/user-attachments/assets/df74e979-c5ca-4fa2-b74b-b81f7e911ec7" />

- Update game
  <img width="827" height="289" alt="Update-Game" src="https://github.com/user-attachments/assets/d9c42191-3625-4d10-b796-af0c2ba06ebb" />

- PgAmin (Update game)
  <img width="451" height="382" alt="Update-game-db" src="https://github.com/user-attachments/assets/a728acbb-fe2c-4e3b-8f28-ec1145561920" />

---

### Scores
- Add score
  
<img width="826" height="324" alt="add-scores" src="https://github.com/user-attachments/assets/cdcc0b94-19d2-4d11-8bf6-abf46d6173c9" />

- Update score
<img width="819" height="295" alt="Update-score" src="https://github.com/user-attachments/assets/509480b5-1081-488f-9dfe-cf333d2b41a3" />
  
- PgAdmin (Update score)
 <img width="514" height="401" alt="Update-score-db" src="https://github.com/user-attachments/assets/31ad5219-1b56-4d7f-a4ef-ac40012c07c5" />

---

## Database
<pre>
-- Players
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    join_date DATE NOT NULL
);

-- Games
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    genre VARCHAR(50) NOT NULL
);

-- Scores
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    date_played DATE NOT NULL
);
</pre>
