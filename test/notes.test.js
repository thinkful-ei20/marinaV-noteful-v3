'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);



// mongoose.connect(MONGODB_URI)
//   .then(() => mongoose.connection.db.dropDatabase())
//   .then(() => Note.insertMany(seedNotes))
//   .then(results => {
//     // console.log('***** results ********', results);
//     console.info(`Inserted ${results.length} Notes`);
//   })
//   .then(() => mongoose.disconnect())
//   .catch(err => {
//     console.error(err);
//   });





describe('Noteful API - Notes', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return Note.insertMany(seedNotes);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function() {

    it('should return the correct number of Notes', function () {
      return Promise.all([
        Note.count(),
        chai.request(app).get('/api/notes')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data);
        });
    });


    it('should return all notes', function() {
      let count;

      return Note.find()
        .then(result => {
          count = result.length;
          return chai.request(app).get('/api/notes');
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(count);
        });
    });

    it('should return a list with the correct right fields', function() {
      let res;

      return chai
        .request(app)
        .get('/api/notes')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          return Note.find();
        })
        .then(data => {
          expect(res.body).to.have.length(data.length);
          for (let i = 0; i < data.length; i++) {
            expect(res.body[i].id).to.equal(data[i].id);
            expect(res.body[i].title).to.equal(data[i].title);
          }
        });
    });

    it('should return correct search results for a valid query', function() {
      let res;

      return chai
        .request(app)
        .get('/api/notes?searchTerm=gaga')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
          return Note.find().where('title', 'like', '%gaga%');
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
        });
    });

    it('should return an empty array for an incorrect query', function() {
      let res;

      return chai
        .request(app)
        .get('/api/notes?searchTerm=Not%20a%20Valid%20Search')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          return Note.find({ title: /(not_a_valid_search)/ });
        })
        .then(result => {
          let count = result;
          expect(res.body).to.have.length(count);
        });
    });
  });

  describe('GET /api/notes/:id', function() {
    it('should return correct notes', function() {
      const id = '000000000000000000000000';
      let result;
      return Note.findById(id)
        .then(_result => {
          result = _result;
          return chai.request(app).get(`/api/notes/${id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys(
            'id',
            'title',
            'content',
            'createdAt',
            'updatedAt'
          );
          expect(res.body.id).to.equal(result.id);
          expect(res.body.title).to.equal(result.title);
        });
    });

    it('should respond with a 404 for an invalid id', function() {
      return chai
        .request(app)
        .get('/DOES/NOT/EXIST')
        .then(res => {
          expect(res).to.have.status(404);
          return Note.findById('222222222222223333333333');
        })
        .then(data => {
          expect(data).to.equal(null);
        });
    });
  });

  describe('POST /api/notes', function() {
    it('should create and return a new item when provided valid data', function() {
      const newItem = {
        title: 'The best article about cats ever!',
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      let res;
      // 1) First, call the API
      return (
        chai
          .request(app)
          .post('/api/notes')
          .send(newItem)
          .then(function(_res) {
            res = _res;
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.keys(
              'id',
              'title',
              'content',
              'createdAt',
              'updatedAt'
            );
            // 2) then call the database
            return Note.findById(res.body.id);
          })
          // 3) then compare the API response to the database results
          .then(data => {
            expect(res.body.title).to.equal(data.title);
            expect(res.body.content).to.equal(data.content);
          })
      );
    });

    it('should return an error when missing "title" field', function() {
      const newItem = {
        foo: 'bar'
      };

      return chai
        .request(app)
        .post('/api/notes')
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
          return Note.create(newItem).catch(err => {
            return err;
          });
        });
    });
  });

  describe('PUT /api/notes/:id', function() {
    it('should update the note', function() {
      let id = '000000000000000000000000';
      const updateItem = {
        title: 'What about dogs?!',
        content: 'woof woof'
      };
      let body;
      return chai
        .request(app)
        .put(`/api/notes/${id}`)
        .send(updateItem)
        .then(res => {
          body = res.body;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content');
          expect(res.body.id).to.equal(id);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
          return Note.findByIdAndUpdate(id, updateItem, { new: true });
        })
        .then(res => {
          expect(res.title).to.equal(body.title);
          expect(res.content).to.equal(body.content);
        });
    });

    it('should respond with a 404 for an invalid id', function() {
      const updateItem = {
        title: 'What about dogs?!',
        content: 'woof woof'
      };
      return chai
        .request(app)
        .put('/DOES/NOT/EXIST')
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404);
          return Note.findByIdAndUpdate(
            '123450000000000000012345',
            updateItem,
            {
              new: true
            }
          );
        })
        .then(count => {
          expect(count).to.equal(null);
        });
    });
  });

  describe('DELETE /api/notes/:id', function() {
    it('should delete an item by id', function() {
      return chai
        .request(app)
        .delete('/api/notes/000000000000000000000000')
        .then(res => {
          expect(res).to.have.status(204);
          return Note.findById('000000000000000000000000');
        })
        .then(result => {
          expect(result).to.eq(null);
        });
    });
  });
});
