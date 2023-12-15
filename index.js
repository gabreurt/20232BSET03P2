const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());


const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  // o id estava ficando undefined, para ajustar a lógica coloquei o id como PRIMARY KEY e AUTOINCREMENT   
  db.run("CREATE TABLE cats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, votes INT)");
  db.run("CREATE TABLE dogs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, votes INT)");
});

app.post('/cats', (req, res) => {
    const name = req.body.name;

    // Verificação se o usuário mando um campo chamado 'nome', garantindo que caso ele tente 
    // mandar qualquer outra coisa sem ser o nome, não será aceito nem lido pelo sistema.
    // resolvi não falar pro usuário que era o nome para não vazar detalhes da implementação

    if (!name) {
      return res.status(400).send("Chamada incorreta.");
    }
  
    // coloquei um placeholder onde inseria diretamente o nome na string SQL,
    // pois isso torna o código vulnerável a ataques de injeção de SQL. 
    // utilizando o placeholder eu passo o valor do nome como um parâmetro no array,
    // o que impede que o db leia uma possível injeção de SQL como SQL.
    db.run("INSERT INTO cats (name, votes) VALUES (?, 0)", [name], function (err) {
      if (err) {
        console.error(err);
        // aqui tenho um erro ao inserir no banco de dados, para o usuário vou mandar apenas erro interno    
        return res.status(500).send("Erro interno da aplicação");
      } else {
        res.status(201).json({ id: this.lastID, name, votes: 0 });
      }
    });
  });
  

app.post('/dogs', (req, res) => {
  // mesma lógica aplicada para cats
  const name = req.body.name;
    if (!name) {
      return res.status(400).send("Chamada incorreta.");
    }
  
    db.run("INSERT INTO dogs (name, votes) VALUES (?, 0)", [name], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro interno da aplicação");
      } else {
        res.status(201).json({ id: this.lastID, name, votes: 0 });
      }
    });
  });

app.post('/vote/:animalType/:id', (req, res) => {
    const { animalType, id } = req.params;

    // verifico se o animaltype é cats | dogs, que são as minhas duas tabelas
    // caso o usuário coloque qualquer coisa diferente ele dará o log de 
    // chamada incorreta.

    if (animalType !== 'cats' && animalType !== 'dogs') {
      return res.status(404).send("Chamada incorreta.");
  }

    const tableName = animalType;

    // lógica do placeholder implementada aqui também! 
    // note que o tablename foi verificado anteriormente, logo evitando qualquer
    // outro tipo de inserção sem ser cats ou dogs

    db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, row) => {
      if (err) {
        return res.status(500).send("Erro interno da aplicação");
      }
  
      if (!row) {
        return res.status(404).send("Chamada incorreta.");
      }

  
      // atualização do voto
      // lembre-se que o tablename foi verificado anteriormente

      db.run(`UPDATE ${tableName} SET votes = votes + 1 WHERE id = ?`, [id], (err) => {
        if (err) {
          return res.status(500).send("Erro interno da aplicação");
        }
        res.status(200).send("Voto computado");
      });
    });
  });
  
app.get('/cats', (req, res) => {
  db.all("SELECT * FROM cats", [], (err, rows) => {
    if (err) {
      res.status(500).send("Erro interno da aplicação");
    } else {
      res.json(rows);
    }
  });
});

app.get('/dogs', (req, res) => {
  db.all("SELECT * FROM dogs", [], (err, rows) => {
    if (err) {
      res.status(500).send("Erro interno da aplicação");
    } else {
      res.json(rows);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro!');
});

app.listen(port, () => {
  console.log(`Cats and Dogs Vote app listening at http://localhost:${port}`);
});