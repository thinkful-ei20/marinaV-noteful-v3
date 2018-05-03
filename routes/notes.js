'use strict';

const express = require('express');
const router = express.Router();
const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
  const { searchTerm } = req.query;

  console.log('********* searchTerm ******', searchTerm);

  let filter = {};

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  Note.find(filter)
    .sort({ 'updatedAt': 'desc' })
    .then(results => {
      console.log('******** find ALL notes results *****', results);
      res.json(results);
    })
    .catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  console.log('******** req.params.id *******', req.params.id);

  Note
    .findById(req.params.id)
    .then(note => res.json(note))
    .catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content } = req.body;

  const newNote = {
    title: title,
    content: content
  };

  if (!newNote.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  console.log('***************', newNote);

  Note
    .create(newNote)
    .then(note => res.status(201).json(note.toObject()))
    .catch(next);

});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

  const noteId = req.params.id;

  const { title, content } = req.body;

  const updatedNote = { title, content };

  if (!updatedNote.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  Note
    .findByIdAndUpdate(noteId, { $set: updatedNote })
    .then(note => res.status(204).end())
    .catch(next);
  });

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

  Note
    .findByIdAndRemove(req.params.id)
    .then(response => res.status(204).end())
    .catch(next);

});

module.exports = router;