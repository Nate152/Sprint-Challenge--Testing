const mongoose = require('mongoose');
const chai = require('chai');
const chaiHTTP = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');

const Game = require('./models');
const server = require('./server');

chai.use(chaiHTTP);

describe('Games', () => {
  before(done => {
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost/test');
    const db = mongoose.connection;
    db.on('error', () => console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('we are connected');
      done();
    });
  });

  // declare some global variables for use of testing
  // hint - these wont be constants because you'll need to override them.

  let testGame = null;
  let gameId = null;

  // write a beforeEach hook that will populate your test DB with data
  // each time this hook runs, you should save a document to your db
  // by saving the document you'll be able to use it in each of your `it` blocks

  beforeEach(done => {
    const testerGame = new Game({
      title: 'Contra',
      genre: `Shoot 'em Up`,
      releaseDate: 'February, 1987',
    });
    testerGame
      .save()
      .then(game => {
        testGame = game;
        gameId = game._id;
        return done();
      })
      .catch(err => {
        console.error(err);
        return done();
      });
  });

  // simply remove the collections from your DB.

  afterEach(done => {
    Game.remove({}, err => {
      if (err) console.error(err);
      done();
    });
  });

  after(done => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
      console.log('we are disconnected');
    });
  });
  // test the POST here
  describe(`[POST] /api/game/create`, () => {
    it('should add a new game to the collection', done => {
      const testGame = {
        title: 'Contra',
        genre: `Shoot 'em Up`,
        releaseDate: 'February, 1987',
      };
      chai
        .request(server)
        .post('/api/game/create')
        .send(testGame)
        .end((err, res) => {
          console.log(res.body);
          expect(res.status).to.equal(200);
          expect(res.body.title).to.equal('Contra');
          done();
        });
    });
    it(`should send back '422: Invalid input data sent to Server' upon bad data`, () => {
      const testGame = {
        title: 'Contra',
        genre: `Shoot 'em Up`,
        releaseDate: 'February, 1987',
      };
      chai
        .request(server)
        .post('/api/game/create')
        .send(testGame)
        .end((err, res) => {
          if (err) {
            expect(err.status).to.equal(422);
            const { error } = err.response.body;
            expect(error).to.equal('Invalid input data sent to Server');
            done();
          }
        });
    });
  });
  // test the GET here
  describe(`[GET] /api/game/get`, () => {
    it('should get a list of all the games in the collection', done => {
      chai
        .request(server)
        .get('/api/game/get')
        .end((err, res) => {
          if (err) {
            throw new Error(err);
            done();
          }
          console.log(res.body[1]._id);
          console.log(gameId.toString());
          expect(res.body[0].title).to.equal(testGame.title);
          expect(res.body[1]._id).to.equal(gameId.toString());
          done();
        });
    });
  });
  // test the PUT here
  describe(`[PUT] /api/game/update`, () => {
    it('should update a game given an id and some text', done => {
      const gameUpdate = {
        id: gameId,
        title: 'Super Mario Brothers',
        releaseDate: 'September, 1985'
      };
      chai
      .request(server)
      .put('/api/game/update')
      .send(gameUpdate)
      .end((err, res) => {
        if (err) {
          throw new Error(err);
          done();
        }
        expect(res.body.title).to.equal(gameUpdate.title);
        expect(res.body.releaseDate).to.equal(gameUpdate.releaseDate);
        done();
      });
    });
  });
  // --- Stretch Problem ---
  // Test the DELETE here
  describe(`[DELETE] /api/game/destroy/:id`, () => {
    it('should delete a game with the provided id from the collection', done =>{
      chai
      .request(server)
      .delete(`/api/game/destroy/${gameId}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
          return done();
        }
        expect(res.status).to.equal(200);
        expect(res.text).to.equal('success');
        Game.findById(gameId, (err, deletedGame) => {
          if (err) {
            console.error(err);
            return done();
          }
          expect(deletedGame).to.equal(null);
          done();
        });
      });
    });
  });
});
